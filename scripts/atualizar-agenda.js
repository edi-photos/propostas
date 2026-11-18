// Lê a agenda do Google (endereço secreto iCal) e grava só as datas ocupadas em ocupados.json.
// Antes de tudo roda o autoteste: se falhar, nada é alterado.
const fs = require("fs");
const { diasOcupados, diaSuecia, mesSuecia } = require("./agenda-lib.js");
const teste = require("./testar-agenda.js");

(async function () {
  const falhas = teste.rodar();
  if (falhas.length) { console.error("Autoteste falhou, agenda não atualizada:\n - " + falhas.join("\n - ")); process.exit(1); }

  const url = process.env.AGENDA_ICS_URL;
  if (!url) { console.error("Faltou o segredo AGENDA_ICS_URL"); process.exit(1); }

  let texto;
  const ctrl = new AbortController();
  const tempo = setTimeout(function () { ctrl.abort(); }, 30000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error("a agenda respondeu " + r.status);
    texto = await r.text();
  } catch (e) {
    console.error("Não foi possível ler a agenda: " + e.message);
    process.exit(1);
  } finally { clearTimeout(tempo); }

  if (texto.indexOf("BEGIN:VCALENDAR") < 0) { console.error("O endereço não parece uma agenda iCal. Nada foi alterado."); process.exit(1); }

  let r;
  try {
    const agora = new Date();
    r = diasOcupados(texto, diaSuecia(agora), 400);
    r.avisos.forEach(function (z) { console.warn("Aviso: fuso desconhecido (" + z + "); foi considerado o horário da Suécia."); });
    // "verificado" muda uma vez por mês: gera 1 commit mensal e evita que o GitHub pause a tarefa por inatividade
    fs.writeFileSync("ocupados.json", JSON.stringify({ verificado: mesSuecia(agora), ocupados: r.dias }, null, 1) + "\n");
  } catch (e) {
    console.error("Erro ao interpretar a agenda: " + e.message + ". Nada foi alterado.");
    process.exit(1);
  }
  console.log("Datas ocupadas:", r.dias.length);
})();
