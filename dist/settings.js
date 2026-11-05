const key = 'reading-calendar-settings-v1';
export const settings = {theme: 'system', notifications: false, notificationTime: '21:00'};
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && ['system', 'light', 'dark'].includes(saved.theme)) settings.theme = saved.theme;
  if (typeof saved?.notifications === 'boolean') settings.notifications = saved.notifications;
  if (validTime(saved?.notificationTime)) settings.notificationTime = saved.notificationTime;
} catch {}
const system = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
export function applyTheme() {
  if (!document.documentElement) return;
  document.documentElement.dataset.theme = settings.theme === 'system' ? (system?.matches ? 'dark' : 'light') : settings.theme;
}
system?.addEventListener('change', applyTheme);
applyTheme();
export function updateSetting(name, value) {
  if (name === 'theme' && ['system', 'light', 'dark'].includes(value)) settings.theme = value;
  else if (name === 'notifications' && typeof value === 'boolean') settings.notifications = value;
  else if (name === 'notificationTime' && validTime(value)) settings.notificationTime = value;
  else return;
  applyTheme();
  localStorage.setItem(key, JSON.stringify(settings));
}
export function settingsHTML() {
  return `<p class="small settings-intro">편안한 독서 환경을 만들어 보세요.</p>
  <section class="settings-card appearance-card"><h2>화면 모드</h2>
  <fieldset class="theme-options"><legend class="sr-only">화면 모드 선택</legend>${[['light','☀','라이트'],['dark','☾','다크'],['system','◐','시스템 설정']].map(([value,icon,label])=>`<label class="theme-option"><input type="radio" name="theme" value="${value}" ${settings.theme===value?'checked':''}><span class="theme-symbol" aria-hidden="true">${icon}</span><span>${label}</span></label>`).join('')}</fieldset>
  </section>
  <section class="settings-card"><div class="row"><div><h2 id="notification-label">독서 알림</h2><p class="small" id="notification-description">알림 기능을 준비하고 있어요.</p></div><button type="button" class="setting-switch" role="switch" aria-checked="${settings.notifications}" aria-labelledby="notification-label" aria-describedby="notification-description" data-setting="notifications"><span class="switch-thumb"></span><span class="sr-only">${settings.notifications?'켜짐':'꺼짐'}</span></button></div><label class="field">알림 시간<input type="time" name="notificationTime" value="${settings.notificationTime}" ${settings.notifications?'':'disabled'}></label><div class="note">켜기·끄기와 시간만 미리 저장해요. 정한 시간까지 독서 기록이 없으면 알려주는 기능은 앱 버전에서 제공할 예정이에요. 현재 알림은 발송되지 않아요.</div></section>
  <section class="settings-card"><div class="settings-title"><h2>독서 정보 관리</h2><button type="button" class="info-help" data-action="storagehelp" aria-label="독서 정보 저장 안내">?</button></div><p class="small">독서 계획과 기록을 파일로 보관하거나 복원해요.</p><button type="button" class="secondary wide add" data-action="backup">독서 정보 내보내기 / 가져오기</button></section>`;
}
