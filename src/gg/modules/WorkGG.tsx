/* Work: Tasks, Approvals and Calendar for Global Green.
   Task status changes and approvals live in in-memory demo state only. */
import { useMemo, useState, type ReactNode } from "react";
import {
  STAFF, TASK_STATUSES, SITE_VISITS, MEETINGS, MILESTONES, REPORTS, INVOICES, APPROVALS,
  client, project, staff, fmtDate, fmtDay, daysUntil, TODAY, parseDate, eur,
  type Task, type TaskStatus, type StaffId
} from "../data";
import { useGG, allTasks, taskStatusOf, setTaskStatus, addTask, openRecord, decide } from "../store";
import {
  Grid, Card, Stat, Badge, Btn, Seg, Search, RecordChip, Avatar, AIBox, Empty, MONO_LABEL, TONE, useFocus, type Tone
} from "../ui";
import ApprovalsPanel from "./ApprovalsPanel";

const STATUS_TONE: Record<TaskStatus, Tone> = { "Not started": "neutral", "In progress": "info", "Waiting on client": "warn", "In review": "lime", "Done": "ok" };
const PRIO_TONE: Record<Task["priority"], Tone> = { High: "bad", Medium: "warn", Low: "neutral" };
const SOURCE_TONE: Record<Task["source"], Tone> = { Pulse: "accent", Agent: "accent", "Monday.com": "info", OnePageCRM: "warn", QuickBooks: "ok" };
const sel = { height: 30, padding: "0 10px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 12, outline: 0, cursor: "pointer" } as const;

function dueLabel(d: string, done: boolean) {
  const n = daysUntil(d);
  if (done) return [fmtDate(d), "var(--faint)"];
  if (n < 0) return [Math.abs(n) + "d overdue", "var(--bad)"];
  if (n === 0) return ["Today", "var(--warn)"];
  if (n === 1) return ["Tomorrow", "var(--body)"];
  return [fmtDay(d), "var(--dim)"];
}

/* ── Tasks ─────────────────────────────────────────────────────────────────── */
type TaskView = "All open" | "Mine" | "Due this week" | "Waiting on client" | "From agents" | "Done";

function Tasks() {
  const s = useGG();
  const [view, setView] = useState<TaskView>("All open");
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [layout, setLayout] = useState<"List" | "Board">("List");
  const [draft, setDraft] = useState({ title: "", owner: "aoife" as StaffId, due: "2026-11-18", priority: "Medium" as Task["priority"] });
  const tasks = allTasks(s);
  const st = (t: Task) => taskStatusOf(s, t);
  const depts = Array.from(new Set(tasks.map(t => t.dept))).sort();

  const rows = tasks.filter(t => {
    const status = st(t);
    if (view === "Done" ? status !== "Done" : status === "Done") return false;
    if (view === "Mine" && t.owner !== "niall") return false;
    if (view === "Due this week" && t.due > "2026-11-22") return false;
    if (view === "Waiting on client" && status !== "Waiting on client") return false;
    if (view === "From agents" && t.source !== "Agent") return false;
    if (owner !== "all" && t.owner !== owner) return false;
    if (dept !== "all" && t.dept !== dept) return false;
    if (q) {
      const hay = [t.title, t.id, staff(t.owner).name, t.clientId ? client(t.clientId).name : "", t.projectId || "", t.record || ""].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => a.due.localeCompare(b.due) || (a.priority === "High" ? -1 : 1));

  const open = tasks.filter(t => st(t) !== "Done");
  const counts = {
    open: open.length,
    overdue: open.filter(t => t.due < TODAY).length,
    today: open.filter(t => t.due === TODAY).length,
    waiting: open.filter(t => st(t) === "Waiting on client").length,
    review: open.filter(t => st(t) === "In review").length,
    agent: open.filter(t => t.source === "Agent").length
  };
  const viewCounts: Partial<Record<TaskView, number>> = {
    "All open": open.length, Mine: open.filter(t => t.owner === "niall").length,
    "Due this week": open.filter(t => t.due <= "2026-11-22").length, "Waiting on client": counts.waiting,
    "From agents": counts.agent, Done: tasks.length - open.length
  };

  const row = (t: Task) => {
    const status = st(t), done = status === "Done";
    const [due, dueColor] = dueLabel(t.due, done);
    return (
      <div key={t.id} className="gg-row" style={{ display: "grid", gridTemplateColumns: "26px minmax(0,2.4fr) minmax(0,1.3fr) 120px 92px 84px 150px", gap: 12, alignItems: "center", padding: "11px 18px", borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setTaskStatus(t.id, done ? "In progress" : "Done")} title={done ? "Reopen" : "Mark done"}
          style={{ width: 20, height: 20, borderRadius: 7, border: "1.5px solid " + (done ? "var(--accent)" : "var(--border-strong)"), background: done ? "var(--accent)" : "none", color: "var(--on-accent)", cursor: "pointer", padding: 0, fontSize: 11 }}>{done ? "✓" : ""}</button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.35, color: done ? "var(--faint)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{t.title}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ ...MONO_LABEL, letterSpacing: ".05em" }}>{t.id}</span>
            <Badge tone={SOURCE_TONE[t.source]} style={{ height: 19, fontSize: 10.5 }}>{t.source === "Agent" ? "Agent" : t.source}</Badge>
            <span style={{ fontSize: 11, color: "var(--faint)" }}>{t.dept}</span>
          </div>
        </div>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
          {t.clientId && <span style={{ fontSize: 12, color: "var(--body)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client(t.clientId).name}</span>}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {t.projectId && <RecordChip id={t.projectId} label={t.projectId} />}
            {t.record && t.record !== t.projectId && <RecordChip id={t.record} label={t.record} />}
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}><Avatar id={t.owner} size={22} /><span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{staff(t.owner).first}</span></span>
        <span style={{ fontSize: 12, color: dueColor, fontVariantNumeric: "tabular-nums" }}>{due}</span>
        <Badge tone={PRIO_TONE[t.priority]}>{t.priority}</Badge>
        <select value={status} onChange={e => setTaskStatus(t.id, e.target.value as TaskStatus)} style={{ ...sel, color: TONE[STATUS_TONE[status]][0], background: TONE[STATUS_TONE[status]][1], borderColor: "transparent" }}>
          {TASK_STATUSES.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0 30px" }}>
      <Grid cols="repeat(6,minmax(0,1fr))" gap={10}>
        <Stat label="Open tasks" value={counts.open} hint="across all departments" />
        <Stat label="Overdue" value={counts.overdue} tone={counts.overdue ? "bad" : undefined} hint="past their due date" onClick={() => setView("All open")} />
        <Stat label="Due today" value={counts.today} tone="warn" hint="16 November" onClick={() => setView("Due this week")} />
        <Stat label="Waiting on client" value={counts.waiting} hint="evidence and data" onClick={() => setView("Waiting on client")} />
        <Stat label="In review" value={counts.review} hint="human sign-off" />
        <Stat label="Raised by agents" value={counts.agent} tone="lime" hint="from today's stories" onClick={() => setView("From agents")} />
      </Grid>

      <AIBox title="Six of today's tasks came from agents, and four of them unblock a client deadline."
        actions={<><Btn small onClick={() => openRecord("T-101")}>Glenmere meter data</Btn><Btn small onClick={() => openRecord("T-106")}>Carrick escalation</Btn><Btn small onClick={() => openRecord("T-102")}>Liffey follow-up</Btn></>}>
        Request Glenmere's meter data before Wednesday, follow up Liffey Packaging, review the Westhaven reminder, confirm Oakfield's ecology documents, review the expense exceptions and escalate Carrick's data dependency.
      </AIBox>

      <Card flush title={layout === "List" ? "Tasks" : "Task board"} sub="Owner, due date, priority, status, department, client and linked record on every task. Changes stay in this demo session."
        right={<Seg options={["List", "Board"] as const} value={layout} onChange={v => setLayout(v)} />}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "0 18px 14px" }}>
          <Seg options={["All open", "Mine", "Due this week", "Waiting on client", "From agents", "Done"] as TaskView[]} value={view} onChange={setView} counts={viewCounts} />
          <span style={{ flex: 1 }} />
          <select value={owner} onChange={e => setOwner(e.target.value)} style={sel}><option value="all">Everyone</option>{STAFF.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={dept} onChange={e => setDept(e.target.value)} style={sel}><option value="all">All departments</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <Search value={q} onChange={setQ} placeholder="Search tasks, clients, projects" width={240} />
        </div>
        {layout === "List" ? (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 900 }}>
              <div style={{ display: "grid", gridTemplateColumns: "26px minmax(0,2.4fr) minmax(0,1.3fr) 120px 92px 84px 150px", gap: 12, padding: "9px 18px", background: "var(--surface-faint)", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--faint)" }}>
                <span /><span>Task</span><span>Client and record</span><span>Owner</span><span>Due</span><span>Priority</span><span>Status</span>
              </div>
              {rows.map(row)}
              {rows.length === 0 && <Empty title="No tasks in this view" sub="Change the view or clear the filters." />}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(200px,1fr))", gap: 10, padding: "4px 14px 16px", overflowX: "auto" }}>
            {TASK_STATUSES.map(col => {
              const items = tasks.filter(t => st(t) === col && (owner === "all" || t.owner === owner) && (dept === "all" || t.dept === dept) && (!q || t.title.toLowerCase().includes(q.toLowerCase())));
              return (
                <div key={col} style={{ background: "var(--surface-faint)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", padding: 10, minHeight: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: TONE[STATUS_TONE[col]][0] }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{col}</span>
                    <span style={{ fontSize: 11, color: "var(--faint)" }}>{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {items.map(t => {
                      const i = TASK_STATUSES.indexOf(col);
                      return (
                        <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 11px" }}>
                          <div style={{ fontSize: 12.5, lineHeight: 1.4, cursor: t.record ? "pointer" : "default" }} onClick={() => t.record && openRecord(t.record)}>{t.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <Avatar id={t.owner} size={20} />
                            <span style={{ fontSize: 11, color: dueLabel(t.due, col === "Done")[1] as string, flex: 1 }}>{dueLabel(t.due, col === "Done")[0]}</span>
                            <button disabled={i === 0} onClick={() => setTaskStatus(t.id, TASK_STATUSES[i - 1])} style={{ ...sel, height: 22, padding: "0 7px", opacity: i === 0 ? .35 : 1 }} title="Move back">‹</button>
                            <button disabled={i === TASK_STATUSES.length - 1} onClick={() => setTaskStatus(t.id, TASK_STATUSES[i + 1])} style={{ ...sel, height: 22, padding: "0 7px", opacity: i === TASK_STATUSES.length - 1 ? .35 : 1 }} title="Move forward">›</button>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && <div style={{ fontSize: 11.5, color: "var(--faint)", padding: "8px 2px" }}>Nothing here</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "12px 18px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)" }}>
          <span style={{ ...MONO_LABEL }}>New task</span>
          <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="What needs doing?" style={{ ...sel, cursor: "text", flex: "1 1 240px", borderRadius: 10 }}
            onKeyDown={e => { if (e.key === "Enter" && draft.title.trim()) { addTask({ title: draft.title.trim(), owner: draft.owner, due: draft.due, priority: draft.priority, status: "Not started", dept: staff(draft.owner).dept, source: "Pulse" }); setDraft({ ...draft, title: "" }); } }} />
          <select value={draft.owner} onChange={e => setDraft({ ...draft, owner: e.target.value as StaffId })} style={sel}>{STAFF.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={draft.due} onChange={e => setDraft({ ...draft, due: e.target.value })} style={sel}>
            {["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-23", "2026-11-27"].map(d => <option key={d} value={d}>{fmtDay(d)}</option>)}
          </select>
          <select value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as Task["priority"] })} style={sel}>{["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}</select>
          <Btn kind="primary" small disabled={!draft.title.trim()} onClick={() => { addTask({ title: draft.title.trim(), owner: draft.owner, due: draft.due, priority: draft.priority, status: "Not started", dept: staff(draft.owner).dept, source: "Pulse" }); setDraft({ ...draft, title: "" }); }}>Add task</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ── Approvals ─────────────────────────────────────────────────────────────── */
function Approvals() {
  const s = useGG();
  const pending = APPROVALS.filter(a => !s.approvals[a.id]);
  const byOwner = STAFF.map(p => [p, pending.filter(a => a.owner === p.id).length] as const).filter(x => x[1] > 0);
  const lowRisk = pending.filter(a => a.risk === "low");
  return (
    <div style={{ padding: "4px 0 30px" }}>
      <Grid cols="minmax(0,2.2fr) minmax(280px,1fr)">
        <ApprovalsPanel title="Waiting on a person" sub="Drafts and recommendations prepared by agents. Approving marks them ready in this demo; nothing is sent, posted or reconciled." />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Who it is waiting on">
            {byOwner.map(([p, n]) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                <Avatar id={p.id} size={24} /><span style={{ flex: 1, fontSize: 12.5 }}>{p.name}</span><Badge tone="warn">{n}</Badge>
              </div>
            ))}
            {byOwner.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Nobody. Every draft has a decision.</div>}
          </Card>
          <Card title="Low-risk items" sub="Internal routing and follow-ups that do not commit money or a client.">
            {lowRisk.map(a => (
              <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", borderTop: "1px solid var(--border)" }}>
                <span style={{ flex: 1, fontSize: 12.5, cursor: "pointer" }} onClick={() => openRecord(a.id)}>{a.title}</span>
                <Btn small kind="primary" onClick={() => decide(a.id, "approved")}>Approve</Btn>
              </div>
            ))}
            {lowRisk.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>None waiting.</div>}
          </Card>
          <Card title="What approval means here">
            <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.65 }}>
              Agents prepare. People decide. Every decision is written to the audit log as the person who made it. Client emails, campaigns and LinkedIn posts are never sent from this demo; QuickBooks is never written to.
            </div>
          </Card>
        </div>
      </Grid>
    </div>
  );
}

/* ── Calendar ──────────────────────────────────────────────────────────────── */
type EvKind = "Site visit" | "Meeting" | "Milestone" | "Report due" | "Invoice due";
interface Ev { date: string; time?: string; title: string; sub: string; kind: EvKind; record: string; tone: Tone; who?: StaffId[]; }
const KIND_TONE: Record<EvKind, Tone> = { "Site visit": "accent", Meeting: "info", Milestone: "lime", "Report due": "warn", "Invoice due": "neutral" };

function buildEvents(): Ev[] {
  const ev: Ev[] = [];
  SITE_VISITS.forEach(v => ev.push({ date: v.date, time: v.time, title: client(v.clientId).name, sub: v.type, kind: "Site visit", record: v.id,
    tone: v.status === "at_risk" ? "bad" : v.status === "evidence_pending" || v.status === "conflict" ? "warn" : "accent", who: v.engineers }));
  MEETINGS.forEach(m => ev.push({ date: m.when, time: m.time, title: m.org, sub: m.title + " (" + m.source + ")", kind: "Meeting", record: m.oppId || m.org, tone: "info", who: [m.owner] }));
  MILESTONES.filter(m => !m.done).forEach(m => ev.push({ date: m.planned, title: m.title, sub: m.projectId + " · " + client(project(m.projectId).clientId).name, kind: "Milestone", record: m.id,
    tone: m.status === "blocked" || m.status === "late" ? "bad" : "lime", who: [m.owner] }));
  REPORTS.filter(r => r.stage !== "Delivered").forEach(r => ev.push({ date: r.due, title: r.title, sub: r.stage + " · " + r.version, kind: "Report due", record: r.id, tone: r.missing ? "warn" : "neutral", who: [r.owner] }));
  INVOICES.filter(i => i.status === "current").forEach(i => ev.push({ date: i.due, title: i.id + " due", sub: client(i.clientId).name + " · " + eur(i.amount), kind: "Invoice due", record: i.id, tone: "neutral" }));
  return ev;
}

function Calendar() {
  const [mode, setMode] = useState<"This week" | "Next week" | "November">("This week");
  const [kinds, setKinds] = useState<EvKind[]>(["Site visit", "Meeting", "Milestone", "Report due", "Invoice due"]);
  const [who, setWho] = useState<string>("all");
  const events = useMemo(buildEvents, []);
  const vis = events.filter(e => kinds.indexOf(e.kind) > -1 && (who === "all" || (e.who || []).indexOf(who as StaffId) > -1));
  const addDays = (iso: string, n: number) => { const d = parseDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const toggle = (k: EvKind) => setKinds(kinds.indexOf(k) > -1 ? kinds.filter(x => x !== k) : kinds.concat([k]));

  const chip = (e: Ev, i: number): ReactNode => (
    <div key={i} className="gg-click" onClick={() => openRecord(e.record)} title={e.title + " · " + e.sub}
      style={{ padding: "7px 8px", borderRadius: 10, background: TONE[e.tone][1], borderLeft: "0", border: "1px solid color-mix(in srgb, " + TONE[e.tone][0] + " 30%, transparent)", cursor: "pointer", minWidth: 0 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {e.time && <span style={{ fontSize: 10.5, color: TONE[e.tone][0], fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{e.time}</span>}
        <span style={{ ...MONO_LABEL, fontSize: 8.5, letterSpacing: ".06em", color: TONE[e.tone][0] }}>{e.kind}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{e.title}</div>
      <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.sub}</div>
      {e.who && <div style={{ display: "flex", gap: 3, marginTop: 5 }}>{e.who.map(w => <Avatar key={w} id={w} size={17} />)}</div>}
    </div>
  );

  const conflicts = [
    { date: "2026-11-18", text: "Eoin is on site at Glenmere (Cootehill, from 08:30) and due on the Portlaoise SEU kick-off at 15:00.", record: "SV-303" },
    { date: "2026-11-20", text: "The Wicklow route walkover still needs a second surveyor; Sarah is the only one assigned.", record: "SV-306" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0 30px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Seg options={["This week", "Next week", "November"] as const} value={mode} onChange={v => setMode(v)} />
        <span style={{ flex: 1 }} />
        {(Object.keys(KIND_TONE) as EvKind[]).map(k => {
          const on = kinds.indexOf(k) > -1;
          return <button key={k} onClick={() => toggle(k)} style={{ height: 28, padding: "0 11px", borderRadius: 999, border: "1px solid " + (on ? "color-mix(in srgb, " + TONE[KIND_TONE[k]][0] + " 40%, transparent)" : "var(--border)"), background: on ? TONE[KIND_TONE[k]][1] : "none", color: on ? TONE[KIND_TONE[k]][0] : "var(--faint)", fontSize: 12, cursor: "pointer" }}>{k}</button>;
        })}
        <select value={who} onChange={e => setWho(e.target.value)} style={sel}><option value="all">Whole team</option>{STAFF.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>

      {mode !== "November" ? (() => {
        const start = mode === "This week" ? "2026-11-16" : "2026-11-23";
        const days = [0, 1, 2, 3, 4].map(n => addDays(start, n));
        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
              {days.map(d => {
                const items = vis.filter(e => e.date === d).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
                const today = d === TODAY;
                return (
                  <div key={d} style={{ background: today ? "var(--accent-faint)" : "var(--surface)", border: "1px solid " + (today ? "var(--accent-line)" : "var(--border)"), borderRadius: "var(--r-md,16px)", padding: 10, minHeight: 360, display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "2px 2px 6px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtDay(d).split(" ")[0]}</span>
                      <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.5px", color: today ? "var(--accent)" : "var(--ink)" }}>{parseDate(d).getUTCDate()}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, color: "var(--faint)" }}>{items.length || ""}</span>
                    </div>
                    {items.map(chip)}
                    {items.length === 0 && <div style={{ fontSize: 11.5, color: "var(--faint)", padding: 4 }}>Nothing scheduled</div>}
                  </div>
                );
              })}
            </div>
            {mode === "This week" && (
              <Grid cols="repeat(2,minmax(0,1fr))">
                {conflicts.map(c => (
                  <AIBox key={c.date} tone="warn" title={"Clash on " + fmtDay(c.date)} actions={<Btn small onClick={() => openRecord(c.record)}>Open visit</Btn>}>{c.text}</AIBox>
                ))}
              </Grid>
            )}
          </>
        );
      })() : (
        <Card flush title="November 2026" sub="Every site visit, meeting, milestone, report deadline and invoice due date. Click a day item to open the record.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", borderTop: "1px solid var(--border)" }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} style={{ padding: "8px 10px", fontSize: 11, color: "var(--faint)", borderBottom: "1px solid var(--border)" }}>{d}</div>)}
            {Array.from({ length: 35 }, (_, i) => {
              const d = addDays("2026-10-26", i);
              const inMonth = d.slice(5, 7) === "11";
              const items = vis.filter(e => e.date === d);
              return (
                <div key={d} style={{ minHeight: 96, padding: "6px 7px", borderRight: (i % 7) < 6 ? "1px solid var(--border)" : 0, borderBottom: "1px solid var(--border)", background: d === TODAY ? "var(--accent-faint)" : undefined, opacity: inMonth ? 1 : .45 }}>
                  <div style={{ fontSize: 11.5, fontWeight: d === TODAY ? 700 : 500, color: d === TODAY ? "var(--accent)" : "var(--dim)" }}>{parseDate(d).getUTCDate()}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                    {items.slice(0, 3).map((e, k) => (
                      <div key={k} onClick={() => openRecord(e.record)} title={e.title + " · " + e.sub} style={{ fontSize: 10.5, lineHeight: 1.3, padding: "2px 5px", borderRadius: 5, background: TONE[e.tone][1], color: TONE[e.tone][0], cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(e.time ? e.time + " " : "") + e.title}</div>
                    ))}
                    {items.length > 3 && <span style={{ fontSize: 10, color: "var(--faint)" }}>+{items.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function WorkGG({ tab }: { tab: string }) {
  useFocus("Task", () => {});
  return (
    <div style={{ padding: "0 22px", animation: "pageIn .5s var(--ease) both" }}>
      {tab === "Tasks" && <Tasks />}
      {tab === "Approvals" && <Approvals />}
      {tab === "Calendar" && <Calendar />}
    </div>
  );
}
