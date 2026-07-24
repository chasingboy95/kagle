import type {
  VoicePayload,
  VoicePlayback as OrchestratorPlayback,
} from '../voiceOrchestrator';
import type { SupportedVoiceLanguage } from './voiceAudioMap';
import { createVoiceAudioMap } from './voiceAudioMap';
import { AudioPlayback } from './audioPlayback';
import { SpeechPlayback } from './speechPlayback';

class CoachPlaybackAdapter implements OrchestratorPlayback {
  private readonly recorded: AudioPlayback;
  private readonly speech = new SpeechPlayback();

  constructor(language: SupportedVoiceLanguage, baseUrl: string) {
    this.recorded = new AudioPlayback(createVoiceAudioMap(language, baseUrl));
  }

  async speak(payload: VoicePayload): Promise<void> {
    if (payload.cue) {
      try {
        await this.recorded.speak(payload.cue);
        return;
      } catch {
        // Missing, blocked, or undecodable recordings fall back to TTS text.
      }
    }

    await this.speech.speak(payload.text);
  }

  stop(): void {
    this.recorded.stop();
    this.speech.stop();
  }
}

export function createCoachPlayback(
  language: SupportedVoiceLanguage,
  baseUrl: string = import.meta.env.BASE_URL,
): OrchestratorPlayback {
  return new CoachPlaybackAdapter(language, baseUrl);
}
