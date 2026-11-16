/* Shared helpers for the Projects and Site Assessments modules. */
import type { ReactNode } from "react";
import {
  parseDate, COST_RATE, type Project, type ProjectStatus, type Service, type VisitStatus, type Evidence, type Finding
} from "../../data";
import type { Tone } from "../../ui";

export const PROJECT_LABEL: Record<ProjectStatus, string> = { on_track: "On track", at_risk: "At risk", blocked: "Blocked" };
export const PROJECT_TONE: Record<ProjectStatus, Tone> = { on_track: "ok", at_risk: "warn", blocked: "bad" };

export const VISIT_LABEL: Record<VisitStatus, string> = {
  confirmed: "Confirmed", in_progress: "On site now", at_risk: "At risk", evidence_pending: "Evidence pending", conflict: "Resource conflict", completed: "Completed"
};
export const VISIT_TONE: Record<VisitStatus, Tone> = {
  confirmed: "ok", in_progress: "info", at_risk: "warn", evidence_pending: "warn", conflict: "bad", completed: "neutral"
};

export type EvStatus = Evidence["status"] | "uploading";
export const EV_LABEL: Record<EvStatus, string> = { received: "Received", missing: "Missing", requested: "Requested", in_review: "In review", uploading: "Uploading" };
export const EV_TONE: Record<EvStatus, Tone> = { received: "ok", missing: "bad", requested: "warn", in_review: "info", uploading: "accent" };

export const FINDING_LABEL: Record<Finding["status"], string> = { draft: "Draft", engineer_review: "Engineer review", client_review: "Client review", accepted: "Accepted" };
export const FINDING_TONE: Record<Finding["status"], Tone> = { draft: "neutral", engineer_review: "warn", client_review: "info", accepted: "ok" };
export const SEV_TONE: Record<Finding["severity"], Tone> = { high: "bad", medium: "warn", low: "neutral" };

/** Colour per service line, used to colour allocation bars. */
export const SERVICE_COLOR: Record<Service, string> = {
  "Energy audit": "var(--gg-green)",
  "Environmental assessment": "var(--gg-blue)",
  "Renewable feasibility": "var(--gg-lime)",
  "ISO 14001": "#c8b4f0",
  "ISO 50001": "#c8b4f0",
  "ISO 14064": "#c8b4f0",
  "ESG & sustainability": "#e6c78a",
  "Carbon & climate action": "#e6c78a",
  "B Corp support": "#f0a0c0",
  "Energy monitoring": "#9fd6f0"
};
export const SERVICE_GROUPS: [string, string][] = [
  ["Energy audits", "var(--gg-green)"], ["Environmental", "var(--gg-blue)"], ["Renewables", "var(--gg-lime)"],
  ["ISO systems", "#c8b4f0"], ["Carbon & ESG", "#e6c78a"], ["B Corp", "#f0a0c0"], ["Monitoring", "#9fd6f0"]
];

/* ── dates ─────────────────────────────────────────────────────────────────── */
export function addDays(iso: string, n: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dow(iso: string): string { return DOW_SHORT[parseDate(iso).getUTCDay()]; }
export function dayNum(iso: string): number { return parseDate(iso).getUTCDate(); }
export function dueLabel(days: number): string {
  if (days < 0) return Math.abs(days) + "d overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return "in " + days + "d";
}

/* ── earned-value style forecast ───────────────────────────────────────────── */
/** Estimate at completion: hours spent plus the budget for the work not yet earned. */
export function eac(p: Project): number { return p.hoursSpent + p.budgetHours * (1 - p.progress / 100); }
export function projectFin(p: Project) {
  const forecast = eac(p);
  const cost = forecast * COST_RATE;
  return {
    forecast, variance: (forecast - p.budgetHours) / p.budgetHours, cost,
    margin: p.value - cost, marginPct: (p.value - cost) / p.value, earned: p.value * p.progress / 100,
    burn: p.hoursSpent / p.budgetHours
  };
}

/* ── small controls ────────────────────────────────────────────────────────── */
export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label?: string }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 8px 0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, fontSize: 12, color: "var(--faint)", flex: "none" }}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ border: 0, outline: 0, background: "none", color: "var(--ink)", fontSize: 12.5, cursor: "pointer", maxWidth: 190 }}>
        {options.map(([v, l]) => <option key={v} value={v} style={{ background: "var(--surface)", color: "var(--ink)" }}>{l}</option>)}
      </select>
    </label>
  );
}

/** Compact row used inside drawers and cards. */
export function Row({ children, onClick, last }: { children: ReactNode; onClick?: () => void; last?: boolean }) {
  return (
    <div className={onClick ? "gg-row" : undefined} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: last ? 0 : "1px solid var(--border)", cursor: onClick ? "pointer" : "default", minWidth: 0 }}>
      {children}
    </div>
  );
}
export function Box({ children }: { children: ReactNode }) {
  return <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", background: "var(--surface-2)", overflow: "hidden" }}>{children}</div>;
}
export const fmtH = (n: number) => Math.round(n) + "h";
export const pct = (n: number, dp = 0) => (n * 100).toFixed(dp) + "%";
