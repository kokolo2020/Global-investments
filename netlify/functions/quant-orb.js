// Top-100 market-cap momentum scanner, no order execution.
const {isEligible}=require('./top50');
exports.handler=async()=>{try{
 const r=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d',{headers:{accept:'application/json','user-agent':'GlobalInvestmentChallenge-QuantOrb/1.0'},signal:AbortSignal.timeout(14000)});
 if(!r.ok)throw Error('market provider '+r.status);const raw=await r.json();if(!Array.isArray(raw)||raw.length<80)throw Error('incomplete market feed');
 const eligible=raw.filter(x=>isEligible(x)&&Number(x.total_volume)>1000000&&Number(x.price_change_percentage_1h_in_currency)>0);
 const coins=eligible.sort((a,b)=>Number(b.price_change_percentage_1h_in_currency)-Number(a.price_change_percentage_1h_in_currency)).slice(0,10).map(x=>({id:x.id,symbol:String(x.symbol).toUpperCase(),name:x.name,rank:x.market_cap_rank,price:x.current_price,change1h:x.price_change_percentage_1h_in_currency,change24h:x.price_change_percentage_24h_in_currency,change7d:x.price_change_percentage_7d_in_currency,volume24h:x.total_volume}));
 return {statusCode:200,headers:{'content-type':'application/json','cache-control':'public,max-age=50,stale-while-revalidate=10'},body:JSON.stringify({source:'CoinGecko',timestamp:new Date().toISOString(),universe:100,qualifying:eligible.length,coins,selection:'1h change > 0%; 24h reported volume > $1M; top 100 market cap; eligible assets only',mode:'Live observation, no execution'})}
 }catch(e){return {statusCode:503,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({error:'Live Quant Orb data unavailable; no invented signals.'})}}};
