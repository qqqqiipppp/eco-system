import { speciesProfiles, wanderConfig, placementConfig } from '../../data/interaction-config.js';
import { isPositionAllowed } from './placement.js';
import {survivalActivity} from './population.js';
import {developmentActivity} from './development.js';

/** Visual wandering only. Temporary timing/direction live here, never in
 * OrganismDefinition or saved organism instances. No detection/feeding/AI.
 */
export function createWanderSystem(random = Math.random) {
  const motions = new Map();
  const between = ([min, max]) => min + random() * (max - min);
  return {
    update(organisms, deltaSeconds, layout, activity = 1) {
      const changed = [];
      const dt = Math.min(Math.max(deltaSeconds, 0), 0.1);
      for (const instance of organisms) {
        if (!speciesProfiles[instance.speciesId]?.wanders || (instance.behaviorState && instance.behaviorState !== 'wander')) continue;
        const config=speciesProfiles[instance.speciesId].motion||wanderConfig;
        let motion = motions.get(instance.instanceId);
        if (!motion) {
          motion = { walking: false, remaining: between(config.pauseSeconds), dx: 1, dy: 0 };
          motions.set(instance.instanceId, motion);
        }
        motion.remaining -= dt;
        if (motion.remaining <= 0) {
          motion.walking = !motion.walking;
          motion.remaining = between(motion.walking ? config.walkSeconds : config.pauseSeconds);
          if (motion.walking) {
            motion.dx = random() < 0.5 ? -1 : 1;
            motion.dy = random() * 2 - 1;
            // A fish that comes up near the surface now and then (config.rise).
            motion.rising = Boolean(config.rise && random() < config.rise.chance);
          }
        }
        if (!motion.walking) continue;
        if (motion.rising) {
          const top = placementConfig.zones[speciesProfiles[instance.speciesId].zone].top;
          const up = {x: instance.position.x, y: Math.max(top, instance.position.y - config.rise.speed * dt)};
          if (up.y > top && isPositionAllowed(instance.speciesId, up, layout)) { instance.position = up; motion.remaining = Math.max(motion.remaining, dt); changed.push({instance, direction: motion.dx}); continue; }
          // Up there: stay a while, then wander as usual.
          if (isPositionAllowed(instance.speciesId, up, layout)) instance.position = up;
          motion.rising = false; motion.walking = false; motion.remaining = between(config.rise.staySeconds);
          changed.push({instance, direction: motion.dx});
          continue;
        }
        const position = {
          x: instance.position.x + motion.dx * config.speedX * dt * activity * survivalActivity(instance) * developmentActivity(instance),
          y: instance.position.y + motion.dy * config.speedY * dt * activity * survivalActivity(instance) * developmentActivity(instance),
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
