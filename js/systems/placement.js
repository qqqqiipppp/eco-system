import { organismById } from '../../data/organisms.js';
import { placementConfig, speciesProfiles } from '../../data/interaction-config.js';
import {addOrganism} from './lifecycle.js';
import {validateIntroduction,recordIntroduction} from './population.js';
import {isPositionAllowed} from './placement-rules.js';
import {noteGoalIntroduction} from './learning-goals.js';
export {isPositionAllowed} from './placement-rules.js';

export function validatePlacement(state, speciesId, input, layout) {
  if (!speciesId || !organismById[speciesId]) return { ok: false, reason: 'selection' };
  if (!state.inventory.some(item => item.speciesId === speciesId && item.acquired)) return { ok: false, reason: 'inventory' };
  if (!input?.isPlayArea || input.isUI || !isPositionAllowed(speciesId, input.position, layout)) return { ok: false, reason: 'area' };
  if (state.organisms.length >= placementConfig.maxOrganisms) return { ok: false, reason: 'limit' };
  if (speciesProfiles[speciesId].largePlant && state.organisms.some(item =>
    speciesProfiles[item.speciesId]?.largePlant &&
    Math.abs(item.position.x - input.position.x) < placementConfig.largePlantSpacing.x &&
    Math.abs(item.position.y - input.position.y) < placementConfig.largePlantSpacing.y
  )) return { ok: false, reason: 'overlap' };
  return validateIntroduction(state,speciesId,input.position,layout);
}

/** Only successful placement mutates domain state. Cards are permissions, not stock. */
export function placeOrganism(state, speciesId, input, layout) {
  const result = validatePlacement(state, speciesId, input, layout);
  if (!result.ok) return result;
  const instance=addOrganism(state,speciesId,input.position,result.reintroduction?'reintroduction':'placement');
  recordIntroduction(state,speciesId);
  noteGoalIntroduction(state,instance);
  return { ok: true, instance };
}

export function placementMessage(result) {
  if (result.ok) {
    const species = organismById[result.instance.speciesId];
    return speciesProfiles[species.id].wanders
      ? `${species.name} 배치 완료! 숲에 합류했어요.`
      : `${species.name} 배치 완료! 숲에 자리 잡았어요.`;
  }
  return {
    selection: '먼저 생물 카드를 골라 주세요.',
    inventory: '아직 획득하지 않은 카드예요.',
    area: '이곳에는 배치할 수 없어요. 표시된 영역을 눌러 주세요.',
    overlap: '나무끼리 너무 가까워요. 조금 떨어진 곳에 놓아 주세요.',
    limit: `지금은 생물을 ${placementConfig.maxOrganisms}개까지 놓을 수 있어요.`,
  }[result.reason]||result.message;
}
