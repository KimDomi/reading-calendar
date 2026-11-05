export function mountColorPicker(form, onApply) {
  const color = form.elements.namedItem('color');
  const trigger = form.querySelector('#customcolor');
  form.querySelector('.book-colors').insertAdjacentHTML('beforeend', `
    <div class="rgb-picker" hidden>
      <div class="row"><strong>사용자 지정 색상</strong><div class="rgb-preview" aria-hidden="true"></div></div>
      <div class="rgb-channels">${[['r','빨강 R'],['g','초록 G'],['b','파랑 B']].map(([key,label])=>`<div class="rgb-channel"><label for="rgb-${key}">${label}</label><input id="rgb-${key}" data-range="${key}" aria-label="${label} 슬라이더" type="range" min="0" max="255" step="1"><input data-number="${key}" aria-label="${label} 값" type="number" min="0" max="255" step="1" inputmode="numeric"></div>`).join('')}</div>
      <div class="row"><output class="rgb-hex"></output><span class="small">RGB 0–255</span></div>
      <div class="rgb-actions"><button type="button" class="secondary" data-rgb-cancel>취소</button><button type="button" class="primary" data-rgb-apply>색상 적용</button></div>
    </div>`);
  const panel = form.querySelector('.rgb-picker');
  const inputs = [...panel.querySelectorAll('input')];
  inputs.forEach(el => el.disabled = true);
  const apply = panel.querySelector('[data-rgb-apply]');
  trigger.setAttribute('aria-expanded', 'false');
  const valid = () => [...panel.querySelectorAll('[data-number]')].every(el => el.value !== '' && el.validity.valid);
  const hex = () => '#' + [...panel.querySelectorAll('[data-number]')].map(el => Number(el.value).toString(16).padStart(2, '0')).join('');
  const preview = () => {
    apply.disabled = !valid();
    if (valid()) {
      panel.querySelector('.rgb-preview').style.background = hex();
      panel.querySelector('.rgb-hex').textContent = hex().toUpperCase();
    }
  };
  const close = () => { panel.hidden = true; inputs.forEach(el => el.disabled = true); trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); };
  trigger.onclick = () => {
    panel.hidden = false;
    inputs.forEach(el => el.disabled = false);
    trigger.setAttribute('aria-expanded', 'true');
    ['r','g','b'].forEach((key,i) => {
      const value = parseInt(color.value.slice(1 + i * 2, 3 + i * 2), 16);
      panel.querySelector(`[data-range="${key}"]`).value = value;
      panel.querySelector(`[data-number="${key}"]`).value = value;
    });
    preview();
    panel.scrollIntoView({block: 'nearest'});
  };
  panel.addEventListener('input', e => {
    const key = e.target.dataset.range || e.target.dataset.number;
    if (!key) return;
    if (e.target.value !== '' && e.target.validity.valid) {
      const selector = e.target.dataset.range ? 'data-number' : 'data-range';
      panel.querySelector(`[${selector}="${key}"]`).value = e.target.value;
    }
    preview();
  });
  panel.querySelector('[data-rgb-cancel]').onclick = close;
  apply.onclick = () => { if (valid()) {color.value = hex(); onApply(); close();} };
}
