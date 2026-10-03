const {createClient}=window.supabase;
const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const url=u=>u&&/^https?:\/\//i.test(u)?u:"#";
async function load(){
 const {data:s}=await sb.from("site_settings").select("*").eq("id",true).single();
 if(s){
  siteName.textContent=s.site_name;document.title=s.site_name;siteDescription.textContent=s.description;
  purchaseTitle.textContent=s.purchase_title;purchaseDescription.textContent=s.purchase_description;purchaseButton.href=url(s.purchase_link);
 }
 const {data:posts}=await sb.from("posts").select("*").eq("published",true).order("slot");
 postsGrid.innerHTML=(posts||[]).map(p=>`<article class="post"><small>POST ${String(p.slot).padStart(2,"0")}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${p.media_url?(p.media_type==="video"?`<video class="post-media" controls preload="metadata" src="${esc(p.media_url)}"></video>`:`<img class="post-media" loading="lazy" src="${esc(p.media_url)}" alt="${esc(p.title)}">`):""}<a class="post-link" href="${url(p.link)}" target="_blank" rel="noopener">OPEN LINK ↗</a></article>`).join("");
 const socials=[["Telegram",s?.telegram],["Pinterest",s?.pinterest],["VK",s?.vk],["Facebook Page",s?.facebook]];
 socialGrid.innerHTML=socials.map(([n,v])=>`<a class="social" href="${socialUrl(n,v)}" target="_blank" rel="noopener"><b>${n}</b><small>${esc(v||"Not added")}</small></a>`).join("");
 year.textContent=new Date().getFullYear();
}
function socialUrl(n,v){if(!v)return"#";if(/^https?:/i.test(v))return v;v=v.replace(/^@/,"").trim();if(n==="Telegram")return"https://t.me/"+v;if(n==="Pinterest")return"https://pinterest.com/"+v;if(n==="VK")return"https://vk.com/"+v;if(n==="Facebook Page")return"https://facebook.com/"+v;return"#"}
load();
