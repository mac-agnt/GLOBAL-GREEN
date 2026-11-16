/* Reports & Compliance: technical reporting, deliverables, certification
   programmes and the audit trail. Pulse checks completeness and drafts
   summaries; engineers analyse, review, approve and issue. */
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  REPORTS, REPORT_STAGES, CERTIFICATIONS, AUDIT_TRAIL, DRAFT_SUMMARY, EVIDENCE, STAFF, COMPLETED_PROJECTS,
  project, client, staff, fmtDate, fmtDay, daysUntil, sum,
  type Report, type ReportStage, type AuditEntry, type Certification, type Evidence
} from "../data";
import { useGG, evidenceStatus, logEvent, toast, navigate, type GGState } from "../store";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Seg, Search, Table, Drawer, Section, Kv, RecordChip, AIBox,
  Timeline, HBars, Bars, Donut, Legend, Meter, Person, useFocus, MONO_LABEL, SERIES, type Tone, type Col
} from "../ui";
import { ApprovalDrawer } from "./ApprovalsPanel";

/* ── local demo state: human stage moves and audit entries ─────────────────── */
interface RS { stage: Record<string, ReportStage>; version: Record<string, string>; audit: AuditEntry[]; reviewReq: Record<string, boolean>; }
let rs: RS = { stage: {}, version: {}, audit: [], reviewReq: {} };
const subs = new Set<() => void>();
const rsub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const rget = () => rs;
function rset(p: Partial<RS>) { rs = { ...rs, ...p }; subs.forEach(f => f()); }
function useRS() { return useSyncExternalStore(rsub, rget, rget); }

const pad = (n: number) => String(n).padStart(2, "0");
function nowStamp() { const d = new Date(); return "2026-11-16 " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
const stageOf = (r: Report, x: RS): ReportStage => x.stage[r.id] || r.stage;
const versionOf = (r: Report, x: RS) => x.version[r.id] || r.version;

function humanStep(r: Report, to: ReportStage, action: string, version?: string) {
  const entry: AuditEntry = { id: "LA-" + (rs.audit.length + 1), reportId: r.id, when: nowStamp(), who: "Niall Kiernan", action, version: version || versionOf(r, rs) };
  rset({ stage: { ...rs.stage, [r.id]: to }, version: version ? { ...rs.version, [r.id]: version } : rs.version, audit: [entry].concat(rs.audit) });
  logEvent({ source: "Pulse", category: "Reports", title: action + ": " + r.title, detail: "Human step recorded as Niall Kiernan in the demo. Nothing was issued to a client.", actor: "Niall Kiernan", record: r.id });
  toast(action + ". Recorded as a human decision in the demo.");
}

/* ── helpers ───────────────────────────────────────────────────────────────── */
const MISSING_NOTE: Record<string, string> = {
  "RPT-249": "Scope 1 and 2 data return from the 5 hotels (milestone due 24 Nov)",
  "RPT-238": "Scope 3 purchased-goods data has gaps for 3 supplier categories (EV-238-01 in review)"
};
function missingOf(r: Report, s: GGState): { count: number; items: Evidence[] } {
  const tracked = EVIDENCE.filter(e => e.projectId === r.projectId && (e.status === "missing" || e.status === "requested"));
  if (tracked.length) {
    const items = tracked.filter(e => evidenceStatus(s, e) !== "received");
    return { count: items.length, items };
  }
  return { count: r.missing, items: [] };
}
function clientOfReport(r: Report): string {
  const p = project(r.projectId) || COMPLETED_PROJECTS.find(c => c.id === r.projectId);
  return p ? client(p.clientId)?.name || "" : "";
}
function dueLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "due today";
  if (d > 0) return "due in " + d + (d === 1 ? " day" : " days");
  return Math.abs(d) + (d === -1 ? " day" : " days") + " ago";
}
const STAGE_TONE: Record<ReportStage, Tone> = {
  "Data collection": "warn", "Analysis": "info", "Draft": "lime", "Technical review": "accent", "Client delivery": "ok", "Delivered": "neutral"
};
const STAGE_WHO: Record<ReportStage, string> = {
  "Data collection": "AI checks completeness",
  "Analysis": "Engineer analysis",
  "Draft": "AI may draft summaries",
  "Technical review": "Human sign-off required",
  "Client delivery": "Human issues to client",
  "Delivered": "Issued and archived"
};
const ALL_STAGES: ReportStage[] = [...REPORT_STAGES, "Delivered"];
const staffByName = (name: string) => STAFF.find(p => p.name === name);
const isAI = (who: string) => /^Pulse/.test(who);

function Who({ name }: { name: string }) {
  if (isAI(name)) return <Badge tone="info">AI · {name.replace(/^Pulse \(|\)$/g, "")}</Badge>;
  const p = staffByName(name);
  return p ? <Person id={p.id} /> : <span style={{ fontSize: 12.5 }}>{name}</span>;
}

