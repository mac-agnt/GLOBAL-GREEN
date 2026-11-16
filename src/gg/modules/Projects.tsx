/* Projects: consultancy delivery across the 18 active engagements.
   Every figure is derived from src/gg/data.ts; the weekly resource plan below is
   a local, illustrative Monday.com-style plan consistent with those projects. */
import { PLAN, type Alloc } from "../plan";
import { useMemo, useState, type ReactNode } from "react";
import {
  PROJECTS, MILESTONES, STAFF, SITE_VISITS, EVIDENCE, REPORTS, INVOICES, APPROVALS, MEETINGS, SERVICES, TASK_STATUSES,
  project, client, contact, staff, fmtDate, fmtDay, daysUntil, eur, eurK, sum, COST_RATE,
  type Project, type ProjectStatus, type StaffId, type TaskStatus, type Milestone
} from "../data";
import { useGG, allTasks, taskStatusOf, setTaskStatus, evidenceStatus, openRecord, navigate, toast, logEvent } from "../store";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Seg, Search, Table, Drawer, Section, Kv, RecordChip, AIBox, Timeline,
  HBars, Donut, Legend, Stack, Meter, Avatar, Person, SimTag, useFocus, MONO_LABEL, TONE, type Col, type Tone
} from "../ui";
import { ApprovalDrawer } from "./ApprovalsPanel";
import {
  PROJECT_LABEL, PROJECT_TONE, VISIT_LABEL, VISIT_TONE, EV_LABEL, EV_TONE, SERVICE_COLOR, SERVICE_GROUPS,
  addDays, dueLabel, projectFin, Select, Row, Box, fmtH, pct
} from "./projects/kit";

/* ── local constants ───────────────────────────────────────────────────────── */
const FOCUS_IDS = ["GG-241", "GG-236"];
const ATTENTION_ORDER = ["GG-241", "GG-236", "GG-252", "GG-244", "GG-249", "GG-238"];

const RECOMMEND: Record<string, string> = {
  "GG-241": "Send the meter-data request today so Wednesday's visit can close the energy balance on site. The 30 Nov report stays achievable if the files land by Tuesday.",
  "GG-236": "Escalate to Declan Farrell, Operations Director. Facilities has been asked twice in 31 days and two milestones cannot start without the data.",
  "GG-252": "Chase Tighe Ecology for both reports before Thursday's walkover so the assessment pack can close by 2 Dec.",
  "GG-244": "Ask the client to instruct their controls contractor to grant read-only BMS access this week.",
  "GG-249": "Move Bréifne data review support to Ciara on 23 Nov to bring Dara back under full allocation.",
  "GG-238": "Agree a short scope note on Scope 3 category 1 data with Hannah Burke before more hours go in."
};

const WEEKS = [
  { n: 47, start: "2026-11-16", label: "Wk 47 · 16 Nov" },
  { n: 48, start: "2026-11-23", label: "Wk 48 · 23 Nov" },
  { n: 49, start: "2026-11-30", label: "Wk 49 · 30 Nov" },
  { n: 50, start: "2026-12-07", label: "Wk 50 · 7 Dec" }
];

const DELIVERY = STAFF.filter(s => s.capacity > 0);

function planFor(week: number, who: StaffId, aprApproved: boolean): Alloc {
  const base = (PLAN[week][who] || []).map(a => [a[0], a[1]] as [string, number]);
  if (week === 48 && aprApproved) {
    /* APR-09 approved: Bréifne data review support moves from Dara to Ciara on 23 Nov. */
    if (who === "dara") return base.map(a => a[0] === "GG-249" ? [a[0], a[1] - .75] as [string, number] : a);
    if (who === "ciara") return base.map(a => a[0] === "GG-249" ? [a[0], a[1] + .75] as [string, number] : a);
  }
  return base;
}
const daysOf = (a: Alloc) => sum(a.map(x => x[1]));
const utilTone = (u: number): Tone => u > 1.05 ? "bad" : u > .95 ? "warn" : u < .6 ? "info" : "ok";

/* ── shared bits ───────────────────────────────────────────────────────────── */
function StatusBadge({ p }: { p: Project }) {
  return <Badge tone={PROJECT_TONE[p.status]} dot>{PROJECT_LABEL[p.status]}</Badge>;
}
function ProjName({ p, sub = true }: { p: Project; sub?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)", flex: "none" }}>{p.id}</span>
        <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client(p.clientId).name}</span>
        {FOCUS_IDS.indexOf(p.id) > -1 && <Badge tone="accent" style={{ height: 18, fontSize: 10 }}>Needs you</Badge>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>}
    </div>
  );
}

