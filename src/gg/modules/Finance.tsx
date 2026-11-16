/* Finance: the intelligence and workflow layer above QuickBooks Online.
   Read only. Pulse drafts, extracts and suggests; people approve. Nothing is
   posted, paid, sent or reconciled from here. */
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  INVOICES, REVENUE_HISTORY, RECEIPTS, EXPENSE_BATCH, QBO_TXNS, OPEX_MONTHLY, OPENING_CASH, PROJECTS, OPPORTUNITIES,
  COMPLETED_PROJECTS, EXTERNALS, TODAY, client, contact, project, staff, fmtDate, fmtDay, daysAgo, daysUntil, parseDate, eur, eurK, sum,
  type Invoice, type Receipt, type BankTxn, type Client
} from "../data";
import { useGG, decideReceipt, decideMatch, toast, logEvent, navigate, type GGState } from "../store";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Seg, Search, Table, Drawer, Section, Kv, RecordChip, AIBox,
  Timeline, Bars, HBars, Donut, Legend, LineChart, Meter, Avatar, Person, useFocus, SimTag, SERIES, type Tone, type Col
} from "../ui";
import { ApprovalDrawer } from "./ApprovalsPanel";

/* ── local demo state ──────────────────────────────────────────────────────── */
interface FS { marked: Record<string, true>; flagged: Record<string, string>; }
let fs: FS = { marked: {}, flagged: {} };
const subs = new Set<() => void>();
const fsub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const fget = () => fs;
function fset(p: Partial<FS>) { fs = { ...fs, ...p }; subs.forEach(f => f()); }
function useFS() { return useSyncExternalStore(fsub, fget, fget); }

function markForReview(ids: string[]) {
  const m = { ...fs.marked }; ids.forEach(i => { m[i] = true; });
  fset({ marked: m });
  logEvent({ source: "Pulse", category: "Finance", title: ids.length === 1 ? "Payment reminder marked for review: " + ids[0] : ids.length + " payment reminders marked for review", detail: "Draft only. Emma reviews before anything is sent. Nothing was sent.", actor: "Niall Kiernan", record: ids[0] });
  toast(ids.length === 1 ? "Reminder marked for Emma's review. Not sent." : ids.length + " reminders marked for Emma's review. None sent.");
}
function flagLine(t: BankTxn, label: string) {
  fset({ flagged: { ...fs.flagged, [t.id]: label } });
  logEvent({ source: "QuickBooks", category: "Finance", title: label + ": " + t.description, detail: eur(t.amount, 2) + " on " + t.account + ". Routed for a person to resolve in QuickBooks Online.", actor: "Niall Kiernan", record: "EXP-OCT-11" });
  toast(label + ". Nothing changed in QuickBooks.");
}

