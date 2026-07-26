import type { CoachVoiceEvent } from './voiceEvents'

export type TrainingPhase =
  | 'idle'
  | 'contract'
  | 'hold'
  | 'relax'
  | 'paused'
  | 'completed'

export interface TrainingVoiceInput {
  phase: TrainingPhase
  previousPhase?: TrainingPhase
}

export interface TrainingVoiceOutput {
  event: CoachVoiceEvent
  priority: 'critical' | 'important' | 'normal' | 'ambient'
  interrupt: boolean
}

/**
 * Converts internal training engine states into coach-oriented voice events.
 *
 * The engine keeps fine-grained phases (contract/hold/relax), while the
 * voice layer communicates user intent (start/sustain/release).
 */
export function mapTrainingStateToVoice(
  input: TrainingVoiceInput,
): TrainingVoiceOutput | null {
  const { phase, previousPhase } = input

  switch (phase) {
    case 'contract':
      return {
        event: 'contraction-start',
        priority: 'important',
        interrupt: false,
      }

    case 'hold':
      if (previousPhase === 'contract') {
        return {
          event: 'contraction-sustain',
          priority: 'normal',
          interrupt: false,
        }
      }
      return null

    case 'relax':
      return {
        event: 'release-start',
        priority: 'important',
        interrupt: false,
      }

    case 'paused':
      return {
        event: 'paused',
        priority: 'critical',
        interrupt: true,
      }

    case 'completed':
      return {
        event: 'training-complete',
        priority: 'critical',
        interrupt: true,
      }

    default:
      return null
  }
}
