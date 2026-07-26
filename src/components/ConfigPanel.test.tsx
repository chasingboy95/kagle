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
});
