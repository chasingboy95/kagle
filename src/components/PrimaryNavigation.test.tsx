import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PrimaryNavigation from './PrimaryNavigation';

describe('PrimaryNavigation', () => {
  it('marks the current page and navigates with one tap', () => {
    const onNavigate = vi.fn();
    render(<PrimaryNavigation current="records" onNavigate={onNavigate} />);

    expect(screen.getByRole('button', { name: '记录' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '训练' })).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });
});
