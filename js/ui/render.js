import { activityForSpecies } from '../../data/activities.js';
import {relationFor,foodPartLabels} from '../../data/food-relations.js';
import { organismById, roleLabels } from '../../data/organisms.js';
import { qualityLabel, environmentQuality, factorValue } from '../systems/environment.js';
import { getSpeciesCount } from '../state/game-state.js';
import {pointGuidance} from '../systems/point-economy.js';

export function renderDashboard(state) {
  const summary = state.metrics.stabilitySummary;
  const setText = (selector, value) => { const node = document.querySelector(selector); if (node.textContent !== String(value)) node.textContent = value; };
  setText('#stability-value', summary?.label || '관찰 준비');
  const meter = document.querySelector('#stability-meter');
  if (meter.value !== state.metrics.stability) meter.value = state.metrics.stability || 0;
  if (summary) { setText('#stability-hint', summary.hint); meter.setAttribute('aria-label', `생태계 안정도: ${summary.label}`); }
  setText('#points-value', state.metrics.points);
  setText('#management-status', state.managementEffects.length ? '서식지 회복 중이에요. 한동안 식물의 성장과 먹이 회복을 도와요.' : pointGuidance(state));
  setText('#diversity-value', getSpeciesCount(state));
  setText('#environment-value', qualityLabel(environmentQuality(state.environment)));
  const labels = ['sunlight', 'water', 'air', 'soil'];
  document.querySelectorAll('.abiotic-status b').forEach((node, index) => { const label = qualityLabel(factorValue(state.environment, labels[index])); if (node.textContent !== label) node.textContent = label; });
}

export function renderCards(state, onSelect, onLocked = () => {}) {
  const list = document.querySelector('#card-list');
  list.replaceChildren();
  state.inventory.forEach(({ speciesId, acquired }) => {
    const species = organismById[speciesId];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = acquired ? 'organism-card' : 'organism-card locked-card';
    button.dataset.locked = String(!acquired);
    button.dataset.speciesId = speciesId;
    button.setAttribute('aria-pressed', 'false');
    const unlock=activityForSpecies[speciesId];
    const upcoming=!acquired&&!unlock;
    button.dataset.upcoming=String(upcoming);
    button.setAttribute('aria-label', acquired ? `${species.name}, ${roleLabels[species.role]}, 배치할 생물 선택` : `${species.name}, 잠김, ${upcoming?'추후 해금 예정':'해금 조건 보기'}`);
    // Only trusted, local species definitions are used in this template.
    const visual = species.image ? `<img class="card-art" src="${species.image}" alt="" draggable="false">` : `<span class="card-art card-placeholder" aria-hidden="true">${species.placeholder}</span>`;
    button.innerHTML = `${visual}<span><span class="card-role ${species.role}">${roleLabels[species.role]}</span><span class="card-name">${species.name}</span><span class="card-caption">${acquired ? species.caption : '🔒 ' + (unlock?.unlockHint||'추후 해금 예정')}</span></span><span class="card-selected" aria-hidden="true" hidden>✓ 선택</span>`;
    button.addEventListener('click', () => acquired ? onSelect(speciesId) : onLocked(unlock?.activityId));
    list.append(button);
  });
  document.querySelector('#card-count').textContent = `${state.inventory.filter(item=>item.acquired).length} / ${state.inventory.length}`;
}

export function feedingFeedback(events) {
  // Coalesce a busy web tick into at most two readable examples.
  const descriptions = new Set(events.map(event => {
    const consumer = organismById[event.consumerSpeciesId];
    const food = organismById[event.foodSpeciesId];
    const relation=relationFor(food.id,consumer.id);
    if(relation?.core)return `${consumer.name}가 ${food.name}${food.role==='producer'?'을':'를'} 먹었어요.`;
    return relation?.feedingMode==='resource'?`${consumer.name}: ${food.name}의 ${foodPartLabels[relation.foodPart]}에서 먹이를 얻었어요.`:`${consumer.name}가 ${food.name}를 먹었어요.`;
  }));
  const examples=[...descriptions];return examples.slice(0,2).join(' ')+(examples.length>2?' 다른 먹이 관계도 일어났어요.':'');
}

export function renderSelection(uiState, onClear) {
  document.querySelectorAll('.organism-card').forEach(button => {
    const selected = button.dataset.speciesId === uiState.selectedSpeciesId;
    button.setAttribute('aria-pressed', String(selected));
    button.querySelector('.card-selected').hidden = !selected;
  });
  const panel = document.querySelector('#selection-panel');
  const species = organismById[uiState.selectedSpeciesId];
  if (!species) {
    panel.innerHTML = '<h3>어떤 생물을 놓아 볼까요?</h3><p>카드를 고른 다음<br>숲의 표시된 영역을 눌러 주세요.</p><span class="selection-hint">카드 터치 → 숲 위치 터치</span>';
    return;
  }
  panel.innerHTML = `<div class="selection-topline"><h3>${species.name} · ${roleLabels[species.role]}</h3><button class="clear-selection" type="button">선택 해제</button></div><p>${species.description}</p><span class="selection-hint">숲의 표시된 영역을 터치해 놓아 주세요.</span>`;
  panel.querySelector('button').addEventListener('click', onClear);
}
