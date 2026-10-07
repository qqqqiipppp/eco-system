import { organismById } from '../../data/organisms.js';
import { placementConfig, speciesProfiles } from '../../data/interaction-config.js';
import { createOrganismInstance } from '../state/organism-instance.js';

const inUnitRange = value => Number.isFinite(value) && value >= 0 && value <= 1;
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Pure screen-position validation; layout supplies normalized UI exclusions and
 * footprints. No DOM access, pixel positions or ecological conditions here.
 */
export function isPositionAllowed(speciesId, position, layout) {
  const profile = speciesProfiles[speciesId];
  const footprint = layout?.footprints?.[speciesId];
  if (!profile || !footprint || !position || !inUnitRange(position.x) || !inUnitRange(position.y)) return false;
  const zone = placementConfig.zones[profile.zone];
  if (position.x < zone.left || position.x > zone.right || position.y < zone.top || position.y > zone.bottom) return false;
  const bounds = {
    left: position.x - footprint.halfWidth, right: position.x + footprint.halfWidth,
    top: position.y - footprint.above, bottom: position.y + footprint.below,
  };
  if (bounds.left < 0 || bounds.right > 1 || bounds.top < 0 || bounds.bottom > 1) return false;
  return !layout.blockedRects.some(rect => overlaps(bounds, rect));
}

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
  return { ok: true };
}

/** Only successful placement mutates domain state. Cards are permissions, not stock. */
export function placeOrganism(state, speciesId, input, layout) {
  const result = validatePlacement(state, speciesId, input, layout);
  if (!result.ok) return result;
  // Event history outlives consumed organisms, so never reuse an ID this session.
  let sequence = state.nextInstanceSequence ?? state.organisms.length + 1;
  while (state.organisms.some(item => item.instanceId === `organism-${sequence}`)) sequence += 1;
  const instance = createOrganismInstance(speciesId, `organism-${sequence}`, input.position);
  state.organisms.push(instance);
  state.nextInstanceSequence = sequence + 1;
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
  }[result.reason];
}
