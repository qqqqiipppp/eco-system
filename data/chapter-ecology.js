// Chapter mode's own changes to the shared ecology, made once at start
// (main.js, and the chapter test fixtures). Forest mode keeps its own.
import {useChapterFoodRelations,chapterFoodRelations} from './food-relations.js';
import {addDiscoveryEvent,discoveryEvents} from './event-config.js';
import {satietySeconds} from './population-config.js';
import {useGrownTrees,useLargeAnimals} from './interaction-config.js';
import {sceneSpaces} from './forest-spaces.js';

export function useChapterEcology(){
  useChapterFoodRelations();
  for(const r of chapterFoodRelations)if(!discoveryEvents[r.relationId])addDiscoveryEvent(r);
  // A chipmunk or bulbul that caught an animal is full for a while, like a frog.
  satietySeconds.chipmunk ??= satietySeconds.frog;
  satietySeconds.bulbul ??= satietySeconds.frog;
  useGrownTrees();
  useLargeAnimals();
  sceneSpaces.grownTrees = true;
}
