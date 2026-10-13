import {developmentRules} from '../../data/development-config.js';

export function stageAt(speciesId,progressSeconds){
  const rule=developmentRules[speciesId];
  return rule?.stages.findLast(stage=>progressSeconds>=stage.at)?.id;
}
export function createDevelopmentState(speciesId,origin='introduced'){
  const rule=developmentRules[speciesId];
  if(!rule||rule.model==='learning')return undefined;
  const young=['seed-spread','egg-hatch','birth'].includes(origin);
  const progressSeconds=rule.model==='colony'||young?0:rule.maxSeconds;
  return {origin,progressSeconds,stage:stageAt(speciesId,progressSeconds)};
}
