import { useEffect, useRef, useState } from 'react';

/**
 * Returns a date key that changes when the local date (or week) rolls over.
 * Components can include this in useMemo/useEffect deps to refresh
 * date-dependent calculations without polling.
 *
 * - Checks every 60 seconds (not on every render).
 * - Also checks on `visibilitychange` (tab returns from background).
 * - Returns `YYYY-MM-DD` for the `daily` mode (default) or `YYYY-Www` for `weekly`.
 */
export function useDateRefresh(mode: 'daily' | 'weekly' = 'daily'): string {
  const [key, setKey] = useState(() => dateKey(mode));

  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const refresh = () => { setKey(dateKey(modeRef.current)); };

    // Periodic check (every 60 seconds is plenty for day/week boundaries)
    const id = setInterval(refresh, 60_000);

    // Check immediately on visibility change (tab background→foreground)
    document.addEventListener('visibilitychange', refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return key;
}

function dateKey(mode: 'daily' | 'weekly'): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  if (mode === 'daily') return `${y}-${m}-${d}`;

  // ISO week number
  const startOfYear = new Date(y, 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const week = Math.ceil((diff / 86_400_000 + startOfYear.getDay() + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
}
