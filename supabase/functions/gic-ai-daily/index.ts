import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"access-control-allow-origin":"*","access-control-allow-methods":"GET,OPTIONS","access-control-allow-headers":"content-type","content-type":"application/json","cache-control":"no-store"};
const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
// 07:00 Bangkok is 00:00 UTC. The challenge date is the UTC date, not Bangkok's calendar date.
const challengeDay=(now=new Date())=>now.toISOString().slice(0,10);
const resetAt=(day:string)=>day+"T00:00:00.000Z";
const isPremature=(record:any,day:string)=>record&&Date.parse(record.created_at)<Date.parse(resetAt(day));
const feed=async()=>{const url="https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=7d";const res=await fetch(url,{headers:{accept:"application/json","user-agent":"GIC-AI-Daily-Challenge/1.0"},signal:AbortSignal.timeout(14000)});if(!res.ok)throw Error("Market API HTTP "+res.status);const data=await res.json();if(!Array.isArray(data)||data.length<100)throw Error("Insufficient market universe");return data;};
const excluded=new Set(["USDT","USDC","DAI","USDE","USDS","FDUSD","RLUSD","PYUSD","USD1","JST","POL","RENDER","PI","INJ","M","EURSAFO","U","HTX","BFUSD","USDGO"]);
const eligible=(x:any)=>x&&x.current_price>0&&x.market_cap>0&&x.total_volume>=5000000&&!excluded.has(String(x.symbol).toUpperCase())&&!/(stablecoin|bridged usd|wrapped usd|treasury|overnight fund|money market|tokenized bond)/i.test(String(x.name));
function choose(raw:any[]){return raw.filter(eligible).map(x=>{const week=Number(x.price_change_percentage_7d_in_currency),day=Number(x.price_change_percentage_24h);const side=Number.isFinite(week)&&week< -2?-1:1;let score=(Math.log10(Math.max(1,x.total_volume))*5)+Math.max(-15,Math.min(15,side*week))+Math.max(-5,Math.min(5,side*day))-(Number(x.market_cap_rank)||200)/18;return {id:x.id,symbol:String(x.symbol).toUpperCase(),name:x.name,entry:Number(x.current_price),side,leverage:3,margin:250,score:Math.round(score*10)/10}}).sort((a,b)=>b.score-a.score).slice(0,10);}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return new Response("",{headers:cors});if(req.method!=="GET")return response({error:"Read only"},405);try{
 const day=challengeDay();let {data:record,error}=await client.from("gic_ai_daily_baskets").select("*").eq("day_bkk",day).maybeSingle();if(error)throw error;
 let raw:any[]=[],quoteError:string|null=null;
 if(!record||isPremature(record,day)){raw=await feed();const entries=choose(raw);if(entries.length!==10)throw Error("Insufficient eligible assets");// Repair only a basket created before this challenge's real boundary. Keep prior days.
 const values={entries,starting_equity:2500,created_at:new Date().toISOString()};
 const ins=record
 ?await client.from("gic_ai_daily_baskets").update(values).eq("day_bkk",day).eq("created_at",record.created_at)
 :await client.from("gic_ai_daily_baskets").upsert({day_bkk:day,...values},{onConflict:"day_bkk",ignoreDuplicates:true});
 if(ins.error)throw ins.error;const reread=await client.from("gic_ai_daily_baskets").select("*").eq("day_bkk",day).single();if(reread.error)throw reread.error;record=reread.data;}
 if(!raw.length){try{raw=await feed()}catch(e){quoteError=String(e)}}
 const map=new Map(raw.map(x=>[x.id,x]));let equity=0,marked=0;const positions=(record.entries||[]).map((x:any)=>{const q=map.get(x.id);const price=q&&Number(q.current_price)>0?Number(q.current_price):null;const pnl=price!=null?x.margin*x.leverage*x.side*(price/x.entry-1):null;if(pnl!=null){equity+=Math.max(0,x.margin+pnl);marked++;}return {...x,price,quoteAt:q?.last_updated||null,pnl,pnlPercent:pnl==null?null:100*pnl/x.margin}});
 const times=positions.map((p:any)=>Date.parse(p.quoteAt)).filter(Number.isFinite);
 const quoteAsOf=times.length===10?new Date(Math.min(...times)).toISOString():null;
 const quotesStale=!quoteAsOf||Date.now()-Date.parse(quoteAsOf)>5*60000;
 return response({version:"5.8",date:day,basketCreatedAt:record.created_at,periodStart:resetAt(day),nextResetAt:new Date(Date.parse(resetAt(day))+86400000).toISOString(),quoteAsOf,quotesStale,resetTime:"07:00 Asia/Bangkok",startingEquity:2500,equity:marked===10?equity:null,pnl:marked===10?equity-2500:null,roi:marked===10?(equity/2500-1)*100:null,positions,quotesComplete:marked===10&&!quotesStale,quoteError,asOf:new Date().toISOString(),rankingMethod:"Deterministic momentum-liquidity research, equal margin 3x, no fees/slippage",limitations:"Daily AI basket is new starting capital each day. Human leaderboard equity is cumulative; comparisons must be labeled daily versus cumulative."});
 }catch(e){return response({error:"AI basket unavailable; no simulated values shown",details:String(e).slice(0,200)},503)}});

