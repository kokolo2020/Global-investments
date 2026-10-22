// Quote held assets by immutable CoinGecko ID, independent of market-list eligibility.
const headers={'content-type':'application/json','cache-control':'no-store'};
exports.handler=async(event={})=>{
 const ids=[...new Set(String(event.queryStringParameters?.ids||'').split(',').filter(Boolean))];
 if(!ids.length||ids.length>10||ids.some(id=>!/^[a-z0-9-]{1,100}$/.test(id)))return {statusCode:400,headers,body:JSON.stringify({error:'Supply 1–10 valid asset IDs'})};
 try{
  const params=new URLSearchParams({ids:ids.join(','),vs_currencies:'usd',include_last_updated_at:'true'});
  const r=await fetch('https://api.coingecko.com/api/v3/simple/price?'+params,{headers:{accept:'application/json'},signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Market provider unavailable');
  const data=await r.json(),quotes={};
  for(const id of ids){const q=data[id],at=Number(q?.last_updated_at)*1000;
   if(Number.isFinite(q?.usd)&&q.usd>0&&Number.isFinite(at)&&at>0&&at<=Date.now()+60000)quotes[id]={price:q.usd,updatedAt:at};
  }
  return {statusCode:200,headers,body:JSON.stringify({source:'CoinGecko',quotes})};
 }catch(e){return {statusCode:503,headers,body:JSON.stringify({error:'Position quotes unavailable; retry shortly'})};}
};
