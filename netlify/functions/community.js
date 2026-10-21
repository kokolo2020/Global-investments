const crypto = require("node:crypto");
const headers={"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":"https://global-investments2027.netlify.app","vary":"Origin"};
const send=(code,data)=>({statusCode:code,headers,body:JSON.stringify(data)});
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
async function db(table,method="GET",query="",body=null,extra={}){
 const r=await fetch(url+"/rest/v1/"+table+(query?"?"+query:""),{method,headers:{"apikey":key,"Authorization":"Bearer "+key,"content-type":"application/json","Prefer":"return=representation",...extra},body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>[]);
 if(!r.ok)throw Error(data.message||"Database error");
 return data;
}
const hash=v=>crypto.createHash("sha256").update(v).digest("hex");
async function actor(token){
 if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))throw Error("Registration required");
 const rows=await db("gic_players","GET","token_hash=eq."+hash(token)+"&select=id,nickname,equity,updated_at&limit=1");
 if(!rows.length)throw Error("Unknown player. Reconnect from this browser.");
 return rows[0];
}
function validNick(n){return typeof n==="string"&&/^[A-Za-z0-9_]{3,20}$/.test(n)}
function blockedMessage(s){
 return /https?:\/\/|www\.|(?:\b(?:t\.me|discord\.gg)\b)|\b(?:fuck|shit|bitch|nigger|faggot|cunt)\b/i.test(s);
}
exports.handler=async event=>{
 if(!url||!key)return send(503,{error:"Multiplayer database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."});
 try{
  const body=event.httpMethod==="POST"?JSON.parse(event.body||"{}"):{};
  const action=event.httpMethod==="GET"?"feed":body.action;
  if(action==="feed"){
   const players=await db("gic_players","GET","select=id,nickname,equity,created_at,updated_at&order=equity.desc&limit=50");
   const votes=await db("gic_likes","GET","select=player_id");
   const likes={};for(const v of votes)likes[v.player_id]=(likes[v.player_id]||0)+1;
   const chat=await db("gic_chat","GET","select=id,nickname,message,created_at&order=created_at.desc&limit=35");
   return send(200,{players:players.map(p=>({...p,likes:likes[p.id]||0})),chat:chat.reverse(),status:"unverified-paper-results",server_time:new Date().toISOString()});
  }
  if(action==="register"){
   if(!validNick(body.nickname))return send(400,{error:"Nickname must be 3–20 letters, numbers or underscores."});
   if(body.token){const p=await actor(body.token);return send(200,{player:{id:p.id,nickname:p.nickname},token:body.token})}
   const token=crypto.randomBytes(32).toString("hex");
   const found=await db("gic_players","GET","nickname=eq."+encodeURIComponent(body.nickname)+"&select=id&limit=1");
   if(found.length)return send(409,{error:"That nickname is taken. Choose another."});
   const rows=await db("gic_players","POST","",{nickname:body.nickname,token_hash:hash(token),equity:2500});
   return send(200,{player:{id:rows[0].id,nickname:rows[0].nickname},token});
  }
  const p=await actor(body.token);
  if(action==="rename"){
   if(!validNick(body.nickname))return send(400,{error:"Use 3–20 letters, numbers or underscores."});
   await db("gic_players","PATCH","id=eq."+p.id,{nickname:body.nickname});
   return send(200,{ok:true,nickname:body.nickname});
  }
  if(action==="sync"){
   const equity=Number(body.equity);
   if(!Number.isFinite(equity)||equity<0||equity>1e10)return send(400,{error:"Invalid equity"});
   await db("gic_players","PATCH","id=eq."+p.id,{equity,updated_at:new Date().toISOString()});
   return send(200,{ok:true,warning:"Submitted paper results are not independently verified"});
  }
  if(action==="like"){
   if(typeof body.target!=="string"||!/^[0-9a-f-]{36}$/i.test(body.target)||body.target===p.id)return send(400,{error:"Invalid player"});
   const existing=await db("gic_likes","GET","voter_id=eq."+p.id+"&player_id=eq."+body.target+"&select=player_id");
   if(!existing.length)await db("gic_likes","POST","",{voter_id:p.id,player_id:body.target});
   return send(200,{ok:true});
  }
  if(action==="chat"){
   const message=typeof body.message==="string"?body.message.trim():"";
   if(message.length<1||message.length>160||blockedMessage(message))return send(400,{error:"Keep chat friendly (1–160 characters, no links or abusive language)."});
   const last=await db("gic_chat","GET","player_id=eq."+p.id+"&select=created_at&order=created_at.desc&limit=1");
   if(last.length&&Date.now()-Date.parse(last[0].created_at)<12000)return send(429,{error:"Please wait 12 seconds between messages."});
   await db("gic_chat","POST","",{player_id:p.id,nickname:p.nickname,message});
   return send(200,{ok:true});
  }
  return send(400,{error:"Unknown action"});
 }catch(e){return send(400,{error:String(e.message||"Request failed").slice(0,180)})}
};