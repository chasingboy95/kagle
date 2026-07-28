import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StorageErrorNotice from './StorageErrorNotice';

describe('StorageErrorNotice', () => {
  it('shows an understandable persistence warning and can be dismissed', () => {
    const onDismiss = vi.fn();
    render(
      <StorageErrorNotice
        message="训练记录未能保存到设备。当前页面仍保留记录。"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('当前页面仍保留记录');
    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
