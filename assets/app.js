(function(){
var SRC=document.currentScript.src,ROOT=new URL("../",SRC).href;
var LOC={pt:"pt-BR",sv:"sv-SE",en:"en-GB"};
function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function J(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(u);return r.json()})}
function norm(v){return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()}
var app=document.getElementById("app"),CFG,UI,D,LANGS,busy={},bstate="loading";
var S={sel:-1,city:"",nome:"",pick:null,lang:"pt",view:null};
Promise.all([J(ROOT+"config.json"),J(ROOT+"assets/ui.json"),J("dados.json")]).then(function(r){CFG=r[0];UI=r[1];D=r[2];start()}).catch(function(){app.textContent="Não foi possível carregar esta proposta. / Could not load this proposal."});

function T(){return D.textos[S.lang]}
function U(){return UI[S.lang]}
function fmt(n){return n.toLocaleString(LOC[S.lang])+" SEK"}
function fill(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k]})}
function iso(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function dlabel(k){var p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(LOC[S.lang],{weekday:"long",day:"numeric",month:"long",year:"numeric"})}

function pickLang(){
 var q=new URLSearchParams(location.search).get("l"),st=null,nav=(navigator.language||"").slice(0,2);
 try{st=localStorage.getItem("lang")}catch(x){}
 var c=[q,st,nav,D.idioma_padrao].filter(function(l){return l&&LANGS.indexOf(l)>=0});
 return c[0]||LANGS[0];
}
function start(){
 LANGS=Object.keys(D.textos);S.lang=pickLang();
 var st=document.createElement("style");
 st.textContent=":root{"+D.tema.claro+"}@media (prefers-color-scheme:dark){:root{"+D.tema.escuro+"}}";
 document.head.appendChild(st);
 var cal=D.calendario,now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 S.first=new Date(today.getFullYear(),today.getMonth(),today.getDate()+(cal.antecedencia_dias||0));
 var p=cal.fim.split("-");S.last=new Date(+p[0],+p[1]-1,+p[2]);
 S.view=new Date(S.first.getFullYear(),S.first.getMonth(),1);
 fetch(ROOT+"ocupados.json?t="+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){(j.ocupados||[]).forEach(function(k){busy[k]=1});bstate="ok";drawCal()}).catch(function(){bstate="fail";drawCal()});
 render();
}
function setLang(l){S.lang=l;try{localStorage.setItem("lang",l)}catch(x){}var y=window.scrollY;render();window.scrollTo(0,y)}

