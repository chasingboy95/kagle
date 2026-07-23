 # ADR-003: Web Speech API for MVP Voice Assistance

 ## Status

 Accepted

 ## Context

 The application requires voice guidance for pelvic floor training. Options included Web Speech API (built into browsers), pre-recorded audio files, cloud TTS, and remote audio streaming.

 The product must: work offline, require no microphone permission, not upload training data, and be usable immediately without setup.

 ## Decision

 Use the Web Speech API (`SpeechSynthesis`) for MVP voice output. Supplement with Web Audio API tones for `sound-only` mode and `navigator.vibrate` for haptic feedback.

 - No microphone, voice recognition, or audio upload.
 - No remote TTS or streaming audio.
 - The `SpeechSynthesisAdapter` and `AudioFileAdapter` expose a common `VoicePlaybackAdapter` interface, allowing future replacement of speech with pre-recorded audio without changing the `VoiceController` or training engine.

 ## Alternatives Considered

 1. **Pre-recorded audio files** – better voice quality and consistent timing, but increases asset size and requires downloading. Planned as a future upgrade path.
 2. **Cloud TTS (e.g., OpenAI, ElevenLabs)** – higher quality, but requires internet, introduces latency, and conflicts with the no-data-upload principle.

 ## Consequences

 Positive:
 - Zero setup, no API keys, no network requests.
 - Works offline.
 - Adapter pattern isolates the voice engine from playback technology.

 Negative:
 - Voice quality varies significantly across browsers and OS versions.
 - `SpeechSynthesis.pause()` / `resume()` behavior is inconsistent; the application stops current speech on pause and plays a resume prompt instead of mid-sentence resume.
 - Voice list (`getVoices()`) loads asynchronously; voice selection may fall back to default on first call.
 - iOS Safari requires user gesture before first `speak()` – handled via `voice.unlock()` on start/preview button press.

 ## Follow-up

 Enable pre-recorded audio files as an alternative adapter. The `AudioFileAdapter` is already named for this purpose but currently synthesizes tones via Web Audio API rather than loading files.
