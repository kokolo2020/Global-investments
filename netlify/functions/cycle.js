// V5.0 market cycle: public reference values only. Fail transparently on missing inputs.
exports.handler=async()=>{
 const json=async u=>{const r=await fetch(u,{headers:{accept:"application/json","user-agent":"GlobalInvestmentChallenge/5.0"},signal:AbortSignal.timeout(12500)});if(!r.ok)throw Error("Provider "+r.status);return r.json()};
 const base="https://api.coingecko.com/api/v3/";
 const out={source:"CoinGecko",timestamp:new Date().toISOString(),dominance:null,globalCap:null,globalVolume:null,btc:null,trend:null,notes:[]};
 try{
 const g=await json(base+"global");const d=g.data||{};out.dominance=d.market_cap_percentage?.btc??null;out.globalCap=d.total_market_cap?.usd??null;out.globalVolume=d.total_volume?.usd??null;out.marketCapChange24h=d.market_cap_change_percentage_24h_usd??null;
 }catch(e){out.notes.push("Global market data unavailable")}
 try{
 const arr=await json(base+"coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false");const b=arr?.[0];if(b){out.btc={price:b.current_price,change24h:b.price_change_percentage_24h,ath:b.ath,athChange:b.ath_change_percentage,marketCap:b.market_cap,volume24h:b.total_volume}}
 }catch(e){out.notes.push("BTC quote unavailable")}
 try{
 const d=await json(base+"coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily");
 const closes=(d.prices||[]).map(p=>p?.[1]).filter(v=>Number.isFinite(v)&&v>0);
 if(closes.length>=200){const mean=closes.slice(-200).reduce((a,b)=>a+b,0)/200;const latest=closes[closes.length-1];out.trend={latest,ma200:mean,above200:latest>mean,observationCount:closes.length};}
 else out.notes.push("Not enough daily BTC observations to compute 200-day average");
 }catch(e){out.notes.push("BTC 200-day trend unavailable")}
 return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public,max-age=300"},body:JSON.stringify(out)};
};
