/* In-memory demo state shared by every Global Green screen.
   Frontend only: nothing persists, nothing is sent, nothing is posted. */
import { useSyncExternalStore } from "react";
import {
  APPROVALS, TASKS, OPPORTUNITIES, EVIDENCE, LINKEDIN_POSTS, recordRef,
  type ActivityEvent, type Evidence, type Stage, type Task, type TaskStatus, type LinkedInPost
} from "./data";

export type Decision = "approved" | "rejected";
export interface Focus { kind: string; id: string; nonce: number; }

export interface GGState {
  taskStatus: Record<string, TaskStatus>;
  addedTasks: Task[];
  oppStage: Record<string, Stage>;
  approvals: Record<string, Decision>;
  evidence: Record<string, Evidence["status"] | "uploading">;
  receipts: Record<string, "accepted" | "queried">;
  matches: Record<string, "confirmed" | "rejected">;
  posts: Record<string, LinkedInPost["status"]>;
  campaigns: Record<string, "approved">;
  outreach: Record<string, "approved" | "skipped">;
  agentPaused: Record<string, boolean>;
  log: ActivityEvent[];
  focus: Focus | null;
  toast: { text: string; nonce: number } | null;
}

let state: GGState = {
  taskStatus: {}, addedTasks: [], oppStage: {}, approvals: {}, evidence: {}, receipts: {}, matches: {},
  posts: {}, campaigns: {}, outreach: {}, agentPaused: {}, log: [], focus: null, toast: null
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const gg = {
  get: () => state,
  set(patch: Partial<GGState> | ((s: GGState) => Partial<GGState>)) {
    const p = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...p };
    emit();
  },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
};

export function useGG(): GGState {
  return useSyncExternalStore(gg.subscribe, gg.get, gg.get);
}

/* ── navigation bridge (PulseLogic registers the real navigator) ───────────── */
type Navigator = (page: string, tab?: string) => void;
let navigator: Navigator = () => {};
export function setNavigator(fn: Navigator) { navigator = fn; }
export function navigate(page: string, tab?: string, focus?: { kind: string; id: string }) {
  navigator(page, tab);
  if (focus) gg.set({ focus: { ...focus, nonce: Date.now() } });
}
/** Open whatever record an id points at, wherever it lives. */
export function openRecord(id: string) {
  const r = recordRef(id);
  navigate(r.page, r.tab, { kind: r.kind, id });
}
export function clearFocus() { gg.set({ focus: null }); }

/* ── toast ─────────────────────────────────────────────────────────────────── */
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(text: string) {
  gg.set({ toast: { text, nonce: Date.now() } });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => gg.set({ toast: null }), 3600);
}

/* ── activity log for demo actions ─────────────────────────────────────────── */
let seq = 0;
function stamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
  return "2026-11-16 " + hh + ":" + mm;
}
export function logEvent(e: Omit<ActivityEvent, "id" | "when">) {
  const ev: ActivityEvent = { ...e, id: "U-" + (++seq), when: stamp() };
  gg.set(s => ({ log: [ev].concat(s.log) }));
}

/* ── selectors ─────────────────────────────────────────────────────────────── */
export const taskStatusOf = (s: GGState, t: Task): TaskStatus => s.taskStatus[t.id] || t.status;
export const allTasks = (s: GGState): Task[] => s.addedTasks.concat(TASKS);
export const stageOf = (s: GGState, id: string): Stage => s.oppStage[id] || (OPPORTUNITIES.find(o => o.id === id)?.stage as Stage);
export const evidenceStatus = (s: GGState, e: Evidence) => s.evidence[e.id] || e.status;
export const postStatus = (s: GGState, p: LinkedInPost) => s.posts[p.id] || p.status;
export const pendingApprovals = (s: GGState) => APPROVALS.filter(a => !s.approvals[a.id]);

/* ── actions ───────────────────────────────────────────────────────────────── */
const ME = "Niall Kiernan";

export function setTaskStatus(id: string, status: TaskStatus) {
  gg.set(s => ({ taskStatus: { ...s.taskStatus, [id]: status } }));
  const t = allTasks(gg.get()).find(x => x.id === id);
  if (t) logEvent({ source:"Pulse", category:"Projects", title:"Task moved to " + status, detail:t.title, actor:ME, record:id });
}
export function addTask(t: Omit<Task, "id">) {
  const task: Task = { ...t, id: "T-" + (200 + gg.get().addedTasks.length) };
  gg.set(s => ({ addedTasks: [task].concat(s.addedTasks) }));
  toast("Task created and assigned. Demo only.");
}
export function moveOpportunity(id: string, stage: Stage) {
  gg.set(s => ({ oppStage: { ...s.oppStage, [id]: stage } }));
  const o = OPPORTUNITIES.find(x => x.id === id);
  logEvent({ source:"OnePageCRM", category:"Sales", title:(o?.company || id) + " moved to " + stage, detail:"Stage change mirrored to OnePageCRM (simulated).", actor:ME, record:id });
  toast((o?.company || id) + " moved to " + stage + ".");
}

