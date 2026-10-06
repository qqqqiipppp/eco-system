import { organismById, roleLabels } from '../../data/organisms.js';
import { forestDefinition } from '../../data/forest.js';
import { getSpeciesCount } from '../state/game-state.js';

export function renderDashboard(state) {
  document.querySelector('#stability-value').textContent = state.metrics.stability === null ? '관찰 준비' : `${state.metrics.stability}%`;
  document.querySelector('#points-value').textContent = state.metrics.points;
  document.querySelector('#diversity-value').textContent = getSpeciesCount(state);
  document.querySelector('#environment-value').textContent = forestDefinition.environmentLabel;
  const labels = ['sunlight', 'water', 'air'];
  document.querySelectorAll('.abiotic-status b').forEach((node, index) => { node.textContent = state.environment[labels[index]].label; });
}

export function renderCards(state, onSelect) {
  const list = document.querySelector('#card-list');
  list.replaceChildren();
  state.inventory.filter(item => item.acquired).forEach(({ speciesId }) => {
    const species = organismById[speciesId];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'organism-card';
    button.dataset.speciesId = speciesId;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${species.name}, ${roleLabels[species.role]}, 배치할 생물 선택`);
    // Only trusted, local species definitions are used in this template.
    const visual = species.image ? `<img class="card-art" src="${species.image}" alt="" draggable="false">` : `<span class="card-art card-placeholder" aria-hidden="true">${species.placeholder}</span>`;
    button.innerHTML = `${visual}<span><span class="card-role ${species.role}">${roleLabels[species.role]}</span><span class="card-name">${species.name}</span><span class="card-caption">${species.caption}</span></span><span class="card-selected" aria-hidden="true" hidden>✓ 선택</span>`;
    button.addEventListener('click', () => onSelect(speciesId));
    list.append(button);
  });
  document.querySelector('#card-count').textContent = list.childElementCount;
}

export function feedingFeedback(events) {
  // At most two distinct relations here. Coalesce a busy tick into one message.
  const descriptions = new Set(events.map(event => {
    const consumer = organismById[event.consumerSpeciesId];
    const food = organismById[event.foodSpeciesId];
    return `${consumer.name}가 ${food.name}${food.role === 'producer' ? '을' : '를'} 먹었어요.`;
  }));
  return [...descriptions].join(' ');
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
