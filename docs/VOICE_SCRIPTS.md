 # Voice Scripts

 **Last verified against repository:** 2026-07-23

 ## Script Source

 All scripts are defined in `src/voice/voiceScripts.ts`. The file exports two resolver functions:
 - `resolveSpeech(event, settings)` → returns the text string to speak or `null`.
 - `resolveCue(event)` → returns the `SoundCue` identifier for tone-only mode.

 ## Approved Scripts

 ### Concise Mode (zh-CN)

 | Event | Script |
 |-------|--------|
 | `training-ready` | "准备开始" |
 | `stage-enter: contract` | "收紧" |
 | `stage-enter: hold` | "保持" |
 | `stage-enter: relax` | "放松" |
 | `paused` | "训练已暂停" |
 | `resumed` | "继续训练" |
 | `completed` | "训练完成" |
 | `stopped` | "训练已结束" |
 | `round-start` | "第 N 组，共 M 组" (when announceRound = true) |
 | `countdown` | "N" (just the number) |

 ### Concise Mode (en-US)

 | Event | Script |
 |-------|--------|
 | `training-ready` | "Ready to begin" |
 | `stage-enter: contract` | "Contract" |
 | `stage-enter: hold` | "Hold" |
 | `stage-enter: relax` | "Relax" |
 | `paused` | "Training paused" |
 | `resumed` | "Continue training" |
 | `completed` | "Training complete" |
 | `stopped` | "Training ended" |
 | `round-start` | "Round N of M" (when announceRound = true) |
 | `countdown` | "N" |

 **Status: Defined in code but language selector not exposed in current Settings UI.** The setting model includes `language: VoiceLanguage` but `VoiceSettingsPanel` does not have a language picker.

 ### Guided Mode (zh-CN)

 | Event | Script |
 |-------|--------|
 | `training-ready` | "调整呼吸，准备开始" |
 | `stage-enter: contract` | "轻轻收紧盆底肌，并向上提" |
 | `stage-enter: hold` | "保持张力，继续自然呼吸" |
 | `stage-enter: relax` | "缓慢释放，让肌肉完全放松" |
 | `paused` | "训练已暂停" |
 | `resumed` | "继续训练" |
 | `completed` | "训练完成，保持自然呼吸，让肌肉完全放松" |
 | `stopped` | "训练已结束" |

 ### Guided Mode (en-US)

 | Event | Script |
 |-------|--------|
 | `training-ready` | "Settle your breathing and prepare to begin" |
 | `stage-enter: contract` | "Gently contract the pelvic floor and lift" |
 | `stage-enter: hold` | "Maintain the tension and breathe naturally" |
 | `stage-enter: relax` | "Release slowly and let the muscles fully relax" |
 | `paused` | "Training paused" |
 | `resumed` | "Continue training" |
 | `completed` | "Training complete. Breathe naturally and let the muscles fully relax" |
 | `stopped` | "Training ended" |

 ### Countdown Mode

 Uses guided mode scripts plus countdown numbers.

 ### announceNextStage (when enabled)

 If `announceNextStage = true`, the next stage name is appended to the current stage script:

 - zh-CN: `"{当前}，接下来{下一}"` (e.g., "轻轻收紧盆底肌，并向上提，接下来保持")
 - en-US: `"{current}. Next, {next}"` (e.g., "Gently contract the pelvic floor and lift. Next, hold")

 **Status**: Implemented, defaults to `false`.

 ### Sound Cues

 | Event | Cue | Tone Frequency | Duration |
 |-------|-----|----------------|----------|
 | `training-ready` | `ready` | 440 Hz | 90ms |
 | `stage-enter: contract` | `contract` | 520 Hz | 80ms |
 | `stage-enter: hold` | `hold` | 460 Hz | 70ms |
 | `stage-enter: relax` | `relax` | 360 Hz | 100ms |
 | `paused` | `pause` | 320 Hz | 80ms |
 | `resumed` | `resume` | 430 Hz | 80ms |
 | `completed` | `complete` | 560 Hz | 120ms |
 | `stopped` | `stop` | 300 Hz | 80ms |

 ## Script Design Notes

 - All scripts avoid diagnostic, treatment, or rehabilitation claims (e.g., no "增强盆底肌力量" or "预防尿失禁").
 - The guided contract script emphasizes "轻轻" (gently) to prevent over-tensing.
 - The completed script includes a release instruction ("让肌肉完全放松") to prevent post-workout tension.
 - Tone frequencies are in the 300–560 Hz range (low to mid-range, non-startling).
 - Tone durations are short (70–120ms) and use exponential gain ramp to avoid clicks.
 - No cheering or motivational language ("做得很好", "加油") — consistent with the medical-health tone.

 ## Unimplemented Languages

 All unimplemented languages are planned but not scheduled:

 - Japanese (ja-JP) — not defined
 - Korean (ko-KR) — not defined
 - Spanish (es-ES) — not defined
 - French (fr-FR) — not defined
 - German (de-DE) — not defined

 The validation function falls back to 'zh-CN' for unrecognized languages.

 ## Important Note

 This document describes the voice scripts used for **audio guidance during training**. These are not medical instructions. Users should follow the guidance of their healthcare provider for proper Kegel exercise technique. The application is a training timer, not a medical device.
