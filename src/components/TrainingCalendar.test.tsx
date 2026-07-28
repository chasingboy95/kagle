import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TrainingRecord } from '../types/training';
import TrainingCalendar from './TrainingCalendar';

function record(
  id: string,
  endedAt: string,
  status: TrainingRecord['status'] = 'completed',
): TrainingRecord {
  return {
    id,
    startedAt: endedAt,
    endedAt,
    contractSec: 3,
    holdSec: 3,
    relaxSec: 3,
    targetReps: 10,
    completedReps: status === 'completed' ? 10 : 2,
    status,
    actualDurationMs: status === 'completed' ? 60_000 : 10_000,
  };
}

describe('TrainingCalendar', () => {
  it('marks dates, summarizes completed records, and lists both statuses', () => {
    render(
      <TrainingCalendar
        records={[
          record('completed', '2026-07-03T10:00:00.000Z'),
          record('stopped', '2026-07-03T11:00:00.000Z', 'stopped'),
        ]}
        onOpenRecord={() => {}}
        initialMonth={{ year: 2026, month: 7 }}
        timeZone="UTC"
      />,
    );

    expect(screen.getByRole('heading', { name: '2026年7月' })).toBeInTheDocument();
    expect(screen.getByText('1次')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7月3日，1次完成，1次中止' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7月3日，1次完成，1次中止' }));
    expect(screen.getByText('完成')).toBeInTheDocument();
    expect(screen.getByText('中止')).toBeInTheDocument();
  });

  it('opens a selected day record and supports month navigation', () => {
    const onOpenRecord = vi.fn();
    render(
      <TrainingCalendar
        records={[record('completed', '2026-07-03T10:00:00.000Z')]}
        onOpenRecord={onOpenRecord}
        initialMonth={{ year: 2026, month: 7 }}
        timeZone="UTC"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '7月3日，1次完成' }));
    fireEvent.click(screen.getByRole('button', { name: /已完成记录详情/ }));
    expect(onOpenRecord).toHaveBeenCalledWith('completed');

    fireEvent.click(screen.getByRole('button', { name: '下个月' }));
    expect(screen.getByRole('heading', { name: '2026年8月' })).toBeInTheDocument();
  });
});
