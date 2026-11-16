/* Site Assessments: fieldwork for energy audits and environmental assessments.
   Visits, evidence and findings come from src/gg/data.ts; checklist ticks,
   inspection status and finding review steps are local demo state only. */
import { useState, type ReactNode } from "react";
import {
  SITE_VISITS, EVIDENCE, FINDINGS, MEETINGS, REPORTS, TASK_STATUSES,
  project, client, contact, staff, fmtDate, fmtDay, daysUntil, eur, sum, TODAY,
  type SiteVisit, type VisitStatus, type Evidence, type Finding, type TaskStatus
} from "../data";
import {
  useGG, evidenceStatus, requestEvidence, simulateUpload, allTasks, taskStatusOf, setTaskStatus, addTask, openRecord, toast, logEvent, type GGState
} from "../store";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Seg, Search, Table, Drawer, Section, Kv, RecordChip, AIBox, Timeline,
  HBars, Donut, Legend, Meter, Avatar, Person, Empty, useFocus, MONO_LABEL, TONE, type Col, type Tone
} from "../ui";
import { ApprovalDrawer } from "./ApprovalsPanel";
import {
  VISIT_LABEL, VISIT_TONE, EV_LABEL, EV_TONE, FINDING_LABEL, FINDING_TONE, SEV_TONE,
  addDays, dow, dayNum, dueLabel, Select, Row, Box, type EvStatus
} from "./projects/kit";

/* ── local data ────────────────────────────────────────────────────────────── */
/* Environmental findings from the solar and wind assessments (no energy savings). */
const ENV_FINDINGS: Finding[] = [
  {id:"F-252-1", projectId:"GG-252", title:"Drainage ditch within 10 m of proposed array rows 12 to 15", area:"Hydrology", severity:"medium", kwh:0, eur:0, capex:0, co2:0, status:"draft",
   recommendation:"Hold a 15 m buffer either side of the ditch and confirm against the hydrology desk study at Thursday's walkover."},
  {id:"F-252-2", projectId:"GG-252", title:"Hedgerow removal at site entrance needs seasonal timing", area:"Ecology", severity:"medium", kwh:0, eur:0, capex:0, co2:0, status:"draft",
   recommendation:"Schedule clearance outside the bird breeding season (1 Mar to 31 Aug). Confirm once the breeding bird report is received."},
  {id:"F-255-1", projectId:"GG-255", title:"Grid route crosses a peat section near Roundwood", area:"Soils", severity:"high", kwh:0, eur:0, capex:0, co2:0, status:"engineer_review",
   recommendation:"Re-route about 400 m to the road verge or specify a floating trench design. Confirm on the 20 Nov walkover."}
];
const ALL_FINDINGS = FINDINGS.concat(ENV_FINDINGS);
const isEnv = (f: Finding) => f.eur === 0 && f.kwh === 0 && f.co2 === 0;

/* Checklist items that are satisfied by an evidence document landing. */
const CHECK_EVIDENCE: Record<string, Record<number, string>> = {
  "SV-303": { 3: "EV-241-04", 4: "EV-241-05", 5: "EV-241-06" },
  "SV-304": { 3: "EV-252-04", 4: "EV-252-05" },
  "SV-308": { 0: "EV-244-01" }
};
const VISIT_APPROVAL: Record<string, string> = { "SV-303": "APR-03", "SV-304": "APR-04" };
const VISIT_NOTE: Record<string, string> = {
  "SV-303": "Three meter-data files are still missing. Without them the energy balance cannot be closed on site and the 30 Nov report slips. A request to Peter Lynch is drafted and waiting for Eoin.",
  "SV-304": "The bat activity survey and breeding bird report were due from Tighe Ecology on 13 Nov. The walkover can go ahead, but the assessment pack cannot close until both arrive.",
  "SV-306": "Sarah is the only surveyor assigned and is also needed for the Oakfield follow-up. A second surveyor is needed for the route walkover.",
  "SV-308": "The follow-up depends on read-only BMS access from the client's controls contractor."
};

/* Hours on site, used to draw the calendar. */
function durationOf(v: SiteVisit): number {
  if (/Industrial energy audit/.test(v.type)) return 7.5;
  if (/route walkover/i.test(v.type)) return 7;
  if (/site walkover/i.test(v.type)) return 5;
  if (/Commercial building/.test(v.type)) return 4;
  return 3;
}
const hourOf = (t: string) => { const [h, m] = t.split(":").map(Number); return h + m / 60; };
const DELIVERY_IDS = ["niall", "aoife", "eoin", "sarah", "dara", "ciara", "mark"];
const SITE_MEETINGS = MEETINGS.filter(m => DELIVERY_IDS.indexOf(m.owner) > -1);
function clashFor(meetingOwner: string, date: string): SiteVisit | undefined {
  return SITE_VISITS.find(v => v.date === date && v.status !== "completed" && v.engineers.indexOf(meetingOwner as any) > -1);
}

/* ── derived state ─────────────────────────────────────────────────────────── */
type Local = {
  checks: Record<string, boolean[]>;
  visitOverride: Record<string, VisitStatus>;
  findingOverride: Record<string, Finding["status"]>;
};
const evById = (id: string) => EVIDENCE.find(e => e.id === id) as Evidence;

function checkState(s: GGState, l: Local, v: SiteVisit): boolean[] {
  const base = l.checks[v.id] || v.checklist.map(c => c[1]);
  const links = CHECK_EVIDENCE[v.id] || {};
  return base.map((b, i) => links[i] ? evidenceStatus(s, evById(links[i])) === "received" : b);
}
function readiness(s: GGState, l: Local, v: SiteVisit): number {
  const c = checkState(s, l, v);
  return c.length ? c.filter(Boolean).length / c.length : 1;
}
function visitStatus(s: GGState, l: Local, v: SiteVisit): VisitStatus {
  if (l.visitOverride[v.id]) return l.visitOverride[v.id];
  const links = CHECK_EVIDENCE[v.id];
  if (links && (v.status === "at_risk" || v.status === "evidence_pending")) {
    if (Object.values(links).every(id => evidenceStatus(s, evById(id)) === "received")) return "confirmed";
  }
  return v.status;
}
const findingStatus = (l: Local, f: Finding) => l.findingOverride[f.id] || f.status;
const thisWeek = (v: SiteVisit) => v.date >= "2026-11-16" && v.date <= "2026-11-22";
const sortVisits = (a: SiteVisit, b: SiteVisit) => (a.date + a.time).localeCompare(b.date + b.time);

