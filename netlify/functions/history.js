const ids={BTC:"bitcoin",ETH:"ethereum",SOL:"solana",XRP:"ripple",BNB:"binancecoin",DOGE:"dogecoin",ADA:"cardano",TRX:"tron",LINK:"chainlink",AVAX:"avalanche-2",XLM:"stellar",SUI:"sui",LTC:"litecoin",DOT:"polkadot",BCH:"bitcoin-cash",UNI:"uniswap",NEAR:"near",APT:"aptos",ETC:"ethereum-classic",HBAR:"hedera-hashgraph"};
exports.handler=async event=>{
const symbol=(event.queryStringParameters?.symbol||"BTC").toUpperCase(),days=Number(event.queryStringParameters?.days||1);
if(!ids[symbol]||![1,7,30,90,365].includes(days))return {statusCode:400,body:"Invalid symbol or range"};
try{
const url="https://api.coingecko.com/api/v3/coins/"+ids[symbol]+"/market_chart?vs_currency=usd&days="+days;
const res=await fetch(url,{headers:{"accept":"application/json","user-agent":"GlobalInvestmentChallenge/1.9"}});
if(!res.ok)throw Error("History provider unavailable");
const json=await res.json(),points=(json.prices||[]).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
if(points.length<2)throw Error("History unavailable");
return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public, max-age=90"},body:JSON.stringify({symbol,days,source:"CoinGecko",points:points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/120))===0)})};
}catch(e){return {statusCode:503,headers:{"content-type":"application/json"},body:JSON.stringify({error:"Historical prices unavailable"})}}
};