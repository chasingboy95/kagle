import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TrainingRecord } from '../types/training';
import TrainingRecordDetail from './TrainingRecordDetail';

const completedRecord: TrainingRecord = {
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

describe('TrainingRecordDetail', () => {
  it('shows objective timing, rhythm, repetitions, status, and matching preset', () => {
    render(<TrainingRecordDetail record={completedRecord} onBack={() => {}} onDelete={() => {}} />);

    expect(screen.getByRole('heading', { name: '训练记录详情' })).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('预设 · 日常训练')).toBeInTheDocument();
    expect(screen.getByText('收缩 3秒 · 保持 3秒 · 放松 3秒')).toBeInTheDocument();
    expect(screen.getByText('10 / 10 次')).toBeInTheDocument();
    expect(screen.getByText('1分30秒')).toBeInTheDocument();
    expect(screen.getByText('开始时间')).toBeInTheDocument();
    expect(screen.getByText('结束时间')).toBeInTheDocument();
    expect(screen.queryByText(/质量|评分|医疗评价/)).not.toBeInTheDocument();
  });

  it('marks unmatched and stopped configurations without subjective interpretation', () => {
    render(
      <TrainingRecordDetail
        record={{ ...completedRecord, holdSec: 4, status: 'stopped', completedReps: 3 }}
        onBack={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText('自定义配置')).toBeInTheDocument();
    expect(screen.getByText('已中止')).toBeInTheDocument();
    expect(screen.getByText('3 / 10 次')).toBeInTheDocument();
  });

  it('returns without deleting and requires confirmation before deletion', () => {
    const onBack = vi.fn();
    const onDelete = vi.fn();
    render(<TrainingRecordDetail record={completedRecord} onBack={onBack} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: '返回记录' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '删除这条记录' }));
    expect(screen.getByRole('alert')).toHaveTextContent('删除后无法恢复');
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '删除这条记录' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(onDelete).toHaveBeenCalledWith('record-1');
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});
