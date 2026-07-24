import type { TrainingPhase } from '../types/training';

export type MuscleStage = TrainingPhase;

export type VoiceMode =
  | 'off'
  | 'sound-only'
  | 'concise'
  | 'guided'
  | 'countdown';

export type VoiceLanguage = 'zh-CN' | 'en-US';

/**
 * Coach-oriented cues. These describe user intent rather than engine phases.
 * The training engine may still use contract/hold internally, while the voice
 * layer treats them as one continuous contraction experience.
 */
export type SoundCue =
  | 'ready'
  | 'contraction-start'
  | 'contraction-sustain'
  | 'release-start'
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
  countdownFrom: 0 | 3 | 5;
  announceRound: boolean;
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
