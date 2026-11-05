import assert from 'node:assert/strict';
import {unconfirmedBookIds} from './dist/progress-check.js';
const book={id:'a',created:'2026-11-05',status:'active',confirmed:'2026-11-05'};
const alloc=[{id:'a',date:'2026-11-05',n:10}];
const ids=(b=book,a=alloc,r=[],today='2026-11-06')=>[...unconfirmedBookIds([b],a,r,today)];
assert.deepEqual(ids(),['a']); // Legacy registration-only confirmation.
assert.deepEqual(ids({...book,confirmed:undefined}),['a']);
assert.deepEqual(ids(book,alloc,[{id:'a',date:'2026-11-05',delta:0,page:0}]),[]);
assert.deepEqual(ids(book,alloc,[{id:'a',date:'2026-11-05',delta:10,page:10}]),[]);
assert.deepEqual(ids(book,[],[]),[]); // No allocation on a rest day.
assert.deepEqual(ids({...book,status:'done'}),[]);
assert.deepEqual(ids({...book,status:'past'}),['a']);
assert.deepEqual(ids(book,alloc,[],'2026-11-05'),[]);
assert.deepEqual(ids(book,[...alloc,{id:'a',date:'2026-11-06'}],[{id:'a',date:'2026-11-05'}],'2026-11-07'),['a']);
assert.deepEqual(ids({...book,confirmed:'2026-11-06'},alloc),[]);
console.log('PASS registration-only migration, explicit zero/progress records, rest days, completed/past books and date boundary');
