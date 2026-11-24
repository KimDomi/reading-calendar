import {isRestDay,readingDays} from './rest-days.js?v=270c12ac63f1';
const DAY_MS = 86400000;
const dayNumber = date => Math.floor(Date.parse(date + 'T12:00:00Z') / DAY_MS);
export const add = (date, amount) => {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
};
export const days = (start, end) => dayNumber(end) - dayNumber(start) + 1;
export const isDaily = book => book.basis === 'daily';

// Deadline books may share a boundary day. Fixed daily books always keep their
// own quota, and the next book starts the following day.
function allocateQueue(books, start, restDays = {}) {
  const queue = books.map(book => ({
    ...book, left: book.total - book.page, pos: book.page,
    deadlineDay: isDaily(book) ? null : dayNumber(book.deadline),
  })).filter(book => book.left > 0 && (isDaily(book)||readingDays(start,book.deadline,restDays)>0));
  const result = [];
  let head = 0, date = start, readingIndex = 0;
  const availability = new Map(queue.filter(b=>!isDaily(b)).map(b=>[b.deadline,readingDays(start,b.deadline,restDays)]));
  function take(book, amount) {
    result.push({id: book.id, date, from: book.pos + 1, to: book.pos + amount, n: amount});
    book.pos += amount;
    book.left -= amount;
    if (book.left === 0) head++;
  }
  while (head < queue.length) {
    if(isRestDay(date,restDays)){date=add(date,1);continue;}
    const front = queue[head];
    if (isDaily(front)) {
      const quota = Number(front.dailyPages);
      if (!Number.isInteger(quota) || quota < 1) {
        throw Error('하루 분량을 1쪽 이상의 정수로 설정해 주세요.');
      }
      take(front, Math.min(front.left, quota));
    } else {
      let pages = 0, fixedDays = 0, budget = 1;
      for (let i = head; i < queue.length; i++) {
        const book = queue[i];
        if (isDaily(book)) fixedDays += Math.ceil(book.left / book.dailyPages);
        else {
          pages += book.left;
          budget = Math.max(budget, Math.ceil(pages / Math.max(1, availability.get(book.deadline) - readingIndex - fixedDays)));
        }
      }
      while (budget > 0 && head < queue.length && !isDaily(queue[head])) {
        const book = queue[head], amount = Math.min(budget, book.left);
        take(book, amount);
        budget -= amount;
      }
    }
    date = add(date, 1);
    readingIndex++;
  }
  return result;
}
export function allocate(books, start, restDays) { return allocateQueue(books, start, restDays); }
export function allocateMixed(books, start, restDays) { return allocateQueue(books, start, restDays); }

export function recalc(state, ids, today, start = today, clearFrom = start) {
  const affected = new Set(ids);
  state.alloc = state.alloc.filter(row => !affected.has(row.id) || row.date < clearFrom);
  const active = state.books.filter(book => affected.has(book.id) && book.status === 'active' && (isDaily(book) || book.deadline >= start));
  const append = rows => { for (const row of rows) state.alloc.push(row); };
  for (const book of active) if (book.mode === 'parallel') append(allocateMixed([book], start, state.restDays));
  append(allocateMixed(active.filter(book => book.mode === 'sequence').sort((a, b) => a.order - b.order), start, state.restDays));
}

export function deadlineMisses(books, allocations) {
  const finishes = new Map();
  for (const row of allocations) if (row.date > (finishes.get(row.id) || '')) finishes.set(row.id, row.date);
  return books.filter(book => book.status === 'active' && !isDaily(book))
    .map(book => ({book, finish: finishes.get(book.id) || ''}))
    .filter(item => item.finish > item.book.deadline);
}

