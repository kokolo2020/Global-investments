// V4.0 — deterministic trend-following decision library.
// This module does NOT schedule, submit, or execute orders. Server execution remains disabled.
// Candles must be sorted ascending, closed, and include close/high/low values.
const RULES=Object.freeze({capital:2500,leverage:3,maxPositions:10,marginCap:.8,marginPerTrade:250,dailyLossLimit:.05,stopMove:.02,targetMove:.04,trailingActivation:.02,adxThreshold:20});
function ema(prices,n){if(prices.length<n)return null;const k=2/(n+1);let v=prices.slice(0,n).reduce((a,b)=>a+b,0)/n;for(let i=n;i<prices.length;i++)v=k*prices[i]+(1-k)*v;return v}
function rsi(closes,n=14){if(closes.length<n+1)return null;let ups=0,downs=0;for(let i=closes.length-n;i<closes.length;i++){const d=closes[i]-closes[i-1];ups+=Math.max(0,d);downs+=Math.max(0,-d)}if(downs===0)return 100;return 100-100/(1+ups/downs)}
function atr(candles,n=14){if(candles.length<n+1)return null;let sum=0;for(let i=candles.length-n;i<candles.length;i++){const c=candles[i],prev=candles[i-1];sum+=Math.max(c.high-c.low,Math.abs(c.high-prev.close),Math.abs(c.low-prev.close))}return sum/n}
function signal(hourly,fourHourly){
 if(hourly.length<52||fourHourly.length<202)return {side:null,reason:"Insufficient closed candles"};
 if([...hourly,...fourHourly].some(c=>!Number.isFinite(c.close)||c.close<=0||!Number.isFinite(c.high)||!Number.isFinite(c.low)))return {side:null,reason:"Invalid candles"};
 const h=hourly.map(c=>c.close),f=fourHourly.map(c=>c.close),last=h[h.length-1],fast=ema(h,20),slow=ema(h,50),filter50=ema(f,50),filter200=ema(f,200),relative=rsi(h,14),volatility=atr(hourly,14);
 if(!volatility||!Number.isFinite(relative))return {side:null,reason:"Invalid indicators"};
 const long=fast>slow&&last>fast&&last>slow&&filter50>filter200&&relative>=50&&relative<=70;
 const short=fast<slow&&last<fast&&last<slow&&filter50<filter200&&relative>=30&&relative<=50;
 return {side:long?"LONG":short?"SHORT":null,reason:long?"Confirmed uptrend":short?"Confirmed downtrend":"No qualifying trend",indicators:{fast,slow,filter50,filter200,rsi:relative,atr:volatility}};
}
function riskCheck({equity,cash,marginCommitted,dailyStartEquity,positionsCount,proposedMargin,quoteFresh}){
 if(!quoteFresh)return "Stale quote";
 if(![equity,cash,marginCommitted,dailyStartEquity,positionsCount,proposedMargin].every(Number.isFinite))return "Invalid account values";
 if(equity<=0||dailyStartEquity<=0)return "No available equity";
 if(equity<=dailyStartEquity*(1-RULES.dailyLossLimit))return "Daily loss ceiling reached";
 if(positionsCount>=RULES.maxPositions)return "Position cap reached";
 if(proposedMargin<=0||proposedMargin>RULES.marginPerTrade)return "Invalid margin sizing";
 if(proposedMargin>cash)return "Insufficient cash";
 if(marginCommitted+proposedMargin>RULES.marginCap*equity)return "Margin cap reached";
 return null;
}
function levels(entry,side){if(!(entry>0)||!["LONG","SHORT"].includes(side))throw Error("Invalid entry");return {stop:entry*(side==="LONG"?.98:1.02),target:entry*(side==="LONG"?1.04:.96),leverage:RULES.leverage}}
function markToMarket({entry,mark,side,margin}){return margin*(1+RULES.leverage*(side==="LONG"?mark/entry-1:1-mark/entry))}
if(typeof module!=="undefined")module.exports={RULES,ema,rsi,atr,signal,riskCheck,levels,markToMarket};
