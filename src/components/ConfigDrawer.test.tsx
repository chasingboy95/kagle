import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../types/training';
import ConfigDrawer from './ConfigDrawer';

const baseProps = {
  config: DEFAULT_CONFIG,
  savedConfigs: [],
  onSaveConfig: () => true,
  onRenameConfig: () => true,
  onDeleteConfig: () => undefined,
};

describe('ConfigDrawer', () => {
  it('keeps edits in a draft until the user applies them', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<ConfigDrawer {...baseProps} onApply={onApply} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '减少每组次数' }));
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '应用此计划' }));
    expect(onApply).toHaveBeenCalledWith({ ...DEFAULT_CONFIG, rounds: 9 });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('asks before discarding a dirty draft and can continue editing', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<ConfigDrawer {...baseProps} onApply={onApply} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '增加收缩' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(screen.getByRole('heading', { name: '放弃未应用的修改？' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }));
    expect(screen.getByText('4-3-3 × 10 次 = 1 组')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('uses Escape for guarded close and traps keyboard focus', () => {
    render(<ConfigDrawer {...baseProps} onApply={() => undefined} onClose={() => undefined} />);
    const dialog = screen.getByRole('dialog', { name: '调整训练计划' });
    const close = screen.getByRole('button', { name: '关闭训练计划' });

    expect(close).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: '应用此计划' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '增加收缩' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.getByRole('heading', { name: '放弃未应用的修改？' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续编辑' })).toHaveFocus();
  });

  it('uses the shared bottom sheet structure and 44px parameter controls', () => {
    render(<ConfigDrawer {...baseProps} onApply={() => undefined} onClose={() => undefined} />);

    const dialog = screen.getByRole('dialog', { name: '调整训练计划' });
    expect(dialog).toHaveClass('bottom-sheet');
    expect(screen.getByRole('button', { name: '增加收缩' })).toHaveClass('min-h-11', 'min-w-11');
    expect(screen.getByRole('button', { name: '日常训练' })).toHaveClass('min-h-11');
  });
});
