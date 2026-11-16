/* Global Green dashboards: Executive, Sales, Delivery, Finance, Capacity.
   Sits below the Dashboard KPI band. Every chart is calculated from seeded
   records (../data) and live demo state (../store). */
import { useState, type ReactNode } from "react";
import {
  METRICS, PROJECTS, OPPORTUNITIES, PROPOSALS, INVOICES, RECEIPTS, SITE_VISITS, STAFF, MILESTONES, REPORTS,
  CAMPAIGNS, ACTIVITY, LINKEDIN_POSTS, MEETINGS, EVIDENCE, EXPENSE_BATCH, QBO_TXNS, SERVICES,
  client, project, invoice, staff, agent, eur, eurK, sum, fmtDate, fmtDay, daysAgo, daysUntil, TODAY,
  type StaffId, type ProjectStatus, type Stage
} from "../data";
import { useGG, navigate, openRecord, decide, pendingApprovals, evidenceStatus, postStatus, allTasks, taskStatusOf, stageOf } from "../store";
import {
  Page, PageHead, Grid, Card, Badge, Btn, Seg, Table, RecordChip, AIBox, Timeline, Bars, HBars, Donut, Legend,
  LineChart, Stack, Meter, Avatar, Person, SimTag, MONO_LABEL, TONE, type Tone
} from "../ui";
import { ApprovalDrawer } from "./ApprovalsPanel";
import {
  revenueSeries, overdueInvoices, ageingBuckets, pipelineByStage, leadsPerWeek, cashForecast,
  WEEKS, planParts, weekLoads, backlogDays, serviceColor
} from "./dash/calc";

const STATUS: Record<ProjectStatus, [string, Tone, string]> = {
  on_track: ["On track", "ok", "var(--ok)"],
  at_risk: ["At risk", "warn", "var(--warn)"],
  blocked: ["Blocked", "bad", "var(--bad)"]
};
const STAGE_COLOR: Record<string, string> = {
  "New lead": "var(--dim)", "Discovery": "var(--gg-blue)", "Qualified": "#c8b4f0", "Proposal sent": "var(--gg-lime)", "Negotiation": "var(--gg-green)"
};

/* small shared bits ──────────────────────────────────────────────────────── */
function MiniRow({ left, mid, right, onClick, tone }: { left: ReactNode; mid?: ReactNode; right?: ReactNode; onClick?: () => void; tone?: Tone }) {
  return (
    <div className={onClick ? "gg-row" : undefined} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", margin: "0 -10px", borderRadius: 10, cursor: onClick ? "pointer" : "default" }}>
      {tone && <span style={{ width: 7, height: 7, borderRadius: 4, background: TONE[tone][0], flex: "none" }} />}
      <div style={{ flex: 1, minWidth: 0 }}>{left}{mid && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2, lineHeight: 1.4 }}>{mid}</div>}</div>
      {right && <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>{right}</div>}
    </div>
  );
}
const Title = ({ children }: { children: ReactNode }) => <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</div>;
const Num = ({ children, color }: { children: ReactNode; color?: string }) => <span style={{ fontSize: 12.5, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: color || "var(--ink)" }}>{children}</span>;
const Note = ({ children }: { children: ReactNode }) => <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 12, lineHeight: 1.5 }}>{children}</div>;

function RevenueCard({ title = "Invoiced revenue by month", sub }: { title?: string; sub?: string }) {
  const rev = revenueSeries();
  const oct = rev.find(r => r.label === "Oct")!;
  const sep = rev.find(r => r.label === "Sep")!;
  const change = Math.round(((oct.value - sep.value) / sep.value) * 100);
  return (
    <Card title={title} sub={sub || "From QuickBooks invoices (simulated feed). November is month to date."}
      right={<Badge tone={change >= 0 ? "ok" : "bad"}>{"Oct " + eurK(oct.value) + (change >= 0 ? " · +" : " · ") + change + "% vs Sep"}</Badge>}>
      <Bars data={rev.map(r => [r.label, r.value, r.partial ? "color-mix(in srgb, var(--gg-blue) 55%, transparent)" : r.label === "Oct" ? "var(--gg-green)" : undefined] as [string, number, string?])} format={eurK} height={150} highlight="Oct" />
    </Card>
  );
}

