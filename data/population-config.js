import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
import {survivalConfig} from './survival-config.js';
// Active game seconds; teaching trial values, never real biological rates.
export const populationConfig = {
  graceSeconds:120, restoreGraceSeconds:30, severeHunger:.85,
  severeAfter:60, weakAfter:180, deathAfter:360, weakActivity:.65,
  supportReliefSeconds:60, historyLimit:80, noticeLimit:6,
  introductionCooldown:60, bootstrap:{producer:6,consumer:3,decomposer:3},
  speciesCap:{producer:8,consumer:8,decomposer:3},
  recentMealSeconds:45, minimumEnvironment:.6, maxHealthyHunger:.8,
  localRadius:.08, localLimit:4,
};
export const starvationLimits={frog:420,rabbit:540,chipmunk:480,'field-mouse':480,snail:480,tit:480,bulbul:480,snake:600,weasel:600,goshawk:600};
// A successful animal meal provides time to rebuild the web before another hunt.
export const satietySeconds={frog:300,'field-mouse':90,spider:90,ladybird:90,tit:120,snake:360,weasel:300,goshawk:420};
export const reproductionRules={
  grass:{mode:'seed-spread',minimum:1,maximum:8,healthySeconds:180,cooldown:240},
  grasshopper:{mode:'animal',minimum:2,maximum:8,healthySeconds:240,cooldown:360},
  rabbit:{mode:'animal',minimum:2,maximum:4,healthySeconds:360,cooldown:480},
};
export const decompositionConfig={maximum:30,litterPerProducer:.004,woodPerTree:.002,backgroundRate:.001,
  rates:{mushroom:{wood:.006},'litter-mold':{litter:.006},'soil-bacteria':{remains:.006}},
  nutrientYield:.03,nutrientUsePerProducer:.00005,maximumGrowthBonus:.12,starvationMatter:1};

scaleFields(populationConfig,['graceSeconds','restoreGraceSeconds','severeAfter','weakAfter','deathAfter','supportReliefSeconds','recentMealSeconds']);
for(const key of Object.keys(starvationLimits))starvationLimits[key]=ecologySeconds(starvationLimits[key]);
for(const key of Object.keys(satietySeconds))satietySeconds[key]=ecologySeconds(satietySeconds[key])*survivalConfig.satietyScale/.5;
for(const rule of Object.values(reproductionRules))scaleFields(rule,['healthySeconds','cooldown']);
scaleFields(decompositionConfig,['litterPerProducer','woodPerTree','backgroundRate','nutrientUsePerProducer'],ecologyRate);
for(const rates of Object.values(decompositionConfig.rates))for(const key of Object.keys(rates))rates[key]=ecologyRate(rates[key]);
