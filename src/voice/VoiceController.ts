import { HapticAdapter } from './HapticAdapter';
import { allVoiceAssetUrls, resolveVoiceAsset } from './voiceAssets';
import { resolveCue, resolveSpeech } from './voiceScripts';
import type {
  RecordedVoicePlaybackAdapter,
  SoundCue,
  VoiceEvent,
  VoicePlaybackAdapter,
  VoiceQueueItem,
  VoiceSettings,
} from './types';

export interface VoiceEventContext {
  sessionId: number;
  round: number;
  now: number;
  stageEndsAt: number;
  sequence?: number;
}

const priorities: Record<VoiceEvent['type'], number> = {
  paused: 500,
  stopped: 500,
  'stage-enter': 400,
  'training-ready': 300,
  completed: 300,
  'round-start': 300,
  resumed: 300,
  countdown: 200,
};

function eventId(event: VoiceEvent, context: VoiceEventContext): string {
  const prefix = `session-${context.sessionId}:round-${context.round}`;
  if (event.type === 'stage-enter') return `${prefix}:stage-enter:${event.stage}`;
  if (event.type === 'countdown') return `${prefix}:${event.stage}:countdown:${event.seconds}`;
  if (event.type === 'round-start') return `${prefix}:round-start:${event.round}`;
  return `${prefix}:${event.type}:${context.sequence ?? 0}`;
}

function countdownCue(seconds: number): SoundCue | null {
  return seconds >= 1 && seconds <= 5
    ? `countdown-${seconds}` as SoundCue
    : null;
}

export class VoiceController {
  private queue: VoiceQueueItem[] = [];
  private readonly seen = new Set<string>();
  private processing?: Promise<void>;
  private playbackGeneration = 0;
  private sustainTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly speech: VoicePlaybackAdapter,
    private readonly audio: VoicePlaybackAdapter,
    private readonly recorded: RecordedVoicePlaybackAdapter,
    private readonly haptics: HapticAdapter,
    private settings: VoiceSettings,
    private readonly baseUrl = import.meta.env.BASE_URL,
  ) {}

  enqueue(event: VoiceEvent, context: VoiceEventContext): void {
    if (event.type === 'stage-enter') {
      this.stopPlayback();
      this.removeStageItems();
      this.clearSustainTimer();
    } else if (event.type === 'paused' || event.type === 'stopped') {
      this.stopPlayback();
      this.queue = [];
      this.clearSustainTimer();
    }

    if (!this.settings.enabled || this.settings.mode === 'off') return;
    if (event.type === 'countdown' && this.settings.countdownFrom === 0) return;

    if (event.type === 'stage-enter' && event.stage === 'hold') {
      const phaseDuration = Math.max(0, context.stageEndsAt - context.now);
      const delay = Math.min(3_000, Math.max(500, phaseDuration * 0.35));
      this.sustainTimer = setTimeout(() => {
        this.sustainTimer = undefined;
        if (!this.settings.enabled || this.settings.mode === 'off') return;
        this.addQueueItem(event, { ...context, now: Date.now() });
        void this.flush();
      }, delay);
      return;
    }

    this.addQueueItem(event, context);
  }

  private addQueueItem(event: VoiceEvent, context: VoiceEventContext): void {
    const id = eventId(event, context);
    if (this.seen.has(id)) return;
    this.seen.add(id);

    this.queue.push({
      id,
      event,
      priority: priorities[event.type],
      createdAt: context.now,
      expiresAt: event.type === 'countdown'
        ? context.stageEndsAt
        : context.now + 30_000,
    });
    this.queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  }

  flush(now?: number): Promise<void> {
    if (this.processing) return this.processing;

    this.processing = this.drain(now).finally(() => {
      this.processing = undefined;
    });
    return this.processing;
  }

  private async drain(fixedNow?: number): Promise<void> {
    this.queue = this.queue.filter(item => item.expiresAt >= (fixedNow ?? Date.now()));
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item || item.expiresAt < (fixedNow ?? Date.now())) continue;

      this.haptics.trigger(item.event, this.settings.hapticsEnabled);

      if (item.event.type === 'countdown') {
        const cue = countdownCue(item.event.seconds);
        if (cue) await this.audio.playCue(cue);
        continue;
      }

      if (this.settings.mode === 'sound-only') {
        const cue = resolveCue(item.event);
        if (cue) await this.audio.playCue(cue);
        continue;
      }

      const playbackGeneration = this.playbackGeneration;
      const assetUrl = resolveVoiceAsset(item.event, this.settings, this.baseUrl);
      let recordedPlayed = false;
      if (assetUrl) {
        recordedPlayed = await this.recorded
          .play(assetUrl, this.settings.volume)
          .catch(() => false);
      }

      if (recordedPlayed || playbackGeneration !== this.playbackGeneration) continue;

      const text = resolveSpeech(item.event, this.settings);
      if (text) {
        try {
          await this.speech.speak({
            text,
            language: this.settings.language,
            volume: this.settings.volume,
            rate: this.settings.rate,
            pitch: this.settings.pitch,
            voiceName: this.settings.voiceName,
          });
          continue;
        } catch {
          // Fall through to a non-verbal cue.
        }
      }

      const cue = resolveCue(item.event);
      if (cue) await this.audio.playCue(cue);
    }
  }

  updateSettings(settings: VoiceSettings): void {
    this.settings = settings;
    if (!settings.enabled || settings.mode === 'off') this.stop();
  }

  inspectQueue(): readonly VoiceQueueItem[] {
    return this.queue;
  }

  async preload(): Promise<void> {
    await Promise.all([
      this.speech.preload(),
      this.audio.preload(),
      this.recorded.preload(allVoiceAssetUrls(this.baseUrl)),
    ]);
  }

  stop(): void {
    this.stopPlayback();
    this.queue = [];
    this.clearSustainTimer();
  }

  isSupported(): boolean {
    return this.recorded.isSupported() || this.speech.isSupported() || this.audio.isSupported();
  }

  private removeStageItems(): void {
    this.queue = this.queue.filter(item => (
      item.event.type !== 'countdown' && item.event.type !== 'stage-enter'
    ));
  }

  private clearSustainTimer(): void {
    if (this.sustainTimer) {
      clearTimeout(this.sustainTimer);
      this.sustainTimer = undefined;
    }
  }

  private stopPlayback(): void {
    this.playbackGeneration += 1;
    this.speech.stop();
    this.audio.stop();
    this.recorded.stop();
  }
}