/* ── helpers ───────────────────────────────────────────────────────────────── */
function addDays(iso: string, n: number): string {
  const d = parseDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
const eur2 = (n: number) => eur(n, 2);
const clientName = (i: Invoice) => client(i.clientId)?.name || i.clientId;
const workTitle = (id?: string) => { if (!id) return "General advisory"; const p = project(id) || COMPLETED_PROJECTS.find(c => c.id === id); return p ? p.title : id; };
const overdueDays = (i: Invoice) => daysAgo(i.due);
const OVERDUE = INVOICES.filter(i => i.status === "overdue");
const CURRENT = INVOICES.filter(i => i.status === "current");
const OCT = INVOICES.filter(i => i.issued.startsWith("2026-10"));
const NOV = INVOICES.filter(i => i.issued.startsWith("2026-11"));
const OCT_TOTAL = sum(OCT.map(i => i.amount));
const NOV_TOTAL = sum(NOV.map(i => i.amount));
const OVERDUE_TOTAL = sum(OVERDUE.map(i => i.amount));
const SEP_TOTAL = REVENUE_HISTORY.find(r => r[0] === "Sep")?.[1] || 0;

function statusBadge(i: Invoice): ReactNode {
  if (i.status === "paid") return <Badge tone="ok">Paid {fmtDate(i.paidOn)}</Badge>;
  if (i.status === "overdue") { const d = overdueDays(i); return <Badge tone={d > 30 ? "bad" : "warn"} dot>{d} days overdue</Badge>; }
  return <Badge tone="info">Due in {daysUntil(i.due)} days</Badge>;
}
function reminderDraft(i: Invoice): string {
  const c = client(i.clientId);
  const ct = c?.contact ? contact(c.contact) : undefined;
  const first = ct ? ct.name.split(" ")[0] : "Accounts team";
  const d = overdueDays(i);
  const firm = d > 14;
  return "Dear " + first + ",\n\n"
    + (firm ? "I am following up on invoice " : "A quick note on invoice ") + i.id + " for " + eur(i.amount) + " (" + workTitle(i.projectId).toLowerCase() + "), which fell due on " + fmtDate(i.due) + " and is now " + d + " days overdue.\n\n"
    + (firm ? "Could you confirm when payment is scheduled, or let me know if anything is holding it up on your side? " : "Could you let me know when it is scheduled for payment? ")
    + "A copy of the invoice is attached for convenience.\n\nKind regards,\nEmma Walsh\nAdministration & Accounts, Global Green";
}
const AGE_BUCKETS: [string, (i: Invoice) => boolean, string][] = [
  ["Not yet due", i => i.status === "current", "var(--gg-blue)"],
  ["1 to 15 days", i => i.status === "overdue" && overdueDays(i) <= 15, "var(--gg-lime)"],
  ["16 to 30 days", i => i.status === "overdue" && overdueDays(i) > 15 && overdueDays(i) <= 30, "var(--warn)"],
  ["31 to 45 days", i => i.status === "overdue" && overdueDays(i) > 30 && overdueDays(i) <= 45, "var(--bad)"],
  ["Over 45 days", i => i.status === "overdue" && overdueDays(i) > 45, "#c8b4f0"]
];

/* ── cash forecast model (illustrative) ────────────────────────────────────── */
type Scenario = "Expected" | "Cautious";
type FlowKind = "Current invoices" | "Overdue collections" | "Projected invoices" | "Pipeline deposits" | "Salaries & PRSI" | "Other operating costs";
interface Flow { date: string; amount: number; prob: number; kind: FlowKind; label: string; ref?: string; note?: string; }
const LAG: Record<Client["health"], number> = { good: 3, watch: 10, risk: 21 };
const PROB: Record<Client["health"], number> = { good: 0.95, watch: 0.88, risk: 0.75 };
const HORIZON = addDays(TODAY, 90);

export function buildForecast(sc: Scenario, s: GGState): Flow[] {
  const caut = sc === "Cautious";
  const flows: Flow[] = [];
  CURRENT.forEach(i => {
    const c = client(i.clientId);
    flows.push({ date: addDays(i.due, LAG[c.health] + (caut ? 7 : 0)), amount: i.amount, prob: PROB[c.health], kind: "Current invoices", label: i.id + " · " + c.name, ref: i.id });
  });
  OVERDUE.forEach((i, k) => {
    const west = i.id === "INV-1048";
    const approved = west && s.approvals["APR-01"] === "approved";
    const date = west ? (approved ? "2026-11-30" : "2026-12-10") : addDays(TODAY, 9 + k * 2);
    const prob = (west ? (approved ? 0.8 : 0.65) : i.reminders ? 0.8 : 0.75) * (caut ? 0.5 : 1);
    flows.push({ date: addDays(date, caut ? 14 : 0), amount: i.amount, prob, kind: "Overdue collections", label: i.id + " · " + clientName(i), ref: i.id, note: west ? (approved ? "Reminder approved" : "Reminder awaiting approval") : undefined });
  });
  PROJECTS.forEach(p => {
    const c = client(p.clientId);
    const slip = (p.status === "blocked" ? 21 : p.status === "at_risk" ? 7 : 0) + (caut ? 14 : 0);
    const pay = (inv: string) => addDays(inv, 30 + LAG[c.health]);
    if (p.feeType === "Retainer") {
      ["2026-11-27", "2026-12-27", "2027-01-27"].forEach(d => flows.push({ date: pay(d), amount: 1600, prob: 0.95, kind: "Projected invoices", label: p.id + " monthly retainer · " + c.name, ref: p.id, note: "Invoice " + fmtDate(d) }));
      return;
    }
    const invoiced = sum(INVOICES.filter(i => i.projectId === p.id).map(i => i.amount));
    let remaining = p.value - invoiced;
    if (remaining <= 0) return;
    if (p.feeType === "Staged fee" && invoiced < p.value * 0.5 && p.nextDate > TODAY) {
      const interim = p.value * 0.5 - invoiced;
      const d = addDays(p.nextDate, slip);
      flows.push({ date: pay(d), amount: interim, prob: 0.85, kind: "Projected invoices", label: p.id + " interim stage · " + c.name, ref: p.id, note: "Invoice " + fmtDate(d) + " at " + p.nextMilestone.toLowerCase() });
      remaining -= interim;
    }
    const d = addDays(p.due, slip);
    flows.push({ date: pay(d), amount: remaining, prob: 0.85, kind: "Projected invoices", label: p.id + " completion · " + c.name, ref: p.id, note: "Invoice " + fmtDate(d) + (slip ? " (shifted " + slip + " days, " + (p.status === "on_track" ? "cautious case" : p.status.replace("_", " ")) + ")" : " on completion") });
  });
  if (!caut) OPPORTUNITIES.filter(o => o.stage !== "New lead").forEach(o => {
    const inv = addDays(o.expectedClose, 7);
    flows.push({ date: addDays(inv, 30), amount: o.value * 0.4, prob: o.probability / 100, kind: "Pipeline deposits", label: o.id + " 40% deposit · " + o.company, ref: o.id, note: "If won by " + fmtDate(o.expectedClose) });
  });
  const salaries = OPEX_MONTHLY.find(x => x[0].startsWith("Salaries"))?.[1] || 0;
  const other = sum(OPEX_MONTHLY.filter(x => !x[0].startsWith("Salaries")).map(x => x[1]));
  ["2026-11-25", "2026-12-23", "2027-01-25"].forEach(d => flows.push({ date: d, amount: -salaries, prob: 1, kind: "Salaries & PRSI", label: "Payroll" }));
  ["2026-12-01", "2027-01-01", "2027-02-01"].forEach(d => flows.push({ date: d, amount: -other, prob: 1, kind: "Other operating costs", label: "Premises, vehicles, software, insurance, subconsultants" }));
  return flows.filter(f => f.date >= TODAY && f.date <= HORIZON).sort((a, b) => a.date.localeCompare(b.date));
}
const windowOf = (iso: string) => { const d = daysUntil(iso); return d <= 30 ? 0 : d <= 60 ? 1 : 2; };
const expected = (f: Flow) => f.amount * f.prob;
function weeklyBalance(flows: Flow[]): number[] {
  const out: number[] = []; let bal = OPENING_CASH;
  for (let w = 0; w < 13; w++) {
    const a = addDays(TODAY, w * 7), b = addDays(TODAY, w * 7 + 6);
    bal += sum(flows.filter(f => f.date >= a && f.date <= b).map(expected));
    out.push(Math.round(bal));
  }
  return out;
}
const WEEK_LABELS = Array.from({ length: 13 }, (_, w) => fmtDate(addDays(TODAY, w * 7)));

/* ── invoice drawer ────────────────────────────────────────────────────────── */
function InvoiceDrawer({ id, onClose, onApproval }: { id: string | null; onClose: () => void; onApproval: (id: string) => void }) {
  const s = useGG(); const f = useFS();
  const i = INVOICES.find(z => z.id === id);
  if (!i) return null;
  const c = client(i.clientId);
  const ct = c?.contact ? contact(c.contact) : undefined;
  const others = INVOICES.filter(z => z.clientId === i.clientId && z.id !== i.id);
  const tl = [{ when: fmtDate(i.issued), title: "Invoice issued", detail: eur(i.amount) + " · 30-day terms", tone: "neutral" as Tone }];
  tl.push({ when: fmtDate(i.due), title: "Payment due", detail: i.status === "overdue" ? "Not received" : i.status === "paid" ? "Received" : "Upcoming", tone: (i.status === "overdue" ? "bad" : "info") as Tone });
  if (i.reminders) tl.push({ when: fmtDate(addDays(i.due, 7)), title: "Reminder 1 sent by Emma", detail: "From QuickBooks Online (simulated history)", tone: "warn" as Tone });
  if (i.paidOn) tl.push({ when: fmtDate(i.paidOn), title: "Payment received", detail: "Matched in the QuickBooks feed (simulated)", tone: "ok" as Tone });
  const west = i.id === "INV-1048";
  const apr = s.approvals["APR-01"];
  return (
    <Drawer open={!!i} onClose={onClose} eyebrow={"INVOICE · " + i.id} badge={statusBadge(i)} title={c.name + " · " + eur(i.amount)} width={580}
      footer={i.status === "overdue" && !west ? (
        f.marked[i.id] ? <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Marked for Emma's review. Not sent.</span><Btn onClick={onClose}>Close</Btn></>
          : <><span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Marking for review does not send anything.</span><Btn kind="primary" onClick={() => markForReview([i.id])}>Mark reminder for review</Btn></>
      ) : west ? (
        <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>{apr ? "Reminder " + apr + " in the demo. Nothing was sent." : "Finance Review drafted a reminder. It waits for approval."}</span><Btn kind="primary" onClick={() => { onClose(); onApproval("APR-01"); }}>{apr ? "View approval" : "Review reminder"}</Btn></>
      ) : <Btn onClick={onClose}>Close</Btn>}>
      <Kv cols={3} items={[["Client", c.name], ["Work", workTitle(i.projectId)], ["Owner", "Emma Walsh"], ["Issued", fmtDay(i.issued)], ["Due", fmtDay(i.due)], ["Reminders sent", String(i.reminders)]]} />
      {i.status === "overdue" && (
        <AIBox tone={overdueDays(i) > 30 ? "bad" : "warn"} title={west ? "Approve a firm second reminder today" : overdueDays(i) > 14 ? "Send a firm reminder this week" : "Send a friendly reminder"}>
          {west ? "€18,400 is 42 days past due and " + Math.round((i.amount / OVERDUE_TOTAL) * 100) + "% of the total overdue balance. Westhaven has paid in 31 days on average across 6 earlier invoices, so this is out of pattern."
            : eur(i.amount) + " is " + overdueDays(i) + " days past due" + (i.reminders ? " after one reminder." : " with no reminder yet.") + " Pulse drafted the reminder below for Emma."}
        </AIBox>
      )}
      {i.status === "overdue" && !west && (
        <Section label="Draft reminder" right={<Badge tone={f.marked[i.id] ? "ok" : "neutral"}>{f.marked[i.id] ? "Marked for review" : "Not sent"}</Badge>}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "var(--ui)", fontSize: 13, lineHeight: 1.65, color: "var(--body)", padding: "14px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>{reminderDraft(i)}</pre>
        </Section>
      )}
      <Section label="History"><Timeline items={tl} /></Section>
      <Section label="Client relationship" right={<RecordChip id={i.clientId} label={c.name} />}>
        <Kv cols={3} items={[["Contact (mock)", ct ? ct.name + ", " + ct.title : "Accounts team"], ["Client since", String(c.since)], ["Lifetime fees", eur(c.lifetime)], ["Relationship lead", staff(c.lead).name], ["Health", c.health], ["Other invoices", String(others.length)]]} />
        {others.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{others.map(o => <RecordChip key={o.id} id={o.id} label={o.id + " · " + eur(o.amount) + " · " + o.status} />)}</div>}
      </Section>
      {i.projectId && <Section label="Linked work"><div style={{ display: "flex", gap: 8 }}><RecordChip id={i.projectId} /></div></Section>}
      <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Source: QuickBooks Online (simulated, read only). Pulse never changes the ledger.</div>
    </Drawer>
  );
}

/* ── tabs ──────────────────────────────────────────────────────────────────── */
function Overview({ onInvoice, onApproval }: { onInvoice: (id: string) => void; onApproval: (id: string) => void }) {
  const s = useGG();
  const flows = buildForecast("Expected", s);
  const in30 = sum(flows.filter(f => windowOf(f.date) === 0 && f.amount > 0).map(expected));
  const out30 = -sum(flows.filter(f => windowOf(f.date) === 0 && f.amount < 0).map(expected));
  const due30 = sum(CURRENT.filter(i => daysUntil(i.due) <= 30).map(i => i.amount));
  const ageParts = AGE_BUCKETS.slice(1).map(([l, fn, c]) => [l, sum(OVERDUE.filter(fn).map(i => i.amount)), c] as [string, number, string]).filter(p => p[1] > 0);
  const rev: [string, number, string?][] = REVENUE_HISTORY.map(([m, v]) => [m, v] as [string, number]);
  rev.push(["Oct", OCT_TOTAL]); rev.push(["Nov so far", NOV_TOTAL, "color-mix(in srgb, var(--gg-blue) 55%, transparent)"]);
  const noReminder = OVERDUE.filter(i => !i.reminders);
  const suggestedMatches = QBO_TXNS.filter(t => t.state === "suggested");
  const confirmed = suggestedMatches.filter(t => s.matches[t.id] === "confirmed").length;
  const actions: { title: string; detail: string; tone: Tone; run: () => void; done?: string }[] = [
    { title: "Approve Westhaven reminder for INV-1048", detail: "€18,400 · 42 days overdue · drafted by Finance Review", tone: "bad", run: () => onApproval("APR-01"), done: s.approvals["APR-01"] },
    { title: "Route 3 expense exceptions to Moran & Co.", detail: "EXP-OCT-11 · €640 · accountant review only", tone: "warn", run: () => onApproval("APR-05"), done: s.approvals["APR-05"] },
    { title: "Review reminders for " + noReminder.length + " invoices with no chase yet", detail: eur(sum(noReminder.map(i => i.amount))) + " · drafts ready in Invoices", tone: "warn", run: () => navigate("Finance", "Invoices") },
    { title: "Confirm " + (suggestedMatches.length - confirmed) + " suggested receipt matches", detail: eur2(sum(suggestedMatches.map(t => -t.amount))) + " · 92% to 98% confidence", tone: "info", run: () => navigate("Finance", "Reconciliation") }
  ];
  const exceptions: { title: string; detail: string; tab: string; amt: number }[] = [
    { title: "Possible duplicate card charge", detail: "Amazon.ie, 19 Oct, two identical lines (QB-8836, QB-8838)", tab: "Reconciliation", amt: 218.40 },
    { title: "Receipt with no card transaction", detail: "The Landmark Hotel dinner, may have been paid personally", tab: "Expenses", amt: 286.50 },
    { title: "Unreadable receipt", detail: "Taxi, Galway, 29 Oct: supplier and VAT unknown", tab: "Expenses", amt: 135.10 },
    { title: "Card line with no receipt", detail: "Microsoft 365 Business, 30 Oct", tab: "Reconciliation", amt: 142.60 },
    { title: "Invoice beyond 30-day terms", detail: "INV-1048 Westhaven Retail Parks, 42 days", tab: "Invoices", amt: 18400 }
  ];
  return (
    <>
      <PageHead title="Finance" sub="Revenue, debtors, expenses and cash in one view, read from QuickBooks Online. Pulse drafts and suggests; Emma and the accountant approve. Nothing is posted or reconciled from here."
        right={<><SimTag>QuickBooks Online · simulated read only</SimTag><Btn kind="primary" onClick={() => navigate("Finance", "Cash Forecast")}>Cash forecast</Btn></>} />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Invoiced in October" value={eur(OCT_TOTAL)} hint={(OCT_TOTAL >= SEP_TOTAL ? "+" : "") + (((OCT_TOTAL - SEP_TOTAL) / SEP_TOTAL) * 100).toFixed(1) + "% on September · " + OCT.length + " invoices"} onClick={() => navigate("Finance", "Invoices")} />
        <Stat label="Overdue balance" value={eur(OVERDUE_TOTAL)} hint={OVERDUE.length + " invoices · Westhaven is " + Math.round((18400 / OVERDUE_TOTAL) * 100) + "%"} tone="bad" onClick={() => navigate("Finance", "Invoices")} />
        <Stat label="Due in next 30 days" value={eur(due30)} hint={CURRENT.filter(i => daysUntil(i.due) <= 30).length + " current invoices"} />
        <Stat label="October receipts captured" value={eur(EXPENSE_BATCH.total)} hint={EXPENSE_BATCH.receipts + " receipts · " + EXPENSE_BATCH.exceptions + " exceptions"} tone="warn" onClick={() => navigate("Finance", "Expenses")} />
        <Stat label="Expected net cash, 30 days" value={(in30 - out30 >= 0 ? "+" : "") + eurK(Math.round(in30 - out30))} hint={eurK(Math.round(in30)) + " in · " + eurK(Math.round(out30)) + " out (illustrative)"} tone={in30 - out30 >= 0 ? "ok" : "warn"} onClick={() => navigate("Finance", "Cash Forecast")} />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox tone="bad" title="Approve the Westhaven reminder today. INV-1048 is 42 days overdue and 43% of what clients owe."
          actions={<>{s.approvals["APR-01"] ? <Badge tone={s.approvals["APR-01"] === "approved" ? "ok" : "bad"} dot>Reminder {s.approvals["APR-01"]}</Badge> : <Btn small kind="primary" onClick={() => onApproval("APR-01")}>Review reminder</Btn>}<Btn small onClick={() => onInvoice("INV-1048")}>Open invoice</Btn></>}>
          One reminder went on 12 Oct with no reply. Finance Review drafted a firm, professional second reminder for Emma with the delivered report summary attached. Approving marks it ready in the demo; it is not sent.
        </AIBox>
      </div>
      <Grid cols="minmax(0,1.6fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title="Invoiced revenue by month" sub={"December 2025 to date · October " + eur(OCT_TOTAL) + " from " + OCT.length + " invoices"} right={<Badge tone="neutral">Illustrative</Badge>}>
          <Bars data={rev} height={150} format={eurK} highlight="Oct" />
        </Card>
        <Card title="Debtors by age" sub={eur(OVERDUE_TOTAL) + " overdue across " + OVERDUE.length + " invoices"}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Donut parts={ageParts} size={136} thickness={17} center={eurK(OVERDUE_TOTAL)} sub="overdue" />
            <Legend items={ageParts.map(([l, v, c]) => [l, eur(v), c] as [string, ReactNode, string])} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
            {OVERDUE.slice().sort((a, b) => b.amount - a.amount).slice(0, 3).map(i => (
              <div key={i.id} className="gg-row" onClick={() => onInvoice(i.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 8px", borderRadius: 10, cursor: "pointer", fontSize: 12.5 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName(i)}</span>
                <span style={{ color: "var(--faint)", fontSize: 11.5 }}>{overdueDays(i)}d</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{eur(i.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Suggested actions" sub="Prepared by Finance Review. Each needs a person.">
          {actions.map((a, k) => (
            <div key={k} className="gg-row" onClick={a.run} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, flex: "none", background: "var(--" + (a.tone === "bad" ? "bad" : a.tone === "warn" ? "warn" : "gg-blue") + ")" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{a.detail}</div>
              </div>
              {a.done ? <Badge tone={a.done === "approved" ? "ok" : "bad"}>{a.done}</Badge> : <span style={{ color: "var(--faint)", fontSize: 16 }}>›</span>}
            </div>
          ))}
        </Card>
        <Card flush title="Financial exceptions" sub="Things Pulse could not resolve on its own" right={<Badge tone="warn">{exceptions.length}</Badge>}>
          {exceptions.map((e, k) => (
            <div key={k} className="gg-row" onClick={() => navigate("Finance", e.tab)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>{e.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{e.detail}</div>
              </div>
              <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{e.amt >= 1000 ? eur(e.amt) : eur2(e.amt)}</span>
              <Badge tone="neutral">{e.tab}</Badge>
            </div>
          ))}
        </Card>
      </Grid>
    </>
  );
}

type IView = "All" | "Overdue" | "Current" | "Paid";
function Invoices({ onInvoice, onApproval }: { onInvoice: (id: string) => void; onApproval: (id: string) => void }) {
  const s = useGG(); const f = useFS();
  const [view, setView] = useState<IView>("Overdue");
  const [q, setQ] = useState("");
  const rows = INVOICES.filter(i => (view === "All" || i.status === view.toLowerCase())
    && (!q || (i.id + " " + clientName(i) + " " + workTitle(i.projectId)).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => view === "Overdue" ? b.amount - a.amount : b.issued.localeCompare(a.issued));
  const counts: Partial<Record<IView, number>> = { All: INVOICES.length, Overdue: OVERDUE.length, Current: CURRENT.length, Paid: INVOICES.filter(i => i.status === "paid").length };
  const buckets = AGE_BUCKETS.map(([l, fn, c]) => [l, sum(INVOICES.filter(fn).map(i => i.amount)), c] as [string, number, string]);
  const pendingDrafts = OVERDUE.filter(i => i.id !== "INV-1048" && !f.marked[i.id]);
  const reminderCell = (i: Invoice) => {
    if (i.status !== "overdue") return <span style={{ color: "var(--faint)" }}>{i.status === "paid" ? "None needed" : "Not due"}</span>;
    if (i.id === "INV-1048") return s.approvals["APR-01"] ? <Badge tone={s.approvals["APR-01"] === "approved" ? "ok" : "bad"}>{s.approvals["APR-01"]}</Badge>
      : <Btn small kind="primary" onClick={e => { e.stopPropagation(); onApproval("APR-01"); }}>Review draft</Btn>;
    return f.marked[i.id] ? <Badge tone="ok">For review</Badge> : <Btn small onClick={e => { e.stopPropagation(); onInvoice(i.id); }}>View draft</Btn>;
  };
  const cols: Col<Invoice>[] = [
    { key: "id", label: "Invoice", width: ".8fr", render: i => <span style={{ fontWeight: 500 }}>{i.id}</span> },
    { key: "c", label: "Client", width: "1.6fr", render: i => <RecordChip id={i.clientId} label={clientName(i)} /> },
    { key: "w", label: "Work", width: "1.6fr", render: i => <span style={{ color: "var(--dim)" }}>{workTitle(i.projectId)}</span> },
    { key: "is", label: "Issued", width: ".7fr", render: i => <span style={{ color: "var(--dim)" }}>{fmtDate(i.issued)}</span> },
    { key: "du", label: "Due", width: ".7fr", render: i => fmtDate(i.due) },
    { key: "a", label: "Amount", width: ".8fr", align: "right", render: i => <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{eur(i.amount)}</span> },
    { key: "s", label: "Status", width: "1.1fr", render: statusBadge },
    { key: "r", label: "Reminder", width: "1fr", render: reminderCell }
  ];
  return (
    <>
      <PageHead title="Invoices" sub="Every client invoice from QuickBooks Online with ageing, payment status and a drafted reminder for anything overdue. Reminders wait for Emma."
        right={<><Search value={q} onChange={setQ} placeholder="Search invoice, client or work" /><Seg options={["All", "Overdue", "Current", "Paid"] as IView[]} value={view} onChange={setView} counts={counts} /></>} />
      <Grid cols="minmax(0,1.5fr) minmax(0,1fr)">
        <Card title="Receivables by age" sub={"All unpaid invoices · " + eur(sum(buckets.map(b => b[1]))) + " outstanding"}>
          <Bars data={buckets} height={110} format={eurK} highlight="31 to 45 days" />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AIBox tone="warn" title={pendingDrafts.length ? pendingDrafts.length + " reminder drafts are ready for review" : "All reminder drafts are with Emma"}
            actions={pendingDrafts.length ? <Btn small kind="primary" onClick={() => markForReview(pendingDrafts.map(i => i.id))}>Mark all {pendingDrafts.length} for review</Btn> : undefined}>
            Friendly tone under 15 days overdue, firmer after that. Westhaven has its own approval. Nothing is sent from Pulse.
          </AIBox>
          <Grid cols="1fr 1fr" gap={12}>
            <Stat label="Overdue" value={eur(OVERDUE_TOTAL)} hint={OVERDUE.length + " invoices"} tone="bad" />
            <Stat label="Average days overdue" value={Math.round(sum(OVERDUE.map(overdueDays)) / OVERDUE.length)} hint="Weighted by count" tone="warn" />
          </Grid>
        </div>
      </Grid>
      <Card flush style={{ marginTop: 14 }} title={view === "All" ? "All invoices" : view + " invoices"} sub={rows.length + " shown · " + eur(sum(rows.map(i => i.amount)))}>
        <Table cols={cols} rows={rows} rowKey={i => i.id} onRow={i => onInvoice(i.id)} empty="No invoices match" />
      </Card>
    </>
  );
}

type RView = "All" | "Suggested match" | "Exceptions" | "Reviewed";
const FLOW = [
  ["Receipts uploaded", "Team · phone or email", "done"], ["Fields extracted", "AI · vendor, date, amount, VAT", "done"],
  ["Matches suggested", "AI · against card feed", "done"], ["Human review", "Emma Walsh", "now"],
  ["Exceptions reviewed", "Brendan Moran, Moran & Co.", "next"], ["Posted in QuickBooks", "People, outside Pulse", "next"]
] as const;
function fieldConf(r: Receipt): [string, string, number][] {
  const c = r.confidence, hi = c >= 90;
  const proj = r.projectId ? project(r.projectId) : undefined;
  return [
    ["Vendor", r.vendor, r.id === "R-11" ? 38 : hi ? 99 : 88],
    ["Date", fmtDay(r.date), r.id === "R-11" ? 64 : 98],
    ["Amount", eur2(r.amount), r.id === "R-11" ? 52 : hi ? 99 : 96],
    ["VAT", r.id === "R-11" ? "Unknown" : eur2(r.vat), r.id === "R-11" ? 0 : r.id === "R-09" ? 45 : hi ? 97 : 85],
    ["Category", r.category, hi ? 94 : 80],
    ["Staff", staff(r.staff).name, 99],
    ["Project allocation", proj ? r.projectId + " · " + client(proj.clientId).name : "Overhead (no project)", r.projectId ? 91 : 76],
    ["Card transaction", r.txnId || "None found", r.txnId ? c : 0]
  ];
}

function Expenses({ onApproval, focusSel }: { onApproval: (id: string) => void; focusSel: string | null }) {
  const s = useGG();
  const [view, setView] = useState<RView>("All");
  const [sel, setSel] = useState<string>(focusSel || "R-09");
  const reviewed = (r: Receipt) => !!s.receipts[r.id];
  const rows = RECEIPTS.filter(r => view === "All" ? true : view === "Reviewed" ? reviewed(r) : view === "Exceptions" ? r.status === "exception" : r.status === "matched");
  const counts: Partial<Record<RView, number>> = { All: RECEIPTS.length, "Suggested match": EXPENSE_BATCH.matched, Exceptions: EXPENSE_BATCH.exceptions, Reviewed: RECEIPTS.filter(reviewed).length };
  const r = RECEIPTS.find(z => z.id === sel) || RECEIPTS[0];
  const d = s.receipts[r.id];
  const cats = Array.from(new Set(RECEIPTS.map(z => z.category))).map((c, k) => [c, sum(RECEIPTS.filter(z => z.category === c).map(z => z.amount)), SERIES[k % SERIES.length]] as [string, number, string]).sort((a, b) => b[1] - a[1]);
  const projIds = Array.from(new Set(RECEIPTS.filter(z => z.projectId).map(z => z.projectId as string)));
  const acct = EXTERNALS[0];
  return (
    <>
      <PageHead title="Expenses" sub="Receipt capture and extraction, like Dext, with suggested matches to the QuickBooks card feed. Every suggestion goes through a person before anything reaches the ledger."
        right={<><Badge tone="info">{EXPENSE_BATCH.id} · {EXPENSE_BATCH.period}</Badge><Person id={EXPENSE_BATCH.owner} /></>} />
      <Card pad={14}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8 }}>
          {FLOW.map(([t, who, st], k) => (
            <div key={t} style={{ padding: "10px 12px", borderRadius: "var(--r-sm,10px)", background: st === "now" ? "var(--accent-faint)" : "var(--surface-2)", border: "1px solid " + (st === "now" ? "var(--accent-line)" : "var(--border)") }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", background: st === "done" ? "var(--ok-soft)" : st === "now" ? "var(--accent-soft)" : "var(--track)", color: st === "done" ? "var(--ok)" : st === "now" ? "var(--accent)" : "var(--faint)" }}>{st === "done" ? "✓" : k + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{t}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 5 }}>{who}</div>
            </div>
          ))}
        </div>
      </Card>
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12} style={{ marginTop: 14 }}>
        <Stat label="Receipts in batch" value={EXPENSE_BATCH.receipts} hint="All 11 extracted" />
        <Stat label="Batch total" value={eur2(EXPENSE_BATCH.total)} hint={"VAT captured " + eur2(sum(RECEIPTS.map(z => z.vat)))} />
        <Stat label="Suggested matches" value={EXPENSE_BATCH.matched} hint={eur2(EXPENSE_BATCH.matchedValue) + " · 92% to 98%"} tone="ok" />
        <Stat label="Exceptions" value={EXPENSE_BATCH.exceptions} hint={eur2(EXPENSE_BATCH.exceptionValue) + " · for the accountant"} tone="warn" />
        <Stat label="Reviewed by a person" value={RECEIPTS.filter(reviewed).length + " of " + RECEIPTS.length} hint={RECEIPTS.filter(reviewed).length ? "In this demo session" : "Emma has not started"} />
      </Grid>
      <Grid cols="minmax(0,1.2fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Receipt inbox" right={<Seg options={["All", "Suggested match", "Exceptions", "Reviewed"] as RView[]} value={view} onChange={setView} counts={counts} />}>
          {rows.map(z => {
            const dz = s.receipts[z.id];
            return (
              <div key={z.id} className="gg-row" onClick={() => setSel(z.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: "1px solid var(--border)", cursor: "pointer", background: sel === z.id ? "var(--surface-2)" : undefined, boxShadow: sel === z.id ? "inset 2px 0 0 var(--accent)" : undefined }}>
                <Avatar id={z.staff} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.vendor}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{fmtDate(z.date)} · {z.category}{z.projectId ? " · " + z.projectId : ""}</div>
                </div>
                <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{eur2(z.amount)}</span>
                {dz ? <Badge tone={dz === "accepted" ? "ok" : "warn"}>{dz === "accepted" ? "Accepted" : "Queried"}</Badge>
                  : z.status === "matched" ? <Badge tone="ok" dot>{z.confidence}% match</Badge> : <Badge tone="warn" dot>Exception</Badge>}
              </div>
            );
          })}
        </Card>
        <Card title={r.vendor} sub={"Extracted fields · " + r.id} right={r.status === "matched" ? <Badge tone="ok">Suggested match</Badge> : <Badge tone="warn">Exception</Badge>}>
          <div style={{ padding: "9px 12px", borderRadius: "var(--r-sm,10px)", background: "var(--surface-2)", border: "1px dashed var(--border-strong)", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--dim)", marginBottom: 12 }}>OCR: {r.extracted}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {fieldConf(r).map(([k, v, c]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr 92px", gap: 10, alignItems: "center", fontSize: 12.5 }}>
                <span style={{ color: "var(--faint)" }}>{k}</span>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ flex: 1 }}><Meter value={c} tone={c >= 90 ? "ok" : c >= 60 ? "warn" : "bad"} height={5} /></span><span style={{ fontSize: 10.5, color: "var(--faint)", width: 26, textAlign: "right" }}>{c}%</span></span>
              </div>
            ))}
          </div>
          {r.issue && <div style={{ marginTop: 12 }}><AIBox tone="warn" title="Needs a person">{r.issue}</AIBox></div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            {d ? <Badge tone={d === "accepted" ? "ok" : "warn"} dot>{d === "accepted" ? "Accepted for posting review. Not posted." : "Queried with the accountant"}</Badge> : <>
              {r.status === "matched" && <Btn kind="primary" onClick={() => decideReceipt(r.id, "accepted")}>Accept suggestion</Btn>}
              <Btn onClick={() => decideReceipt(r.id, "queried")}>Query with accountant</Btn>
            </>}
            {r.status === "exception" && !s.approvals["APR-05"] && <Btn kind="quiet" onClick={() => onApproval("APR-05")}>Route all 3 exceptions (APR-05)</Btn>}
            {r.status === "exception" && s.approvals["APR-05"] && <Badge tone={s.approvals["APR-05"] === "approved" ? "ok" : "bad"}>Exception routing {s.approvals["APR-05"]}</Badge>}
          </div>
        </Card>
      </Grid>
      <Grid cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title="By category"><HBars data={cats} format={eur2} /></Card>
        <Card title="Allocated to projects" sub="Rebillable costs tagged during extraction">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projIds.map(pid => {
              const rs = RECEIPTS.filter(z => z.projectId === pid);
              return (
                <div key={pid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <RecordChip id={pid} label={pid + " · " + client(project(pid).clientId).name} />
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{rs.length}</span>
                  <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur2(sum(rs.map(z => z.amount)))}</span>
                </div>
              );
            })}
            <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 4 }}>Overhead: {eur2(sum(RECEIPTS.filter(z => !z.projectId).map(z => z.amount)))} across {RECEIPTS.filter(z => !z.projectId).length} receipts</div>
          </div>
        </Card>
        <Card title="External accountant" sub="Review access only">
          <div style={{ fontSize: 14, fontWeight: 500 }}>{acct.name}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{acct.org}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 10, lineHeight: 1.55 }}>{acct.note} Sees the 3 exceptions with their receipts and the suggested treatment. Cannot approve payments or change Pulse settings.</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}><Badge tone="info">{acct.access}</Badge><Badge tone="neutral">Mock contact</Badge></div>
        </Card>
      </Grid>
    </>
  );
}