// Validate the entire confirmation batch before changing any saved progress.
export function recordMany(state, changes, today, options = {}) {
  const zeroMode = options?.zeroMode === 'from-today' ? 'from-today' : 'skip-today';
  const byId = new Map(state.books.map(book => [book.id, book]));
  const seen = new Set();
  const parallelToday = new Set(), parallelTomorrow = new Set(), parallelClearToday = new Set();
  let sequenceChanged = false, sequenceHasProgress = false;
  for (const {id, page} of changes) {
    const book = byId.get(id);
    if (!book || seen.has(id) || book.status === 'done' || !Number.isInteger(page) || page < book.page || page > book.total) {
      throw Error('현재 진도 이상, 전체 쪽수 이하로 입력해 주세요.');
    }
    seen.add(id);
  }
  for (const {id, page} of changes) {
    const book = byId.get(id);
    const delta = page - book.page;
    state.records.push({id, date: today, delta, page});
    book.page = page;
    book.confirmed = today;
    if (page === book.total) { book.status = 'done'; book.finished = today; }
    if (book.mode === 'sequence') {
      sequenceChanged = true;
      if (delta > 0) sequenceHasProgress = true;
    } else if (delta > 0) {
      parallelTomorrow.add(id);
    } else if (zeroMode === 'from-today') {
      parallelToday.add(id);
    } else {
      parallelClearToday.add(id);
    }
  }
  const tomorrow = add(today, 1);
  if (parallelToday.size) recalc(state, [...parallelToday], today, today, today);
  if (parallelTomorrow.size) recalc(state, [...parallelTomorrow], today, tomorrow, tomorrow);
  if (parallelClearToday.size) recalc(state, [...parallelClearToday], today, tomorrow, today);
  if (sequenceChanged) {
    const seqIds = state.books.filter(book => book.mode === 'sequence').map(book => book.id);
    if (sequenceHasProgress) recalc(state, seqIds, today, tomorrow, tomorrow);
    else if (zeroMode === 'from-today') recalc(state, seqIds, today, today, today);
    else recalc(state, seqIds, today, tomorrow, today);
  }
}
export function record(state, id, page, today, options) { recordMany(state, [{id, page}], today, options); }

export function graph(records, id) {
  const totals = new Map();
  for (const row of records) if (row.id === id) totals.set(row.date, (totals.get(row.date) || 0) + row.delta);
  const dates = [...totals.keys()].sort(), result = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (i > 0) {
      const gapStart = add(dates[i - 1], 1), gapDays = days(gapStart, date) - 1;
      if (gapDays > 5) result.push({date: gapStart, end: add(date, -1), gap: gapDays});
      else for (let n = 0; n < gapDays; n++) result.push({date: add(gapStart, n), n: null});
    }
    result.push({date, n: totals.get(date)});
  }
  return result;
}

export function recommendation(books, start, restDays) {
  const current = books.filter(book => book.status === 'active' && book.mode === 'sequence' && (isDaily(book) || book.deadline >= start)).sort((a, b) => a.order - b.order);
  const dated = current.filter(book => !isDaily(book));
  if (current.length < 2 || !dated.length) return null;
  const schedule = allocateMixed(current, start, restDays);
  if (!dated.some((book, i) => i > 0 && dated[i - 1].deadline > book.deadline) && !deadlineMisses(current, schedule).length) return null;
  const suggested = [...current].sort((a, b) => Number(isDaily(a)) - Number(isDaily(b)) || (!isDaily(a) ? a.deadline.localeCompare(b.deadline) : 0) || a.order - b.order);
  if (current.every((book, i) => book.id === suggested[i].id)) return null;
  const peak = rows => {
    const totals = new Map(); let max = 0;
    for (const row of rows) { const n = (totals.get(row.date) || 0) + row.n; totals.set(row.date, n); max = Math.max(max, n); }
    return max;
  };
  return {current, suggested, before: peak(schedule), after: peak(allocateMixed(suggested, start, restDays))};
}

export function moveBook(state, id, group, today) {
  const book = state.books.find(book => book.id === id);
  if (!book || book.status === 'done') throw Error('이동할 계획을 찾을 수 없어요.');
  if (!['parallel', 'sequence', 'past'].includes(group)) throw Error('지원하지 않는 읽기 방식이에요.');
  if (book.status === 'past' && group !== 'past') throw Error('새 목표일을 지정해 다시 시작해 주세요.');
  const affected = new Set([id, ...state.books.filter(book => book.mode === 'sequence').map(book => book.id)]);
  if (group === 'past') { book.status = 'past'; book.reason = '직접 중단'; }
  else { book.mode = group; book.order = state.books.reduce((max, book) => Math.max(max, book.order), 0) + 1; }
  recalc(state, [...affected], today);
}
