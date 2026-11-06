import assert from 'node:assert/strict';
const entries=new Map();let fail=false,writes=0;
globalThis.localStorage={getItem:key=>entries.get(key)||null,setItem:(key,value)=>{if(fail)throw Error('quota');writes++;entries.set(key,value);}};
const root={dataset:{}};
globalThis.document={documentElement:root,querySelector:()=>null};
const {settings,updateSetting}=await import('./dist/settings.js');
updateSetting('theme','dark');
assert.equal(root.dataset.theme,'dark');
const previous=structuredClone(settings),saved=entries.get('reading-calendar-settings-v1');
fail=true;
for(const [name,value] of [['theme','light'],['notifications',true],['notificationTime','08:15'],['showTimerDigits',true],['timerColor','#8899aa']]){
  assert.throws(()=>updateSetting(name,value),/quota/);
  assert.deepEqual(settings,previous);
  assert.equal(root.dataset.theme,'dark');
  assert.equal(entries.get('reading-calendar-settings-v1'),saved);
}
fail=false;
const before=writes;
for(const [name,value] of [['theme','invalid'],['notificationTime','25:00'],['showTimerDigits','yes'],['timerColor','red'],['theme','dark']])updateSetting(name,value);
assert.equal(writes,before);
updateSetting('notificationTime','08:15');
assert.equal(JSON.parse(entries.get('reading-calendar-settings-v1')).notificationTime,'08:15');
assert.equal(settings.notificationTime,'08:15');
console.log('PASS atomic settings writes, theme preservation on storage failure, validation and unchanged-value skip');
