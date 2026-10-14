import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
// Teaching-game values, not measurements or a realistic population model.
export const DEBUG_MODE = false;
export const ecologyConfig = {
  tickSeconds: 0.5,
  searchRetrySeconds: 2,
  eatSeconds: 1,
  arrivalDistance: 0.025,
  maxPursuitSeconds: 18,
};
export const foodResourceConfig = {
  grass: { maximum: 3, portion: 1, recoveryPerSecond: 0.06, parts:['leaves','seeds'] },
  oak: { maximum:5,portion:.5,recoveryPerSecond:.045,parts:['acorn','leaves'] },
  pine: { maximum:4,portion:.5,recoveryPerSecond:.035,parts:['needles','seeds'] },
  raspberry: { maximum:3,portion:.5,recoveryPerSecond:.05,parts:['leaves','fruit'] },
  hazel: { maximum:4,portion:.5,recoveryPerSecond:.04,parts:['leaves','fruit'] },
};
export const feedingConfig = {
  grasshopper: { initialHunger: 0.45, hungerPerSecond: 0.035, hungryAt: 0.6, mealRelief: 0.65, searchRadius: 0.34, speed: 0.037 },
  frog: { initialHunger: 0.45, hungerPerSecond: 0.025, hungryAt: 0.6, mealRelief: 0.7, searchRadius: 0.38, speed: 0.056 },
  rabbit:{initialHunger:.2,hungerPerSecond:.012,hungryAt:.6,mealRelief:.7,searchRadius:.34,speed:.045},
  chipmunk:{initialHunger:.35,hungerPerSecond:.022,hungryAt:.6,mealRelief:.65,searchRadius:.4,speed:.065},
  'field-mouse':{initialHunger:.35,hungerPerSecond:.025,hungryAt:.6,mealRelief:.65,searchRadius:.35,speed:.035},
  caterpillar:{initialHunger:.35,hungerPerSecond:.02,hungryAt:.6,mealRelief:.65,searchRadius:.32,speed:.018},
  aphid:{initialHunger:.35,hungerPerSecond:.012,hungryAt:.6,mealRelief:.65,searchRadius:.32,speed:.026},
  snail:{initialHunger:.35,hungerPerSecond:.012,hungryAt:.6,mealRelief:.65,searchRadius:.3,speed:.014},
  spider:{initialHunger:.35,hungerPerSecond:.02,hungryAt:.6,mealRelief:.7,searchRadius:.025,speed:0,huntMode:'ambush',maxPursuitSeconds:2},
  ladybird:{initialHunger:.35,hungerPerSecond:.022,hungryAt:.6,mealRelief:.7,searchRadius:.34,speed:.038},
  tit:{initialHunger:.35,hungerPerSecond:.024,hungryAt:.6,mealRelief:.7,searchRadius:.44,speed:.085},
  bulbul:{initialHunger:.35,hungerPerSecond:.02,hungryAt:.6,mealRelief:.7,searchRadius:.44,speed:.075},
  snake:{initialHunger:.35,hungerPerSecond:.014,hungryAt:.6,mealRelief:.75,searchRadius:.4,speed:.048},
  weasel:{initialHunger:.35,hungerPerSecond:.018,hungryAt:.6,mealRelief:.75,searchRadius:.44,speed:.072},
  goshawk:{initialHunger:.35,hungerPerSecond:.014,hungryAt:.6,mealRelief:.8,searchRadius:.48,speed:.09},
};

// Search, bite, pursuit and screen movement retain their actual control cadence.
for(const rule of Object.values(foodResourceConfig))scaleFields(rule,['recoveryPerSecond'],ecologyRate);
for(const rule of Object.values(feedingConfig))scaleFields(rule,['hungerPerSecond'],ecologyRate);
