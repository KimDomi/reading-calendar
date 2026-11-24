// The Android bridge is injected before modules execute. The website uses browser APIs.
const capacitor=globalThis.Capacitor;
export const isNativeApp=()=>!!capacitor?.isNativePlatform?.();
export const storageNotice=()=>isNativeApp()?'기록은 이 앱에 저장돼요. 자동 동기화되지 않으며, 앱 데이터를 지우거나 앱을 삭제하면 사라지니 백업해 주세요.':'기록은 이 브라우저에만 저장돼요. 자동 동기화되지 않으며, 브라우저 데이터를 지우면 사라지니 백업해 주세요.';
// Android injects plugin proxies directly; registerPlugin belongs to the optional JS core bundle.
const native=isNativeApp()?capacitor.Plugins?.ReadingNative:null;
const systemBars=isNativeApp()?capacitor.Plugins?.SystemBars:null;

export const RELEASE_MANIFEST_URL='https://github.com/KimDomi/reading-calendar/releases/latest/download/latest.json';
export const RELEASE_API_URL='https://api.github.com/repos/KimDomi/reading-calendar/releases/latest';

export async function exportNativeBackup(filename,data){
  if(!native){if(isNativeApp())throw Error('파일 저장 기능에 연결하지 못했어요. 앱을 다시 열어 주세요.');return null;}
  return native.exportBackup({filename,data});
}
export function screenLockAvailable(){return !!native||!!globalThis.navigator?.wakeLock;}
export async function requestScreenLock(){
  if(!native)return globalThis.navigator.wakeLock.request('screen');
  await native.setScreenAwake({enabled:true});
  return {release:()=>native.setScreenAwake({enabled:false})};
}
export function syncSystemBars(theme){
  if(!systemBars)return;
  Promise.resolve().then(()=>systemBars.setStyle({style:theme==='dark'?'DARK':'LIGHT'})).catch(()=>{});
}
export function installNativeNavigation(onBack,onResume){
  if(!native)return;
  window.addEventListener('reading-back',()=>{if(!onBack())native.backgroundApp().catch(()=>{});});
  window.addEventListener('reading-app-resume',onResume);
}

export function normalizeVersionString(value){
  return String(value||'').trim().replace(/^v/i,'').split('-')[0];
}
export function compareVersions(a,b){
  const pa=normalizeVersionString(a).split('.').map(n=>Number.parseInt(n,10)||0);
  const pb=normalizeVersionString(b).split('.').map(n=>Number.parseInt(n,10)||0);
  const len=Math.max(pa.length,pb.length);
  for(let i=0;i<len;i++){
    const da=pa[i]||0,db=pb[i]||0;
    if(da!==db)return da>db?1:-1;
  }
  return 0;
}
export function isNewerVersion(current,latest){
  const cmp=compareVersions(latest?.versionName,current?.versionName);
  if(cmp!==0)return cmp>0;
  const curCode=Number(current?.versionCode),latCode=Number(latest?.versionCode);
  return Number.isFinite(curCode)&&Number.isFinite(latCode)&&latCode>curCode;
}
export function parseReleaseMetadata(source,bodyText,current){
  let data;
  try{data=JSON.parse(bodyText);}catch{throw Error('릴리즈 버전 정보를 읽지 못했어요.');}
  let latest;
  if(source==='manifest'){
    latest={
      versionName:normalizeVersionString(data?.versionName||data?.tagName),
      versionCode:Number.isFinite(Number(data?.versionCode))?Number(data.versionCode):null,
      tagName:String(data?.tagName||'').trim(),
      apkName:String(data?.apkName||'').trim(),
      downloadUrl:String(data?.downloadUrl||'').trim(),
      releaseUrl:String(data?.releaseUrl||'').trim(),
      sha256:typeof data?.sha256==='string'?data.sha256.trim():'',
      publishedAt:typeof data?.publishedAt==='string'?data.publishedAt:'',
      notes:''
    };
  }else{
    if(data?.draft||data?.prerelease)throw Error('배포된 정식 릴리즈가 아직 없어요.');
    const assets=Array.isArray(data?.assets)?data.assets:[];
    const apks=assets.filter(a=>typeof a?.name==='string'&&a.name.endsWith('.apk')&&typeof a?.browser_download_url==='string'&&a.browser_download_url.startsWith('https://'));
    const asset=apks.find(a=>a.name.includes('-release.apk'))||apks[0];
    if(!asset)throw Error('릴리즈에서 설치 가능한 APK 파일을 찾지 못했어요.');
    const body=typeof data?.body==='string'?data.body:'';
    const shaMatch=body.match(/SHA-256:\s*`?([0-9a-f]{64})`?/i);
    const codeMatch=body.match(/빌드\s*(\d+)/);
    latest={
      versionName:normalizeVersionString(data?.tag_name||data?.name),
      versionCode:codeMatch?Number(codeMatch[1]):null,
      tagName:String(data?.tag_name||'').trim(),
      apkName:asset.name,
      downloadUrl:asset.browser_download_url,
      releaseUrl:typeof data?.html_url==='string'?data.html_url:'',
      sha256:shaMatch?shaMatch[1]:'',
      publishedAt:typeof data?.published_at==='string'?data.published_at:'',
      notes:body.trim()
    };
  }
  if(!latest.versionName||!latest.downloadUrl.startsWith('https://'))throw Error('최신 APK 주소를 확인하지 못했어요.');
  return {
    current,
    latest,
    hasUpdate:isNewerVersion(current,latest)
  };
}
export async function getNativeAppInfo(){
  if(!native?.getAppInfo)return null;
  return native.getAppInfo();
}
export async function checkNativeAppUpdate(){
  if(!native?.getAppInfo||!native?.fetchReleaseMetadata){
    throw Error('이 앱 버전에서는 앱 내 업데이트 확인을 지원하지 않아요.');
  }
  const current=await native.getAppInfo();
  const res=await native.fetchReleaseMetadata({manifestUrl:RELEASE_MANIFEST_URL,apiUrl:RELEASE_API_URL});
  return parseReleaseMetadata(res?.source,res?.body,current);
}
export async function canInstallNativeUpdates(){
  if(!native?.canInstallUpdates)return true;
  const res=await native.canInstallUpdates();
  return !!res?.allowed;
}
export async function openNativeInstallPermission(){
  if(!native?.openInstallPermissionSettings)return false;
  const res=await native.openInstallPermissionSettings();
  return !!res?.allowed;
}
export async function installNativeUpdate(url,sha256,onProgress){
  if(!native?.installApkFromUrl)throw Error('앱 설치 기능을 사용할 수 없어요.');
  const handler=e=>{
    if(!onProgress)return;
    try{
      const raw=e?.detail!==undefined?e.detail:e;
      const info=typeof raw==='string'?JSON.parse(raw):raw;
      if(info&&typeof info==='object')onProgress(info);
    }catch{}
  };
  window?.addEventListener?.('reading-update-progress',handler);
  try{
    return await native.installApkFromUrl({url,sha256:sha256||''});
  }finally{
    window?.removeEventListener?.('reading-update-progress',handler);
  }
}
