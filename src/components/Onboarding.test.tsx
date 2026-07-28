import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Onboarding from './Onboarding';

describe('Onboarding accessibility', () => {
  it('labels the modal, traps focus, and allows Escape to skip', () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);

    const dialog = screen.getByRole('dialog', { name: '什么是凯格尔训练' });
    const skip = screen.getByRole('button', { name: '跳过' });
    const next = screen.getByRole('button', { name: '下一步' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(next).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(skip).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(next).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
