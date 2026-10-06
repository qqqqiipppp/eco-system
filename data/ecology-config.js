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
  grass: { maximum: 3, portion: 1, recoveryPerSecond: 0.06 },
};
export const feedingConfig = {
  grasshopper: { initialHunger: 0.45, hungerPerSecond: 0.035, hungryAt: 0.6, mealRelief: 0.65, searchRadius: 0.34, speed: 0.037 },
  frog: { initialHunger: 0.45, hungerPerSecond: 0.025, hungryAt: 0.6, mealRelief: 0.7, searchRadius: 0.38, speed: 0.056 },
};
