import {holidays} from './holidays.js?v=e4f0f7db7f96';
export function normalizeRestDays(value = {}) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('쉬는 날 설정을 확인해 주세요.');
  const weekdays=value.weekdays??[], dates=value.dates??{}, publicHolidays=value.publicHolidays??false;
  if(!Array.isArray(weekdays)||weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||typeof publicHolidays!=='boolean'||!dates||typeof dates!=='object'||Array.isArray(dates))throw Error('쉬는 날 설정을 확인해 주세요.');
  const unique=[...new Set(weekdays)].sort();
  if(unique.length===7)throw Error('매주 독서할 요일을 최소 하루 남겨 주세요.');
  if(Object.keys(dates).length>1000)throw Error('날짜별 예외는 1,000개까지 저장할 수 있어요.');
  for(const [date,mode]of Object.entries(dates))if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['rest','read'].includes(mode)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('올바른 날짜를 선택해 주세요.');
  return {weekdays:unique,publicHolidays,dates:{...dates}};
}
export function isRestDay(date, config = {}) {
  if(config.dates?.[date])return config.dates[date]==='rest';
  return !!((config.weekdays||[]).includes(new Date(date+'T12:00:00Z').getUTCDay())||(config.publicHolidays&&holidays[date]));
}
export function readingDays(start,end,config = {}) {
  const first=Date.parse(start+'T12:00:00Z'),last=Date.parse(end+'T12:00:00Z');
  if(last<first)return 0;
  const total=Math.round((last-first)/86400000)+1, weekdays=config.weekdays||[];
  let count=Math.floor(total/7)*(7-weekdays.length);
  for(let i=0;i<total%7;i++)if(!weekdays.includes((new Date(first).getUTCDay()+i)%7))count++;
  const overrides=new Set([...Object.keys(config.dates||{}),...(config.publicHolidays?Object.keys(holidays):[])]);
  for(const date of overrides)if(date>=start&&date<=end){const weekly=weekdays.includes(new Date(date+'T12:00:00Z').getUTCDay());count+=Number(!isRestDay(date,config))-Number(!weekly);}
  return count;
}
export function readingFinish(start, slots, config = {}) {
  const base=Date.parse(start+'T12:00:00Z'),at=n=>new Date(base+n*86400000).toISOString().slice(0,10);
  let low=0,high=Math.max(1,slots*7);
  while(readingDays(start,at(high),config)<slots)high*=2;
  while(low<high){const mid=Math.floor((low+high)/2);if(readingDays(start,at(mid),config)>=slots)high=mid;else low=mid+1;}
  return at(low);
}
