import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsHome from './SettingsHome';

describe('SettingsHome', () => {
  it('groups training and general settings into clear entries', () => {
    const onOpenPlan = vi.fn();
    const onOpenVoice = vi.fn();
    const onOpenReminder = vi.fn();
    const onShowOnboarding = vi.fn();
    const onOpenData = vi.fn();
    const onReenableProgressive = vi.fn();
    render(
      <SettingsHome
        planSummary="3-3-3 × 10 次"
        voiceSummary="语音教练"
        reminderSummary="周一、三、五 · 20:00"
        progressiveDisabled
        onOpenPlan={onOpenPlan}
        onOpenVoice={onOpenVoice}
        onOpenReminder={onOpenReminder}
        onShowOnboarding={onShowOnboarding}
        onOpenData={onOpenData}
        onReenableProgressive={onReenableProgressive}
      />,
    );

    expect(screen.getByRole('heading', { name: '训练' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '通用' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /训练计划/ }));
    fireEvent.click(screen.getByRole('button', { name: /声音与反馈/ }));
    fireEvent.click(screen.getByRole('button', { name: /训练提醒/ }));
    fireEvent.click(screen.getByRole('button', { name: /新手引导/ }));
    fireEvent.click(screen.getByRole('button', { name: /渐进训练建议/ }));
    fireEvent.click(screen.getByRole('button', { name: /数据备份与恢复/ }));
    expect(onOpenPlan).toHaveBeenCalledOnce();
    expect(onOpenVoice).toHaveBeenCalledOnce();
    expect(onOpenReminder).toHaveBeenCalledOnce();
    expect(onShowOnboarding).toHaveBeenCalledOnce();
    expect(onOpenData).toHaveBeenCalledOnce();
    expect(onReenableProgressive).toHaveBeenCalledOnce();
  });
});
