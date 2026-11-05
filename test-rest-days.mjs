import assert from 'node:assert/strict';
import {isRestDay,readingDays,readingFinish,normalizeRestDays} from './dist/rest-days.js';
import {allocateMixed,recalc,record,add} from './dist/engine.js';
import {makeBackup,parseBackup,mergeBackup} from './dist/backup.js';
const book=(extra={})=>({id:'a',title:'책',color:'#678b70',total:100,page:0,created:'2026-11-01',status:'active',order:0,mode:'parallel',basis:'deadline',deadline:'2026-11-06',...extra});
const config=normalizeRestDays({weekdays:[0,6],dates:{'2026-11-04':'rest','2026-11-07':'read'}});
assert.equal(isRestDay('2026-11-07',config),false);
assert.equal(isRestDay('2026-11-08',config),true);
assert.equal(readingDays('2026-11-02','2026-11-06',config),4);
const rows=allocateMixed([book()],'2026-11-02',config);
assert.deepEqual(rows.map(r=>r.n),[25,25,25,25]);
assert.deepEqual(rows.map(r=>r.date),['2026-11-02','2026-11-03','2026-11-05','2026-11-06']);
const daily=book({basis:'daily',dailyPages:40,total:100});
const dailyRows=allocateMixed([daily],'2026-11-06',{weekdays:[0,6]});
assert.deepEqual(dailyRows.map(r=>[r.date,r.n]),[['2026-11-06',40],['2026-11-09',40],['2026-11-10',20]]);
assert.equal(readingFinish('2026-11-06',3,{weekdays:[0,6]}),'2026-11-10');
assert.equal(allocateMixed([book({deadline:'2026-11-08'})],'2026-11-07',{weekdays:[0,6]}).length,0);
const mixed=allocateMixed([book({id:'first',mode:'sequence',basis:'daily',total:40,dailyPages:40}),book({id:'second',mode:'sequence',deadline:'2026-11-10'})],'2026-11-06',{weekdays:[0,6]});
assert.equal(mixed.find(r=>r.id==='second').date,'2026-11-09');
assert.ok(mixed.every(r=>!isRestDay(r.date,{weekdays:[0,6]})));
assert.equal(isRestDay('2026-03-02',{publicHolidays:true}),true);
assert.equal(isRestDay('2026-03-02',{publicHolidays:true,dates:{'2026-03-02':'read'}}),false);
assert.throws(()=>normalizeRestDays({weekdays:[0,1,2,3,4,5,6]}));
assert.throws(()=>normalizeRestDays({dates:{'2026-02-30':'rest'}}));
const state={books:[daily],records:[],alloc:[{id:'a',date:'2026-11-01',from:1,to:10,n:10}],restDays:config};
const past=structuredClone(state.alloc[0]);recalc(state,['a'],'2026-11-02');
assert.deepEqual(state.alloc[0],past);
record(state,'a',20,'2026-11-04'); // Recording on a rest day is allowed.
assert.equal(state.records[0].date,'2026-11-04');
assert.ok(state.alloc.filter(r=>r.date>'2026-11-04').every(r=>!isRestDay(r.date,config)));
assert.deepEqual(parseBackup(JSON.stringify(makeBackup(state))).data.restDays,config);
assert.deepEqual(mergeBackup(state,{books:[],records:[],alloc:[]},'2026-11-04').state.restDays,config);
for(let offset=0;offset<50;offset++){
  const first=add('2026-10-01',offset),last=add(first,30);
  let expected=0;for(let d=first;d<=last;d=add(d,1))if(!isRestDay(d,config))expected++;
  assert.equal(readingDays(first,last,config),expected);
}
console.log('PASS rest weekday/date overrides, holiday option, quota/deadline/mixed schedules, no available days, history, rest-day records, backup and day counting');
