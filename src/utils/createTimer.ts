/**
 * Timer handle returned by createTimer.
 */
export interface TimerHandle {
  start: () => void;
  stop: () => void;
}

/**
 * Create a timer that calls `onTick` at ~100 ms intervals.
 *
 * Uses a Web Worker when the browser supports it, so the timer keeps
 * ticking at full rate even when the tab is backgrounded.
 * Falls back to main-thread setInterval when Workers are unavailable.
 */
export function createTimer(onTick: () => void): TimerHandle {
  /* Only try Web Worker in genuine browsers.
   * Skip test runners (vitest) where fake timers don't control Worker setInterval,
   * and Node.js/Bun environments where Worker cannot load the script. */
  const isTest = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const hasWorker = typeof window !== 'undefined'
    && typeof window.Worker === 'function'
    && !isTest;

  if (hasWorker) {
    try {
      const worker = new Worker(
        new URL('./timingWorker.ts', import.meta.url),
        { type: 'module' },
      );

      let running = false;
      let fallbackId: ReturnType<typeof setInterval> | null = null;

      /** Switch to setInterval when the Worker fails to load. */
      const fallback = () => {
        worker.terminate();
        if (!running || fallbackId !== null) return;
        fallbackId = setInterval(onTick, 100);
      };

      worker.onmessage = () => {
        onTick();
      };

      worker.onerror = () => { fallback(); };

      return {
        start: () => {
          if (running) return;
          running = true;
          try {
            worker.postMessage({ type: 'start' });
          } catch {
            fallback();
          }
        },
        stop: () => {
          running = false;
          worker.terminate();
          if (fallbackId !== null) {
            clearInterval(fallbackId);
            fallbackId = null;
          }
        },
      };
    } catch {
      /* Worker constructor threw – fall through to setInterval below. */
    }
  }

  /* ---- Fallback: main-thread setInterval ---------------- */
  let timerId: ReturnType<typeof setInterval> | null = null;

  return {
    start: () => {
      if (timerId !== null) return;
      timerId = setInterval(onTick, 100);
    },
    stop: () => {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    },
  };
}