function ProjectDrawer({ id, onClose, onApproval }: { id: string | null; onClose: () => void; onApproval: (id: string) => void }) {
  const s = useGG();
  const p = id ? project(id) : undefined;
  if (!p) return null;
  const c = client(p.clientId);
  const ct = c.contact ? contact(c.contact) : undefined;
  const ms = MILESTONES.filter(m => m.projectId === p.id).sort((a, b) => a.planned.localeCompare(b.planned));
  const ev = EVIDENCE.filter(e => e.projectId === p.id);
  const tasks = allTasks(s).filter(t => t.projectId === p.id);
  const visits = SITE_VISITS.filter(v => v.projectId === p.id);
  const reports = REPORTS.filter(r => r.projectId === p.id);
  const invs = INVOICES.filter(i => i.projectId === p.id);
  const aprs = APPROVALS.filter(a => a.record === p.id && !s.approvals[a.id]);
  const f = projectFin(p);
  const msTone: Record<Milestone["status"], Tone> = { done: "ok", in_progress: "info", upcoming: "neutral", late: "warn", blocked: "bad" };
  return (
    <Drawer open onClose={onClose} width={620} eyebrow={"PROJECT · " + p.id} badge={<StatusBadge p={p} />}
      title={c.name + ": " + p.title}
      footer={<>
        <span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Synced from Monday.com (simulated). Changes here stay in this demo.</span>
        <Btn onClick={() => openRecord(p.clientId)}>Client relationships</Btn>
        {visits[0] && <Btn onClick={() => openRecord(visits.filter(v => v.status !== "completed")[0]?.id || visits[0].id)}>Site visit</Btn>}
      </>}>
      <AIBox tone={p.status === "on_track" ? "ok" : p.status === "blocked" ? "bad" : "warn"}
        title={p.issue || "On track. Next: " + p.nextMilestone + " on " + fmtDay(p.nextDate) + "."}
        actions={aprs.length ? aprs.map(a => <Btn key={a.id} small kind="primary" onClick={() => onApproval(a.id)}>Review: {a.kind.toLowerCase()}</Btn>) : undefined}>
        {p.dependency && <div><b style={{ color: "var(--body)", fontWeight: 500 }}>Waiting on:</b> {p.dependency}</div>}
        {RECOMMEND[p.id] && <div style={{ marginTop: 4 }}>{RECOMMEND[p.id]}</div>}
      </AIBox>
      <Kv cols={3} items={[
        ["Client", c.name], ["Contact (mock)", ct ? ct.name + ", " + ct.title : "On file"], ["Service", p.service],
        ["Fee", eur(p.value) + " · " + p.feeType], ["Start", fmtDate(p.start)], ["Due", fmtDate(p.due) + " (" + dueLabel(daysUntil(p.due)) + ")"],
        ["Hours", fmtH(p.hoursSpent) + " of " + fmtH(p.budgetHours)], ["Progress", p.progress + "%"], ["Forecast margin", pct(f.marginPct)]
      ]} />
      <Section label="Team">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {p.team.map(t => <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Person id={t} />{t === p.owner && <Badge tone="accent" style={{ height: 18, fontSize: 10 }}>Owner</Badge>}</span>)}
        </div>
      </Section>
      {ms.length > 0 && (
        <Section label="Milestones">
          <Timeline items={ms.map(m => ({
            when: m.done ? "Done " + fmtDate(m.done) : fmtDate(m.planned), title: m.title, tone: msTone[m.status],
            detail: m.dependsOn ? "Depends on: " + m.dependsOn : staff(m.owner).name,
            right: <Badge tone={msTone[m.status]}>{m.status.replace("_", " ")}</Badge>
          }))} />
        </Section>
      )}
      {ev.length > 0 && (
        <Section label={"Evidence · " + ev.filter(e => evidenceStatus(s, e) === "received").length + " of " + ev.length + " received"}>
          <Box>{ev.map((e, i) => {
            const st = evidenceStatus(s, e);
            return (
              <Row key={e.id} last={i === ev.length - 1} onClick={() => openRecord(e.id)}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                <span style={{ fontSize: 11, color: "var(--faint)" }}>{e.from}</span>
                <Badge tone={EV_TONE[st]}>{EV_LABEL[st]}</Badge>
              </Row>
            );
          })}</Box>
        </Section>
      )}
      <Section label={"Tasks · " + tasks.length}>
        {tasks.length ? <Box>{tasks.map((t, i) => (
          <Row key={t.id} last={i === tasks.length - 1}>
            <Avatar id={t.owner} size={22} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.4 }}>{t.title}<span style={{ color: "var(--faint)" }}> · due {fmtDate(t.due)}</span></span>
            <Select value={taskStatusOf(s, t)} onChange={v => setTaskStatus(t.id, v as TaskStatus)} options={TASK_STATUSES.map(x => [x, x] as [string, string])} />
          </Row>
        ))}</Box> : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No open tasks on this project.</div>}
      </Section>
      {(visits.length > 0 || reports.length > 0 || invs.length > 0) && (
        <Section label="Connected records">
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {visits.map(v => <RecordChip key={v.id} id={v.id} label={v.id + " · " + fmtDate(v.date) + " · " + VISIT_LABEL[v.status]} />)}
            {reports.map(r => <RecordChip key={r.id} id={r.id} label={r.id + " · " + r.stage} />)}
            {invs.map(i => <RecordChip key={i.id} id={i.id} label={i.id + " · " + eur(i.amount) + " · " + i.status} />)}
          </div>
        </Section>
      )}
    </Drawer>
  );
}

