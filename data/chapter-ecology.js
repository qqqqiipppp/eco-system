// Chapter mode's own changes to the shared ecology, made once at start
// (main.js, and the chapter test fixtures). Forest mode keeps its own.
import {useChapterFoodRelations,chapterFoodRelations} from './food-relations.js';
import {addDiscoveryEvent,discoveryEvents} from './event-config.js';
import {satietySeconds} from './population-config.js';
import {useGrownTrees} from './interaction-config.js';
import {sceneSpaces} from './forest-spaces.js';

export function useChapterEcology(){
  useChapterFoodRelations();
  for(const r of chapterFoodRelations)if(!discoveryEvents[r.relationId])addDiscoveryEvent(r);
  // A chipmunk that caught an insect is full for a while, like a frog.
  satietySeconds.chipmunk ??= satietySeconds.frog;
  useGrownTrees();
  sceneSpaces.grownTrees = true;
}
