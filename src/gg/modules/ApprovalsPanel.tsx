/* Shared approval queue: used by Agents → Approvals, Work → Approvals and Home.
   Approving only changes in-memory demo state. Nothing is sent, posted or reconciled. */
import { useState } from "react";
import { APPROVALS, agent, staff, fmtDate, eur, type Approval } from "../data";
import { useGG, decide, openRecord } from "../store";
import { Card, Badge, Btn, Seg, Drawer, Section, Kv, RecordChip, Avatar, Empty, AIBox, MONO_LABEL, useFocus, type Tone } from "../ui";

const RISK: Record<Approval["risk"], Tone> = { low: "ok", medium: "warn", high: "bad" };
type View = "Waiting" | "Approved" | "Rejected" | "All";

export function ApprovalDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useGG();
  const a = APPROVALS.find(x => x.id === id);
  if (!a) return null;
  const d = s.approvals[a.id];
  const ag = agent(a.agentId);
  return (
    <Drawer open={!!a} onClose={onClose} eyebrow={a.kind.toUpperCase() + " · " + a.id}
      badge={d ? <Badge tone={d === "approved" ? "ok" : "bad"} dot>{d === "approved" ? "Approved (demo)" : "Rejected"}</Badge> : <Badge tone="warn" dot>Waiting on {staff(a.owner).first}</Badge>}
      title={a.title}
      footer={d ? (
        <><span style={{ flex: 1, fontSize: 12, color: "var(--dim)" }}>Decision recorded as Niall Kiernan. Demo only: nothing was sent.</span><Btn onClick={onClose}>Close</Btn></>
      ) : (
        <><span style={{ flex: 1, fontSize: 12, color: "var(--faint)" }}>Approving marks it ready. It does not send, post or reconcile.</span>
          <Btn kind="danger" onClick={() => decide(a.id, "rejected")}>Reject</Btn>
          <Btn kind="primary" onClick={() => decide(a.id, "approved")}>Approve</Btn></>
      )}>
      <AIBox title={ag.name + " prepared this"} tone="accent">{a.summary}</AIBox>
      <Kv items={[
        ["Prepared by", ag.name + " agent"], ["Decision owner", staff(a.owner).name],
        ["Raised", fmtDate(a.created) + " " + a.created.slice(11)], ["Risk", a.risk],
        ...(a.value ? [["Value", eur(a.value)] as [string, string]] : []),
        ...(a.to ? [["Recipient (mock)", a.to] as [string, string]] : [])
      ]} />
      {a.draft && (
        <Section label="Draft for review" right={<Badge tone="neutral">Not sent</Badge>}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "var(--ui)", fontSize: 13, lineHeight: 1.65, color: "var(--body)", padding: "14px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>{a.draft}</pre>
        </Section>
      )}
      <Section label="Linked record">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><RecordChip id={a.record} /></div>
      </Section>
      <Section label="Guardrails">
        <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.6 }}>
          {ag.name} can {ag.can.join(", ").toLowerCase()}. It must stop for approval before: {ag.needsApproval.join(", ").toLowerCase() || "nothing external"}.
        </div>
      </Section>
    </Drawer>
  );
}

export function ApprovalRow({ a, onOpen }: { a: Approval; onOpen: (id: string) => void }) {
  const s = useGG();
  const d = s.approvals[a.id];
  return (
    <div className="gg-row" onClick={() => onOpen(a.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderTop: "1px solid var(--border)", cursor: "pointer", flexWrap: "wrap" }}>
      <Avatar id={a.owner} />
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{a.title}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{a.summary}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Badge tone="info">{agent(a.agentId).name}</Badge>
          <Badge tone={RISK[a.risk]}>{a.risk} risk</Badge>
          <span style={{ ...MONO_LABEL, letterSpacing: ".06em" }}>{a.kind}</span>
          {a.value ? <span style={{ fontSize: 12, color: "var(--body)", fontVariantNumeric: "tabular-nums" }}>{eur(a.value)}</span> : null}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "none" }} onClick={e => e.stopPropagation()}>
        {d ? <Badge tone={d === "approved" ? "ok" : "bad"} dot>{d === "approved" ? "Approved" : "Rejected"}</Badge> : <>
          <Btn small kind="quiet" onClick={() => openRecord(a.record)}>Open record</Btn>
          <Btn small kind="danger" onClick={() => decide(a.id, "rejected")}>Reject</Btn>
          <Btn small kind="primary" onClick={() => decide(a.id, "approved")}>Approve</Btn>
        </>}
      </div>
    </div>
  );
}

export default function ApprovalsPanel({ title = "Approval queue", sub, limit, compact }: { title?: string; sub?: string; limit?: number; compact?: boolean }) {
  const s = useGG();
  const [view, setView] = useState<View>("Waiting");
  const [open, setOpen] = useState<string | null>(null);
  useFocus("Approval", setOpen);
  const counts = {
    Waiting: APPROVALS.filter(a => !s.approvals[a.id]).length,
    Approved: APPROVALS.filter(a => s.approvals[a.id] === "approved").length,
    Rejected: APPROVALS.filter(a => s.approvals[a.id] === "rejected").length,
    All: APPROVALS.length
  };
  let rows = APPROVALS.filter(a => view === "All" ? true : view === "Waiting" ? !s.approvals[a.id] : s.approvals[a.id] === (view === "Approved" ? "approved" : "rejected"));
  if (limit) rows = rows.slice(0, limit);
  return (
    <>
      <Card flush title={title} sub={sub || "Every item was prepared by an agent and stops here for a person. Approve, reject or open the record."}
        right={compact ? undefined : <Seg options={["Waiting", "Approved", "Rejected", "All"] as View[]} value={view} onChange={setView} counts={counts} />}>
        {rows.map(a => <ApprovalRow key={a.id} a={a} onOpen={setOpen} />)}
        {rows.length === 0 && <Empty title={view === "Waiting" ? "Nothing waiting on a decision" : "No decisions here yet"} sub="New agent recommendations appear here with their draft and linked record." />}
      </Card>
      <ApprovalDrawer id={open} onClose={() => setOpen(null)} />
    </>
  );
}
