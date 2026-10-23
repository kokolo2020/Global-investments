const ids={BTC:"bitcoin",ETH:"ethereum",SOL:"solana",BNB:"binancecoin",XRP:"ripple",LINK:"chainlink",AVAX:"avalanche-2",NEAR:"near",ADA:"cardano",DOT:"polkadot"};
let cache=null,at=0;
exports.handler=async()=>{
try{
if(cache && Date.now()-at<45000)return {statusCode:200,headers:{"Content-Type":"application/json","Cache-Control":"public,max-age=30"},body:JSON.stringify(cache)};
const url="https://api.coingecko.com/api/v3/simple/price?ids="+Object.values(ids).join(",")+"&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true";
const r=await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(11000)});
if(!r.ok)throw Error("Market data provider responded "+r.status);
const data=await r.json(),prices={};for(const [symbol,id] of Object.entries(ids)){const d=data[id];if(!d||!Number.isFinite(d.usd)||d.usd<=0||!Number.isFinite(d.last_updated_at))throw Error("Missing or stale quote: "+symbol);prices[symbol]={price:d.usd,change24h:d.usd_24h_change??null,updatedAt:d.last_updated_at};}
const oldest=Math.min(...Object.values(prices).map(x=>x.updatedAt));if(Date.now()/1000-oldest>600)throw Error("Price quote stale");cache={source:"CoinGecko",asOf:new Date().toISOString(),prices};at=Date.now();return {statusCode:200,headers:{"Content-Type":"application/json","Cache-Control":"public,max-age=30"},body:JSON.stringify(cache)};
}catch(e){return {statusCode:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:JSON.stringify({error:"Live price feed unavailable",detail:String(e.message||e)})}}
};