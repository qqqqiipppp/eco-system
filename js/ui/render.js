import { activityForSpecies } from '../../data/activities.js';
import {relationFor,foodPartLabels} from '../../data/food-relations.js';
import { organismById, roleLabels } from '../../data/organisms.js';
import { qualityLabel, environmentQuality, factorValue } from '../systems/environment.js';
import { getSpeciesCount } from '../state/game-state.js';
import {pointGuidance} from '../systems/point-economy.js';
import {mealSentence} from '../../data/student-text.js';
import {studentSentence} from './student-guidance.js';

export function renderDashboard(state) {
  const summary = state.metrics.stabilitySummary;
  const setText = (selector, value) => { const node = document.querySelector(selector); if (node.textContent !== String(value)) node.textContent = value; };
  setText('#stability-value', summary?.label || '관찰 준비');
  const meter = document.querySelector('#stability-meter');
  if (meter.value !== state.metrics.stability) meter.value = state.metrics.stability || 0;
  if (summary) { setText('#stability-hint', summary.hint); meter.setAttribute('aria-label', `생태계 안정도: ${summary.label}`); }
  setText('#points-value', state.metrics.points);
  const care=document.querySelector('#care-budget');if(care){care.hidden=state.round.number===1;care.textContent='이번 숲 관리 지원 '+state.round.care.remaining+' / '+state.round.care.limit+'점';}
  const round=document.querySelector('#forest-title span');if(round)round.textContent=String(state.round.number).padStart(2,'0');
  setText('#management-status', state.managementEffects.length ? '서식지 회복 중이에요. 한동안 식물의 성장과 먹이 회복을 도와요.' : studentSentence(pointGuidance(state)));
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
    return relation?mealSentence(relation):'';
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
    panel.innerHTML = '<p>생물 카드를 고르면 숲에 놓을 수 있어요. 생물을 누르면 살펴봐요.</p>';
    return;
  }
  panel.innerHTML = `<div class="selection-topline"><h3>${species.name} · 원하는 곳을 누르면 가까운 자리에 놓아요.</h3><button class="clear-selection" type="button">고르기 취소</button></div>`;
  panel.querySelector('button').addEventListener('click', onClear);
}
