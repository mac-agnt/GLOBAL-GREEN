/* Dashboard calculations. Every figure is derived from the seeded records in
   ../../data plus live demo state from ../../store, so totals always agree with
   the module screens. */
import { PLAN } from "../../plan";
import {
  INVOICES, REVENUE_HISTORY, PROJECTS, OPPORTUNITIES, STAGES, OPEX_MONTHLY, OPENING_CASH,
  daysAgo, daysUntil, sum, project, type StaffId, type Stage, type Service
} from "../../data";
import { stageOf, type GGState } from "../../store";

/* ── revenue ───────────────────────────────────────────────────────────────── */
export function revenueSeries(): { label: string; value: number; partial?: boolean }[] {
  const oct = sum(INVOICES.filter(i => i.issued.startsWith("2026-10")).map(i => i.amount));
  const nov = sum(INVOICES.filter(i => i.issued.startsWith("2026-11")).map(i => i.amount));
  const out: { label: string; value: number; partial?: boolean }[] = REVENUE_HISTORY.map(([label, value]) => ({ label, value }));
  return out.concat([{ label: "Oct", value: oct }, { label: "Nov", value: nov, partial: true }]);
}

/* ── debtors ───────────────────────────────────────────────────────────────── */
export const overdueInvoices = () => INVOICES.filter(i => i.status === "overdue")
  .map(i => ({ ...i, days: daysAgo(i.due) })).sort((a, b) => b.days - a.days);

export function ageingBuckets() {
  const od = overdueInvoices();
  const b = (lo: number, hi: number) => od.filter(i => i.days >= lo && i.days <= hi);
  return [
    { label: "1-15 days", items: b(1, 15) },
    { label: "16-30 days", items: b(16, 30) },
    { label: "31-60 days", items: b(31, 60) }
  ].map(x => ({ ...x, value: sum(x.items.map(i => i.amount)), count: x.items.length }));
}

/* ── pipeline (live: honours stage moves made in the demo) ─────────────────── */
export function pipelineByStage(s: GGState) {
  const rows = (STAGES as readonly Stage[]).map(st => {
    const opps = OPPORTUNITIES.filter(o => stageOf(s, o.id) === st);
    return { stage: st, count: opps.length, value: sum(opps.map(o => o.value)), weighted: sum(opps.map(o => o.value * o.probability / 100)) };
  });
  const won = OPPORTUNITIES.filter(o => stageOf(s, o.id) === "Won");
  const lost = OPPORTUNITIES.filter(o => stageOf(s, o.id) === "Lost");
  return { rows, won, lost, open: sum(rows.map(r => r.value)), openCount: sum(rows.map(r => r.count)), weighted: sum(rows.map(r => r.weighted)) };
}

/** Opportunities created per week (Monday-start), from first record to the demo week. */
export function leadsPerWeek(): [string, number][] {
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekStart = (iso: string) => {
    const d = new Date(iso + "T00:00:00Z");
    const back = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - back);
    return d.toISOString().slice(0, 10);
  };
  const first = weekStart(OPPORTUNITIES.map(o => o.created).sort()[0]);
  const last = weekStart("2026-11-16");
  const out: [string, number][] = [];
  const cur = new Date(first + "T00:00:00Z");
  while (cur.toISOString().slice(0, 10) <= last) {
    const k = cur.toISOString().slice(0, 10);
    out.push([cur.getUTCDate() + " " + MON[cur.getUTCMonth()], OPPORTUNITIES.filter(o => weekStart(o.created) === k).length]);
    cur.setUTCDate(cur.getUTCDate() + 7);
  }
  return out;
}

/* ── cash forecast ─────────────────────────────────────────────────────────── */
/* Basis: open invoices by due date (overdue assumed collected in the first
   window); remaining fees on active projects invoiced at completion and paid on
   30-day terms; simulated operating costs from OPEX_MONTHLY each 30 days. */
