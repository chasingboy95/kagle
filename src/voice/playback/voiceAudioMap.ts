import type { CoachVoiceEvent } from '../voiceEvents';

export type SupportedVoiceLanguage = 'zh-CN' | 'en-US';

const FILE_BY_EVENT: Record<CoachVoiceEvent, string> = {
  'training-ready': 'ready.mp3',
  'contraction-start': 'contraction-start.mp3',
  'contraction-sustain': 'contraction-sustain.mp3',
  'release-start': 'release-start.mp3',
  'training-complete': 'complete.mp3',
  paused: 'paused.mp3',
  resumed: 'resumed.mp3',
};

export function createVoiceAudioMap(
  language: SupportedVoiceLanguage,
  baseUrl: string = import.meta.env.BASE_URL,
): Record<CoachVoiceEvent, string> {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return Object.fromEntries(
    Object.entries(FILE_BY_EVENT).map(([event, filename]) => [
      event,
      `${normalizedBase}audio/${language}/${filename}`,
    ]),
  ) as Record<CoachVoiceEvent, string>;
}
