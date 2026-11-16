/* Global Green UI kit, built on the Pulse Harbour tokens so every module reads
   as part of the same product. Colours come from CSS variables only. */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { staff, recordRef, type StaffId } from "./data";
import { openRecord, useGG, clearFocus } from "./store";

/* ── tokens ────────────────────────────────────────────────────────────────── */
export type Tone = "ok" | "warn" | "bad" | "info" | "accent" | "neutral" | "lime";
export const TONE: Record<Tone, [string, string]> = {
  ok: ["var(--ok)", "var(--ok-soft)"],
  warn: ["var(--warn)", "var(--warn-soft)"],
  bad: ["var(--bad)", "var(--bad-soft)"],
  info: ["var(--gg-blue)", "var(--gg-blue-soft)"],
  accent: ["var(--accent)", "var(--accent-soft)"],
  lime: ["var(--gg-lime)", "var(--gg-lime-soft)"],
  neutral: ["var(--dim)", "var(--track)"]
};
export const SERIES = ["var(--gg-green)", "var(--gg-blue)", "var(--gg-lime)", "var(--warn)", "#c8b4f0", "var(--bad)", "var(--dim)"];
export const MONO_LABEL: CSSProperties = { fontFamily: "var(--mono)", fontSize: "9.5px", letterSpacing: ".13em", color: "var(--faint)", textTransform: "uppercase" };

/* ── layout ────────────────────────────────────────────────────────────────── */
export function Page({ children }: { children: ReactNode }) {
  return <div style={{ padding: "6px 22px 48px", animation: "pageIn .55s var(--ease) both" }}>{children}</div>;
}

export function PageHead({ title, sub, right, eyebrow }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; eyebrow?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", padding: "18px 2px 18px" }}>
      <div style={{ flex: "1 1 360px", minWidth: 0 }}>
        {eyebrow && <div style={{ ...MONO_LABEL, marginBottom: 8 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing: "-.6px", lineHeight: 1.15 }}>{title}</h1>
        {sub && <div style={{ marginTop: 6, fontSize: 13.5, color: "var(--dim)", lineHeight: 1.55, maxWidth: "78ch" }}>{sub}</div>}
      </div>
      {right && <div style={{ flex: "none", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{right}</div>}
    </div>
  );
}

export function Grid({ cols, gap = 14, children, style }: { cols: string; gap?: number; children: ReactNode; style?: CSSProperties }) {
  return <div className="gg-grid" style={{ display: "grid", gridTemplateColumns: cols, gap, alignItems: "start", ...style }}>{children}</div>;
}

export function Card({ title, sub, right, children, pad = 18, style, flush, tone }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; pad?: number; style?: CSSProperties; flush?: boolean; tone?: Tone;
}) {
  return (
    <section style={{
      background: "var(--surface)", border: "1px solid " + (tone ? TONE[tone][0].replace("var(", "var(") : "var(--border)"),
      borderColor: tone ? "color-mix(in srgb, " + TONE[tone][0] + " 38%, transparent)" : "var(--border)",
      borderRadius: "var(--card-r,18px)", boxShadow: "var(--card-shadow)", minWidth: 0, overflow: "hidden", ...style
    }}>
      {(title || right) && (
        <header style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: flush ? "16px 18px 12px" : pad + "px " + pad + "px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.15px" }}>{title}</div>}
            {sub && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
          </div>
          {right && <div style={{ flex: "none", display: "flex", gap: 6, alignItems: "center" }}>{right}</div>}
        </header>
      )}
      <div style={{ padding: flush ? 0 : (title || right ? "12px " + pad + "px " + pad + "px" : pad) }}>{children}</div>
    </section>
  );
}

/* ── atoms ─────────────────────────────────────────────────────────────────── */
export function Badge({ tone = "neutral", children, dot, style }: { tone?: Tone; children: ReactNode; dot?: boolean; style?: CSSProperties }) {
  const [fg, bg] = TONE[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: 999, background: bg, color: fg, fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", flex: "none", ...style }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 3, background: fg }} />}
      {children}
    </span>
  );
}

