// Historical 60/90-day percentage movements from CoinGecko observed USD prices.
const cache=new Map();
exports.handler=async(event)=>{const id=String(event.queryStringParameters?.id||'').trim();if(!/^[a-z0-9-]{2,85}$/.test(id))return{statusCode:400,body:JSON.stringify({error:'Invalid ID'})};
const cached=cache.get(id);if(cached&&Date.now()-cached.time<6*3600000)return{statusCode:200,headers:{'content-type':'application/json','cache-control':'public,max-age=21600'},body:JSON.stringify(cached.data)};
try{const url='https://api.coingecko.com/api/v3/coins/'+encodeURIComponent(id)+'/market_chart?vs_currency=usd&days=91';
const r=await fetch(url,{headers:{accept:'application/json','user-agent':'GlobalInvestmentChallenge/ReportHistory'},signal:AbortSignal.timeout(13000)});if(!r.ok)throw Error('Historical provider '+r.status);
const d=await r.json(),pts=Array.isArray(d.prices)?d.prices.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0).sort((a,b)=>a[0]-b[0]):[];
if(pts.length<60)throw Error('Insufficient history');const last=pts[pts.length-1];if(Date.now()-last[0]>36*3600000)throw Error('Stale history');const out={id,asOf:new Date(last[0]).toISOString(),change60d:null,change90d:null,source:'CoinGecko observed price history'};
for(const days of [60,90]){const t=last[0]-days*86400000;const closest=pts.reduce((a,b)=>Math.abs(b[0]-t)<Math.abs(a[0]-t)?b:a);if(Math.abs(closest[0]-t)<36*3600000)out['change'+days+'d']=100*(last[1]/closest[1]-1)}
cache.set(id,{time:Date.now(),data:out});return{statusCode:200,headers:{'content-type':'application/json','cache-control':'public,max-age=21600'},body:JSON.stringify(out)}}catch(e){return{statusCode:503,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({error:'Historical return unavailable'})}}};
