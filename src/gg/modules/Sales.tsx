/* Sales & Outreach: pipeline, leads, email campaigns, LinkedIn and proposals.
   Every figure is derived from src/gg/data.ts plus in-memory store overrides.
   Outreach, email and LinkedIn activity is simulated: nothing is sent or posted. */
import { useState, type ReactNode, type DragEvent } from "react";
import {
  TODAY, fmtDate, fmtDay, daysAgo, eur, eurK, sum, parseDate, staff,
  OPPORTUNITIES, STAGES, PROPOSALS, MEETINGS, CAMPAIGNS, OUTREACH_SAMPLE, LINKEDIN_POSTS, LINKEDIN_ENGAGEMENT,
  type Opportunity, type Stage, type Proposal, type LinkedInPost, type StaffId
} from "../data";
import {
  useGG, stageOf, moveOpportunity, decide, decideOutreach, postStatus, setPost as setPostStatus,
  navigate, toast, addTask, type GGState
} from "../store";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Seg, Search, Table, Drawer, Section, Kv, RecordChip, AIBox,
  Timeline, Bars, HBars, Donut, Legend, Avatar, Person, useFocus, SimTag, Meter, Empty, MONO_LABEL, SERIES, TONE,
  type Tone, type Col
} from "../ui";
import { ApprovalDrawer } from "./ApprovalsPanel";

/* ── helpers ───────────────────────────────────────────────────────────────── */
type OppRow = Opportunity & { stage: Stage };
const STAGE_TONE: Record<string, Tone> = {
  "New lead": "neutral", Discovery: "info", Qualified: "lime", "Proposal sent": "accent", Negotiation: "ok", Won: "ok", Lost: "bad"
};
const isOpen = (st: Stage) => st !== "Won" && st !== "Lost";
const firstName = (n: string) => n.split(" ")[0];
function addDays(iso: string, n: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function useOpps(): OppRow[] {
  const s = useGG();
  return OPPORTUNITIES.map(o => ({ ...o, stage: stageOf(s, o.id) }));
}
const proposalOf = (o: Opportunity): Proposal | undefined => o.proposalId ? PROPOSALS.find(p => p.id === o.proposalId) : undefined;
const oppOf = (p: Proposal): Opportunity | undefined => OPPORTUNITIES.find(o => o.id === p.oppId);
const ago = (iso: string) => { const d = daysAgo(iso); return d <= 0 ? "today" : d === 1 ? "1 day ago" : d + " days ago"; };

/** Proposal follow-up status, shared by Pipeline, Proposals and drawers. */
function followUpStatus(s: GGState, p: Proposal): { text: string; tone: Tone } {
  if (p.id === "P-034") {
    const d = s.approvals["APR-02"];
    if (d === "approved") return { text: "Follow-up approved (demo, not sent)", tone: "ok" };
    if (d === "rejected") return { text: "Drafted follow-up rejected", tone: "bad" };
  }
  if (p.status === "won") return { text: "Won" + (p.projectId ? ", project " + p.projectId : ""), tone: "ok" };
  if (p.status === "lost") return { text: p.note || "Lost", tone: "bad" };
  if (p.status === "draft") return { text: "Draft waiting for review", tone: "info" };
  if (p.status === "negotiation") return { text: p.note || "In negotiation", tone: "accent" };
  const age = p.sent ? daysAgo(p.sent) : 0;
  if (age >= 7) return { text: "No reply in " + age + " days" + (p.id === "P-034" ? ", follow-up drafted" : ", follow-up due"), tone: age >= 10 ? "bad" : "warn" };
  return { text: "Check in " + fmtDay(addDays(p.sent || TODAY, 7)), tone: "neutral" };
}

interface FollowUp { o: OppRow; reason: string; tone: Tone; }
function followUps(s: GGState, opps: OppRow[]): FollowUp[] {
  const out: FollowUp[] = [];
  opps.filter(o => isOpen(o.stage)).forEach(o => {
    const p = proposalOf(o);
    if (o.id === "L-034" && s.approvals["APR-02"] === "approved") {
      out.push({ o, reason: "Follow-up approved. Send it from Louise's mailbox (demo)", tone: "ok" });
    } else if (p && p.status === "sent" && p.sent && daysAgo(p.sent) >= 7) {
      out.push({ o, reason: "Proposal " + p.id + " unanswered for " + daysAgo(p.sent) + " days", tone: daysAgo(p.sent) >= 10 ? "bad" : "warn" });
    } else if (p && p.status === "draft") {
      out.push({ o, reason: "Draft proposal " + p.id + " waiting for review", tone: "info" });
    } else if (daysAgo(o.lastActivity) >= 7) {
      out.push({ o, reason: "No activity for " + daysAgo(o.lastActivity) + " days", tone: "warn" });
    }
  });
  const rank: Record<string, number> = { bad: 0, warn: 1, info: 2, ok: 3 };
  return out.sort((a, b) => (rank[a.tone] ?? 4) - (rank[b.tone] ?? 4) || b.o.value - a.o.value);
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label?: string }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 6px 0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, fontSize: 12, color: "var(--dim)" }}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ height: 30, border: 0, outline: 0, background: "none", color: "var(--ink)", fontSize: 12.5, cursor: "pointer" }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

const OWNERS: StaffId[] = Array.from(new Set(OPPORTUNITIES.map(o => o.owner)));
const SOURCES = Array.from(new Set(OPPORTUNITIES.map(o => o.source)));

/* ── shared context passed to every tab ────────────────────────────────────── */
interface Ctx {
  openOpp: (id: string) => void; openProp: (id: string) => void; openApr: (id: string) => void; openPost: (id: string) => void;
  campaign: string; setCampaign: (id: string) => void;
  extraPosts: LinkedInPost[]; addPost: (p: LinkedInPost) => void;
  engaged: Record<string, string>; setEngaged: (name: string, v: string) => void;
}

/* ════════════════════════════════════════════════════════════════════════════
   OVERVIEW
   ════════════════════════════════════════════════════════════════════════════ */
