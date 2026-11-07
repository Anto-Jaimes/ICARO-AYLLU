import { useEffect, useRef } from 'react';

// Most recent last: Android Back and Escape close whatever opened last.
const handlers: { current: () => void }[] = [];

export function useBackHandler(isActive: boolean, handler: () => void): void {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    if (!isActive) return;
    handlers.push(latest);
    return () => {
      handlers.splice(handlers.indexOf(latest), 1);
    };
  }, [isActive]);
}

/** Returns false when nothing was open, so the caller can leave the screen or the app. */
export function runBackHandler(): boolean {
  const top = handlers[handlers.length - 1];
  if (!top) return false;
  top.current();
  return true;
}
