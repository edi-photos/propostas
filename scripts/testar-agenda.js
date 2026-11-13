// Autoteste: roda antes de cada atualização. Se algum caso falhar, a agenda NÃO é atualizada
// (o ocupados.json anterior é mantido) e a tarefa no GitHub fica vermelha.
const { diasOcupados } = require("./agenda-lib.js");

const L = [
  "BEGIN:VCALENDAR", "VERSION:2.0",
  // 1 dia inteiro simples
  "BEGIN:VEVENT", "UID:a", "DTSTART;VALUE=DATE:20261212", "DTEND;VALUE=DATE:20261213", "END:VEVENT",
  // 2 vários dias (fim exclusivo)
  "BEGIN:VEVENT", "UID:b", "DTSTART;VALUE=DATE:20261220", "DTEND;VALUE=DATE:20261223", "END:VEVENT",
  // 3 semanal com EXDATE, ocorrência movida e ocorrência cancelada
  "BEGIN:VEVENT", "UID:c", "DTSTART;VALUE=DATE:20261116", "DTEND;VALUE=DATE:20261117", "RRULE:FREQ=WEEKLY;COUNT=4", "EXDATE;VALUE=DATE:20261123", "END:VEVENT",
  "BEGIN:VEVENT", "UID:c", "RECURRENCE-ID;VALUE=DATE:20261130", "DTSTART;VALUE=DATE:20261201", "DTEND;VALUE=DATE:20261202", "END:VEVENT",
  "BEGIN:VEVENT", "UID:c", "RECURRENCE-ID;VALUE=DATE:20261207", "DTSTART;VALUE=DATE:20261207", "DTEND;VALUE=DATE:20261208", "STATUS:CANCELLED", "END:VEVENT",
  // 4 UTC atravessando a meia-noite da Suécia (23:30Z do dia 8 = 00:30 do dia 9)
  "BEGIN:VEVENT", "UID:d", "DTSTART:20261208T233000Z", "DTEND:20261209T003000Z", "END:VEVENT",
  // 5 fuso do Brasil: 22:00 em São Paulo = 02:00 do dia seguinte na Suécia
  "BEGIN:VEVENT", "UID:e", "DTSTART;TZID=America/Sao_Paulo:20261210T220000", "DTEND;TZID=America/Sao_Paulo:20261210T233000", "END:VEVENT",
  // 6 fim exatamente à meia-noite (exclusivo)
  "BEGIN:VEVENT", "UID:f", "DTSTART;TZID=Europe/Stockholm:20261214T230000", "DTEND;TZID=Europe/Stockholm:20261215T000000", "END:VEVENT",
  // 7 semanal 00:30 na Suécia, atravessando a mudança de horário de verão
  "BEGIN:VEVENT", "UID:g", "DTSTART;TZID=Europe/Stockholm:20270325T003000", "DTEND;TZID=Europe/Stockholm:20270325T013000", "RRULE:FREQ=WEEKLY;COUNT=3", "END:VEVENT",
  // 8 horário "flutuante" (sem fuso)
  "BEGIN:VEVENT", "UID:h", "DTSTART:20261217T100000", "DTEND:20261217T110000", "END:VEVENT",
  // 9 evento antigo (fora da janela)
  "BEGIN:VEVENT", "UID:i", "DTSTART;VALUE=DATE:20200101", "DTEND;VALUE=DATE:20200102", "END:VEVENT",
  // 10 evento cancelado
  "BEGIN:VEVENT", "UID:j", "DTSTART;VALUE=DATE:20261230", "DTEND;VALUE=DATE:20261231", "STATUS:CANCELLED", "END:VEVENT",
  // 11 diário com UNTIL
  "BEGIN:VEVENT", "UID:k", "DTSTART;VALUE=DATE:20270101", "DTEND;VALUE=DATE:20270102", "RRULE:FREQ=DAILY;UNTIL=20270103", "END:VEVENT",
  // 12 semanal sem fim, começou antes de hoje (sábados)
  "BEGIN:VEVENT", "UID:l", "DTSTART;VALUE=DATE:20260103", "DTEND;VALUE=DATE:20260104", "RRULE:FREQ=WEEKLY", "END:VEVENT",
  "END:VCALENDAR"
];

function rodar() {
  const { dias } = diasOcupados(L.join("\r\n"), "2026-11-13", 400);
  const falhas = [];
  function tem(d, msg) { if (dias.indexOf(d) < 0) falhas.push("deveria estar ocupado: " + d + " (" + msg + ")"); }
  function nao(d, msg) { if (dias.indexOf(d) >= 0) falhas.push("NÃO deveria estar ocupado: " + d + " (" + msg + ")"); }
  tem("2026-12-12", "dia inteiro");
  ["2026-12-20", "2026-12-21", "2026-12-22"].forEach(function (d) { tem(d, "vários dias"); }); nao("2026-12-23", "fim exclusivo");
  tem("2026-11-16", "semanal"); nao("2026-11-23", "EXDATE"); nao("2026-11-30", "ocorrência movida"); tem("2026-12-01", "nova data da movida"); nao("2026-12-07", "ocorrência cancelada");
  tem("2026-12-09", "UTC virando o dia na Suécia"); nao("2026-12-08", "UTC virando o dia na Suécia");
  tem("2026-12-11", "fuso do Brasil"); nao("2026-12-10", "fuso do Brasil");
  tem("2026-12-14", "evento até meia-noite"); nao("2026-12-15", "fim à meia-noite é exclusivo");
  tem("2027-03-25", "semanal com horário de verão"); tem("2027-04-01", "semanal com horário de verão"); tem("2027-04-08", "semanal com horário de verão"); nao("2027-03-24", "semanal com horário de verão");
  tem("2026-12-17", "horário sem fuso");
  nao("2020-01-01", "evento antigo");
  nao("2026-12-30", "evento cancelado");
  ["2027-01-01", "2027-01-02", "2027-01-03"].forEach(function (d) { tem(d, "UNTIL"); }); nao("2027-01-04", "UNTIL");
  tem("2026-11-14", "semanal sem fim"); tem("2026-11-21", "semanal sem fim"); tem("2027-11-13", "semanal sem fim"); nao("2026-11-15", "só sábados");
  if (dias.some(function (d) { return d < "2026-11-13"; })) falhas.push("há dias anteriores a hoje na lista");
  return falhas;
}
if (require.main === module) {
  const f = rodar();
  if (f.length) { console.error("FALHAS NO AUTOTESTE:\n - " + f.join("\n - ")); process.exit(1); }
  console.log("Autoteste da agenda: tudo certo (" + 12 + " situações).");
}
module.exports = { rodar, ICS: L.join("\r\n") };
