export function hsvToHex(h, s, v) {
  s /= 100; v /= 100;
  const channel = n => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))).toString(16).padStart(2, '0');
  };
  return '#' + channel(5) + channel(3) + channel(1);
}
export function hexToHsv(hex) {
  const [r,g,b] = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255);
  const max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max - min;
  const h = delta === 0 ? 0 : max === r ? ((g-b)/delta+6)%6 : max === g ? (b-r)/delta+2 : (r-g)/delta+4;
  return [h*60, max === 0 ? 0 : delta/max*100, max*100];
}
export function mountColorPicker(form, onApply) {
  const color = form.elements.namedItem('color');
  const trigger = form.querySelector('#customcolor');
  form.querySelector('.book-colors').insertAdjacentHTML('beforeend', `
    <div class="hsv-picker" hidden>
      <div class="row"><strong>사용자 지정 색상</strong><div class="hsv-preview" aria-hidden="true"></div></div>
      <div class="hsv-channels">${[['h','색상',360],['s','채도',100],['v','밝기',100]].map(([key,label,max])=>`<div class="hsv-channel"><label for="hsv-${key}">${label}</label><input id="hsv-${key}" data-range="${key}" aria-label="${label} 슬라이더" type="range" min="0" max="${max}" step="1"><input data-number="${key}" aria-label="${label} 값${key==='h'?' (도)':' (%)'}" type="number" min="0" max="${max}" step="1" inputmode="numeric"></div>`).join('')}</div>
      <div class="row"><output class="hsv-hex"></output><span class="small">색상 ° · 채도/밝기 %</span></div>
      <div class="hsv-actions"><button type="button" class="secondary" data-hsv-cancel>취소</button><button type="button" class="primary" data-hsv-apply>색상 적용</button></div>
    </div>`);
  const panel = form.querySelector('.hsv-picker');
  const inputs = [...panel.querySelectorAll('input')];
  inputs.forEach(el => el.disabled = true);
  const apply = panel.querySelector('[data-hsv-apply]');
  let original = color.value, dirty = false;
  trigger.setAttribute('aria-expanded', 'false');
  const valid = () => [...panel.querySelectorAll('[data-number]')].every(el => el.value !== '' && el.validity.valid);
  const values = () => ['h','s','v'].map(key => Number(panel.querySelector(`[data-number="${key}"]`).value));
  const hex = () => dirty ? hsvToHex(...values()) : original;
  const preview = () => {
    apply.disabled = !valid();
    if (valid()) {
      panel.querySelector('.hsv-preview').style.background = hex();
      panel.querySelector('.hsv-hex').textContent = hex().toUpperCase();
      const [h,s,v] = values();
      panel.querySelector('[data-range="s"]').style.background = `linear-gradient(to right, ${hsvToHex(h,0,v)}, ${hsvToHex(h,100,v)})`;
      panel.querySelector('[data-range="v"]').style.background = `linear-gradient(to right, #000000, ${hsvToHex(h,s,100)})`;
    }
  };
  const close = () => { panel.hidden = true; inputs.forEach(el => el.disabled = true); trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); };
  trigger.onclick = () => {
    panel.hidden = false;
    inputs.forEach(el => el.disabled = false);
    trigger.setAttribute('aria-expanded', 'true');
    original = color.value; dirty = false;
    const hsv = hexToHsv(original);
    ['h','s','v'].forEach((key,i) => {
      const value = Math.round(hsv[i]);
      panel.querySelector(`[data-range="${key}"]`).value = value;
      panel.querySelector(`[data-number="${key}"]`).value = value;
    });
    preview();
    panel.scrollIntoView({block: 'nearest'});
  };
  panel.addEventListener('input', e => {
    const key = e.target.dataset.range || e.target.dataset.number;
    if (!key) return;
    dirty = true;
    if (e.target.value !== '' && e.target.validity.valid) {
      const selector = e.target.dataset.range ? 'data-number' : 'data-range';
      panel.querySelector(`[${selector}="${key}"]`).value = e.target.value;
    }
    preview();
  });
  panel.querySelector('[data-hsv-cancel]').onclick = close;
  apply.onclick = () => { if (valid()) {color.value = hex(); onApply(); close();} };
}
