// Execute the entire browser module graph against a minimal document surface.
// This catches module syntax/link errors and verifies startup and menu rendering.
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('./dist/',import.meta.url);
async function run(initial){
 const main={innerHTML:''},header={textContent:''},handlers={},file={},modal={open:false,innerHTML:'',showModal(){this.open=true},close(){this.open=false}};
 const elements=new Map([['#main',main],['#modal h2',{setAttribute(){}}],['header h1',header],['#modal',modal],['#backupfile',file],['#toast',{style:{},innerHTML:''}]]);
 const local=new Map(initial?[['reading-calendar-v1',JSON.stringify(initial)]]:[]);
 const context=vm.createContext({console,Date,Map,Set,Math,Number,String,JSON,Error,Array,RegExp,structuredClone,crypto:{randomUUID:()=> 'test'},setTimeout:()=>1,clearTimeout:()=>{},localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},document:{querySelector:s=>elements.get(s)||{},querySelectorAll:()=>[],addEventListener:(name,fn)=>{handlers[name]??=[];handlers[name].push(fn)}}});
 const cache=new Map();async function load(file){if(cache.has(file))return cache.get(file);const mod=new vm.SourceTextModule(fs.readFileSync(new URL(file,root),'utf8'),{context,identifier:file});cache.set(file,mod);return mod}
 const mod=await load('app.js');await mod.link(spec=>load(spec.slice(2).split('?')[0]));await mod.evaluate();assert.ok(main.innerHTML.includes('class="grid"'));
 const click=dataset=>{for(const fn of handlers.click)fn({target:{closest:()=>({dataset})}})};
 click({tab:'plans'});assert.ok(main.innerHTML.includes('동시에 읽는 책'));assert.ok(!main.innerHTML.includes('data-action="backup"'));
 click({tab:'settings'});assert.ok(main.innerHTML.includes('내보내기 / 가져오기'));assert.equal(header.textContent,'설정');assert.equal((main.innerHTML.match(/data-action="backup"/g)||[]).length,1);
 click({action:'backup'});assert.ok(modal.open);assert.ok(modal.innerHTML.includes('파일로 내보내기'));assert.equal(typeof file.onchange,'function');
 click({action:'close'});assert.ok(!modal.open);
 click({tab:'done'});assert.ok(main.innerHTML.includes('차곡차곡'));
 click({tab:'calendar'});assert.ok(main.innerHTML.includes('class="grid"'));
}
await run(null);
const current=new Date().toISOString().slice(0,10);
await run({books:[{id:'sample',title:'새의 언어',total:100,page:0,color:'#678b70',status:'active',mode:'sequence',order:0,created:current,confirmed:current,basis:'daily',dailyPages:10}],records:[],alloc:[{id:'sample',date:current,from:1,to:10,n:10}]});
console.log('PASS: entire module graph, calendar startup, tabs, backup dialog, existing saved data');
