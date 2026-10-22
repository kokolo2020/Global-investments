// Held assets are quoted by CoinGecko ID, independently of market-list eligibility.
const headers={'content-type':'application/json','cache-control':'no-store'};
const fresh=at=>Number.isFinite(at)&&at>0&&at<=Date.now()+60000&&Date.now()-at<300000;
async function json(url){const r=await fetch(url,{headers:{accept:'application/json','cache-control':'no-cache'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Provider unavailable');return r.json();}
async function exchangeQuote(id){
 try{
  if(id==='gatechain-token'){
   const d=await json('https://api.gateio.ws/api/v4/spot/order_book?currency_pair=GT_USDT&limit=1');
   const bid=Number(d.bids?.[0]?.[0]),ask=Number(d.asks?.[0]?.[0]),at=Number(d.current);
   if(bid>0&&ask>=bid&&ask/bid<1.1&&fresh(at))return {price:(bid+ask)/2,updatedAt:at,source:'Gate midpoint · USDT ≈ USD'};
  }
  if(id==='kucoin-shares'){
   const d=await json('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=KCS-USDT');
   const bid=Number(d.data?.bestBid),ask=Number(d.data?.bestAsk),at=Number(d.data?.time);
   if(d.code==='200000'&&bid>0&&ask>=bid&&ask/bid<1.1&&fresh(at))return {price:(bid+ask)/2,updatedAt:at,source:'KuCoin midpoint · USDT ≈ USD'};
  }
 }catch(e){}
 return null;
}
exports.handler=async(event={})=>{
 const ids=[...new Set(String(event.queryStringParameters?.ids||'').split(',').filter(Boolean))];
 if(!ids.length||ids.length>10||ids.some(id=>!/^[a-z0-9-]{1,100}$/.test(id)))return {statusCode:400,headers,body:JSON.stringify({error:'Supply 1–10 valid asset IDs'})};
 const params=new URLSearchParams({ids:ids.join(','),vs_currencies:'usd',include_last_updated_at:'true'});
 const [market,exchange]=await Promise.all([
  json('https://api.coingecko.com/api/v3/simple/price?'+params).catch(()=>({})),
  Promise.all(ids.map(exchangeQuote))
 ]);
 const quotes={};
 for(let i=0;i<ids.length;i++){
  const id=ids[i],q=market[id],at=Number(q?.last_updated_at)*1000;
  const cg=Number.isFinite(q?.usd)&&q.usd>0&&Number.isFinite(at)&&at>0&&at<=Date.now()+60000?{price:q.usd,updatedAt:at,source:'CoinGecko USD'}:null;
  const selected=exchange[i]||cg;
  if(selected){const age=Math.max(0,Date.now()-selected.updatedAt);quotes[id]={...selected,validForMs:Math.max(0,300000-age),delayedForMs:Math.max(0,1800000-age)};}
 }
 return {statusCode:Object.keys(quotes).length?200:503,headers,body:JSON.stringify({source:'Public market data',quotes})};
};
