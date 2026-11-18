// Converte uma agenda iCal (.ics) na lista de dias ocupados (YYYY-MM-DD, no fuso da Suécia).
// Trata: eventos de dia inteiro, eventos com horário, vários dias, eventos recorrentes (RRULE),
// exceções (EXDATE, RECURRENCE-ID, ocorrências canceladas) e fusos horários (TZID).
const ICAL = require("./vendor/ical.es5.cjs");

const TZ = "Europe/Stockholm";
const DIA_MS = 86400000;

const fmtDia = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHora = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

function diaSuecia(data) { return fmtDia.format(data); }            // "2026-11-13"
function horaSuecia(data) { return fmtHora.format(data); }          // "00:00:00"
function mesSuecia(data) { return diaSuecia(data).slice(0, 7); }

function somaDias(ymd, n) {
  const p = ymd.split("-").map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.toISOString().slice(0, 10);
}
function ymdDe(t) { // ICAL.Time -> "YYYY-MM-DD" (campos como estão, sem converter fuso)
  return t.year + "-" + String(t.month).padStart(2, "0") + "-" + String(t.day).padStart(2, "0");
}

// Diferença (ms) entre o relógio de parede em `zona` e UTC, no instante `ms`
function deslocamento(ms, zona) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const o = {};
  f.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
  const comoUtc = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second);
  return comoUtc - Math.floor(ms / 1000) * 1000;
}
// Hora de parede (y,m,d,h,mi,s) numa zona IANA -> instante (Date)
function paredeParaInstante(t, zona) {
  const palpite = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
  let inst = palpite - deslocamento(palpite, zona);
  inst = palpite - deslocamento(inst, zona); // corrige em torno de mudanças de horário de verão
  return new Date(inst);
}
function zonaValida(z) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: z }); return true; } catch (e) { return false; }
}

// ICAL.Time com hora -> instante real. `tzid` vem do parâmetro TZID do evento.
function instante(t, tzid, avisos) {
  if (t.zone && t.zone.tzid === "UTC") return new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second));
  if (tzid && zonaValida(tzid)) return paredeParaInstante(t, tzid);
  if (tzid && avisos.indexOf(tzid) < 0) avisos.push(tzid);
  return paredeParaInstante(t, TZ); // sem fuso (ou desconhecido): considera horário da Suécia
}

function tzidDe(evento, nome) {
  const p = evento.component.getFirstProperty(nome);
  return p ? p.getParameter("tzid") : null;
}

function diasOcupados(ics, hoje, horizonteDias) {
  const avisos = [];
  const ini = hoje;
  const fim = somaDias(hoje, horizonteDias);
  const fimData = new Date(fim + "T23:59:59Z");
  const dias = {};
  function marca(a, b) { // marca de a até b (inclusive), só dentro da janela
    let d = a < ini ? ini : a, n = 0;
    while (d <= b && d <= fim && n < 800) { dias[d] = 1; d = somaDias(d, 1); n++; }
  }

  const raiz = new ICAL.Component(ICAL.parse(ics));
  const vevents = raiz.getAllSubcomponents("vevent");
  const mestres = {};
  vevents.forEach(function (v) { if (!v.hasProperty("recurrence-id")) mestres[v.getFirstPropertyValue("uid")] = true; });

  function cancelado(evento) { return String(evento.component.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED"; }

  function marcaOcorrencia(item, inicio, fimOc) {
    if (cancelado(item)) return;
    if (inicio.isDate) { // dia inteiro: o fim é exclusivo
      const a = ymdDe(inicio);
      const b = fimOc && fimOc.isDate ? somaDias(ymdDe(fimOc), -1) : a;
      marca(a, b < a ? a : b);
      return;
    }
    const a = instante(inicio, tzidDe(item, "dtstart"), avisos);
    const bInst = fimOc ? instante(fimOc, tzidDe(item, "dtend") || tzidDe(item, "dtstart"), avisos) : a;
    const diaA = diaSuecia(a);
    let diaB = diaSuecia(bInst);
    if (bInst > a && horaSuecia(bInst) === "00:00:00") diaB = somaDias(diaB, -1); // fim à meia-noite é exclusivo
    marca(diaA, diaB < diaA ? diaA : diaB);
  }

  vevents.forEach(function (v) {
    const ehExcecao = v.hasProperty("recurrence-id");
    if (ehExcecao && mestres[v.getFirstPropertyValue("uid")]) return; // tratada junto do evento principal
    const ev = new ICAL.Event(v);
    if (!v.hasProperty("dtstart")) return;
    if (cancelado(ev)) return;
    if (!ev.isRecurring()) {
      marcaOcorrencia(ev, ev.startDate, ev.endDate);
      return;
    }
    const it = ev.iterator();
    let prox, n = 0;
    while ((prox = it.next()) && n < 20000) {
      n++;
      const d = ev.getOccurrenceDetails(prox);
      const inicio = d.startDate;
      const aprox = inicio.isDate ? new Date(ymdDe(inicio) + "T00:00:00Z") : new Date(Date.UTC(inicio.year, inicio.month - 1, inicio.day, 12));
      if (aprox > new Date(fimData.getTime() + 2 * DIA_MS)) break;
      marcaOcorrencia(d.item, inicio, d.endDate);
    }
  });

  return { dias: Object.keys(dias).sort(), avisos: avisos };
}

module.exports = { diasOcupados, diaSuecia, mesSuecia, somaDias };
