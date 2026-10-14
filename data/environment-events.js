import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
// Active game seconds and qualitative teaching trials, not weather forecasts
// or species-specific pollution thresholds. No mortality coefficients here.
export const environmentEventConfig={
 initialDelay:480,interval:720,postpone:120,repeatCooldown:1800,
 minimumStability:45,minimumStartValue:.6,minimumPoints:6,
 limitedIntensity:.6,minimumFloor:.35,limitedFloor:.45,recoveryCeiling:.8,
 historyLimit:20,evidenceLimit:5,responseLimit:20,epsilon:1e-7,
};
export const environmentEventDefinitions={
 drought:{name:'가뭄',factor:'water',duration:180,recoverySeconds:240,magnitude:-.65,
  cause:'한동안 비가 적게 내려 숲이 건조해지고 있어요.',
  expected:'물이 줄면 식물 성장과 먹이 회복이 느려질 수 있어요. 필요할 때 기존 물 환경 개선을 선택하거나 회복을 지켜봐요.'},
 rain:{name:'비 내림',factor:'water',duration:120,recoverySeconds:0,magnitude:.45,
  cause:'비가 내려 숲에 물이 공급되고 있어요.',
  expected:'물 상태가 나아지면 식물 회복에 도움이 될 수 있어요. 이미 비가 오고 있다면 우선 기다려도 좋아요. 이번 비는 홍수가 아니에요.'},
 cloudy:{name:'흐린 날씨',factor:'sunlight',duration:120,recoverySeconds:240,magnitude:-.65,
  cause:'구름이 많아 숲에 햇빛이 적게 들어오고 있어요.',
  expected:'식물 성장과 먹이 회복이 느려질 수 있어요. 구름이 걷히는지 지켜봐요. 흐린 날씨는 공기 오염과 달라요.'},
 'air-pollution':{name:'공기 오염',factor:'air',duration:120,recoverySeconds:240,magnitude:-.65,
  cause:'밖에서 오염된 공기가 들어와 공기 상태가 나빠지고 있어요.',
  expected:'성장과 동물의 움직임에 영향이 있을 수 있어요. 유입이 끝난 뒤 회복을 지켜봐요. 공기가 나쁘면 기존 서식지 회복도 살펴봐요.'},
 'soil-damage':{name:'숲 바닥 훼손',factor:'soil',duration:180,recoverySeconds:240,magnitude:-.65,
  cause:'사람들이 길을 벗어나 숲 바닥을 자주 밟아 흙이 영향을 받고 있어요.',
  expected:'식물과 분해자 활동에 영향이 있을 수 있어요. 기존 토양 돌보기를 살펴봐요. 서식지 회복은 흙 수치를 직접 올리지는 않아요.'},
};
export const environmentEventSequence=['drought','rain','cloudy','air-pollution','soil-damage'];

scaleFields(environmentEventConfig,['initialDelay','interval','postpone','repeatCooldown']);
for(const rule of Object.values(environmentEventDefinitions))scaleFields(rule,['duration','recoverySeconds']);
