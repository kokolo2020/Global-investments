// V4.5 Coin research details. Public market data only, no investment orders.
exports.handler=async e=>{
 const id=new URLSearchParams(e.queryStringParameters||{}).get("id");
 if(!id||!/^[a-z0-9-]{2,90}$/.test(id))return {statusCode:400,body:JSON.stringify({error:"Invalid asset"})};
 try{
  const base="https://api.coingecko.com/api/v3/coins/";
  const fetchJson=async url=>{let r=await fetch(url,{headers:{accept:"application/json","user-agent":"GlobalInvestmentChallenge/4.5"},signal:AbortSignal.timeout(11000)});if(!r.ok)throw Error("Provider HTTP "+r.status);return r.json()};
  const [d,h]=await Promise.all([fetchJson(base+encodeURIComponent(id)+"?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false"),fetchJson(base+encodeURIComponent(id)+"/market_chart?vs_currency=usd&days=365&interval=daily").catch(()=>null)]);
  const m=d.market_data||{},u=x=>x?.usd??null;
  const prices=h?.prices||[],now=Date.now(),cut=now-365*86400000,first=prices.find(p=>p[0]>=Date.UTC(new Date().getUTCFullYear(),0,1));
  const ytd=first&&m.current_price?.usd>0?((m.current_price.usd/first[1])-1)*100:null;
  const points=prices.filter(p=>p[0]>=cut).map(p=>({t:p[0],p:p[1]}));
  return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public,max-age=180"},body:JSON.stringify({
   id:d.id,name:d.name,symbol:d.symbol,image:d.image?.large,rank:d.market_cap_rank,description:(d.description?.en||"").replace(/<[^>]+>/g," ").slice(0,950),
   website:d.links?.homepage?.[0]||null,
   price:u(m.current_price),ath:u(m.ath),athDate:m.ath_date?.usd,atl:u(m.atl),atlDate:m.atl_date?.usd,
   athChange:u(m.ath_change_percentage),atlChange:u(m.atl_change_percentage),ytd,
   marketCap:u(m.market_cap),volume24h:u(m.total_volume),high24h:u(m.high_24h),low24h:u(m.low_24h),
   change24h:m.price_change_percentage_24h,change7d:m.price_change_percentage_7d,change30d:m.price_change_percentage_30d,
   circulatingSupply:m.circulating_supply,totalSupply:m.total_supply,maxSupply:m.max_supply,
   sparkline:points,timestamp:new Date().toISOString()
  })};
 }catch(err){return {statusCode:503,headers:{"content-type":"application/json"},body:JSON.stringify({error:"Coin research provider temporarily unavailable"})}}
};