/* ── Executive ───────────────────────────────────────────────────────────── */
function Executive() {
  const s = useGG();
  const [apr, setApr] = useState<string | null>(null);
  const pipe = pipelineByStage(s);
  const pending = pendingApprovals(s);
  const ageing = ageingBuckets();
  const od = overdueInvoices();
  const westhaven = invoice("INV-1048");
  const glenMissing = EVIDENCE.filter(e => e.projectId === "GG-241" && evidenceStatus(s, e) !== "received");
  const oakMissing = EVIDENCE.filter(e => e.projectId === "GG-252" && evidenceStatus(s, e) !== "received");
  const carrickBlocked = MILESTONES.filter(m => m.projectId === "GG-236" && m.status === "blocked");
  const liffey = PROPOSALS.find(p => p.id === "P-034")!;
  const exceptions = RECEIPTS.filter(r => r.status === "exception");
  const visitsWeek = SITE_VISITS.filter(v => v.date >= TODAY && v.date <= "2026-11-22").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const recent = s.log.concat(ACTIVITY.filter(a => a.source === "Agent")).slice(0, 6);

  const risks = [
    { id: "INV-1048", tone: "bad" as Tone, apr: "APR-01", title: "Westhaven Retail Parks: " + eur(westhaven.amount) + " overdue " + daysAgo(westhaven.due) + " days",
      detail: "Largest debtor. One reminder sent. Finance Review drafted a second reminder for Emma.", action: "Review reminder" },
    { id: "GG-241", tone: "warn" as Tone, apr: "APR-03", title: "Glenmere Foods: " + glenMissing.length + " meter-data files missing",
      detail: "Site visit " + fmtDay(project("GG-241").nextDate) + ", report due " + fmtDate(project("GG-241").due) + ". Energy balance cannot close without them.", action: "Review request" },
    { id: "GG-236", tone: "bad" as Tone, apr: "APR-06", title: "Carrick Logistics: " + carrickBlocked.length + " ISO 50001 milestones blocked",
      detail: "Waiting on 12 months of client consumption data. Target milestone " + fmtDate("2026-11-27") + ".", action: "Review escalation" },
    { id: "L-034", tone: "warn" as Tone, apr: "APR-02", title: "Liffey Packaging: " + eur(liffey.value) + " proposal unanswered " + daysAgo(liffey.sent!) + " days",
      detail: "Opened twice. Sales & Outreach drafted a tailored follow-up for Louise.", action: "Review follow-up" },
    { id: "GG-252", tone: "warn" as Tone, apr: "APR-04", title: "Oakfield Solar: " + oakMissing.length + " ecology documents outstanding",
      detail: "Walkover " + fmtDay("2026-11-19") + ". Assessment pack due " + fmtDate("2026-12-02") + ".", action: "Review request" },
    { id: "EXP-OCT-11", tone: "neutral" as Tone, apr: "APR-05", title: "October expenses: " + exceptions.length + " exceptions, " + eur(sum(exceptions.map(r => r.amount))),
      detail: EXPENSE_BATCH.matched + " of " + EXPENSE_BATCH.receipts + " receipts matched. Exceptions routed for accountant review.", action: "Review routing" }
  ];

  const briefing = "There are " + METRICS.projects + " active projects, with " + METRICS.atRisk + " at risk and " + METRICS.blocked + " blocked. "
    + "Westhaven Retail Parks has an " + eur(westhaven.amount) + " invoice overdue by " + daysAgo(westhaven.due) + " days. "
    + "Glenmere Foods is missing " + glenMissing.length + " meter-data files ahead of Wednesday's site visit. "
    + pending.length + " recommended actions are waiting for approval.";

  return (
    <>
      <PageHead title="Executive overview" sub="One view of revenue, pipeline, delivery and cash, with the exceptions that need a decision this week."
        right={<><SimTag>Demo snapshot · 16 Nov 2026</SimTag><Btn kind="primary" onClick={() => navigate("Agents", "Approvals")}>{"Review " + pending.length + " approvals"}</Btn></>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AIBox title="Morning briefing for Niall" actions={<>
          <Btn small kind="primary" onClick={() => navigate("Agents", "Approvals")}>Open approvals</Btn>
          <Btn small onClick={() => openRecord("GG-241")}>Glenmere project</Btn>
          <Btn small onClick={() => openRecord("INV-1048")}>Westhaven invoice</Btn>
        </>}>{briefing}</AIBox>

        <Grid cols="minmax(0,1.7fr) minmax(0,1fr) minmax(0,1fr)">
          <RevenueCard />
          <Card title="Delivery health" sub={METRICS.projects + " active projects from Monday.com (simulated)"}
            right={<Btn small kind="quiet" onClick={() => navigate("Projects", "Overview")}>Projects</Btn>}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Donut size={132} thickness={16} center={METRICS.projects} sub="active"
                parts={[["On track", METRICS.onTrack, "var(--ok)"], ["At risk", METRICS.atRisk, "var(--warn)"], ["Blocked", METRICS.blocked, "var(--bad)"]]} />
              <Legend items={[["On track", METRICS.onTrack, "var(--ok)"], ["At risk", METRICS.atRisk, "var(--warn)"], ["Blocked", METRICS.blocked, "var(--bad)"]]} />
            </div>
            <Note>{"Active fees under delivery: " + eur(METRICS.activeValue)}</Note>
          </Card>
          <Card title="Pipeline by stage" sub={pipe.openCount + " open opportunities · " + eur(pipe.open)}
            right={<Btn small kind="quiet" onClick={() => navigate("Sales", "Pipeline")}>Pipeline</Btn>}>
            <HBars format={eurK} data={pipe.rows.map(r => [r.stage + " (" + r.count + ")", r.value, STAGE_COLOR[r.stage]] as [string, number, string])} />
            <Note>{"Weighted by probability: " + eur(Math.round(pipe.weighted))}</Note>
          </Card>
        </Grid>

        <Grid cols="minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)">
          <Card title="Urgent risks" sub="Exceptions Pulse found overnight. Each links to its record and the drafted action."
            right={<Badge tone="bad">{risks.filter(r => !s.approvals[r.apr]).length + " open"}</Badge>}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {risks.map(r => {
                const d = s.approvals[r.apr];
                return (
                  <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 0", borderTop: "1px solid var(--border)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, flex: "none", background: d === "approved" ? "var(--ok)" : TONE[r.tone][0] }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.45 }}>{r.detail}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}><RecordChip id={r.id} /></div>
                    </div>
                    {d ? <Badge tone={d === "approved" ? "ok" : "neutral"}>{d === "approved" ? "Approved (demo)" : "Rejected"}</Badge>
                      : <Btn small onClick={() => setApr(r.apr)}>{r.action}</Btn>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Debtors" sub={METRICS.overdueCount + " overdue invoices · " + eur(METRICS.overdueValue)}
            right={<Btn small kind="quiet" onClick={() => navigate("Finance", "Invoices")}>Invoices</Btn>}>
            <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", background: "var(--track)" }}>
              {ageing.map((b, i) => <span key={b.label} title={b.label + ": " + eur(b.value)} style={{ width: (b.value / METRICS.overdueValue) * 100 + "%", background: ["var(--warn)", "color-mix(in srgb, var(--bad) 70%, var(--warn))", "var(--bad)"][i] }} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
              {ageing.map(b => <div key={b.label}><div style={MONO_LABEL}>{b.label}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eurK(b.value)}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>{b.count + " invoice" + (b.count === 1 ? "" : "s")}</div></div>)}
            </div>
            <div style={{ marginTop: 12 }}>
              {od.slice(0, 4).map(i => (
                <MiniRow key={i.id} onClick={() => openRecord(i.id)} left={<Title>{client(i.clientId).name}</Title>} mid={i.id + " · due " + fmtDate(i.due)}
                  right={<><Badge tone={i.days > 30 ? "bad" : "warn"}>{i.days + "d"}</Badge><Num>{eur(i.amount)}</Num></>} />
              ))}
            </div>
          </Card>
          <Card title="Waiting for approval" sub="Drafted by agents. Nothing leaves Global Green until a person approves."
            right={<Badge tone={pending.length ? "warn" : "ok"}>{pending.length}</Badge>}>
            {pending.slice(0, 6).map(a => (
              <MiniRow key={a.id} onClick={() => setApr(a.id)} left={<Title>{a.title}</Title>}
                mid={agent(a.agentId).name + " · for " + staff(a.owner).first} right={<Avatar id={a.owner} size={22} />} />
            ))}
            {pending.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)", padding: "10px 0" }}>All recommended actions have a decision.</div>}
            {pending.length > 6 && <Btn small kind="quiet" onClick={() => navigate("Agents", "Approvals")}>{"See all " + pending.length}</Btn>}
          </Card>
        </Grid>

        <Grid cols="minmax(0,1.2fr) minmax(0,1fr)">
          <Card title="Site assessments this week" sub={visitsWeek.length + " visits scheduled"}
            right={<Btn small kind="quiet" onClick={() => navigate("Sites", "Schedule")}>Schedule</Btn>}>
            {visitsWeek.map(v => {
              const tone: Tone = v.status === "at_risk" || v.status === "conflict" ? "bad" : v.status === "evidence_pending" ? "warn" : "ok";
              const label = { confirmed: "Ready", in_progress: "On site now", at_risk: "At risk", evidence_pending: "Evidence pending", conflict: "Needs surveyor", completed: "Completed" }[v.status];
              return <MiniRow key={v.id} onClick={() => openRecord(v.id)} left={<Title>{fmtDay(v.date) + " " + v.time + " · " + client(v.clientId).name}</Title>}
                mid={v.type + " · " + v.engineers.map(e => staff(e).first).join(", ")} right={<Badge tone={tone} dot>{label}</Badge>} />;
            })}
          </Card>
          <Card title="Agent activity" sub="What the agents did, most recent first" right={<Btn small kind="quiet" onClick={() => navigate("Agents", "Runs")}>All runs</Btn>}>
            <Timeline items={recent.map(e => ({ when: e.when.slice(11) + " " + fmtDate(e.when.slice(0, 10)), title: e.title, detail: e.actor + " · " + e.detail, tone: e.alert ? "warn" as Tone : "accent" as Tone }))} />
          </Card>
        </Grid>
      </div>
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </>
  );
}

/* ── Sales ───────────────────────────────────────────────────────────────── */
function SalesDash() {
  const s = useGG();
  const pipe = pipelineByStage(s);
  const maxStage = Math.max(1, ...pipe.rows.map(r => r.value));
  const weeks = leadsPerWeek();
  const sources: Record<string, number> = {};
  OPPORTUNITIES.forEach(o => { sources[o.source] = (sources[o.source] || 0) + 1; });
  const srcColors = ["var(--gg-green)", "var(--gg-blue)", "var(--gg-lime)", "#c8b4f0", "var(--warn)", "var(--dim)"];
  const srcParts = Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([k, v], i) => [k, v, srcColors[i % srcColors.length]] as [string, number, string]);
  const ageing = PROPOSALS.filter(p => (p.status === "sent" || p.status === "negotiation") && p.sent).map(p => ({ ...p, days: daysAgo(p.sent!) })).sort((a, b) => b.days - a.days);
  const openOpps = OPPORTUNITIES.filter(o => { const st = stageOf(s, o.id) as Stage; return st !== "Won" && st !== "Lost"; });
  const convert = openOpps.map(o => ({ ...o, weighted: o.value * o.probability / 100 })).sort((a, b) => b.weighted - a.weighted);
  const done = CAMPAIGNS.filter(c => c.status === "completed");
  const cmp7 = CAMPAIGNS.find(c => c.id === "CMP-07")!;
  const published = LINKEDIN_POSTS.filter(p => p.status === "published");
  const drafts = LINKEDIN_POSTS.filter(p => postStatus(s, p) !== "published");
  const upcoming = MEETINGS.filter(m => m.oppId && m.when >= TODAY).sort((a, b) => (a.when + a.time).localeCompare(b.when + b.time));

  return (
    <>
      <PageHead title="Sales dashboard" sub="Lead flow, pipeline movement, proposal ageing and outreach. Stage changes made in Sales & Outreach show here straight away."
        right={<Btn kind="primary" onClick={() => navigate("Sales", "Pipeline")}>Open pipeline</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Grid cols="minmax(0,1.5fr) minmax(0,1fr)">
          <Card title="Pipeline by stage" sub={pipe.openCount + " open · " + eur(pipe.open) + " · weighted " + eur(Math.round(pipe.weighted))}
            right={pipe.won.length || pipe.lost.length ? <Badge tone="ok">{pipe.won.length + " won · " + pipe.lost.length + " lost (demo)"}</Badge> : <SimTag>OnePageCRM (simulated)</SimTag>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {pipe.rows.map(r => (
                <div key={r.stage} className="gg-row" onClick={() => navigate("Sales", "Pipeline")} style={{ display: "grid", gridTemplateColumns: "120px 1fr 92px 92px", gap: 12, alignItems: "center", padding: "6px 8px", margin: "0 -8px", borderRadius: 10, cursor: "pointer" }}>
                  <div style={{ fontSize: 12.5 }}>{r.stage}<span style={{ color: "var(--faint)" }}>{" · " + r.count}</span></div>
                  <div style={{ height: 22, borderRadius: 7, background: "var(--track)", overflow: "hidden" }}>
                    <div style={{ width: (r.value / maxStage) * 100 + "%", height: "100%", background: STAGE_COLOR[r.stage], opacity: .85, borderRadius: 7, transition: "width .5s var(--ease)" }} />
                  </div>
                  <Num>{eur(r.value)}</Num>
                  <span style={{ fontSize: 11.5, color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{"≈ " + eurK(Math.round(r.weighted))}</span>
                </div>
              ))}
            </div>
            <Note>Right-hand figure is value weighted by stage probability.</Note>
          </Card>
          <Card title="Where leads come from" sub={OPPORTUNITIES.length + " open opportunities by source"}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Donut size={128} thickness={16} center={OPPORTUNITIES.length} sub="leads" parts={srcParts} />
              <Legend items={srcParts.map(p => [p[0], p[1], p[2]] as [string, ReactNode, string])} />
            </div>
            <Note>Calendly bookings create leads automatically; email campaign and LinkedIn leads are matched by Sales & Outreach.</Note>
          </Card>
        </Grid>

        <Grid cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)">
          <Card title="Lead movement" sub="Open opportunities by the week they were created">
            <Bars data={weeks.map(w => [w[0], w[1]] as [string, number])} height={120} highlight={weeks[weeks.length - 2]?.[0]} />
            <Note>{weeks.slice(-5).reduce((a, w) => a + w[1], 0) + " of " + OPPORTUNITIES.length + " were opened in the last five weeks."}</Note>
          </Card>
          <Card title="Proposal ageing" sub="Days since each open proposal was sent" right={<Btn small kind="quiet" onClick={() => navigate("Sales", "Proposals")}>Proposals</Btn>}>
            <HBars max={Math.max(14, ...ageing.map(a => a.days))} format={n => n + " days"}
              data={ageing.map(a => [a.company + " · " + eurK(a.value), a.days, a.days > 10 ? "var(--bad)" : a.days > 7 ? "var(--warn)" : "var(--gg-green)", a.status === "negotiation" ? <Badge tone="info">v{a.version}</Badge> : undefined] as [string, number, string, ReactNode])} />
            <Note>Follow-up rule: Sales & Outreach drafts a nudge after 7 days without a reply.</Note>
          </Card>
          <Card title="Potential conversions" sub={"Most likely revenue, value × probability"}>
            {convert.slice(0, 6).map(o => (
              <MiniRow key={o.id} onClick={() => openRecord(o.id)} left={<Title>{o.company}</Title>} mid={stageOf(s, o.id) + " · " + o.probability + "% · close " + fmtDate(o.expectedClose)}
                right={<Num>{eurK(Math.round(o.weighted))}</Num>} />
            ))}
          </Card>
        </Grid>

        <Grid cols="minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr)">
          <Card title="Email outreach" sub="Campaign results (simulated tracking). Nothing is sent from this demo." right={<Btn small kind="quiet" onClick={() => navigate("Sales", "Email Campaigns")}>Campaigns</Btn>}>
            {CAMPAIGNS.map(c => (
              <MiniRow key={c.id} onClick={() => openRecord(c.id)} left={<Title>{c.name}</Title>}
                mid={c.sent ? c.sent + " sent · " + Math.round((c.opens! / c.sent) * 100) + "% opened · " + c.replies + " replies · " + c.meetings + " meetings" : c.size + " prospects · " + c.steps.length + "-step sequence · not scheduled"}
                right={c.status === "completed" ? <Badge tone="ok">Completed</Badge> : s.campaigns[c.id] === "approved" ? <Badge tone="info">Approved · ready</Badge> : <Badge tone="warn">Draft · needs approval</Badge>} />
            ))}
            <Note>{"Completed campaigns: " + sum(done.map(c => c.sent || 0)) + " emails, " + sum(done.map(c => c.replies || 0)) + " replies, " + sum(done.map(c => c.meetings || 0)) + " meetings. " + cmp7.id + " targets " + cmp7.size + " prospects."}</Note>
          </Card>
          <Card title="LinkedIn" sub="Proposed integration. Drafts only; posting needs approval.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              <div><div style={MONO_LABEL}>Impressions</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{sum(published.map(p => p.impressions || 0)).toLocaleString("en-IE")}</div></div>
              <div><div style={MONO_LABEL}>Reactions</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{sum(published.map(p => p.reactions || 0))}</div></div>
              <div><div style={MONO_LABEL}>Comments</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{sum(published.map(p => p.comments || 0))}</div></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {drafts.slice(0, 3).map(p => (
                <MiniRow key={p.id} onClick={() => openRecord(p.id)} left={<Title>{p.title}</Title>} mid={fmtDay(p.date) + " · " + staff(p.author).first}
                  right={<Badge tone={postStatus(s, p) === "approved" ? "ok" : postStatus(s, p) === "awaiting_approval" ? "warn" : "neutral"}>{postStatus(s, p).replace("_", " ")}</Badge>} />
              ))}
            </div>
          </Card>
          <Card title="Discovery meetings" sub="Booked through Calendly (simulated)">
            {upcoming.map(m => (
              <MiniRow key={m.id} onClick={() => m.oppId && openRecord(m.oppId)} left={<Title>{m.org}</Title>} mid={fmtDay(m.when) + " " + m.time + " · " + m.with}
                right={<Avatar id={m.owner} size={22} />} />
            ))}
            <Note>{upcoming.length + " discovery calls booked. Sales & Outreach prepares a briefing note for each the day before."}</Note>
          </Card>
        </Grid>
      </div>
    </>
  );
}

/* ── Delivery ────────────────────────────────────────────────────────────── */
function Delivery() {
  const s = useGG();
  const [filter, setFilter] = useState<"All" | "On track" | "At risk" | "Blocked">("All");
  const bySvc = SERVICES.map(svc => {
    const ps = PROJECTS.filter(p => p.service === svc);
    return { svc, count: ps.length, value: sum(ps.map(p => p.value)) };
  }).filter(x => x.count).sort((a, b) => b.value - a.value);
  const lateMs = MILESTONES.filter(m => m.status === "late" || m.status === "blocked" || (!m.done && m.planned < TODAY))
    .sort((a, b) => a.planned.localeCompare(b.planned));
  const reports = REPORTS.filter(r => r.stage !== "Delivered").sort((a, b) => a.due.localeCompare(b.due));
  const deps = PROJECTS.filter(p => p.status !== "on_track").sort((a, b) => (a.status === "blocked" ? 0 : 1) - (b.status === "blocked" ? 0 : 1));
  const key: Record<string, ProjectStatus | null> = { "All": null, "On track": "on_track", "At risk": "at_risk", "Blocked": "blocked" };
  const rows = PROJECTS.filter(p => !key[filter] || p.status === key[filter]).slice().sort((a, b) => a.due.localeCompare(b.due));
  const openTasksFor = (pid: string) => allTasks(s).filter(t => t.projectId === pid && taskStatusOf(s, t) !== "Done").length;

  return (
    <>
      <PageHead title="Delivery dashboard" sub="Project health, milestones, reports and the client dependencies holding work up."
        right={<Btn kind="primary" onClick={() => navigate("Projects", "Active Projects")}>Open projects</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Grid cols="minmax(0,.9fr) minmax(0,1fr) minmax(0,1.3fr)">
          <Card title="Project status" sub={METRICS.projects + " active"}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Donut size={126} thickness={16} center={METRICS.onTrack + "/" + METRICS.projects} sub="on track"
                parts={[["On track", METRICS.onTrack, "var(--ok)"], ["At risk", METRICS.atRisk, "var(--warn)"], ["Blocked", METRICS.blocked, "var(--bad)"]]} />
              <Legend items={[["On track", METRICS.onTrack, "var(--ok)"], ["At risk", METRICS.atRisk, "var(--warn)"], ["Blocked", METRICS.blocked, "var(--bad)"]]} />
            </div>
          </Card>
          <Card title="Fees by service line" sub="Active project value">
            <HBars format={eurK} data={bySvc.map(x => [x.svc + " (" + x.count + ")", x.value, serviceColor(x.svc)] as [string, number, string])} />
          </Card>
          <Card title="Dependency alerts" sub="Client inputs or access holding work up" right={<Badge tone="bad">{deps.length}</Badge>}>
            {deps.map(p => (
              <MiniRow key={p.id} tone={STATUS[p.status][1]} onClick={() => openRecord(p.id)}
                left={<Title>{p.id + " " + client(p.clientId).name}</Title>} mid={p.dependency || p.issue}
                right={<><Badge tone={STATUS[p.status][1]}>{STATUS[p.status][0]}</Badge><Avatar id={p.owner} size={22} /></>} />
            ))}
          </Card>
        </Grid>

        <Grid cols="minmax(0,1fr) minmax(0,1.2fr)">
          <Card title="Late and blocked milestones" sub={lateMs.length + " milestones past plan or waiting on a dependency"} right={<Btn small kind="quiet" onClick={() => navigate("Projects", "Milestones")}>Milestones</Btn>}>
            <Timeline items={lateMs.map(m => ({
              when: "planned " + fmtDate(m.planned),
              title: <span style={{ cursor: "pointer" }} onClick={() => openRecord(m.projectId)}>{m.projectId + " · " + m.title}</span>,
              detail: (m.dependsOn ? "Waiting on: " + m.dependsOn + ". " : "") + "Owner " + staff(m.owner).name + ".",
              tone: (m.status === "blocked" ? "bad" : "warn") as Tone,
              right: <Badge tone={m.status === "blocked" ? "bad" : "warn"}>{m.status === "blocked" ? "Blocked" : daysAgo(m.planned) + "d late"}</Badge>
            }))} />
          </Card>
          <Card flush title="Upcoming reports" sub="Every report in progress, by due date. Engineers sign off before anything is issued." right={<Btn small kind="quiet" onClick={() => navigate("Reports", "Report Pipeline")}>Report pipeline</Btn>}>
            <div style={{ padding: "4px 18px 10px" }}>
              {reports.map(r => (
                <MiniRow key={r.id} onClick={() => openRecord(r.id)} left={<Title>{r.title}</Title>}
                  mid={r.stage + " · " + staff(r.owner).first + ", reviewer " + staff(r.reviewer).first + " · " + r.version}
                  right={<>{r.missing ? <Badge tone="bad">{r.missing + " missing"}</Badge> : null}<span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: daysUntil(r.due) <= 7 ? "var(--warn)" : "var(--body)", width: 48, textAlign: "right" }}>{fmtDate(r.due)}</span></>} />
              ))}
            </div>
          </Card>
        </Grid>

        <Card flush title="Project status" sub="All active projects by due date. Click a row for the project record."
          right={<Seg options={["All", "On track", "At risk", "Blocked"] as const} value={filter} onChange={setFilter}
            counts={{ "All": METRICS.projects, "On track": METRICS.onTrack, "At risk": METRICS.atRisk, "Blocked": METRICS.blocked }} />}>
          <Table rowKey={p => p.id} onRow={p => openRecord(p.id)} rows={rows}
            cols={[
              { key: "p", label: "Project", width: "2.3fr", render: p => <div style={{ minWidth: 0 }}><div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client(p.clientId).name}</div><div style={{ fontSize: 11.5, color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.id + " · " + p.title}</div></div> },
              { key: "o", label: "Owner", width: "1.2fr", render: p => <Person id={p.owner} /> },
              { key: "n", label: "Next", width: "1.4fr", render: p => <span style={{ color: "var(--dim)" }}>{p.nextMilestone + " · " + fmtDate(p.nextDate)}</span> },
              { key: "pr", label: "Progress", width: "1fr", render: p => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Meter value={p.progress} tone={STATUS[p.status][1]} /><span style={{ fontSize: 11.5, color: "var(--dim)", width: 30 }}>{p.progress + "%"}</span></div> },
              { key: "b", label: "Hours used", width: ".8fr", align: "right", render: p => { const pc = Math.round((p.hoursSpent / p.budgetHours) * 100); return <span style={{ color: pc > p.progress + 10 ? "var(--warn)" : "var(--body)" }}>{pc + "%"}</span>; } },
              { key: "t", label: "Tasks", width: ".5fr", align: "right", render: p => openTasksFor(p.id) || <span style={{ color: "var(--faint)" }}>0</span> },
              { key: "v", label: "Fee", width: ".8fr", align: "right", render: p => eur(p.value) },
              { key: "d", label: "Due", width: ".7fr", align: "right", render: p => fmtDate(p.due) },
              { key: "s", label: "Status", width: ".9fr", align: "right", render: p => <Badge tone={STATUS[p.status][1]} dot>{STATUS[p.status][0]}</Badge> }
            ]} />
        </Card>
      </div>
    </>
  );
}

/* ── Finance ─────────────────────────────────────────────────────────────── */
function FinanceDash() {
  const s = useGG();
  const od = overdueInvoices();
  const ageing = ageingBuckets();
  const oct = INVOICES.filter(i => i.issued.startsWith("2026-10"));
  const octBy = (st: string) => sum(oct.filter(i => i.status === st).map(i => i.amount));
  const matched = RECEIPTS.filter(r => r.status === "matched"), exc = RECEIPTS.filter(r => r.status === "exception");
  const cats: Record<string, number> = {};
  RECEIPTS.forEach(r => { cats[r.category] = (cats[r.category] || 0) + r.amount; });
  const cf = cashForecast();
  const reviewed = Object.keys(s.receipts).length;
  const exceptions = [
    ...od.filter(i => i.days > 30).map(i => ({ id: i.id, tone: "bad" as Tone, title: client(i.clientId).name + " invoice " + i.days + " days overdue", detail: eur(i.amount) + ". Reminder drafted for review." })),
    ...exc.map(r => ({ id: "EXP-OCT-11", tone: "warn" as Tone, title: r.vendor + " · " + eur(r.amount, 2), detail: r.issue || "" })),
    ...QBO_TXNS.filter(t => t.state === "unmatched").map(t => ({ id: "EXP-OCT-11", tone: "neutral" as Tone, title: "Unmatched bank line: " + t.description + " " + eur(Math.abs(t.amount), 2), detail: "No receipt yet. Likely a software subscription; needs a receipt or a category." }))
  ];

  return (
    <>
      <PageHead title="Finance dashboard" sub="Invoicing, debtors, expenses and cash. Pulse reads QuickBooks Online (simulated) and suggests; nothing is posted or reconciled."
        right={<><SimTag>QuickBooks Online · read only (simulated)</SimTag><Btn kind="primary" onClick={() => navigate("Finance", "Overview")}>Open finance</Btn></>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Grid cols="minmax(0,1.7fr) minmax(0,1fr)">
          <RevenueCard title="Invoicing by month" />
          <Card title="October invoices" sub={oct.length + " issued · " + eur(sum(oct.map(i => i.amount)))}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Donut size={128} thickness={16} center={eurK(sum(oct.map(i => i.amount)))} sub="invoiced"
                parts={[["Paid", octBy("paid"), "var(--ok)"], ["Not yet due", octBy("current"), "var(--gg-blue)"], ["Overdue", octBy("overdue"), "var(--bad)"]]} />
              <Legend items={[["Paid", eurK(octBy("paid")), "var(--ok)"], ["Not yet due", eurK(octBy("current")), "var(--gg-blue)"], ["Overdue", eurK(octBy("overdue")), "var(--bad)"]]} />
            </div>
          </Card>
        </Grid>

        <Grid cols="minmax(0,1.2fr) minmax(0,.8fr) minmax(0,1fr)">
          <Card title="Overdue by client" sub={od.length + " invoices · " + eur(METRICS.overdueValue)} right={<Btn small kind="quiet" onClick={() => navigate("Finance", "Invoices")}>Invoices</Btn>}>
            <HBars format={n => eur(n)} data={od.map(i => [client(i.clientId).name, i.amount, i.days > 30 ? "var(--bad)" : i.days > 15 ? "color-mix(in srgb, var(--bad) 60%, var(--warn))" : "var(--warn)", <span style={{ fontSize: 11, color: "var(--faint)" }}>{i.days + "d"}</span>] as [string, number, string, ReactNode])} />
          </Card>
          <Card title="Debt ageing" sub="Days past due">
            <Bars height={130} format={eurK} data={ageing.map((b, i) => [b.label, b.value, ["var(--warn)", "color-mix(in srgb, var(--bad) 60%, var(--warn))", "var(--bad)"][i]] as [string, number, string])} />
            <Note>{"Average days overdue: " + Math.round(sum(od.map(i => i.days * i.amount)) / METRICS.overdueValue) + " (value weighted)."}</Note>
          </Card>
          <Card title="October expenses" sub={EXPENSE_BATCH.id + " · " + RECEIPTS.length + " receipts · " + eur(sum(RECEIPTS.map(r => r.amount)))} right={<RecordChip id="EXP-OCT-11" label="Open batch" />}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut size={104} thickness={14} center={matched.length + "/" + RECEIPTS.length} sub="matched"
                parts={[["Suggested matches", sum(matched.map(r => r.amount)), "var(--gg-green)"], ["Exceptions", sum(exc.map(r => r.amount)), "var(--warn)"]]} />
              <Legend items={[["Suggested matches", eur(sum(matched.map(r => r.amount))), "var(--gg-green)"], ["Exceptions", eur(sum(exc.map(r => r.amount))), "var(--warn)"]]} />
            </div>
            <div style={{ marginTop: 12 }}>
              <HBars format={n => eur(n)} data={Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k, Math.round(v), "var(--gg-blue)"] as [string, number, string])} />
            </div>
            <Note>{reviewed ? reviewed + " receipt decisions recorded in the demo." : "Matches are suggestions for Emma and the accountant. Nothing is posted."}</Note>
          </Card>
        </Grid>

        <Grid cols="minmax(0,1.4fr) minmax(0,1fr)">
          <Card title="Cash expectations, next 90 days" sub={"Opening cash " + eur(cf.opening) + " (simulated). Operating costs " + eur(cf.opex) + " per 30 days."} right={<Btn small kind="quiet" onClick={() => navigate("Finance", "Cash Forecast")}>Forecast</Btn>}>
            <LineChart labels={["Today"].concat(cf.rows.map(r => r.label))} format={eurK} height={150}
              series={[
                { name: "Projected cash", color: "var(--gg-green)", values: [cf.opening].concat(cf.rows.map(r => Math.round(r.closing))) },
                { name: "Expected receipts", color: "var(--gg-blue)", dashed: true, values: [0].concat(cf.rows.map(r => Math.round(r.receipts))) }
              ]} />
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr repeat(4,1fr)", gap: 8, marginTop: 10, fontSize: 12 }}>
              {["Window", "Open invoices", "Projected fees", "Costs", "Closing cash"].map(h => <div key={h} style={MONO_LABEL}>{h}</div>)}
              {cf.rows.map(r => [
                <div key={r.label + "a"} style={{ color: "var(--body)" }}>{r.label}</div>,
                <Num key={r.label + "b"}>{eurK(Math.round(r.invoices))}</Num>,
                <Num key={r.label + "c"}>{eurK(Math.round(r.projected))}</Num>,
                <Num key={r.label + "d"} color="var(--dim)">{"−" + eurK(r.opex)}</Num>,
                <Num key={r.label + "e"} color={r.net < 0 ? "var(--warn)" : "var(--ink)"}>{eurK(Math.round(r.closing))}</Num>
              ])}
            </div>
            <Note>{"Basis: open invoices by due date with overdue assumed collected in the first window; remaining fees on active projects invoiced at completion on 30-day terms. A further " + eurK(Math.round(cf.beyond)) + " of fees falls after 90 days."}</Note>
          </Card>
          <Card title="Financial exceptions" sub="Items a person should look at" right={<Badge tone="warn">{exceptions.length}</Badge>}>
            {exceptions.map((e, i) => <MiniRow key={i} tone={e.tone} onClick={() => openRecord(e.id)} left={<Title>{e.title}</Title>} mid={e.detail} />)}
          </Card>
        </Grid>
      </div>
    </>
  );
}

/* ── Capacity ────────────────────────────────────────────────────────────── */
function Capacity() {
  const s = useGG();
  const apr09 = s.approvals["APR-09"] === "approved";
  const billable = STAFF.filter(p => p.capacity > 0);
  const support = STAFF.filter(p => p.capacity === 0);
  const loads = billable.map(p => ({ p, weeks: weekLoads(p.id, apr09) }));
  const pct = (d: number, cap: number) => Math.round((d / cap) * 100);
  const dara = loads.find(l => l.p.id === "dara")!;
  const ciara = loads.find(l => l.p.id === "ciara")!;
  const days = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
  const fieldStaff: StaffId[] = ["niall", "eoin", "sarah", "dara", "ciara", "mark", "louise"];
  const heat = (p: number) => p > 105 ? "var(--bad-soft)" : p >= 90 ? "var(--warn-soft)" : p >= 60 ? "var(--ok-soft)" : "var(--surface-2)";
  const heatInk = (p: number) => p > 105 ? "var(--bad)" : p >= 90 ? "var(--warn)" : p >= 60 ? "var(--ok)" : "var(--dim)";
  const tasksOpen = (id: StaffId) => allTasks(s).filter(t => t.owner === id && taskStatusOf(s, t) !== "Done").length;
  const free = loads.map(l => ({ ...l, free: Math.max(0, l.p.capacity - l.weeks[0]) })).sort((a, b) => b.free - a.free);

  return (
    <>
      <PageHead title="Capacity dashboard" sub="Who is allocated to what this week, who has room, and where fieldwork collides. Planned days come from the delivery resource board (simulated)."
        right={<Btn kind="primary" onClick={() => navigate("Projects", "Resources")}>Open resources</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!s.approvals["APR-09"] && (
          <AIBox tone="warn" title={"Dara is at " + pct(dara.weeks[0], dara.p.capacity) + "% this week and " + pct(dara.weeks[1], dara.p.capacity) + "% next week"}
            actions={<><Btn small kind="primary" onClick={() => decide("APR-09", "approved")}>Approve reallocation</Btn><Btn small onClick={() => openRecord("APR-09")}>See the proposal</Btn><RecordChip id="GG-249" /></>}>
            {"Project Delivery proposes moving the Bréifne data review support on 23 Nov to Ciara, who has " + (ciara.p.capacity - ciara.weeks[1]).toFixed(1) + " days free in week 48 once the Ardmore audit closes."}
          </AIBox>
        )}
        <Grid cols="minmax(0,1.6fr) minmax(0,1fr)">
          <Card title="Allocation this week" sub="Planned days per person, week 47 (16 to 20 Nov). The marker shows available billable days.">
            <Stack max={6} unit="d" rows={billable.map(p => ({ label: <Person id={p.id} />, parts: planParts(p.id), cap: p.capacity }))} />
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
              {[["Energy audit & monitoring", "var(--gg-green)"], ["Environmental", "var(--gg-blue)"], ["ISO systems", "var(--gg-lime)"], ["Carbon, ESG & B Corp", "#c8b4f0"], ["Renewable feasibility", "var(--warn)"], ["Non-project", "var(--neutral)"]].map(([l, c]) => (
                <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--dim)" }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c }} />{l}</span>
              ))}
            </div>
          </Card>
          <Card title="Available days, week 47" sub="Billable capacity minus planned work">
            {free.map(l => {
              const over = l.weeks[0] - l.p.capacity;
              return <MiniRow key={l.p.id} left={<Person id={l.p.id} />} mid={l.p.role}
                right={over > 0 ? <Badge tone="bad">{"Over by " + over.toFixed(2).replace(/\.?0+$/, "") + "d"}</Badge> : <><Num>{l.free.toFixed(2).replace(/\.?0+$/, "") + "d free"}</Num><Badge tone={l.free >= 1 ? "ok" : "neutral"}>{pct(l.weeks[0], l.p.capacity) + "%"}</Badge></>} />;
            })}
          </Card>
        </Grid>

        <Grid cols="minmax(0,1.3fr) minmax(0,1fr)">
          <Card flush title="Utilisation, next four weeks" sub={apr09 ? "Includes the approved Bréifne reallocation (demo)." : "Planned days as a share of billable capacity."}>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 560 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(4,1fr) .9fr", gap: 8, padding: "9px 18px", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>
                  {["Person"].concat(WEEKS, ["Backlog"]).map(h => <div key={h} style={{ fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap" }}>{h}</div>)}
                </div>
                {loads.map(l => (
                  <div key={l.p.id} style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(4,1fr) .9fr", gap: 8, alignItems: "center", padding: "8px 18px", borderTop: "1px solid var(--border)" }}>
                    <Person id={l.p.id} />
                    {l.weeks.map((d, i) => {
                      const p = pct(d, l.p.capacity);
                      return <div key={i} title={d + " of " + l.p.capacity + " days"} style={{ height: 30, borderRadius: 8, background: heat(p), color: heatInk(p), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p + "%"}</div>;
                    })}
                    <div style={{ fontSize: 12, color: "var(--dim)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(backlogDays(l.p.id)) + "d"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "10px 18px 14px" }}><Note>Backlog is remaining budgeted hours across a person's active projects, shared equally across each project team, in 7.5-hour days.</Note></div>
          </Card>
          <Card title="Delivery workload" sub="Projects led, fees managed and open tasks per person">
            {STAFF.map(p => {
              const led = PROJECTS.filter(x => x.owner === p.id);
              return <MiniRow key={p.id} left={<Person id={p.id} />} mid={led.length ? led.length + " project" + (led.length === 1 ? "" : "s") + " led · " + eurK(sum(led.map(x => x.value))) : p.role}
                right={<><span style={{ fontSize: 11.5, color: "var(--faint)" }}>tasks</span><Num>{tasksOpen(p.id)}</Num></>} />;
            })}
            <Note>{support.map(p => p.first).join(" and ") + " have no billable capacity; their load is tracked as tasks."}</Note>
          </Card>
        </Grid>

        <Card flush title="Fieldwork and meetings this week" sub="Site visits from Site Assessments and meetings from Calendly and calendars (simulated). Clashes are flagged."
          right={<Btn small kind="quiet" onClick={() => navigate("Sites", "Schedule")}>Site schedule</Btn>}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 760 }}>
              <div style={{ display: "grid", gridTemplateColumns: "160px repeat(5,1fr)", gap: 8, padding: "9px 18px", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--faint)" }}>Person</div>
                {days.map(d => <div key={d} style={{ fontSize: 11, color: d === TODAY ? "var(--accent)" : "var(--faint)", fontWeight: d === TODAY ? 600 : 400 }}>{fmtDay(d)}</div>)}
              </div>
              {fieldStaff.map(id => (
                <div key={id} style={{ display: "grid", gridTemplateColumns: "160px repeat(5,1fr)", gap: 8, padding: "8px 18px", borderTop: "1px solid var(--border)", alignItems: "stretch" }}>
                  <div style={{ display: "flex", alignItems: "center" }}><Person id={id} /></div>
                  {days.map(d => {
                    const vs = SITE_VISITS.filter(v => v.date === d && v.engineers.indexOf(id) > -1);
                    const ms = MEETINGS.filter(m => m.when === d && m.owner === id);
                    const clash = (vs.length > 0 && ms.length > 0) || vs.some(v => v.status === "conflict") || vs.length > 1;
                    return (
                      <div key={d} style={{ minHeight: 40, display: "flex", flexDirection: "column", gap: 4, padding: 4, borderRadius: 8, background: clash ? "var(--bad-soft)" : "transparent", border: clash ? "1px solid color-mix(in srgb, var(--bad) 35%, transparent)" : "1px solid transparent" }}>
                        {vs.map(v => (
                          <button key={v.id} className="gg-chip" onClick={() => openRecord(v.id)} title={v.site} style={{ textAlign: "left", border: "1px solid var(--border)", borderRadius: 7, background: v.status === "at_risk" ? "var(--warn-soft)" : "var(--gg-green-soft)", color: "var(--ink)", fontSize: 11, padding: "4px 7px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.time + " " + client(v.clientId).name}
                          </button>
                        ))}
                        {ms.map(m => (
                          <span key={m.id} title={m.title} style={{ fontSize: 11, padding: "4px 7px", borderRadius: 7, background: "var(--gg-blue-soft)", color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.time + " " + m.org}</span>
                        ))}
                        {clash && <span style={{ fontSize: 10.5, color: "var(--bad)", fontWeight: 500 }}>{vs.some(v => v.status === "conflict") ? "Needs second surveyor" : "Clash"}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function Dashboards({ tab }: { tab: string }) {
  return (
    <Page>
      {tab === "Sales" ? <SalesDash /> : tab === "Delivery" ? <Delivery /> : tab === "Finance" ? <FinanceDash /> : tab === "Capacity" ? <Capacity /> : <Executive />}
    </Page>
  );
}
