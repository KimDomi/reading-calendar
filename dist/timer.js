const storageKey = 'reading-calendar-timer-v1';
let timer = {status:'idle', minutes:25, remaining:1500000, endsAt:null};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && ['idle','running','paused','complete'].includes(saved.status) && Number.isInteger(saved.minutes) && saved.minutes >= 1 && saved.minutes <= 1440 && Number.isFinite(saved.remaining) && saved.remaining >= 0 && saved.remaining <= saved.minutes * 60000 && (saved.status !== 'running' || Number.isFinite(saved.endsAt))) timer = saved;
} catch {}
export function remainingTime(state, now = Date.now()) {
  return Math.max(0, Math.min(state.minutes * 60000, state.status === 'running' ? state.endsAt - now : state.remaining));
}
export function timerIsRunning(){return timer.status==='running'&&remainingTime(timer)>0;}
export function sectorPath(fraction) {
  if (fraction <= 0) return '';
  if (fraction >= 1) return 'M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z';
  const angle = fraction * Math.PI * 2;
  const x = 50 + 50 * Math.sin(angle), y = 50 - 50 * Math.cos(angle);
  return `M50 50 L50 0 A50 50 0 ${fraction > .5 ? 1 : 0} 1 ${x} ${y} Z`;
}
let saveFailed = false;
function save() {try {localStorage.setItem(storageKey, JSON.stringify(timer));saveFailed=false;} catch {saveFailed=true;}}
function finishIfNeeded() {
  if (timer.status === 'running' && remainingTime(timer) === 0) {timer.status='complete';timer.remaining=0;timer.endsAt=null;save();}
}
export function timerHTML() {
  finishIfNeeded();
  return `<section class="reading-timer" aria-label="독서 타이머">
    <div class="timer-clock">
      <svg class="timer-sector" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" class="timer-sector-base"/><path class="timer-wedge"/></svg>
      <div class="timer-ticks" aria-hidden="true">${Array.from({length:60},(_,i)=>`<i class="${i%5===0?'major':''}" style="--tick:${i*6}deg"></i>`).join('')}</div>
      <div class="timer-numbers" aria-hidden="true">${Array.from({length:4},(_,i)=>{const a=i*Math.PI/2;return `<span style="left:${50+39*Math.sin(a)}%;top:${50-39*Math.cos(a)}%">${i*timer.minutes/4}</span>`}).join('')}</div>
      <button class="timer-center" type="button" aria-label="타이머 시작"></button>
    </div>
    <p class="timer-status sr-only" role="status" aria-live="polite"></p>
    <div class="timer-setup"><label class="timer-duration">독서 시간 <span><input name="timerMinutes" aria-label="독서 시간 (분)" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${timer.minutes}">분</span></label>
      <input class="timer-slider" aria-label="독서 시간 슬라이더 (분)" type="range" min="1" max="${Math.max(60,timer.minutes)}" step="1" value="${timer.minutes}">
      <div class="timer-presets">${[15,30,60].map(n=>`<button type="button" data-minutes="${n}">${n}분</button>`).join('')}<button type="button" data-timer-estimate title="오늘 독서 계획 · 시간당 30쪽 기준">예상 시간</button></div>
    </div>
    <button type="button" class="secondary timer-reset">시간 다시 설정</button>
    <p class="timer-lock sr-only" aria-live="polite"></p>
    <p class="error timer-storage" role="status"></p>
  </section>`;
}
const play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14l11-7z" fill="currentColor"/></svg>';
const pause = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/></svg>';
export function mountTimer(root,getEstimatedMinutes=()=>0) {
  const panel = root.querySelector('.reading-timer'), center=panel.querySelector('.timer-center'), number=panel.querySelector('[name=timerMinutes]'), slider=panel.querySelector('.timer-slider');
  const alignClock = () => panel.style.setProperty('--timer-nav-height', (document.querySelector('nav')?.getBoundingClientRect().height || 84)+'px');
  alignClock();window.addEventListener('resize',alignClock);
  let disposed=false, lock=null, attempted=false, lockEpoch=0, animation=null, drawnKey='';
  const wedge=panel.querySelector('.timer-wedge');
  function paintSector() {
    const fraction=remainingTime(timer)/(timer.minutes*60000);
    wedge.setAttribute('d',sectorPath(fraction));
  }
  function animate() {
    animation=null;
    if(disposed||document.hidden||timer.status!=='running')return;
    paintSector();
    if(remainingTime(timer)===0){draw();return;}
    animation=requestAnimationFrame(animate);
  }
  const lockStatus=panel.querySelector('.timer-lock');
  async function updateLock() {
    if (timer.status !== 'running' || document.hidden || disposed) {
      lockEpoch++;
      attempted=false;
      if(lock){const current=lock;lock=null;await current.release().catch(()=>{});}
      lockStatus.textContent='';return;
    }
    if (attempted) return;
    attempted=true;
    const epoch=++lockEpoch;
    if (!navigator.wakeLock) {lockStatus.textContent='이 브라우저에서는 화면 켜짐 유지가 지원되지 않아요.';return;}
    try {
      const granted=await navigator.wakeLock.request('screen');
      if(disposed||timer.status!=='running'||document.hidden||epoch!==lockEpoch){await granted.release();return;}
      lock=granted;lockStatus.textContent='화면 켜짐 유지 중';
      granted.addEventListener('release',()=>{if(lock===granted){lock=null;lockStatus.textContent='화면 켜짐 유지가 해제됐어요.';}});
    } catch {if(!disposed)lockStatus.textContent='화면 켜짐을 유지할 수 없어요. 절전 설정을 확인해 주세요.';}
  }
  function draw() {
    finishIfNeeded();
    updateLock();
    if(timer.status==='running'&&!document.hidden&&animation===null)animation=requestAnimationFrame(animate);
    else if((timer.status!=='running'||document.hidden)&&animation!==null){cancelAnimationFrame(animation);animation=null;}
    const key=timer.status+':'+timer.minutes+':'+saveFailed;
    if(key===drawnKey)return;
    drawnKey=key;
    slider.style.setProperty('--slider-progress',((Number(slider.value)-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100)+'%');
    const started=timer.status!=='idle', running=timer.status==='running';
    panel.classList.toggle('timer-started',started);
    panel.classList.toggle('timer-running',running);
    paintSector();
    panel.querySelectorAll('.timer-numbers span').forEach((el,i)=>{el.textContent=i===0?String(timer.minutes):String(i*timer.minutes/4)});
    panel.querySelector('.timer-setup').hidden=started;
    panel.querySelector('.timer-reset').hidden=!started;
    const label=running?'타이머 일시정지':timer.status==='paused'?'타이머 재개':timer.status==='complete'?'시간 다시 설정':'타이머 시작';
    center.setAttribute('aria-label',label);
    center.innerHTML=running?pause:play;
    const status=running?'지금은 독서에만 집중하세요.':timer.status==='paused'?'잠시 쉬어가고 있어요.':timer.status==='complete'?'독서 시간이 끝났어요.':'나만의 독서 시간을 정해 보세요.';
    const statusEl=panel.querySelector('.timer-status');if(statusEl.textContent!==status)statusEl.textContent=status;
    statusEl.classList.toggle('sr-only',timer.status!=='complete');
    panel.querySelectorAll('[data-minutes]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.minutes)===timer.minutes)));
    panel.querySelector('.timer-storage').textContent=saveFailed?'타이머 상태를 저장하지 못했어요. 새로고침하면 시간이 복원되지 않을 수 있어요.':'';
  }
  function setMinutes(value) {
    if(timer.status!=='idle'||!Number.isInteger(value)||value<1||value>1440)return;
    timer.minutes=value;timer.remaining=value*60000;number.value=value;slider.max=Math.max(60,value);slider.value=value;save();draw();
  }
  number.oninput=()=>{const valid=number.value!==''&&number.validity.valid;center.disabled=!valid;if(valid)setMinutes(Number(number.value));};
  number.onblur=()=>{number.value=timer.minutes;center.disabled=false;};
  slider.oninput=()=>{center.disabled=false;setMinutes(Number(slider.value));};
  panel.querySelectorAll('[data-minutes]').forEach(el=>el.onclick=()=>{center.disabled=false;setMinutes(Number(el.dataset.minutes));});
  panel.querySelector('[data-timer-estimate]').onclick=()=>{if(timer.status!=='idle')return;const minutes=getEstimatedMinutes();if(Number.isInteger(minutes)&&minutes>0&&minutes<=1440){center.disabled=false;setMinutes(minutes);}};
  function reset() {timer.status='idle';timer.remaining=timer.minutes*60000;timer.endsAt=null;number.value=timer.minutes;slider.value=timer.minutes;save();draw();}
  panel.querySelector('.timer-reset').onclick=reset;
  center.onclick=()=>{
    finishIfNeeded();
    if(timer.status==='complete'){reset();return;}
    if(timer.status==='running'){timer.remaining=remainingTime(timer);timer.status='paused';timer.endsAt=null;}
    else {timer.endsAt=Date.now()+timer.remaining;timer.status='running';}
    save();draw();
  };
  document.addEventListener('visibilitychange',draw);
  draw();const interval=setInterval(draw,1000);
  return ()=>{disposed=true;clearInterval(interval);document.removeEventListener('visibilitychange',draw);window.removeEventListener('resize',alignClock);if(animation!==null)cancelAnimationFrame(animation);updateLock();};
}
