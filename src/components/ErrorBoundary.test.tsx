import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Broken({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('Test explosion');
  return <div>OK</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <Broken shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders recovery UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('出了点问题')).toBeInTheDocument();
    expect(
      screen.getByText(/应用遇到了意外错误/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '清除数据并重置' }),
    ).toBeInTheDocument();
  });

  it('shows technical details in dev mode when available', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    // The error message should appear inside a <details> in dev mode
    expect(screen.getByText('技术详情（仅开发环境可见）')).toBeInTheDocument();
  });

  it('calls onError callback when an error is caught', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Broken />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test explosion' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('renders children normally after error is gone (new render)', () => {
    const { rerender } = render(
      <ErrorBoundary key="broken">
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByText('出了点问题')).toBeInTheDocument();

    // Re-render with a different key resets the boundary
    rerender(
      <ErrorBoundary key="fixed">
        <Broken shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});

describe('ErrorRecoveryUI', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reload button calls window.location.reload', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it('reset button transitions to confirmation state without clearing data', () => {
    localStorage.setItem('kegel.test.v1', 'value');
    localStorage.setItem('other-app', 'keep');

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: '清除数据并重置' }));

    // Confirmation message should appear
    expect(screen.getByText(/此操作将清除训练历史/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确认清除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();

    // Data should NOT be cleared yet
    expect(localStorage.getItem('kegel.test.v1')).toBe('value');
    expect(localStorage.getItem('other-app')).toBe('keep');
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('confirming reset clears kegel localStorage keys then reloads', () => {
    localStorage.setItem('kegel.test.v1', 'value');
    localStorage.setItem('other-app', 'keep');

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    // First click: show confirmation
    fireEvent.click(screen.getByRole('button', { name: '清除数据并重置' }));

    // Second click: confirm clear
    fireEvent.click(screen.getByRole('button', { name: '确认清除' }));

    // kegel keys should be removed
    expect(localStorage.getItem('kegel.test.v1')).toBeNull();
    // non-kegel keys should be preserved
    expect(localStorage.getItem('other-app')).toBe('keep');
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it('canceling reset returns to normal recovery UI', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    // First click: show confirmation
    fireEvent.click(screen.getByRole('button', { name: '清除数据并重置' }));

    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    // Should be back to normal recovery UI
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '清除数据并重置' })).toBeInTheDocument();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