function render(){
 var t=T(),u=U();
 document.documentElement.lang=S.lang;document.title=t.titulo_aba;
 var h='<div class="wrap">';
 h+='<div class="topo"><a class="voltar" href="'+ROOT+'">← '+e(u.voltar)+'</a>';if(LANGS.length>1){h+='<div class="lang">'+LANGS.map(function(l){return'<button type="button" data-l="'+l+'" aria-pressed="'+(l===S.lang)+'">'+l.toUpperCase()+"</button>"}).join("")+"</div>"}h+="</div>";
 h+='<header class="hero"><img class="logo" alt="Edi" src="'+ROOT+'assets/logo.png"><small>'+e(t.etiqueta)+"</small><h1>"+e(t.titulo)+"</h1>"+t.intro.map(function(x){return"<p>"+e(x)+"</p>"}).join("")+"</header>";
 h+="<h2>"+e(u.pacotes_h)+'</h2><div class="pkgs">'+D.pacotes.map(function(p,i){var k=t.pacotes[i];
  return'<button type="button" class="pkg" data-i="'+i+'" aria-pressed="false"><h3><span>'+e(k.nome)+'</span><span class="price">'+(p.a_partir?e(u.a_partir)+" ":"")+fmt(p.preco)+"</span></h3>"+(k.subtitulo?'<em class="sub">'+e(k.subtitulo)+"</em>":"")+"<p>"+e(k.descricao)+"</p><ul>"+k.inclui.map(function(x){return"<li>"+e(x)+"</li>"}).join("")+"</ul></button>"}).join("")+"</div>";
 h+="<h2>"+e(u.local_h)+'</h2><div class="box"><label for="city">'+e(u.cidade_label)+'</label><input id="city" type="text" list="cities" autocomplete="off" placeholder="'+e(u.cidade_ph)+'" value="'+e(S.city)+'"><datalist id="cities">'+CFG.zonas.map(function(z){return z.cidades.map(function(c){return'<option value="'+e(c)+'">'}).join("")}).join("")+'</datalist><div class="tbox" id="tbox"></div>'+(t.nota_local?'<p class="note">'+e(t.nota_local)+"</p>":"")+"</div>";
 h+="<h2>"+e(u.data_h)+'</h2><div class="box"><div id="cal"></div><p class="cal-leg" id="calmsg"></p></div>';
 h+="<h2>"+e(t.entrega_h)+'</h2><div class="box">'+t.entrega.map(function(x){return"<p>"+e(x)+"</p>"}).join("")+"</div>";
 h+="<h2>"+e(t.invest_h)+'</h2><div class="box">'+t.invest.map(function(x){return"<p>"+e(x)+"</p>"}).join("")+'<label for="nome">'+e(t.nome_label)+'</label><input id="nome" type="text" placeholder="'+e(t.nome_ph)+'" value="'+e(S.nome)+'"></div>';
 h+="<footer>"+t.fecho.map(function(x){return"<p>"+e(x)+"</p>"}).join("")+"<p><b>"+e(t.assinatura)+"</b><br>"+e(t.funcao)+'<br><a href="https://instagram.com/'+e(CFG.instagram)+'" target="_blank" rel="noopener">@'+e(CFG.instagram)+'</a> · <a href="https://wa.me/'+e(CFG.telefone_whatsapp)+'" target="_blank" rel="noopener">'+e(CFG.telefone_exibicao)+'</a></p><p class="note"><a href="'+ROOT+'privacidade/">'+e(({pt:"Política de privacidade",sv:"Integritetspolicy",en:"Privacy policy"})[S.lang])+'</a></p><img class="flogo" alt="" src="'+ROOT+'assets/logo.png"></footer></div>';
 h+='<div class="bar"><div><div class="total" id="total"></div><div class="btns"><button type="button" class="btn alt" id="copy">'+e(u.copiar)+'</button><a class="btn" id="wa" aria-disabled="true" target="_blank" rel="noopener">'+e(u.whatsapp)+"</a></div></div></div>";
 app.innerHTML=h;
 Array.prototype.forEach.call(app.querySelectorAll(".lang button"),function(b){b.onclick=function(){setLang(b.getAttribute("data-l"))}});
 Array.prototype.forEach.call(app.querySelectorAll(".pkg"),function(b){b.onclick=function(){S.sel=+b.getAttribute("data-i");update()}});
 document.getElementById("city").oninput=function(){S.city=this.value;update()};
 document.getElementById("nome").oninput=function(){S.nome=this.value;update()};
 document.getElementById("copy").onclick=copy;
 update();drawCal();
}

