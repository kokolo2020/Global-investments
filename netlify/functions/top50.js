const handler = async () => {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";
    const r = await fetch(url, { headers: { "accept": "application/json", "user-agent": "GlobalInvestmentChallenge/3.0" }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error("CoinGecko HTTP " + r.status);
    const data = await r.json();
    if (!Array.isArray(data) || data.length < 40) throw new Error("Market list unavailable");
    const coins = data.slice(0,50).filter(x => x && x.id && x.symbol && Number.isFinite(x.current_price) && x.current_price > 0).map(x => ({
      id: x.id,
      symbol: x.symbol,
      name: x.name,
      image: x.image,
      rank: x.market_cap_rank,
      price: x.current_price,
      change: Number(x.price_change_percentage_24h) || 0
    }));
    if (coins.length < 40) throw new Error("Not enough valid markets");
    return {statusCode: 200, headers: { "content-type": "application/json", "cache-control":"public,max-age=30" }, body: JSON.stringify({ source:"CoinGecko top 50 by market cap", timestamp:new Date().toISOString(), coins })};
  } catch(e) {
    return {statusCode:503,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({error:"Top-50 market feed unavailable. Trading paused."})};
  }
};
exports.handler = handler;
