import { describe, expect, it } from 'vitest'
import { mapTrainingStateToVoice } from '../trainingVoiceAdapter'

describe('training voice adapter', () => {
  it('maps contract phase to contraction start', () => {
    expect(mapTrainingStateToVoice({ phase: 'contract' })).toEqual({
      event: 'contraction-start',
      priority: 'important',
      interrupt: false,
    })
  })

  it('maps hold after contract to sustain', () => {
    expect(
      mapTrainingStateToVoice({ phase: 'hold', previousPhase: 'contract' }),
    ).toEqual({
      event: 'contraction-sustain',
      priority: 'normal',
      interrupt: false,
    })
  })

  it('interrupts on pause', () => {
    expect(mapTrainingStateToVoice({ phase: 'paused' })).toEqual({
      event: 'paused',
      priority: 'critical',
      interrupt: true,
    })
  })
})
