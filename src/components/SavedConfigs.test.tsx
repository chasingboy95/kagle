import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../types/training';
import type { SavedTrainingConfig } from '../utils/appStorageSchemas';
import SavedConfigs from './SavedConfigs';

const favorite: SavedTrainingConfig = {
  id: 'evening',
  name: '晚间训练',
  config: { contractTime: 5, holdTime: 7, relaxTime: 5, rounds: 8 },
};

function renderSavedConfigs(overrides: Partial<React.ComponentProps<typeof SavedConfigs>> = {}) {
  const props = {
    config: DEFAULT_CONFIG,
    disabled: false,
    items: [favorite],
    onApply: vi.fn(),
    onSave: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<SavedConfigs {...props} />);
  return props;
}

describe('SavedConfigs', () => {
  it('shows the exact one-set summary and applies a favorite', () => {
    const props = renderSavedConfigs();
    expect(screen.getByText('5-7-5 × 8 次 = 1 组')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '使用收藏 晚间训练' }));
    expect(props.onApply).toHaveBeenCalledWith(favorite.config);
  });

  it('saves the current configuration under a trimmed-capable name', () => {
    const props = renderSavedConfigs({ items: [] });
    fireEvent.change(screen.getByLabelText('收藏名称'), { target: { value: '早晨' } });
    fireEvent.click(screen.getByRole('button', { name: '收藏当前配置' }));
    expect(props.onSave).toHaveBeenCalledWith('早晨', DEFAULT_CONFIG);
    expect(screen.getByLabelText('收藏名称')).toHaveValue('');
  });

  it('renames and deletes a favorite', () => {
    const props = renderSavedConfigs();
    fireEvent.click(screen.getByRole('button', { name: '重命名 晚间训练' }));
    fireEvent.change(screen.getByLabelText('重命名收藏'), { target: { value: '睡前' } });
    fireEvent.click(screen.getByRole('button', { name: '保存名称' }));
    expect(props.onRename).toHaveBeenCalledWith('evening', '睡前');

    fireEvent.click(screen.getByRole('button', { name: '删除收藏 晚间训练' }));
    expect(props.onDelete).toHaveBeenCalledWith('evening');
  });

  it('disables saving after five favorites', () => {
    renderSavedConfigs({
      items: Array.from({ length: 5 }, (_, index) => ({
        ...favorite,
        id: `favorite-${index}`,
        name: `收藏 ${index + 1}`,
      })),
    });
    expect(screen.getByLabelText('收藏名称')).toBeDisabled();
    expect(screen.getByRole('button', { name: '收藏当前配置' })).toBeDisabled();
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });
});