type XView = "All" | "Suggested" | "Needs a person" | "Confirmed";
function Reconciliation() {
  const s = useGG(); const f = useFS();
  const [view, setView] = useState<XView>("All");
  const needs = (t: BankTxn) => t.state !== "suggested";
  const rows = QBO_TXNS.filter(t => view === "All" ? true : view === "Suggested" ? t.state === "suggested" && !s.matches[t.id] : view === "Confirmed" ? s.matches[t.id] === "confirmed" : needs(t));
  const counts: Partial<Record<XView, number>> = { All: QBO_TXNS.length, Suggested: QBO_TXNS.filter(t => t.state === "suggested" && !s.matches[t.id]).length, "Needs a person": QBO_TXNS.filter(needs).length, Confirmed: QBO_TXNS.filter(t => s.matches[t.id] === "confirmed").length };
  const highConf = QBO_TXNS.filter(t => t.state === "suggested" && (t.confidence || 0) >= 95 && !s.matches[t.id]);
  const confParts: [string, number, string][] = [
    ["95% or above", QBO_TXNS.filter(t => (t.confidence || 0) >= 95).length, "var(--ok)"],
    ["90% to 94%", QBO_TXNS.filter(t => (t.confidence || 0) >= 90 && (t.confidence || 0) < 95).length, "var(--gg-lime)"],
    ["Below 90%", QBO_TXNS.filter(t => t.confidence !== undefined && t.confidence < 90).length, "var(--warn)"],
    ["No candidate", QBO_TXNS.filter(t => t.confidence === undefined).length, "var(--dim)"]
  ];
  const stateBadge = (t: BankTxn): ReactNode => {
    if (s.matches[t.id] === "confirmed") return <Badge tone="ok" dot>Match confirmed in demo</Badge>;
    if (s.matches[t.id] === "rejected") return <Badge tone="neutral">Match rejected</Badge>;
    if (f.flagged[t.id]) return <Badge tone="warn">{f.flagged[t.id]}</Badge>;
    if (t.state === "duplicate") return <Badge tone="bad" dot>Possible duplicate</Badge>;
    if (t.state === "no_receipt") return <Badge tone="warn" dot>Receipt unreadable</Badge>;
    if (t.state === "unmatched") return <Badge tone="warn" dot>No receipt</Badge>;
    return <Badge tone="info">Suggested</Badge>;
  };
  const actionCell = (t: BankTxn): ReactNode => {
    if (s.matches[t.id] || f.flagged[t.id]) return <span style={{ color: "var(--faint)", fontSize: 12 }}>Done</span>;
    if (t.state === "suggested") return <span style={{ display: "inline-flex", gap: 6 }}><Btn small kind="primary" onClick={() => decideMatch(t.id, "confirmed")}>Confirm</Btn><Btn small kind="quiet" onClick={() => decideMatch(t.id, "rejected")}>Reject</Btn></span>;
    if (t.state === "duplicate") return <Btn small onClick={() => flagLine(t, "Duplicate flagged to accountant")}>Flag duplicate</Btn>;
    if (t.state === "no_receipt") return <Btn small onClick={() => flagLine(t, "Receipt requested from Louise")}>Request receipt</Btn>;
    return <Btn small onClick={() => flagLine(t, "Sent to accountant as subscription")}>Ask accountant</Btn>;
  };
  const cols: Col<BankTxn>[] = [
    { key: "d", label: "Date", width: ".6fr", render: t => <span style={{ color: "var(--dim)" }}>{fmtDate(t.date)}</span> },
    { key: "l", label: "Feed line", width: "1.6fr", render: t => <div><div style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>{t.description}</div><div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{t.id} · {t.account}</div></div> },
    { key: "a", label: "Amount", width: ".7fr", align: "right", render: t => <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{eur2(t.amount)}</span> },
    { key: "m", label: "Suggested receipt", width: "1.5fr", render: t => { const r = RECEIPTS.find(z => z.id === t.receiptId); return r ? <div><div>{r.vendor}</div><div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{r.id} · {fmtDate(r.date)} · {staff(r.staff).first}</div></div> : <span style={{ color: "var(--faint)" }}>None</span>; } },
    { key: "c", label: "Confidence", width: "1fr", render: t => t.confidence === undefined ? <span style={{ color: "var(--faint)" }}>n/a</span> : <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ flex: 1 }}><Meter value={t.confidence} tone={t.confidence >= 90 ? "ok" : t.confidence >= 50 ? "warn" : "bad"} height={5} /></span><span style={{ fontSize: 11.5, width: 30, textAlign: "right" }}>{t.confidence}%</span></span> },
    { key: "s", label: "Status", width: "1.3fr", render: stateBadge },
    { key: "x", label: "", width: "1.2fr", align: "right", render: actionCell }
  ];
  return (
    <>
      <PageHead title="Reconciliation assistant" sub="Suggested matches between captured receipts and the QuickBooks Online card and bank feed (simulated). Confirming here records a decision in the demo. It does not reconcile anything in QuickBooks."
        right={<><SimTag>QuickBooks feed · simulated</SimTag><Btn kind="primary" disabled={!highConf.length} onClick={() => highConf.forEach(t => decideMatch(t.id, "confirmed"))}>Confirm {highConf.length} at 95% or above</Btn></>} />
      <div style={{ padding: "11px 15px", borderRadius: "var(--r-md,14px)", background: "var(--gg-blue-soft)", color: "var(--gg-blue)", fontSize: 12.5, marginBottom: 14, lineHeight: 1.5 }}>
        Match confirmed in demo, not reconciled in QuickBooks. Posting and bank reconciliation stay with Emma Walsh and Moran & Co. in QuickBooks Online.
      </div>
      <Grid cols="repeat(4,minmax(0,1fr))" gap={12}>
        <Stat label="Feed lines since 30 Oct" value={QBO_TXNS.length} hint={eur2(-sum(QBO_TXNS.map(t => t.amount))) + " out"} />
        <Stat label="Suggested matches" value={QBO_TXNS.filter(t => t.state === "suggested").length} hint="Amount, date and merchant agree" tone="ok" />
        <Stat label="Need a person" value={QBO_TXNS.filter(needs).length} hint="2 duplicates, 1 unreadable, 1 with no receipt" tone="warn" />
        <Stat label="Confirmed in demo" value={counts.Confirmed || 0} hint="Not reconciled in QuickBooks" />
      </Grid>
      <Grid cols="minmax(0,1fr) 280px" style={{ marginTop: 14 }}>
        <Card flush title="Card and bank feed" right={<Seg options={["All", "Suggested", "Needs a person", "Confirmed"] as XView[]} value={view} onChange={setView} counts={counts} />}>
          <Table cols={cols} rows={rows} rowKey={t => t.id} empty="No feed lines in this view" />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Match confidence">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Donut parts={confParts} size={124} thickness={15} center={QBO_TXNS.length} sub="lines" />
              <div style={{ width: "100%" }}><Legend items={confParts.map(([l, n, c]) => [l, n, c] as [string, ReactNode, string])} /></div>
            </div>
          </Card>
          <Card title="How a match is suggested">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
              <div><b style={{ color: "var(--ink)", fontWeight: 500 }}>Amount</b> matches to the cent</div>
              <div><b style={{ color: "var(--ink)", fontWeight: 500 }}>Date</b> within 3 days of the receipt</div>
              <div><b style={{ color: "var(--ink)", fontWeight: 500 }}>Merchant</b> name similarity on the feed line</div>
              <div><b style={{ color: "var(--ink)", fontWeight: 500 }}>Card holder</b> agrees with who submitted it</div>
              <div style={{ color: "var(--faint)" }}>Two identical lines on one day lower confidence and are flagged as a possible duplicate.</div>
            </div>
          </Card>
        </div>
      </Grid>
    </>
  );
}

