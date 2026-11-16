/* Agents hub: Overview, Runs and Approvals. The "Agents" tab itself is the
   existing conversation view driven by PulseLogic. Agents recommend and draft;
   a person approves anything external. Nothing here sends, posts, pays or reconciles. */
import { useState, type ReactNode } from "react";
import AgentFace from "../../components/AgentFace";
import { AGENTS, AGENT_RUNS, APPROVALS, agent, staff, fmtDate, sum, type AgentId, type AgentRun, type GGAgent } from "../data";
import { useGG, toggleAgent, navigate, decide, pendingApprovals, type GGState } from "../store";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Seg, Search, Table, Drawer, Section, Kv, RecordChip, Timeline,
  HBars, Legend, Person, MONO_LABEL, useFocus, type Tone
} from "../ui";
import ApprovalsPanel, { ApprovalDrawer } from "./ApprovalsPanel";

const STATE_LABEL: Record<string, [string, Tone]> = {
  working: ["Working", "ok"], thinking: ["Thinking", "info"], waiting: ["Waiting on you", "warn"],
  complete: ["Up to date", "ok"], attention: ["Needs attention", "bad"], idle: ["Paused", "neutral"]
};
const OUTCOME: Record<AgentRun["outcome"], [string, Tone]> = {
  completed: ["Completed", "ok"], awaiting_approval: ["Awaiting approval", "warn"], no_action: ["No action", "neutral"], failed: ["Failed, retried", "bad"]
};
const RUN_CUTOFF = "2026-11-15 07:00";

const pendingFor = (s: GGState, id: AgentId) => pendingApprovals(s).filter(a => a.agentId === id);
const runsFor = (id: AgentId) => AGENT_RUNS.filter(r => r.agentId === id).sort((a, b) => b.when.localeCompare(a.when));

/** Live state: paused agents idle; agents with drafts waiting show as waiting; cleared queues read as up to date. */
function stateOf(s: GGState, a: GGAgent): string {
  if (s.agentPaused[a.id]) return "idle";
  const p = pendingFor(s, a.id).length;
  if (a.status === "attention") return p ? "attention" : "complete";
  if (p) return "waiting";
  if (a.status === "waiting") return "complete";
  return a.status;
}

/** Outcome as it stands now: an awaiting run resolves once its approval is decided. */
function runOutcome(s: GGState, r: AgentRun): [string, Tone] {
  if (r.outcome === "awaiting_approval") {
    const apr = r.records.find(x => /^APR-/.test(x));
    const d = apr ? s.approvals[apr] : undefined;
    if (d === "approved") return ["Approved (demo)", "ok"];
    if (d === "rejected") return ["Rejected", "neutral"];
  }
  return OUTCOME[r.outcome];
}
const whenLabel = (w: string) => fmtDate(w.slice(0, 10)) + " " + w.slice(11);

function Guardrail() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 18px", borderRadius: "var(--r-md,16px)", background: "linear-gradient(100deg, var(--gg-green-soft), transparent 75%)", border: "1px solid color-mix(in srgb, var(--gg-green) 30%, transparent)" }}>
      <span style={{ flex: "none", width: 34, height: 34, borderRadius: 999, background: "var(--gg-green-soft)", color: "var(--gg-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7" /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>No agent sends, posts, pays or reconciles without a person.</div>
        <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>Agents read through the permissions of the person they work for. Drafts, matches and recommendations stop in the approval queue, and every run is written to the audit trail.</div>
      </div>
    </div>
  );
}

function Chips({ items, tone = "neutral" }: { items: string[]; tone?: Tone }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{items.map(i => <Badge key={i} tone={tone} style={{ height: 21, fontSize: 11 }}>{i}</Badge>)}</div>;
}

