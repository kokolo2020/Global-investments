const assert=require('node:assert/strict');
const html=require('node:fs').readFileSync(__dirname+'/../index.html','utf8');
const source=html.slice(html.indexOf('function reverseTradePlan('),html.indexOf('function requestNickname('));
const run=new Function('s','market','fresh','accepted',`
 const positionQuote=id=>fresh?market.find(c=>c.id===id&&c.price>0):null;
 const cash=String,price=String,alert=()=>{},confirm=()=>accepted;
 let writes=0;const persist=()=>writes++,snapshot=()=>{},draw=()=>{},renderSelections=()=>{},renderMarket=()=>{};
 ${source}
 flipPosition('btc');return writes;
`);
const state=(side=1,cash=0)=>({cash,positions:[{id:'btc',symbol:'BTC',entry:100,margin:250,leverage:3,side},{id:'eth',symbol:'ETH',entry:50,margin:50,leverage:3,side:1}],history:[]});
for(const side of [1,-1])for(const mark of [90,100,110])for(const balance of [0,100]){
 const s=state(side,balance),other={...s.positions[1]};
 const before=balance+250+750*side*(mark/100-1);
 assert.equal(run(s,[{id:'btc',price:mark}],true,true),1);
 assert.ok(Math.abs(s.cash+s.positions[0].margin-before)<1e-8,'equity conserved');
 assert.equal(s.positions[0].side,-side);assert.equal(s.positions[0].entry,mark);
 assert.equal(s.positions.length,2);assert.deepEqual(s.positions[1],other);
 assert.equal(s.history.length,1);assert.equal(s.history[0].side,side);
 assert.equal(s.history[0].reason,'direction-switch');assert.ok(s.cash>=0);
}
for(const [fresh,accepted,quotes] of [[false,true,[{id:'btc',price:110}]],[true,false,[{id:'btc',price:110}]],[true,true,[]],[true,true,[{id:'btc',price:0}]],[true,true,[{id:'btc',price:60}]]]){
 const s=state(),before=structuredClone(s);assert.equal(run(s,quotes,fresh,accepted),0);assert.deepEqual(s,before);
}
console.log('PASS: 12 Long/Short gain/loss cases preserve equity, other coins, history and persistence; stale/missing/invalid prices, liquidation and cancellation leave state unchanged.');
