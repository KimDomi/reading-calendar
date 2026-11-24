import assert from 'node:assert/strict';

const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
const originalWindow=globalThis.window,originalCapacitor=globalThis.Capacitor;
try{
  Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
  const web=await import('./dist/native.js?test=web');
  assert.equal(web.isNativeApp(),false);
  assert.equal(web.screenLockAvailable(),false);
  assert.equal(await web.exportNativeBackup('backup.json','{}'),null);
  assert.equal(await web.getNativeAppInfo(),null);
  assert.equal(web.compareVersions('0.2.0','0.1.1'),1);
  assert.equal(web.compareVersions('v0.2.0','0.2.0'),0);
  assert.equal(web.isNewerVersion({versionName:'0.2.0',versionCode:3},{versionName:'0.2.0',versionCode:4}),true);
  assert.equal(web.isNewerVersion({versionName:'0.2.0',versionCode:3},{versionName:'0.2.0',versionCode:3}),false);
  let released=0;
  navigator.wakeLock={request:async kind=>{assert.equal(kind,'screen');return {release:async()=>released++};}};
  assert.equal(web.screenLockAvailable(),true);
  await (await web.requestScreenLock()).release();
  assert.equal(released,1);

  const calls=[],events=new EventTarget();let backs=0,resumes=0,handled=true,permissionAllowed=false;
  const plugins={ReadingNative:{
    exportBackup:async data=>{calls.push(data);return {cancelled:true};},
    setScreenAwake:async data=>calls.push(data),
    backgroundApp:async()=>backs++,
    getAppInfo:async()=>({versionName:'0.1.1',versionCode:2,packageName:'com.kimdomi.readingcalendar'}),
    canInstallUpdates:async()=>({allowed:permissionAllowed}),
    openInstallPermissionSettings:async()=>{permissionAllowed=true;return {allowed:true};},
    fetchReleaseMetadata:async opts=>{
      calls.push(opts);
      return {source:'manifest',body:JSON.stringify({versionName:'0.2.0',versionCode:3,tagName:'v0.2.0',apkName:'reading-calendar-0.2.0-release.apk',downloadUrl:'https://github.com/KimDomi/reading-calendar/releases/download/v0.2.0/reading-calendar-0.2.0-release.apk',sha256:'a'.repeat(64)})};
    },
    installApkFromUrl:async opts=>{
      calls.push(opts);
      events.dispatchEvent(new CustomEvent('reading-update-progress',{detail:{received:50,total:100,percent:50}}));
      return {started:true,needsPermission:false};
    }
  },SystemBars:{setStyle:async data=>calls.push(data)}};
  // The actual Android injector exposes Plugins and has no registerPlugin function.
  globalThis.Capacitor={isNativePlatform:()=>true,Plugins:plugins};
  globalThis.window=events;
  const native=await import('./dist/native.js?test=android');
  assert.equal(native.isNativeApp(),true);
  assert.equal(native.screenLockAvailable(),true);
  assert.deepEqual(await native.exportNativeBackup('backup.json','{"books":[]}'),{cancelled:true});
  assert.deepEqual(calls.shift(),{filename:'backup.json',data:'{"books":[]}'});
  const lock=await native.requestScreenLock();await lock.release();
  assert.deepEqual(calls.splice(0),[{enabled:true},{enabled:false}]);
  native.syncSystemBars('dark');native.syncSystemBars('light');
  await Promise.resolve();
  assert.deepEqual(calls.splice(0),[{style:'DARK'},{style:'LIGHT'}]);
  native.installNativeNavigation(()=>handled,()=>resumes++);
  window.dispatchEvent(new Event('reading-back'));assert.equal(backs,0);
  handled=false;window.dispatchEvent(new Event('reading-back'));assert.equal(backs,1);
  window.dispatchEvent(new Event('reading-app-resume'));assert.equal(resumes,1);

  const update=await native.checkNativeAppUpdate();
  assert.equal(update.hasUpdate,true);
  assert.equal(update.latest.versionName,'0.2.0');
  assert.equal(update.latest.versionCode,3);
  calls.splice(0);
  const apiParsed=native.parseReleaseMetadata('api',JSON.stringify({tag_name:'v0.2.0',body:'빌드 3\nSHA-256: `'+'b'.repeat(64)+'`',assets:[{name:'app-debug.apk',browser_download_url:'https://github.com/a/b-debug.apk'},{name:'app-release.apk',browser_download_url:'https://github.com/a/b-release.apk'}]}),{versionName:'0.2.0',versionCode:2});
  assert.equal(apiParsed.hasUpdate,true);
  assert.equal(apiParsed.latest.apkName,'app-release.apk');
  assert.equal(apiParsed.latest.sha256,'b'.repeat(64));
  assert.throws(()=>native.parseReleaseMetadata('api',JSON.stringify({tag_name:'v0.2.0',draft:true,assets:[]}),{versionName:'0.1.0',versionCode:1}));
  assert.equal(await native.canInstallNativeUpdates(),false);
  assert.equal(await native.openNativeInstallPermission(),true);
  const seenProgress=[];
  const installed=await native.installNativeUpdate(update.latest.downloadUrl,update.latest.sha256,p=>seenProgress.push(p.percent));
  assert.deepEqual(installed,{started:true,needsPermission:false});
  assert.deepEqual(seenProgress,[50]);
  assert.equal(calls.length,1);
  console.log('PASS native/browser isolation, cancelled export, screen lock release, theme, back, resume and app update');
}finally{
  if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
  if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
  if(originalCapacitor===undefined)delete globalThis.Capacitor;else globalThis.Capacitor=originalCapacitor;
}
