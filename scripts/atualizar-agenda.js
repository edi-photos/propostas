// Lê a agenda do Google (endereço secreto iCal) e devolve só as datas ocupadas.
// Nenhum título, local ou detalhe do evento é enviado para a página.
function unfold(t){return t.replace(/\r?\n[ \t]/g,"")}
function addDays(d,n){var x=new Date(Date.UTC(d.y,d.m-1,d.d+n));return{y:x.getUTCFullYear(),m:x.getUTCMonth()+1,d:x.getUTCDate()}}
function key(d){return d.y+"-"+("0"+d.m).slice(-2)+"-"+("0"+d.d).slice(-2)}
function cmp(a,b){return key(a)<key(b)?-1:key(a)>key(b)?1:0}
function toLocal(v){
  // devolve {y,m,d,time} no fuso da Suécia
  var m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/.exec(v);
  if(!m)return null;
  if(m[7]==="Z"){
    var dt=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]));
    var p=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Stockholm",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(dt),o={};
    p.forEach(function(x){o[x.type]=x.value});
    return{y:+o.year,m:+o.month,d:+o.day,time:o.hour+o.minute};
  }
  return{y:+m[1],m:+m[2],d:+m[3],time:m[4]?m[4]+m[5]:null};
}
function parse(text){
  var lines=unfold(text).split(/\r?\n/),ev=null,out=[];
  lines.forEach(function(l){
    if(l==="BEGIN:VEVENT"){ev={}}
    else if(l==="END:VEVENT"){if(ev)out.push(ev);ev=null}
    else if(ev){var i=l.indexOf(":");if(i<0)return;var name=l.slice(0,i).split(";")[0];ev[name]=l.slice(i+1)}
  });
  var days={};
  out.forEach(function(e){
    if(!e.DTSTART||/CANCELLED/.test(e.STATUS||""))return;
    var s=toLocal(e.DTSTART);if(!s)return;
    var allDay=e.DTSTART.indexOf("T")<0;
    var end=e.DTEND?toLocal(e.DTEND):null,last;
    if(allDay){last=end?addDays(end,-1):s}
    else{last=end||s;if(end&&end.time==="0000")last=addDays(end,-1)}
    if(cmp(last,s)<0)last=s;
    var c=s,n=0;
    while(cmp(c,last)<=0&&n<400){days[key(c)]=1;c=addDays(c,1);n++}
  });
  return Object.keys(days).sort();
}

// Lê a agenda do Google (endereço secreto iCal) e grava só as datas ocupadas em ocupados.json
var fs=require("fs");
if(require.main===module){
  var url=process.env.AGENDA_ICS_URL;
  if(!url){console.error("Faltou o segredo AGENDA_ICS_URL");process.exit(1)}
  fetch(url).then(function(r){
    if(!r.ok)throw new Error("Agenda respondeu "+r.status);
    return r.text();
  }).then(function(t){
    if(t.indexOf("BEGIN:VCALENDAR")<0)throw new Error("O endereço não parece uma agenda iCal");
    var hoje=new Date().toISOString().slice(0,10);
    var datas=parse(t).filter(function(d){return d>=hoje});
    fs.writeFileSync("ocupados.json",JSON.stringify({ocupados:datas},null,1)+"\n");
    console.log("Datas ocupadas:",datas.length);
  }).catch(function(e){console.error(e.message);process.exit(1)});
}
module.exports={parse:parse};
