 # Test Plan

 **Last verified against repository:** 2026-07-23

 ## Existing Tests (4 files, 11 tests — all passing)

 ### Unit: getCountdownEvent (`src/hooks/useKegelEngine.test.ts`)

 | Test | Status |
 |------|--------|
 | Emits only unannounced positive seconds inside the threshold | Passing |

 ### Integration: VoiceController (`src/voice/VoiceController.test.ts`)

 | Test | Status |
 |------|--------|
 | Deduplicates the same countdown second | Passing |
 | Drops expired items before playback | Passing |
 | Pause stops playback and clears pending countdowns | Passing |
 | Stop stops playback and clears the queue | Passing |
 | Replaces a pending stage prompt when the stage changes | Passing |
 | Rechecks expiry after a longer prompt finishes | Passing |

 ### Unit: SpeechSynthesisAdapter (`src/voice/SpeechSynthesisAdapter.test.ts`)

 | Test | Status |
 |------|--------|
 | Fails safely when speech synthesis is unavailable | Passing |

 ### Unit: voiceSettings (`src/voice/voiceSettings.test.ts`)

 | Test | Status |
 |------|--------|
 | Returns the required defaults for invalid storage | Passing |
 | Keeps valid fields and falls back invalid fields independently | Passing |
 | Falls back when access to global localStorage throws | Passing |

 ## Planned Tests

 ### Training Engine Unit Tests

 | Test | Priority | Status |
 |------|----------|--------|
 | `start()` transitions from idle to running | High | Planned |
 | `pause()` transitions from running to paused | High | Planned |
 | `resume()` preserves phase remaining time | High | Planned |
 | `stop()` resets to idle | High | Planned |
 | `restart()` starts a new session from finished | Medium | Planned |
 | Phase progression: contract → hold → relax → next round | High | Planned |
 | Training finishes after last round | High | Planned |
 | Countdown events: last 3 seconds only | Medium | Planned |
 | Countdown events: no repeat for same second | Medium | Planned |
 | Multiple pause/resume cycles don't drift | High | Planned |
 | Config update during idle updates the engine | Low | Planned |
 | Config update during running is ignored | Low | Planned |
 | Phase timing compensates for pause duration | High | Planned |
 | `getCountdownEvent` returns null for idle stage | Medium | Planned |
 | Session ID increments on each start | Low | Planned |
 | Event sequence increments | Low | Planned |

 ### Voice Controller Unit Tests

 | Test | Priority | Status |
 |------|----------|--------|
 | `resolved` event plays when audio context locked | Medium | Planned |
 | Multiple rapid `enqueue` calls don't cause race | Medium | Planned |
 | Settings update during playback switches mode mid-queue | Low | Planned |
 | `off` mode drops all events | Medium | Planned |
 | `sound-only` mode plays cues without speech | Medium | Planned |
 | `concise` vs `guided` scripts differ as expected | Medium | Planned |

 ### MuscleSphere Tests

 | Test | Priority | Status |
 |------|----------|--------|
 | Renders all 9 layers without crashing | High | Manual only |
 | Progress ring visible when showProgressRing=true | Medium | Manual only |
 | Progress ring hidden when showProgressRing=false | Medium | Manual only |
 | Paused state renders stable pose | Low | Manual only |
 | Reduced motion removes hold tremor | Low | Manual only |
 | SVG assets load without 404 | High | Manual only |
 | Container animation matches stage | Low | Manual only |

 ### Integration Tests

 | Test | Priority | Status |
 |------|----------|--------|
 | Full workout with default config completes | High | Manual only |
 | Pause/resume mid-phase | High | Manual only |
 | Stop mid-workout returns to idle | High | Manual only |
 | Voice plays stage announcements correctly | High | Manual only |
 | Voice countdown matches displayed timer | Medium | Manual only |
 | Config changes affect workout duration | Medium | Manual only |
 | VoiceSettingsPanel toggle affects voice output | Medium | Manual only |
 | Preview button plays sample voice | Medium | Manual only |
 | TrainingStatus shows correct round info | Low | Manual only |

 ### Manual Acceptance Tests

 | Test | Browser | Status |
 |------|---------|--------|
 | Start training → muscle animates → voice plays → timer counts down | Chrome, Safari, Firefox | Not yet verified |
 | Pause → animation freezes → voice stops | Chrome, Safari, Firefox | Not yet verified |
 | Resume → animation resumes → voice continues | Chrome, Safari, Firefox | Not yet verified |
 | Stop → returns to idle | Chrome, Safari, Firefox | Not yet verified |
 | All repetitions complete → one-set "训练完成" summary shown | Chrome, Safari, Firefox | Not yet verified |
 | Change config → start → uses new config | Desktop, Mobile | Not yet verified |
 | Open on mobile → responsive layout | iOS Safari, Android Chrome | Not yet verified |

 ### Browser/Platform Matrix

 | Feature | Chrome (macOS) | Safari (macOS) | Firefox (macOS) | iOS Safari | Android Chrome |
 |---------|---------------|----------------|-----------------|------------|----------------|
 | Timer accuracy | Untested | Untested | Untested | Untested | Untested |
 | Speech Synthesis | Untested | Untested | Untested | Untested | Untested |
 | Web Audio tones | Untested | Untested | Untested | Untested | Untested |
 | Wake Lock | Untested | Untested | Untested | N/A | Untested |
 | Haptics | N/A | N/A | N/A | Untested | Untested |
 | MuscleSphere animation | Untested | Untested | Untested | Untested | Untested |
 | Progress bar | Untested | Untested | Untested | Untested | Untested |
 | Responsive layout | Untested | Untested | Untested | Untested | Untested |
 | Reduced motion | Untested | Untested | Untested | Untested | Untested |

 ## Accessibility Checks

 | Check | Status |
 |------|--------|
 | `aria-label` on MuscleSphere | Implemented |
 | `role="img"` on MuscleSphere | Implemented |
 | `aria-hidden="true"` on decorative elements | Implemented |
 | `aria-label` on config stepper buttons | Implemented |
 | Semantic form elements in VoiceSettingsPanel | Implemented |
 | Keyboard navigation: tab order | Not tested |
 | Voice over screen reader conflict | Not tested |
 | Color contrast on dark theme | Not tested |
 | Focus indicators on all interactive elements | Partial (some missing) |

 ## Reduced Motion Checks

 | Check | Status |
 |------|--------|
 | Hold simplifies to contract (no tremor) | Implemented |
 | All layer animations snap to first keyframe | Implemented |
 | Container animation snaps to first keyframe | Implemented |

 ## Voice Unsupported Behavior

 | Scenario | Status |
 |----------|--------|
 | SpeechSynthesis unavailable → sound-only fallback | Implemented |
 | AudioContext unavailable → tones silent | Implemented |
 | navigator.vibrate unavailable → no haptics | Implemented |
 | localStorage blocked → defaults used | Implemented and tested |
 | All audio APIs unavailable → timer works silently | Implemented |

 ## Timing Drift Tests

 | Test | Status |
 |------|--------|
 | 10-round workout completes within 10% of expected duration | Not tested |
 | Multiple pause/resume cycles preserve total elapsed time | Not tested |
 | Background tab timing drift | Not tested |

 ## Duplicate Countdown Prevention

 | Test | Status |
 |------|--------|
 | Engine `announcedCountdowns` set prevents re-emission | Implemented and tested (engine) |
 | VoiceController `seen` set prevents re-queue | Implemented and tested (controller) |

 ## SVG Rendering and Animation Checks

 | Check | Status |
 |------|--------|
 | All 9 SVGs load without 404 | Not verified (manual) |
 | SVGs center at (256,256) | Not verified (manual) |
 | SVGs have transparent backgrounds | Not verified (manual) |
 | Gradient rendering on all browsers | Not tested |
 | Animation smoothness at 60fps | Not tested |
 | Memory usage over long sessions | Not tested |

 ## Test Execution

 Run all automated tests:
 ```bash
 bun run test
 ```

 Build verification:
 ```bash
 bun run build
 ```

 Lint:
 ```bash
 bun run lint
 ```

 As of 2026-07-23:
 - Tests: 4/4 files passing (11/11 tests)
 - Build: passes
 - Lint: not yet run
