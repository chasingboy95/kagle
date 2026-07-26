import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { completionSummary, formatDuration } from '../utils/trainingFeedback';
import TrainingFeedback from './TrainingFeedback';

describe('TrainingFeedback objective session copy', () => {
  it('summarizes one completed set with repetition counts', () => {
    expect(completionSummary(10, 10)).toBe('本次完成 1 组（10/10 次）');
  });

  it('formats the measured session duration', () => {
    expect(formatDuration(65_900)).toBe('01:05');
  });

  it('renders objective results and exposes both completion actions', () => {
    const onRestart = vi.fn();
    const onDone = vi.fn();
    render(
      <TrainingFeedback
        completedRepetitions={10}
        totalRepetitions={10}
        durationMs={65_900}
        onRestart={onRestart}
        onDone={onDone}
      />,
    );

    expect(screen.getByRole('heading', { name: '训练完成' })).toBeInTheDocument();
    expect(screen.getByText('本次完成 1 组（10/10 次）')).toBeInTheDocument();
    expect(screen.getByText('01:05')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '再次训练' }));
    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(onRestart).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });
});