function travel(){
 var raw=S.city.trim(),v=norm(raw);
 if(!v)return{st:"empty",fee:0,city:""};
 for(var a=0;a<CFG.zonas.length;a++)for(var b=0;b<CFG.zonas[a].cidades.length;b++){var k=norm(CFG.zonas[a].cidades[b]);if(v===k||v.indexOf(k)===0)return{st:CFG.zonas[a].taxa?"fee":"local",fee:CFG.zonas[a].taxa,city:raw}}
 return{st:"unknown",fee:0,city:raw};
}
function pkg(){return S.sel<0?null:{p:D.pacotes[S.sel],k:T().pacotes[S.sel]}}
function summary(){
 var s=pkg();if(!s)return"";var u=U(),t=travel(),tot=s.p.preco+t.fee,fr=s.p.a_partir||t.st==="unknown",n=S.nome.trim();
 var L=[T().mensagem,u.m_pacote+": "+s.k.nome+" ("+fmt(s.p.preco)+")"+(n?" — "+n:"")];
 if(t.city)L.push(u.m_local+": "+t.city);
 if(t.st==="fee")L.push(u.m_desloc+": + "+fmt(t.fee));
 if(t.st==="unknown")L.push(u.m_desloc_conf);
 if(S.pick)L.push(u.m_data+": "+dlabel(S.pick)+" "+u.m_conf);
 L.push(u.m_valor+": "+(fr?u.a_partir+" ":"")+fmt(tot)+(fr?" "+u.m_valor_final:""));
 L.push(u.m_pag);
 return L.join("\n");
}
function update(){
 var u=U(),t=travel(),tb=document.getElementById("tbox");
 Array.prototype.forEach.call(app.querySelectorAll(".pkg"),function(b){b.setAttribute("aria-pressed",String(+b.getAttribute("data-i")===S.sel))});
 if(t.st==="fee"){tb.style.display="block";tb.innerHTML=fill(u.desloc_fora,{home:CFG.cidade_base,city:e(t.city),fee:fmt(t.fee)})}
 else if(t.st==="unknown"){tb.style.display="block";tb.innerHTML=fill(u.desloc_conf,{city:e(t.city)})}
 else if(t.st==="local"){tb.style.display="block";tb.innerHTML=fill(u.desloc_local,{city:e(t.city)})}
 else tb.style.display="none";
 var tot=document.getElementById("total"),wa=document.getElementById("wa"),s=pkg();
 if(!s){tot.textContent=u.bar_escolha;wa.setAttribute("aria-disabled","true");wa.removeAttribute("href");return}
 var fr=s.p.a_partir||t.st==="unknown";
 tot.innerHTML=e(s.k.nome)+" · <b>"+(fr?e(u.a_partir)+" ":"")+fmt(s.p.preco+t.fee)+"</b>"+(t.st==="fee"?' <small class="note">'+e(u.inclui_desl)+"</small>":"")+(t.st==="unknown"?' <small class="note">'+e(u.mais_desl)+"</small>":"");
 wa.removeAttribute("aria-disabled");
 wa.href="https://wa.me/"+CFG.telefone_whatsapp+"?text="+encodeURIComponent(summary());
}
function copy(){
 var s=summary(),b=document.getElementById("copy"),u=U();if(!s)return;
 function ok(){var o=b.textContent;b.textContent=u.copiado;setTimeout(function(){b.textContent=o},1800)}
 function fb(){var ta=document.createElement("textarea");ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");ok()}catch(x){}document.body.removeChild(ta)}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(ok,fb);else fb();
}

function drawCal(){
 var el=document.getElementById("cal"),msg=document.getElementById("calmsg");if(!el||!D)return;
 var u=U(),loc=LOC[S.lang];
 if(bstate==="loading"){el.innerHTML="";msg.textContent=u.cal_carregando;return}
 if(bstate==="fail"){el.innerHTML="";msg.textContent=u.cal_falha;return}
 var y=S.view.getFullYear(),m=S.view.getMonth(),F=S.first,L=S.last;
 var h='<div class="cal-h"><button type="button" id="cp" aria-label="'+e(u.cal_prev)+'"'+(y===F.getFullYear()&&m===F.getMonth()?" disabled":"")+'>‹</button><b>'+e(new Date(y,m,1).toLocaleDateString(loc,{month:"long",year:"numeric"}))+'</b><button type="button" id="cn" aria-label="'+e(u.cal_next)+'"'+(y===L.getFullYear()&&m===L.getMonth()?" disabled":"")+'>›</button></div><div class="cal-g">';
 for(var w=0;w<7;w++)h+='<div class="cal-w">'+e(new Date(2024,0,1+w).toLocaleDateString(loc,{weekday:"short"}))+"</div>";
 var off=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),i;
 for(i=0;i<off;i++)h+='<div class="cal-e"></div>';
 for(i=1;i<=n;i++){var d=new Date(y,m,i),k=iso(d),dis=d<F||d>L||busy[k];h+='<button type="button" class="cal-d" data-d="'+k+'"'+(dis?" disabled":"")+' aria-pressed="'+(S.pick===k)+'">'+i+"</button>"}
 el.innerHTML=h+"</div>";
 document.getElementById("cp").onclick=function(){S.view=new Date(y,m-1,1);drawCal()};
 document.getElementById("cn").onclick=function(){S.view=new Date(y,m+1,1);drawCal()};
 Array.prototype.forEach.call(el.querySelectorAll(".cal-d:not([disabled])"),function(b){b.onclick=function(){S.pick=b.getAttribute("data-d");drawCal();update()}});
 msg.textContent=S.pick?fill(u.cal_escolhida,{data:dlabel(S.pick)}):u.cal_dica;
}
})();
