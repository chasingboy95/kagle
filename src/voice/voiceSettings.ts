import type { VoiceLanguage, VoiceMode, VoiceSettings } from './types';

export const VOICE_SETTINGS_KEY = 'kegel.voice-settings.v1';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  mode: 'concise',
  language: 'zh-CN',
  volume: 0.7,
  rate: 0.95,
  pitch: 1,
  countdownFrom: 3,
  announceRound: true,
  announceNextStage: false,
  hapticsEnabled: true,
};

const voiceModes: VoiceMode[] = [
  'off',
  'sound-only',
  'concise',
  'guided',
  'countdown',
];
const voiceLanguages: VoiceLanguage[] = ['zh-CN', 'en-US'];

function validNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= min
    && value <= max
    ? value
    : fallback;
}

function validBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function validateVoiceSettings(value: unknown): VoiceSettings {
  const input = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};

  return {
    enabled: validBoolean(input.enabled, DEFAULT_VOICE_SETTINGS.enabled),
    mode: voiceModes.includes(input.mode as VoiceMode)
      ? input.mode as VoiceMode
      : DEFAULT_VOICE_SETTINGS.mode,
    language: voiceLanguages.includes(input.language as VoiceLanguage)
      ? input.language as VoiceLanguage
      : DEFAULT_VOICE_SETTINGS.language,
    volume: validNumber(input.volume, 0, 1, DEFAULT_VOICE_SETTINGS.volume),
    rate: validNumber(input.rate, 0.5, 2, DEFAULT_VOICE_SETTINGS.rate),
    pitch: validNumber(input.pitch, 0, 2, DEFAULT_VOICE_SETTINGS.pitch),
    ...(typeof input.voiceName === 'string' && input.voiceName.trim()
      ? { voiceName: input.voiceName }
      : {}),
    countdownFrom: input.countdownFrom === 0
      || input.countdownFrom === 3
      || input.countdownFrom === 5
      ? input.countdownFrom
      : DEFAULT_VOICE_SETTINGS.countdownFrom,
    announceRound: validBoolean(input.announceRound, DEFAULT_VOICE_SETTINGS.announceRound),
    announceNextStage: validBoolean(
      input.announceNextStage,
      DEFAULT_VOICE_SETTINGS.announceNextStage,
    ),
    hapticsEnabled: validBoolean(input.hapticsEnabled, DEFAULT_VOICE_SETTINGS.hapticsEnabled),
  };
}

export function parseVoiceSettings(raw: string | null): VoiceSettings {
  if (!raw) return { ...DEFAULT_VOICE_SETTINGS };

  try {
    return validateVoiceSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_VOICE_SETTINGS };
  }
}

export function loadVoiceSettings(
  storage?: Pick<Storage, 'getItem'>,
): VoiceSettings {
  try {
    const target = storage ?? globalThis.localStorage;
    return parseVoiceSettings(target?.getItem(VOICE_SETTINGS_KEY) ?? null);
  } catch {
    return { ...DEFAULT_VOICE_SETTINGS };
  }
}

export function saveVoiceSettings(
  settings: VoiceSettings,
  storage?: Pick<Storage, 'setItem'>,
): void {
  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(VOICE_SETTINGS_KEY, JSON.stringify(validateVoiceSettings(settings)));
  } catch {
    // localStorage may be blocked or full.
  }
}
