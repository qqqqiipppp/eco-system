import {speciesProfiles} from '../../data/interaction-config.js';
import {feedingConfig} from '../../data/ecology-config.js';

// The head in the burrow: drawn in the hole (burrow: centre and size on the
// picture), rising out of its bottom edge.
export function createBurrowPeek(layer) {
  const box = document.createElement('div'), head = document.createElement('img');
  box.className = 'burrow-peek'; box.hidden = true; box.setAttribute('aria-hidden', 'true');
  head.src = './assets/images/burrow/otter-peek.webp'; head.alt = ''; head.draggable = false;
  box.append(head); layer.append(box);
  let shown = null;
  return {
    show(burrow) {
      if (burrow === shown) return;
      shown = burrow;
      if (!burrow) { box.classList.remove('is-up'); setTimeout(() => { if (!shown) box.hidden = true; }, 600); return; }
      Object.assign(box.style, {left: `${(burrow.x - burrow.w / 2) * 100}%`, top: `${(burrow.y - burrow.h / 2) * 100}%`, width: `${burrow.w * 100}%`, height: `${burrow.h * 100}%`});
      box.hidden = false; requestAnimationFrame(() => box.classList.add('is-up'));
    },
  };
}

// The otter (수달) hunts in the water but lives on land too: now and then its
// picture swims to the bank's edge and climbs onto the bank, or slips into its
// burrow and peeks its head out. View only: the model point stays in the water,
// so feeding, the food web and saves are unchanged; a hunt (or hunger) brings
// the picture back at once. shore (the chapter's art): edge, where it leaves the
// water; land, a strip of the bank's top; burrow, the hole in the bank's cut.
export function createVisitPlanner(random = Math.random) {
  const between = ([a, b]) => a + random() * (b - a);
  const waits = new Map();
  let trip = null;
  const free = o => o.behaviorState === 'wander' && !(o.hunger >= (feedingConfig[o.speciesId]?.hungryAt ?? 1));
  const home = o => ({x: o.position.x, y: o.position.y});
  function plan(o, shore, visits) {
    const legs = [{to: shore.edge, seconds: 2.5}];
    if (shore.burrow && random() < .5) {
      const hole = {x: shore.burrow.x, y: shore.burrow.y};
      legs.push({to: shore.edge, seconds: 1, hidden: true}, {to: hole, seconds: between(visits.staySeconds), hidden: true, peek: true, jump: true}, {to: shore.edge, seconds: 1, hidden: true, jump: true});
    } else {
      const x = () => shore.land.left + random() * (shore.land.right - shore.land.left);
      const a = {x: x(), y: shore.land.y}, b = {x: x(), y: shore.land.y};
      // On land it walks (its walk frames, when painted).
      legs.push({to: a, seconds: 2, walk: true}, {to: b, seconds: between(visits.staySeconds), walk: true}, {to: shore.edge, seconds: 2, walk: true});
    }
    legs.push({home: true, seconds: 2.5});
    return {instanceId: o.instanceId, legs, leg: 0, time: 0, clock: 0, from: home(o), facing: 1};
  }
  function frame(o) {
    const leg = trip.legs[trip.leg], to = leg.home ? home(o) : leg.to, t = leg.jump ? 1 : Math.min(1, trip.time / leg.seconds);
    const ease = t * t * (3 - 2 * t), x = trip.from.x + (to.x - trip.from.x) * ease, y = trip.from.y + (to.y - trip.from.y) * ease;
    if (Math.abs(to.x - trip.from.x) > .005) trip.facing = Math.sign(to.x - trip.from.x);
    return {x, y, facing: trip.facing, hidden: Boolean(leg.hidden), peek: Boolean(leg.peek), walk: Boolean(leg.walk), frame: Math.floor(trip.clock / .18)};
  }
  return {
    // Returns what changed: [{instanceId, visit}] with visit null when the picture is back.
    update(organisms, shore, dt) {
      if (trip) {
        const o = organisms.find(item => item.instanceId === trip.instanceId);
        if (!o || !free(o)) { const id = trip.instanceId; trip = null; return [{instanceId: id, visit: null}]; }
        trip.time += dt; trip.clock += dt;
        while (trip.time >= trip.legs[trip.leg].seconds) {
          const leg = trip.legs[trip.leg];
          trip.time -= leg.seconds; trip.from = leg.home ? home(o) : leg.to;
          if (++trip.leg >= trip.legs.length) { trip = null; return [{instanceId: o.instanceId, visit: null}]; }
        }
        return [{instanceId: o.instanceId, visit: frame(o)}];
      }
      if (!shore) return [];
      for (const o of organisms) {
        const visits = speciesProfiles[o.speciesId]?.motion?.visits;
        if (!visits) continue;
        const wait = (waits.get(o.instanceId) ?? between(visits.everySeconds)) - dt;
        waits.set(o.instanceId, wait);
        if (wait > 0 || !free(o)) continue;
        waits.set(o.instanceId, between(visits.everySeconds));
        trip = plan(o, shore, visits);
        return [{instanceId: o.instanceId, visit: frame(o)}];
      }
      return [];
    },
    reset() { trip = null; waits.clear(); },
  };
}
