// V4.5 Coin news (public Google News RSS feed, headlines only).
exports.handler=async event=>{
 const sym=String(event.queryStringParameters?.symbol||"").toUpperCase();
 const name=String(event.queryStringParameters?.name||"");
 if(!/^[A-Z0-9.\-]{1,15}$/.test(sym)||name.length>90)return {statusCode:400,body:JSON.stringify({error:"Invalid coin"})};
 const query='"'+(name.replace(/[^a-zA-Z0-9 \-]/g,"").slice(0,60)||sym)+'" cryptocurrency when:7d';
 try{
  const url='https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl=en-US&gl=US&ceid=US:en';
  const r=await fetch(url,{headers:{accept:"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error("News provider error");
  const xml=await r.text();const decode=x=>String(x||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
  const extract=(chunk,tag)=>decode(chunk.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||"").replace(/<[^>]+>/g," ").trim();
  const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,8).map(x=>({title:extract(x[1],"title"),url:extract(x[1],"link"),date:extract(x[1],"pubDate"),source:extract(x[1],"source")})).filter(x=>x.title&&/^https:\/\//.test(x.url));
  return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public,max-age=300"},body:JSON.stringify({source:"Google News RSS",items})};
 }catch(err){return {statusCode:503,headers:{"content-type":"application/json"},body:JSON.stringify({error:"News headlines are currently unavailable"})}}
};