/* ── agent drawer (execution history) ─────────────────────────────────────── */
function AgentDrawer({ id, onClose, onApproval }: { id: AgentId | null; onClose: () => void; onApproval: (id: string) => void }) {
  const s = useGG();
  const a = id ? agent(id) : null;
  if (!a) return null;
  const st = stateOf(s, a);
  const runs = runsFor(a.id);
  const pend = pendingFor(s, a.id);
  const paused = !!s.agentPaused[a.id];
  return (
    <Drawer open onClose={onClose} eyebrow={"AGENT · " + a.id.toUpperCase()} badge={<Badge tone={STATE_LABEL[st][1]} dot>{STATE_LABEL[st][0]}</Badge>}
      title={<span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}><AgentFace shape={a.shape} tint={a.tint} state={st} size={40} />{a.name}</span>}
      footer={<>
        <span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>{"Owner: " + staff(a.owner).name}</span>
        <Btn onClick={() => toggleAgent(a.id)}>{paused ? "Resume agent" : "Pause agent"}</Btn>
        <Btn kind="primary" onClick={() => { onClose(); navigate("Agents", "Agents:" + a.id); }}>Open conversation</Btn>
      </>}>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--body)" }}>{a.purpose}.</div>
      <Kv items={[["Owner", staff(a.owner).name], ["Actions today", a.actionsToday], ["Runs on record", runs.length], ["Waiting on a person", pend.length]]} />
      <Section label="Reads"><Chips items={a.reads} tone="info" /></Section>
      <Section label="Can do on its own"><Chips items={a.can} tone="ok" /></Section>
      <Section label="Must stop for approval before"><Chips items={a.needsApproval.length ? a.needsApproval : ["Nothing external; read and summarise only"]} tone="warn" /></Section>
      <Section label="Waiting on a decision">
        {pend.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Nothing waiting. Recommendations from this agent will appear here.</div> :
          pend.map(p => (
            <div key={p.id} style={{ padding: "11px 13px", marginBottom: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4, lineHeight: 1.45 }}>{p.summary}</div>
              <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                <Btn small onClick={() => onApproval(p.id)}>Review draft</Btn>
                <Btn small kind="danger" onClick={() => decide(p.id, "rejected")}>Reject</Btn>
                <Btn small kind="primary" onClick={() => decide(p.id, "approved")}>Approve</Btn>
              </div>
            </div>
          ))}
      </Section>
      <Section label="Execution history">
        {runs.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No runs recorded yet.</div> :
          <Timeline items={runs.map(r => {
            const [label, tone] = runOutcome(s, r);
            return {
              when: whenLabel(r.when), tone,
              title: r.trigger,
              right: <Badge tone={tone}>{label}</Badge>,
              detail: <div><div>{r.summary}</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>{r.records.filter(x => /^[A-Z]+-/.test(x)).map(x => <RecordChip key={x} id={x} />)}</div></div>
            };
          })} />}
      </Section>
    </Drawer>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────────── */
