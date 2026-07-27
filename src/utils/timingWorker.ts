/**
 * Dedicated Web Worker that provides reliable timer ticks
 * unaffected by browser background-tab throttling.
 *
 * Messages:
 *   { type: 'start' } – Begin ticking at ~100 ms intervals.
 *   { type: 'stop'  } – Stop ticking.
 *
 * Posts back null on each tick.
 */
let timerId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent<{ type: 'start' | 'stop' }>) => {
  switch (e.data.type) {
    case 'start':
      if (timerId !== null) return;
      timerId = setInterval(() => {
        self.postMessage(null);
      }, 100);
      break;
    case 'stop':
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      break;
  }
};
