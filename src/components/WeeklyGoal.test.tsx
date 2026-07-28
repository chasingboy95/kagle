import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeeklyGoal from './WeeklyGoal';

const progress = {
  completedDays: 2,
  remainingDays: 1,
  weekStartKey: '2026-07-27',
  weekEndKey: '2026-08-02',
};

describe('WeeklyGoal', () => {
  it('sets an optional weekly target', () => {
    const onSetTargetDays = vi.fn();
    render(
      <WeeklyGoal
        settings={{ enabled: false, targetDays: 3 }}
        progress={progress}
        onSetTargetDays={onSetTargetDays}
        onDisable={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '设置目标' }));
    fireEvent.change(screen.getByLabelText('每周计划训练天数'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onSetTargetDays).toHaveBeenCalledWith(4);
  });

  it('shows real progress and allows adjustment or closing without pressure language', () => {
    const onDisable = vi.fn();
    render(
      <WeeklyGoal
        settings={{ enabled: true, targetDays: 3 }}
        progress={progress}
        onSetTargetDays={() => {}}
        onDisable={onDisable}
      />,
    );

    expect(screen.getByText('本周 2 / 3 天')).toBeInTheDocument();
    expect(screen.getByText(/还差 1 天，按自己的节奏安排即可/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(screen.queryByText(/失败|落后|必须|治疗/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭目标' }));
    expect(onDisable).toHaveBeenCalledOnce();
  });
});
