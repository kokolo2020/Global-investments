// V4.4 market intelligence. Uses same eligibility rules as game; no market orders.
const {isEligible}=require("./top50");
exports.handler=async()=>{
 try{
  const u="https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d%2C30d";
  const r=await fetch(u,{headers:{accept:"application/json","user-agent":"GlobalInvestmentChallenge/4.4"},signal:AbortSignal.timeout(14000)});
  if(!r.ok)throw Error("Provider "+r.status);
  const raw=await r.json();if(!Array.isArray(raw))throw Error("Provider format");
  const coins=raw.filter(isEligible).slice(0,100).map(x=>({
   id:x.id,symbol:x.symbol,name:x.name,image:x.image,rank:x.market_cap_rank,
   price:x.current_price,change1h:x.price_change_percentage_1h_in_currency,
   change24h:x.price_change_percentage_24h_in_currency,
   change7d:x.price_change_percentage_7d_in_currency,
   change30d:x.price_change_percentage_30d_in_currency,
   marketCap:x.market_cap,maxSupply:x.max_supply,totalSupply:x.total_supply,volume24h:x.total_volume,high24h:x.high_24h,low24h:x.low_24h,
   ath:x.ath,athChange:x.ath_change_percentage,circulatingSupply:x.circulating_supply,
   marketCapChange24h:x.market_cap_change_percentage_24h,sparkline7d:Array.isArray(x.sparkline_in_7d?.price)?x.sparkline_in_7d.price:[]
  }));
  if(coins.length<100)throw Error("Insufficient eligible markets");
  return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public,max-age=45"},body:JSON.stringify({source:"CoinGecko",mode:"Top 100 eligible liquid crypto assets",timestamp:new Date().toISOString(),coins})};
 }catch(e){return {statusCode:503,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({error:"Market intelligence feed temporarily unavailable. Try again shortly."})}}
};
