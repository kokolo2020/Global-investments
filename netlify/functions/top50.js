// V4.3: Top 70 eligible liquid tradable cryptocurrencies by market capitalization.
// Filtering is based on known pegged-asset identities, not a $1 spot price.
const STABLE_IDS = new Set([
  "tether","usd-coin","dai","ethena-usde","usds","first-digital-usd",
  "paypal-usd","true-usd","frax","frax-usd","usual-usd","usdd",
  "usd1-wlfi","world-liberty-financial-usd","ripple-usd","rlusd",
  "binance-usd","pax-dollar","paxos-standard","gemini-dollar",
  "liquity-usd","crvusd","curve-dao-token-usd","gho","euro-coin",
  "stasis-eurs","tether-eurt","eurt","s-usde","susde","savings-usds",
  "ondo-us-dollar-yield","usdy","usdb","usde","usdt","usdc",
  "bridged-usdc-polygon-pos-bridge","bridged-usdt","wrapped-usd",
  "tether-gold-usd","blackrock-usd-institutional-digital-liquidity-fund",
  "ustc","terrausd","terrausd-wormhole","origin-dollar","magic-internet-money",
  "alchemix-usd","stable","reserve-rights-stablecoin","feusd","usda",
  "usdf","usdt0","usdc-e","usd0","usd0++","usdtb","usdfi","usdf"
]);
const STABLE_SYMBOLS = new Set([
  "USDT","USDT0","USDC","USDC.E","DAI","USDE","SUSDE","USDS","SUSDS",
  "FDUSD","PYUSD","TUSD","FRAX","FRXUSD","USDD","USD1","RLUSD","BUSD",
  "USDP","GUSD","LUSD","CRVUSD","GHO","USDA","USDB","USDY","USD0",
  "USD0++","USDF","USDTB","USDFI","MIM","EURS","EURC","EURCV","EURT",
  "AEUR","EURI","EUROP","EUROE","USDG","USDH","USDQ","USTC","USDX"
]);
// Explicit user-selected exclusions, even for otherwise legitimate crypto projects.
const EXCLUDED_IDS = new Set([
  "just","polygon-ecosystem-token","polygon","render-token","render","pi-network","injective-protocol",
  "memecore","spiko-amundi-overnight-swap-fund-eur","united-stables","htx-dao","bfusd","usdgo"
]);
const EXCLUDED_SYMBOLS = new Set(["JST","POL","RENDER","PI","INJ","M","EURSAFO","U","HTX","BFUSD","USDGO"]);
function excludedAsset(x) {
 const id=String(x.id||"").toLowerCase(),symbol=String(x.symbol||"").toUpperCase(),name=String(x.name||"").toLowerCase();
 return EXCLUDED_IDS.has(id)||EXCLUDED_SYMBOLS.has(symbol)
   || /(?:tokenized|tokenised|treasury|money market fund|overnight (?:swap|fund)|government bond|t-bill|yield.bearing (?:dollar|usd|stable)|wrapped usd|cash fund)/i.test(name);
}
function isStablecoin(x) {
  if (!x || !x.id || !x.symbol) return false;
  const id = x.id.toLowerCase(), symbol = x.symbol.toUpperCase(), name = String(x.name||"").toLowerCase();
  return STABLE_IDS.has(id) || STABLE_SYMBOLS.has(symbol)
    || /(?:stablecoin|stable coin|stable dollar|synthetic dollar|usd stable|euro stable)/i.test(name)
    || /^(?:bridged|wrapped|wormhole|binance-peg|axelar bridged)\s+(?:usdt|usdc|dai|usd[etcs]|eurc|busd)\b/i.test(name);
}
exports.isEligible = x => Boolean(x && x.id && x.symbol && Number.isFinite(x.current_price) && x.current_price > 0 && !isStablecoin(x) && !excludedAsset(x) && Number(x.total_volume)>=5000000);
exports.handler = async () => {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h";
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "GlobalInvestmentChallenge/4.3" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw Error("Market provider HTTP "+response.status);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw Error("Invalid market feed");
    const coins = rows.filter(exports.isEligible).slice(0,70).map(x => ({
      id:x.id, symbol:x.symbol, name:x.name, image:x.image,
      rank:x.market_cap_rank, price:x.current_price,
      change:Number(x.price_change_percentage_24h)||0
    }));
    if (coins.length < 70) throw Error("Not enough eligible liquid coins returned");
    return {statusCode:200, headers:{"content-type":"application/json","cache-control":"public,max-age=30"}, body:JSON.stringify({
      source:"CoinGecko top 70 eligible liquid crypto assets by market cap",
      timestamp:new Date().toISOString(),coins
    })};
  } catch(e) {
    return {statusCode:503,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({error:"Top-70 eligible liquid coin market feed unavailable. Trading paused."})};
  }
};
