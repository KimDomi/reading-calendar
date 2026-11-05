import {recalc} from './engine.js?v=cab576a36d57';
import {normalizeRestDays} from './rest-days.js?v=270c12ac63f1';
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const fail=()=>{throw Error('독서 백업 파일의 형식이나 데이터가 올바르지 않아요. 원본 파일을 확인해 주세요.')};
const idOK=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(x);
export function validateSettings(value){
 if(!value||typeof value!=='object'||!['system','light','dark'].includes(value.theme)||typeof value.notifications!=='boolean'||typeof value.notificationTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.notificationTime))fail();
 if(value.timerColor!==undefined&&(typeof value.timerColor!=='string'||!/^#[0-9a-f]{6}$/i.test(value.timerColor)))fail();
 return {theme:value.theme,notifications:value.notifications,notificationTime:value.notificationTime,...(value.timerColor===undefined?{}:{timerColor:value.timerColor})};
}
export function validateData(data){
 if(!data||!Array.isArray(data.books)||!Array.isArray(data.records)||!Array.isArray(data.alloc)||data.books.length>10000||data.records.length>200000||data.alloc.length>200000)fail();
 const ids=new Map(),books=data.books.map(b=>{
  if(!b||!idOK(b.id)||ids.has(b.id)||typeof b.title!=='string'||!b.title.trim()||b.title.length>100||!integer(b.total,1,100000)||!integer(b.page,0,b.total)||!/^#[0-9a-f]{6}$/i.test(b.color)||!['active','past','done'].includes(b.status)||!['parallel','sequence'].includes(b.mode)||!integer(b.order,0,1000000000)||!date(b.created))fail();
  const basis=b.basis||'deadline';if(!['daily','deadline'].includes(basis)||(basis==='deadline'&&!date(b.deadline))||(basis==='daily'&&!integer(b.dailyPages,1,100000)))fail();
  if(b.confirmed!=null&&!date(b.confirmed)||b.status==='done'&&(!date(b.finished)||b.page!==b.total))fail();
  const x={id:b.id,title:b.title,total:b.total,page:b.page,color:b.color,status:b.status,mode:b.mode,order:b.order,created:b.created,basis};
  if(date(b.deadline))x.deadline=b.deadline;if(integer(b.dailyPages,1,100000))x.dailyPages=b.dailyPages;if(b.confirmed)x.confirmed=b.confirmed;if(b.finished&&date(b.finished))x.finished=b.finished;if(typeof b.reason==='string')x.reason=b.reason.slice(0,100);ids.set(x.id,x);return x;
 });
 const records=data.records.map(r=>{let b=ids.get(r?.id);if(!b||!date(r.date)||!integer(r.page,0,b.total)||!integer(r.delta,0,r.page))fail();return {id:r.id,date:r.date,page:r.page,delta:r.delta}});
 const alloc=data.alloc.map(a=>{let b=ids.get(a?.id);if(!b||!date(a.date)||!integer(a.from,1,100000)||!integer(a.to,a.from,100000)||a.n!==a.to-a.from+1)fail();return {id:a.id,date:a.date,from:a.from,to:a.to,n:a.n}});
 return {books,records,alloc,...(data.restDays?{restDays:normalizeRestDays(data.restDays)}:{})};
}
export function makeBackup(state,at=new Date().toISOString(),settings){return {app:'reading-calendar',version:1,exportedAt:at,data:validateData(state),...(settings===undefined?{}:{settings:validateSettings(settings)})}}
export function parseBackup(text){let b;try{b=JSON.parse(text)}catch{throw Error('파일을 읽을 수 없어요. reading-calendar에서 내보낸 JSON 파일을 선택해 주세요.')}
 if(b?.app!=='reading-calendar'||b.version!==1)throw Error('지원하는 reading-calendar 백업 파일이 아니에요.');if(typeof b.exportedAt!=='string'||Number.isNaN(Date.parse(b.exportedAt)))fail();return {...b,data:validateData(b.data),...(b.settings===undefined?{}:{settings:validateSettings(b.settings)})};
}
export function writeImport(storage,data,settings,recovery){
 const dataKey='reading-calendar-v1',settingsKey='reading-calendar-settings-v1';
 const oldData=storage.getItem(dataKey),preferences=settings===undefined?undefined:validateSettings(settings);
 storage.setItem('reading-calendar-pre-import',recovery);
 let dataWritten=false;
 try{storage.setItem(dataKey,JSON.stringify(data));dataWritten=true;if(preferences!==undefined)storage.setItem(settingsKey,JSON.stringify(preferences));}
 catch(err){if(dataWritten){if(oldData===null)storage.removeItem(dataKey);else storage.setItem(dataKey,oldData);}throw err;}
}
export function mergeBackup(current,incoming,today){
 const state=structuredClone(current),existing=new Set(state.books.map(b=>b.id)),newBooks=incoming.books.filter(b=>!existing.has(b.id)).map(b=>({...b})),newIds=new Set(newBooks.map(b=>b.id));
 let order=state.books.reduce((max,b)=>Math.max(max,b.order),0);for(const b of [...newBooks].sort((a,b)=>a.order-b.order)){b.order=++order;state.books.push(structuredClone(b))}
 for(const r of incoming.records)if(newIds.has(r.id))state.records.push({...r});for(const r of incoming.alloc)if(newIds.has(r.id))state.alloc.push({...r});
 if(newBooks.some(b=>b.mode==='sequence'&&b.status==='active'))recalc(state,state.books.filter(b=>b.mode==='sequence').map(b=>b.id),today);
 return {state,added:newBooks.length,skipped:incoming.books.length-newBooks.length};
}
