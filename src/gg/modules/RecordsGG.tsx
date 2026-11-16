/* Records → Relationships (client 360 over the operational knowledge model)
   and Records → Search (every record type in one place). */
import { useMemo, useState } from "react";
import {
  CLIENTS, CONTACTS, PROJECTS, COMPLETED_PROJECTS, OPPORTUNITIES, PROPOSALS, SITE_VISITS, EVIDENCE, REPORTS, INVOICES,
  TASKS, APPROVALS, MILESTONES, FINDINGS, CERTIFICATIONS, CAMPAIGNS, LINKEDIN_POSTS, RECEIPTS, STAFF, ACTIVITY, MEETINGS,
  client, staff, eur, fmtDate, fmtDay, daysAgo, recordRef, type Client
} from "../data";
import { useGG, openRecord, evidenceStatus, taskStatusOf, allTasks, navigate } from "../store";
import { Grid, Card, Badge, Btn, Search, Avatar, Stat, Empty, MONO_LABEL, TONE, AIBox, RecordChip, useFocus, type Tone } from "../ui";

const HEALTH: Record<Client["health"], [Tone, string]> = { good: ["ok", "Healthy"], watch: ["warn", "Watch"], risk: ["bad", "At risk"] };
const STATUS_TONE: Record<string, Tone> = { on_track: "ok", at_risk: "warn", blocked: "bad" };

/* ── Relationships ─────────────────────────────────────────────────────────── */
type NodeT = { id: string; label: string; sub: string; type: string; tone: Tone };

function graphFor(c: Client, s: ReturnType<typeof useGG>) {
  const projects = PROJECTS.filter(p => p.clientId === c.id);
  const done = COMPLETED_PROJECTS.filter(p => p.clientId === c.id);
  const pids = projects.map(p => p.id).concat(done.map(p => p.id));
  const contacts = CONTACTS.filter(x => x.orgId === c.id);
  const opps = OPPORTUNITIES.filter(o => o.clientId === c.id || o.company === c.name);
  const proposals = PROPOSALS.filter(p => p.company === c.name);
  const visits = SITE_VISITS.filter(v => v.clientId === c.id);
  const evidence = EVIDENCE.filter(e => pids.indexOf(e.projectId) > -1);
  const reports = REPORTS.filter(r => pids.indexOf(r.projectId) > -1);
  const invoices = INVOICES.filter(i => i.clientId === c.id);
  const tasks = allTasks(s).filter(t => t.clientId === c.id || (t.projectId && pids.indexOf(t.projectId) > -1));
  const milestones = MILESTONES.filter(m => pids.indexOf(m.projectId) > -1);
  const approvals = APPROVALS.filter(a => pids.indexOf(a.record) > -1 || invoices.some(i => i.id === a.record) || proposals.some(p => p.id === a.record));
  const people = Array.from(new Set([c.lead].concat(...projects.map(p => p.team))));
  const findings = FINDINGS.filter(f => pids.indexOf(f.projectId) > -1);
  const certs = CERTIFICATIONS.filter(x => x.clientId === c.id);
  const activity = ACTIVITY.concat(s.log).filter(a => a.record === c.id || pids.indexOf(a.record) > -1 || invoices.some(i => i.id === a.record)
    || visits.some(v => v.id === a.record) || reports.some(r => r.id === a.record) || evidence.some(e => e.id === a.record) || approvals.some(x => x.id === a.record))
    .sort((a, b) => b.when.localeCompare(a.when));
  return { projects, done, contacts, opps, proposals, visits, evidence, reports, invoices, tasks, milestones, approvals, people, findings, certs, activity };
}

