import {hsvPickerHTML,mountHSVPicker} from './color-picker.js?v=6cacb29b93e5';

let dismiss=null;
export function closeTimerColorPicker(){dismiss?.();}
export function openTimerColorPicker({color,defaultColor,trigger,onApply}){
  closeTimerColorPicker();
  const dialog=document.createElement('dialog');dialog.className='timer-color-picker';
  dialog.setAttribute('aria-label','타이머 색상 선택');
  const presets=[[defaultColor,'기본 · 세이지'],['#859dc1','블루'],['#b194b5','라벤더'],['#cf9875','테라코타'],['#8d8d96','그레이']];
  dialog.innerHTML=`<h2 tabindex="-1" autofocus>타이머 색상</h2><div class="timer-color-presets" role="group" aria-label="추천 색상">${presets.map(([hex,label])=>`<button type="button" data-timer-color="${hex}" style="--swatch:${hex}" aria-label="${label}" title="${label}"></button>`).join('')}</div>${hsvPickerHTML('timer-hsv','미리보기')}<p class="error timer-color-error" role="alert" hidden></p>`;
  const close=()=>{dismiss=null;dialog.close();dialog.remove();if(trigger.isConnected)trigger.focus();};dismiss=close;
  const picker=mountHSVPicker(dialog.querySelector('.hsv-picker'),{
    onClose:close,
    onPreview:hex=>{dialog.querySelectorAll('[data-timer-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.timerColor.toLowerCase()===hex.toLowerCase())));},
    onApply:hex=>{try{onApply(hex);return true;}catch(error){const message=dialog.querySelector('.timer-color-error');message.hidden=false;message.textContent=error.message;return false;}}
  });
  dialog.querySelectorAll('[data-timer-color]').forEach(button=>button.onclick=()=>picker.setColor(button.dataset.timerColor));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  picker.open(color);document.body.append(dialog);dialog.showModal();
}