export function cashForecast() {
  const opex = sum(OPEX_MONTHLY.map(o => o[1]));
  const windows = [
    { label: "Next 30 days", lo: -9999, hi: 30, receipts: 0, invoices: 0, projected: 0 },
    { label: "31-60 days", lo: 31, hi: 60, receipts: 0, invoices: 0, projected: 0 },
    { label: "61-90 days", lo: 61, hi: 90, receipts: 0, invoices: 0, projected: 0 }
  ];
  const put = (days: number, amt: number, kind: "invoices" | "projected") => {
    const w = windows.find(x => days >= x.lo && days <= x.hi);
    if (w) { w.receipts += amt; w[kind] += amt; }
  };
  INVOICES.filter(i => i.status !== "paid").forEach(i => put(daysUntil(i.due), i.amount, "invoices"));
  let beyond = 0;
  PROJECTS.forEach(p => {
    const invoiced = sum(INVOICES.filter(i => i.projectId === p.id).map(i => i.amount));
    const remaining = Math.max(0, p.value - invoiced);
    const receiptDay = daysUntil(p.due) + 30;
    if (receiptDay > 90) beyond += remaining; else put(receiptDay, remaining, "projected");
  });
  let cash = OPENING_CASH;
  const rows = windows.map(w => { cash = cash + w.receipts - opex; return { ...w, opex, net: w.receipts - opex, closing: cash }; });
  return { rows, opex, opening: OPENING_CASH, beyond };
}

/* ── capacity ──────────────────────────────────────────────────────────────── */
/* Planned days for week 47 (16 to 20 Nov) and the three weeks after, as held on
   the delivery resource board (simulated). Every project id exists in PROJECTS;
   Eoin's days on GG-238 and GG-247 are technical reviews (RPT-238, RPT-247). */
export const WEEKS = ["Wk 47 · 16 Nov", "Wk 48 · 23 Nov", "Wk 49 · 30 Nov", "Wk 50 · 7 Dec"];
export const PLAN_W47: Partial<Record<StaffId, [string, number][]>> = PLAN[47];
/** Planned days for weeks 48, 49 and 50 (same plan as Projects → Resources). */
export const PLAN_LATER: Partial<Record<StaffId, [number, number, number]>> = Object.fromEntries(
  (Object.keys(PLAN[47]) as StaffId[]).map(id => [id, [48, 49, 50].map(w => (PLAN[w][id] || []).reduce((n, x) => n + x[1], 0)) as [number, number, number]])
);
/** Days moved from Dara to Ciara in week 48 if APR-09 is approved. */
export const APR09_DAYS = 0.75;

export function serviceColor(svc?: Service | string): string {
  switch (svc) {
    case "Energy audit": case "Energy monitoring": return "var(--gg-green)";
    case "Environmental assessment": return "var(--gg-blue)";
    case "ISO 14001": case "ISO 50001": case "ISO 14064": return "var(--gg-lime)";
    case "Carbon & climate action": case "ESG & sustainability": case "B Corp support": return "#c8b4f0";
    case "Renewable feasibility": return "var(--warn)";
    default: return "var(--neutral)";
  }
}
export function planParts(id: StaffId): [string, number, string][] {
  return (PLAN_W47[id] || []).map(([ref, d]) => {
    const p = project(ref);
    return [p ? ref + " " + p.title : ref, d, p ? serviceColor(p.service) : "var(--neutral)"];
  });
}
export function weekLoads(id: StaffId, apr09Approved: boolean): number[] {
  const w47 = sum((PLAN_W47[id] || []).map(x => x[1]));
  const later = (PLAN_LATER[id] || [0, 0, 0]).slice() as number[];
  if (apr09Approved && id === "dara") later[0] -= APR09_DAYS;
  if (apr09Approved && id === "ciara") later[0] += APR09_DAYS;
  return [w47].concat(later);
}
/** Remaining budgeted effort across a person's projects, shared equally across each team (days at 7.5h). */
export function backlogDays(id: StaffId): number {
  return sum(PROJECTS.filter(p => p.team.indexOf(id) > -1).map(p => Math.max(0, p.budgetHours - p.hoursSpent) / p.team.length)) / 7.5;
}