function Overview() {
  const s = useGG();
  const [open, setOpen] = useState<AgentId | null>(null);
  const [apr, setApr] = useState<string | null>(null);
  const pending = pendingApprovals(s);
  const recentRuns = AGENT_RUNS.filter(r => r.when >= RUN_CUTOFF).length;
  const paused = AGENTS.filter(a => s.agentPaused[a.id]).length;

  return (
    <>
      <PageHead title="Agents" sub="Eight agents watch Global Green's projects, pipeline, fieldwork and finances. They flag, draft and recommend; a person decides."
        right={<><Btn onClick={() => navigate("Agents", "Agents")}>Open conversations</Btn><Btn kind="primary" onClick={() => navigate("Agents", "Approvals")}>{"Review approvals (" + pending.length + ")"}</Btn></>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Grid cols="repeat(4,minmax(0,1fr))">
          <Stat label="Actions today" value={sum(AGENTS.map(a => a.actionsToday))} hint="reads, checks and drafts across 8 agents" tone="accent" />
          <Stat label="Waiting on a person" value={pending.length} hint="drafts and recommendations, none sent" tone={pending.length ? "warn" : "ok"} onClick={() => navigate("Agents", "Approvals")} />
          <Stat label="Runs since yesterday 07:00" value={recentRuns} hint={AGENT_RUNS.filter(r => r.outcome === "failed").length + " failed and retried automatically"} tone="info" onClick={() => navigate("Agents", "Runs")} />
          <Stat label="Agents active" value={(AGENTS.length - paused) + " of " + AGENTS.length} hint={paused ? paused + " paused by you" : "pause any agent from its card"} tone={paused ? "neutral" : "ok"} />
        </Grid>
        <Guardrail />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
          {AGENTS.map(a => {
            const st = stateOf(s, a);
            const runs = runsFor(a.id);
            const last = runs[0];
            const pend = pendingFor(s, a.id);
            const isPaused = !!s.agentPaused[a.id];
            return (
              <section key={a.id} className="gg-card-link" style={{ display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", boxShadow: "var(--card-shadow)", overflow: "hidden", opacity: isPaused ? 0.72 : 1 }}>
                <div className="gg-row" onClick={() => setOpen(a.id)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 18px 12px", cursor: "pointer" }}>
                  <AgentFace shape={a.shape} tint={a.tint} state={st} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.2px" }}>{a.name}</span>
                      <Badge tone={STATE_LABEL[st][1]} dot>{STATE_LABEL[st][0]}</Badge>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4, lineHeight: 1.45 }}>{a.purpose}</div>
                  </div>
                </div>
                <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  <div>
                    <div style={{ ...MONO_LABEL, marginBottom: 6 }}>Watches</div>
                    <Chips items={a.reads} tone="info" />
                  </div>
                  <div>
                    <div style={{ ...MONO_LABEL, marginBottom: 5 }}>{last ? "Latest run · " + whenLabel(last.when) : "Latest run"}</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--body)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{last ? last.summary : "No runs recorded yet."}</div>
                  </div>
                  <div>
                    <div style={{ ...MONO_LABEL, marginBottom: 6 }}>Recommends</div>
                    {pend.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--faint)" }}>Nothing waiting on a decision.</div> :
                      pend.slice(0, 2).map(p => (
                        <div key={p.id} className="gg-row" onClick={() => setApr(p.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", margin: "0 -9px", borderRadius: 9, cursor: "pointer" }}>
                          <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--warn)", flex: "none" }} />
                          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                          <span style={{ fontSize: 11, color: "var(--accent)", flex: "none" }}>Review</span>
                        </div>
                      ))}
                    {pend.length > 2 && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{"+" + (pend.length - 2) + " more"}</div>}
                  </div>
                  <div>
                    <div style={{ ...MONO_LABEL, marginBottom: 6 }}>Stops for approval before</div>
                    <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>{a.needsApproval.length ? a.needsApproval.join(" · ") : "Nothing external. Read and summarise only."}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)" }}>
                  <span style={{ fontSize: 12, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{a.actionsToday + " actions today"}</span>
                  <span style={{ fontSize: 12, color: "var(--faint)" }}>{"· " + runs.length + " runs"}</span>
                  <span style={{ flex: 1 }} />
                  <Btn small kind="quiet" onClick={() => toggleAgent(a.id)}>{isPaused ? "Resume" : "Pause"}</Btn>
                  <Btn small onClick={() => setOpen(a.id)}>History</Btn>
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <AgentDrawer id={open} onClose={() => setOpen(null)} onApproval={(id) => { setOpen(null); setApr(id); }} />
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </>
  );
}

/* ── Runs ─────────────────────────────────────────────────────────────────── */
type OutcomeFilter = "All" | "Completed" | "Awaiting approval" | "Failed";
function Runs() {
  const s = useGG();
  const [outcome, setOutcome] = useState<OutcomeFilter>("All");
  const [who, setWho] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [apr, setApr] = useState<string | null>(null);
  useFocus("Agent run", setOpen);

  const match: Record<OutcomeFilter, (r: AgentRun) => boolean> = {
    "All": () => true, "Completed": r => r.outcome === "completed", "Awaiting approval": r => r.outcome === "awaiting_approval", "Failed": r => r.outcome === "failed"
  };
  const ql = q.trim().toLowerCase();
  const rows = AGENT_RUNS.slice().sort((a, b) => b.when.localeCompare(a.when))
    .filter(r => match[outcome](r) && (who === "all" || r.agentId === who)
      && (!ql || (r.summary + " " + r.trigger + " " + r.records.join(" ") + " " + agent(r.agentId).name).toLowerCase().indexOf(ql) > -1));
  const counts = { "All": AGENT_RUNS.length, "Completed": AGENT_RUNS.filter(match.Completed).length, "Awaiting approval": AGENT_RUNS.filter(match["Awaiting approval"]).length, "Failed": AGENT_RUNS.filter(match.Failed).length };
  const run = AGENT_RUNS.find(r => r.id === open);
  const runApr = run ? run.records.find(x => /^APR-/.test(x)) : undefined;

  return (
    <>
      <PageHead title="Agent runs" sub="Every time an agent ran: what triggered it, what it found, what it touched and how it ended."
        right={<Search value={q} onChange={setQ} placeholder="Search runs, records, agents" width={280} />} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Seg options={["All", "Completed", "Awaiting approval", "Failed"] as OutcomeFilter[]} value={outcome} onChange={setOutcome} counts={counts} />
        <select value={who} onChange={e => setWho(e.target.value)} style={{ height: 34, padding: "0 12px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)", fontSize: 12.5, outline: 0 }}>
          <option value="all">All agents</option>
          {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name + " (" + runsFor(a.id).length + ")"}</option>)}
        </select>
      </div>
      <Grid cols="minmax(0,1fr) 300px">
        <Card flush title={rows.length + " runs"} sub="Click a run for its full record.">
          <Table rowKey={r => r.id} rows={rows} onRow={r => setOpen(r.id)} selected={open || undefined} empty="No runs match"
            cols={[
              { key: "w", label: "When", width: "100px", render: r => <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--dim)" }}>{whenLabel(r.when)}</span> },
              { key: "a", label: "Agent", width: "1fr", render: r => { const a = agent(r.agentId); return <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}><AgentFace shape={a.shape} tint={a.tint} state="idle" size={22} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span></span>; } },
              { key: "s", label: "What happened", width: "2.6fr", render: r => <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: "var(--faint)" }}>{r.trigger}</div><div style={{ marginTop: 2, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden", whiteSpace: "normal" }}>{r.summary}</div></div> },
              { key: "o", label: "Outcome", width: "140px", render: r => { const [l, t] = runOutcome(s, r); return <Badge tone={t} dot>{l}</Badge>; } },
              { key: "d", label: "Took", width: "60px", align: "right", render: r => <span style={{ color: "var(--dim)" }}>{r.duration}</span> }
            ]} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Runs by agent">
            <HBars data={AGENTS.map(a => [a.name, runsFor(a.id).length, "var(--gg-green)"] as [string, number, string]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1])} />
          </Card>
          <Card title="Outcomes">
            <Legend items={(Object.keys(OUTCOME) as AgentRun["outcome"][]).map(k => [OUTCOME[k][0], AGENT_RUNS.filter(r => r.outcome === k).length, ["var(--ok)", "var(--warn)", "var(--dim)", "var(--bad)"][Object.keys(OUTCOME).indexOf(k)]] as [string, ReactNode, string])} />
            <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 12, lineHeight: 1.5 }}>Runs that end awaiting approval show their decision here once someone approves or rejects them.</div>
          </Card>
        </div>
      </Grid>

      {run && (
        <Drawer open onClose={() => setOpen(null)} eyebrow={"AGENT RUN · " + run.id} badge={<Badge tone={runOutcome(s, run)[1]} dot>{runOutcome(s, run)[0]}</Badge>}
          title={agent(run.agentId).name + ": " + run.trigger}
          footer={<>
            <span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Run records are append-only and cannot be edited.</span>
            {runApr && !s.approvals[runApr] && <Btn kind="primary" onClick={() => setApr(runApr)}>Review approval</Btn>}
            <Btn onClick={() => setOpen(null)}>Close</Btn>
          </>}>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--body)" }}>{run.summary}</div>
          <Kv items={[["Agent", agent(run.agentId).name], ["Started", whenLabel(run.when)], ["Trigger", run.trigger], ["Duration", run.duration], ["Outcome", runOutcome(s, run)[0]], ["Agent owner", <Person key="o" id={agent(run.agentId).owner} />]]} />
          <Section label="Records touched">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{run.records.map(x => /^[A-Z]+-/.test(x) ? <RecordChip key={x} id={x} /> : <Badge key={x} tone="neutral">{x}</Badge>)}</div>
          </Section>
          <Section label="Permissions used">
            <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.6 }}>{"Read: " + agent(run.agentId).reads.join(", ") + ". " + (run.outcome === "awaiting_approval" ? "Output parked for approval; no external action taken." : "No external action taken.")}</div>
          </Section>
        </Drawer>
      )}
      <ApprovalDrawer id={apr} onClose={() => setApr(null)} />
    </>
  );
}