/* ── report card + drawer ──────────────────────────────────────────────────── */
function ReportCard({ r, onOpen }: { r: Report; onOpen: (id: string) => void }) {
  const s = useGG(); const x = useRS();
  const m = missingOf(r, s);
  const d = daysUntil(r.due);
  const st = stageOf(r, x);
  return (
    <div className="gg-click" onClick={() => onOpen(r.id)} style={{ padding: "12px 13px", background: "var(--surface-2)", border: "1px solid " + (m.count && st === "Data collection" ? "color-mix(in srgb, var(--warn) 40%, transparent)" : "var(--border)"), borderRadius: "var(--r-md,14px)", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ ...MONO_LABEL, letterSpacing: ".06em", flex: 1 }}>{r.id} · {versionOf(r, x)}</span>
        {r.story && <Badge tone="info" style={{ height: 18, fontSize: 10 }}>Story {r.story}</Badge>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6, lineHeight: 1.35 }}>{r.title}</div>
      <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{r.type}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <Person id={r.owner} />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: d < 0 && st !== "Delivered" ? "var(--bad)" : d <= 7 && st !== "Delivered" ? "var(--warn)" : "var(--faint)", whiteSpace: "nowrap" }}>{fmtDate(r.due)}</span>
      </div>
      {m.count > 0 && st !== "Delivered" && <div style={{ marginTop: 8 }}><Badge tone="warn" dot>{m.count} evidence {m.count === 1 ? "item" : "items"} missing</Badge></div>}
    </div>
  );
}

function ReportDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useGG(); const x = useRS();
  const r = REPORTS.find(z => z.id === id);
  if (!r) return null;
  const st = stageOf(r, x);
  const m = missingOf(r, s);
  const ev = EVIDENCE.filter(e => e.projectId === r.projectId);
  const audit = x.audit.filter(a => a.reportId === r.id).concat(AUDIT_TRAIL.filter(a => a.reportId === r.id).sort((a, b) => b.when.localeCompare(a.when)));
  const idx = ALL_STAGES.indexOf(st);
  let footer: ReactNode;
  if (st === "Data collection") footer = m.count > 0
    ? <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Analysis cannot start until the evidence is in.</span><Btn onClick={() => navigate("Sites", "Evidence")}>Open evidence</Btn><Btn kind="primary" disabled>Waiting on {m.count} {m.count === 1 ? "item" : "items"}</Btn></>
    : <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>All evidence received.</span><Btn kind="primary" onClick={() => humanStep(r, "Analysis", "Moved to analysis")}>Start analysis</Btn></>;
  else if (st === "Analysis") footer = <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Engineering analysis is done by {staff(r.owner).first}.</span><Btn kind="primary" onClick={() => humanStep(r, "Draft", "Analysis complete, moved to draft")}>Mark analysis complete</Btn></>;
  else if (st === "Draft") footer = <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Reviewer: {staff(r.reviewer).name}.</span><Btn kind="primary" onClick={() => humanStep(r, "Technical review", "Submitted for technical review")}>Submit for technical review</Btn></>;
  else if (st === "Technical review") footer = <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Only a named engineer can approve. AI cannot.</span><Btn kind="danger" onClick={() => humanStep(r, "Draft", "Returned to draft with comments")}>Return to draft</Btn><Btn kind="primary" onClick={() => humanStep(r, "Client delivery", "Technical review approved", "v1.0")}>Approve technical review</Btn></>;
  else if (st === "Client delivery") footer = <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Issue is a human step. Nothing is emailed from the demo.</span><Btn kind="primary" onClick={() => humanStep(r, "Delivered", "Marked as issued to client")}>Mark issued to client</Btn></>;
  else footer = <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Issued. Retained with its evidence and review history.</span><Btn onClick={onClose}>Close</Btn></>;

  return (
    <Drawer open={!!r} onClose={onClose} eyebrow={r.type.toUpperCase() + " · " + r.id} width={600}
      badge={<Badge tone={STAGE_TONE[st]} dot>{st}</Badge>} title={r.title} footer={footer}>
      <Kv cols={3} items={[
        ["Client", clientOfReport(r)], ["Owner", staff(r.owner).name], ["Technical reviewer", staff(r.reviewer).name],
        ["Version", versionOf(r, x)], ["Due", fmtDay(r.due) + " (" + dueLabel(r.due) + ")"], ["Missing evidence", m.count ? String(m.count) : "None"]
      ]} />
      <Section label="Stage">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 4 }}>
          {ALL_STAGES.map((g, i) => (
            <div key={g} style={{ minWidth: 0 }}>
              <span style={{ display: "block", height: 5, borderRadius: 3, background: i < idx ? "var(--gg-green)" : i === idx ? "var(--accent)" : "var(--track)" }} />
              <div style={{ fontSize: 10.5, marginTop: 6, color: i === idx ? "var(--ink)" : "var(--faint)", lineHeight: 1.3 }}>{g}</div>
              <div style={{ fontSize: 9.5, marginTop: 2, color: "var(--faint)", lineHeight: 1.3 }}>{STAGE_WHO[g]}</div>
            </div>
          ))}
        </div>
      </Section>
      {(m.count > 0 || MISSING_NOTE[r.id]) && (
        <AIBox tone="warn" title={m.count ? m.count + " evidence " + (m.count === 1 ? "item is" : "items are") + " holding this report" : "Open data question"}>
          {m.items.length ? m.items.map(e => e.title).join("; ") + "." : MISSING_NOTE[r.id]}
        </AIBox>
      )}
      <Section label="Project evidence" right={<RecordChip id={r.projectId} />}>
        {ev.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No evidence files are tracked for this project yet.</div> : (
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", overflow: "hidden" }}>
            {ev.map((e, i) => {
              const es = evidenceStatus(s, e);
              const tone: Tone = es === "received" ? "ok" : es === "in_review" ? "info" : es === "requested" || es === "uploading" ? "warn" : "bad";
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{e.kind} · from {e.from}{e.note ? " · " + e.note : ""}</div>
                  </div>
                  <Badge tone={tone}>{es.replace("_", " ")}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Section>
      <Section label="Review and approval history">
        {audit.length ? <Timeline items={audit.map(a => ({ when: fmtDate(a.when) + " " + a.when.slice(11), title: a.action, tone: isAI(a.who) ? "info" as Tone : /approved|issued/i.test(a.action) ? "ok" as Tone : "neutral" as Tone,
          detail: <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><Who name={a.who} /><span style={{ color: "var(--faint)" }}>{a.version}</span>{a.evidence && <RecordChip id={a.evidence} />}</span> }))} />
          : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No review activity recorded yet.</div>}
      </Section>
      <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.55 }}>Pulse may check completeness and draft summaries from evidence. Engineering conclusions, technical review, approval and issue are always done by a named Global Green consultant.</div>
    </Drawer>
  );
}

/* ── certification drawer ──────────────────────────────────────────────────── */
const CHECKLIST: Record<Certification["standard"], string[]> = {
  "ISO 14001": ["Context and scope", "Environmental policy", "Aspects and impacts register", "Compliance obligations register", "Objectives and operational controls", "Internal audit", "Management review"],
  "ISO 50001": ["Scope and boundaries", "Energy policy", "Energy review and SEUs", "Energy baseline and EnPIs", "Objectives and action plans", "Internal audit", "Management review"],
  "ISO 14064": ["Organisational boundary", "Scope 1 inventory", "Scope 2 inventory", "Scope 3 screening", "Uncertainty assessment", "Inventory report", "Verifier submission"],
  "B Corp": ["B Impact Assessment baseline", "Governance changes", "Workers and community", "Environment section", "Evidence pack", "Submit for verification"]
};
const blockedCert = (c: Certification) => /blocked/i.test(c.status);
const certTone = (c: Certification): Tone => blockedCert(c) ? "bad" : c.progress >= 100 ? "ok" : c.progress >= 50 ? "info" : "warn";

function CertDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const x = useRS();
  const c = CERTIFICATIONS.find(z => z.id === id);
  if (!c) return null;
  const list = CHECKLIST[c.standard];
  const done = Math.round((c.progress / 100) * list.length);
  const reports = REPORTS.filter(r => r.projectId === c.projectId);
  return (
    <Drawer open={!!c} onClose={onClose} eyebrow={c.standard.toUpperCase() + " · " + c.id} badge={<Badge tone={certTone(c)} dot>{c.status}</Badge>} title={client(c.clientId)?.name + " · " + c.standard}
      footer={<><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Certification is decided by an accredited certification body or verifier.</span><Btn onClick={onClose}>Close</Btn></>}>
      <Kv cols={3} items={[["Readiness", c.progress + "%"], ["Next milestone", c.nextLabel], ["Date", fmtDay(c.next) + " (" + dueLabel(c.next) + ")"], ["Global Green lead", staff(c.lead).name], ["Client", client(c.clientId)?.name], ["Linked project", c.projectId || "Ongoing support"]]} />
      {blockedCert(c) && <AIBox tone="bad" title="Two milestones are blocked on client consumption data" actions={<Btn small kind="primary" onClick={() => navigate("Agents", "Approvals", { kind: "Approval", id: "APR-06" })}>Review escalation APR-06</Btn>}>
        The energy review and baseline cannot start without 12 months of electricity, diesel and LPG data, requested on 15 Oct. Ops Watchdog recommends escalating to the Operations Director.
      </AIBox>}
      <Section label="Readiness checklist">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((item, i) => {
            const isDone = i < done, isBlocked = blockedCert(c) && i >= done && i < done + 2;
            return (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "var(--ok-soft)" : isBlocked ? "var(--bad-soft)" : "var(--track)", color: isDone ? "var(--ok)" : "var(--bad)", fontSize: 11 }}>{isDone ? "✓" : isBlocked ? "!" : ""}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: isDone ? "var(--body)" : "var(--ink)" }}>{item}</span>
                <span style={{ fontSize: 11, color: isDone ? "var(--ok)" : isBlocked ? "var(--bad)" : "var(--faint)" }}>{isDone ? "Done" : isBlocked ? "Blocked" : "To do"}</span>
              </div>
            );
          })}
        </div>
      </Section>
      {reports.length > 0 && <Section label="Linked reports">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{reports.map(r => <span key={r.id} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><RecordChip id={r.id} /><Badge tone={STAGE_TONE[stageOf(r, x)]}>{stageOf(r, x)}</Badge></span>)}</div>
      </Section>}
      <Section label="Notes"><div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>{c.note}</div></Section>
      <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.55 }}>Pulse tracks readiness, evidence and dates. It does not certify compliance. Global Green consultants sign off readiness; the certification body makes the decision.</div>
    </Drawer>
  );
}

