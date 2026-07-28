import { describe, expect, it, vi } from 'vitest';
import type { SessionSnapshot } from '../types/training';
import { isTrainingInProgress, requestActivation, SW_SKIP_WAITING } from './swProtocol';

function snapshot(status: SessionSnapshot['status']): SessionSnapshot {
  return {
    status,
    phase: 'contract',
    round: 0,
    phaseElapsedMs: 0,
    sessionElapsedMs: 0,
    totalPausedMs: 0,
    config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 10 },
    announcedCountdowns: [],
    sessionStartedAtIso: '2026-01-01T00:00:00.000Z',
  };
}

describe('isTrainingInProgress', () => {
  it('returns false when there is no snapshot', () => {
    expect(isTrainingInProgress(null)).toBe(false);
  });

  it('returns true while a session is running', () => {
    expect(isTrainingInProgress(snapshot('running'))).toBe(true);
  });

  it('returns true while a session is paused', () => {
    expect(isTrainingInProgress(snapshot('paused'))).toBe(true);
  });

  it('returns false on the feedback completion view (user-confirmed)', () => {
    expect(isTrainingInProgress(snapshot('feedback'))).toBe(false);
  });
});

describe('requestActivation', () => {
  it('posts SKIP_WAITING to the waiting worker', () => {
    const postMessage = vi.fn();
    const registration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    expect(requestActivation(registration)).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: SW_SKIP_WAITING });
  });

  it('returns false when there is no waiting worker', () => {
    const registration = {
      waiting: null,
    } as unknown as ServiceWorkerRegistration;

    expect(requestActivation(registration)).toBe(false);
  });

  it('degrades gracefully when postMessage throws', () => {
    const registration = {
      waiting: {
        postMessage: () => {
          throw new Error('blocked');
        },
      },
    } as unknown as ServiceWorkerRegistration;

    expect(requestActivation(registration)).toBe(false);
  });
});
