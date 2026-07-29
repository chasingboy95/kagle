import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../types/training';
import ConfigDrawer from './ConfigDrawer';

function renderDrawer() {
  const onChange = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfigDrawer
      config={DEFAULT_CONFIG}
      savedConfigs={[]}
      onChange={onChange}
      onSaveConfig={() => true}
      onRenameConfig={() => true}
      onDeleteConfig={() => {}}
      onClose={onClose}
    />,
  );
  return { onChange, onClose };
}

describe('ConfigDrawer draft flow', () => {
  it('keeps edits local until the user applies the plan', () => {
    const { onChange, onClose } = renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: '减少每组次数' }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '应用此计划' }));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_CONFIG, rounds: 9 });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('asks before discarding a dirty draft and can continue editing', () => {
    const { onChange, onClose } = renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: '增加保持' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(screen.getByRole('alertdialog', { name: '放弃训练计划修改？' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('discards a dirty draft without committing it', () => {
    const { onChange, onClose } = renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: '增加保持' }));
    fireEvent.keyDown(screen.getByRole('dialog', { name: '调整训练计划' }), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
