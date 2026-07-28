import type { SessionSnapshot } from '../types/training';

/** Message the page sends to a waiting Service Worker to request activation. */
export const SW_SKIP_WAITING = 'SKIP_WAITING';

/**
 * True while a session snapshot shows a live training session that must not be
 * interrupted by a page reload. The `feedback` (completion) view is
 * user-confirmed, so leaving it to apply an update is safe.
 */
export function isTrainingInProgress(snapshot: SessionSnapshot | null): boolean {
  return snapshot !== null && snapshot.status !== 'feedback';
}

/**
 * Ask a waiting Service Worker to activate and take control of the page.
 * Returns false (graceful no-op) when there is no waiting worker or the message
 * cannot be posted, so callers degrade without throwing.
 */
export function requestActivation(registration: ServiceWorkerRegistration): boolean {
  const waiting = registration.waiting;
  if (!waiting) return false;
  try {
    waiting.postMessage({ type: SW_SKIP_WAITING });
    return true;
  } catch {
    return false;
  }
}
