import { environmentFactors, environmentLevels } from '../../data/environment-config.js';
import { factorValue } from '../systems/environment.js';

export function bindEnvironmentPanel(state, onChange) {
  const dialog = document.querySelector('#environment-dialog');
  const fields = document.querySelector('#environment-fields');
  for (const [key, factor] of Object.entries(environmentFactors)) {
    const label = document.createElement('label');
    label.textContent = factor.name;
    const select = document.createElement('select');
    select.name = key;
    select.setAttribute('aria-label', `${factor.name} 상태`);
    for (const [level, definition] of Object.entries(environmentLevels)) {
      const option = document.createElement('option');
      option.value = level; option.textContent = definition.label;
      option.selected = definition.value === factorValue(state.environment, key);
      select.append(option);
    }
    select.addEventListener('change', () => onChange(key, select.value));
    label.append(select); fields.append(label);
  }
  document.querySelector('#environment-open').addEventListener('click', () => {
    for (const select of fields.querySelectorAll('select')) {
      select.value = Object.keys(environmentLevels).find(level => environmentLevels[level].value === factorValue(state.environment,select.name));
    }
    dialog.showModal();
  });
  document.querySelector('#environment-close').addEventListener('click', () => dialog.close());
}
