import { useEffect, useState } from 'react';

/** Fuerza un re-render periódico — usado para refrescar badges de tiempo transcurrido. */
export function useTick(intervalMs = 15000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