/* ── Approvals ────────────────────────────────────────────────────────────── */
function Approvals() {
  const s = useGG();
  const pending = pendingApprovals(s);
  const decided = APPROVALS.length - pending.length;
  const byRisk = (r: string) => pending.filter(a => a.risk === r).length;
  const decisions = s.log.filter(e => /^(Approved|Rejected): /.test(e.title)).slice(0, 5);
  const List = ({ items, tone }: { items: string[]; tone: Tone }) => (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
      {items.map(i => <li key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.45, color: "var(--body)" }}><span style={{ width: 6, height: 6, borderRadius: 3, marginTop: 6, flex: "none", background: tone === "ok" ? "var(--ok)" : "var(--bad)" }} />{i}</li>)}
    </ul>
  );
  return (
    <>
      <PageHead title="Approvals" sub="Everything the agents have prepared that needs a person. Review the draft, then approve or reject."
        right={<><Badge tone="warn" dot>{pending.length + " waiting"}</Badge><Badge tone="ok">{decided + " decided"}</Badge></>} />
      <Grid cols="minmax(0,1fr) 320px">
        <ApprovalsPanel />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Waiting by agent">
            {pending.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Queue is clear.</div> :
              <HBars data={AGENTS.map(a => [a.name, pendingFor(s, a.id).length, "var(--warn)"] as [string, number, string]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1])} />}
          </Card>
          <Card title="Waiting by risk">
            <Legend items={[["High: external or client-facing", byRisk("high"), "var(--bad)"], ["Medium", byRisk("medium"), "var(--warn)"], ["Low", byRisk("low"), "var(--ok)"]]} />
          </Card>
          <Card title="What approving does">
            <List tone="ok" items={["Records the decision as Niall Kiernan", "Marks the draft ready and updates linked tasks and evidence", "Writes the decision to Activity and the audit trail"]} />
            <div style={{ ...MONO_LABEL, margin: "14px 0 8px" }}>What it does not do in this demo</div>
            <List tone="bad" items={["Send any email or client request", "Post to LinkedIn or schedule a campaign", "Post, match or reconcile anything in QuickBooks", "Move money or contact a client"]} />
          </Card>
          <Card title="Recent decisions">
            {decisions.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No decisions made in this session yet.</div> :
              <Timeline items={decisions.map(e => ({ when: e.when.slice(11), title: e.title.replace(/^(Approved|Rejected): /, ""), detail: e.detail, tone: (/^Approved/.test(e.title) ? "ok" : "neutral") as Tone }))} />}
          </Card>
        </div>
      </Grid>
    </>
  );
}

export default function AgentsHub({ tab }: { tab: string }) {
  return <Page>{tab === "Runs" ? <Runs /> : tab === "Approvals" ? <Approvals /> : <Overview />}</Page>;
}
