import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HistoryStats } from '../hooks/useTrainingHistory';
import type { TrainingRecord } from '../types/training';
import TrainingHistory from './TrainingHistory';

const record: TrainingRecord = {
  id: 'record-1',
  startedAt: '2026-07-28T10:00:00.000Z',
  endedAt: '2026-07-28T10:01:30.000Z',
  contractSec: 3,
  holdSec: 3,
  relaxSec: 3,
  targetReps: 10,
  completedReps: 10,
  status: 'completed',
  actualDurationMs: 90_000,
};

const stats: HistoryStats = {
  weeklyCompletions: 1,
  totalCompletions: 1,
  streakDays: 1,
  totalDurationMs: 90_000,
};

const weeklyProps = {
  weeklyGoal: { enabled: false, targetDays: 3 },
  weeklyProgress: {
    completedDays: 1,
    remainingDays: 2,
    weekStartKey: '2026-07-27',
    weekEndKey: '2026-08-02',
  },
  onSetWeeklyTarget: () => {},
  onDisableWeeklyGoal: () => {},
};

describe('TrainingHistory detail navigation', () => {
  it('opens one record and returns to the history list', () => {
    render(
      <TrainingHistory
        records={[record]}
        stats={stats}
        onRemoveRecord={() => {}}
        onClearAll={() => {}}
        onClose={() => {}}
        {...weeklyProps}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /训练记录详情/ }));
    expect(screen.getByRole('heading', { name: '训练记录详情' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '返回记录' }));
    expect(screen.getByRole('button', { name: /训练记录详情/ })).toBeInTheDocument();
  });

  it('deletes the selected record only after confirmation and returns', () => {
    const onRemoveRecord = vi.fn();
    render(
      <TrainingHistory
        records={[record]}
        stats={stats}
        onRemoveRecord={onRemoveRecord}
        onClearAll={() => {}}
        onClose={() => {}}
        {...weeklyProps}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /训练记录详情/ }));
    fireEvent.click(screen.getByRole('button', { name: '删除这条记录' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(onRemoveRecord).toHaveBeenCalledWith('record-1');
    expect(screen.getByRole('button', { name: /训练记录详情/ })).toBeInTheDocument();
  });

  it('opens a calendar date record in the same detail flow', () => {
    render(
      <TrainingHistory
        records={[record]}
        stats={stats}
        onRemoveRecord={() => {}}
        onClearAll={() => {}}
        onClose={() => {}}
        {...weeklyProps}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '日历' }));
    const dateButton = screen.getByRole('button', { name: /1次完成/ });
    fireEvent.click(dateButton);
    fireEvent.click(screen.getByRole('button', { name: /已完成记录详情/ }));
    expect(screen.getByRole('heading', { name: '训练记录详情' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '返回记录' }));
    expect(screen.getByRole('heading', { name: /年.*月/ })).toBeInTheDocument();
  });
});
