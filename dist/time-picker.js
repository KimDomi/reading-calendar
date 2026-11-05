const pad=n=>String(n).padStart(2,'0');
export const timeLabel=value=>{const [h,m]=value.split(':').map(Number);return `${h<12?'오전':'오후'} ${h%12||12}:${pad(m)}`;};
let dismiss=null;
export function closeTimePicker(){dismiss?.();}
export function mountTimePickers(root){
  for(const input of root.querySelectorAll('input[type=time]:not([data-custom-time])')){
    input.dataset.customTime='true';input.hidden=true;
    const trigger=document.createElement('button');trigger.type='button';trigger.className='time-trigger';trigger.setAttribute('aria-haspopup','dialog');
    const sync=()=>{trigger.textContent=timeLabel(input.value||'21:00');trigger.disabled=input.disabled;trigger.setAttribute('aria-label','알림 시간 '+trigger.textContent);};
    input.after(trigger);sync();input.addEventListener('change',sync);input.addEventListener('click',e=>e.preventDefault());
    trigger.onclick=e=>{e.preventDefault();e.stopPropagation();closeTimePicker();let [hour,minute]=(input.value||'21:00').split(':').map(Number);
      const dialog=document.createElement('dialog');dialog.className='time-picker';dialog.setAttribute('aria-label','알림 시간 선택');
      const close=()=>{dismiss=null;dialog.close();dialog.remove();if(trigger.isConnected)trigger.focus();};dismiss=close;
      dialog.innerHTML=`<h2 tabindex="-1" autofocus>알림 시간</h2><p class="tp-preview" aria-live="polite"></p><div class="tp-columns">${[['hour','시',24],['minute','분',60]].map(([key,label,count])=>`<div><p class="tp-label">${label}</p><div class="tp-list" role="listbox" aria-label="${label} 선택" data-time-list="${key}">${Array.from({length:count},(_,i)=>`<button type="button" role="option" data-time-part="${key}" data-time-value="${i}">${pad(i)}${label}</button>`).join('')}</div></div>`).join('')}</div><div class="tp-footer"><button type="button" class="secondary" data-time-action="cancel">취소</button><button type="button" class="primary" data-time-action="apply">선택</button></div>`;
      const value=()=>`${pad(hour)}:${pad(minute)}`;
      function update(){dialog.querySelector('.tp-preview').textContent=timeLabel(value());dialog.querySelectorAll('[data-time-part]').forEach(b=>{const selected=Number(b.dataset.timeValue)===(b.dataset.timePart==='hour'?hour:minute);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});}
      function scrollSelected(){dialog.querySelectorAll('.tp-list').forEach(list=>{const selected=list.querySelector('[aria-selected=true]');list.scrollTop=selected.offsetTop-(list.clientHeight-selected.offsetHeight)/2;});}
      dialog.addEventListener('click',event=>{event.stopPropagation();const b=event.target.closest('button');if(!b)return;
        if(b.dataset.timePart){if(b.dataset.timePart==='hour')hour=Number(b.dataset.timeValue);else minute=Number(b.dataset.timeValue);update();}
        else if(b.dataset.timeAction==='cancel')close();
        else if(b.dataset.timeAction==='apply'){input.value=value();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));sync();close();}
      });
      dialog.addEventListener('keydown',event=>{const key=event.target.dataset.timePart;if(!key||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const max=key==='hour'?23:59,current=key==='hour'?hour:minute;const next=event.key==='Home'?0:event.key==='End'?max:Math.max(0,Math.min(max,current+(event.key==='ArrowUp'?-1:1)));if(key==='hour')hour=next;else minute=next;update();dialog.querySelector(`[data-time-part="${key}"][data-time-value="${next}"]`).focus();});
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
      update();document.body.append(dialog);dialog.showModal();scrollSelected();
    };
  }
}