function Overview({ ctx }: { ctx: Ctx }) {
  const s = useGG();
  const opps = useOpps();
  const open = opps.filter(o => isOpen(o.stage));
  const pipeline = sum(open.map(o => o.value));
  const weighted = sum(open.map(o => o.value * o.probability / 100));
  const awaiting = open.filter(o => o.stage === "Proposal sent" || o.stage === "Negotiation");
  const meetings = MEETINGS.filter(m => m.when >= TODAY).sort((a, b) => (a.when + a.time).localeCompare(b.when + b.time));
  const thisWeek = meetings.filter(m => m.when <= "2026-11-22");
  const follow = followUps(s, opps);
  const liffey = opps.find(o => o.id === "L-034") as OppRow;
  const p034 = PROPOSALS.find(p => p.id === "P-034") as Proposal;
  const liffeyAge = daysAgo(p034.sent || TODAY);
  const decision = s.approvals["APR-02"];

  const bySource = SOURCES.map((src, i) => [src, OPPORTUNITIES.filter(o => o.source === src).length, SERIES[i % SERIES.length]] as [string, number, string]);
  const byMonth: [string, number, string?][] = [["Sep", "2026-09"], ["Oct", "2026-10"], ["Nov", "2026-11"]]
    .map(([l, m]) => [l, OPPORTUNITIES.filter(o => o.created.startsWith(m)).length] as [string, number]);
  const stageBars = STAGES.map(st => {
    const inSt = open.filter(o => o.stage === st);
    return [st, sum(inSt.map(o => o.value)), TONE[STAGE_TONE[st]][0], <span key="c" style={{ fontSize: 11, color: "var(--faint)" }}>{inSt.length} deals</span>] as [string, number, string, ReactNode];
  });

  const p044 = PROPOSALS.find(p => p.id === "P-044") as Proposal;
  const recs: { title: string; body: string; label: string; go: () => void; tone: Tone }[] = [
    { title: "Close Shannon Aviation this month", tone: "ok",
      body: eur(18000) + " at 70%. Brian Quinlan asked for staged payments on 13 Nov. Offering 40/30/30 across Q1 keeps the 27 Nov close date.",
      label: "Open deal", go: () => ctx.openOpp("L-040") },
    { title: "Raise the solar PV proposal on site tomorrow", tone: "warn",
      body: "P-044 (" + eur(p044.value) + ") has had no reply for " + daysAgo(p044.sent || TODAY) + " days. Ciara is at the Ballaghaderreen plant on Tue 17 Nov with Michael Rourke.",
      label: "Open deal", go: () => ctx.openOpp("L-044") },
    { title: "Price-check the Brookfield draft before it goes stale", tone: "info",
      body: "P-036 (" + eur(21000) + ") was drafted from the scoping call. SEAI grant timing makes December the window for 6 sites.",
      label: "Open proposal", go: () => ctx.openProp("P-036") },
    { title: "Add Shannon Cold Chain to the EED campaign", tone: "lime",
      body: "Darragh Lyons shared Niall's audit post. Fit score 84 and not yet in OnePageCRM.",
      label: "Open LinkedIn", go: () => navigate("Sales", "LinkedIn") }
  ];

  return (
    <Page>
      <PageHead title="Sales & Outreach"
        sub={open.length + " open opportunities worth " + eur(pipeline) + ". Pulse watches every deal, drafts the follow-ups and finds the next leads, so nothing waits for someone to update the CRM."}
        right={<><SimTag>OnePageCRM · demo connection</SimTag><Btn onClick={() => navigate("Sales", "Pipeline")}>Open pipeline</Btn></>} />

      <Grid cols="repeat(5,minmax(0,1fr))" gap={12} style={{ marginBottom: 14 }}>
        <Stat label="Open pipeline" value={eur(pipeline)} hint={open.length + " opportunities"} tone="accent" onClick={() => navigate("Sales", "Pipeline")} />
        <Stat label="Weighted pipeline" value={eur(Math.round(weighted))} hint="value × close probability" />
        <Stat label="Awaiting a decision" value={eur(sum(awaiting.map(o => o.value)))} hint={awaiting.length + " proposals out with clients"} onClick={() => navigate("Sales", "Proposals")} />
        <Stat label="Follow-ups required" value={follow.filter(f => f.tone !== "ok").length} hint="stale proposals and quiet deals" tone="warn" />
        <Stat label="Meetings this week" value={thisWeek.length} hint={thisWeek.filter(m => m.source === "Calendly").length + " booked through Calendly"} />
      </Grid>

      <Grid cols="minmax(0,1.55fr) minmax(300px,1fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <AIBox tone={decision === "approved" ? "ok" : "warn"}
            title={decision === "approved"
              ? "Liffey Packaging follow-up approved. Louise sends it from her own mailbox"
              : "Follow up Liffey Packaging today: " + eur(liffey.value) + " proposal, " + liffeyAge + " days without a reply"}
            actions={<>
              <Btn kind="primary" onClick={() => ctx.openApr("APR-02")}>{decision ? "View follow-up decision" : "Review drafted follow-up"}</Btn>
              <Btn onClick={() => ctx.openOpp("L-034")}>Open opportunity</Btn>
              <Btn kind="quiet" onClick={() => ctx.openProp("P-034")}>Proposal P-034</Btn>
            </>}>
            Rachel Doherty opened P-034 twice (simulated tracking) but has not replied since {fmtDate(p034.sent)}. Two of Liffey's FMCG customers want supplier carbon data in the new year, so the strongest next step is a phased offer that lands the Scope 1 and 2 baseline first. Pulse has drafted that follow-up for {staff(liffey.owner).first}. Stage: {liffey.stage}.
          </AIBox>

          <Card title="Opportunity recommendations" sub="Ranked by value at risk and time sensitivity. Each one is a suggestion; a person decides.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
              {recs.map(r => (
                <div key={r.title} style={{ padding: "13px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: TONE[r.tone][0], flex: "none" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{r.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, flex: 1 }}>{r.body}</div>
                  <div><Btn small onClick={r.go}>{r.label}</Btn></div>
                </div>
              ))}
            </div>
          </Card>

          <Grid cols="minmax(0,1.2fr) minmax(0,1fr)">
            <Card title="Pipeline by stage" sub={"Open value " + eur(pipeline)}>
              <HBars data={stageBars} format={eurK} />
            </Card>
            <Card title="Lead acquisition" sub="Where the 12 opportunities came from">
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Donut parts={bySource} size={118} thickness={15} center={OPPORTUNITIES.length} sub="leads" />
                <Legend items={bySource.map(([l, v, c]) => [l, v, c] as [string, ReactNode, string])} />
              </div>
              <div style={{ ...MONO_LABEL, margin: "16px 0 8px" }}>New leads by month</div>
              <Bars data={byMonth} height={56} highlight="Nov" />
            </Card>
          </Grid>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card flush title="Upcoming meetings" sub="Discovery calls book themselves through Calendly"
            right={<Badge tone="info">{meetings.length} booked</Badge>}>
            {meetings.map(m => (
              <div key={m.id} className={m.oppId ? "gg-row" : undefined} onClick={m.oppId ? () => ctx.openOpp(m.oppId as string) : undefined}
                style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 18px", borderTop: "1px solid var(--border)", cursor: m.oppId ? "pointer" : "default" }}>
                <div style={{ flex: "none", width: 46, textAlign: "center", padding: "6px 0", borderRadius: 10, background: m.when === TODAY ? "var(--accent-soft)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 9.5, color: "var(--faint)", fontFamily: "var(--mono)" }}>{fmtDay(m.when).slice(0, 3).toUpperCase()}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{parseDate(m.when).getUTCDate()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.org}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{m.time} · {m.title} · {m.with}</div>
                </div>
                <Badge tone={m.source === "Calendly" ? "info" : "neutral"}>{m.source}</Badge>
                <Avatar id={m.owner} size={24} />
              </div>
            ))}
          </Card>

          <Card flush title="Follow-ups required" sub="Pulse checks every open deal each morning">
            {follow.map(f => (
              <div key={f.o.id} className="gg-row" onClick={() => ctx.openOpp(f.o.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: TONE[f.tone][0], flex: "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{f.o.company} <span style={{ color: "var(--faint)", fontWeight: 400 }}>· {eur(f.o.value)}</span></div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{f.reason}</div>
                </div>
                <Avatar id={f.o.owner} size={22} />
              </div>
            ))}
            {follow.length === 0 && <Empty title="Every deal has a recent touchpoint" />}
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PIPELINE (kanban)
   ════════════════════════════════════════════════════════════════════════════ */
function Pipeline({ ctx }: { ctx: Ctx }) {
  const s = useGG();
  const opps = useOpps();
  const [owner, setOwner] = useState<string>("All");
  const [over, setOver] = useState<string | null>(null);
  const shown = opps.filter(o => owner === "All" || staff(o.owner).first === owner);
  const open = shown.filter(o => isOpen(o.stage));
  const closedNow = shown.filter(o => !isOpen(o.stage));
  const allOpen = opps.filter(o => isOpen(o.stage));
  const closing = open.filter(o => o.expectedClose <= "2026-11-30").sort((a, b) => a.expectedClose.localeCompare(b.expectedClose));

  const onDrop = (st: Stage) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver(null);
    if (id && stageOf(s, id) !== st) moveOpportunity(id, st);
  };

  return (
    <Page>
      <PageHead title="Pipeline"
        sub={allOpen.length + " open deals worth " + eur(sum(allOpen.map(o => o.value))) + ". Drag a card, or use the arrows, to move it. Changes mirror to OnePageCRM in the demo."}
        right={<Seg options={["All", ...OWNERS.map(o => staff(o).first)]} value={owner} onChange={setOwner} />} />

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(224px,1fr))", gap: 12, minWidth: 1140 }}>
          {STAGES.map((st, si) => {
            const col = open.filter(o => o.stage === st).sort((a, b) => b.value - a.value);
            const total = sum(col.map(o => o.value));
            const wt = sum(col.map(o => o.value * o.probability / 100));
            return (
              <div key={st} onDragOver={e => { e.preventDefault(); if (over !== st) setOver(st); }} onDragLeave={() => setOver(null)} onDrop={onDrop(st)}
                style={{ background: over === st ? "var(--accent-faint)" : "var(--surface-faint)", border: "1px solid " + (over === st ? "var(--accent-line)" : "var(--border)"), borderRadius: "var(--card-r,18px)", padding: 10, minHeight: 420, display: "flex", flexDirection: "column", gap: 9, transition: "background .2s var(--ease),border-color .2s var(--ease)" }}>
                <div style={{ padding: "4px 6px 6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: TONE[STAGE_TONE[st]][0] }} />
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{st}</span>
                    <Badge tone="neutral" style={{ height: 20 }}>{col.length}</Badge>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 11.5, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ color: "var(--ink)", fontWeight: 600 }}>{eur(total)}</span>
                    <span>weighted {eurK(Math.round(wt))}</span>
                  </div>
                </div>
                {col.map(o => {
                  const p = proposalOf(o);
                  const fu = p ? followUpStatus(s, p) : null;
                  const stale = daysAgo(o.lastActivity) >= 7;
                  return (
                    <div key={o.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", o.id)} onClick={() => ctx.openOpp(o.id)}
                      className="gg-click" style={{ padding: "11px 12px", background: "var(--surface)", border: "1px solid " + (o.id === "L-034" ? "var(--accent-line)" : "var(--border)"), borderRadius: "var(--r-md,14px)", cursor: "grab", display: "flex", flexDirection: "column", gap: 7 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{o.company}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eurK(o.value)}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--dim)", lineHeight: 1.4 }}>{o.title}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p && fu && <Badge tone={fu.tone} style={{ height: 20, fontSize: 10.5 }}>{p.id} · {p.status === "sent" && p.sent ? "sent " + daysAgo(p.sent) + "d" : p.status}</Badge>}
                        {stale && !p && <Badge tone="warn" style={{ height: 20, fontSize: 10.5 }}>quiet {daysAgo(o.lastActivity)}d</Badge>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 1 }}>
                        <Avatar id={o.owner} size={20} />
                        <span style={{ fontSize: 11, color: "var(--faint)", flex: 1 }}>Close {fmtDate(o.expectedClose)} · {o.probability}%</span>
                        <span onClick={e => e.stopPropagation()} style={{ display: "inline-flex", gap: 3 }}>
                          <button className="gg-btn" disabled={si === 0} title="Move back" onClick={() => moveOpportunity(o.id, STAGES[si - 1])}
                            style={{ width: 22, height: 22, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--dim)", cursor: si === 0 ? "default" : "pointer", opacity: si === 0 ? .35 : 1, fontSize: 12, lineHeight: 1 }}>‹</button>
                          <button className="gg-btn" disabled={si === STAGES.length - 1} title="Move forward" onClick={() => moveOpportunity(o.id, STAGES[si + 1])}
                            style={{ width: 22, height: 22, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--dim)", cursor: si === STAGES.length - 1 ? "default" : "pointer", opacity: si === STAGES.length - 1 ? .35 : 1, fontSize: 12, lineHeight: 1 }}>›</button>
                        </span>
                      </div>
                    </div>
                  );
                })}
                {col.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", padding: "24px 8px", border: "1px dashed var(--border)", borderRadius: 12 }}>Drop a deal here</div>}
              </div>
            );
          })}
        </div>
      </div>

      <Grid cols="minmax(0,1.5fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card flush title="Expected to close by 30 November" sub={eur(sum(closing.map(o => o.value))) + " across " + closing.length + " deals"}>
          <Table<OppRow> rowKey={o => o.id} onRow={o => ctx.openOpp(o.id)} rows={closing} empty="Nothing due to close this month"
            cols={[
              { key: "c", label: "Opportunity", width: "1.6fr", render: o => <span><b style={{ fontWeight: 500 }}>{o.company}</b><span style={{ color: "var(--faint)" }}> · {o.id}</span></span> },
              { key: "s", label: "Stage", width: "120px", render: o => <Badge tone={STAGE_TONE[o.stage]}>{o.stage}</Badge> },
              { key: "v", label: "Value", width: "90px", align: "right", render: o => eur(o.value) },
              { key: "p", label: "Prob.", width: "60px", align: "right", render: o => o.probability + "%" },
              { key: "d", label: "Close", width: "70px", render: o => fmtDate(o.expectedClose) },
              { key: "o", label: "Owner", width: "130px", render: o => <Person id={o.owner} /> }
            ] as Col<OppRow>[]} />
        </Card>
        <Card flush title="Recently closed" sub="Won and lost, including any you move in this session">
          {closedNow.map(o => (
            <div key={o.id} className="gg-row" onClick={() => ctx.openOpp(o.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
              <Badge tone={o.stage === "Won" ? "ok" : "bad"} dot>{o.stage}</Badge>
              <span style={{ flex: 1, fontSize: 13 }}>{o.company}</span>
              <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur(o.value)}</span>
              <Btn small kind="quiet" onClick={e => { e.stopPropagation(); moveOpportunity(o.id, "Negotiation"); }}>Reopen</Btn>
            </div>
          ))}
          {PROPOSALS.filter(p => p.status === "won" || p.status === "lost").map(p => (
            <div key={p.id} className="gg-row" onClick={() => ctx.openProp(p.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 18px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
              <Badge tone={p.status === "won" ? "ok" : "bad"} dot>{p.status === "won" ? "Won" : "Lost"}</Badge>
              <span style={{ flex: 1, fontSize: 13, minWidth: 0 }}>{p.company} <span style={{ color: "var(--faint)" }}>· {p.title}</span></span>
              <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur(p.value)}</span>
              {p.projectId && <RecordChip id={p.projectId} label={p.projectId} />}
            </div>
          ))}
        </Card>
      </Grid>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LEADS
   ════════════════════════════════════════════════════════════════════════════ */
function Leads({ ctx }: { ctx: Ctx }) {
  const opps = useOpps();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("All");
  const [owner, setOwner] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const ql = q.trim().toLowerCase();
  const rows = opps.filter(o =>
    (stage === "All" || o.stage === stage) && (owner === "all" || o.owner === owner) && (source === "all" || o.source === source) &&
    (!ql || [o.company, o.contact, o.service, o.sector, o.county, o.title, o.id].join(" ").toLowerCase().includes(ql))
  ).sort((a, b) => b.score - a.score);
  const stageCounts: Record<string, number> = { All: opps.length };
  STAGES.forEach(st => { stageCounts[st] = opps.filter(o => o.stage === st).length; });
  const avg = Math.round(sum(opps.map(o => o.score)) / opps.length);
  const highFit = opps.filter(o => o.score >= 75);
  const quiet = opps.filter(o => isOpen(o.stage) && daysAgo(o.lastActivity) >= 7);
  const fresh = opps.filter(o => o.created >= "2026-11-01");

  return (
    <Page>
      <PageHead title="Leads"
        sub="Every prospect company with its contact, service interest, qualification score and the next thing to do. Scores update as engagement comes in."
        right={<Search value={q} onChange={setQ} placeholder="Search company, contact, service" width={280} />} />

      <Grid cols="repeat(4,minmax(0,1fr))" gap={12} style={{ marginBottom: 14 }}>
        <Stat label="Average qualification score" value={avg + "/100"} hint="size, sector fit, source and engagement" />
        <Stat label="High-fit leads" value={highFit.length} hint={"score 75+, worth " + eur(sum(highFit.map(o => o.value)))} tone="ok" onClick={() => setQ("")} />
        <Stat label="Quiet for 7+ days" value={quiet.length} hint="open deals with no recent touchpoint" tone="warn" />
        <Stat label="New this month" value={fresh.length} hint={fresh.map(o => o.company.split(" ")[0]).join(", ")} />
      </Grid>

      <div style={{ marginBottom: 14 }}>
        <AIBox title="Pulse enriched and scored 4 new leads this week"
          actions={<><Btn small onClick={() => ctx.openOpp("L-038")}>Harbour Point Offices</Btn><Btn small onClick={() => ctx.openOpp("L-042")}>Bray Leisureplex</Btn><Btn small kind="quiet" onClick={() => navigate("Sales", "LinkedIn")}>LinkedIn engagement</Btn></>}>
          Company size, sector and location come from public records; engagement comes from Calendly, email replies and LinkedIn activity. The two newest leads score in the 50s because neither has confirmed budget or timing yet, so the suggested next step for each is a qualifying question rather than a proposal.
        </AIBox>
      </div>

      <Card flush title={rows.length + " of " + opps.length + " leads"}
        right={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Select label="Owner" value={owner} onChange={setOwner} options={[["all", "Anyone"], ...OWNERS.map(o => [o, staff(o).name] as [string, string])]} />
          <Select label="Source" value={source} onChange={setSource} options={[["all", "Any source"], ...SOURCES.map(x => [x, x] as [string, string])]} />
        </div>}>
        <div style={{ padding: "0 18px 12px" }}>
          <Seg options={["All", ...STAGES]} value={stage} onChange={setStage} counts={stageCounts} />
        </div>
        <Table<OppRow> rowKey={o => o.id} onRow={o => ctx.openOpp(o.id)} rows={rows} empty="No leads match"
          cols={[
            { key: "co", label: "Company", width: "1.45fr", render: o => (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.company}</div>
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{o.sector} · {o.county}</div>
              </div>) },
            { key: "ct", label: "Contact", width: "1.35fr", render: o => (
              <div style={{ minWidth: 0 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.contact} <span style={{ color: "var(--faint)" }}>· {o.contactTitle}</span></div>
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.email}</div>
              </div>) },
            { key: "sv", label: "Service interest", width: "1fr", render: o => <span style={{ color: "var(--body)" }}>{o.service}</span> },
            { key: "sc", label: "Score", width: "96px", render: o => (
              <div>
                <div style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: o.score >= 75 ? "var(--ok)" : o.score >= 60 ? "var(--ink)" : "var(--warn)" }}>{o.score}</div>
                <div style={{ marginTop: 4 }}><Meter value={o.score} tone={o.score >= 75 ? "ok" : o.score >= 60 ? "accent" : "warn"} height={4} /></div>
              </div>) },
            { key: "st", label: "Stage", width: "118px", render: o => <Badge tone={STAGE_TONE[o.stage]}>{o.stage}</Badge> },
            { key: "ow", label: "Owner", width: "44px", render: o => <Avatar id={o.owner} size={24} /> },
            { key: "va", label: "Value", width: "84px", align: "right", render: o => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(o.value)}</span> },
            { key: "la", label: "Last touch", width: "88px", render: o => <span style={{ color: daysAgo(o.lastActivity) >= 7 ? "var(--warn)" : "var(--dim)" }}>{ago(o.lastActivity)}</span> },
            { key: "na", label: "Suggested next action", width: "1.6fr", render: o => <span style={{ color: "var(--body)", whiteSpace: "normal", lineHeight: 1.4, display: "block" }}>{o.nextAction}</span> }
          ] as Col<OppRow>[]} />
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EMAIL CAMPAIGNS
   ════════════════════════════════════════════════════════════════════════════ */
const PEER_EXAMPLE: Record<string, string> = {
  "Food & drink manufacturing": "a Cavan food manufacturer",
  "Logistics & cold chain": "a Longford cold-storage operator",
  "Commercial property": "a Dublin business park",
  "Industrial manufacturing": "a Dublin plastics manufacturer",
  "Hospitality groups": "a Leitrim hotel group"
};
const PERSONAL_LINE: Record<string, string> = {
  "OD-1": "I saw Ballyhaunis Meat Packers added chill capacity in 2025. Extra refrigeration load is usually where an audit finds the quickest savings.",
  "OD-2": "Running a cold store around the clock makes compressor scheduling one of the biggest levers on your energy bill.",
  "OD-3": "With leases at Liberty Square coming up for renewal, an audit can feed straight into the BER upgrades tenants now ask about.",
  "OD-4": "We are just up the road in Carrick-on-Shannon, and compressed air is often the hidden cost at moulding sites like yours.",
  "OD-5": "Across a multi-site hotel group, heating controls and BMS scheduling tend to be the first savings an audit turns up."
};
function renderMerge(text: string, vals: Record<string, string>): ReactNode[] {
  return text.split(/(\{\{\w+\}\})/g).map((part, i) => {
    const m = part.match(/^\{\{(\w+)\}\}$/);
    if (!m) return <span key={i}>{part}</span>;
    return <mark key={i} title={"Merge field: " + m[1]} style={{ background: "var(--accent-soft)", color: "var(--ink)", borderRadius: 4, padding: "0 3px" }}>{vals[m[1]] ?? part}</mark>;
  });
}

function Campaigns({ ctx }: { ctx: Ctx }) {
  const s = useGG();
  const c = CAMPAIGNS.find(x => x.id === ctx.campaign) || CAMPAIGNS[0];
  const done = CAMPAIGNS.filter(x => x.status === "completed");
  const pastSent = sum(done.map(x => x.sent || 0)), pastOpens = sum(done.map(x => x.opens || 0));
  const pastReplies = sum(done.map(x => x.replies || 0)), pastMeetings = sum(done.map(x => x.meetings || 0));
  const fromCampaigns = OPPORTUNITIES.filter(o => o.source === "Email campaign");

  return (
    <Page>
      <PageHead title="Email campaigns"
        sub="Proactive outreach built by the Sales & Outreach agent: audience, sequence and personalised first lines. Every campaign stops for approval, and nothing is sent from this demo."
        right={<><Badge tone="info">Outbound email: proposed integration</Badge><SimTag>Nothing sent</SimTag></>} />

      <Grid cols="minmax(250px,0.75fr) minmax(0,2.25fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          {CAMPAIGNS.map(x => {
            const on = x.id === c.id;
            const approved = x.id === "CMP-07" && (s.approvals["APR-07"] === "approved" || s.campaigns[x.id] === "approved");
            return (
              <div key={x.id} className="gg-click" onClick={() => ctx.setCampaign(x.id)} style={{ padding: "13px 14px", borderRadius: "var(--r-md,14px)", cursor: "pointer", background: on ? "var(--surface-2)" : "var(--surface)", border: "1px solid " + (on ? "var(--accent-line)" : "var(--border)") }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ ...MONO_LABEL, flex: 1 }}>{x.id}</span>
                  <Badge tone={x.status === "draft" ? (approved ? "ok" : "warn") : "neutral"}>{x.status === "draft" ? (approved ? "Approved (demo)" : "Draft, unsent") : "Completed"}</Badge>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 7, lineHeight: 1.35 }}>{x.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{x.size} prospects · {x.audience}</div>
                {x.sent ? <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{Math.round((x.opens || 0) / x.sent * 100)}% opened · {x.replies} replies · {x.meetings} meetings</div> : null}
              </div>
            );
          })}
          <Card title="Past campaign performance" sub="Simulated response statistics">
            <Kv cols={2} items={[
              ["Sent", pastSent], ["Open rate", Math.round(pastOpens / pastSent * 100) + "%"],
              ["Reply rate", (pastReplies / pastSent * 100).toFixed(1) + "%"], ["Meetings", pastMeetings]
            ]} />
            {fromCampaigns.length > 0 && <>
              <div style={{ ...MONO_LABEL, margin: "14px 0 8px" }}>Pipeline from email</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{fromCampaigns.map(o => <RecordChip key={o.id} id={o.id} label={o.company + " · " + eurK(o.value)} />)}</div>
            </>}
          </Card>
        </div>

        <div style={{ minWidth: 0 }}>
          {c.status === "draft" ? <DraftCampaign c={c} ctx={ctx} past={{ sent: pastSent, replies: pastReplies, meetings: pastMeetings, opens: pastOpens }} /> : <CompletedCampaign c={c} />}
        </div>
      </Grid>
    </Page>
  );
}

function DraftCampaign({ c, ctx, past }: { c: typeof CAMPAIGNS[number]; ctx: Ctx; past: { sent: number; replies: number; meetings: number; opens: number } }) {
  const s = useGG();
  const [pid, setPid] = useState(OUTREACH_SAMPLE[0].id);
  const [step, setStep] = useState("Day 0");
  const d = s.approvals["APR-07"];
  const approved = d === "approved" || s.campaigns[c.id] === "approved";
  const prospect = OUTREACH_SAMPLE.find(x => x.id === pid) || OUTREACH_SAMPLE[0];
  const stepIdx = Math.max(0, c.steps.findIndex(st => "Day " + st.day === step));
  const st = c.steps[stepIdx];
  const vals: Record<string, string> = {
    company: prospect.company, first_name: firstName(prospect.contact), sector: prospect.sector.toLowerCase(),
    peer_example: PEER_EXAMPLE[prospect.sector] || "a similar Irish business", calendly_link: "calendly.com/gg-demo/discovery",
    personal_line: PERSONAL_LINE[prospect.id] || prospect.personalisation
  };
  const body = stepIdx === 0 ? st.body.replace("Hi {{first_name}},\n\n", "Hi {{first_name}},\n\n{{personal_line}}\n\n") : st.body;
  const reviewed = OUTREACH_SAMPLE.filter(x => s.outreach[x.id]).length;
  const estReplies = Math.round(c.size * past.replies / Math.max(1, past.sent));
  const estMeetings = Math.round(c.size * past.meetings / Math.max(1, past.sent));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card title={c.name} sub={c.audience + " · built " + fmtDate(c.created) + " by " + staff(c.owner).name + " with the Sales & Outreach agent"}
        right={approved ? <Badge tone="ok" dot>Approved in demo · not scheduled</Badge> : d === "rejected" ? <Badge tone="bad" dot>Rejected</Badge> : <Badge tone="warn" dot>Waiting on Niall</Badge>}>
        <Grid cols="repeat(4,minmax(0,1fr))" gap={10}>
          <Stat label="Audience" value={c.size} hint="commercial & industrial prospects" />
          <Stat label="Sequence" value={c.steps.length + " steps"} hint={"over " + c.steps[c.steps.length - 1].day + " days"} />
          <Stat label="Expected replies" value={"~" + estReplies} hint="from past reply rates" />
          <Stat label="Expected meetings" value={"~" + estMeetings} hint="estimate, not a promise" tone="accent" />
        </Grid>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 18, marginTop: 16, alignItems: "start" }}>
          <div>
            <div style={{ ...MONO_LABEL, marginBottom: 10 }}>Audience segments</div>
            <HBars data={c.segments.map(([l, n], i) => [l, n, SERIES[i % SERIES.length]] as [string, number, string])} />
          </div>
          <AIBox title={approved ? "Approved. Ready to schedule once a sending domain is connected" : "Approve CMP-07 for scheduling"} tone={approved ? "ok" : "accent"}
            actions={approved ? <Btn small onClick={() => ctx.openApr("APR-07")}>View approval</Btn> : d === "rejected" ? <Btn small onClick={() => ctx.openApr("APR-07")}>View decision</Btn> : <>
              <Btn small kind="primary" onClick={() => decide("APR-07", "approved")}>Approve campaign</Btn>
              <Btn small onClick={() => ctx.openApr("APR-07")}>Review approval</Btn>
              <Btn small kind="danger" onClick={() => decide("APR-07", "rejected")}>Reject</Btn>
            </>}>
            The 2027 energy audit obligation gives every one of these 120 organisations a reason to talk now. Spot-check the sample drafts below first. Approving marks the campaign ready in the demo; sending would need the proposed outbound email setup with its own domain, warm-up and suppression list.
          </AIBox>
        </div>
      </Card>

      <Grid cols="minmax(240px,0.85fr) minmax(0,1.6fr)">
        <Card flush title="Personalised drafts" sub={"Review queue · " + reviewed + " of " + OUTREACH_SAMPLE.length + " samples checked"}>
          {OUTREACH_SAMPLE.map(x => {
            const dec = s.outreach[x.id];
            const on = x.id === pid;
            return (
              <div key={x.id} className="gg-row" onClick={() => setPid(x.id)} style={{ padding: "11px 16px", borderTop: "1px solid var(--border)", cursor: "pointer", background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.company}</span>
                  <span style={{ fontSize: 11, color: x.fit >= 85 ? "var(--ok)" : "var(--dim)", fontVariantNumeric: "tabular-nums" }}>fit {x.fit}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{x.contact} · {x.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                  {dec ? <><Badge tone={dec === "approved" ? "ok" : "neutral"} dot>{dec === "approved" ? "Draft approved" : "Skipped"}</Badge>
                    <Btn small kind="quiet" onClick={() => decideOutreach(x.id, dec === "approved" ? "skipped" : "approved")}>Change</Btn></> : <>
                    <Btn small kind="primary" onClick={() => decideOutreach(x.id, "approved")}>Approve</Btn>
                    <Btn small onClick={() => decideOutreach(x.id, "skipped")}>Skip</Btn>
                  </>}
                </div>
              </div>
            );
          })}
          <div style={{ padding: "11px 16px", borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5 }}>
            The other {c.size - OUTREACH_SAMPLE.length} drafts use the same sequence with their own first line. Pulse flags any where the personalisation is weak.
          </div>
        </Card>

        <Card title={"Preview for " + prospect.contact + ", " + prospect.company} sub={"AI personalisation: " + prospect.personalisation}
          right={<Seg options={c.steps.map(x => "Day " + x.day)} value={step} onChange={setStep} />}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--dim)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span><span style={{ color: "var(--faint)" }}>From</span> Niall Kiernan (draft, mock sender)</span>
              <span><span style={{ color: "var(--faint)" }}>To</span> {prospect.contact}, {prospect.title}</span>
              <span style={{ color: "var(--ink)", fontSize: 13, fontWeight: 500 }}><span style={{ color: "var(--faint)", fontWeight: 400 }}>Subject</span> {renderMerge(st.subject, vals)}</span>
            </div>
            <div style={{ padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "var(--body)", whiteSpace: "pre-wrap" }}>{renderMerge(body, vals)}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, color: "var(--faint)", flex: 1 }}>Highlighted text is filled in per prospect. Step {stepIdx + 1} of {c.steps.length}, sent only if there is no reply.</span>
            <Badge tone="neutral">Not sent</Badge>
          </div>
        </Card>
      </Grid>
    </div>
  );
}

function CompletedCampaign({ c }: { c: typeof CAMPAIGNS[number] }) {
  const sent = c.sent || 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card title={c.name} sub={c.audience + " · created " + fmtDate(c.created)} right={<SimTag>Simulated statistics</SimTag>}>
        <Grid cols="repeat(4,minmax(0,1fr))" gap={10}>
          <Stat label="Sent" value={sent} hint={c.size + " in audience"} />
          <Stat label="Open rate" value={Math.round((c.opens || 0) / Math.max(1, sent) * 100) + "%"} hint={(c.opens || 0) + " opened"} />
          <Stat label="Reply rate" value={((c.replies || 0) / Math.max(1, sent) * 100).toFixed(1) + "%"} hint={(c.replies || 0) + " replies"} tone="accent" />
          <Stat label="Meetings booked" value={c.meetings || 0} hint="through Calendly" tone="ok" />
        </Grid>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 18, marginTop: 18, alignItems: "end" }}>
          <div>
            <div style={{ ...MONO_LABEL, marginBottom: 8 }}>Response funnel</div>
            <Bars height={120} data={[["Sent", sent, "var(--gg-blue)"], ["Opened", c.opens || 0, "var(--gg-green)"], ["Replied", c.replies || 0, "var(--gg-lime)"], ["Meetings", c.meetings || 0, "var(--accent)"]]} />
          </div>
          <div>
            <div style={{ ...MONO_LABEL, marginBottom: 8 }}>Audience</div>
            <HBars data={c.segments.map(([l, n], i) => [l, n, SERIES[i % SERIES.length]] as [string, number, string])} />
          </div>
        </div>
      </Card>
      <AIBox title={c.id === "CMP-05" ? "Reuse what worked: the reply that became Tralee Food Ingredients" : "B Corp interest is real but slower to convert"}>
        {c.id === "CMP-05"
          ? "Replies came mostly from operations directors at plants with more than 250 staff. CMP-07 reuses that targeting and the short first line that got the reply from Eimear Sheehan, now a discovery call on Wed 18 Nov."
          : "Six replies led to two calls; one became Kinsale Craft Foods via Calendly. B Corp prospects need a longer nurture, so the next touch is a readiness checklist rather than a meeting ask."}
      </AIBox>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LINKEDIN
   ════════════════════════════════════════════════════════════════════════════ */
const POST_TONE: Record<LinkedInPost["status"], Tone> = { draft: "neutral", awaiting_approval: "warn", approved: "ok", published: "info" };
const POST_LABEL: Record<LinkedInPost["status"], string> = { draft: "Draft", awaiting_approval: "Awaiting approval", approved: "Approved (demo)", published: "Published" };
const SUGGESTIONS: { id: string; title: string; body: string; pillar: string; author: StaffId; date: string; source: string }[] = [
  { id: "LI-S1", title: "Compressed air: the leak you cannot see on the bill", body: "An anonymised plastics manufacturer: 31 leaks found in one ultrasonic survey, about €29,600 a year in avoidable cost for roughly €3,200 of repairs.", pillar: "Client results", author: "niall", date: "2026-11-27", source: "From finding F-257-1 (anonymised)" },
  { id: "LI-S2", title: "LED retrofits and SEAI support: what qualifies", body: "Car park and stairwell lighting is still one of the cleanest paybacks in commercial buildings. A short guide to what is eligible.", pillar: "Compliance explainer", author: "niall", date: "2026-11-23", source: "From finding F-247-2" },
  { id: "LI-S3", title: "Measurement & Mapping: why we start with the meter data", body: "Third in the SMART™ series. Why half-hourly data changes what an audit can find on the day.", pillar: "SMART™ methodology", author: "dara", date: "2026-12-01", source: "Follows LI-24 in the series" }
];

function LinkedIn({ ctx }: { ctx: Ctx }) {
  const s = useGG();
  const posts = LINKEDIN_POSTS.concat(ctx.extraPosts);
  const published = posts.filter(p => postStatus(s, p) === "published");
  const pipeline = posts.filter(p => postStatus(s, p) !== "published").sort((a, b) => a.date.localeCompare(b.date));
  const liOpps = OPPORTUNITIES.filter(o => o.source === "LinkedIn");
  const weeks = ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"];
  const usedSuggestions = new Set(ctx.extraPosts.map(p => p.id));

  const advance = (p: LinkedInPost) => {
    const st = postStatus(s, p);
    if (p.id === "LI-21") { decide("APR-08", "approved"); return; }
    if (st === "draft") setPostStatus(p.id, "awaiting_approval");
    else if (st === "awaiting_approval") setPostStatus(p.id, "approved");
  };

  return (
    <Page>
      <PageHead title="LinkedIn"
        sub="Content calendar, company-post suggestions and who is engaging. Pulse drafts in Niall's voice from real project findings, anonymised, and every post waits for approval."
        right={<><Badge tone="info">LinkedIn: proposed integration</Badge><SimTag>Nothing is posted</SimTag></>} />

      <Grid cols="repeat(4,minmax(0,1fr))" gap={12} style={{ marginBottom: 14 }}>
        <Stat label="Impressions, last 2 posts" value={sum(published.map(p => p.impressions || 0)).toLocaleString("en-IE")} hint="simulated analytics" />
        <Stat label="Reactions and comments" value={sum(published.map(p => (p.reactions || 0) + (p.comments || 0)))} hint={published.length + " published posts"} />
        <Stat label="Leads from LinkedIn" value={liOpps.length} hint={eur(sum(liOpps.map(o => o.value))) + " in pipeline"} tone="accent" />
        <Stat label="Waiting for approval" value={posts.filter(p => postStatus(s, p) === "awaiting_approval").length} hint="Niall approves posts on his profile" tone="warn" />
      </Grid>

      <Grid cols="minmax(0,1.6fr) minmax(300px,1fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Content calendar" sub="November · weekdays" right={<span style={{ display: "flex", gap: 6 }}>{(["draft", "awaiting_approval", "approved", "published"] as const).map(k => <Badge key={k} tone={POST_TONE[k]} style={{ height: 20, fontSize: 10.5 }}>{POST_LABEL[k]}</Badge>)}</span>}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 6 }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => <div key={d} style={{ ...MONO_LABEL, padding: "0 4px 4px" }}>{d}</div>)}
              {weeks.flatMap(w => [0, 1, 2, 3, 4].map(i => {
                const day = addDays(w, i);
                const items = posts.filter(p => p.date === day);
                const today = day === TODAY;
                return (
                  <div key={day} style={{ minHeight: 78, padding: 7, borderRadius: 10, background: today ? "var(--accent-faint)" : "var(--surface-2)", border: "1px solid " + (today ? "var(--accent-line)" : "var(--border)"), display: "flex", flexDirection: "column", gap: 5, opacity: day < TODAY && !items.length ? .6 : 1 }}>
                    <span style={{ fontSize: 11, color: today ? "var(--accent)" : "var(--faint)", fontWeight: today ? 600 : 400 }}>{parseDate(day).getUTCDate()}{today ? " · today" : ""}</span>
                    {items.map(p => {
                      const st = postStatus(s, p);
                      return (
                        <button key={p.id} onClick={() => ctx.openPost(p.id)} className="gg-chip" title={p.title}
                          style={{ textAlign: "left", border: "1px solid var(--border)", borderLeft: "3px solid " + TONE[POST_TONE[st]][0], borderRadius: 7, background: "var(--surface)", color: "var(--body)", fontSize: 11, lineHeight: 1.3, padding: "5px 6px", cursor: "pointer", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as any}>
                          {p.title}
                        </button>
                      );
                    })}
                  </div>
                );
              }))}
            </div>
          </Card>

          <Card flush title="Approval workflow" sub="Draft, then approval, then ready. Publishing needs the proposed LinkedIn integration.">
            {pipeline.map(p => {
              const st = postStatus(s, p);
              const isLI21 = p.id === "LI-21";
              const rejected = isLI21 && s.approvals["APR-08"] === "rejected";
              return (
                <div key={p.id} className="gg-row" onClick={() => ctx.openPost(p.id)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 18px", borderTop: "1px solid var(--border)", cursor: "pointer", flexWrap: "wrap" }}>
                  <Avatar id={p.author} size={26} />
                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{fmtDay(p.date)} · {p.pillar} · {staff(p.author).first}'s profile</div>
                  </div>
                  <Badge tone={rejected ? "bad" : POST_TONE[st]} dot>{rejected ? "Rejected" : POST_LABEL[st]}</Badge>
                  <span onClick={e => e.stopPropagation()} style={{ display: "inline-flex", gap: 6 }}>
                    {st === "draft" && !rejected && <Btn small onClick={() => advance(p)}>Send for approval</Btn>}
                    {st === "awaiting_approval" && !rejected && <>
                      <Btn small kind="primary" onClick={() => advance(p)}>Approve</Btn>
                      <Btn small kind="quiet" onClick={() => { if (isLI21) { decide("APR-08", "rejected"); } setPostStatus(p.id, "draft"); }}>{isLI21 ? "Reject" : "Back to draft"}</Btn>
                    </>}
                    {st === "approved" && <Badge tone="neutral">Ready · not posted</Badge>}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Post suggestions" sub="Drafted from project findings and the SMART™ series">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SUGGESTIONS.map(sg => {
                const used = usedSuggestions.has(sg.id);
                return (
                  <div key={sg.id} style={{ padding: "12px 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.35 }}>{sg.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 5, lineHeight: 1.5 }}>{sg.body}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 9 }}>
                      <span style={{ fontSize: 11, color: "var(--faint)", flex: 1 }}>{sg.source}</span>
                      {used ? <Badge tone="ok" dot>Added {fmtDate(sg.date)}</Badge> :
                        <Btn small onClick={() => { ctx.addPost({ id: sg.id, date: sg.date, author: sg.author, title: sg.title, body: sg.body, status: "draft", pillar: sg.pillar }); toast("Draft added to the calendar for " + fmtDay(sg.date) + ". Not posted."); }}>Add as draft</Btn>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card flush title="Who is engaging" sub="People reacting to Global Green posts, scored for fit">
            {LINKEDIN_ENGAGEMENT.map(e => {
              const added = ctx.engaged[e.name];
              return (
                <div key={e.name} style={{ padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{e.title}, {e.org} · {e.action.toLowerCase()} {e.post}</div>
                    </div>
                    <Badge tone={e.fit >= 80 ? "ok" : e.fit >= 70 ? "accent" : "neutral"}>fit {e.fit}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--body)", marginTop: 7, lineHeight: 1.5 }}>{e.suggested}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {e.oppId ? <RecordChip id={e.oppId} /> : added ? <Badge tone="ok" dot>{added}</Badge> : <>
                      <Btn small onClick={() => { ctx.setEngaged(e.name, "Added to CMP-07 audience"); toast(e.name + " added to the CMP-07 audience in the demo."); }}>Add to CMP-07</Btn>
                      <Btn small kind="quiet" onClick={() => { ctx.setEngaged(e.name, "Connection note drafted"); toast("Connection note drafted for " + firstName(e.name) + ". Not sent."); }}>Draft connection note</Btn>
                    </>}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSALS
   ════════════════════════════════════════════════════════════════════════════ */
const PROP_FILTERS = ["All", "Draft", "Sent", "Negotiation", "Won", "Lost"] as const;
type PropFilter = typeof PROP_FILTERS[number];
const PROP_TONE: Record<Proposal["status"], Tone> = { draft: "info", sent: "accent", negotiation: "ok", won: "ok", lost: "bad" };
const PROP_LABEL: Record<Proposal["status"], string> = { draft: "Draft", sent: "Sent", negotiation: "Negotiation", won: "Won", lost: "Lost" };
function expected(p: Proposal): number {
  if (p.status === "won") return p.value;
  if (p.status === "lost") return 0;
  const o = oppOf(p);
  return o ? Math.round(p.value * o.probability / 100) : 0;
}

function Proposals({ ctx }: { ctx: Ctx }) {
  const s = useGG();
  const [f, setF] = useState<PropFilter>("All");
  const counts: Partial<Record<PropFilter, number>> = { All: PROPOSALS.length };
  PROP_FILTERS.slice(1).forEach(k => { counts[k] = PROPOSALS.filter(p => PROP_LABEL[p.status] === k).length; });
  const rows = PROPOSALS.filter(p => f === "All" || PROP_LABEL[p.status] === f)
    .sort((a, b) => (a.id === "P-034" ? -1 : b.id === "P-034" ? 1 : 0) || (a.status === "won" || a.status === "lost" ? 1 : 0) - (b.status === "won" || b.status === "lost" ? 1 : 0) || b.value - a.value);
  const out = PROPOSALS.filter(p => p.status === "sent" || p.status === "negotiation");
  const drafts = PROPOSALS.filter(p => p.status === "draft");
  const won = PROPOSALS.filter(p => p.status === "won"), lost = PROPOSALS.filter(p => p.status === "lost");
  const liffey = PROPOSALS.find(p => p.id === "P-034") as Proposal;
  const lAge = daysAgo(liffey.sent || TODAY);
  const lfu = followUpStatus(s, liffey);
  const ageing = out.map(p => [p.company + " · " + p.id, daysAgo(p.sent || TODAY), daysAgo(p.sent || TODAY) >= 10 ? "var(--bad)" : daysAgo(p.sent || TODAY) >= 7 ? "var(--warn)" : "var(--gg-green)"] as [string, number, string]).sort((a, b) => b[1] - a[1]);

  return (
    <Page>
      <PageHead title="Proposals"
        sub="Every proposal from draft to decision, with its age, follow-up status and expected revenue. Won proposals connect to the project they became."
        right={<Seg options={PROP_FILTERS} value={f} onChange={setF} counts={counts} />} />

      <Grid cols="repeat(5,minmax(0,1fr))" gap={12} style={{ marginBottom: 14 }}>
        <Stat label="Out with clients" value={eur(sum(out.map(p => p.value)))} hint={out.length + " sent or in negotiation"} tone="accent" />
        <Stat label="Expected revenue" value={eur(sum(out.concat(drafts).map(expected)))} hint="open and draft, by probability" />
        <Stat label="Drafts to review" value={eur(sum(drafts.map(p => p.value)))} hint={drafts.length + " drafts"} tone="warn" onClick={() => setF("Draft")} />
        <Stat label="Won since September" value={eur(sum(won.map(p => p.value)))} hint={won.length + " proposals, now projects"} tone="ok" onClick={() => setF("Won")} />
        <Stat label="Win rate" value={Math.round(won.length / Math.max(1, won.length + lost.length) * 100) + "%"} hint={won.length + " won, " + lost.length + " lost"} />
      </Grid>

      <Grid cols="minmax(0,1.6fr) minmax(280px,1fr)" style={{ marginBottom: 14 }}>
        <Card title={<span>Liffey Packaging · P-034 <span style={{ color: "var(--faint)", fontWeight: 400 }}>· {liffey.title}</span></span>}
          sub={"Sent " + fmtDay(liffey.sent) + " by " + staff(liffey.owner).name + " · opened " + liffey.views + " times (simulated tracking)"}
          right={<Badge tone={lfu.tone} dot>{lfu.text}</Badge>} tone="warn">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            <Stat label="Value" value={eur(liffey.value)} />
            <Stat label="Days without reply" value={lAge} tone={lAge >= 7 ? "warn" : undefined} hint="follow-up target: 7 days" />
            <Stat label="Probability" value={(oppOf(liffey)?.probability || 0) + "%"} />
            <Stat label="Expected" value={eur(expected(liffey))} />
          </div>
          <div style={{ margin: "14px 0 6px", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--faint)" }}><span>Sent {fmtDate(liffey.sent)}</span><span>Follow-up due day 7</span><span>Goes cold day 14</span></div>
          <Meter value={Math.min(100, lAge / 14 * 100)} tone={lAge >= 10 ? "bad" : "warn"} height={8} />
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Btn kind="primary" onClick={() => ctx.openApr("APR-02")}>Review drafted follow-up</Btn>
            <Btn onClick={() => ctx.openOpp("L-034")}>Open opportunity</Btn>
            <Btn kind="quiet" onClick={() => ctx.openProp("P-034")}>Proposal details</Btn>
          </div>
        </Card>
        <Card title="Proposal age" sub="Days since sent, open proposals">
          <HBars data={ageing} format={n => n + "d"} max={14} />
          <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 12, lineHeight: 1.5 }}>Pulse drafts a follow-up at day 7 and flags anything past day 10.</div>
        </Card>
      </Grid>

      <Card flush title={rows.length + " proposals"}>
        <Table<Proposal> rowKey={p => p.id} onRow={p => ctx.openProp(p.id)} rows={rows} selected="P-034"
          cols={[
            { key: "t", label: "Proposal", width: "1.8fr", render: p => (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.company}</div>
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.id} · v{p.version} · {p.title}</div>
              </div>) },
            { key: "s", label: "Status", width: "104px", render: p => <Badge tone={PROP_TONE[p.status]}>{PROP_LABEL[p.status]}</Badge> },
            { key: "v", label: "Value", width: "84px", align: "right", render: p => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(p.value)}</span> },
            { key: "d", label: "Sent", width: "64px", render: p => p.sent ? fmtDate(p.sent) : <span style={{ color: "var(--faint)" }}>Not sent</span> },
            { key: "a", label: "Age", width: "52px", align: "right", render: p => p.sent && (p.status === "sent" || p.status === "negotiation") ? <span style={{ color: daysAgo(p.sent) >= 7 ? "var(--warn)" : "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{daysAgo(p.sent)}d</span> : <span style={{ color: "var(--faint)" }}>·</span> },
            { key: "w", label: "Views", width: "50px", align: "right", render: p => p.views },
            { key: "f", label: "Follow-up", width: "1.4fr", render: p => { const fu = followUpStatus(s, p); return <span style={{ color: TONE[fu.tone][0], whiteSpace: "normal", lineHeight: 1.4, display: "block" }}>{fu.text}</span>; } },
            { key: "e", label: "Expected", width: "84px", align: "right", render: p => <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--body)" }}>{eur(expected(p))}</span> },
            { key: "l", label: "Linked", width: "1.1fr", render: p => <span style={{ display: "inline-flex", gap: 5 }}>{p.oppId && <RecordChip id={p.oppId} label={p.oppId} />}{p.projectId && <RecordChip id={p.projectId} label={p.projectId} />}</span> }
          ] as Col<Proposal>[]} />
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DRAWERS
   ════════════════════════════════════════════════════════════════════════════ */
function OppDrawer({ id, onClose, ctx }: { id: string | null; onClose: () => void; ctx: Ctx }) {
  const s = useGG();
  const o = OPPORTUNITIES.find(x => x.id === id);
  if (!o) return null;
  const stage = stageOf(s, o.id);
  const p = proposalOf(o);
  const meetings = MEETINGS.filter(m => m.oppId === o.id);
  const isLiffey = o.story === 3;
  const decision = s.approvals["APR-02"];
  const makeTask = () => addTask({ title: "Follow up " + o.company + ": " + o.nextAction, owner: o.owner, due: TODAY, priority: o.value >= 15000 ? "High" : "Medium", status: "Not started", dept: "Sales", record: o.id, source: "Pulse" });

  return (
    <Drawer open onClose={onClose} eyebrow={"OPPORTUNITY · " + o.id} badge={<Badge tone={STAGE_TONE[stage]} dot>{stage}</Badge>}
      title={o.company + ": " + o.title}
      footer={<><span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Synced with OnePageCRM (simulated)</span><Btn onClick={makeTask}>Create follow-up task</Btn><Btn kind="primary" onClick={onClose}>Done</Btn></>}>
      {isLiffey ? (
        <AIBox tone={decision === "approved" ? "ok" : "warn"} title={decision === "approved" ? "Follow-up approved. Louise sends it herself" : "Send a tailored follow-up today"}
          actions={<Btn small kind="primary" onClick={() => ctx.openApr("APR-02")}>{decision ? "View decision" : "Review drafted follow-up"}</Btn>}>
          Proposal P-034 went out {p && p.sent ? daysAgo(p.sent) : 0} days ago and was opened twice with no reply. The draft offers to phase the work so the Scope 1 and 2 baseline lands before Liffey's customers ask for supplier data, and suggests a call with Conor Whelan, their CFO.
        </AIBox>
      ) : (
        <AIBox title={o.nextAction} actions={<Btn small onClick={makeTask}>Create task for {staff(o.owner).first}</Btn>}>
          Qualification score {o.score}/100 from company size, sector fit, source ({o.source.toLowerCase()}) and engagement. Weighted value {eur(Math.round(o.value * o.probability / 100))}.
        </AIBox>
      )}
      <Kv items={[
        ["Service", o.service], ["Value", eur(o.value)], ["Probability", o.probability + "%"], ["Expected close", fmtDay(o.expectedClose)],
        ["Owner", staff(o.owner).name], ["Source", o.source], ["Score", o.score + "/100"], ["Sector", o.sector + ", " + o.county]
      ]} />
      <Section label="Move stage">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {([...STAGES, "Won", "Lost"] as Stage[]).map(st => (
            <Btn key={st} small kind={st === stage ? "primary" : "ghost"} onClick={() => { if (st !== stage) moveOpportunity(o.id, st); }}>{st}</Btn>
          ))}
        </div>
      </Section>
      <Section label="Contact" right={<Badge tone="neutral" style={{ height: 20, fontSize: 10.5 }}>Mock record</Badge>}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, background: "var(--gg-blue-soft)", color: "var(--gg-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flex: "none" }}>{o.contact.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{o.contact}</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{o.contactTitle} · {o.email}</div>
          </div>
        </div>
      </Section>
      <Section label="Interaction history">
        <Timeline items={o.interactions.slice().reverse().map(([d, ch, note]) => ({ when: fmtDate(d), title: note, right: <Badge tone="neutral" style={{ height: 20, fontSize: 10.5 }}>{ch}</Badge> }))} />
      </Section>
      {meetings.length > 0 && (
        <Section label="Meetings">
          {meetings.map(m => <div key={m.id} style={{ fontSize: 12.5, color: "var(--body)", padding: "4px 0" }}>{fmtDay(m.when)} {m.time} · {m.title} with {m.with} <Badge tone="info" style={{ height: 20, fontSize: 10.5, marginLeft: 6 }}>{m.source}</Badge></div>)}
        </Section>
      )}
      <Section label="Linked records">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p && <RecordChip id={p.id} />}
          {o.clientId && <RecordChip id={o.clientId} />}
          {isLiffey && <RecordChip id="APR-02" label="Drafted follow-up" />}
          {!p && !o.clientId && <span style={{ fontSize: 12, color: "var(--faint)" }}>No proposal yet</span>}
        </div>
      </Section>
    </Drawer>
  );
}

function ProposalDrawer({ id, onClose, ctx }: { id: string | null; onClose: () => void; ctx: Ctx }) {
  const s = useGG();
  const p = PROPOSALS.find(x => x.id === id);
  if (!p) return null;
  const o = oppOf(p);
  const fu = followUpStatus(s, p);
  return (
    <Drawer open onClose={onClose} eyebrow={"PROPOSAL · " + p.id + " · v" + p.version} badge={<Badge tone={PROP_TONE[p.status]} dot>{PROP_LABEL[p.status]}</Badge>}
      title={p.company + ": " + p.title}
      footer={<><span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Proposal documents stay in your existing tools; Pulse tracks status.</span>
        {p.status === "draft" && <Btn onClick={() => toast("Marked reviewed in the demo. Sending stays with " + staff(p.owner).first + ".")}>Mark reviewed</Btn>}
        <Btn kind="primary" onClick={onClose}>Done</Btn></>}>
      {p.id === "P-034" && (
        <AIBox tone="warn" title="Follow up today" actions={<Btn small kind="primary" onClick={() => ctx.openApr("APR-02")}>Review drafted follow-up</Btn>}>
          {daysAgo(p.sent || TODAY)} days without a reply after two opens. A phased offer is drafted for Louise.
        </AIBox>
      )}
      {p.status === "draft" && (
        <AIBox tone="info" title={p.id === "P-036" ? "First draft built from the scoping call" : "Draft ready for a scope check"}>
          {p.id === "P-036"
            ? "Six sites, priced per site with a group discount. Niall to check the day rate and SEAI grant wording before it goes to Joanne Ryan."
            : "Scope 3 categories 4 and 9 included as discussed. Dara to confirm effort before pricing is final."}
        </AIBox>
      )}
      <Kv items={[
        ["Value", eur(p.value)], ["Expected revenue", eur(expected(p))], ["Owner", staff(p.owner).name], ["Version", "v" + p.version],
        ["Sent", p.sent ? fmtDay(p.sent) : "Not sent"], ["Age", p.sent && (p.status === "sent" || p.status === "negotiation") ? daysAgo(p.sent) + " days" : "·"],
        ["Views", p.views + " (simulated)"], ["Follow-up", fu.text]
      ]} />
      {p.note && <Section label="Note"><div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>{p.note}</div></Section>}
      <Section label="Linked records">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {o && <RecordChip id={o.id} />}
          {p.projectId && <RecordChip id={p.projectId} />}
          {!o && !p.projectId && <span style={{ fontSize: 12, color: "var(--faint)" }}>No linked records</span>}
        </div>
      </Section>
    </Drawer>
  );
}

function PostDrawer({ id, onClose, ctx }: { id: string | null; onClose: () => void; ctx: Ctx }) {
  const s = useGG();
  const p = LINKEDIN_POSTS.concat(ctx.extraPosts).find(x => x.id === id);
  if (!p) return null;
  const st = postStatus(s, p);
  const a = staff(p.author);
  const isLI21 = p.id === "LI-21";
  const rejected = isLI21 && s.approvals["APR-08"] === "rejected";
  return (
    <Drawer open onClose={onClose} eyebrow={"LINKEDIN POST · " + p.id} badge={<Badge tone={rejected ? "bad" : POST_TONE[st]} dot>{rejected ? "Rejected" : POST_LABEL[st]}</Badge>} title={p.title}
      footer={<><span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>LinkedIn is a proposed integration. Nothing is posted.</span>
        {st === "draft" && !rejected && <Btn onClick={() => (isLI21 ? decide("APR-08", "approved") : setPostStatus(p.id, "awaiting_approval"))}>Send for approval</Btn>}
        {st === "awaiting_approval" && !rejected && <><Btn kind="danger" onClick={() => { if (isLI21) decide("APR-08", "rejected"); setPostStatus(p.id, "draft"); }}>{isLI21 ? "Reject" : "Back to draft"}</Btn>
          <Btn kind="primary" onClick={() => (isLI21 ? decide("APR-08", "approved") : setPostStatus(p.id, "approved"))}>Approve</Btn></>}
        {(st === "approved" || st === "published" || rejected) && <Btn kind="primary" onClick={onClose}>Done</Btn>}</>}>
      <div style={{ padding: "16px 18px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Avatar id={p.author} size={38} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{a.role}, Global Green · {fmtDay(p.date)}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 14, lineHeight: 1.4 }}>{p.title}</div>
        <div style={{ fontSize: 13, color: "var(--body)", marginTop: 8, lineHeight: 1.65 }}>{p.body || "Published post. Full text kept in the content archive."}</div>
        {st === "published" && <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: "var(--dim)" }}>
          <span>{(p.impressions || 0).toLocaleString("en-IE")} impressions</span><span>{p.reactions} reactions</span><span>{p.comments} comments</span></div>}
      </div>
      <Kv items={[["Pillar", p.pillar], ["Profile", a.name], ["Planned", fmtDay(p.date)], ["Status", rejected ? "Rejected" : POST_LABEL[st]]]} />
      {isLI21 && <Section label="Approval"><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><RecordChip id="APR-08" /></div></Section>}
      <Section label="Workflow">
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {(["draft", "awaiting_approval", "approved", "published"] as const).map((k, i) => (
            <span key={k} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              {i > 0 && <span style={{ color: "var(--faint)" }}>›</span>}
              <Badge tone={k === st ? POST_TONE[k] : "neutral"} style={{ opacity: k === st ? 1 : .6 }}>{POST_LABEL[k]}</Badge>
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>Published only through the proposed LinkedIn integration, after approval.</div>
      </Section>
    </Drawer>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MODULE
   ════════════════════════════════════════════════════════════════════════════ */
export default function Sales({ tab }: { tab: string }) {
  const [opp, setOpp] = useState<string | null>(null);
  const [prop, setProp] = useState<string | null>(null);
  const [apr, setApr] = useState<string | null>(null);
  const [post, setPost] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<string>(CAMPAIGNS[0].id);
  const [extraPosts, setExtraPosts] = useState<LinkedInPost[]>([]);
  const [engaged, setEngagedState] = useState<Record<string, string>>({});

  useFocus("Opportunity", setOpp);
  useFocus("Proposal", setProp);
  useFocus("LinkedIn post", setPost);
  useFocus("Campaign", setCampaign);

  const ctx: Ctx = {
    openOpp: id => { setProp(null); setPost(null); setOpp(id); },
    openProp: id => { setOpp(null); setPost(null); setProp(id); },
    openApr: id => setApr(id),
    openPost: id => { setOpp(null); setProp(null); setPost(id); },
    campaign, setCampaign,
    extraPosts, addPost: p => setExtraPosts(xs => xs.concat([p])),
    engaged, setEngaged: (name, v) => setEngagedState(e => ({ ...e, [name]: v }))
  };

  let body: ReactNode;
  switch (tab) {
    case "Pipeline": body = <Pipeline ctx={ctx} />; break;
    case "Leads": body = <Leads ctx={ctx} />; break;
    case "Email Campaigns": body = <Campaigns ctx={ctx} />; break;
    case "LinkedIn": body = <LinkedIn ctx={ctx} />; break;
    case "Proposals": body = <Proposals ctx={ctx} />; break;
    default: body = <Overview ctx={ctx} />;
  }

  return (
    <>
      {body}
      <OppDrawer id={opp} onClose={() => setOpp(null)} ctx={ctx} />
      <ProposalDrawer id={prop} onClose={() => setProp(null)} ctx={ctx} />
      <PostDrawer id={post} onClose={() => setPost(null)} ctx={ctx} />
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </>
  );
}