/* ── shared pieces ─────────────────────────────────────────────────────────── */
function DateBlock({ iso, tone }: { iso: string; tone?: Tone }) {
  return (
    <div style={{ flex: "none", width: 44, height: 46, borderRadius: 12, background: tone ? TONE[tone][1] : "var(--surface-2)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 10, color: tone ? TONE[tone][0] : "var(--faint)" }}>{dow(iso)}</span>
      <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.1 }}>{dayNum(iso)}</span>
    </div>
  );
}
function Engineers({ ids }: { ids: string[] }) {
  return <span style={{ display: "inline-flex" }}>{ids.map((e, i) => <span key={e} style={{ marginLeft: i ? -6 : 0, borderRadius: 999, boxShadow: "0 0 0 2px var(--surface)" }}><Avatar id={e} size={22} /></span>)}</span>;
}

function EvidenceActions({ e }: { e: Evidence }) {
  const s = useGG();
  const st = evidenceStatus(s, e) as EvStatus;
  if (st === "uploading") return <Badge tone="accent">Uploading…</Badge>;
  return (
    <span style={{ display: "inline-flex", gap: 6 }} onClick={ev => ev.stopPropagation()}>
      {st === "missing" && <Btn small onClick={() => requestEvidence([e.id], e.title + " from " + e.from)}>Request</Btn>}
      {(st === "missing" || st === "requested") && <Btn small kind="primary" onClick={() => simulateUpload(e.id)} title="Demo only: simulates the client uploading this file">Simulate upload</Btn>}
    </span>
  );
}

function VisitDetail({ v, l, setL, onApproval, inline }: { v: SiteVisit; l: Local; setL: (f: (l: Local) => Local) => void; onApproval: (id: string) => void; inline?: boolean }) {
  const s = useGG();
  const [note, setNote] = useState("");
  const p = project(v.projectId) || { id: v.projectId, title: "", owner: v.engineers[0], due: v.date, issue: undefined } as any;
  const c = client(v.clientId);
  const ct = c.contact ? contact(c.contact) : undefined;
  const st = visitStatus(s, l, v);
  const checks = checkState(s, l, v);
  const links = CHECK_EVIDENCE[v.id] || {};
  const ev = EVIDENCE.filter(e => e.projectId === v.projectId);
  const fnd = ALL_FINDINGS.filter(f => f.projectId === v.projectId);
  const tasks = allTasks(s).filter(t => (t.record === v.id || t.projectId === v.projectId) && taskStatusOf(s, t) !== "Done");
  const apr = VISIT_APPROVAL[v.id];
  const report = REPORTS.find(r => r.projectId === v.projectId);
  const ready = readiness(s, l, v);
  const toggle = (i: number) => {
    if (links[i]) return;
    setL(x => { const cur = (x.checks[v.id] || v.checklist.map(c2 => c2[1])).slice(); cur[i] = !cur[i]; return { ...x, checks: { ...x.checks, [v.id]: cur } }; });
  };
  const setInspection = (vs: VisitStatus) => {
    setL(x => ({ ...x, visitOverride: { ...x.visitOverride, [v.id]: vs } }));
    logEvent({ source: "Pulse", category: "Site assessments", title: v.id + " marked " + VISIT_LABEL[vs].toLowerCase(), detail: v.site, actor: "Niall Kiernan", record: v.id });
    toast(v.id + " marked " + VISIT_LABEL[vs].toLowerCase() + ". Demo only.");
  };
  const followUp = () => addTask({
    title: "Write up site notes and photos: " + v.site, owner: v.engineers[0], due: addDays(v.date, 2), priority: "Medium",
    status: "Not started", dept: staff(v.engineers[0]).dept, clientId: v.clientId, projectId: v.projectId, record: v.id, source: "Pulse"
  });
  const inspection: [VisitStatus, string][] = [["confirmed", "Scheduled"], ["in_progress", "On site"], ["completed", "Completed"]];
  const inspectionNow = st === "completed" ? "completed" : st === "in_progress" ? "in_progress" : "confirmed";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {inline && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <DateBlock iso={v.date} tone={VISIT_TONE[st]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={MONO_LABEL}>{v.id} · {v.type}</span>
              <Badge tone={VISIT_TONE[st]} dot>{VISIT_LABEL[st]}</Badge>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.3px", marginTop: 5 }}>{v.site}</div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3 }}>{fmtDay(v.date)} · {v.time} · {v.address}</div>
          </div>
        </div>
      )}
      {(VISIT_NOTE[v.id] && st !== "confirmed" && st !== "completed") ? (
        <AIBox tone={VISIT_TONE[st] === "bad" ? "bad" : "warn"} title={st === "conflict" ? "Needs a second surveyor" : "Not ready yet"}
          actions={<>
            {apr && <Btn small kind="primary" onClick={() => onApproval(apr)}>{s.approvals[apr] ? "View request (" + s.approvals[apr] + ")" : "Review drafted request"}</Btn>}
            {v.id === "SV-306" && <Btn small onClick={() => openRecord("T-113")}>Open task T-113</Btn>}
            {v.id === "SV-306" && <Btn small onClick={() => { logEvent({ source: "Pulse", category: "Site assessments", title: "Second surveyor proposed for SV-306", detail: "Mark Reilly suggested for Fri 20 Nov. Draft for Aoife's approval.", actor: "Niall Kiernan", record: "SV-306" }); toast("Proposed Mark Reilly as second surveyor. Waiting for Aoife."); }}>Propose Mark as second surveyor</Btn>}
          </>}>{VISIT_NOTE[v.id]}</AIBox>
      ) : st === "confirmed" && CHECK_EVIDENCE[v.id] ? (
        <AIBox tone="ok" title="Evidence complete. This visit is ready to go ahead.">All documents linked to the preparation checklist have been received.</AIBox>
      ) : null}
      <Kv cols={inline ? 3 : 2} items={[
        ["When", fmtDay(v.date) + ", " + v.time], ["Assessment", v.type], ["Client", c.name],
        ["Site contact (mock)", ct ? ct.name + ", " + ct.title : "Facilities, on arrival"], ["Phone (mock)", ct ? ct.phone : "On file"], ["Project", v.projectId + " · due " + fmtDate(p.due)]
      ]} />
      <Section label="Site briefing">
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--body)" }}>{v.brief}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>{v.engineers.map(e => <Person key={e} id={e} sub />)}</div>
      </Section>
      <Section label={"Preparation checklist · " + checks.filter(Boolean).length + " of " + checks.length}
        right={<span style={{ width: 120 }}><Meter value={ready * 100} tone={ready === 1 ? "ok" : ready > .7 ? "warn" : "bad"} /></span>}>
        <Box>{v.checklist.map(([label], i) => {
          const done = checks[i], linked = links[i];
          return (
            <Row key={i} last={i === v.checklist.length - 1} onClick={linked ? undefined : () => toggle(i)}>
              <span style={{ width: 18, height: 18, flex: "none", borderRadius: 6, border: "1.5px solid " + (done ? "var(--ok)" : "var(--border-strong)"), background: done ? "var(--ok)" : "none", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: done ? "var(--dim)" : "var(--ink)" }}>{label}</span>
              {linked && <Badge tone={EV_TONE[evidenceStatus(s, evById(linked)) as EvStatus]}>{EV_LABEL[evidenceStatus(s, evById(linked)) as EvStatus]}</Badge>}
              {linked && <EvidenceActions e={evById(linked)} />}
            </Row>
          );
        })}</Box>
        {Object.keys(links).length > 0 && <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>Items linked to documents tick themselves when the file is received.</div>}
      </Section>
      <Section label="Inspection status">
        <Seg options={inspection.map(x => x[1])} value={inspection.find(x => x[0] === inspectionNow)![1]} onChange={lab => setInspection(inspection.find(x => x[1] === lab)![0])} />
      </Section>
      {ev.length > 0 && (
        <Section label={"Project evidence · " + ev.filter(e => evidenceStatus(s, e) === "received").length + " of " + ev.length + " received"}>
          <Box>{ev.map((e, i) => {
            const es = evidenceStatus(s, e) as EvStatus;
            return (
              <Row key={e.id} last={i === ev.length - 1}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                <Badge tone={EV_TONE[es]}>{EV_LABEL[es]}</Badge>
                <EvidenceActions e={e} />
              </Row>
            );
          })}</Box>
        </Section>
      )}
      <Section label="Site notes">
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Observations, meter readings, photo references (demo, not saved)"
          style={{ width: "100%", padding: "11px 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", outline: 0, resize: "vertical", fontSize: 12.5, lineHeight: 1.55, color: "var(--ink)", fontFamily: "inherit" }} />
      </Section>
      <Section label={"Follow-up actions · " + tasks.length} right={<Btn small onClick={followUp}>Add write-up task</Btn>}>
        {tasks.length ? <Box>{tasks.map((t, i) => (
          <Row key={t.id} last={i === tasks.length - 1}>
            <Avatar id={t.owner} size={22} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.4 }}>{t.title}<span style={{ color: "var(--faint)" }}> · {fmtDate(t.due)}</span></span>
            <Select value={taskStatusOf(s, t)} onChange={x => setTaskStatus(t.id, x as TaskStatus)} options={TASK_STATUSES.map(x => [x, x] as [string, string])} />
          </Row>
        ))}</Box> : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No open follow-ups.</div>}
      </Section>
      <Section label="Connected records">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <RecordChip id={v.projectId} />
          {report && <RecordChip id={report.id} label={report.id + " · " + report.stage} />}
          {fnd.slice(0, 4).map(f => <RecordChip key={f.id} id={f.id} label={f.title} />)}
          <RecordChip id={v.clientId} />
        </div>
      </Section>
    </div>
  );
}

