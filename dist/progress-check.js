const preceding=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
export function unconfirmedBookIds(books,allocations,records,today){
  const latest=new Map();
  for(const record of records)if(record.date>(latest.get(record.id)||''))latest.set(record.id,record.date);
  const cutoffs=new Map();
  for(const book of books){
    if(book.status==='done')continue;
    let confirmed=book.confirmed;
    // Older versions marked creation as confirmed without recording any progress.
    if(confirmed===book.created&&!latest.has(book.id))confirmed=null;
    cutoffs.set(book.id,[confirmed||preceding(book.created),latest.get(book.id)||''].sort().at(-1));
  }
  const result=new Set();
  for(const row of allocations)if(cutoffs.has(row.id)&&row.date<today&&row.date>cutoffs.get(row.id))result.add(row.id);
  return result;
}