export function Avatar({ id, size = 26 }: { id: StaffId | string; size?: number }) {
  const s = staff(id);
  return (
    <span title={s ? s.name + " · " + s.role : String(id)} style={{ width: size, height: size, flex: "none", borderRadius: 999, background: s ? s.color : "var(--track)", color: "#0b0e10", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 600 }}>
      {s ? s.initials : "?"}
    </span>
  );
}
export function Person({ id, sub }: { id: StaffId | string; sub?: boolean }) {
  const s = staff(id);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Avatar id={id} size={22} />
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5 }}>
        {s ? s.name : id}{sub && s ? <span style={{ color: "var(--faint)" }}> · {s.role}</span> : null}
      </span>
    </span>
  );
}

export function Btn({ kind = "ghost", onClick, children, small, disabled, title, style }: {
  kind?: "primary" | "ghost" | "quiet" | "danger"; onClick?: (e: any) => void; children: ReactNode; small?: boolean; disabled?: boolean; title?: string; style?: CSSProperties;
}) {
  const base: CSSProperties = { height: small ? 28 : 34, padding: small ? "0 11px" : "0 15px", borderRadius: "var(--r-ctl,10px)", fontSize: small ? 12 : 13, fontWeight: 500, cursor: disabled ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", opacity: disabled ? 0.45 : 1, transition: "transform .16s var(--ease),border-color .2s var(--ease),background .2s var(--ease)", flex: "none" };
  const k: Record<string, CSSProperties> = {
    primary: { border: 0, background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", boxShadow: "var(--accent-glow,none)" },
    ghost: { border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)" },
    quiet: { border: "1px solid transparent", background: "none", color: "var(--dim)" },
    danger: { border: "1px solid color-mix(in srgb, var(--bad) 40%, transparent)", background: "var(--bad-soft)", color: "var(--bad)" }
  };
  return <button className="gg-btn" title={title} disabled={disabled} onClick={disabled ? undefined : onClick} style={{ ...base, ...k[kind], ...style }}>{children}</button>;
}

export function Seg<T extends string>({ options, value, onChange, counts }: { options: readonly T[] | T[]; value: T; onChange: (v: T) => void; counts?: Partial<Record<T, number>> }) {
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, padding: 3, background: "var(--surface-faint)", border: "1px solid var(--border)", borderRadius: 999 }}>
      {options.map(o => {
        const on = o === value;
        return (
          <button key={o} className="gg-seg" onClick={() => onChange(o)} style={{ height: 28, padding: "0 12px", border: 0, borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: on ? 600 : 500, background: on ? "var(--pill-bg)" : "none", color: on ? "var(--pill-ink)" : "var(--dim)", display: "inline-flex", alignItems: "center", gap: 6, transition: "background .2s var(--ease),color .2s var(--ease)" }}>
            {o}
            {counts && counts[o] !== undefined && <span style={{ fontSize: 10.5, opacity: .7, fontVariantNumeric: "tabular-nums" }}>{counts[o]}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Search({ value, onChange, placeholder, width = 260 }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number | string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, height: 34, width, maxWidth: "100%", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round"><path d="m21 21-4.3-4.3 M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" /></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontSize: 12.5, color: "var(--ink)" }} />
      {value && <button onClick={() => onChange("")} style={{ border: 0, background: "none", color: "var(--faint)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>}
    </label>
  );
}

export function Stat({ label, value, hint, tone, onClick, big }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; onClick?: () => void; big?: boolean }) {
  return (
    <div className={onClick ? "gg-click" : undefined} onClick={onClick} style={{ padding: "14px 16px 15px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md,16px)", cursor: onClick ? "pointer" : "default", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {tone && <span style={{ width: 6, height: 6, borderRadius: 3, background: TONE[tone][0] }} />}
        <span style={{ fontSize: 11.5, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      </div>
      <div style={{ fontSize: big ? 28 : 22, fontWeight: 600, letterSpacing: "-.7px", marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: tone === "bad" || tone === "warn" ? TONE[tone][0] : "var(--ink)" }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 7, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

export function Meter({ value, tone = "accent", height = 6 }: { value: number; tone?: Tone; height?: number }) {
  return (
    <span style={{ display: "block", height, borderRadius: 99, background: "var(--track)", overflow: "hidden", minWidth: 40 }}>
      <span style={{ display: "block", width: Math.max(0, Math.min(100, value)) + "%", height: "100%", borderRadius: 99, background: TONE[tone][0], transition: "width .5s var(--ease)" }} />
    </span>
  );
}

export function Kv({ items, cols = 2 }: { items: [string, ReactNode][]; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(" + cols + ",minmax(0,1fr))", gap: 8 }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", minWidth: 0 }}>
          <div style={MONO_LABEL}>{k}</div>
          <div style={{ fontSize: 13, marginTop: 5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function RecordChip({ id, label }: { id: string; label?: string }) {
  const r = recordRef(id);
  return (
    <button className="gg-chip" onClick={(e) => { e.stopPropagation(); openRecord(id); }} title={"Open " + r.kind.toLowerCase()}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 24, padding: "0 9px", border: "1px solid var(--border)", borderRadius: 999, background: "var(--surface-2)", color: "var(--body)", fontSize: 11.5, cursor: "pointer", maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "none" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".08em", color: "var(--faint)" }}>{r.kind.toUpperCase()}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label || r.label}</span>
    </button>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "38px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

/** AI recommendation strip. Always phrased as a recommendation awaiting a person. */
export function AIBox({ title, children, actions, tone = "accent" }: { title: ReactNode; children?: ReactNode; actions?: ReactNode; tone?: Tone }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", borderRadius: "var(--r-md,16px)", background: "linear-gradient(100deg," + TONE[tone][1] + ", transparent 70%)", border: "1px solid color-mix(in srgb, " + TONE[tone][0] + " 30%, transparent)" }}>
      <span style={{ flex: "none", width: 30, height: 30, borderRadius: 999, background: TONE[tone][1], color: TONE[tone][0], display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2.5-6 3.5 12 3-8 2 2h5" /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ ...MONO_LABEL, color: TONE[tone][0] }}>Pulse recommends</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{title}</div>
        {children && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.55 }}>{children}</div>}
        {actions && <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </div>
  );
}

/* ── table ─────────────────────────────────────────────────────────────────── */
export interface Col<R> { key: string; label: string; width?: string; align?: "left" | "right" | "center"; render: (r: R) => ReactNode; }
export function Table<R>({ cols, rows, onRow, empty, selected, rowKey }: { cols: Col<R>[]; rows: R[]; onRow?: (r: R) => void; empty?: string; selected?: string; rowKey?: (r: R) => string }) {
  const tpl = cols.map(c => c.width || "1fr").join(" ");
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 640 }}>
        <div style={{ display: "grid", gridTemplateColumns: tpl, gap: 12, padding: "9px 18px", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>
          {cols.map(c => <div key={c.key} style={{ fontSize: 11, fontWeight: 500, color: "var(--faint)", textAlign: c.align || "left", whiteSpace: "nowrap" }}>{c.label}</div>)}
        </div>
        {rows.map((r, i) => {
          const k = rowKey ? rowKey(r) : String(i);
          const on = selected !== undefined && k === selected;
          return (
            <div key={k} className={onRow ? "gg-row" : undefined} onClick={onRow ? () => onRow(r) : undefined}
              style={{ display: "grid", gridTemplateColumns: tpl, gap: 12, alignItems: "center", padding: "11px 18px", borderTop: i ? "1px solid var(--border)" : 0, cursor: onRow ? "pointer" : "default", background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
              {cols.map(c => <div key={c.key} style={{ minWidth: 0, fontSize: 12.5, textAlign: c.align || "left", overflow: "hidden", textOverflow: "ellipsis" }}>{c.render(r)}</div>)}
            </div>
          );
        })}
        {rows.length === 0 && <Empty title={empty || "Nothing matches"} sub="Try a different filter or search." />}
      </div>
    </div>
  );
}

/* ── drawer (record detail) ────────────────────────────────────────────────── */
export function Drawer({ open, onClose, eyebrow, title, badge, children, footer, width = 560 }: {
  open: boolean; onClose: () => void; eyebrow?: string; title: ReactNode; badge?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  /* Portal to the themed app root: page wrappers animate with transforms, which
     would otherwise trap a fixed overlay inside the scrolling page. */
  const host = (typeof document !== "undefined" && document.querySelector("[data-theme]")) || null;
  const node = (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 66, background: "var(--scrim)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(" + width + "px,100%)", height: "100%", display: "flex", flexDirection: "column", background: "var(--overlay)", borderLeft: "1px solid var(--border)", boxShadow: "-30px 0 80px rgba(0,0,0,.5)", animation: "popIn .3s var(--ease) both" }}>
        <div style={{ flex: "none", display: "flex", alignItems: "flex-start", gap: 12, padding: "22px 24px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              {eyebrow && <span style={MONO_LABEL}>{eyebrow}</span>}
              {badge}
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.4px", marginTop: 8, lineHeight: 1.3 }}>{title}</div>
          </div>
          <button className="gg-btn" onClick={onClose} style={{ flex: "none", width: 30, height: 30, border: "1px solid var(--border)", borderRadius: 999, background: "none", color: "var(--dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
        {footer && <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "14px 24px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  );
  return host ? createPortal(node, host) : node;
}
export function Section({ label, children, right }: { label: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ ...MONO_LABEL, flex: 1 }}>{label}</span>{right}
      </div>
      {children}
    </div>
  );
}

/** Opens a drawer when another screen navigated here with a matching focus. */
export function useFocus(kind: string | string[], open: (id: string) => void) {
  const s = useGG();
  const kinds = Array.isArray(kind) ? kind : [kind];
  useEffect(() => {
    if (s.focus && kinds.indexOf(s.focus.kind) > -1) { open(s.focus.id); clearFocus(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.focus?.nonce]);
}

/* ── timeline ──────────────────────────────────────────────────────────────── */
export function Timeline({ items }: { items: { when: string; title: ReactNode; detail?: ReactNode; tone?: Tone; right?: ReactNode }[] }) {
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: "none", width: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 9, height: 9, marginTop: 4, borderRadius: 5, background: TONE[it.tone || "neutral"][0], boxShadow: "0 0 0 3px " + TONE[it.tone || "neutral"][1] }} />
            {i < items.length - 1 && <span style={{ flex: 1, width: 1, background: "var(--border-strong)", marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0 }}>{it.title}</span>
              {it.right}
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>{it.when}</span>
            </div>
            {it.detail && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{it.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── charts (pure SVG/CSS, values always passed in from seeded records) ───── */
export function Bars({ data, height = 160, format = (n: number) => String(n), highlight }: { data: [string, number, string?][]; height?: number; format?: (n: number) => string; highlight?: string }) {
  const max = Math.max(1, ...data.map(d => d[1]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: height + 34 }}>
      {data.map(([label, val, color]) => {
        const on = highlight === label;
        return (
          <div key={label} title={label + ": " + format(val)} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10.5, color: on ? "var(--ink)" : "var(--faint)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{format(val)}</span>
            <span style={{ width: "100%", maxWidth: 44, height: Math.max(3, (val / max) * height), borderRadius: "7px 7px 3px 3px", background: color || (on ? "var(--gg-green)" : "color-mix(in srgb, var(--gg-green) 45%, transparent)"), transition: "height .6s var(--ease)" }} />
            <span style={{ fontSize: 11, color: on ? "var(--ink)" : "var(--dim)", whiteSpace: "nowrap" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HBars({ data, format = (n: number) => String(n), max: maxIn }: { data: [string, number, string?, ReactNode?][]; format?: (n: number) => string; max?: number }) {
  const max = maxIn || Math.max(1, ...data.map(d => d[1]));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(([label, val, color, extra]) => (
        <div key={label}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12.5 }}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
            {extra}
            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--body)", fontWeight: 500 }}>{format(val)}</span>
          </div>
          <span style={{ display: "block", height: 7, marginTop: 6, borderRadius: 99, background: "var(--track)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: (val / max) * 100 + "%", borderRadius: 99, background: color || "var(--gg-green)", transition: "width .6s var(--ease)" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 150, thickness = 18, center, sub }: { parts: [string, number, string][]; size?: number; thickness?: number; center?: ReactNode; sub?: ReactNode }) {
  const total = parts.reduce((a, p) => a + p[1], 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={thickness} />
        {parts.map(([label, v, color]) => {
          const len = (v / total) * c;
          const el = <circle key={label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeDasharray={Math.max(0, len - 2) + " " + c} strokeDashoffset={-off}><title>{label}</title></circle>;
          off += len;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.6px" }}>{center}</div>
        {sub && <div style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: [string, ReactNode, string][] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      {items.map(([label, val, color]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flex: "none" }} />
          <span style={{ flex: 1, minWidth: 0, color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ series, labels, height = 170, format = (n: number) => String(n) }: { series: { name: string; color: string; values: number[]; dashed?: boolean }[]; labels: string[]; height?: number; format?: (n: number) => string }) {
  const W = 600, H = height, P = 26;
  const all = series.flatMap(s => s.values);
  const max = Math.max(1, ...all) * 1.08, min = Math.min(0, ...all);
  const x = (i: number) => P + (i * (W - P * 2)) / Math.max(1, labels.length - 1);
  const y = (v: number) => H - 22 - ((v - min) / (max - min)) * (H - 40);
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      {[0, 0.5, 1].map(t => <line key={t} x1={P} x2={W - P} y1={y(min + (max - min) * t)} y2={y(min + (max - min) * t)} stroke="var(--border)" strokeWidth="1" />)}
      {series.map(s => {
        const d = s.values.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
        return (
          <g key={s.name}>
            {!s.dashed && <path d={d + " L" + x(s.values.length - 1) + " " + (H - 22) + " L" + x(0) + " " + (H - 22) + " Z"} fill={s.color} opacity=".09" />}
            <path d={d} fill="none" stroke={s.color} strokeWidth="2.2" strokeDasharray={s.dashed ? "5 5" : undefined} vectorEffect="non-scaling-stroke" />
            {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={s.color}><title>{labels[i] + ": " + format(v)}</title></circle>)}
          </g>
        );
      })}
      {labels.map((l, i) => <text key={l + i} x={x(i)} y={H - 4} textAnchor="middle" fontSize="10.5" fill="var(--faint)">{l}</text>)}
    </svg>
  );
}

/** Columns of stacked segments (e.g. capacity per person). */
export function Stack({ rows, max, unit = "" }: { rows: { label: ReactNode; parts: [string, number, string][]; cap?: number }[]; max: number; unit?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => {
        const total = r.parts.reduce((a, p) => a + p[1], 0);
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "170px 1fr 64px", gap: 12, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>{r.label}</div>
            <div style={{ position: "relative", height: 14, borderRadius: 6, background: "var(--track)", overflow: "hidden", display: "flex" }}>
              {r.parts.map(([name, v, color]) => <span key={name} title={name + ": " + v + unit} style={{ width: (v / max) * 100 + "%", background: color, height: "100%", borderRight: "1px solid var(--surface)" }} />)}
              {r.cap !== undefined && <span style={{ position: "absolute", top: -2, bottom: -2, left: (r.cap / max) * 100 + "%", width: 2, background: "var(--ink)", opacity: .55 }} />}
            </div>
            <div style={{ fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums", color: r.cap !== undefined && total > r.cap ? "var(--bad)" : "var(--body)" }}>{total}{unit}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── global toast (mounted once in AppShell) ───────────────────────────────── */
export function ToastHost() {
  const s = useGG();
  const [shown, setShown] = useState<{ text: string; nonce: number } | null>(null);
  useEffect(() => { if (s.toast) setShown(s.toast); }, [s.toast?.nonce]);
  if (!s.toast || !shown) return null;
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 28, zIndex: 90, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div key={shown.nonce} role="status" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 999, background: "var(--tooltip)", color: "var(--tooltip-ink)", border: "1px solid var(--border-strong)", boxShadow: "0 18px 50px rgba(0,0,0,.45)", fontSize: 13, animation: "riseIn .3s var(--ease) both", maxWidth: "min(620px,92vw)" }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--accent)", flex: "none" }} />
        {shown.text}
      </div>
    </div>
  );
}

/** A small "Demo · simulated" marker for anything that would touch an external system. */
export function SimTag({ children = "Simulated" }: { children?: ReactNode }) {
  return <Badge tone="neutral" style={{ height: 20, fontSize: 10.5 }}>{children}</Badge>;
}
