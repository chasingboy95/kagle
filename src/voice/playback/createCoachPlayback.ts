import type { SupportedVoiceLanguage } from './voiceAudioMap';
import { createVoiceAudioMap } from './voiceAudioMap';
import { AudioPlayback } from './audioPlayback';
import { FallbackPlayback } from './fallbackPlayback';
import { SpeechPlayback } from './speechPlayback';
import type { VoicePlayback } from './voicePlayback';

export function createCoachPlayback(
  language: SupportedVoiceLanguage,
  baseUrl: string = import.meta.env.BASE_URL,
): VoicePlayback {
  const recorded = new AudioPlayback(createVoiceAudioMap(language, baseUrl));
  const speech = new SpeechPlayback();

  return new FallbackPlayback(recorded, speech);
}
