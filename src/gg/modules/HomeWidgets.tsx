/* Home right-hand rail for Global Green: briefing, health, priorities, visits,
   approvals and agent activity. The centre column (chat) stays untouched. */
import type { ReactNode } from "react";
import { METRICS, SITE_VISITS, AGENT_RUNS, AGENTS, APPROVALS, client, staff, fmtDay, eur, agent, TODAY } from "../data";
import { useGG, navigate, openRecord, decide, setTaskStatus, allTasks, taskStatusOf } from "../store";
import { Avatar, Badge, MONO_LABEL, type Tone } from "../ui";

const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", padding: "14px 15px 15px", boxShadow: "var(--card-shadow)" } as const;

function Head({ title, right, onRemove }: { title: string; right?: ReactNode; onRemove?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, letterSpacing: "-.1px" }}>{title}</span>
      {right}
      {onRemove && <button onClick={onRemove} style={{ height: 22, padding: "0 8px", border: "1px solid var(--border)", borderRadius: 999, background: "none", color: "var(--dim)", fontSize: 11, cursor: "pointer" }}>Remove</button>}
    </div>
  );
}
function L({ children, onClick, tone }: { children: ReactNode; onClick: () => void; tone?: "bad" | "warn" }) {
  return <button onClick={onClick} className="gg-chip" style={{ border: 0, padding: 0, background: "none", cursor: "pointer", font: "inherit", color: tone === "bad" ? "var(--bad)" : tone === "warn" ? "var(--warn)" : "var(--ink)", textDecoration: "underline", textDecorationColor: "var(--border-strong)", textUnderlineOffset: 3 }}>{children}</button>;
}

const VISIT_TONE: Record<string, [Tone, string]> = {
  in_progress: ["info", "On site"], confirmed: ["ok", "Ready"], at_risk: ["bad", "At risk"],
  evidence_pending: ["warn", "Evidence pending"], conflict: ["warn", "Needs surveyor"], completed: ["neutral", "Done"]
};

