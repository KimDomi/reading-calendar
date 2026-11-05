// The Android bridge is injected before modules execute. The website uses browser APIs.
const capacitor=globalThis.Capacitor;
export const isNativeApp=()=>!!capacitor?.isNativePlatform?.();
export const storageNotice=()=>isNativeApp()?'기록은 이 앱에 저장돼요. 자동 동기화되지 않으며, 앱 데이터를 지우거나 앱을 삭제하면 사라지니 백업해 주세요.':'기록은 이 브라우저에만 저장돼요. 자동 동기화되지 않으며, 브라우저 데이터를 지우면 사라지니 백업해 주세요.';
const native=isNativeApp()?capacitor.registerPlugin('ReadingNative'):null;
const systemBars=native?(capacitor.Plugins?.SystemBars||capacitor.registerPlugin('SystemBars')):null;

export async function exportNativeBackup(filename,data){
  if(!native)return null;
  return native.exportBackup({filename,data});
}
export function screenLockAvailable(){return !!native||!!globalThis.navigator?.wakeLock;}
export async function requestScreenLock(){
  if(!native)return globalThis.navigator.wakeLock.request('screen');
  await native.setScreenAwake({enabled:true});
  return {release:()=>native.setScreenAwake({enabled:false})};
}
export function syncSystemBars(theme){
  if(!native)return;
  systemBars.setStyle({style:theme==='dark'?'DARK':'LIGHT'}).catch(()=>{});
}
export function installNativeNavigation(onBack,onResume){
  if(!native)return;
  window.addEventListener('reading-back',()=>{if(!onBack())native.backgroundApp().catch(()=>{});});
  window.addEventListener('reading-app-resume',onResume);
}
