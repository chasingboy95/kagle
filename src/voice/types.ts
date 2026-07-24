import type { TrainingPhase } from '../types/training';

export type MuscleStage = TrainingPhase;

/**
 * User-facing assistance modes.
 * - off: no audible guidance
 * - sound-only: non-verbal rhythm cues
 * - coach: recorded coach prompts with speech fallback
 */
export type VoiceMode = 'off' | 'sound-only' | 'coach';

export type VoiceLanguage = 'zh-CN' | 'en-US';

/** Coach-oriented non-verbal cues used by the rhythm assistant. */
export type SoundCue =
  | 'ready'
  | 'contraction-start'
  | 'contraction-sustain'
  | 'release-start'
  | 'countdown-5'
  | 'countdown-4'
  | 'countdown-3'
  | 'countdown-2'
  | 'countdown-1'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'stop';

export interface VoiceSettings {
  enabled: boolean;
  mode: VoiceMode;
  language: VoiceLanguage;
  volume: number;
  rate: number;
  pitch: number;
  voiceName?: string;
  /** Independent enhancement; available in sound-only and coach modes. */
  countdownFrom: 0 | 3 | 5;
  announceRound: boolean;
  /** Retained for stored-settings compatibility; no longer exposed in UI. */
  announceNextStage: boolean;
  hapticsEnabled: boolean;
}

export type VoiceEvent =
  | { type: 'training-ready' }
  | { type: 'stage-enter'; stage: MuscleStage }
  | { type: 'countdown'; stage: MuscleStage; seconds: number }
  | { type: 'round-start'; round: number; totalRounds: number }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'completed' }
  | { type: 'stopped' };

export interface SpeakOptions {
  text: string;
  language: VoiceLanguage;
  volume: number;
  rate: number;
  pitch: number;
  voiceName?: string;
}

export interface VoicePlaybackAdapter {
  preload(): Promise<void>;
  speak(options: SpeakOptions): Promise<void>;
  playCue(cue: SoundCue): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSupported(): boolean;
}

export interface RecordedVoicePlaybackAdapter {
  preload(urls: readonly string[]): Promise<void>;
  play(url: string, volume: number): Promise<boolean>;
  stop(): void;
  isSupported(): boolean;
}

export interface VoiceQueueItem {
  id: string;
  event: VoiceEvent;
  priority: number;
  createdAt: number;
  expiresAt: number;
}
