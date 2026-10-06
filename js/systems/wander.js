import { speciesProfiles, wanderConfig } from '../../data/interaction-config.js';
import { isPositionAllowed } from './placement.js';

/** Visual wandering only. Temporary timing/direction live here, never in
 * OrganismDefinition or saved organism instances. No detection/feeding/AI.
 */
export function createWanderSystem(random = Math.random) {
  const motions = new Map();
  const between = ([min, max]) => min + random() * (max - min);
  return {
    update(organisms, deltaSeconds, layout) {
      const changed = [];
      const dt = Math.min(Math.max(deltaSeconds, 0), 0.1);
      for (const instance of organisms) {
        if (!speciesProfiles[instance.speciesId]?.wanders || (instance.behaviorState && instance.behaviorState !== 'wander')) continue;
        let motion = motions.get(instance.instanceId);
        if (!motion) {
          motion = { walking: false, remaining: between(wanderConfig.pauseSeconds), dx: 1, dy: 0 };
          motions.set(instance.instanceId, motion);
        }
        motion.remaining -= dt;
        if (motion.remaining <= 0) {
          motion.walking = !motion.walking;
          motion.remaining = between(motion.walking ? wanderConfig.walkSeconds : wanderConfig.pauseSeconds);
          if (motion.walking) {
            motion.dx = random() < 0.5 ? -1 : 1;
            motion.dy = random() * 2 - 1;
          }
        }
        if (!motion.walking) continue;
        const position = {
          x: instance.position.x + motion.dx * wanderConfig.speedX * dt,
          y: instance.position.y + motion.dy * wanderConfig.speedY * dt,
        };
        if (!isPositionAllowed(instance.speciesId, position, layout)) {
          // Bounce within the same walk, then briefly stop if the corner is tight.
          motion.dx *= -1;
          motion.dy *= -1;
          motion.remaining = Math.min(motion.remaining, 0.5);
          continue;
        }
        instance.position = position;
        if ('direction' in instance) instance.direction = motion.dx;
        changed.push({ instance, direction: motion.dx });
      }
      return changed;
    },
    forget(instanceIds) { for (const id of instanceIds) motions.delete(id); },
  };
}
