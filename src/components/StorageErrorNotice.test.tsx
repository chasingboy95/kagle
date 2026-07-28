import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StorageErrorNotice from './StorageErrorNotice';

describe('StorageErrorNotice', () => {
  it('shows an understandable persistence warning and can be dismissed', () => {
    const onDismiss = vi.fn();
    render(
      <StorageErrorNotice
        errors={[{ source: '训练记录', message: '训练记录未能保存到设备。当前页面仍保留记录。' }]}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('当前页面仍保留记录');
    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows multiple errors with expand/collapse', () => {
    render(
      <StorageErrorNotice
        errors={[
          { source: '训练记录', message: '训练记录保存失败。' },
          { source: '周目标', message: '周目标保存失败。' },
          { source: '收藏配置', message: '收藏保存失败。' },
        ]}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('训练记录保存失败');
    expect(screen.getByText('还有 2 个错误')).toBeInTheDocument();
  });

  it('renders nothing when errors array is empty', () => {
    const { container } = render(
      <StorageErrorNotice errors={[]} onDismiss={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
