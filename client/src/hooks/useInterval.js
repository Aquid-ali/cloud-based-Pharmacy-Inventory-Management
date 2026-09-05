import { useEffect, useRef } from 'react';

/**
 * Runs `callback` every `delayMs`, paused while the tab isn't visible (avoids
 * wasted polling in a background tab). Pass a falsy `delayMs` to disable.
 */
export default function useInterval(callback, delayMs, { pauseWhenHidden = true } = {}) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!delayMs) return undefined;
    const tick = () => {
      if (pauseWhenHidden && document.hidden) return;
      savedCallback.current();
    };
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs, pauseWhenHidden]);
}
