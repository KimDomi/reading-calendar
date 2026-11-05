import {icon} from './icons.js?v=8fc4a110ec6b';
import {normalizeRestDays} from './rest-days.js?v=270c12ac63f1';
import {syncSystemBars,isNativeApp} from './native.js?v=bcb0856dfeee';
const key = 'reading-calendar-settings-v1';
export const DEFAULT_TIMER_COLOR='#7d9b8a';
export const settings = {theme: 'system', notifications: false, notificationTime: '21:00',timerColor:DEFAULT_TIMER_COLOR};
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && ['system', 'light', 'dark'].includes(saved.theme)) settings.theme = saved.theme;
  if (typeof saved?.notifications === 'boolean') settings.notifications = saved.notifications;
  if (validTime(saved?.notificationTime)) settings.notificationTime = saved.notificationTime;
  if (typeof saved?.timerColor==='string'&&/^#[0-9a-f]{6}$/i.test(saved.timerColor)) settings.timerColor=saved.timerColor;
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
  if (name === 'theme' && ['system', 'light', 'dark'].includes(value)) settings.theme = value;
  else if (name === 'notifications' && typeof value === 'boolean') settings.notifications = value;
  else if (name === 'notificationTime' && validTime(value)) settings.notificationTime = value;
  else if (name === 'timerColor' && typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)) settings.timerColor=value;
  else return;
  applyTheme();
  localStorage.setItem(key, JSON.stringify(settings));
}
export function adoptSettings(value) {Object.assign(settings,value);applyTheme();}
const openSections=new Set();
export function rememberSettingsSections(root){const sections=[...root.querySelectorAll('[data-settings-section]')];if(!sections.length)return;openSections.clear();sections.filter(el=>el.open).forEach(el=>openSections.add(el.dataset.settingsSection));}
export function settingsHTML(restDays = {}) {
  const rest=normalizeRestDays(restDays),weekdayNames=['일','월','화','수','목','금','토'];
  const expander=`<span class="settings-expander" aria-hidden="true">${icon('chevron-down')}</span>`;
  return `<details class="settings-card settings-section appearance-card" data-settings-section="appearance" ${openSections.has('appearance')?'open':''}><summary>화면 모드${expander}</summary><div class="settings-content">
  <fieldset class="theme-options"><legend class="sr-only">화면 모드 선택</legend>${[['light','라이트'],['dark','다크'],['system','시스템 설정']].map(([value,label])=>`<label class="theme-option"><input type="radio" name="theme" value="${value}" ${settings.theme===value?'checked':''}><span class="theme-symbol" aria-hidden="true">${icon(value)}</span><span>${label}</span></label>`).join('')}</fieldset>
  </div></details>
  <details class="settings-card settings-section" data-settings-section="notifications" ${openSections.has('notifications')?'open':''}><summary>독서 알림${expander}</summary><div class="settings-content"><div class="row"><div><span id="notification-label" class="setting-label">알림 켜기</span><p class="small" id="notification-description">알림 기능을 준비하고 있어요.</p></div><button type="button" class="setting-switch" role="switch" aria-checked="${settings.notifications}" aria-labelledby="notification-label" aria-describedby="notification-description" data-setting="notifications"><span class="switch-thumb"></span><span class="sr-only">${settings.notifications?'켜짐':'꺼짐'}</span></button></div><label class="field">알림 시간<input type="time" name="notificationTime" value="${settings.notificationTime}" ${settings.notifications?'':'disabled'}></label><div class="note">켜기·끄기와 시간만 미리 저장해요. 정한 시간까지 독서 기록이 없으면 알려주는 기능은 ${isNativeApp()?'후속 버전':'앱 버전'}에서 제공할 예정이에요. 현재 알림은 발송되지 않아요.</div></div></details>
  <details class="settings-card settings-section rest-card" data-settings-section="rest" ${openSections.has('rest')?'open':''}><summary>독서 쉬는 날${expander}</summary><div class="settings-content">
    <fieldset class="rest-weekdays"><legend>매주 쉬는 요일</legend><div>${[1,2,3,4,5,6,0].map(d=>`<button type="button" data-rest-weekday="${d}" aria-label="${weekdayNames[d]}요일 휴식" aria-pressed="${rest.weekdays.includes(d)}">${weekdayNames[d]}</button>`).join('')}</div></fieldset>
    <label class="rest-holidays"><input type="checkbox" name="restPublicHolidays" ${rest.publicHolidays?'checked':''}>공휴일에도 쉬기</label>
    <form id="rest-date-form"><label class="field">날짜별 예외<input type="date" name="restDate" required aria-label="예외 날짜"></label><div class="rest-date-controls"><fieldset class="rest-mode"><legend class="sr-only">예외 유형</legend><label><input type="radio" name="restMode" value="rest" checked><span>이날은 쉬기</span></label><label><input type="radio" name="restMode" value="read"><span>이날은 읽기</span></label></fieldset><button type="submit" class="secondary">추가</button></div></form>
    <ul class="rest-date-list">${Object.entries(rest.dates).sort(([a],[b])=>a.localeCompare(b)).map(([date,mode])=>`<li><span>${date} · ${mode==='rest'?'쉬는 날':'읽는 날'}</span><button type="button" data-rest-remove="${date}" aria-label="${date} 예외 삭제">삭제</button></li>`).join('')}</ul>
  </div></details>
  <section class="settings-card data-card"><div class="settings-title"><h2>독서 정보 관리</h2><button type="button" class="info-help" data-action="storagehelp" aria-label="독서 정보 저장 안내">${icon('help')}</button></div><div class="settings-content"><button type="button" class="secondary wide add" data-action="backup">독서 정보 내보내기 / 가져오기</button></div></section>`;
}
