// V5.6: rank 50 candidates selected from the original top 200 by global market cap.
// Scores are transparent quantitative screening, NOT machine-learning predictions.
const {isEligible}=require("./top50");
exports.handler=async()=>{
 try{
  const url="https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=7d%2C30d";
  const r=await fetch(url,{headers:{accept:"application/json","user-agent":"GlobalInvestmentChallenge/5.6"},signal:AbortSignal.timeout(14000)});
  if(!r.ok)throw Error("market source HTTP "+r.status);
  const raw=await r.json();if(!Array.isArray(raw)||raw.length<170)throw Error("incomplete top-200 snapshot");
  const score=x=>{
   const rank=Number(x.market_cap_rank)||201,vol=Number(x.total_volume)||0,cap=Number(x.market_cap)||0;
   const w=Number(x.price_change_percentage_7d_in_currency),m=Number(x.price_change_percentage_30d_in_currency);
   let n=25+Math.max(0,(201-rank)/200)*30;
   n+=vol>=1e9?20:vol>=1e8?14:vol>=2e7?8:0;
   if(Number.isFinite(w))n+=w>0&&w<30?9:w< -20?-8:w>50?-6:2;
   if(Number.isFinite(m))n+=m>0&&m<80?10:m< -30?-10:m>120?-6:2;
   const turnover=cap>0?vol/cap:0;n+=turnover>=.015&&turnover<=.5?6:turnover<.005?-6:0;
   const circulating=Number(x.circulating_supply),max=Number(x.max_supply);
   if(max>0&&circulating>0&&circulating/max<.5)n-=6;
   return Math.round(Math.max(0,Math.min(100,n)));
  };
  const picks=raw.filter(x=>isEligible(x)&&Number(x.market_cap_rank)>=1&&Number(x.market_cap_rank)<=200).map(x=>({
   id:x.id,symbol:x.symbol.toUpperCase(),name:x.name,rank:x.market_cap_rank,price:x.current_price,
   change24h:x.price_change_percentage_24h,change7d:x.price_change_percentage_7d_in_currency,
   change30d:x.price_change_percentage_30d_in_currency,marketCap:x.market_cap,volume24h:x.total_volume,
   athChange:x.ath_change_percentage,circulatingSupply:x.circulating_supply,maxSupply:x.max_supply,score:score(x)
  })).sort((a,b)=>b.score-a.score||a.rank-b.rank).slice(0,50);
  if(picks.length!==50)throw Error("fewer than 50 screened candidates");
  return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public,max-age=120"},body:JSON.stringify({timestamp:new Date().toISOString(),source:"CoinGecko",universe:"Top 200 by market capitalization",method:"Rule-based liquidity, size, momentum and dilution score",coins:picks})};
 }catch(e){return {statusCode:503,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({error:"Live Top 50 research feed unavailable; export paused."})}}
};