/** Side effects of approving an AI action, so every screen agrees afterwards. */
const APPROVAL_EFFECTS: Record<string, (s: GGState) => Partial<GGState>> = {
  "APR-01": s => ({ taskStatus: { ...s.taskStatus, "T-103": "Done" } }),
  "APR-02": s => ({ taskStatus: { ...s.taskStatus, "T-102": "Done" } }),
  "APR-03": s => ({ taskStatus: { ...s.taskStatus, "T-101": "Waiting on client" },
    evidence: { ...s.evidence, "EV-241-04": "requested", "EV-241-05": "requested", "EV-241-06": "requested" } }),
  "APR-04": s => ({ taskStatus: { ...s.taskStatus, "T-104": "Waiting on client" },
    evidence: { ...s.evidence, "EV-252-04": "requested", "EV-252-05": "requested" } }),
  "APR-05": s => ({ taskStatus: { ...s.taskStatus, "T-105": "In review" } }),
  "APR-06": s => ({ taskStatus: { ...s.taskStatus, "T-106": "Done" } }),
  "APR-07": s => ({ campaigns: { ...s.campaigns, "CMP-07": "approved" }, taskStatus: { ...s.taskStatus, "T-115": "Done" } }),
  "APR-08": s => ({ posts: { ...s.posts, "LI-21": "approved" }, taskStatus: { ...s.taskStatus, "T-114": "Done" } }),
  "APR-09": s => ({ taskStatus: { ...s.taskStatus, "T-108": "Done" } })
};

export function decide(id: string, decision: Decision) {
  const a = APPROVALS.find(x => x.id === id);
  gg.set(s => ({ approvals: { ...s.approvals, [id]: decision }, ...(decision === "approved" && APPROVAL_EFFECTS[id] ? APPROVAL_EFFECTS[id](s) : {}) }));
  if (!a) return;
  const sends = /Email|reminder|request|Escalation|Campaign|LinkedIn/i.test(a.kind);
  logEvent({ source:"Pulse", category:"Agent", actor:ME, record:a.record,
    title:(decision === "approved" ? "Approved: " : "Rejected: ") + a.title,
    detail: decision === "approved"
      ? (sends ? "Marked approved in the demo. Nothing was sent or posted." : "Marked approved in the demo. No system was changed.")
      : "Rejected. The agent will not act and has logged the reason." });
  toast(decision === "approved"
    ? (sends ? "Approved. Demo only: nothing was sent." : "Approved. Demo only: no system was changed.")
    : "Rejected. The agent will stand down.");
}

export function requestEvidence(ids: string[], label: string) {
  gg.set(s => { const ev = { ...s.evidence }; ids.forEach(i => { ev[i] = "requested"; }); return { evidence: ev }; });
  logEvent({ source:"Pulse", category:"Client comms", title:"Evidence request drafted", detail:label + " (draft only, not sent).", actor:ME, record:ids[0] });
  toast("Request drafted and logged. Not sent.");
}
/** Simulates a client upload landing, for the demo walkthrough. */
export function simulateUpload(id: string) {
  gg.set(s => ({ evidence: { ...s.evidence, [id]: "uploading" } }));
  setTimeout(() => {
    gg.set(s => ({ evidence: { ...s.evidence, [id]: "received" } }));
    const e = EVIDENCE.find(x => x.id === id);
    logEvent({ source:"Pulse", category:"Site assessments", title:"Evidence received (simulated upload)", detail:e ? e.title : id, actor:"Client portal", record:id });
    toast("Upload simulated: " + (e ? e.title : id) + " received.");
  }, 1400);
}
export function decideReceipt(id: string, d: "accepted" | "queried") {
  gg.set(s => ({ receipts: { ...s.receipts, [id]: d } }));
  toast(d === "accepted" ? "Suggestion accepted for review. Nothing posted to QuickBooks." : "Queried and routed to the accountant.");
}
export function decideMatch(id: string, d: "confirmed" | "rejected") {
  gg.set(s => ({ matches: { ...s.matches, [id]: d } }));
  toast(d === "confirmed" ? "Match confirmed in the demo. Not reconciled in QuickBooks." : "Match rejected. Line left unmatched.");
}
export function setPost(id: string, status: LinkedInPost["status"]) {
  gg.set(s => ({ posts: { ...s.posts, [id]: status } }));
  toast(status === "approved" ? "Post approved. LinkedIn is a proposed integration; nothing posted." : "Post updated.");
}
export function decideOutreach(id: string, d: "approved" | "skipped") {
  gg.set(s => ({ outreach: { ...s.outreach, [id]: d } }));
}
export function toggleAgent(id: string) {
  gg.set(s => ({ agentPaused: { ...s.agentPaused, [id]: !s.agentPaused[id] } }));
  toast(gg.get().agentPaused[id] ? "Agent paused. It will finish nothing new until resumed." : "Agent resumed.");
}

export const APPROVAL_COUNT = () => pendingApprovals(gg.get()).length;
export { APPROVALS };
