// Fetch observed historical price windows for a single selected Quant Orb asset.
const {isEligible}=require('./top50');
exports.handler=async(event)=>{
 try{
 const id=String(event.queryStringParameters?.id||'').trim();
 if(!/^[a-z0-9-]{2,90}$/.test(id))return {statusCode:400,body:JSON.stringify({error:'Invalid coin ID'})};
 const now=Date.now();const url='https://api.coingecko.com/api/v3/coins/'+encodeURIComponent(id)+'/market_chart?vs_currency=usd&days=1';
 const r=await fetch(url,{headers:{accept:'application/json','user-agent':'GlobalInvestmentChallenge-QuantOrb/1.2'},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('provider '+r.status);
 const d=await r.json(),pts=Array.isArray(d.prices)?d.prices.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number(p[1])>0).sort((a,b)=>a[0]-b[0]):[];
 if(pts.length<5)throw Error('Insufficient historical prices');
 const last=pts[pts.length-1];if(now-last[0]>20*60000)throw Error('Stale chart history');
 const horizons=[4,6,12],changes={};
 for(const h of horizons){const target=last[0]-h*3600000,closest=pts.reduce((a,b)=>Math.abs(b[0]-target)<Math.abs(a[0]-target)?b:a);changes[h+'h']=Math.abs(closest[0]-target)<=45*60000?((last[1]/closest[1])-1)*100:null;}
 return {statusCode:200,headers:{'content-type':'application/json','cache-control':'public,max-age=300,stale-while-revalidate=90'},body:JSON.stringify({id,asOf:new Date(last[0]).toISOString(),source:'CoinGecko 1-day price history',changes})};
 }catch(e){return {statusCode:503,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({error:'Historical momentum unavailable'})}}
};
