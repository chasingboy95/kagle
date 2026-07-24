export type CoachVoiceEvent =
  | 'training-ready'
  | 'contraction-start'
  | 'contraction-sustain'
  | 'release-start'
  | 'training-complete'
  | 'paused'
  | 'resumed';

export const VOICE_PRIORITY: Record<CoachVoiceEvent, 'critical' | 'important' | 'normal' | 'ambient'> = {
  'training-ready': 'normal',
  'contraction-start': 'important',
  'contraction-sustain': 'ambient',
  'release-start': 'important',
  'training-complete': 'critical',
  paused: 'critical',
  resumed: 'important',
};