function CashForecast() {
  const s = useGG();
  const [sc, setSc] = useState<Scenario>("Expected");
  const flows = buildForecast(sc, s);
  const exp = weeklyBalance(buildForecast("Expected", s));
  const cau = weeklyBalance(buildForecast("Cautious", s));
  const W = [0, 1, 2];
  const winSum = (w: number, kinds: FlowKind[]) => sum(flows.filter(f => windowOf(f.date) === w && kinds.includes(f.kind)).map(expected));
  const inflowKinds: FlowKind[] = ["Current invoices", "Overdue collections", "Projected invoices", "Pipeline deposits"];
  const outKinds: FlowKind[] = ["Salaries & PRSI", "Other operating costs"];
  const opening: number[] = []; const closing: number[] = [];
  let bal = OPENING_CASH;
  W.forEach(w => { opening.push(bal); bal += winSum(w, inflowKinds) + winSum(w, outKinds); closing.push(bal); });
  const low = Math.min(...(sc === "Expected" ? exp : cau));
  const lowWeek = WEEK_LABELS[(sc === "Expected" ? exp : cau).indexOf(low)];
  const west = flows.find(f => f.ref === "INV-1048");
  const shannon = OPPORTUNITIES.find(o => o.id === "L-040");
  const tableRows: [string, number[], boolean?][] = [
    ["Opening balance", opening, true],
    ...inflowKinds.map(k => ["  " + k, W.map(w => winSum(w, [k]))] as [string, number[]]),
    ["Total inflows", W.map(w => winSum(w, inflowKinds)), true],
    ...outKinds.map(k => ["  " + k, W.map(w => winSum(w, [k]))] as [string, number[]]),
    ["Total outflows", W.map(w => winSum(w, outKinds)), true],
    ["Net movement", W.map(w => winSum(w, inflowKinds) + winSum(w, outKinds)), true],
    ["Closing balance", closing, true]
  ];
  const upcoming = flows.filter(f => f.amount > 0 && windowOf(f.date) === 0).slice(0, 12);
  const projected = flows.filter(f => f.kind === "Projected invoices").slice(0, 10);
  return (
    <>
      <PageHead title="Cash forecast" sub="An illustrative 30, 60 and 90 day view from expected customer payments, projected invoices on live projects, weighted pipeline deposits and simulated operating costs. Probabilities are demo assumptions."
        right={<><Badge tone="neutral">Opening cash {eur(OPENING_CASH)} (simulated)</Badge><Seg options={["Expected", "Cautious"] as Scenario[]} value={sc} onChange={setSc} /></>} />
      <Grid cols="repeat(4,minmax(0,1fr))" gap={12}>
        {W.map(w => <Stat key={w} label={"Closing balance, day " + (w + 1) * 30} value={eurK(Math.round(closing[w]))} hint={(closing[w] - opening[w] >= 0 ? "+" : "") + eurK(Math.round(closing[w] - opening[w])) + " in the period"} tone={closing[w] < 30000 ? "warn" : closing[w] < opening[w] ? undefined : "ok"} />)}
        <Stat label="Lowest weekly balance" value={eurK(low)} hint={"Week of " + lowWeek} tone={low < 30000 ? "warn" : undefined} />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox tone={low < 30000 ? "warn" : "info"} title={"Contracted work covers costs to mid-January. The February position depends on collections and the pipeline converting."}
          actions={<><Btn small onClick={() => navigate("Finance", "Invoices")}>Review overdue</Btn><Btn small onClick={() => navigate("Sales", "Pipeline")}>Open pipeline</Btn></>}>
          {"Westhaven " + (west ? "is modelled for " + fmtDate(west.date) + " at " + Math.round(west.prob * 100) + "% likelihood" : "is outside this horizon") + ". Collecting it adds up to " + eur(18400) + " to the low point. Winning Shannon Aviation (" + eur(shannon?.value || 0) + ", " + (shannon?.probability || 0) + "%) brings a 40% deposit into January. Payroll on 25 Nov, 23 Dec and 25 Jan is the largest outflow."}
        </AIBox>
      </div>
      <Grid cols="minmax(0,1.6fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title="Weekly cash balance, next 13 weeks" sub="Solid: expected. Dashed: cautious (half of overdue collected, payments two weeks late, no pipeline)" right={<Badge tone="neutral">Illustrative</Badge>}>
          <LineChart labels={WEEK_LABELS} height={200} format={eurK} series={[
            { name: "Expected", color: "var(--gg-green)", values: exp },
            { name: "Cautious", color: "var(--warn)", values: cau, dashed: true }
          ]} />
        </Card>
        <Card flush title="30 / 60 / 90 day view" sub={sc + " case · probability-weighted"}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(3,1fr)", gap: 8, padding: "9px 18px", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>
            {["", "0 to 30", "31 to 60", "61 to 90"].map(h => <span key={h} style={{ fontSize: 11, color: "var(--faint)", textAlign: h ? "right" : "left" }}>{h ? h + " days" : ""}</span>)}
          </div>
          {tableRows.map(([label, vals, strong]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(3,1fr)", gap: 8, padding: "7px 18px", borderTop: strong ? "1px solid var(--border)" : 0 }}>
              <span style={{ fontSize: 12, color: strong ? "var(--ink)" : "var(--dim)", fontWeight: strong ? 500 : 400, whiteSpace: "pre" }}>{label}</span>
              {vals.map((v, k) => <span key={k} style={{ fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: strong ? 500 : 400, color: label === "Closing balance" && v < 30000 ? "var(--warn)" : v < 0 ? "var(--body)" : "var(--ink)" }}>{eur(Math.round(v))}</span>)}
            </div>
          ))}
        </Card>
      </Grid>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Expected customer payments, next 30 days" sub="Current invoices by due date plus overdue collections">
          {upcoming.map((u, k) => (
            <div key={k} className={u.ref ? "gg-row" : undefined} style={{ display: "grid", gridTemplateColumns: "64px 1fr 80px 60px", gap: 10, alignItems: "center", padding: "9px 18px", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12, color: "var(--dim)" }}>{fmtDate(u.date)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.label}</div>
                <div style={{ fontSize: 11, color: "var(--faint)" }}>{u.kind}{u.note ? " · " + u.note : ""}</div>
              </div>
              <span style={{ fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(u.amount)}</span>
              <Badge tone={u.prob >= 0.9 ? "ok" : u.prob >= 0.7 ? "info" : "warn"} style={{ justifyContent: "center" }}>{Math.round(u.prob * 100)}%</Badge>
            </div>
          ))}
        </Card>
        <Card flush title="Projected invoices on live projects" sub="From project stages and due dates; at-risk and blocked work shifted later">
          {projected.map((p, k) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px", gap: 10, alignItems: "center", padding: "9px 18px", borderTop: "1px solid var(--border)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "var(--faint)" }}>{p.note} · paid about {fmtDate(p.date)}</div>
              </div>
              <span style={{ fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(Math.round(p.amount))}</span>
              {p.ref && <RecordChip id={p.ref} label={p.ref} />}
            </div>
          ))}
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--faint)" }}>Operating costs are simulated monthly figures: {OPEX_MONTHLY.map(o => o[0]).join(", ")}.</div>
        </Card>
      </Grid>
    </>
  );
}

/* ── module ────────────────────────────────────────────────────────────────── */
export default function Finance({ tab }: { tab: string }) {
  const [inv, setInv] = useState<string | null>(null);
  const [apr, setApr] = useState<string | null>(null);
  const [rcpt, setRcpt] = useState<string | null>(null);
  useFocus(["Invoice", "Expense batch"], id => (/^INV-/.test(id) ? setInv(id) : setRcpt("R-09")));
  let body: ReactNode;
  if (tab === "Invoices") body = <Invoices onInvoice={setInv} onApproval={setApr} />;
  else if (tab === "Expenses") body = <Expenses key={rcpt || "x"} onApproval={setApr} focusSel={rcpt} />;
  else if (tab === "Reconciliation") body = <Reconciliation />;
  else if (tab === "Cash Forecast") body = <CashForecast />;
  else body = <Overview onInvoice={setInv} onApproval={setApr} />;
  return (
    <Page>
      {body}
      <InvoiceDrawer id={inv} onClose={() => setInv(null)} onApproval={setApr} />
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </Page>
  );
}
