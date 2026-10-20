const IDS = {"BTC":"bitcoin","ETH":"ethereum","SOL":"solana","XRP":"ripple","BNB":"binancecoin","DOGE":"dogecoin","ADA":"cardano","TRX":"tron","LINK":"chainlink","AVAX":"avalanche-2","XLM":"stellar","SUI":"sui","LTC":"litecoin","DOT":"polkadot","BCH":"bitcoin-cash","UNI":"uniswap","NEAR":"near","APT":"aptos","ETC":"ethereum-classic","HBAR":"hedera-hashgraph"};
exports.handler = async () => {
  try {
    const url="https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,dogecoin,cardano,tron,chainlink,avalanche-2,stellar,sui,litecoin,polkadot,bitcoin-cash,uniswap,near,aptos,ethereum-classic,hedera-hashgraph&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true";
    const r=await fetch(url,{headers:{"accept":"application/json","user-agent":"GlobalInvestmentChallenge/1.1"}});
    if(!r.ok)throw Error("Provider HTTP "+r.status);
    const json=await r.json();
    const quotes={};
    for(const [symbol,id] of Object.entries(IDS)){
      const x=json[id];
      if(!x || !(x.usd>0) || !Number.isFinite(x.usd))continue;
      quotes[symbol]={price:x.usd,change:Number(x.usd_24h_change)||0,updatedAt:x.last_updated_at?new Date(x.last_updated_at*1000).toISOString():new Date().toISOString()};
    }
    if(Object.keys(quotes).length!==20)throw Error("Incomplete provider response");
    return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public, max-age=15"},body:JSON.stringify({source:"CoinGecko",quotes})};
  }catch(e){return {statusCode:503,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({error:"Live quotes unavailable"})};}
};