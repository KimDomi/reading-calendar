const pad=n=>String(n).padStart(2,'0');
export const timeLabel=value=>{const [h,m]=value.split(':').map(Number);return `${h<12?'오전':'오후'} ${h%12||12}:${pad(m)}`;};
export function dialValue(x,y,minutes=false){const angle=(Math.atan2(x,-y)*180/Math.PI+360)%360;return Math.round(angle/(minutes?6:30))%(minutes?60:12);}
let dismiss=null;
export function closeTimePicker(){dismiss?.();}
const keyboardIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 12h2m2 0h2m2 0h2m2 0h2M7 16h10"/></svg>';
const clockIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>';
export function mountTimePickers(root){
  for(const input of root.querySelectorAll('input[type=time]:not([data-custom-time])')){
    input.dataset.customTime='true';input.hidden=true;
    const trigger=document.createElement('button');trigger.type='button';trigger.className='time-trigger';trigger.setAttribute('aria-haspopup','dialog');
    const sync=()=>{trigger.textContent=timeLabel(input.value||'21:00');trigger.disabled=input.disabled;trigger.setAttribute('aria-label','알림 시간 '+trigger.textContent);};
    input.after(trigger);sync();input.addEventListener('change',sync);input.addEventListener('click',e=>e.preventDefault());
    trigger.onclick=e=>{
      e.preventDefault();e.stopPropagation();closeTimePicker();
      let [hour,minute]=(input.value||'21:00').split(':').map(Number),mode='hour',manual=false,dragging=false;
      const dialog=document.createElement('dialog');dialog.className='time-picker analog-time-picker';dialog.setAttribute('aria-label','알림 시간 선택');
      const close=()=>{dismiss=null;dialog.close();dialog.remove();if(trigger.isConnected)trigger.focus();};dismiss=close;
      dialog.innerHTML=`<h2 tabindex="-1" autofocus>알림 시간</h2><div class="tp-digital"><button type="button" data-time-field="hour" class="tp-digit"></button><span class="tp-colon" aria-hidden="true">:</span><button type="button" data-time-field="minute" class="tp-digit"></button><div class="tp-period" role="group" aria-label="오전 오후"><button type="button" data-period="0">오전</button><button type="button" data-period="1">오후</button></div></div><p class="tp-step" aria-live="polite"></p><div class="tp-dial" role="group" aria-label="시계판 시간 선택"></div><div class="tp-manual" hidden><label>시<input name="clockHour" type="number" inputmode="numeric" min="1" max="12" step="1"></label><span aria-hidden="true">:</span><label>분<input name="clockMinute" type="number" inputmode="numeric" min="0" max="59" step="1"></label></div><p class="tp-error error" role="status" hidden>시는 1–12, 분은 0–59 사이의 정수로 입력해 주세요.</p><div class="tp-footer"><button type="button" class="tp-input-mode" data-time-action="mode"></button><button type="button" class="secondary" data-time-action="cancel">취소</button><button type="button" class="primary" data-time-action="apply">선택</button></div>`;
      const dial=dialog.querySelector('.tp-dial'),hourInput=dialog.querySelector('[name=clockHour]'),minuteInput=dialog.querySelector('[name=clockMinute]');
      const value=()=>`${pad(hour)}:${pad(minute)}`;
      const inputsValid=()=>hourInput.value!==''&&minuteInput.value!==''&&hourInput.validity.valid&&minuteInput.validity.valid;
      function update(){
        for(const key of ['hour','minute']){const b=dialog.querySelector(`[data-time-field="${key}"]`);b.textContent=pad(key==='hour'?(hour%12||12):minute);b.setAttribute('aria-pressed',String(mode===key));b.setAttribute('aria-label',`${key==='hour'?'시':'분'} 선택: ${key==='hour'?(hour%12||12):minute}`);}
        dialog.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.period)===Number(hour>=12))));
        dialog.querySelector('.tp-step').textContent=manual?'숫자로 시간을 입력해 주세요.':mode==='hour'?'시를 선택해 주세요.':'분을 선택해 주세요.';
        dial.hidden=manual;dialog.querySelector('.tp-manual').hidden=!manual;
        const toggle=dialog.querySelector('.tp-input-mode');toggle.innerHTML=manual?clockIcon:keyboardIcon;toggle.setAttribute('aria-label',manual?'시계판으로 선택':'숫자로 입력');
        const valid=!manual||inputsValid();dialog.querySelector('[data-time-action=apply]').disabled=!valid;dialog.querySelector('.tp-error').hidden=valid;
        if(manual)return;
        const selected=mode==='hour'?hour%12:minute,angle=selected/(mode==='hour'?12:60)*Math.PI*2,x=50+38*Math.sin(angle),y=50-38*Math.cos(angle),onLabel=mode==='hour'||minute%5===0;
        dial.innerHTML=`<svg class="tp-hand" viewBox="0 0 100 100" aria-hidden="true"><line x1="50" y1="50" x2="${x}" y2="${y}"/><circle cx="50" cy="50" r="1.7"/><circle cx="${x}" cy="${y}" r="${onLabel?7:3}"/></svg>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,n=mode==='hour'?i:i*5;return `<button type="button" class="tp-face-number" data-face="${n}" style="left:${50+38*Math.sin(a)}%;top:${50-38*Math.cos(a)}%" aria-label="${mode==='hour'?(i||12)+'시':pad(n)+'분'}" aria-pressed="${n===selected}">${mode==='hour'?(i||12):pad(n)}</button>`;}).join('')}`;
      }
      function select(n){if(mode==='hour')hour=(hour>=12?12:0)+n%12;else minute=n%60;update();}
      function fromPointer(event){const rect=dial.getBoundingClientRect(),x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2;if(Math.hypot(x,y)<10)return;select(dialValue(x,y,mode==='minute'));}
      dial.addEventListener('pointerdown',event=>{if(event.button!==0||event.isPrimary===false)return;event.preventDefault();dragging=true;dial.setPointerCapture(event.pointerId);const hit=event.target.closest('[data-face]');if(hit)select(Number(hit.dataset.face));else fromPointer(event);});
      dial.addEventListener('pointermove',event=>{if(dragging)fromPointer(event);});
      dial.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;if(mode==='hour'){mode='minute';update();dialog.querySelector('[data-time-field=minute]').focus();}});
      dial.addEventListener('pointercancel',()=>{dragging=false;});
      dialog.addEventListener('click',event=>{
        event.stopPropagation();const b=event.target.closest('button');if(!b)return;
        if(b.dataset.timeField){mode=b.dataset.timeField;manual=false;update();}
        else if(b.dataset.period!==undefined){hour=hour%12+Number(b.dataset.period)*12;update();}
        else if(b.dataset.face!==undefined&&event.detail===0){select(Number(b.dataset.face));if(mode==='hour'){mode='minute';update();dialog.querySelector('[data-time-field=minute]').focus();}}
        else if(b.dataset.timeAction==='mode'){manual=!manual;hourInput.value=hour%12||12;minuteInput.value=minute;update();}
        else if(b.dataset.timeAction==='cancel')close();
        else if(b.dataset.timeAction==='apply'&&(!manual||inputsValid())){input.value=value();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));sync();close();}
      });
      dialog.addEventListener('input',event=>{if(!manual||!['clockHour','clockMinute'].includes(event.target.name))return;if(inputsValid()){hour=Number(hourInput.value)%12+(hour>=12?12:0);minute=Number(minuteInput.value);}update();});
      dialog.addEventListener('keydown',event=>{const key=event.target.dataset.timeField;if(!key||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const max=key==='hour'?12:60,current=key==='hour'?hour%12:minute,n=event.key==='Home'?0:event.key==='End'?max-1:(current+(['ArrowUp','ArrowRight'].includes(event.key)?1:-1)+max)%max;mode=key;select(n);});
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
      update();document.body.append(dialog);dialog.showModal();
    };
  }
}
