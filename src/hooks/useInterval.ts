import { useEffect, useRef } from 'react';

/**
 * 稳定的 setInterval hook
 * 在 deps 变化时会重置定时器
 */
export function useInterval(
  callback: () => void,
  delayMs: number | null,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
