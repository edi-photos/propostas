// Lê as pastas dentro de fotos/ (uma pasta por categoria) e grava portfolio/fotos.json
var fs=require("fs"),path=require("path");
var EXT=/\.(jpe?g|png|webp)$/i;
var base="fotos",out=[];
if(fs.existsSync(base)){
  fs.readdirSync(base,{withFileTypes:true}).filter(function(d){return d.isDirectory()&&d.name[0]!=="."}).sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(d){
    fs.readdirSync(path.join(base,d.name)).filter(function(f){return EXT.test(f)}).sort(function(a,b){return a.localeCompare(b,"pt",{numeric:true})}).forEach(function(f){
      out.push({arquivo:base+"/"+d.name+"/"+f,categoria:d.name});
    });
  });
}
fs.mkdirSync("portfolio",{recursive:true});
fs.writeFileSync("portfolio/fotos.json",JSON.stringify({fotos:out},null,1)+"\n");
console.log("Fotos no portfólio:",out.length);
