import { environmentFactors, environmentLevels, producerGrowth, growthConfig, activityConfig } from '../../data/environment-config.js';

export function factorValue(environment, key) {
  const value = environment?.[key]?.value;
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}
export function qualityLabel(value) { return value >= 0.8 ? '좋음' : value >= 0.4 ? '보통' : '나쁨'; }
export function environmentQuality(environment) {
  const values = Object.keys(environmentFactors).map(key => factorValue(environment, key));
  return values.reduce((a, b) => a + b, 0) / values.length;
}
export function setEnvironmentLevel(state, factor, level) {
  if (!Object.hasOwn(environmentFactors, factor) || !Object.hasOwn(environmentLevels, level)) return false;
  state.environment[factor] = { value: environmentLevels[level].value };
  return true;
}
export function growthSuitability(speciesId, environment) {
  const profile = producerGrowth[speciesId];
  if (!profile) return 1;
  return Object.entries(profile.weights).reduce((value, [key, weight]) => value * Math.pow(factorValue(environment, key), weight), 1);
}
export function updateProducerGrowth(instance, seconds, environment, recoveryMultiplier = 1) {
  if (!producerGrowth[instance.speciesId]) return;
  const target = Math.max(growthConfig.minimumGrowth, growthSuitability(instance.speciesId, environment));
  const current = instance.growth ?? 1;
  const speed = target < current ? growthConfig.declinePerSecond : growthConfig.recoveryPerSecond * recoveryMultiplier;
  instance.growth = current + Math.sign(target - current) * Math.min(Math.abs(target - current), speed * seconds);
}
export function animalActivity(environment) {
  return activityConfig.minimum + activityConfig.airWeight * factorValue(environment, 'air');
}