function RelationshipMap({ c, g }: { c: Client; g: ReturnType<typeof graphFor> }) {
  const s = useGG();
  type Grp = { type: string; tone: Tone; nodes: NodeT[] };
  const groups: Grp[] = ([
    { type: "Contacts", tone: "info", nodes: g.contacts.map(x => ({ id: x.id, label: x.name, sub: x.title, type: "Contact", tone: "info" as Tone })) },
    { type: "Projects", tone: "accent", nodes: g.projects.map(p => ({ id: p.id, label: p.id, sub: eur(p.value) + " · " + p.title, type: "Project", tone: STATUS_TONE[p.status] })).concat(g.done.map(p => ({ id: p.id, label: p.id, sub: "Completed · " + eur(p.value), type: "Project", tone: "neutral" as Tone }))) },
    { type: "Site visits", tone: "lime", nodes: g.visits.map(v => ({ id: v.id, label: v.id, sub: fmtDay(v.date) + " " + v.time, type: "Site visit", tone: v.status === "at_risk" ? "bad" : v.status === "evidence_pending" ? "warn" : "lime" as Tone })) },
    { type: "Evidence", tone: "warn", nodes: g.evidence.map(e => { const st = evidenceStatus(s, e); return { id: e.id, label: e.kind, sub: st === "missing" ? "Missing" : st === "requested" ? "Requested" : st === "uploading" ? "Uploading" : "Received", type: "Evidence", tone: (st === "missing" ? "bad" : st === "requested" || st === "uploading" ? "warn" : "ok") as Tone }; }) },
    { type: "Reports", tone: "info", nodes: g.reports.map(r => ({ id: r.id, label: r.id, sub: r.stage + " · due " + fmtDate(r.due), type: "Report", tone: (r.missing ? "warn" : "info") as Tone })) },
    { type: "Invoices", tone: "neutral", nodes: g.invoices.map(i => ({ id: i.id, label: i.id, sub: eur(i.amount) + " · " + i.status, type: "Invoice", tone: (i.status === "overdue" ? "bad" : i.status === "paid" ? "ok" : "neutral") as Tone })) },
    { type: "Tasks", tone: "warn", nodes: g.tasks.map(t => ({ id: t.id, label: t.id, sub: taskStatusOf(s, t), type: "Task", tone: (taskStatusOf(s, t) === "Done" ? "ok" : t.priority === "High" ? "warn" : "neutral") as Tone })) },
    { type: "Team", tone: "accent", nodes: g.people.map(id => ({ id: "staff:" + id, label: staff(id).name, sub: staff(id).role, type: "Employee", tone: "accent" as Tone })) },
    { type: "Pipeline", tone: "lime", nodes: g.opps.map(o => ({ id: o.id, label: o.id, sub: o.stage + " · " + eur(o.value), type: "Opportunity", tone: "lime" as Tone })).concat(g.proposals.map(p => ({ id: p.id, label: p.id, sub: p.status + " · " + eur(p.value), type: "Proposal", tone: "lime" as Tone }))) }
  ] as Grp[]).filter(x => x.nodes.length);

  const W = 980, H = 470, cx = W / 2, cy = H / 2;
  const n = groups.length;
  const placed = groups.map((grp, gi) => {
    const ang = -Math.PI / 2 + (gi / n) * Math.PI * 2;
    const hx = cx + Math.cos(ang) * 150, hy = cy + Math.sin(ang) * 118;
    const k = grp.nodes.length;
    const spread = Math.min(1.05, 0.22 * k + 0.1);
    const nodes = grp.nodes.slice(0, 7).map((nd, i) => {
      const a = ang + (k === 1 ? 0 : (i / (Math.min(k, 7) - 1) - 0.5) * spread);
      return { ...nd, x: cx + Math.cos(a) * 340, y: cy + Math.sin(a) * 196 };
    });
    return { ...grp, hx, hy, nodes, more: Math.max(0, k - 7) };
  });

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" style={{ display: "block", minWidth: 760 }}>
        {placed.map(gp => (
          <g key={gp.type}>
            <line x1={cx} y1={cy} x2={gp.hx} y2={gp.hy} stroke={TONE[gp.tone][0]} strokeOpacity=".45" strokeWidth="1.6" />
            {gp.nodes.map(nd => <line key={nd.id} x1={gp.hx} y1={gp.hy} x2={nd.x} y2={nd.y} stroke="var(--border-strong)" strokeWidth="1" />)}
          </g>
        ))}
        <circle cx={cx} cy={cy} r="54" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">{c.name.length > 20 ? c.name.slice(0, 19) + "…" : c.name}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10.5" fill="var(--dim)">CLIENT</text>
        {placed.map(gp => (
          <g key={gp.type + "h"}>
            <rect x={gp.hx - 46} y={gp.hy - 13} width="92" height="26" rx="13" fill="var(--surface-2)" stroke={TONE[gp.tone][0]} strokeOpacity=".6" />
            <text x={gp.hx} y={gp.hy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={TONE[gp.tone][0]}>{gp.type} · {gp.nodes.length + gp.more}</text>
            {gp.nodes.map(nd => {
              const w = Math.max(92, Math.min(170, Math.max(nd.label.length, nd.sub.length * 0.82) * 6.4 + 22));
              return (
                <g key={nd.id} style={{ cursor: nd.type === "Employee" ? "default" : "pointer" }} onClick={() => { if (nd.type !== "Employee" && nd.type !== "Contact") openRecord(nd.id); if (nd.type === "Contact") navigate("Records", "Contacts"); }}>
                  <rect x={nd.x - w / 2} y={nd.y - 17} width={w} height="34" rx="10" fill="var(--surface)" stroke={TONE[nd.tone][0]} strokeOpacity=".55" />
                  <circle cx={nd.x - w / 2 + 11} cy={nd.y} r="3.5" fill={TONE[nd.tone][0]} />
                  <text x={nd.x - w / 2 + 20} y={nd.y - 2} fontSize="11" fontWeight="600" fill="var(--ink)">{nd.label.length > 22 ? nd.label.slice(0, 21) + "…" : nd.label}</text>
                  <text x={nd.x - w / 2 + 20} y={nd.y + 11} fontSize="9.5" fill="var(--dim)">{nd.sub.length > 25 ? nd.sub.slice(0, 24) + "…" : nd.sub}</text>
                  <title>{nd.type + ": " + nd.label + " · " + nd.sub}</title>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Relationships() {
  const s = useGG();
  const [sel, setSel] = useState("glenmere");
  const [q, setQ] = useState("");
  useFocus("Client", (id) => { const c = CLIENTS.find(x => x.id === id || x.name === id); if (c) setSel(c.id); });
  const c = client(sel) || CLIENTS[0];
  const g = useMemo(() => graphFor(c, s), [c, s]);
  const missing = g.evidence.filter(e => evidenceStatus(s, e) === "missing");
  const owed = g.invoices.filter(i => i.status !== "paid").reduce((a, i) => a + i.amount, 0);
  const featured = ["glenmere", "westhaven", "carrick", "oakfield"];
  const list = CLIENTS.filter(x => !q || (x.name + " " + x.sector + " " + x.county).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (featured.indexOf(b.id) > -1 ? 1 : 0) - (featured.indexOf(a.id) > -1 ? 1 : 0));
  const chain: [string, number, Tone][] = [
    ["Client", 1, "accent"], ["Contacts", g.contacts.length, "info"], ["Opportunities", g.opps.length, "lime"], ["Proposals", g.proposals.length, "lime"],
    ["Projects", g.projects.length + g.done.length, "accent"], ["Site visits", g.visits.length, "lime"], ["Evidence", g.evidence.length, missing.length ? "bad" : "ok"],
    ["Reports", g.reports.length, "info"], ["Invoices", g.invoices.length, g.invoices.some(i => i.status === "overdue") ? "bad" : "neutral"],
    ["Payments", g.invoices.filter(i => i.status === "paid").length, "ok"]
  ];
  const ct = g.contacts[0];
  const story = g.projects.find(p => p.story) || null;

  return (
    <Grid cols="260px minmax(0,1fr)" gap={16} style={{ padding: "4px 0 30px" }}>
      <Card flush title="Clients" sub={CLIENTS.length + " active organisations"} style={{ position: "sticky", top: 8 }}>
        <div style={{ padding: "0 12px 10px" }}><Search value={q} onChange={setQ} placeholder="Find a client" width="100%" /></div>
        <div style={{ maxHeight: 640, overflowY: "auto", borderTop: "1px solid var(--border)" }}>
          {list.map(x => {
            const on = x.id === sel, h = HEALTH[x.health];
            return (
              <div key={x.id} className="gg-row" onClick={() => setSel(x.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", cursor: "pointer", background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: TONE[h[0]][0], flex: "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: on ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{x.sector} · {x.county}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <Card>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={MONO_LABEL}>Client since {c.since}</span>
                <Badge tone={HEALTH[c.health][0]} dot>{HEALTH[c.health][1]}</Badge>
              </div>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.6px", marginTop: 6 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 4 }}>{c.sector} · Co. {c.county} · {c.services.join(", ")}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 12.5 }}><Avatar id={c.lead} size={22} />Relationship lead: {staff(c.lead).name}</span>
                {ct && <span style={{ fontSize: 12.5, color: "var(--body)" }}>Main contact: {ct.name}, {ct.title} <span style={{ color: "var(--faint)" }}>({ct.email}, mock)</span></span>}
              </div>
            </div>
            <Grid cols="repeat(4,minmax(110px,1fr))" gap={8} style={{ flex: "1 1 460px" }}>
              <Stat label="Lifetime value" value={eur(c.lifetime)} />
              <Stat label="Active work" value={eur(g.projects.reduce((a, p) => a + p.value, 0))} hint={g.projects.length + " project" + (g.projects.length === 1 ? "" : "s")} />
              <Stat label="Owed" value={eur(owed)} tone={g.invoices.some(i => i.status === "overdue") ? "bad" : undefined} hint={g.invoices.filter(i => i.status === "overdue").length + " overdue"} />
              <Stat label="Missing evidence" value={missing.length} tone={missing.length ? "warn" : undefined} hint="items from client" />
            </Grid>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 16, overflowX: "auto", paddingBottom: 2 }}>
            {chain.map(([k, n, tone], i) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: 999, background: n ? TONE[tone][1] : "var(--surface-faint)", color: n ? TONE[tone][0] : "var(--faint)", fontSize: 11.5, fontWeight: 500, border: "1px solid " + (n ? "transparent" : "var(--border)") }}>{k}<b style={{ fontVariantNumeric: "tabular-nums" }}>{n}</b></span>
                {i < chain.length - 1 && <span style={{ color: "var(--faint)", fontSize: 12 }}>→</span>}
              </div>
            ))}
          </div>
        </Card>

        {story && (story.status !== "on_track") && (
          <AIBox tone={story.status === "blocked" ? "bad" : "warn"} title={story.id + " is " + (story.status === "blocked" ? "blocked" : "at risk") + ": " + story.issue + "."}
            actions={<><Btn small kind="primary" onClick={() => openRecord(story.id)}>Open project</Btn>{g.approvals.filter(a => !s.approvals[a.id]).slice(0, 1).map(a => <Btn key={a.id} small onClick={() => openRecord(a.id)}>Review drafted action</Btn>)}</>}>
            Waiting on: {story.dependency}. Next: {story.nextMilestone} on {fmtDay(story.nextDate)}. Report due {fmtDate(story.due)}. Owner {staff(story.owner).name}.
          </AIBox>
        )}
        {!story && g.invoices.some(i => i.status === "overdue") && (
          <AIBox tone="bad" title={"Overdue: " + g.invoices.filter(i => i.status === "overdue").map(i => i.id + " (" + eur(i.amount) + ", " + daysAgo(i.due) + " days)").join(", ")}
            actions={<>{g.approvals.filter(a => !s.approvals[a.id]).slice(0, 1).map(a => <Btn key={a.id} small kind="primary" onClick={() => openRecord(a.id)}>Review drafted reminder</Btn>)}<Btn small onClick={() => navigate("Finance", "Invoices")}>Open invoices</Btn></>}>
            Every connected record for this client is shown below, from the original work to the payment history.
          </AIBox>
        )}

        <Card flush title="Relationship map" sub="Everything connected to this client in the knowledge model. Click any record to open it.">
          <div style={{ padding: "0 8px 8px" }}><RelationshipMap c={c} g={g} /></div>
        </Card>

        <Grid cols="repeat(3,minmax(0,1fr))" gap={14}>
          <Card title="Projects and milestones">
            {g.projects.concat().map(p => (
              <div key={p.id} className="gg-row" onClick={() => openRecord(p.id)} style={{ padding: "8px 4px", borderRadius: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{p.id} · {p.title}</span><Badge tone={STATUS_TONE[p.status]}>{p.status.replace("_", " ")}</Badge></div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{eur(p.value)} · due {fmtDate(p.due)} · {staff(p.owner).name}</div>
              </div>
            ))}
            {g.milestones.filter(m => !m.done).slice(0, 4).map(m => (
              <div key={m.id} style={{ display: "flex", gap: 8, fontSize: 12, padding: "5px 4px", color: m.status === "blocked" || m.status === "late" ? "var(--bad)" : "var(--body)" }}>
                <span style={{ width: 52, flex: "none", color: "var(--faint)" }}>{fmtDate(m.planned)}</span><span style={{ flex: 1 }}>{m.title}</span>
              </div>
            ))}
            {g.projects.length === 0 && g.done.map(p => <div key={p.id} style={{ fontSize: 12.5, padding: "6px 4px" }}>{p.id} · {p.title} <span style={{ color: "var(--faint)" }}>(completed {fmtDate(p.completed)})</span></div>)}
            {g.projects.length === 0 && g.done.length === 0 && <Empty title="No active projects" />}
          </Card>
          <Card title="Site visits and evidence">
            {g.visits.map(v => (
              <div key={v.id} className="gg-row" onClick={() => openRecord(v.id)} style={{ padding: "7px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12.5 }}>
                {v.id} · {fmtDay(v.date)} {v.time} <span style={{ color: "var(--faint)" }}>· {v.engineers.map(e => staff(e).first).join(", ")}</span>
              </div>
            ))}
            {g.evidence.map(e => {
              const st = evidenceStatus(s, e);
              return (
                <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 4px", fontSize: 12 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => openRecord(e.id)}>{e.title}</span>
                  <Badge tone={st === "missing" ? "bad" : st === "received" ? "ok" : "warn"}>{st}</Badge>
                </div>
              );
            })}
            {g.visits.length === 0 && g.evidence.length === 0 && <Empty title="No visits or evidence" />}
          </Card>
          <Card title="Reports, invoices and tasks">
            {g.reports.map(r => <div key={r.id} style={{ fontSize: 12.5, padding: "6px 4px" }}><RecordChip id={r.id} label={r.id + " · " + r.stage} /> <span style={{ fontSize: 11.5, color: "var(--faint)" }}>due {fmtDate(r.due)}</span></div>)}
            {g.invoices.map(i => (
              <div key={i.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 4px", fontSize: 12.5 }}>
                <span style={{ flex: 1, cursor: "pointer" }} onClick={() => openRecord(i.id)}>{i.id} · {eur(i.amount)}</span>
                <Badge tone={i.status === "overdue" ? "bad" : i.status === "paid" ? "ok" : "neutral"}>{i.status === "overdue" ? daysAgo(i.due) + "d overdue" : i.status}</Badge>
              </div>
            ))}
            {g.tasks.map(t => <div key={t.id} style={{ fontSize: 12, padding: "5px 4px", display: "flex", gap: 8, alignItems: "center" }}><Avatar id={t.owner} size={18} /><span style={{ flex: 1, cursor: "pointer" }} onClick={() => openRecord(t.id)}>{t.title}</span></div>)}
          </Card>
        </Grid>

        <Card title="Timeline" sub="Every event connected to this client, newest first.">
          {g.activity.slice(0, 8).map((a, i) => (
            <div key={a.id} className="gg-row" onClick={() => openRecord(a.record)} style={{ display: "flex", gap: 12, padding: "8px 4px", borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", borderRadius: 6 }}>
              <span style={{ width: 92, flex: "none", fontSize: 11, color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{fmtDate(a.when)} {a.when.slice(11)}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>{a.title}<span style={{ color: "var(--faint)" }}> · {a.actor}</span></span>
              <Badge tone={a.alert ? "warn" : "neutral"}>{a.source}</Badge>
            </div>
          ))}
          {g.activity.length === 0 && <Empty title="No recent activity" />}
        </Card>
      </div>
    </Grid>
  );
}

/* ── Search ────────────────────────────────────────────────────────────────── */
type Hit = { id: string; type: string; title: string; sub: string; open: () => void };

function buildIndex(s: ReturnType<typeof useGG>): Hit[] {
  const r = (id: string) => () => openRecord(id);
  const hits: Hit[] = [];
  CLIENTS.forEach(c => hits.push({ id: c.id, type: "Client", title: c.name, sub: c.sector + " · Co. " + c.county + " · lead " + staff(c.lead).name, open: () => openRecord(c.id) }));
  CONTACTS.forEach(c => hits.push({ id: c.id, type: "Contact", title: c.name, sub: c.title + " · " + c.org + " (mock)", open: () => navigate("Records", "Contacts") }));
  STAFF.forEach(p => hits.push({ id: p.id, type: "Employee", title: p.name, sub: p.role + " · " + p.office, open: () => navigate("Records", "Contacts") }));
  PROJECTS.forEach(p => hits.push({ id: p.id, type: "Project", title: p.id + " " + client(p.clientId).name, sub: p.title + " · " + eur(p.value) + " · " + p.status.replace("_", " "), open: r(p.id) }));
  OPPORTUNITIES.forEach(o => hits.push({ id: o.id, type: "Opportunity", title: o.id + " " + o.company, sub: o.title + " · " + eur(o.value) + " · " + o.stage, open: r(o.id) }));
  PROPOSALS.forEach(p => hits.push({ id: p.id, type: "Proposal", title: p.id + " " + p.company, sub: p.title + " · " + eur(p.value) + " · " + p.status, open: r(p.id) }));
  INVOICES.forEach(i => hits.push({ id: i.id, type: "Invoice", title: i.id + " " + client(i.clientId).name, sub: eur(i.amount) + " · " + i.status + " · due " + fmtDate(i.due), open: r(i.id) }));
  SITE_VISITS.forEach(v => hits.push({ id: v.id, type: "Site visit", title: v.id + " " + v.site, sub: fmtDay(v.date) + " " + v.time + " · " + v.type, open: r(v.id) }));
  EVIDENCE.forEach(e => hits.push({ id: e.id, type: "Evidence", title: e.title, sub: e.projectId + " · " + evidenceStatus(s, e) + " · from " + e.from, open: r(e.id) }));
  REPORTS.forEach(x => hits.push({ id: x.id, type: "Report", title: x.title, sub: x.id + " · " + x.stage + " · due " + fmtDate(x.due), open: r(x.id) }));
  FINDINGS.forEach(f => hits.push({ id: f.id, type: "Finding", title: f.title, sub: f.projectId + " · " + f.area + " · " + eur(f.eur) + "/yr", open: r(f.id) }));
  allTasks(s).forEach(t => hits.push({ id: t.id, type: "Task", title: t.title, sub: staff(t.owner).name + " · due " + fmtDate(t.due) + " · " + taskStatusOf(s, t), open: () => navigate("Work", "Tasks") }));
  APPROVALS.forEach(a => hits.push({ id: a.id, type: "Approval", title: a.title, sub: a.kind + (s.approvals[a.id] ? " · " + s.approvals[a.id] : " · waiting"), open: r(a.id) }));
  CERTIFICATIONS.forEach(c => hits.push({ id: c.id, type: "Certification", title: c.standard + " · " + client(c.clientId).name, sub: c.status + " · " + c.nextLabel, open: r(c.id) }));
  CAMPAIGNS.forEach(c => hits.push({ id: c.id, type: "Campaign", title: c.name, sub: c.id + " · " + c.size + " prospects · " + c.status, open: r(c.id) }));
  LINKEDIN_POSTS.forEach(p => hits.push({ id: p.id, type: "LinkedIn post", title: p.title, sub: p.id + " · " + fmtDate(p.date) + " · " + p.status, open: r(p.id) }));
  RECEIPTS.forEach(x => hits.push({ id: x.id, type: "Receipt", title: x.vendor, sub: eur(x.amount, 2) + " · " + x.category + " · " + x.status, open: () => navigate("Finance", "Expenses") }));
  MEETINGS.forEach(m => hits.push({ id: m.id, type: "Meeting", title: m.title + ", " + m.org, sub: fmtDay(m.when) + " " + m.time + " · " + m.source, open: () => navigate("Work", "Calendar") }));
  return hits;
}

function SearchAll() {
  const s = useGG();
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const index = useMemo(() => buildIndex(s), [s]);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = terms.length ? index.filter(h => terms.every(t => (h.id + " " + h.title + " " + h.sub + " " + h.type).toLowerCase().includes(t))) : [];
  const types = Array.from(new Set(matches.map(m => m.type)));
  const shown = matches.filter(m => type === "All" || m.type === type);
  const grouped = types.filter(t => type === "All" || t === type).map(t => [t, shown.filter(m => m.type === t)] as const);
  const tries = ["Glenmere", "INV-1048", "meter", "ISO 50001", "Liffey", "Eoin", "ecology", "overdue"];

  return (
    <div style={{ padding: "4px 0 30px", display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 420px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px", background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 999 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round"><path d="m21 21-4.3-4.3 M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" /></svg>
              <input autoFocus value={q} onChange={e => { setQ(e.target.value); setType("All"); }} placeholder="Search clients, projects, invoices, evidence, reports, people…" style={{ flex: 1, border: 0, outline: 0, background: "none", fontSize: 15, color: "var(--ink)" }} />
              {q && <button onClick={() => setQ("")} style={{ border: 0, background: "none", color: "var(--faint)", cursor: "pointer", fontSize: 16 }}>×</button>}
            </label>
          </div>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>{index.length} records indexed across 19 types</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          {!q ? <><span style={{ fontSize: 12, color: "var(--faint)", marginRight: 4 }}>Try</span>{tries.map(t => <button key={t} className="gg-chip" onClick={() => setQ(t)} style={{ height: 26, padding: "0 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--body)", fontSize: 12, cursor: "pointer" }}>{t}</button>)}</>
            : <>{["All"].concat(types).map(t => {
              const on = t === type, n = t === "All" ? matches.length : matches.filter(m => m.type === t).length;
              return <button key={t} onClick={() => setType(t)} style={{ height: 26, padding: "0 11px", borderRadius: 999, border: "1px solid " + (on ? "var(--accent-line)" : "var(--border)"), background: on ? "var(--accent-soft)" : "none", color: on ? "var(--accent)" : "var(--dim)", fontSize: 12, cursor: "pointer" }}>{t} {n}</button>;
            })}</>}
        </div>
      </Card>

      {q && matches.length === 0 && <Card><Empty title={"Nothing matches “" + q + "”"} sub="Search covers names, ids, statuses and descriptions across every record type." /></Card>}
      {!q && (
        <Grid cols="repeat(4,minmax(0,1fr))" gap={10}>
          {[["Clients", CLIENTS.length, "Client"], ["Projects", PROJECTS.length, "Project"], ["Invoices", INVOICES.length, "Invoice"], ["Evidence items", EVIDENCE.length, "Evidence"],
            ["Opportunities", OPPORTUNITIES.length, "Opportunity"], ["Reports", REPORTS.length, "Report"], ["Site visits", SITE_VISITS.length, "Site visit"], ["Tasks", TASKS.length, "Task"]].map(([k, n]) => (
            <Stat key={k as string} label={k as string} value={n as number} />
          ))}
        </Grid>
      )}
      <Grid cols="repeat(2,minmax(0,1fr))" gap={14}>
        {grouped.map(([t, list]) => (
          <Card key={t} flush title={t} right={<Badge>{list.length}</Badge>}>
            {list.slice(0, 8).map((h, i) => (
              <div key={h.type + h.id} className="gg-row" onClick={h.open} style={{ padding: "10px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{h.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{h.sub}</div>
              </div>
            ))}
            {list.length > 8 && <div style={{ padding: "8px 18px", fontSize: 11.5, color: "var(--faint)", borderTop: "1px solid var(--border)" }}>{list.length - 8} more. Narrow the search to see them.</div>}
          </Card>
        ))}
      </Grid>
    </div>
  );
}

export default function RecordsGG({ tab }: { tab: string }) {
  return (
    <div style={{ padding: "0 22px", animation: "pageIn .5s var(--ease) both" }}>
      {tab === "relationships" ? <Relationships /> : <SearchAll />}
    </div>
  );
}