/* ── tabs ──────────────────────────────────────────────────────────────────── */
function Overview({ onOpen, onCert }: { onOpen: (id: string) => void; onCert: (id: string) => void }) {
  const s = useGG(); const x = useRS();
  const [apr, setApr] = useState<string | null>(null);
  const active = REPORTS.filter(r => stageOf(r, x) !== "Delivered");
  const review = active.filter(r => stageOf(r, x) === "Technical review");
  const blocked = active.filter(r => stageOf(r, x) === "Data collection" && missingOf(r, s).count > 0);
  const blockedItems = sum(blocked.map(r => missingOf(r, s).count));
  const due14 = active.filter(r => daysUntil(r.due) >= 0 && daysUntil(r.due) <= 14);
  const certSoon = CERTIFICATIONS.filter(c => daysUntil(c.next) >= 0 && daysUntil(c.next) <= 30);
  const deadlines = active.map(r => ({ when: r.due, title: r.title, kind: "Deliverable", id: r.id, tone: (missingOf(r, s).count ? "warn" : "neutral") as Tone }))
    .concat(CERTIFICATIONS.filter(c => c.progress < 100).map(c => ({ when: c.next, title: client(c.clientId)?.name + ": " + c.nextLabel, kind: c.standard, id: c.id, tone: (blockedCert(c) ? "bad" : "info") as Tone })))
    .filter(d => daysUntil(d.when) >= 0 && daysUntil(d.when) <= 21).sort((a, b) => a.when.localeCompare(b.when));
  const stageCounts = ALL_STAGES.slice(0, 5).map((g, i) => [g, active.filter(r => stageOf(r, x) === g).length, SERIES[i]] as [string, number, string]);
  const reqBtn = (aid: string, label: string) => s.approvals[aid]
    ? <Badge tone={s.approvals[aid] === "approved" ? "ok" : "bad"} dot>{label}: {s.approvals[aid]}</Badge>
    : <Btn small onClick={() => setApr(aid)}>{label}</Btn>;
  return (
    <>
      <PageHead title="Reports & Compliance" sub="Technical reports, client deliverables and certification programmes in one place. Pulse checks completeness and drafts; your engineers analyse, review, approve and issue."
        right={<><Badge tone="ok" dot>Human sign-off on every report</Badge><Btn kind="primary" onClick={() => navigate("Reports", "Report Pipeline")}>Open pipeline</Btn></>} />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Reports in progress" value={active.length} hint={sum(stageCounts.slice(2).map(c => c[1])) + " at draft or later"} onClick={() => navigate("Reports", "Report Pipeline")} />
        <Stat label="Awaiting technical review" value={review.length} hint={review.map(r => r.id).join(", ") || "None"} tone="accent" onClick={() => onOpen(review[0]?.id || "RPT-238")} />
        <Stat label="Blocked by missing evidence" value={blocked.length + " reports"} hint={blockedItems + " evidence items outstanding"} tone={blocked.length ? "warn" : "ok"} />
        <Stat label="Deliverables due in 14 days" value={due14.length} hint={due14.slice(0, 2).map(r => fmtDate(r.due)).join(", ")} />
        <Stat label="Compliance milestones, 30 days" value={certSoon.length} hint={certSoon.map(c => c.standard).join(", ")} tone={certSoon.some(blockedCert) ? "bad" : undefined} onClick={() => navigate("Reports", "Certifications")} />
      </Grid>
      <Grid cols="minmax(0,1.45fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AIBox title={"Clear the " + blockedItems + " missing evidence items holding the Glenmere, Oakfield and Carrick reports"}
            actions={<>{reqBtn("APR-03", "Glenmere request")}{reqBtn("APR-04", "Oakfield request")}{reqBtn("APR-06", "Carrick escalation")}</>}>
            RPT-241 is due 30 Nov and the site visit is Wednesday. RPT-252 is due 2 Dec with ecology inputs 3 days late. RPT-236 has waited 31 days for consumption data. Each request is drafted and waiting for its owner. Nothing has been sent.
          </AIBox>
          <Card title={DRAFT_SUMMARY.title} sub="Generated from project evidence and findings. Every sentence links to its source."
            right={<Badge tone="warn" dot>Needs engineer review</Badge>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DRAFT_SUMMARY.paragraphs.map(([p, src], i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>
                  <span style={{ flex: "none", width: 20, height: 20, borderRadius: 6, background: "var(--gg-blue-soft)", color: "var(--gg-blue)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.6, color: "var(--body)" }}>{p}</div>
                  <RecordChip id={src} label={src} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: "var(--r-md,14px)", background: "var(--warn-soft)", color: "var(--warn)", fontSize: 12.5, lineHeight: 1.55 }}>{DRAFT_SUMMARY.caveat}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Btn onClick={() => onOpen(DRAFT_SUMMARY.reportId)}>Open {DRAFT_SUMMARY.reportId}</Btn>
              {x.reviewReq[DRAFT_SUMMARY.reportId]
                ? <Badge tone="ok" dot>Review requested from Eoin Gallagher</Badge>
                : <Btn kind="primary" onClick={() => {
                    rset({ reviewReq: { ...rs.reviewReq, [DRAFT_SUMMARY.reportId]: true } });
                    logEvent({ source: "Pulse", category: "Reports", title: "Engineer review requested for AI draft summary", detail: "RPT-257 summary stays a draft until Eoin Gallagher approves it.", actor: "Niall Kiernan", record: DRAFT_SUMMARY.reportId });
                    toast("Review requested from Eoin. The summary stays a draft until he approves it.");
                  }}>Request engineer review</Btn>}
              <span style={{ fontSize: 11.5, color: "var(--faint)" }}>AI drafts. It never approves conclusions or issues reports.</span>
            </div>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Blocked by missing evidence" sub="Reports that cannot leave data collection" flush>
            {blocked.map((r, i) => {
              const m = missingOf(r, s);
              return (
                <div key={r.id} className="gg-row" onClick={() => onOpen(r.id)} style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--border)" : "1px solid var(--border)", cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0 }}>{clientOfReport(r)}</span>
                    <Badge tone="warn">{m.count} missing</Badge>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{r.id} · {staff(r.owner).name} · {dueLabel(r.due)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 5, lineHeight: 1.45 }}>{m.items.map(e => e.title + " (" + evidenceStatus(s, e) + ")").join(" · ")}</div>
                </div>
              );
            })}
            {blocked.length === 0 && <div style={{ padding: "16px 18px", fontSize: 12.5, color: "var(--ok)" }}>Nothing is blocked. All evidence is in.</div>}
          </Card>
          <Card title="Next 21 days" sub="Client deliverables and compliance milestones">
            <Timeline items={deadlines.slice(0, 7).map(d => ({
              when: fmtDate(d.when), tone: d.tone,
              title: <span className="gg-click" style={{ cursor: "pointer" }} onClick={() => /^CERT/.test(d.id) ? onCert(d.id) : onOpen(d.id)}>{d.title}</span>,
              detail: d.kind + " · " + dueLabel(d.when)
            }))} />
          </Card>
          <Card title="Reports by stage">
            <HBars data={stageCounts} format={n => n + (n === 1 ? " report" : " reports")} />
          </Card>
        </div>
      </Grid>
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </>
  );
}

function Pipeline({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useGG(); const x = useRS();
  const [q, setQ] = useState("");
  const owners = ["Everyone"].concat(Array.from(new Set(REPORTS.map(r => staff(r.owner).first))));
  const [owner, setOwner] = useState("Everyone");
  const rows = REPORTS.filter(r => (owner === "Everyone" || staff(r.owner).first === owner)
    && (!q || (r.title + " " + r.id + " " + clientOfReport(r) + " " + r.type).toLowerCase().includes(q.toLowerCase())));
  const missingTotal = sum(REPORTS.filter(r => stageOf(r, x) !== "Delivered").map(r => missingOf(r, s).count));
  return (
    <>
      <PageHead title="Report pipeline" sub="Every technical report from data collection to client delivery. Moving a report forward is a human decision, recorded against the person who made it."
        right={<><Search value={q} onChange={setQ} placeholder="Search reports or clients" width={240} /></>} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Seg options={owners} value={owner} onChange={setOwner} />
        <span style={{ flex: 1 }} />
        <Badge tone="warn" dot>{missingTotal} evidence items outstanding</Badge>
        <Badge tone="info">AI: completeness checks and draft summaries</Badge>
        <Badge tone="ok">People: analysis, review, approval, issue</Badge>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(214px,1fr))", gap: 12, minWidth: 1320 }}>
          {ALL_STAGES.map(g => {
            const list = rows.filter(r => stageOf(r, x) === g).sort((a, b) => a.due.localeCompare(b.due));
            return (
              <div key={g} style={{ background: "var(--surface-faint)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", padding: 10, minHeight: 380, opacity: g === "Delivered" ? 0.8 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 2px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--" + ({ warn: "warn", info: "gg-blue", lime: "gg-lime", accent: "accent", ok: "ok", neutral: "dim" } as Record<string, string>)[STAGE_TONE[g]] + ")" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{g}</span>
                  <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{list.length}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--faint)", padding: "0 4px 10px" }}>{STAGE_WHO[g]}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {list.map(r => <ReportCard key={r.id} r={r} onOpen={onOpen} />)}
                  {list.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "18px 6px", textAlign: "center" }}>Nothing at this stage</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const TYPES: Report["type"][] = ["Energy audit report", "Environmental assessment report", "Carbon baseline report", "Energy action plan", "Feasibility study", "ISO readiness document", "Compliance review"];
const WEEKS: [string, string, string][] = [["This week", "2026-11-16", "2026-11-22"], ["23 to 29 Nov", "2026-11-23", "2026-11-29"], ["30 Nov to 6 Dec", "2026-11-30", "2026-12-06"], ["7 to 13 Dec", "2026-12-07", "2026-12-13"], ["Later", "2026-12-14", "2027-12-31"]];
type DView = "All" | "Due in 21 days" | "At risk" | "Delivered";

function Deliverables({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useGG(); const x = useRS();
  const [view, setView] = useState<DView>("All");
  const atRisk = (r: Report) => stageOf(r, x) !== "Delivered" && (missingOf(r, s).count > 0 || (daysUntil(r.due) <= 10 && ["Data collection", "Analysis"].includes(stageOf(r, x))));
  const active = REPORTS.filter(r => stageOf(r, x) !== "Delivered");
  const filtered = REPORTS.filter(r => view === "All" ? true : view === "Delivered" ? stageOf(r, x) === "Delivered" : view === "At risk" ? atRisk(r) : stageOf(r, x) !== "Delivered" && daysUntil(r.due) >= 0 && daysUntil(r.due) <= 21);
  const byType = TYPES.map((t, i) => [t, REPORTS.filter(r => r.type === t).length, SERIES[i % SERIES.length]] as [string, number, string]).filter(t => t[1] > 0);
  const weeks = WEEKS.map(([l, a, b]) => [l, active.filter(r => r.due >= a && r.due <= b).length] as [string, number]);
  const counts: Partial<Record<DView, number>> = { All: REPORTS.length, "Due in 21 days": active.filter(r => daysUntil(r.due) >= 0 && daysUntil(r.due) <= 21).length, "At risk": REPORTS.filter(atRisk).length, Delivered: REPORTS.filter(r => stageOf(r, x) === "Delivered").length };
  const cols: Col<Report>[] = [
    { key: "t", label: "Deliverable", width: "2.2fr", render: r => <div style={{ minWidth: 0 }}><div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div><div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{r.id} · {clientOfReport(r)}</div></div> },
    { key: "o", label: "Owner", width: "1.1fr", render: r => <Person id={r.owner} /> },
    { key: "st", label: "Stage", width: "1fr", render: r => <Badge tone={STAGE_TONE[stageOf(r, x)]}>{stageOf(r, x)}</Badge> },
    { key: "v", label: "Version", width: ".55fr", render: r => <span style={{ color: "var(--dim)" }}>{versionOf(r, x)}</span> },
    { key: "d", label: "Due", width: ".9fr", render: r => <span style={{ color: atRisk(r) ? "var(--warn)" : "var(--body)" }}>{fmtDate(r.due)}<span style={{ color: "var(--faint)", fontSize: 11 }}> · {dueLabel(r.due)}</span></span> },
    { key: "m", label: "Status", width: "1fr", render: r => stageOf(r, x) === "Delivered" ? <Badge tone="ok">Issued</Badge> : atRisk(r) ? <Badge tone="warn" dot>{missingOf(r, s).count ? missingOf(r, s).count + " missing" : "Tight timeline"}</Badge> : <Badge tone="ok" dot>On track</Badge> }
  ];
  return (
    <>
      <PageHead title="Client deliverables" sub="Every report Global Green owes a client, grouped by type, with due date, stage and anything putting it at risk." right={<Seg options={["All", "Due in 21 days", "At risk", "Delivered"] as DView[]} value={view} onChange={setView} counts={counts} />} />
      <Grid cols="minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,.8fr)">
        <Card title="By deliverable type">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Donut parts={byType} size={128} thickness={16} center={REPORTS.length} sub="reports" />
            <Legend items={byType.map(([l, n, c]) => [l, n, c] as [string, ReactNode, string])} />
          </div>
        </Card>
        <Card title="Due by week" sub="Open deliverables only">
          <Bars data={weeks} height={110} format={n => String(n)} highlight="23 to 29 Nov" />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Stat label="Due before 4 Dec" value={active.filter(r => r.due <= "2026-12-04").length} hint="RPT-241, 252 and 236 need evidence first" tone="warn" />
          <Stat label="Issued this quarter" value={REPORTS.filter(r => stageOf(r, x) === "Delivered").length} hint="Westhaven portfolio audits, 2 Sep" tone="ok" />
        </div>
      </Grid>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
        {TYPES.map(t => {
          const list = filtered.filter(r => r.type === t).sort((a, b) => a.due.localeCompare(b.due));
          if (!list.length) return null;
          return (
            <Card key={t} flush title={t + "s"} sub={list.length + (list.length === 1 ? " deliverable" : " deliverables")}>
              <Table cols={cols} rows={list} rowKey={r => r.id} onRow={r => onOpen(r.id)} />
            </Card>
          );
        })}
        {filtered.length === 0 && <Card><div style={{ fontSize: 13, color: "var(--dim)", textAlign: "center", padding: 20 }}>No deliverables in this view.</div></Card>}
      </div>
    </>
  );
}

const STANDARDS = ["All", "ISO 14001", "ISO 50001", "ISO 14064", "B Corp"] as const;
type Std = typeof STANDARDS[number];
const STD_BLURB: Record<Exclude<Std, "All">, string> = {
  "ISO 14001": "Environmental management", "ISO 50001": "Energy management", "ISO 14064": "Greenhouse gas accounting", "B Corp": "Certification support"
};

function Certifications({ onCert }: { onCert: (id: string) => void }) {
  const [std, setStd] = useState<Std>("All");
  const list = CERTIFICATIONS.filter(c => std === "All" || c.standard === std).sort((a, b) => a.next.localeCompare(b.next));
  const counts: Partial<Record<Std, number>> = { All: CERTIFICATIONS.length };
  STANDARDS.slice(1).forEach(k => { counts[k] = CERTIFICATIONS.filter(c => c.standard === k).length; });
  return (
    <>
      <PageHead title="Certification programmes" sub="ISO 14001, ISO 50001, ISO 14064 and B Corp work for clients: readiness, next audit or milestone, and who leads it." right={<Seg options={STANDARDS} value={std} onChange={setStd} counts={counts} />} />
      <Grid cols="repeat(4,minmax(0,1fr))" gap={12}>
        {(STANDARDS.slice(1) as Exclude<Std, "All">[]).map(k => {
          const cs = CERTIFICATIONS.filter(c => c.standard === k);
          const certified = cs.filter(c => c.progress >= 100).length;
          return (
            <div key={k} className="gg-click" onClick={() => setStd(k)} style={{ padding: "14px 16px", background: std === k ? "var(--surface-2)" : "var(--surface)", border: "1px solid " + (std === k ? "var(--accent-line)" : "var(--border)"), borderRadius: "var(--r-md,16px)", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{k}</span>{cs.some(blockedCert) && <Badge tone="bad">1 blocked</Badge>}</div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{STD_BLURB[k]}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <div><div style={{ fontSize: 20, fontWeight: 600 }}>{cs.length}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>programmes</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 600, color: "var(--ok)" }}>{certified}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>{k === "ISO 14064" ? "verified" : "certified"}</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 600 }}>{cs.length - certified}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>in progress</div></div>
              </div>
            </div>
          );
        })}
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox tone="bad" title="Carrick Logistics ISO 50001: the 27 Nov milestone will slip without client data"
          actions={<><Btn small kind="primary" onClick={() => navigate("Agents", "Approvals", { kind: "Approval", id: "APR-06" })}>Review escalation</Btn><Btn small onClick={() => onCert("CERT-4")}>Open programme</Btn></>}>
          Energy review and baseline, and EnPIs and objectives, are both blocked on 12 months of consumption data. Ops Watchdog proposes a revised 4 Dec milestone if data arrives by 24 Nov.
        </AIBox>
      </div>
      <Grid cols="repeat(auto-fill,minmax(310px,1fr))" gap={12} style={{ marginTop: 14 }}>
        {list.map(c => (
          <div key={c.id} className="gg-click" onClick={() => onCert(c.id)} style={{ padding: "15px 16px", background: "var(--surface)", border: "1px solid " + (blockedCert(c) ? "color-mix(in srgb, var(--bad) 40%, transparent)" : "var(--border)"), borderRadius: "var(--card-r,18px)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge tone="info">{c.standard}</Badge>
              <span style={{ flex: 1 }} />
              <Badge tone={certTone(c)} dot>{c.status}</Badge>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 10 }}>{client(c.clientId)?.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}><Meter value={c.progress} tone={certTone(c)} /></div>
              <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: "var(--body)" }}>{c.progress}%</span>
            </div>
            <div style={{ fontSize: 12.5, marginTop: 10 }}>{c.nextLabel}</div>
            <div style={{ fontSize: 11.5, color: daysUntil(c.next) <= 14 ? "var(--warn)" : "var(--faint)", marginTop: 2 }}>{fmtDay(c.next)} · {dueLabel(c.next)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Person id={c.lead} />
              <span style={{ flex: 1 }} />
              {c.projectId && <RecordChip id={c.projectId} label={c.projectId} />}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 10, lineHeight: 1.5 }}>{c.note}</div>
          </div>
        ))}
      </Grid>
      <div style={{ marginTop: 14, fontSize: 12, color: "var(--faint)", lineHeight: 1.6 }}>Pulse tracks readiness, evidence and dates. It does not certify compliance. Certification and verification decisions are made by accredited bodies after Global Green consultants sign off readiness.</div>
    </>
  );
}

const ATYPES = ["All", "Submissions", "Reviews", "Approvals & issue", "AI checks"] as const;
type AType = typeof ATYPES[number];
function typeOf(a: AuditEntry): AType {
  if (isAI(a.who)) return "AI checks";
  if (/approved|issued/i.test(a.action)) return "Approvals & issue";
  if (/submitted/i.test(a.action)) return "Submissions";
  return "Reviews";
}

function AuditTrail({ onOpen }: { onOpen: (id: string) => void }) {
  const x = useRS();
  const [t, setT] = useState<AType>("All");
  const [q, setQ] = useState("");
  const entries = x.audit.concat(AUDIT_TRAIL.slice().sort((a, b) => b.when.localeCompare(a.when)));
  const rows = entries.filter(a => (t === "All" || typeOf(a) === t)
    && (!q || (a.action + " " + a.who + " " + (REPORTS.find(r => r.id === a.reportId)?.title || "") + " " + a.reportId).toLowerCase().includes(q.toLowerCase())));
  const counts: Partial<Record<AType, number>> = { All: entries.length };
  ATYPES.slice(1).forEach(k => { counts[k] = entries.filter(a => typeOf(a) === k).length; });
  const signers = STAFF.map(p => [p.name, entries.filter(a => a.who === p.name && /approved|issued|Submitted|comments/i.test(a.action)).length, p.color] as [string, number, string]).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]);
  const aiCount = entries.filter(a => isAI(a.who)).length;
  const cols: Col<AuditEntry>[] = [
    { key: "w", label: "When", width: ".8fr", render: a => <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--dim)" }}>{fmtDate(a.when)} {a.when.slice(11)}</span> },
    { key: "r", label: "Report", width: "1.5fr", render: a => <span className="gg-click" style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); onOpen(a.reportId); }}>{REPORTS.find(r => r.id === a.reportId)?.title || a.reportId}</span> },
    { key: "a", label: "Action", width: "2fr", render: a => <span style={{ whiteSpace: "normal", lineHeight: 1.45 }}>{a.action}</span> },
    { key: "v", label: "Version", width: ".55fr", render: a => <span style={{ color: "var(--dim)" }}>{a.version}</span> },
    { key: "by", label: "By", width: "1.3fr", render: a => <Who name={a.who} /> },
    { key: "e", label: "Evidence", width: "1fr", render: a => a.evidence ? <RecordChip id={a.evidence} label={a.evidence} /> : <span style={{ color: "var(--faint)" }}>None</span> }
  ];
  return (
    <>
      <PageHead title="Audit trail" sub="Every version, review and approval, with the responsible consultant and the evidence behind it. AI entries are marked and are advisory only."
        right={<Search value={q} onChange={setQ} placeholder="Search actions, people, reports" width={260} />} />
      <div style={{ marginBottom: 12 }}><Seg options={ATYPES} value={t} onChange={setT} counts={counts} /></div>
      <Grid cols="minmax(0,1fr) 290px">
        <Card flush><Table cols={cols} rows={rows} rowKey={a => a.id} onRow={a => onOpen(a.reportId)} empty="No entries match" /></Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Sign-off record" sub="Human submissions, reviews and approvals">
            <HBars data={signers} format={n => String(n)} />
          </Card>
          <Card title="AI involvement">
            <div style={{ fontSize: 26, fontWeight: 600 }}>{aiCount}</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6, lineHeight: 1.55 }}>AI entries: completeness checks, overdue flags and draft summaries. None approve a conclusion or issue a report.</div>
          </Card>
          <Card title="Retention">
            <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.6 }}>Entries are append-only in this demo. Each one keeps the version, the person and the evidence file it relied on.</div>
          </Card>
        </div>
      </Grid>
    </>
  );
}

/* ── module ────────────────────────────────────────────────────────────────── */
export default function Reports({ tab }: { tab: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [cert, setCert] = useState<string | null>(null);
  useFocus(["Report", "Certification"], id => (/^CERT-/.test(id) ? setCert(id) : setOpen(id)));
  let body: ReactNode;
  if (tab === "Report Pipeline") body = <Pipeline onOpen={setOpen} />;
  else if (tab === "Deliverables") body = <Deliverables onOpen={setOpen} />;
  else if (tab === "Certifications") body = <Certifications onCert={setCert} />;
  else if (tab === "Audit Trail") body = <AuditTrail onOpen={setOpen} />;
  else body = <Overview onOpen={setOpen} onCert={setCert} />;
  return (
    <Page>
      {body}
      <ReportDrawer id={open} onClose={() => setOpen(null)} />
      <CertDrawer id={cert} onClose={() => setCert(null)} />
    </Page>
  );
}
