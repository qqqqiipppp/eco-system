import { wanderConfig } from '../../data/interaction-config.js';

/** One scheduler for the scene. update mutates state; render only paints changes.
 * Resume resets elapsed time, avoiding offscreen catch-up and large position jumps.
 */
export function createUpdateLoop({ update, render, hasWork }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frameId = null;
  let previousTime = null;
  let disposed = false;
  const canRun = () => !disposed && document.visibilityState === 'visible' && !reducedMotion.matches && hasWork();

  function stop() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
  }
  function frame(time) {
    frameId = null;
    if (!canRun()) { stop(); return; }
    if (previousTime === null) previousTime = time;
    const elapsed = time - previousTime;
    if (elapsed >= 1000 / wanderConfig.framesPerSecond) {
      const changed = update(Math.min(elapsed / 1000, 0.1));
      render(changed);
      previousTime = time;
    }
    frameId = requestAnimationFrame(frame);
  }
  function refresh() {
    if (!canRun()) { stop(); return; }
    if (frameId === null) frameId = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener('change', refresh);
  return {
    refresh,
    dispose() {
      disposed = true;
      stop();
      document.removeEventListener('visibilitychange', refresh);
      reducedMotion.removeEventListener('change', refresh);
    },
  };
}
