import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { completionSummary, formatDuration } from '../utils/trainingFeedback';
import TrainingFeedback from './TrainingFeedback';
import type { CompletionProgress } from '../utils/completionProgress';

const progress: CompletionProgress = {
  weeklyCompletions: 3,
  weeklyDurationMs: 210_000,
  addedDurationMs: 90_000,
  streakDays: 2,
  goal: { targetDays: 4, completedDays: 3, remainingDays: 1 },
};

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
        completedSets={1}
        totalSets={3}
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

  it('renders onViewHistory button when provided and calls it on click', () => {
    const onViewHistory = vi.fn();
    render(
      <TrainingFeedback
        completedRepetitions={10}
        totalRepetitions={10}
        completedSets={1}
        totalSets={3}
        durationMs={65_900}
        onRestart={vi.fn()}
        onDone={vi.fn()}
        onViewHistory={onViewHistory}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '查看训练记录' }));
    expect(onViewHistory).toHaveBeenCalledOnce();
  });

  it('does not render onViewHistory button when callback is not provided', () => {
    render(
      <TrainingFeedback
        completedRepetitions={10}
        totalRepetitions={10}
        completedSets={1}
        totalSets={3}
        durationMs={65_900}
      />,
    );

    expect(
      screen.queryByRole('button', { name: '查看训练记录' }),
    ).not.toBeInTheDocument();
  });

  it('renders objective weekly changes including the current session and optional goal', () => {
    render(
      <TrainingFeedback
        completedRepetitions={10}
        totalRepetitions={10}
        completedSets={1}
        totalSets={3}
        durationMs={90_000}
        progress={progress}
      />,
    );

    expect(screen.getByRole('heading', { name: '本周真实进度' })).toBeInTheDocument();
    expect(screen.getByText('3 次')).toBeInTheDocument();
    expect(screen.getByText('2 天')).toBeInTheDocument();
    expect(screen.getByText('03:30')).toBeInTheDocument();
    expect(screen.getByText('本次 +01:30')).toBeInTheDocument();
    expect(screen.getByText('每周目标 3/4 天，还差 1 天。')).toBeInTheDocument();
    expect(screen.queryByText(/动作标准|优秀|评分|医疗/)).not.toBeInTheDocument();
  });

  it('falls back to session results when weekly progress is unavailable', () => {
    render(
      <TrainingFeedback
        completedRepetitions={10}
        totalRepetitions={10}
        completedSets={1}
        totalSets={3}
        durationMs={90_000}
        progress={null}
      />,
    );

    expect(screen.queryByRole('heading', { name: '本周真实进度' })).not.toBeInTheDocument();
    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(screen.getByText('10/10')).toBeInTheDocument();
  });
});
