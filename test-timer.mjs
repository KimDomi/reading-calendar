import assert from 'node:assert/strict';
import {remainingTime} from './dist/timer.js';
const running = {status:'running', minutes:25, endsAt:2000000, remaining:1500000};
assert.equal(remainingTime(running, 500000), 1500000);
assert.equal(remainingTime(running, 560000), 1440000);
// Reopening computes from the deadline, even if no tick ran in the background.
assert.equal(remainingTime(JSON.parse(JSON.stringify(running)), 1900000), 100000);
assert.equal(remainingTime(running, 2100000), 0);
const paused = {...running,status:'paused',remaining:90000,endsAt:null};
assert.equal(remainingTime(paused, 500000), 90000);
assert.equal(remainingTime(paused, 9000000), 90000);
assert.equal(remainingTime(running, 0), 1500000);
console.log('PASS timer deadline recovery, paused time, expiration and clock rollback bound');
