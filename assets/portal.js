(function(){
var SRC=document.currentScript.src,ROOT=new URL("../",SRC).href;
var LOC={pt:"pt-BR",sv:"sv-SE",en:"en-GB"};
var el=document.getElementById("portal"),PAG=el.getAttribute("data-pagina");
function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function J(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(u);return r.json()})}
var PRIV={pt:"Política de privacidade",sv:"Integritetspolicy",en:"Privacy policy"},PRIVD=null;
var CFG,P,LANGS,S={lang:"pt",cat:"todos",foto:-1},CARDS=[],FOTOS=[],VIS=[];
Promise.all([J(ROOT+"config.json"),J(ROOT+"portal.json")]).then(function(r){
 CFG=r[0];P=r[1];LANGS=Object.keys(P.textos);S.lang=pickLang();
 var tasks=[J(ROOT+"portfolio/fotos.json?t="+Date.now()).then(function(j){FOTOS=j.fotos||[]},function(){FOTOS=[]})];
 if(PAG==="privacidade")tasks.push(J(ROOT+"privacidade/dados.json").then(function(j){PRIVD=j}));
 if(PAG==="home")tasks.push(Promise.all(P.propostas.map(function(s){return J(ROOT+s+"/dados.json").then(function(d){return{slug:s,d:d}},function(){return null})})).then(function(a){CARDS=a.filter(Boolean)}));
 return Promise.all(tasks);
}).then(render).catch(function(){el.textContent="Não foi possível carregar / Could not load."});
function pickLang(){
 var q=new URLSearchParams(location.search).get("l"),st=null,nav=(navigator.language||"").slice(0,2);
 try{st=localStorage.getItem("lang")}catch(x){}
 var c=[q,st,nav,"pt"].filter(function(l){return l&&LANGS.indexOf(l)>=0});return c[0]||LANGS[0];
}
function T(){return P.textos[S.lang]}
function setLang(l){S.lang=l;try{localStorage.setItem("lang",l)}catch(x){}var y=window.scrollY;render();window.scrollTo(0,y)}
function fmt(n){return n.toLocaleString(LOC[S.lang])+" SEK"}
function catName(c){var m=P.categorias&&P.categorias[c];return m?(m[S.lang]||m.pt||c):c.replace(/[-_]+/g," ").replace(/^./,function(x){return x.toUpperCase()})}
function iso(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function foto(f){return ROOT+encodeURI(f.arquivo)}

function topo(t){
 var L=[["inicio",ROOT,"home"],["ensaios",ROOT+"#ensaios",""],["portfolio",ROOT+"portfolio/","portfolio"],["dicas",ROOT+"dicas/","dicas"],["contato",ROOT+"#contato",""]];
 return'<div class="topo"><nav class="nav">'+L.map(function(x){return'<a href="'+x[1]+'"'+(x[2]&&x[2]===PAG?' aria-current="page"':"")+">"+e(t.nav[x[0]])+"</a>"}).join("")+'</nav><div class="lang">'+LANGS.map(function(l){return'<button type="button" data-l="'+l+'" aria-pressed="'+(l===S.lang)+'">'+l.toUpperCase()+"</button>"}).join("")+"</div></div>";
}
function rodape(t){
 return'<footer id="contato" class="contato"><h2>'+e(t.contato_h)+"</h2><p>"+e(t.contato_txt)+'</p><div class="btns"><a class="btn" href="https://wa.me/'+e(CFG.telefone_whatsapp)+'" target="_blank" rel="noopener">'+e(t.whatsapp)+'</a><a class="btn alt" href="https://instagram.com/'+e(CFG.instagram)+'" target="_blank" rel="noopener">'+e(t.instagram)+'</a></div><p style="margin-top:22px"><b>'+e(t.assinatura)+"</b><br>"+e(t.funcao)+'</p><p class="note"><a href="'+ROOT+'privacidade/">'+e(PRIV[S.lang])+'</a></p><img class="flogo" alt="" src="'+ROOT+'assets/logo.png"></footer>';
}
function hero(t,small,h1,p){return'<header class="hero"><img class="logo" alt="Edi" src="'+ROOT+'assets/logo.png"><small>'+e(small)+"</small><h1>"+e(h1)+"</h1>"+(p?"<p>"+e(p)+"</p>":"")+"</header>"}

function home(t){
 var hoje=iso(new Date()),h=hero(t,t.etiqueta,t.titulo,t.intro);
 var cards=CARDS.filter(function(c){return !c.d.calendario||!c.d.calendario.fim||c.d.calendario.fim>=hoje});
 h+='<h2 id="ensaios">'+e(t.ensaios_h)+'</h2><div class="cards">'+cards.map(function(c){
  var tx=c.d.textos[S.lang]||c.d.textos[c.d.idioma_padrao]||c.d.textos[Object.keys(c.d.textos)[0]],min=Math.min.apply(null,c.d.pacotes.map(function(p){return p.preco}));
  return'<a class="card" href="'+ROOT+c.slug+'/"><small>'+e(tx.etiqueta)+"</small><h3>"+e(tx.titulo)+'</h3><span class="preco">'+e(t.a_partir)+" "+fmt(min)+'</span><span class="ir">'+e(t.ver_pacotes)+" →</span></a>"}).join("")+"</div>";
 h+='<h2>'+e(t.portfolio_h)+'</h2><div class="box chamada"><p>'+e(t.portfolio_txt)+"</p>";
 if(FOTOS.length)h+='<div class="vitrine" style="width:100%">'+FOTOS.slice(0,6).map(function(f){return'<img loading="lazy" alt="'+e(catName(f.categoria))+'" src="'+foto(f)+'">'}).join("")+"</div>";
 h+='<a class="btn" href="'+ROOT+'portfolio/">'+e(t.portfolio_btn)+"</a></div>";
 h+='<h2>'+e(t.dicas_h)+'</h2><div class="box chamada"><p>'+e(t.dicas_txt)+'</p><a class="btn" href="'+ROOT+'dicas/">'+e(t.dicas_btn)+"</a></div>";
 return h;
}
function portfolio(t){
 var h=hero(t,t.etiqueta,t.p_titulo,t.p_intro);
 if(!FOTOS.length)return h+'<p class="vazio">'+e(t.vazio)+"</p>";
 var cats=[],seen={};
 Object.keys(P.categorias||{}).concat(FOTOS.map(function(f){return f.categoria})).forEach(function(c){if(!seen[c]&&FOTOS.some(function(f){return f.categoria===c})){seen[c]=1;cats.push(c)}});
 h+='<div class="chips"><button type="button" class="chip" data-c="todos" aria-pressed="'+(S.cat==="todos")+'">'+e(t.todos)+"</button>"+cats.map(function(c){return'<button type="button" class="chip" data-c="'+e(c)+'" aria-pressed="'+(S.cat===c)+'">'+e(catName(c))+"</button>"}).join("")+"</div>";
 VIS=FOTOS.filter(function(f){return S.cat==="todos"||f.categoria===S.cat});
 h+='<div class="mural">'+VIS.map(function(f,i){return'<button type="button" class="foto" data-i="'+i+'"><img loading="lazy" alt="'+e(catName(f.categoria))+'" src="'+foto(f)+'"></button>'}).join("")+"</div>";
 h+='<div class="lb" id="lb"><button type="button" class="x" aria-label="'+e(t.fechar)+'">×</button><button type="button" class="p" aria-label="'+e(t.anterior)+'">‹</button><img alt=""><button type="button" class="n" aria-label="'+e(t.proximo)+'">›</button></div>';
 return h;
}
function priv(t){
 var d=PRIVD,p=d.textos[S.lang]||d.textos.pt,E=d.empresa||{},host=d.hospedagem||"";
 var dt=new Date(d.atualizado+"T12:00:00").toLocaleDateString(LOC[S.lang],{year:"numeric",month:"long",day:"numeric"});
 var h=hero(t,t.etiqueta,p.titulo,p.intro)+'<p class="note" style="text-align:center">'+e(p.atualizado)+" "+e(dt)+"</p>";
 h+=p.secoes.map(function(s,i){return"<h2>"+(i+1)+". "+e(s.t)+'</h2><div class="box">'+s.p.map(function(x){return"<p>"+e(x.replace("{host}",host))+"</p>"}).join("")+"</div>"}).join("");
 var c=[];if(E.nome)c.push("<b>"+e(E.nome)+"</b>");if(E.orgnr)c.push(e(p.l_orgnr)+": "+e(E.orgnr));if(E.endereco)c.push(e(p.l_endereco)+": "+e(E.endereco));if(E.email)c.push(e(p.l_email)+': <a href="mailto:'+e(E.email)+'">'+e(E.email)+"</a>");
 c.push("WhatsApp: "+e(CFG.telefone_exibicao));c.push('Instagram: <a href="https://instagram.com/'+e(CFG.instagram)+'" target="_blank" rel="noopener">@'+e(CFG.instagram)+"</a>");
 return h+"<h2>"+e(p.contato_h)+'</h2><div class="box"><p>'+c.join("<br>")+"</p></div>";
}
function dicas(t){
 var h=hero(t,t.etiqueta,t.d_titulo,t.d_intro);
 return h+t.secoes.map(function(s){return"<h2>"+e(s.titulo)+'</h2><div class="box">'+s.itens.map(function(i){return'<div class="dica"><b>'+e(i.t)+"</b><span>"+e(i.d)+"</span></div>"}).join("")+"</div>"}).join("");
}
function render(){
 var t=T();document.documentElement.lang=S.lang;
 document.title=(PAG==="privacidade"?PRIV[S.lang]:PAG==="portfolio"?t.p_titulo:PAG==="dicas"?t.d_titulo:t.titulo_aba)+(PAG==="home"?"":" — "+t.assinatura);
 document.body.className="pagina";
 el.innerHTML='<div class="wrap">'+topo(t)+(PAG==="home"?home(t):PAG==="portfolio"?portfolio(t):PAG==="privacidade"?priv(t):dicas(t))+rodape(t)+"</div>";
 Array.prototype.forEach.call(el.querySelectorAll(".lang button"),function(b){b.onclick=function(){setLang(b.getAttribute("data-l"))}});
 if(PAG==="portfolio")bindPortfolio();
}
function bindPortfolio(){
 Array.prototype.forEach.call(el.querySelectorAll(".chip"),function(b){b.onclick=function(){S.cat=b.getAttribute("data-c");render()}});
 var lb=document.getElementById("lb");if(!lb)return;var im=lb.querySelector("img");
 function show(i){if(!VIS.length)return;S.foto=(i+VIS.length)%VIS.length;im.src=foto(VIS[S.foto]);im.alt=catName(VIS[S.foto].categoria);lb.classList.add("on")}
 function hide(){lb.classList.remove("on");S.foto=-1}
 Array.prototype.forEach.call(el.querySelectorAll(".foto"),function(b){b.onclick=function(){show(+b.getAttribute("data-i"))}});
 lb.querySelector(".x").onclick=hide;lb.querySelector(".p").onclick=function(){show(S.foto-1)};lb.querySelector(".n").onclick=function(){show(S.foto+1)};
 lb.onclick=function(ev){if(ev.target===lb)hide()};
 var x0=null;lb.ontouchstart=function(ev){x0=ev.touches[0].clientX};lb.ontouchend=function(ev){if(x0==null)return;var d=ev.changedTouches[0].clientX-x0;if(Math.abs(d)>50)show(S.foto+(d<0?1:-1));x0=null};
}
document.addEventListener("keydown",function(ev){var lb=document.getElementById("lb");if(!lb||!lb.classList.contains("on"))return;if(ev.key==="Escape")lb.querySelector(".x").click();if(ev.key==="ArrowLeft")lb.querySelector(".p").click();if(ev.key==="ArrowRight")lb.querySelector(".n").click()});
})();
