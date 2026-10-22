const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const quoteSrc=html.slice(html.indexOf('function positionQuote('),html.indexOf('async function refreshHeldQuotes'));
const closeSrc=html.slice(html.indexOf('function close(i)'),html.indexOf('// Realize'));
const liquidation=html.slice(html.indexOf('function liquidate()'),html.indexOf('function snapshot()'));
const drawSrc=html.slice(html.indexOf('function draw()'),html.indexOf('function close(i)'));
function harness(quotes,accepted=true){
 const s={cash:5,positions:[{id:'gatechain-token',symbol:'GT',entry:10.2,margin:245,side:1,leverage:4},{id:'kucoin-shares',symbol:'KCS',entry:7.36,margin:250,side:1,leverage:4}],history:[]};
 const nodes={},$=id=>nodes[id]??={};
 return new Function('s','heldQuotes','$','accepted',`
 const coin=()=>null,valid=()=>false,START=2500,provider='test';const confirm=()=>accepted;
 const cash=n=>'$'+n.toFixed(2),price=cash,pct=n=>n.toFixed(2)+'%',color=n=>n>=0?'green':'red',esc=String;
 const document={querySelectorAll:()=>[]};const snapshot=()=>{},persist=()=>{},renderSelections=()=>{},renderMarket=()=>{},renderLeaders=()=>{},flipPosition=()=>{},alert=()=>{};
 ${quoteSrc}${closeSrc}${liquidation}${drawSrc}
 return {s,close,liquidate,draw,value,equity,positionQuote};
 `)(s,quotes,$,accepted);
}
const q=(price,age=0)=>({price,updatedAt:Date.now()-age});
let h=harness({'gatechain-token':q(11),'kucoin-shares':q(7)}),before=h.equity();
assert.ok(before>0);h.close(0);assert.equal(h.s.positions.length,1);assert.equal(h.s.history[0].exit,11);assert.ok(Math.abs(h.equity()-before)<1e-8);
h.close(0);assert.equal(h.s.positions.length,0);assert.ok(Math.abs(h.s.cash-before)<1e-8);
h=harness({});assert.equal(h.value(h.s.positions[0]),null);assert.equal(h.equity(),null);h.close(0);h.liquidate();assert.equal(h.s.positions.length,2);h.draw();
h=harness({'gatechain-token':q(11,301000)});assert.equal(h.positionQuote('gatechain-token'),null);h.close(0);assert.equal(h.s.history.length,0);
h=harness({'gatechain-token':q(1),'kucoin-shares':q(7)});h.liquidate();assert.equal(h.s.positions.length,1);assert.equal(h.s.history[0].pnl,-245);
const delayed={price:10,updatedAt:Date.now()-600000,expiresAt:Date.now()-1,delayedUntil:Date.now()+60000,source:'test delayed'};
h=harness({'gatechain-token':delayed},false);h.close(0);assert.equal(h.s.positions.length,2);
h=harness({'gatechain-token':delayed});h.close(0);assert.equal(h.s.positions.length,1);assert.equal(h.s.history[0].delayedQuote,true);assert.equal(h.s.history[0].exit,10);
console.log('PASS: GT/KCS close outside market list; equity conserved; missing/stale prices never fabricate P/L, close or liquidate; real liquidation remains supported.');
(async()=>{
 const {handler}=require('../netlify/functions/position-quotes');let called=[];const orig=global.fetch;
 global.fetch=async url=>{called.push(String(url));return {ok:true,json:async()=>({'gatechain-token':{usd:11,last_updated_at:Date.now()/1000},'kucoin-shares':{usd:7,last_updated_at:Date.now()/1000}})}};
 let r=await handler({queryStringParameters:{ids:'gatechain-token,kucoin-shares'}});assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).quotes['kucoin-shares'].price,7);assert.ok(called.some(u=>u.includes('gatechain-token')));
 global.fetch=async url=>({ok:true,json:async()=>String(url).includes('order_book')?{current:Date.now(),bids:[['9.96','1']],asks:[['9.98','1']]}:String(url).includes('kucoin.com')?{code:'200000',data:{time:Date.now(),bestBid:'7.29',bestAsk:'7.31'}}:({'gatechain-token':{usd:10,last_updated_at:(Date.now()-600000)/1000},'kucoin-shares':{usd:7,last_updated_at:(Date.now()-600000)/1000}})});
 r=await handler({queryStringParameters:{ids:'gatechain-token,kucoin-shares'}});let result=JSON.parse(r.body);assert.equal(result.quotes['gatechain-token'].price,9.97);assert.equal(result.quotes['kucoin-shares'].price,7.3);assert.ok(result.quotes['kucoin-shares'].validForMs>0);
 r=await handler({queryStringParameters:{ids:'bad/id'}});assert.equal(r.statusCode,400);
 global.fetch=async()=>{throw Error('offline')};r=await handler({queryStringParameters:{ids:'gatechain-token'}});assert.equal(r.statusCode,503);global.fetch=orig;
 console.log('PASS: ID-based quote endpoint, validation, provider outage handling.');
})().catch(e=>{console.error(e);process.exitCode=1});
