import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsHome from './SettingsHome';

describe('SettingsHome', () => {
  it('groups training and general settings into clear entries', () => {
    const onOpenPlan = vi.fn();
    const onOpenVoice = vi.fn();
    const onOpenMore = vi.fn();
    render(
      <SettingsHome
        planSummary="3-3-3 × 10 次"
        voiceSummary="语音教练"
        onOpenPlan={onOpenPlan}
        onOpenVoice={onOpenVoice}
        onOpenMore={onOpenMore}
      />,
    );

    expect(screen.getByRole('heading', { name: '训练' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '通用' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /训练计划/ }));
    fireEvent.click(screen.getByRole('button', { name: /声音与反馈/ }));
    fireEvent.click(screen.getByRole('button', { name: /提醒、引导与数据/ }));
    expect(onOpenPlan).toHaveBeenCalledOnce();
    expect(onOpenVoice).toHaveBeenCalledOnce();
    expect(onOpenMore).toHaveBeenCalledOnce();
  });
});