/* ── Overview ──────────────────────────────────────────────────────────────── */
type CalItem = { date: string; kind: string; label: string; projectId: string; tone: Tone; id: string };
function calendarItems(): CalItem[] {
  const end = "2026-12-06";
  const items: CalItem[] = [];
  MILESTONES.filter(m => !m.done && m.planned >= "2026-11-16" && m.planned <= end).forEach(m => items.push({
    date: m.planned, kind: "Milestone", label: m.title, projectId: m.projectId, id: m.id,
    tone: m.status === "blocked" ? "bad" : m.status === "late" ? "warn" : "neutral"
  }));
  SITE_VISITS.filter(v => v.status !== "completed" && v.date >= "2026-11-16" && v.date <= end).forEach(v => items.push({
    date: v.date, kind: "Site visit", label: v.type, projectId: v.projectId, id: v.id, tone: VISIT_TONE[v.status] === "neutral" ? "info" : VISIT_TONE[v.status]
  }));
  REPORTS.filter(r => r.stage !== "Delivered" && r.due >= "2026-11-16" && r.due <= end).forEach(r => items.push({
    date: r.due, kind: "Report due", label: r.type, projectId: r.projectId, id: r.id, tone: r.missing > 0 ? "warn" : "ok"
  }));
  /* milestones and site visits on the same project and day are the same event */
  const seen = new Set<string>();
  return items.filter(i => { const k = i.projectId + i.date + (i.kind === "Report due" ? "r" : "v"); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function Overview({ openProject, openApproval, setStatusFilter }: { openProject: (id: string) => void; openApproval: (id: string) => void; setStatusFilter: (s: string) => void }) {
  const s = useGG();
  const count = (st: ProjectStatus) => PROJECTS.filter(p => p.status === st).length;
  const attention = ATTENTION_ORDER.map(id => project(id)).filter(p => p && p.status !== "on_track");
  const totalValue = sum(PROJECTS.map(p => p.value));
  const spent = sum(PROJECTS.map(p => p.hoursSpent)), budget = sum(PROJECTS.map(p => p.budgetHours));
  const earned = sum(PROJECTS.map(p => projectFin(p).earned));
  const ids = new Set(PROJECTS.map(p => p.id));
  const invoiced = sum(INVOICES.filter(i => i.projectId && ids.has(i.projectId)).map(i => i.amount));
  const cost = sum(PROJECTS.map(p => projectFin(p).cost));
  const cal = calendarItems();
  const weeks = [
    { label: "This week", sub: "16 to 22 Nov", from: "2026-11-16", to: "2026-11-22" },
    { label: "Next week", sub: "23 to 29 Nov", from: "2026-11-23", to: "2026-11-29" },
    { label: "Week after", sub: "30 Nov to 6 Dec", from: "2026-11-30", to: "2026-12-06" }
  ];
  const go = (st: string) => { setStatusFilter(st); navigate("Projects", "Active Projects"); };
  const apr03 = s.approvals["APR-03"], apr06 = s.approvals["APR-06"];
  return (
    <>
      <PageHead title="Projects" sub="18 active engagements across energy, environmental, ISO and carbon work. Risks are detected automatically from milestones, evidence and resourcing."
        right={<SimTag>Monday.com · simulated sync</SimTag>} />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Active projects" value={PROJECTS.length} hint={eur(totalValue) + " in fees"} onClick={() => go("All")} big />
        <Stat label="On track" value={count("on_track")} tone="ok" hint="No action needed" onClick={() => go("On track")} big />
        <Stat label="At risk" value={count("at_risk")} tone="warn" hint="Evidence, scope or capacity" onClick={() => go("At risk")} big />
        <Stat label="Blocked" value={count("blocked")} tone="bad" hint="Waiting on client data" onClick={() => go("Blocked")} big />
        <Stat label="Due in next 3 weeks" value={PROJECTS.filter(p => daysUntil(p.due) <= 21).length} hint="Reports and handovers" big />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox title="Two projects need a decision from you this week: Glenmere Foods (GG-241) and Carrick Logistics (GG-236)."
          actions={<>
            <Btn small kind="primary" onClick={() => openApproval("APR-03")}>{apr03 ? "Glenmere request " + apr03 : "Review Glenmere data request"}</Btn>
            <Btn small kind="primary" onClick={() => openApproval("APR-06")}>{apr06 ? "Carrick escalation " + apr06 : "Review Carrick escalation"}</Btn>
            <Btn small onClick={() => openProject("GG-241")}>Open GG-241</Btn>
            <Btn small onClick={() => openProject("GG-236")}>Open GG-236</Btn>
          </>}>
          Glenmere's site assessment is on Wednesday and three meter-data files are still missing, which puts the 30 Nov report at risk. Carrick's ISO 50001 baseline has been blocked for 31 days on consumption data; facilities has been asked twice, so an escalation to the Operations Director is drafted and waiting for approval.
        </AIBox>
      </div>
      <Grid cols="minmax(0,1.55fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Needs attention" sub="At-risk and blocked projects, what they are waiting on, and the next step." right={<Badge tone="warn">{attention.length} projects</Badge>}>
          {attention.map((p, i) => (
            <div key={p.id} className="gg-row" onClick={() => openProject(p.id)} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, padding: "13px 18px", borderTop: i ? "1px solid var(--border)" : "1px solid var(--border)", cursor: "pointer" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <StatusBadge p={p} />
                  <ProjName p={p} sub={false} />
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--body)" }}>{p.issue}</div>
                {p.dependency && <div style={{ fontSize: 11.5, marginTop: 3, color: "var(--faint)" }}>Waiting on: {p.dependency}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flex: "none" }}>
                <Person id={p.owner} />
                <span style={{ fontSize: 11.5, color: daysUntil(p.due) < 15 ? "var(--warn)" : "var(--dim)" }}>Due {fmtDate(p.due)} · {dueLabel(daysUntil(p.due))}</span>
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{eur(p.value)}</span>
              </div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Delivery health" sub="All 18 active projects">
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Donut size={132} thickness={16} center={count("on_track") + "/" + PROJECTS.length} sub="on track" parts={[
                ["On track", count("on_track"), "var(--ok)"], ["At risk", count("at_risk"), "var(--warn)"], ["Blocked", count("blocked"), "var(--bad)"]]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Legend items={[
                  ["On track", count("on_track"), "var(--ok)"], ["At risk", count("at_risk"), "var(--warn)"], ["Blocked", count("blocked"), "var(--bad)"]]} />
              </div>
            </div>
          </Card>
          <Card title="Financial health" sub="Fees, effort and earned value on active work">
            <Kv items={[
              ["Fee value", eur(totalValue)], ["Earned to date", eur(Math.round(earned))],
              ["Invoiced to date", eur(invoiced)], ["Forecast margin", pct((totalValue - cost) / totalValue)]
            ]} />
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", fontSize: 12, marginBottom: 6 }}>
                <span style={{ flex: 1, color: "var(--dim)" }}>Hours used</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{spent.toLocaleString()} of {budget.toLocaleString()}h · {pct(spent / budget)}</span>
              </div>
              <Meter value={(spent / budget) * 100} tone="info" height={8} />
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 7 }}>Average progress {pct(earned / totalValue)} of fee value, so effort is tracking close to plan overall.</div>
            </div>
          </Card>
        </div>
      </Grid>
      <Card title="Delivery calendar" sub="Milestones, site visits and report deadlines over the next three weeks" style={{ marginTop: 14 }}>
        <Grid cols="repeat(3,minmax(0,1fr))" gap={12}>
          {weeks.map(w => {
            const its = cal.filter(c => c.date >= w.from && c.date <= w.to);
            return (
              <div key={w.label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", padding: "12px 12px 6px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{w.label}</span>
                  <span style={{ fontSize: 11.5, color: "var(--faint)", flex: 1 }}>{w.sub}</span>
                  <Badge>{its.length}</Badge>
                </div>
                {its.map(it => (
                  <div key={it.kind + it.id} className="gg-row" onClick={() => it.kind === "Milestone" || it.kind === "Report due" ? openProject(it.projectId) : openRecord(it.id)}
                    style={{ display: "flex", gap: 10, padding: "8px 6px", borderTop: "1px solid var(--border)", cursor: "pointer", borderRadius: 8 }}>
                    <div style={{ flex: "none", width: 38, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--faint)" }}>{fmtDay(it.date).slice(0, 3)}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.1 }}>{fmtDate(it.date).split(" ")[0]}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: TONE[it.tone][0], flex: "none" }} />
                        <span style={{ ...MONO_LABEL, fontSize: 9, letterSpacing: ".08em" }}>{it.kind}</span>
                      </div>
                      <div style={{ fontSize: 12.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client(project(it.projectId).clientId).name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</div>
                    </div>
                  </div>
                ))}
                {its.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "10px 0" }}>Nothing scheduled.</div>}
              </div>
            );
          })}
        </Grid>
      </Card>
    </>
  );
}

/* ── Active projects ───────────────────────────────────────────────────────── */
function ActiveProjects({ openProject, selected, statusFilter, setStatusFilter }: { openProject: (id: string) => void; selected: string | null; statusFilter: string; setStatusFilter: (s: string) => void }) {
  const [q, setQ] = useState("");
  const [service, setService] = useState("all");
  const [owner, setOwner] = useState("all");
  const map: Record<string, ProjectStatus | null> = { "All": null, "On track": "on_track", "At risk": "at_risk", "Blocked": "blocked" };
  const rows = PROJECTS.filter(p => {
    const st = map[statusFilter];
    if (st && p.status !== st) return false;
    if (service !== "all" && p.service !== service) return false;
    if (owner !== "all" && p.team.indexOf(owner as StaffId) < 0) return false;
    if (q) {
      const hay = (p.id + " " + p.title + " " + client(p.clientId).name + " " + p.service + " " + staff(p.owner).name).toLowerCase();
      if (hay.indexOf(q.toLowerCase()) < 0) return false;
    }
    return true;
  }).sort((a, b) => {
    const rank = (p: Project) => (p.status === "blocked" ? 0 : p.status === "at_risk" ? 1 : 2);
    return rank(a) - rank(b) || a.due.localeCompare(b.due);
  });
  const cols: Col<Project>[] = [
    { key: "p", label: "Project", width: "2.3fr", render: p => <ProjName p={p} /> },
    { key: "svc", label: "Service", width: "1.25fr", render: p => <span style={{ color: "var(--dim)" }}>{p.service}</span> },
    { key: "own", label: "Owner", width: "1.3fr", render: p => <Person id={p.owner} /> },
    { key: "val", label: "Fee", width: ".75fr", align: "right", render: p => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(p.value)}</span> },
    { key: "due", label: "Due", width: ".95fr", render: p => <div><div>{fmtDate(p.due)}</div><div style={{ fontSize: 11, color: daysUntil(p.due) < 15 ? "var(--warn)" : "var(--faint)" }}>{dueLabel(daysUntil(p.due))}</div></div> },
    { key: "prog", label: "Progress", width: "1.1fr", render: p => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><Meter value={p.progress} tone={PROJECT_TONE[p.status]} /></div><span style={{ fontSize: 11.5, width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.progress}%</span></div> },
    { key: "h", label: "Health", width: ".95fr", render: p => <span title={p.issue || "On track"}><StatusBadge p={p} /></span> },
    { key: "next", label: "Next milestone", width: "1.6fr", render: p => <div><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nextMilestone}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>{fmtDay(p.nextDate)}</div></div> }
  ];
  const counts: Record<string, number> = { "All": PROJECTS.length };
  (["on_track", "at_risk", "blocked"] as ProjectStatus[]).forEach(st => { counts[PROJECT_LABEL[st]] = PROJECTS.filter(p => p.status === st).length; });
  return (
    <>
      <PageHead title="Active projects" sub="Every engagement with its owner, fee, deadline and delivery health. Click a row for milestones, evidence, tasks and linked records." right={<SimTag>Monday.com · simulated sync</SimTag>} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <Seg options={["All", "On track", "At risk", "Blocked"]} value={statusFilter} onChange={setStatusFilter} counts={counts} />
        <Select label="Service" value={service} onChange={setService} options={[["all", "All services"]].concat(SERVICES.filter(sv => PROJECTS.some(p => p.service === sv)).map(sv => [sv, sv])) as [string, string][]} />
        <Select label="Person" value={owner} onChange={setOwner} options={[["all", "Anyone"]].concat(DELIVERY.map(x => [x.id, x.name])) as [string, string][]} />
        <span style={{ flex: 1 }} />
        <Search value={q} onChange={setQ} placeholder="Search client, project or ID" />
      </div>
      <Card flush>
        <Table cols={cols} rows={rows} onRow={p => openProject(p.id)} rowKey={p => p.id} selected={selected || undefined} empty="No projects match these filters" />
        <div style={{ display: "flex", gap: 16, padding: "11px 18px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)", fontSize: 12, color: "var(--dim)", flexWrap: "wrap" }}>
          <span>{rows.length} of {PROJECTS.length} projects</span>
          <span>{eur(sum(rows.map(r => r.value)))} in fees</span>
          <span>{sum(rows.map(r => r.hoursSpent)).toLocaleString()} of {sum(rows.map(r => r.budgetHours)).toLocaleString()} budget hours used</span>
        </div>
      </Card>
    </>
  );
}

/* ── Milestones ────────────────────────────────────────────────────────────── */
const MS_TONE: Record<Milestone["status"], Tone> = { done: "ok", in_progress: "info", upcoming: "neutral", late: "warn", blocked: "bad" };
const MS_LABEL: Record<Milestone["status"], string> = { done: "Done", in_progress: "In progress", upcoming: "Upcoming", late: "Late", blocked: "Blocked" };

function Chain({ p }: { p: Project }) {
  const ms = MILESTONES.filter(m => m.projectId === p.id).sort((a, b) => a.planned.localeCompare(b.planned));
  const nodes: { title: string; sub: string; tone: Tone }[] = [];
  if (p.dependency) nodes.push({ title: "Client input", sub: p.dependency, tone: "bad" });
  ms.forEach(m => nodes.push({ title: m.title, sub: (m.done ? "Done " + fmtDate(m.done) : fmtDate(m.planned)) + " · " + staff(m.owner).first, tone: MS_TONE[m.status] }));
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <StatusBadge p={p} /><ProjName p={p} sub={false} />
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
            <div style={{ width: 168, padding: "9px 11px", borderRadius: 12, background: TONE[n.tone][1], border: "1px solid color-mix(in srgb, " + TONE[n.tone][0] + " 30%, transparent)" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: n.tone === "neutral" ? "var(--ink)" : TONE[n.tone][0], lineHeight: 1.3 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 3, lineHeight: 1.35 }}>{n.sub}</div>
            </div>
            {i < nodes.length - 1 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14 M13 6l6 6-6 6" /></svg>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Milestones({ openProject, openApproval }: { openProject: (id: string) => void; openApproval: (id: string) => void }) {
  const s = useGG();
  const [filter, setFilter] = useState("Open");
  const [escalated, setEscalated] = useState<Record<string, boolean>>({});
  const cnt = (st: Milestone["status"]) => MILESTONES.filter(m => m.status === st).length;
  const rows = MILESTONES.filter(m => filter === "All" ? true : filter === "Open" ? m.status !== "done" : filter === "Late or blocked" ? (m.status === "late" || m.status === "blocked") : m.status === "done")
    .sort((a, b) => a.planned.localeCompare(b.planned));
  const problem = MILESTONES.filter(m => m.status === "late" || m.status === "blocked");
  const byProject = Array.from(new Set(MILESTONES.map(m => m.projectId))).map(id => {
    const ms = MILESTONES.filter(m => m.projectId === id);
    return { id, total: ms.length, done: ms.filter(m => m.status === "done").length };
  }).filter(x => x.total > 1);
  const owners = DELIVERY.map(st => [st.name, MILESTONES.filter(m => m.owner === st.id && m.status !== "done").length, st.color] as [string, number, string]).filter(o => o[1] > 0).sort((a, b) => b[1] - a[1]);
  const escalate = (m: Milestone) => {
    if (m.projectId === "GG-236") { openApproval("APR-06"); return; }
    if (m.projectId === "GG-252") { openApproval("APR-04"); return; }
    setEscalated(e => ({ ...e, [m.id]: true }));
    logEvent({ source: "Pulse", category: "Projects", title: "Escalation drafted for " + m.projectId, detail: m.title + " blocked on " + (m.dependsOn || "client input") + ". Draft for Aoife's review, not sent.", actor: "Niall Kiernan", record: m.projectId });
    toast("Escalation drafted for Aoife's review. Not sent.");
  };
  const cols: Col<Milestone>[] = [
    { key: "p", label: "Project", width: "1.6fr", render: m => <ProjName p={project(m.projectId)} sub={false} /> },
    { key: "m", label: "Milestone", width: "1.9fr", render: m => <span>{m.title}</span> },
    { key: "o", label: "Owner", width: "1.3fr", render: m => <Person id={m.owner} /> },
    { key: "pl", label: "Planned", width: ".8fr", render: m => fmtDate(m.planned) },
    { key: "dn", label: "Completed", width: ".9fr", render: m => m.done ? <span>{fmtDate(m.done)}{m.done > m.planned ? <span style={{ color: "var(--warn)" }}> +{daysUntil(m.done) - daysUntil(m.planned)}d</span> : null}</span> : <span style={{ color: daysUntil(m.planned) < 0 ? "var(--warn)" : "var(--faint)" }}>{daysUntil(m.planned) < 0 ? -daysUntil(m.planned) + "d past plan" : "Open"}</span> },
    { key: "s", label: "Status", width: ".95fr", render: m => <Badge tone={MS_TONE[m.status]} dot>{MS_LABEL[m.status]}</Badge> },
    { key: "d", label: "Depends on", width: "1.6fr", render: m => <span style={{ color: m.dependsOn ? "var(--body)" : "var(--faint)" }}>{m.dependsOn || "Nothing external"}</span> }
  ];
  return (
    <>
      <PageHead title="Milestones" sub="Planned against completed work, what each milestone depends on, and where an escalation is needed." />
      <Grid cols="repeat(6,minmax(0,1fr))" gap={12}>
        <Stat label="Tracked milestones" value={MILESTONES.length} />
        <Stat label="Completed" value={cnt("done")} tone="ok" hint={MILESTONES.filter(m => m.done && m.done > m.planned).length + " finished late"} />
        <Stat label="In progress" value={cnt("in_progress")} tone="info" />
        <Stat label="Upcoming" value={cnt("upcoming")} />
        <Stat label="Late" value={cnt("late")} tone="warn" />
        <Stat label="Blocked" value={cnt("blocked")} tone="bad" hint="All on client data" />
      </Grid>
      <Grid cols="minmax(0,1.5fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title="Dependency chains" sub="Where client inputs hold up the next piece of work">
          {["GG-236", "GG-241", "GG-252", "GG-244"].map(id => <Chain key={id} p={project(id)} />)}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card flush title="Late and blocked" sub="Escalations go through a person before anything reaches a client">
            {problem.map(m => {
              const apr = m.projectId === "GG-236" ? "APR-06" : m.projectId === "GG-252" ? "APR-04" : "";
              const decided = apr ? s.approvals[apr] : escalated[m.id] ? "approved" : undefined;
              return (
                <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => openProject(m.projectId)}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Badge tone={MS_TONE[m.status]}>{MS_LABEL[m.status]}</Badge><span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{m.projectId}</span></div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 5 }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{client(project(m.projectId).clientId).name} · waiting on {m.dependsOn}</div>
                  </div>
                  {decided ? <Badge tone={decided === "approved" ? "ok" : "bad"}>{decided === "approved" ? (apr ? "Escalation approved" : "Drafted") : "Rejected"}</Badge>
                    : <Btn small kind={apr ? "primary" : "ghost"} onClick={() => escalate(m)}>{apr ? "Review escalation" : "Draft escalation"}</Btn>}
                </div>
              );
            })}
          </Card>
          <Card title="Planned vs completed" sub="Projects with a multi-step plan">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {byProject.map(b => (
                <div key={b.id} className="gg-row" onClick={() => openProject(b.id)} style={{ cursor: "pointer", borderRadius: 8, padding: "2px 0" }}>
                  <div style={{ display: "flex", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ flex: 1 }}>{client(project(b.id).clientId).name}</span>
                    <span style={{ color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{b.done} of {b.total}</span>
                  </div>
                  <Meter value={(b.done / b.total) * 100} tone={PROJECT_TONE[project(b.id).status]} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Open milestones by owner">
            <HBars data={owners} format={n => n + " open"} />
          </Card>
        </div>
      </Grid>
      <Card flush title="All milestones" style={{ marginTop: 14 }} right={<Seg options={["Open", "Late or blocked", "Completed", "All"]} value={filter} onChange={setFilter} />}>
        <Table cols={cols} rows={rows} rowKey={m => m.id} onRow={m => openProject(m.projectId)} />
      </Card>
    </>
  );
}

/* ── Resources ─────────────────────────────────────────────────────────────── */
function Resources({ openApproval, openProject }: { openApproval: (id: string) => void; openProject: (id: string) => void }) {
  const s = useGG();
  const [week, setWeek] = useState(47);
  const moved = s.approvals["APR-09"] === "approved";
  const wk = WEEKS.find(w => w.n === week)!;
  const util = (who: StaffId, n: number) => daysOf(planFor(n, who, moved)) / staff(who).capacity;
  const rows = DELIVERY.map(st => {
    const a = planFor(week, st.id, moved);
    return {
      label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar id={st.id} size={22} /><span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</span><span style={{ display: "block", fontSize: 10.5, color: "var(--faint)" }}>{st.capacity}d billable</span></span></span>,
      parts: a.filter(x => x[1] > 0).map(x => [x[0] + " " + client(project(x[0]).clientId).name, x[1], SERVICE_COLOR[project(x[0]).service]] as [string, number, string]),
      cap: st.capacity
    };
  });
  const teamCap = sum(DELIVERY.map(d => d.capacity));
  const teamDays = (n: number) => sum(DELIVERY.map(d => daysOf(planFor(n, d.id, moved))));
  const dara47 = util("dara", 47);
  /* conflicts: meetings owned by someone who is on a full-day site visit that day */
  const meetingClashes = MEETINGS.flatMap(m => SITE_VISITS.filter(v => v.date === m.when && v.engineers.indexOf(m.owner) > -1 && v.status !== "completed")
    .map(v => ({ m, v })));
  const [proposed, setProposed] = useState(false);
  return (
    <>
      <PageHead title="Resources" sub="Planned billable days per consultant against capacity, colour-coded by service line. Plan mirrors the Monday.com resourcing board (simulated)."
        right={<Seg options={WEEKS.map(w => w.label)} value={wk.label} onChange={l => setWeek(WEEKS.find(w => w.label === l)!.n)} />} />
      <AIBox tone={moved ? "ok" : "warn"}
        title={moved ? "Approved: Bréifne data review support moves from Dara to Ciara on 23 Nov. Week 48 below reflects the change." : "Dara is at " + pct(dara47) + " in week 47 and " + pct(util("dara", 48)) + " in week 48. Move Bréifne data review support to Ciara on 23 Nov."}
        actions={<>
          <Btn small kind={moved ? "ghost" : "primary"} onClick={() => openApproval("APR-09")}>{moved ? "View approval" : "Review reallocation"}</Btn>
          <Btn small onClick={() => openProject("GG-249")}>Open GG-249 Bréifne</Btn>
        </>}>
        Ciara has around 1.5 days free in week 48 once the Ardmore audit closes. Corrib (GG-238) and Bréifne (GG-249) both peak for Dara in the same fortnight.
      </AIBox>
      <Grid cols="minmax(0,1.6fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title={"Allocation by person · " + wk.label} sub="Bars show planned days; the marker is each person's billable capacity">
          <Stack rows={rows} max={6} unit="d" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            {SERVICE_GROUPS.map(([l, c]) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--dim)" }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c }} />{l}</span>)}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 10 }}>Louise Kelly (sales) and Emma Walsh (accounts) are not on the billable plan.</div>
        </Card>
        <Card flush title="Utilisation, next four weeks" sub="Planned days as a share of billable capacity">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(4,minmax(0,1fr))", fontSize: 12 }}>
            <div style={{ padding: "9px 14px 9px 18px", color: "var(--faint)", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>Person</div>
            {WEEKS.map(w => <div key={w.n} style={{ padding: "9px 6px", textAlign: "center", color: w.n === week ? "var(--ink)" : "var(--faint)", fontWeight: w.n === week ? 600 : 400, background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>Wk {w.n}</div>)}
            {DELIVERY.map(st => (
              <div key={st.id} style={{ display: "contents" }}>
                <div style={{ padding: "8px 14px 8px 18px", display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid var(--border)", minWidth: 0 }}><Avatar id={st.id} size={20} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.first}</span></div>
                {WEEKS.map(w => {
                  const u = util(st.id, w.n), t = utilTone(u);
                  return <div key={w.n} title={daysOf(planFor(w.n, st.id, moved)).toFixed(2) + " of " + st.capacity + " days"} onClick={() => setWeek(w.n)} style={{ margin: 4, borderRadius: 8, padding: "6px 0", textAlign: "center", cursor: "pointer", background: TONE[t][1], color: t === "ok" ? "var(--ink)" : TONE[t][0], fontWeight: 500, fontVariantNumeric: "tabular-nums", outline: w.n === week ? "1px solid var(--border-strong)" : "none" }}>{pct(u)}</div>;
                })}
              </div>
            ))}
            <div style={{ padding: "10px 14px 10px 18px", color: "var(--dim)" }}>Team</div>
            {WEEKS.map(w => <div key={w.n} style={{ padding: "10px 0", textAlign: "center", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pct(teamDays(w.n) / teamCap)}</div>)}
          </div>
          <div style={{ display: "flex", gap: 12, padding: "10px 18px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--faint)", flexWrap: "wrap" }}>
            <span><span style={{ color: "var(--bad)" }}>■</span> Over capacity</span><span><span style={{ color: "var(--warn)" }}>■</span> Full</span><span><span style={{ color: "var(--gg-blue)" }}>■</span> Room for new work</span>
          </div>
        </Card>
      </Grid>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Conflicts this week" sub="Clashes between site visits, meetings and people">
          {meetingClashes.map(({ m, v }) => (
            <div key={m.id + v.id} style={{ padding: "13px 18px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Badge tone="bad" dot>Double booked</Badge><Person id={m.owner} /><span style={{ fontSize: 12, color: "var(--faint)" }}>{fmtDay(m.when)}</span></div>
              <div style={{ fontSize: 12.5, marginTop: 7, lineHeight: 1.5 }}>{v.time} full-day site assessment at {v.site} ({v.id}) overlaps the {m.time} {m.title} with {m.org}.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                <RecordChip id={v.id} /><RecordChip id={v.projectId} />
                {proposed ? <Badge tone="ok">New time proposed (draft)</Badge> : <Btn small onClick={() => { setProposed(true); logEvent({ source: "Pulse", category: "Projects", title: "Proposed moving " + m.title, detail: "Suggested Thu 19 Nov 09:00 with " + m.with + ". Draft only, not sent.", actor: "Niall Kiernan", record: "GG-254" }); toast("Draft reschedule to Thu 19 Nov 09:00 created. Not sent."); }}>Propose Thu 19 Nov 09:00</Btn>}
              </div>
            </div>
          ))}
          {SITE_VISITS.filter(v => v.status === "conflict").map(v => (
            <div key={v.id} style={{ padding: "13px 18px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Badge tone="bad" dot>Unstaffed</Badge><Person id={v.engineers[0]} /><span style={{ fontSize: 12, color: "var(--faint)" }}>{fmtDay(v.date)}</span></div>
              <div style={{ fontSize: 12.5, marginTop: 7, lineHeight: 1.5 }}>{v.site}: {v.brief}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}><RecordChip id={v.id} /><RecordChip id="T-113" /></div>
            </div>
          ))}
          <div style={{ padding: "13px 18px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Badge tone={moved ? "ok" : "warn"} dot>{moved ? "Resolved in plan" : "Over-allocated"}</Badge><Person id="dara" /><span style={{ fontSize: 12, color: "var(--faint)" }}>Weeks 47 and 48</span></div>
            <div style={{ fontSize: 12.5, marginTop: 7, lineHeight: 1.5 }}>Bréifne carbon baseline and Corrib GHG inventory peak together.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 9 }}><RecordChip id="APR-09" /></div>
          </div>
        </Card>
        <Card title="Available capacity" sub={"Billable days left after planned work · " + wk.label}>
          <HBars max={4.5} format={n => n.toFixed(1) + "d free"} data={DELIVERY.map(st => {
            const free = Math.max(0, st.capacity - daysOf(planFor(week, st.id, moved)));
            return [st.name, free, free < .25 ? "var(--bad)" : free < 1 ? "var(--warn)" : "var(--gg-blue)"] as [string, number, string];
          }).sort((a, b) => b[1] - a[1])} />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {WEEKS.map(w => <div key={w.n} style={{ padding: "9px 10px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <div style={{ fontSize: 10.5, color: "var(--faint)" }}>Wk {w.n} team</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{Math.max(0, teamCap - teamDays(w.n)).toFixed(1)}d</div>
              <div style={{ fontSize: 10.5, color: "var(--faint)" }}>free of {teamCap}d</div>
            </div>)}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 12, lineHeight: 1.5 }}>Capacity opens up from 7 Dec as Glenmere, Oakfield and Corrib report. That is the natural start window for Shannon Aviation (L-040) if it is won.</div>
        </Card>
      </Grid>
    </>
  );
}

/* ── Profitability ─────────────────────────────────────────────────────────── */
type SortKey = "Margin %" | "Fee" | "Hours variance" | "Due";
function Profitability({ openProject }: { openProject: (id: string) => void }) {
  const [sort, setSort] = useState<SortKey>("Margin %");
  const [asc, setAsc] = useState(true);
  const data = useMemo(() => PROJECTS.map(p => ({ p, f: projectFin(p) })), []);
  const rows = data.slice().sort((a, b) => {
    const v = sort === "Margin %" ? a.f.marginPct - b.f.marginPct : sort === "Fee" ? a.p.value - b.p.value : sort === "Hours variance" ? a.f.variance - b.f.variance : a.p.due.localeCompare(b.p.due);
    return asc ? v : -v;
  });
  const fee = sum(data.map(d => d.p.value)), cost = sum(data.map(d => d.f.cost));
  const over = data.filter(d => d.f.variance > 0.02);
  const corrib = data.find(d => d.p.id === "GG-238")!;
  const bySvc = Array.from(new Set(PROJECTS.map(p => p.service))).map(sv => {
    const ds = data.filter(d => d.p.service === sv);
    const fv = sum(ds.map(d => d.p.value)), cv = sum(ds.map(d => d.f.cost));
    return [sv + " (" + ds.length + ")", Math.round(((fv - cv) / fv) * 1000) / 10, SERVICE_COLOR[sv]] as [string, number, string];
  }).sort((a, b) => b[1] - a[1]);
  type R = { p: Project; f: ReturnType<typeof projectFin> };
  const cols: Col<R>[] = [
    { key: "p", label: "Project", width: "2.1fr", render: r => <ProjName p={r.p} /> },
    { key: "fee", label: "Fee", width: ".8fr", align: "right", render: r => eur(r.p.value) },
    { key: "bh", label: "Budget h", width: ".7fr", align: "right", render: r => fmtH(r.p.budgetHours) },
    { key: "sh", label: "Spent h", width: ".7fr", align: "right", render: r => fmtH(r.p.hoursSpent) },
    { key: "pr", label: "Progress", width: ".7fr", align: "right", render: r => r.p.progress + "%" },
    { key: "fh", label: "Forecast h", width: ".8fr", align: "right", render: r => fmtH(r.f.forecast) },
    { key: "var", label: "Variance", width: ".75fr", align: "right", render: r => <span style={{ color: r.f.variance > .05 ? "var(--bad)" : r.f.variance > .02 ? "var(--warn)" : "var(--ok)" }}>{r.f.variance > 0 ? "+" : ""}{pct(r.f.variance)}</span> },
    { key: "cost", label: "Delivery cost", width: ".9fr", align: "right", render: r => eur(Math.round(r.f.cost)) },
    { key: "m", label: "Margin", width: ".85fr", align: "right", render: r => eur(Math.round(r.f.margin)) },
    { key: "mp", label: "Margin %", width: ".9fr", align: "right", render: r => <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}><span style={{ width: 36, display: "inline-block" }}><Meter value={r.f.marginPct * 100} tone={r.f.marginPct < .42 ? "warn" : "ok"} height={5} /></span><span style={{ fontWeight: 500 }}>{pct(r.f.marginPct)}</span></div> }
  ];
  return (
    <>
      <PageHead title="Profitability" sub={"Forecast margin per project. Delivery cost uses a blended internal rate of " + eur(COST_RATE) + " per hour; forecast hours are hours spent plus the budget for work not yet complete."} />
      <Grid cols="repeat(5,minmax(0,1fr))" gap={12}>
        <Stat label="Fee value, active" value={eurK(fee)} hint="18 projects" />
        <Stat label="Forecast delivery cost" value={eurK(Math.round(cost))} hint={Math.round(sum(data.map(d => d.f.forecast))).toLocaleString() + " forecast hours"} />
        <Stat label="Forecast gross margin" value={pct((fee - cost) / fee, 1)} tone="ok" hint={eur(Math.round(fee - cost))} />
        <Stat label="Hours used" value={pct(sum(data.map(d => d.p.hoursSpent)) / sum(data.map(d => d.p.budgetHours)))} hint="of total budget hours" />
        <Stat label="Forecast over budget" value={over.length} tone={over.length ? "warn" : "ok"} hint={over.map(o => o.p.id).join(", ")} />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <AIBox tone="warn" title={"Corrib Medical Devices (GG-238) is trending " + pct(corrib.f.variance) + " over budget hours, taking its margin to " + pct(corrib.f.marginPct) + "."}
          actions={<><Btn small kind="primary" onClick={() => openProject("GG-238")}>Open GG-238</Btn><Btn small onClick={() => openProject("GG-241")}>Check Glenmere GG-241</Btn></>}>
          The extra time is going into Scope 3 purchased-goods data gaps that sit outside the original scope. A short scope note to Hannah Burke, or a small change order, would protect the fee. Glenmere is also running {pct(projectFin(project("GG-241")).variance)} over while it waits for meter data.
        </AIBox>
      </div>
      <Grid cols="minmax(0,2.2fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Project margins" right={<>
          <Seg options={["Margin %", "Fee", "Hours variance", "Due"] as SortKey[]} value={sort} onChange={k => { if (k === sort) setAsc(!asc); else { setSort(k); setAsc(k === "Margin %" || k === "Due"); } }} />
          <Btn small kind="quiet" onClick={() => setAsc(!asc)} title="Reverse order">{asc ? "Ascending" : "Descending"}</Btn>
        </>}>
          <Table cols={cols} rows={rows} rowKey={r => r.p.id} onRow={r => openProject(r.p.id)} />
          <div style={{ display: "grid", gridTemplateColumns: "2.1fr .8fr .7fr .7fr .7fr .8fr .75fr .9fr .85fr .9fr", gap: 12, padding: "11px 18px", borderTop: "1px solid var(--border-strong)", background: "var(--surface-faint)", fontSize: 12.5, fontWeight: 600, minWidth: 640 }}>
            <span>Portfolio</span>
            <span style={{ textAlign: "right" }}>{eur(fee)}</span>
            <span style={{ textAlign: "right" }}>{fmtH(sum(data.map(d => d.p.budgetHours)))}</span>
            <span style={{ textAlign: "right" }}>{fmtH(sum(data.map(d => d.p.hoursSpent)))}</span>
            <span />
            <span style={{ textAlign: "right" }}>{fmtH(sum(data.map(d => d.f.forecast)))}</span>
            <span style={{ textAlign: "right" }}>+{pct(sum(data.map(d => d.f.forecast)) / sum(data.map(d => d.p.budgetHours)) - 1, 1)}</span>
            <span style={{ textAlign: "right" }}>{eur(Math.round(cost))}</span>
            <span style={{ textAlign: "right" }}>{eur(Math.round(fee - cost))}</span>
            <span style={{ textAlign: "right" }}>{pct((fee - cost) / fee, 1)}</span>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Margin by service line" sub="Forecast gross margin %">
            <HBars data={bySvc} max={60} format={n => n.toFixed(1) + "%"} />
          </Card>
          <Card title="Effort burn vs progress" sub="Hours used against work complete">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {data.slice().sort((a, b) => (b.f.burn - b.p.progress / 100) - (a.f.burn - a.p.progress / 100)).slice(0, 6).map(d => {
                const gap = d.f.burn - d.p.progress / 100;
                return (
                  <div key={d.p.id} className="gg-row" onClick={() => openProject(d.p.id)} style={{ cursor: "pointer", borderRadius: 8 }}>
                    <div style={{ display: "flex", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.p.id} {client(d.p.clientId).name}</span>
                      <span style={{ color: gap > .05 ? "var(--bad)" : gap > 0 ? "var(--warn)" : "var(--ok)", fontVariantNumeric: "tabular-nums" }}>{pct(d.f.burn)} used · {d.p.progress}% done</span>
                    </div>
                    <div style={{ position: "relative", height: 7, borderRadius: 99, background: "var(--track)" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.min(100, d.f.burn * 100) + "%", borderRadius: 99, background: gap > .05 ? "var(--bad)" : "var(--gg-blue)", opacity: .8 }} />
                      <span style={{ position: "absolute", top: -3, bottom: -3, left: d.p.progress + "%", width: 2, background: "var(--ink)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 10 }}>Bar is hours used; the marker is work complete. Bars past the marker are burning faster than they progress.</div>
          </Card>
        </div>
      </Grid>
    </>
  );
}

/* ── module root ───────────────────────────────────────────────────────────── */
export default function Projects({ tab }: { tab: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [apr, setApr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  useFocus(["Project", "Milestone"], id => {
    if (/^M-/.test(id)) { const m = MILESTONES.find(x => x.id === id); if (m) setOpenId(m.projectId); }
    else setOpenId(id);
  });
  const openProject = (id: string) => setOpenId(id);
  let body: ReactNode;
  switch (tab) {
    case "Active Projects": body = <ActiveProjects openProject={openProject} selected={openId} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />; break;
    case "Milestones": body = <Milestones openProject={openProject} openApproval={setApr} />; break;
    case "Resources": body = <Resources openApproval={setApr} openProject={openProject} />; break;
    case "Profitability": body = <Profitability openProject={openProject} />; break;
    default: body = <Overview openProject={openProject} openApproval={setApr} setStatusFilter={setStatusFilter} />;
  }
  return (
    <Page>
      {body}
      <ProjectDrawer id={openId} onClose={() => setOpenId(null)} onApproval={id => setApr(id)} />
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </Page>
  );
}
