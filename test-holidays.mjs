import assert from 'node:assert/strict';
import {holidays} from './dist/holidays.js';
for (const date of ['2026-02-16','2026-02-17','2026-02-18','2026-03-02','2026-05-25','2026-06-03','2026-09-24','2026-09-25','2026-09-26','2027-02-06','2027-02-09']) assert.ok(holidays[date],date);
for (const date of ['2026-02-19','2026-09-27','2026-06-08']) assert.ok(!holidays[date],date);
console.log('PASS Korean lunar spans, substitutes, election day and adjacent workdays');
