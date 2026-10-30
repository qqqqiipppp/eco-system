import { wanderConfig } from '../../data/interaction-config.js';

/** One scheduler for the scene. update mutates state; render only paints changes.
 * Resume resets elapsed time, avoiding offscreen catch-up and large position jumps.
 */
// pauseForReducedMotion: the regular forest stops when the device asks for less
// motion; chapter mode keeps its clock running (stars, crises, breeding depend on
// it) and only drops decorative CSS animation.
// onError: one failed frame must not end the loop. Without this, an exception
// in update or render left the forest frozen until the page was reloaded.
export function createUpdateLoop({ update, render, hasWork, isPaused = () => false, pauseForReducedMotion = true, onError = error => console.error(error) }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frameId = null;
  let previousTime = null;
  let disposed = false;
  const canRun = () => !disposed && !isPaused() && document.visibilityState === 'visible' && !(pauseForReducedMotion && reducedMotion.matches) && hasWork();

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
      previousTime = time;
      try { render(update(Math.min(elapsed / 1000, 0.1))); } catch (error) { onError(error); }
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
    refresh, stop,
    dispose() {
      disposed = true;
      stop();
      document.removeEventListener('visibilitychange', refresh);
      reducedMotion.removeEventListener('change', refresh);
    },
  };
}
