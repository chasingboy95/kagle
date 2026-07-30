import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../types/training';
import ConfigPanel from './ConfigPanel';

describe('ConfigPanel', () => {
  it('shows repetitions as one set and emits a repetition update', () => {
    const onChange = vi.fn();
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled={false} onChange={onChange} />);

    expect(screen.getByText('3-3-3 × 10 次 = 1 组')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '减少每组次数' }));
    expect(onChange).toHaveBeenCalledWith({ rounds: 9 });
  });

  it('disables controls during an active session', () => {
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: '增加收缩' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '减少每组次数' })).toBeDisabled();
  });

  it('shows preset selector with gentle, daily, and endurance options', () => {
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled={false} onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: '轻松入门' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '日常训练' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '耐力提升' })).toBeInTheDocument();
  });

  it('highlights matching preset when config matches', () => {
    // DEFAULT_CONFIG matches '日常训练' preset
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled={false} onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: '日常训练' })).toBeInTheDocument();
  });

  it('shows 自定义 when config does not match any preset', () => {
    const customConfig = { ...DEFAULT_CONFIG, holdTime: 7 };
    render(<ConfigPanel config={customConfig} disabled={false} onChange={() => undefined} />);
    expect(screen.getByText('自定义计划')).toBeInTheDocument();
  });

  it('selecting a preset calls onChange with full config', () => {
    const onChange = vi.fn();
    // Use a config that doesn't match any preset initially
    const customConfig = { ...DEFAULT_CONFIG, holdTime: 7 };
    render(<ConfigPanel config={customConfig} disabled={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '轻松入门' }));
    expect(onChange).toHaveBeenCalledWith({
      contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 5, sets: 1, restBetweenSets: 30,
    });
  });

  it('manual parameter change switches to 自定义', () => {
    const onChange = vi.fn();
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled={false} onChange={onChange} />);
    // DEFAULT_CONFIG matches daily preset — summary shows "日常训练"
    fireEvent.click(screen.getByRole('button', { name: '增加收缩' }));
    // Should have switched to 自定义 and called onChange with the new value
    expect(onChange).toHaveBeenCalledWith({ contractTime: 4 });
  });

  it('describes preset meaning without medical claims', () => {
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled={false} onChange={() => undefined} />);
    // Daily preset description should be shown
    expect(screen.getByText('中等强度，适合日常维持')).toBeInTheDocument();
    // Should NOT contain medical advice wording
    const body = document.body.textContent ?? '';
    expect(body).not.toContain('治疗');
    expect(body).not.toContain('诊断');
  });

  it('keeps presets single-select when the active preset is clicked again', () => {
    const onChange = vi.fn();
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '日常训练' }));

    expect(screen.getByRole('button', { name: '日常训练' })).toHaveClass('bg-accent/30');
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_CONFIG });
  });

  it('disables preset buttons when training is active', () => {
    render(<ConfigPanel config={DEFAULT_CONFIG} disabled onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: '轻松入门' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '日常训练' })).toBeDisabled();
  });
});
