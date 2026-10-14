import {activityById} from './activities.js';
import {discoveryEvents} from './event-config.js';
import {environmentFactors} from './environment-config.js';
import {legacyRelationIds} from './legacy-ecology.js';
import {rewardConfig} from './management-actions.js';

// Classroom trial budget, not time/attendance/click rewards.
export const pointEconomyConfig={studyReward:4,studyLimit:5,studyMaximum:20,minimumChange:.1,minimumEnvironment:.4,supportMaximum:28,ledgerLimit:100,epsilon:1e-7};
export const recoveryChoices=[{id:'natural',label:'사건 뒤 자연 회복'},{id:'care',label:'실제로 환경을 개선한 관리'},{id:'mixed',label:'관리와 자연 변화 모두'},{id:'rain',label:'비가 공급한 물'},{id:'none',label:'환경 회복은 아직 확인되지 않음'}];
export const legacyRewardAmounts=new Map([
 ...Object.keys(discoveryEvents).map(id=>[`observation:${id}`,rewardConfig.observation]),
 ...[...legacyRelationIds].map(id=>[`observation:${id}`,rewardConfig.observation]),
 ...Object.keys(environmentFactors).map(id=>[`question:producer_${id}_limit`,rewardConfig.question]),
 ...['water','soil'].map(id=>[`management:${id}_shortage_resolved`,rewardConfig.management]),
 ...Object.values(activityById).map(a=>[`activity:${a.activityId}`,a.pointReward]),
]);
