const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=require('node:module').stripTypeScriptTypes(fs.readFileSync(__dirname+'/index.ts','utf8')); 
const challengeDay=eval(src.match(/const challengeDay=(.*);/)[1]);
const resetAt=eval(src.match(/const resetAt=(.*);/)[1].replace('day:string','day'));
const isPremature=eval(src.match(/const isPremature=(.*);/)[1].replace('record:any,day:string','record,day'));
assert.equal(challengeDay(new Date('2026-10-23T00:00:00+07:00')),'2026-10-22');
assert.equal(challengeDay(new Date('2026-10-23T06:59:59+07:00')),'2026-10-22');
assert.equal(challengeDay(new Date('2026-10-23T07:00:00+07:00')),'2026-10-23');
assert.equal(challengeDay(new Date('2026-11-01T00:01:00+07:00')),'2026-10-31');
assert.equal(isPremature({created_at:'2026-10-22T17:01:19Z'},'2026-10-23'),true);
assert.equal(isPremature({created_at:'2026-10-23T00:00:00Z'},'2026-10-23'),false);
// Execute the actual marking block with fixed basket entries and changing quotes.
const block=src.slice(src.indexOf('const map=new Map'),src.indexOf('\n const times='));
const mark=new Function('raw','record',block+';return {positions,equity,marked}');
const record={entries:[{id:'a',entry:100,side:1,margin:250,leverage:3},{id:'b',entry:100,side:-1,margin:250,leverage:3}]};
const first=mark([{id:'a',current_price:100},{id:'b',current_price:100}],record);
const second=mark([{id:'a',current_price:110},{id:'b',current_price:90}],record);
assert.equal(first.equity,500);assert.ok(Math.abs(second.equity-650)<1e-8);
assert.deepEqual(record.entries.map(x=>x.entry),[100,100]);
const missing=mark([{id:'a',current_price:110}],record);assert.equal(missing.marked,1);assert.equal(missing.positions[1].pnl,null);
console.log('PASS: 7AM boundary, midnight, month rollover, premature basket repair, live long/short P/L, fixed entry prices and missing quotes');
const html=fs.readFileSync(__dirname+'/../../../index.html','utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){new Function(m[1]);}
console.log('PASS: dashboard JavaScript syntax');
