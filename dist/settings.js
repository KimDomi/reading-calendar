import {icon} from './icons.js?v=8fc4a110ec6b';
import {normalizeRestDays} from './rest-days.js?v=270c12ac63f1';
import {syncSystemBars,isNativeApp} from './native.js?v=5aa2b7062fe9';
const key = 'reading-calendar-settings-v1';
export const DEFAULT_TIMER_COLOR='#7d9b8a';
export const settings = {theme: 'system', notifications: false, notificationTime: '21:00',timerColor:DEFAULT_TIMER_COLOR,showTimerDigits:false};
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && ['system', 'light', 'dark'].includes(saved.theme)) settings.theme = saved.theme;
  if (typeof saved?.notifications === 'boolean') settings.notifications = saved.notifications;
  if (validTime(saved?.notificationTime)) settings.notificationTime = saved.notificationTime;
  if (typeof saved?.timerColor==='string'&&/^#[0-9a-f]{6}$/i.test(saved.timerColor)) settings.timerColor=saved.timerColor;
  if (typeof saved?.showTimerDigits==='boolean') settings.showTimerDigits=saved.showTimerDigits;
} catch {}
const system = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
export function applyTheme() {
  if (!globalThis.document?.documentElement) return;
  document.documentElement.dataset.theme = settings.theme === 'system' ? (system?.matches ? 'dark' : 'light') : settings.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',document.documentElement.dataset.theme==='dark'?'#1c1c1e':'#fafafa');
  syncSystemBars(document.documentElement.dataset.theme);
}
system?.addEventListener('change', applyTheme);
applyTheme();
export function updateSetting(name, value) {
  const valid = name === 'theme' ? ['system','light','dark'].includes(value)
    : name === 'notifications' || name === 'showTimerDigits' ? typeof value === 'boolean'
    : name === 'notificationTime' ? validTime(value)
    : name === 'timerColor' ? typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) : false;
  if (!valid || settings[name] === value) return;
  // Persist first so a failed write cannot change the active preference or theme.
  localStorage.setItem(key, JSON.stringify({...settings,[name]:value}));
  settings[name] = value;
  if (name === 'theme') applyTheme();
}
export function adoptSettings(value) {Object.assign(settings,value);applyTheme();}
const openSections=new Set();
export function rememberSettingsSections(root){const sections=[...root.querySelectorAll('[data-settings-section]')];if(!sections.length)return;openSections.clear();sections.filter(el=>el.open).forEach(el=>openSections.add(el.dataset.settingsSection));}
export function restDatesHTML(restDays) {
  return Object.entries(normalizeRestDays(restDays).dates).sort(([a],[b])=>a.localeCompare(b)).map(([date,mode])=>`<li><span>${date} · ${mode==='rest'?'쉬는 날':'읽는 날'}</span><button type="button" data-rest-remove="${date}" aria-label="${date} 예외 삭제">삭제</button></li>`).join('');
}
export function settingsHTML(restDays = {}) {
  const rest=normalizeRestDays(restDays),weekdayNames=['일','월','화','수','목','금','토'];
  const expander=`<span class="settings-expander" aria-hidden="true">${icon('chevron-down')}</span>`;
  return `<section class="settings-card appearance-card"><div class="setting-row"><div class="setting-label"><strong>화면 테마</strong></div><div class="segmented" data-segmented="theme" role="group" aria-label="화면 테마 선택">${[['light','라이트 모드','라이트'],['dark','다크 모드','다크'],['system','시스템 설정','시스템 설정']].map(([value,aria,title])=>`<button type="button" class="${settings.theme===value?'active':''}" data-action="set-theme" data-theme="${value}" aria-label="${aria}" title="${title}" aria-pressed="${settings.theme===value}">${icon(value)}</button>`).join('')}</div></div></section>
  <details class="settings-card settings-section" data-settings-section="notifications" ${openSections.has('notifications')?'open':''}><summary>독서 알림${expander}</summary><div class="settings-content"><div class="row"><div><span id="notification-label" class="setting-label">알림 켜기</span><p class="small" id="notification-description">알림 기능을 준비하고 있어요.</p></div><button type="button" class="setting-switch" role="switch" aria-checked="${settings.notifications}" aria-labelledby="notification-label" aria-describedby="notification-description" data-setting="notifications"><span class="switch-thumb"></span><span class="sr-only">${settings.notifications?'켜짐':'꺼짐'}</span></button></div><label class="field">알림 시간<input type="time" name="notificationTime" value="${settings.notificationTime}" ${settings.notifications?'':'disabled'}></label><div class="note">켜기·끄기와 시간만 미리 저장해요. 정한 시간까지 독서 기록이 없으면 알려주는 기능은 ${isNativeApp()?'후속 버전':'앱 버전'}에서 제공할 예정이에요. 현재 알림은 발송되지 않아요.</div></div></details>
  <details class="settings-card settings-section" data-settings-section="timer" ${openSections.has('timer')?'open':''}><summary>독서 타이머${expander}</summary><div class="settings-content"><div class="row"><span id="timer-display-label" class="setting-label">남은 시간 표시</span><button type="button" class="setting-switch" role="switch" aria-checked="${settings.showTimerDigits}" aria-labelledby="timer-display-label" data-setting="showTimerDigits"><span class="switch-thumb"></span><span class="sr-only">${settings.showTimerDigits?'켜짐':'꺼짐'}</span></button></div></div></details>
  <details class="settings-card settings-section rest-card" data-settings-section="rest" ${openSections.has('rest')?'open':''}><summary>독서 쉬는 날${expander}</summary><div class="settings-content">
    <fieldset class="rest-weekdays"><legend>매주 쉬는 요일</legend><div>${[1,2,3,4,5,6,0].map(d=>`<button type="button" data-rest-weekday="${d}" aria-label="${weekdayNames[d]}요일 휴식" aria-pressed="${rest.weekdays.includes(d)}">${weekdayNames[d]}</button>`).join('')}</div></fieldset>
    <label class="rest-holidays"><input type="checkbox" name="restPublicHolidays" ${rest.publicHolidays?'checked':''}>공휴일에도 쉬기</label>
    <form id="rest-date-form"><label class="field">날짜별 예외<input type="date" name="restDate" required aria-label="예외 날짜"></label><div class="rest-date-controls"><fieldset class="rest-mode"><legend class="sr-only">예외 유형</legend><label><input type="radio" name="restMode" value="rest" checked><span>이날은 쉬기</span></label><label><input type="radio" name="restMode" value="read"><span>이날은 읽기</span></label></fieldset><button type="submit" class="secondary">추가</button></div></form>
    <ul class="rest-date-list">${restDatesHTML(rest)}</ul>
  </div></details>
  <section class="settings-card data-card"><div class="settings-title"><h2>독서 정보 관리</h2><button type="button" class="info-help" data-action="storagehelp" aria-label="독서 정보 저장 안내">?</button></div><div class="settings-content"><button type="button" class="secondary wide add" data-action="backup">독서 정보 내보내기 / 가져오기</button></div></section>${isNativeApp()?'<section class="settings-card data-card update-card"><div class="settings-title"><h2>앱 업데이트</h2><span class="small app-version-label" id="app-version-label"></span></div><div class="settings-content"><button type="button" class="secondary wide" data-action="check-update">최신 버전 확인</button></div></section>':''}`;
}