/* ── Overview ──────────────────────────────────────────────────────────────── */
function Overview({ l, openVisit, openApproval }: { l: Local; openVisit: (id: string) => void; openApproval: (id: string) => void }) {
  const s = useGG();
  const week = SITE_VISITS.filter(thisWeek).sort(sortVisits);
  const needPrep = week.filter(v => readiness(s, l, v) < 1 && visitStatus(s, l, v) !== "completed" && visitStatus(s, l, v) !== "in_progress");
  const missing = EVIDENCE.filter(e => evidenceStatus(s, e) === "missing");
  const completed = SITE_VISITS.filter(v => visitStatus(s, l, v) === "completed").sort(sortVisits).reverse();
  const toReview = ALL_FINDINGS.filter(f => findingStatus(l, f) !== "accepted");
  const statusCount = (vs: VisitStatus) => week.filter(v => visitStatus(s, l, v) === vs).length;
  const readyN = statusCount("confirmed") + statusCount("in_progress");
  const missingByProject = Array.from(new Set(EVIDENCE.map(e => e.projectId))).map(pid => [pid + " " + client(project(pid).clientId).name, EVIDENCE.filter(e => e.projectId === pid && evidenceStatus(s, e) === "missing").length, "var(--bad)"] as [string, number, string])
    .filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const storyMissing = ["EV-241-04", "EV-241-05", "EV-241-06", "EV-252-04", "EV-252-05"].filter(id => evidenceStatus(s, evById(id)) === "missing");
  return (
    <>
      <PageHead title="Site assessments" sub="Energy audits and environmental site assessments this week, how ready each visit is, and the evidence still outstanding." />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Assessments this week" value={week.length} hint="16 to 20 Nov" big />
        <Stat label="Need preparation" value={needPrep.length} tone={needPrep.length ? "warn" : "ok"} hint="Checklist incomplete" big />
        <Stat label="Missing evidence" value={missing.length} tone={missing.length ? "bad" : "ok"} hint={missingByProject.length + " projects affected"} big />
        <Stat label="Completed this month" value={completed.length} hint="November assessments" big />
        <Stat label="Findings to review" value={toReview.length} tone="info" hint="Engineer or client review" big />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox title="Two assessments this week are not ready: Glenmere Foods on Wednesday and Oakfield Solar on Thursday."
          actions={<>
            <Btn small kind="primary" onClick={() => openApproval("APR-03")}>{s.approvals["APR-03"] ? "Glenmere request " + s.approvals["APR-03"] : "Review Glenmere meter-data request"}</Btn>
            <Btn small kind="primary" onClick={() => openApproval("APR-04")}>{s.approvals["APR-04"] ? "Oakfield request " + s.approvals["APR-04"] : "Review Oakfield ecology request"}</Btn>
            {storyMissing.length > 0 && <Btn small onClick={() => requestEvidence(storyMissing, storyMissing.length + " documents for SV-303 and SV-304")}>Draft both requests now</Btn>}
            <Btn small onClick={() => openVisit("SV-303")}>Open SV-303</Btn>
          </>}>
          Glenmere (SV-303) is missing three meter-data files, so the energy balance cannot be closed on site. Oakfield (SV-304) is waiting on the bat activity survey and breeding bird report from Tighe Ecology, due 13 Nov.
        </AIBox>
      </div>
      <Grid cols="minmax(0,1.6fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="This week's assessments" sub="Click a visit for the site briefing, checklist and evidence">
          {week.map(v => {
            const st = visitStatus(s, l, v), r = readiness(s, l, v);
            return (
              <div key={v.id} className="gg-row" onClick={() => openVisit(v.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                <DateBlock iso={v.date} tone={VISIT_TONE[st]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.site}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{v.time} · {v.type} · {v.projectId}</div>
                </div>
                <Engineers ids={v.engineers} />
                <div style={{ width: 92, flex: "none" }}>
                  <div style={{ fontSize: 10.5, color: "var(--faint)", marginBottom: 4 }}>Ready {Math.round(r * 100)}%</div>
                  <Meter value={r * 100} tone={r === 1 ? "ok" : r > .7 ? "warn" : "bad"} height={5} />
                </div>
                <span style={{ width: 128, flex: "none", display: "flex", justifyContent: "flex-end" }}><Badge tone={VISIT_TONE[st]} dot>{VISIT_LABEL[st]}</Badge></span>
              </div>
            );
          })}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Readiness this week">
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Donut size={120} thickness={15} center={readyN + "/" + week.length} sub="ready" parts={[
                ["Ready", readyN, "var(--ok)"],
                ["Not ready", statusCount("at_risk") + statusCount("evidence_pending"), "var(--warn)"],
                ["Conflict", statusCount("conflict"), "var(--bad)"]]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Legend items={[
                  ["Ready or on site", readyN, "var(--ok)"],
                  ["Evidence or data missing", statusCount("at_risk") + statusCount("evidence_pending"), "var(--warn)"],
                  ["Resource conflict", statusCount("conflict"), "var(--bad)"]]} />
              </div>
            </div>
          </Card>
          <Card title="Missing evidence by project" right={<Btn small kind="quiet" onClick={() => openRecord(missing[0]?.id || "EV-241-04")}>Evidence register</Btn>}>
            {missingByProject.length ? <HBars data={missingByProject} format={n => n + " missing"} /> : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Everything requested has been received.</div>}
          </Card>
          <Card title="Recently completed">
            <Timeline items={completed.slice(0, 4).map(v => ({
              when: fmtDate(v.date), title: v.site, tone: "ok" as Tone,
              detail: v.type + " · " + ALL_FINDINGS.filter(f => f.projectId === v.projectId).length + " findings logged"
            }))} />
          </Card>
        </div>
      </Grid>
    </>
  );
}

/* ── Schedule ──────────────────────────────────────────────────────────────── */
const H0 = 8, H1 = 18, PX = 46;
function Schedule({ l, openVisit }: { l: Local; openVisit: (id: string) => void }) {
  const s = useGG();
  const [start, setStart] = useState("2026-11-16");
  const [who, setWho] = useState("all");
  const days = [0, 1, 2, 3, 4].map(i => addDays(start, i));
  const visits = SITE_VISITS.filter(v => days.indexOf(v.date) > -1 && (who === "all" || v.engineers.indexOf(who as any) > -1));
  const meetings = SITE_MEETINGS.filter(m => days.indexOf(m.when) > -1 && (who === "all" || m.owner === who));
  type Ev = { kind: "visit" | "meeting"; id: string; from: number; to: number; v?: SiteVisit; m?: typeof MEETINGS[number]; lane: number; lanes: number };
  const columns = days.map(d => {
    const vEvs: Ev[] = visits.filter(v => v.date === d).map(v => ({ kind: "visit", id: v.id, from: hourOf(v.time), to: Math.min(H1, hourOf(v.time) + durationOf(v)), v, lane: 0, lanes: 1 }));
    const mEvs: Ev[] = meetings.filter(m => m.when === d).map(m => ({ kind: "meeting", id: m.id, from: hourOf(m.time), to: hourOf(m.time) + 1, m, lane: 0, lanes: 1 }));
    const evs = vEvs.concat(mEvs).sort((a, b) => a.from - b.from);
    const ends: number[] = [];
    evs.forEach(e => { let k = ends.findIndex(x => x <= e.from); if (k < 0) { k = ends.length; ends.push(0); } ends[k] = e.to; e.lane = k; });
    evs.forEach(e => { e.lanes = Math.max(1, ends.length); });
    return { d, evs };
  });
  const clashes = meetings.filter(m => clashFor(m.owner, m.when));
  const weekVisits = visits.slice().sort(sortVisits);
  const engineers = Array.from(new Set(weekVisits.flatMap(v => v.engineers)));
  return (
    <>
      <PageHead title="Assessment schedule" sub="Site assessments by day with the engineers assigned. Calendar meetings for the same people are shown so clashes are visible."
        right={<>
          <Select label="Engineer" value={who} onChange={setWho} options={[["all", "Everyone"]].concat(DELIVERY_IDS.map(id => [id, staff(id).name])) as [string, string][]} />
          <Seg options={["16 to 20 Nov", "23 to 27 Nov"]} value={start === "2026-11-16" ? "16 to 20 Nov" : "23 to 27 Nov"} onChange={x => setStart(x === "16 to 20 Nov" ? "2026-11-16" : "2026-11-23")} />
        </>} />
      {clashes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <AIBox tone="bad" title={clashes.map(m => staff(m.owner).name + " has a " + m.time + " meeting (" + m.title + ", " + m.org + ") during the " + clashFor(m.owner, m.when)!.site + " assessment on " + fmtDay(m.when) + ".").join(" ")}
            actions={<Btn small onClick={() => openVisit(clashFor(clashes[0].owner, clashes[0].when)!.id)}>Open the visit</Btn>}>
            Suggest moving the meeting to Thu 19 Nov 09:00, or let Mark lead the Portlaoise workshop. Nothing is changed in anyone's calendar from here.
          </AIBox>
        </div>
      )}
      <Card flush>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px repeat(5,minmax(150px,1fr))", minWidth: 820 }}>
            <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-faint)" }} />
            {days.map(d => (
              <div key={d} style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", background: d === TODAY ? "var(--accent-faint)" : "var(--surface-faint)" }}>
                <div style={{ fontSize: 11, color: d === TODAY ? "var(--accent)" : "var(--faint)" }}>{dow(d)}{d === TODAY ? " · Today" : ""}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate(d)}</div>
              </div>
            ))}
            <div style={{ position: "relative", height: (H1 - H0) * PX }}>
              {Array.from({ length: H1 - H0 }, (_, i) => <div key={i} style={{ position: "absolute", top: i * PX + 4, right: 8, fontSize: 10.5, color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{String(H0 + i).padStart(2, "0")}:00</div>)}
            </div>
            {columns.map(col => (
              <div key={col.d} style={{ position: "relative", height: (H1 - H0) * PX, borderLeft: "1px solid var(--border)", backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "100% " + PX + "px" }}>
                {col.evs.map(e => {
                  const top = (e.from - H0) * PX + 2, h = Math.max(30, (e.to - e.from) * PX - 4);
                  const w = 100 / e.lanes, left = e.lane * w;
                  if (e.kind === "visit" && e.v) {
                    const st = visitStatus(s, l, e.v), t = VISIT_TONE[st];
                    return (
                      <div key={e.id} className="gg-click" onClick={() => openVisit(e.id)} title={e.v.site}
                        style={{ position: "absolute", top, height: h, left: "calc(" + left + "% + 4px)", width: "calc(" + w + "% - 8px)", padding: "7px 9px", borderRadius: 10, cursor: "pointer", overflow: "hidden",
                          background: TONE[t === "neutral" ? "info" : t][1], border: "1px solid color-mix(in srgb, " + TONE[t === "neutral" ? "info" : t][0] + " 40%, transparent)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10.5, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{e.v.time}</span>
                          <span style={{ flex: 1 }} /><Engineers ids={e.v.engineers} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{client(e.v.clientId).name}</div>
                        <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, lineHeight: 1.3 }}>{e.v.type}</div>
                        {h > 110 && <div style={{ marginTop: 7 }}><Badge tone={t} dot>{VISIT_LABEL[st]}</Badge></div>}
                      </div>
                    );
                  }
                  const clash = e.m ? clashFor(e.m.owner, e.m.when) : undefined;
                  return (
                    <div key={e.id} title={e.m?.title + " with " + e.m?.with}
                      style={{ position: "absolute", top, height: h, left: "calc(" + left + "% + 4px)", width: "calc(" + w + "% - 8px)", padding: "6px 8px", borderRadius: 10, overflow: "hidden",
                        background: clash ? "var(--bad-soft)" : "var(--surface-2)", border: "1px dashed " + (clash ? "var(--bad)" : "var(--border-strong)") }}>
                      <div style={{ fontSize: 10.5, color: clash ? "var(--bad)" : "var(--faint)" }}>{e.m?.time} · {clash ? "Clash" : "Meeting"}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 500, marginTop: 2, lineHeight: 1.25 }}>{e.m?.org}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Grid cols="minmax(0,1.4fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title={"Visits in this view · " + weekVisits.length}>
          {weekVisits.map(v => {
            const st = visitStatus(s, l, v);
            return (
              <div key={v.id} className="gg-row" onClick={() => openVisit(v.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                <span style={{ width: 92, fontSize: 12, color: "var(--dim)", flex: "none" }}>{fmtDay(v.date).slice(0, 3)} {dayNum(v.date)} · {v.time}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.site}</span>
                <Engineers ids={v.engineers} />
                <span style={{ width: 132, display: "flex", justifyContent: "flex-end" }}><Badge tone={VISIT_TONE[st]} dot>{VISIT_LABEL[st]}</Badge></span>
              </div>
            );
          })}
          {weekVisits.length === 0 && <Empty title="No site assessments in this view" sub="Try another engineer or week." />}
        </Card>
        <Card title="Days on site per engineer" sub="Planned site time in this view">
          {engineers.length ? <HBars max={3} format={n => n.toFixed(1) + " days"} data={engineers.map(e => [staff(e).name, Math.round(sum(weekVisits.filter(v => v.engineers.indexOf(e) > -1).map(v => durationOf(v) / 7.5)) * 10) / 10, staff(e).color] as [string, number, string]).sort((a, b) => b[1] - a[1])} />
            : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Nobody on site in this view.</div>}
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 12 }}>Durations are typical for each assessment type: a full industrial energy audit is a day on site, a commercial building walk-through about half a day.</div>
        </Card>
      </Grid>
    </>
  );
}

/* ── Site visits (list and detail) ─────────────────────────────────────────── */
function SiteVisits({ l, setL, openApproval, selected, setSelected }: { l: Local; setL: (f: (l: Local) => Local) => void; openApproval: (id: string) => void; selected: string; setSelected: (id: string) => void }) {
  const s = useGG();
  const [view, setView] = useState("This week");
  const rows = SITE_VISITS.filter(v => {
    const st = visitStatus(s, l, v);
    if (view === "This week") return thisWeek(v);
    if (view === "Upcoming") return st !== "completed" && v.date >= TODAY;
    if (view === "Completed") return st === "completed";
    return true;
  }).sort(sortVisits);
  const v = SITE_VISITS.find(x => x.id === selected) || rows[0];
  return (
    <>
      <PageHead title="Site visits" sub="Each visit's briefing, client contact, preparation checklist, inspection status, evidence and follow-ups." />
      <Grid cols="minmax(0,1fr) minmax(0,1.45fr)">
        <Card flush title="Visits" right={<Seg options={["This week", "Upcoming", "Completed", "All"]} value={view} onChange={setView} />}>
          {rows.map(x => {
            const st = visitStatus(s, l, x), r = readiness(s, l, x), on = v && x.id === v.id;
            return (
              <div key={x.id} className="gg-row" onClick={() => setSelected(x.id)} style={{ display: "flex", gap: 11, alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border)", cursor: "pointer", background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
                <DateBlock iso={x.date} tone={VISIT_TONE[st]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client(x.clientId).name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.time} · {x.type}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <Badge tone={VISIT_TONE[st]} dot style={{ height: 19, fontSize: 10.5 }}>{VISIT_LABEL[st]}</Badge>
                    <span style={{ flex: 1, maxWidth: 80 }}><Meter value={r * 100} tone={r === 1 ? "ok" : r > .7 ? "warn" : "bad"} height={4} /></span>
                  </div>
                </div>
                <Engineers ids={x.engineers} />
              </div>
            );
          })}
          {rows.length === 0 && <Empty title="No visits here" />}
        </Card>
        <Card>
          {v ? <VisitDetail key={v.id} v={v} l={l} setL={setL} onApproval={openApproval} inline /> : <Empty title="Pick a visit" />}
        </Card>
      </Grid>
    </>
  );
}

/* ── Evidence ──────────────────────────────────────────────────────────────── */
function EvidenceTab({ highlight, openEvidence, openApproval }: { highlight: string | null; openEvidence: (id: string) => void; openApproval: (id: string) => void }) {
  const s = useGG();
  const [status, setStatus] = useState("All");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const st = (e: Evidence) => evidenceStatus(s, e) as EvStatus;
  const counts: Record<string, number> = {
    All: EVIDENCE.length, Missing: EVIDENCE.filter(e => st(e) === "missing").length, Requested: EVIDENCE.filter(e => st(e) === "requested").length,
    "In review": EVIDENCE.filter(e => st(e) === "in_review").length, Received: EVIDENCE.filter(e => st(e) === "received").length
  };
  const want: Record<string, EvStatus[]> = { All: [], Missing: ["missing"], Requested: ["requested", "uploading"], "In review": ["in_review"], Received: ["received"] };
  const rows = EVIDENCE.filter(e => (status === "All" || want[status].indexOf(st(e)) > -1) && (kind === "all" || e.kind === kind)
    && (!q || (e.title + " " + e.from + " " + e.projectId + " " + client(project(e.projectId).clientId).name).toLowerCase().indexOf(q.toLowerCase()) > -1));
  const groups = Array.from(new Set(rows.map(e => e.projectId))).map(pid => ({
    pid, items: rows.filter(e => e.projectId === pid),
    missing: EVIDENCE.filter(e => e.projectId === pid && st(e) === "missing")
  })).sort((a, b) => b.missing.length - a.missing.length || a.pid.localeCompare(b.pid));
  const allMissing = EVIDENCE.filter(e => st(e) === "missing");
  const blockedReports = REPORTS.filter(r => r.stage !== "Delivered" && EVIDENCE.some(e => e.projectId === r.projectId && st(e) === "missing"));
  const kinds = Array.from(new Set(EVIDENCE.map(e => e.kind)));
  return (
    <>
      <PageHead title="Evidence register" sub="Meter data, bills, drawings, surveys and photos for every assessment. Missing items are flagged against the report they hold up." />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Documents tracked" value={EVIDENCE.length} />
        <Stat label="Received" value={counts.Received} tone="ok" />
        <Stat label="Missing" value={counts.Missing} tone={counts.Missing ? "bad" : "ok"} hint={blockedReports.length + " reports held up"} />
        <Stat label="Requested" value={counts.Requested} tone="warn" hint="Waiting on client or partner" />
        <Stat label="In review" value={counts["In review"]} tone="info" />
      </Grid>
      <div style={{ marginTop: 14 }}>
        {allMissing.length > 0 ? (
          <AIBox tone="warn" title={allMissing.length + " missing documents are holding up " + blockedReports.length + " reports: " + blockedReports.map(r => r.projectId).join(", ") + "."}
            actions={<>
              <Btn small kind="primary" onClick={() => requestEvidence(allMissing.map(e => e.id), allMissing.length + " missing documents")}>Draft requests for all missing</Btn>
              <Btn small onClick={() => openApproval("APR-03")}>Glenmere request (APR-03)</Btn>
              <Btn small onClick={() => openApproval("APR-04")}>Oakfield request (APR-04)</Btn>
            </>}>
            Glenmere needs three meter-data files before Wednesday, Oakfield two ecology reports before Thursday, and Carrick two consumption datasets to unblock its ISO 50001 baseline. Requests are drafts until a person approves them.
          </AIBox>
        ) : <AIBox tone="ok" title="Nothing is missing. Every requested document has been received or is in review." />}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "14px 0 12px" }}>
        <Seg options={["All", "Missing", "Requested", "In review", "Received"]} value={status} onChange={setStatus} counts={counts} />
        <Select label="Type" value={kind} onChange={setKind} options={[["all", "All types"]].concat(kinds.map(k => [k, k])) as [string, string][]} />
        <span style={{ flex: 1 }} />
        <Search value={q} onChange={setQ} placeholder="Search documents, clients or projects" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map(g => {
          const p = project(g.pid);
          const rep = REPORTS.find(r => r.projectId === g.pid);
          return (
            <Card key={g.pid} flush>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", flexWrap: "wrap", background: g.missing.length ? "linear-gradient(90deg, var(--bad-soft), transparent 60%)" : undefined }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{g.pid}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{client(p.clientId).name}</span>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{p.title}</span>
                <span style={{ flex: 1 }} />
                {rep && <RecordChip id={rep.id} label={rep.id + " due " + fmtDate(rep.due)} />}
                {g.missing.length > 0 && <Badge tone="bad" dot>{g.missing.length} missing</Badge>}
                {g.missing.length > 0 && <Btn small onClick={() => requestEvidence(g.missing.map(e => e.id), g.missing.length + " documents for " + g.pid)}>Request missing</Btn>}
              </div>
              {g.items.map(e => {
                const es = st(e), on = highlight === e.id;
                return (
                  <div key={e.id} className="gg-row" onClick={() => openEvidence(e.id)}
                    style={{ display: "grid", gridTemplateColumns: "minmax(0,2.2fr) minmax(0,.9fr) minmax(0,1.1fr) minmax(0,1.3fr) auto auto", gap: 12, alignItems: "center", padding: "10px 18px", borderTop: "1px solid var(--border)", cursor: "pointer", background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
                    <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                    <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{e.kind}</span>
                    <span style={{ fontSize: 11.5, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.from}</span>
                    <span style={{ fontSize: 11.5, color: es === "missing" ? "var(--bad)" : "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.date ? fmtDate(e.date) + (e.size ? " · " + e.size : "") : e.note || "Not received"}</span>
                    <Badge tone={EV_TONE[es]} dot>{EV_LABEL[es]}</Badge>
                    <span style={{ minWidth: 120, display: "flex", justifyContent: "flex-end" }}><EvidenceActions e={e} /></span>
                  </div>
                );
              })}
            </Card>
          );
        })}
        {groups.length === 0 && <Card><Empty title="No documents match" sub="Try another status or type." /></Card>}
      </div>
    </>
  );
}

function EvidenceDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useGG();
  const e = id ? EVIDENCE.find(x => x.id === id) : undefined;
  if (!e) return null;
  const es = evidenceStatus(s, e) as EvStatus;
  const p = project(e.projectId);
  const rep = REPORTS.find(r => r.projectId === e.projectId);
  const visit = SITE_VISITS.find(v => v.projectId === e.projectId && v.status !== "completed");
  return (
    <Drawer open onClose={onClose} eyebrow={"EVIDENCE · " + e.id} badge={<Badge tone={EV_TONE[es]} dot>{EV_LABEL[es]}</Badge>} title={e.title}
      footer={<><span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Requests are drafts until approved. Uploads here are simulated.</span><EvidenceActions e={e} /></>}>
      {es === "missing" && <AIBox tone="bad" title={"Missing, and it holds up " + (rep ? rep.id : p.id) + "."}>{e.note || "Not yet received from " + e.from + "."}</AIBox>}
      {es === "received" && <AIBox tone="ok" title="Received and indexed, so Pulse can reference it in report drafts.">Pulse cites this document by ID wherever it uses it, so reviewers can check the source.</AIBox>}
      <Kv items={[
        ["Project", p.id + " · " + client(p.clientId).name], ["Type", e.kind], ["Provided by", e.from],
        ["Received", e.date ? fmtDate(e.date) : "Not yet"], ["Size", e.size || "-"], ["Owner", staff(p.owner).name]
      ]} />
      {e.note && <Section label="Notes"><div style={{ fontSize: 13, color: "var(--body)" }}>{e.note}</div></Section>}
      <Section label="Used by">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <RecordChip id={p.id} />
          {rep && <RecordChip id={rep.id} label={rep.id + " · " + rep.stage} />}
          {visit && <RecordChip id={visit.id} label={visit.id + " · " + fmtDate(visit.date)} />}
        </div>
      </Section>
    </Drawer>
  );
}

/* ── Findings ──────────────────────────────────────────────────────────────── */
const payback = (f: Finding) => f.eur > 0 ? f.capex / f.eur : 0;
const fmtPayback = (f: Finding) => {
  if (!f.eur) return "-";
  const y = payback(f);
  return y < 1 ? Math.max(1, Math.round(y * 12)) + " mo" : y.toFixed(1) + " yrs";
};
function Findings({ l, openFinding }: { l: Local; openFinding: (id: string) => void }) {
  const [type, setType] = useState("All");
  const [sev, setSev] = useState("All");
  const [status, setStatus] = useState("all");
  const rows = ALL_FINDINGS.filter(f => (type === "All" || (type === "Environmental" ? isEnv(f) : !isEnv(f)))
    && (sev === "All" || f.severity === sev.toLowerCase()) && (status === "all" || findingStatus(l, f) === status))
    .sort((a, b) => b.eur - a.eur);
  const energy = ALL_FINDINGS.filter(f => !isEnv(f));
  const totEur = sum(energy.map(f => f.eur)), totKwh = sum(energy.map(f => f.kwh)), totCo2 = sum(energy.map(f => f.co2)), totCapex = sum(energy.map(f => f.capex));
  const awaitingEng = energy.filter(f => findingStatus(l, f) === "engineer_review");
  const byArea = Array.from(new Set(energy.map(f => f.area))).map(a => [a, sum(energy.filter(f => f.area === a).map(f => f.eur)), "var(--gg-green)"] as [string, number, string]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const statuses: Finding["status"][] = ["draft", "engineer_review", "client_review", "accepted"];
  const cols: Col<Finding>[] = [
    { key: "t", label: "Finding", width: "2.4fr", render: f => <div style={{ minWidth: 0 }}><div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</div><div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{f.projectId} · {client(project(f.projectId)?.clientId || "westhaven").name}</div></div> },
    { key: "a", label: "Area", width: ".95fr", render: f => <span style={{ color: "var(--dim)" }}>{f.area}</span> },
    { key: "s", label: "Severity", width: ".8fr", render: f => <Badge tone={SEV_TONE[f.severity]}>{f.severity}</Badge> },
    { key: "e", label: "€ / year", width: ".85fr", align: "right", render: f => f.eur ? eur(f.eur) : <span style={{ color: "var(--faint)" }}>{isEnv(f) ? "Env." : "-"}</span> },
    { key: "k", label: "MWh / yr", width: ".75fr", align: "right", render: f => f.kwh ? (f.kwh / 1000).toFixed(0) : "-" },
    { key: "c", label: "tCO₂e", width: ".65fr", align: "right", render: f => f.co2 ? f.co2.toFixed(1) : "-" },
    { key: "x", label: "Capex", width: ".8fr", align: "right", render: f => f.capex ? eur(f.capex) : "-" },
    { key: "p", label: "Payback", width: ".75fr", align: "right", render: f => fmtPayback(f) },
    { key: "st", label: "Review", width: "1.05fr", render: f => <Badge tone={FINDING_TONE[findingStatus(l, f)]} dot>{FINDING_LABEL[findingStatus(l, f)]}</Badge> }
  ];
  return (
    <>
      <PageHead title="Findings" sub="Observations from energy audits and environmental site assessments, with estimated savings and where each one sits in review." />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Identified savings" value={eur(totEur)} tone="ok" hint="per year, energy findings" />
        <Stat label="Energy saved" value={(totKwh / 1000).toFixed(0) + " MWh"} hint="per year" />
        <Stat label="Carbon avoided" value={totCo2.toFixed(0) + " tCO₂e"} hint="per year" />
        <Stat label="Capital required" value={eur(totCapex)} hint={"Blended payback " + (totCapex / totEur).toFixed(1) + " yrs"} />
        <Stat label="Environmental findings" value={ALL_FINDINGS.filter(isEnv).length} tone="info" hint="Solar and wind assessments" />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox title={awaitingEng.length + " energy findings worth " + eur(sum(awaitingEng.map(f => f.eur))) + " a year are waiting on engineer review before they can reach clients."}
          actions={<Btn small kind="primary" onClick={() => { setStatus("engineer_review"); setType("All"); setSev("All"); }}>Show findings awaiting review</Btn>}>
          Savings, capex and payback are engineering estimates drafted from site data. Pulse does not approve engineering conclusions; each finding needs a Global Green engineer's sign-off before it goes into a report.
        </AIBox>
      </div>
      <Grid cols="minmax(0,2.3fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="All findings" right={<>
          <Seg options={["All", "Energy", "Environmental"]} value={type} onChange={setType} />
          <Select label="Severity" value={sev} onChange={setSev} options={[["All", "All"], ["High", "High"], ["Medium", "Medium"], ["Low", "Low"]]} />
          <Select label="Review" value={status} onChange={setStatus} options={[["all", "Any"]].concat(statuses.map(x => [x, FINDING_LABEL[x]])) as [string, string][]} />
        </>}>
          <Table cols={cols} rows={rows} rowKey={f => f.id} onRow={f => openFinding(f.id)} empty="No findings match" />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Savings by area" sub="Estimated € per year">
            <HBars data={byArea} format={n => eur(n)} />
          </Card>
          <Card title="Review pipeline">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut size={112} thickness={14} center={ALL_FINDINGS.length} sub="findings" parts={statuses.map(x => [FINDING_LABEL[x], ALL_FINDINGS.filter(f => findingStatus(l, f) === x).length, TONE[FINDING_TONE[x]][0]] as [string, number, string])} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Legend items={statuses.map(x => [FINDING_LABEL[x], ALL_FINDINGS.filter(f => findingStatus(l, f) === x).length, TONE[FINDING_TONE[x]][0]] as [string, ReactNode, string])} />
              </div>
            </div>
          </Card>
        </div>
      </Grid>
    </>
  );
}

function FindingDrawer({ id, l, setL, onClose }: { id: string | null; l: Local; setL: (f: (l: Local) => Local) => void; onClose: () => void }) {
  const f = id ? ALL_FINDINGS.find(x => x.id === id) : undefined;
  if (!f) return null;
  const p = project(f.projectId);
  const c = client(p ? p.clientId : "westhaven");
  const st = findingStatus(l, f);
  const move = (next: Finding["status"], msg: string) => {
    setL(x => ({ ...x, findingOverride: { ...x.findingOverride, [f.id]: next } }));
    logEvent({ source: "Pulse", category: "Site assessments", title: "Finding " + f.id + " moved to " + FINDING_LABEL[next].toLowerCase(), detail: f.title, actor: "Niall Kiernan", record: f.projectId });
    toast(msg);
  };
  return (
    <Drawer open onClose={onClose} eyebrow={"FINDING · " + f.id} badge={<Badge tone={FINDING_TONE[st]} dot>{FINDING_LABEL[st]}</Badge>} title={f.title}
      footer={<>
        <span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Review steps are recorded in this demo only. Nothing is shared with the client from here.</span>
        {st === "draft" && <Btn kind="primary" onClick={() => move("engineer_review", "Sent for engineer review.")}>Send for engineer review</Btn>}
        {st === "engineer_review" && <Btn kind="primary" onClick={() => move("client_review", "Engineer sign-off recorded. Ready for client review.")}>Record engineer sign-off</Btn>}
        {st === "client_review" && <Btn kind="primary" onClick={() => move("accepted", "Marked accepted by the client (demo).")}>Mark client accepted</Btn>}
      </>}>
      <Kv cols={3} items={isEnv(f) ? [
        ["Client", c.name], ["Project", f.projectId], ["Area", f.area], ["Severity", f.severity], ["Type", "Environmental"], ["Owner", p ? staff(p.owner).name : "-"]
      ] : [
        ["Client", c.name], ["Area", f.area], ["Severity", f.severity],
        ["Saving / yr", eur(f.eur)], ["Energy / yr", (f.kwh / 1000).toFixed(0) + " MWh"], ["Carbon / yr", f.co2.toFixed(1) + " tCO₂e"],
        ["Capex", f.capex ? eur(f.capex) : "None"], ["Simple payback", fmtPayback(f)], ["Owner", p ? staff(p.owner).name : "Eoin Gallagher"]
      ]} />
      <Section label="Recommendation"><div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{f.recommendation}</div></Section>
      <AIBox tone="info" title={isEnv(f) ? "Environmental observation, pending specialist inputs" : "Engineering estimate, subject to review"}>
        {isEnv(f) ? "Pulse logged this from the desk study and walkover notes. Final conclusions are made by the consultant once all survey inputs are in." : "Figures are drafted from site data and logger exports. A Global Green engineer must confirm them before they appear in the energy action plan or audit report."}
      </AIBox>
      <Section label="Connected records">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <RecordChip id={f.projectId} />
          {REPORTS.filter(r => r.projectId === f.projectId).map(r => <RecordChip key={r.id} id={r.id} label={r.id + " · " + r.stage} />)}
          {SITE_VISITS.filter(v => v.projectId === f.projectId).slice(0, 2).map(v => <RecordChip key={v.id} id={v.id} label={v.id + " · " + fmtDate(v.date)} />)}
        </div>
      </Section>
    </Drawer>
  );
}

/* ── module root ───────────────────────────────────────────────────────────── */
export default function Sites({ tab }: { tab: string }) {
  const [l, setLState] = useState<Local>({ checks: {}, visitOverride: {}, findingOverride: {} });
  const setL = (f: (x: Local) => Local) => setLState(prev => f(prev));
  const [visitId, setVisitId] = useState<string | null>(null);
  const [findingId, setFindingId] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [apr, setApr] = useState<string | null>(null);
  const [selected, setSelected] = useState("SV-303");
  useFocus(["Site visit", "Evidence", "Finding"], id => {
    if (/^SV-/.test(id)) { if (tab === "Site Visits") setSelected(id); else setVisitId(id); }
    else if (/^EV-/.test(id)) { setHighlight(id); setEvidenceId(id); }
    else if (/^F-/.test(id)) setFindingId(id);
  });
  const openVisit = (id: string) => setVisitId(id);
  let body: ReactNode;
  switch (tab) {
    case "Schedule": body = <Schedule l={l} openVisit={openVisit} />; break;
    case "Site Visits": body = <SiteVisits l={l} setL={setL} openApproval={setApr} selected={selected} setSelected={setSelected} />; break;
    case "Evidence": body = <EvidenceTab highlight={highlight} openEvidence={id => { setHighlight(id); setEvidenceId(id); }} openApproval={setApr} />; break;
    case "Findings": body = <Findings l={l} openFinding={setFindingId} />; break;
    default: body = <Overview l={l} openVisit={openVisit} openApproval={setApr} />;
  }
  const v = visitId ? SITE_VISITS.find(x => x.id === visitId) : undefined;
  return (
    <Page>
      {body}
      {v && (
        <Drawer open onClose={() => setVisitId(null)} width={640} eyebrow={"SITE VISIT · " + v.id + " · " + v.type.toUpperCase()}
          badge={<VisitBadge v={v} l={l} />} title={v.site}
          footer={<>
            <span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>{fmtDay(v.date)} · {v.time} · {dueLabel(daysUntil(v.date))}</span>
            <Btn onClick={() => openRecord(v.projectId)}>Open project</Btn>
          </>}>
          <VisitDetail v={v} l={l} setL={setL} onApproval={setApr} />
        </Drawer>
      )}
      <EvidenceDrawer id={evidenceId} onClose={() => setEvidenceId(null)} />
      <FindingDrawer id={findingId} l={l} setL={setL} onClose={() => setFindingId(null)} />
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </Page>
  );
}
function VisitBadge({ v, l }: { v: SiteVisit; l: Local }) {
  const s = useGG();
  const st = visitStatus(s, l, v);
  return <Badge tone={VISIT_TONE[st]} dot>{VISIT_LABEL[st]}</Badge>;
}
