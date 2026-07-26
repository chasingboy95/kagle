import { describe, expect, it } from 'vitest';
import { completionSummary, formatDuration } from '../utils/trainingFeedback';

describe('TrainingFeedback objective session copy', () => {
  it('summarizes one completed set with repetition counts', () => {
    expect(completionSummary(10, 10)).toBe('本次完成 1 组（10/10 次）');
  });

  it('formats the measured session duration', () => {
    expect(formatDuration(65_900)).toBe('01:05');
  });
});
