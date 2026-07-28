import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SessionRecovery from './SessionRecovery';
import type { SessionSnapshot } from '../types/training';

const snapshot: SessionSnapshot = {
  status: 'paused',
  phase: 'hold',
  round: 1,
  phaseElapsedMs: 1_000,
  sessionElapsedMs: 8_000,
  totalPausedMs: 0,
  config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 10 },
  announcedCountdowns: [],
  sessionStartedAtIso: '2026-07-28T00:00:00.000Z',
};

describe('SessionRecovery accessibility', () => {
  it('requires an explicit choice and traps focus between its actions', () => {
    const onContinue = vi.fn();
    const onDiscard = vi.fn();
    render(
      <SessionRecovery
        snapshot={snapshot}
        onContinue={onContinue}
        onDiscard={onDiscard}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: '恢复训练' });
    const discard = screen.getByRole('button', { name: '放弃' });
    const continueButton = screen.getByRole('button', { name: '继续训练' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(continueButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onContinue).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(discard).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(continueButton).toHaveFocus();
  });
});