export default function HomeWidgets({ v }: { v: any }) {
  const s = useGG();
  const show = v.show || {};
  const rm = (id: string) => v.widgetEdit ? () => v.removeWidget(id) : undefined;
  const pending = APPROVALS.filter(a => !s.approvals[a.id]);
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const priorities = allTasks(s)
    .filter(t => taskStatusOf(s, t) !== "Done" && t.due <= "2026-11-17" && t.priority === "High")
    .slice(0, 5);
  const week = SITE_VISITS.filter(x => x.date >= TODAY && x.date <= "2026-11-22");
  const actionsToday = AGENTS.reduce((n, a) => n + a.actionsToday, 0);
  const handled = AGENT_RUNS.filter(r => r.when.startsWith("2026-11-16") && r.outcome === "completed");

  return (
    <>
      {show.brief && (
        <div style={{ ...card, background: "linear-gradient(160deg, var(--accent-faint), var(--surface) 60%)", borderColor: "var(--accent-line)" }}>
          <Head title="Morning briefing" right={<span style={{ ...MONO_LABEL, letterSpacing: ".08em" }}>07:00 · Briefing</span>} onRemove={rm("brief")} />
          <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--body)" }}>
            {greet}, Niall. There are <L onClick={() => navigate("Projects", "Overview")}>{METRICS.projects} active projects</L>, with{" "}
            <L tone="warn" onClick={() => navigate("Projects", "Active Projects")}>{METRICS.atRisk} at risk</L> and{" "}
            <L tone="bad" onClick={() => navigate("Projects", "Milestones")}>{METRICS.blocked} blocked</L>.{" "}
            <L tone="bad" onClick={() => openRecord("INV-1048")}>Westhaven Retail Parks has an €18,400 invoice overdue by 42 days</L>.{" "}
            <L tone="warn" onClick={() => openRecord("GG-241")}>Glenmere Foods is missing 3 meter-data files</L> ahead of Wednesday's site visit.{" "}
            I have prepared the recommended follow-ups <L onClick={() => navigate("Agents", "Approvals")}>for your approval</L>.
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
            <button className="gg-btn" onClick={() => v.askBrief("What needs my attention today?")} style={{ height: 28, padding: "0 12px", border: 0, borderRadius: 999, background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Ask about this</button>
            <button className="gg-btn" onClick={() => navigate("Dashboard", "Executive")} style={{ height: 28, padding: "0 12px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "var(--surface-2)", color: "var(--ink)", fontSize: 12, cursor: "pointer" }}>Executive view</button>
          </div>
        </div>
      )}

      {show.health && (
        <div style={card}>
          <Head title="Business health" right={<span style={{ ...MONO_LABEL, letterSpacing: ".08em" }}>Live</span>} onRemove={rm("health")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {([
              ["Invoiced (Oct)", eur(METRICS.octRevenue), "+6.2% vs Sep", undefined, () => navigate("Finance", "Overview")],
              ["Open pipeline", eur(METRICS.pipeline), METRICS.opportunities + " opportunities", undefined, () => navigate("Sales", "Pipeline")],
              ["Overdue", eur(METRICS.overdueValue), METRICS.overdueCount + " invoices", "bad", () => navigate("Finance", "Invoices")],
              ["Active projects", String(METRICS.projects), METRICS.atRisk + " at risk · " + METRICS.blocked + " blocked", "warn", () => navigate("Projects", "Overview")]
            ] as [string, string, string, Tone | undefined, () => void][]).map(([k, val, sub, tone, go]) => (
              <button key={k} className="gg-click" onClick={go} style={{ textAlign: "left", padding: "10px 11px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,12px)", cursor: "pointer", color: "var(--ink)", minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--dim)" }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.5px", marginTop: 5, fontVariantNumeric: "tabular-nums", color: tone === "bad" ? "var(--bad)" : "var(--ink)" }}>{val}</div>
                <div style={{ fontSize: 10.5, color: tone ? (tone === "bad" ? "var(--bad)" : "var(--warn)") : "var(--faint)", marginTop: 4 }}>{sub}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", height: 6, borderRadius: 99, overflow: "hidden", marginTop: 11, gap: 2 }} title="12 on track · 4 at risk · 2 blocked">
            <span style={{ flex: METRICS.onTrack, background: "var(--ok)" }} />
            <span style={{ flex: METRICS.atRisk, background: "var(--warn)" }} />
            <span style={{ flex: METRICS.blocked, background: "var(--bad)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--faint)", marginTop: 6 }}>
            <span>{METRICS.onTrack} on track</span><span>{METRICS.atRisk} at risk</span><span>{METRICS.blocked} blocked</span>
          </div>
        </div>
      )}

      {show.priorities && (
        <div style={card}>
          <Head title="Today's priorities" right={<Badge tone="warn">{priorities.length}</Badge>} onRemove={rm("priorities")} />
          {priorities.map((t, i) => {
            const done = taskStatusOf(s, t) === "Done";
            return (
              <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
                <button onClick={() => setTaskStatus(t.id, done ? "In progress" : "Done")} title="Mark done (demo)" style={{ width: 18, height: 18, flex: "none", marginTop: 1, borderRadius: 6, border: "1.5px solid " + (done ? "var(--accent)" : "var(--border-strong)"), background: done ? "var(--accent)" : "none", cursor: "pointer", padding: 0, color: "var(--on-accent)", fontSize: 11, lineHeight: 1 }}>{done ? "✓" : ""}</button>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => t.record ? openRecord(t.record) : navigate("Work", "Tasks")}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4, color: done ? "var(--faint)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3 }}>{staff(t.owner).name} · {t.due <= TODAY ? "today" : "tomorrow"}{t.clientId ? " · " + client(t.clientId).name : ""}</div>
                </div>
                <Avatar id={t.owner} size={22} />
              </div>
            );
          })}
          <button onClick={() => navigate("Work", "Tasks")} style={{ marginTop: 6, border: 0, background: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: 0 }}>All tasks</button>
        </div>
      )}

      {show.visits && (
        <div style={card}>
          <Head title="Site assessments this week" right={<span style={{ fontSize: 11.5, color: "var(--dim)" }}>{week.length}</span>} onRemove={rm("visits")} />
          {week.map((x, i) => {
            const [tone, label] = VISIT_TONE[x.status];
            return (
              <div key={x.id} className="gg-row" onClick={() => openRecord(x.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 4px", borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", borderRadius: 8 }}>
                <div style={{ width: 40, flex: "none", fontSize: 10.5, color: "var(--faint)", lineHeight: 1.3 }}>{fmtDay(x.date).split(" ")[0]}<br /><span style={{ color: "var(--body)", fontVariantNumeric: "tabular-nums" }}>{x.time}</span></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client(x.clientId).name}</div>
                  <div style={{ fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.type} · {x.engineers.map(e => staff(e).first).join(", ")}</div>
                </div>
                <Badge tone={tone}>{label}</Badge>
              </div>
            );
          })}
        </div>
      )}

      {show.approvals && (
        <div style={card}>
          <Head title="Approval requests" right={<Badge tone={pending.length ? "warn" : "ok"}>{pending.length} waiting</Badge>} onRemove={rm("approvals")} />
          {pending.slice(0, 3).map((a, i) => (
            <div key={a.id} style={{ padding: "9px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.4, cursor: "pointer" }} onClick={() => openRecord(a.id)}>{a.title}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 7 }}>
                <span style={{ flex: 1, fontSize: 11, color: "var(--faint)" }}>{agent(a.agentId).name} · for {staff(a.owner).first}</span>
                <button className="gg-btn" onClick={() => openRecord(a.id)} style={{ height: 24, padding: "0 9px", border: "1px solid var(--border)", borderRadius: 999, background: "none", color: "var(--dim)", fontSize: 11, cursor: "pointer" }}>Review</button>
                <button className="gg-btn" onClick={() => decide(a.id, "approved")} style={{ height: 24, padding: "0 10px", border: 0, borderRadius: 999, background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>Approve</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Nothing waiting. Every agent draft has a decision.</div>}
          {pending.length > 3 && <button onClick={() => navigate("Agents", "Approvals")} style={{ marginTop: 6, border: 0, background: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: 0 }}>All {pending.length} approvals</button>}
        </div>
      )}

      {show.ai && (
        <div style={card}>
          <Head title="Handled by agents" right={<span style={{ fontSize: 11.5, color: "var(--dim)" }}>{actionsToday} actions today</span>} onRemove={rm("ai")} />
          {handled.slice(0, 4).map((r, i) => (
            <div key={r.id} className="gg-row" onClick={() => openRecord(r.id)} style={{ display: "flex", gap: 9, padding: "8px 4px", borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", borderRadius: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--ok)", marginTop: 6, flex: "none" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--faint)" }}>{agent(r.agentId).name} · {r.when.slice(11)}</div>
                <div style={{ fontSize: 12, color: "var(--body)", lineHeight: 1.45, marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{r.summary}</div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>Agents read, draft and recommend. Nothing is sent, posted, paid or reconciled without a person.</div>
        </div>
      )}
    </>
  );
}
