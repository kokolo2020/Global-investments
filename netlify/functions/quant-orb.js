const {isEligible}=require('./top50');
exports.handler=async()=>{try{
 const r=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d',{headers:{accept:'application/json','user-agent':'GlobalInvestmentChallenge-QuantOrb/1.1'},signal:AbortSignal.timeout(14000)});
 if(!r.ok)throw Error('market provider '+r.status);
 const raw=await r.json();if(!Array.isArray(raw)||raw.length<80)throw Error('incomplete market feed');
 const eligible=raw.filter(x=>isEligible(x)&&Number(x.total_volume)>1000000&&Number.isFinite(Number(x.price_change_percentage_1h_in_currency)));
 const map=x=>({id:x.id,symbol:String(x.symbol).toUpperCase(),name:x.name,rank:x.market_cap_rank,price:x.current_price,change1h:x.price_change_percentage_1h_in_currency,change24h:x.price_change_percentage_24h_in_currency,change7d:x.price_change_percentage_7d_in_currency,volume24h:x.total_volume});
 const positive=eligible.filter(x=>Number(x.price_change_percentage_1h_in_currency)>0).sort((a,b)=>b.price_change_percentage_1h_in_currency-a.price_change_percentage_1h_in_currency).slice(0,10).map(map);
 const negative=eligible.filter(x=>Number(x.price_change_percentage_1h_in_currency)<0).sort((a,b)=>a.price_change_percentage_1h_in_currency-b.price_change_percentage_1h_in_currency).slice(0,10).map(map);
 return {statusCode:200,headers:{'content-type':'application/json','cache-control':'public,max-age=50,stale-while-revalidate=10'},body:JSON.stringify({source:'CoinGecko',timestamp:new Date().toISOString(),universe:100,qualifying:eligible.length,positiveCount:eligible.filter(x=>x.price_change_percentage_1h_in_currency>0).length,negativeCount:eligible.filter(x=>x.price_change_percentage_1h_in_currency<0).length,coins:positive,positive,negative,mode:'Live observation, no execution'})};
 }catch(e){return {statusCode:503,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({error:'Live Quant Orb data unavailable; no invented signals.'})}}};
