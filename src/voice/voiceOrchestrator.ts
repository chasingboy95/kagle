import { VoiceQueue, type VoicePriority } from './voiceQueue';

export interface VoicePayload {
  text: string;
  cue?: string;
}

export interface VoicePlayback {
  speak(payload: VoicePayload): Promise<void>;
  stop(): void;
}

export interface QueueVoiceOptions {
  priority?: VoicePriority;
  interrupt?: boolean;
  ttlMs?: number;
}

export class VoiceOrchestrator {
  private queue = new VoiceQueue<VoicePayload>();
  private playing = false;

  constructor(private readonly playback: VoicePlayback) {}

  enqueue(payload: VoicePayload, options: QueueVoiceOptions = {}) {
    if (options.interrupt) {
      this.playback.stop();
      this.queue.clear();
    }

    this.queue.enqueue({
      id: crypto.randomUUID(),
      event: payload,
      priority: options.priority ?? 'normal',
      interrupt: options.interrupt ?? false,
      createdAt: Date.now(),
      expiresAt: options.ttlMs ? Date.now() + options.ttlMs : undefined,
    });

    void this.drain();
  }

  stop() {
    this.queue.clear();
    this.playback.stop();
  }

  private async drain() {
    if (this.playing) return;

    const item = this.queue.dequeue();
    if (!item) return;

    this.playing = true;
    try {
      await this.playback.speak(item.event);
    } finally {
      this.playing = false;
      void this.drain();
    }
  }
}
