import {holidays} from './holidays.js?v=e4f0f7db7f96';
const pad=n=>String(n).padStart(2,'0');
const dateOf=(y,m,d)=>`${String(y).padStart(4,'0')}-${pad(m)}-${pad(d)}`;
const localToday=()=>{const d=new Date();return dateOf(d.getFullYear(),d.getMonth()+1,d.getDate());};
const label=date=>`${Number(date.slice(0,4))}년 ${Number(date.slice(5,7))}월 ${Number(date.slice(8))}일`;
let dismiss=null;
export function closeDatePicker(){dismiss?.();}
export function dateAllowed(date,min='',max='') {return /^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date&&(!min||date>=min)&&(!max||date<=max);}
export function mountDatePickers(root) {
  for(const input of root.querySelectorAll('input[type=date]:not([data-custom-date])')) {
    input.dataset.customDate='true';input.hidden=true;
    const button=document.createElement('button');button.type='button';button.className='date-trigger';button.setAttribute('aria-haspopup','dialog');
    const fieldName=input.getAttribute('aria-label')||input.closest('label')?.textContent.trim()||'날짜';
    const sync=()=>{button.textContent=input.value?label(input.value):'날짜 선택';button.disabled=input.disabled;button.setAttribute('aria-label',`${fieldName}: ${button.textContent}`);};
    input.after(button);sync();input.addEventListener('input',sync);input.addEventListener('change',sync);
    input.addEventListener('click',e=>e.preventDefault());
    input.addEventListener('invalid',e=>{e.preventDefault();button.focus();button.setAttribute('aria-invalid','true');button.textContent='날짜를 선택해 주세요';});
    button.onclick=e=>{e.preventDefault();e.stopPropagation();openDatePicker(input,button,fieldName,()=>{button.removeAttribute('aria-invalid');sync();});};
  }
}
function openDatePicker(input,trigger,title,onApply) {
  closeDatePicker();
  const dialog=document.createElement('dialog');dialog.className='date-picker';dialog.setAttribute('aria-label',title);
  const min=input.min||'0001-01-01',max=input.max||'9999-12-31',today=localToday();
  let selected=input.value||today;selected=selected<min?min:selected>max?max:selected;
  let year=Number(selected.slice(0,4)),month=Number(selected.slice(5,7)),mode='days',focusDate=selected;
  const close=()=>{dismiss=null;dialog.close();dialog.remove();if(trigger.isConnected)trigger.focus();};
  dismiss=close;
  function move(amount){const value=year*12+month-1+amount;year=Math.floor(value/12);month=value%12+1;}
  function render(){
    const withinYear=y=>y>=Number(min.slice(0,4))&&y<=Number(max.slice(0,4));
    const monthAllowed=(y,m)=>dateOf(y,m,1).slice(0,7)>=min.slice(0,7)&&dateOf(y,m,1).slice(0,7)<=max.slice(0,7);
    let content='';
    if(mode==='days'){
      const first=dateOf(year,month,1),offset=new Date(first+'T12:00:00Z').getUTCDay(),length=new Date(Date.parse(first+'T12:00:00Z')+32*86400000);length.setUTCDate(0);
      if(focusDate.slice(0,7)!==first.slice(0,7)||!dateAllowed(focusDate,min,max))focusDate=first<min?min:first;
      content=`<div class="dp-week" aria-hidden="true">${[...'일월화수목금토'].map(w=>`<span>${w}</span>`).join('')}</div><div class="dp-grid" role="group" aria-label="날짜">${'<span></span>'.repeat(offset)}${Array.from({length:length.getUTCDate()},(_,i)=>{const d=dateOf(year,month,i+1),weekday=(offset+i)%7,holiday=holidays[d];return `<button type="button" data-picker-date="${d}" class="${holiday||weekday===0?'dp-red':weekday===6?'dp-blue':''} ${d===today?'dp-today':''}" aria-label="${label(d)}${holiday?' '+holiday.join(', '):''}" aria-pressed="${d===selected}" tabindex="${d===focusDate?0:-1}" ${dateAllowed(d,min,max)?'':'disabled'}>${i+1}</button>`}).join('')}</div>`;
    }else if(mode==='months'){
      content=`<div class="dp-options">${Array.from({length:12},(_,i)=>`<button type="button" data-picker-month="${i+1}" ${monthAllowed(year,i+1)?'':'disabled'}>${i+1}월</button>`).join('')}</div>`;
    }else{
      const first=Math.floor((year-1)/12)*12+1;
      content=`<div class="dp-options">${Array.from({length:12},(_,i)=>`<button type="button" data-picker-year="${first+i}" ${withinYear(first+i)?'':'disabled'}>${first+i}년</button>`).join('')}</div>`;
    }
    dialog.innerHTML=`<h2 tabindex="-1" autofocus></h2><div class="dp-toolbar"><button type="button" data-dp="prev" aria-label="이전 ${mode==='days'?'달':mode==='months'?'해':'연도 목록'}">‹</button><button type="button" data-dp="heading" aria-label="${mode==='days'?'월 선택':mode==='months'?'연도 선택':'날짜 선택으로 돌아가기'}">${mode==='days'?`${year}년 ${month}월`:mode==='months'?`${year}년`:`${Math.floor((year-1)/12)*12+1}–${Math.floor((year-1)/12)*12+12}년`}</button><button type="button" data-dp="next" aria-label="다음 ${mode==='days'?'달':mode==='months'?'해':'연도 목록'}">›</button></div>${content}<div class="dp-selection" aria-live="polite">${label(selected)}</div><div class="dp-footer"><button type="button" data-dp="today" class="secondary" ${dateAllowed(today,min,max)?'':'disabled'}>오늘</button><button type="button" data-dp="cancel" class="secondary">취소</button><button type="button" data-dp="apply" class="primary">선택</button></div>`;
    dialog.querySelector('h2').textContent=title;
    const index=year*12+month-1;
    const minIndex=Number(min.slice(0,4))*12+Number(min.slice(5,7))-1,maxIndex=Number(max.slice(0,4))*12+Number(max.slice(5,7))-1;
    dialog.querySelector('[data-dp=prev]').disabled=mode==='days'?index-1<minIndex:mode==='months'?!withinYear(year-1):Math.floor((year-1)/12)*12<Number(min.slice(0,4));
    dialog.querySelector('[data-dp=next]').disabled=mode==='days'?index+1>maxIndex:mode==='months'?!withinYear(year+1):Math.floor((year-1)/12)*12+13>Number(max.slice(0,4));
  }
  dialog.addEventListener('click',e=>{
    e.stopPropagation();const b=e.target.closest('button');if(!b)return;
    const action=b.dataset.dp;
    if(b.dataset.pickerDate){selected=b.dataset.pickerDate;focusDate=selected;render();dialog.querySelector(`[data-picker-date="${selected}"]`)?.focus();return;}
    if(b.dataset.pickerMonth){month=Number(b.dataset.pickerMonth);mode='days';focusDate=dateOf(year,month,1);}
    else if(b.dataset.pickerYear){year=Number(b.dataset.pickerYear);mode='months';}
    else if(action==='cancel'){close();return;}
    else if(action==='apply'){input.value=selected;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));onApply();close();return;}
    else if(action==='today'){selected=today;focusDate=today;year=Number(today.slice(0,4));month=Number(today.slice(5,7));mode='days';}
    else if(action==='heading')mode=mode==='days'?'months':mode==='months'?'years':'days';
    else if(action==='prev'||action==='next')move((action==='prev'?-1:1)*(mode==='days'?1:mode==='months'?12:144));
    render();dialog.querySelector('[data-dp=heading]').focus();
  });
  dialog.addEventListener('keydown',e=>{
    if(!e.target.dataset.pickerDate)return;
    const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(!(e.key in steps))return;
    e.preventDefault();const date=new Date(e.target.dataset.pickerDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+steps[e.key]);const next=date.toISOString().slice(0,10);if(!dateAllowed(next,min,max))return;
    focusDate=next;year=date.getUTCFullYear();month=date.getUTCMonth()+1;render();dialog.querySelector(`[data-picker-date="${next}"]`)?.focus();
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  render();document.body.append(dialog);dialog.showModal();
}
