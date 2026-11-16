/* Global Green module structure: sidebar pages and their top-bar tabs.
   PulseLogic reads this to build the side rail and the context nav. */
export const MODULE_TABS: Record<string, string[]> = {
  Agents: ["Overview", "Agents", "Runs", "Approvals"],
  Dashboard: ["Executive", "Sales", "Delivery", "Finance", "Capacity"],
  Sales: ["Overview", "Pipeline", "Leads", "Email Campaigns", "LinkedIn", "Proposals"],
  Projects: ["Overview", "Active Projects", "Milestones", "Resources", "Profitability"],
  Sites: ["Overview", "Schedule", "Site Visits", "Evidence", "Findings"],
  Reports: ["Overview", "Report Pipeline", "Deliverables", "Certifications", "Audit Trail"],
  Finance: ["Overview", "Invoices", "Expenses", "Reconciliation", "Cash Forecast"]
};

/** Default tab when a module opens. */
export const MODULE_DEFAULT: Record<string, string> = {
  Agents: "Overview", Dashboard: "Executive", Sales: "Overview", Projects: "Overview",
  Sites: "Overview", Reports: "Overview", Finance: "Overview"
};

/** Pages rendered entirely by the Global Green module views. */
export const GG_PAGES = ["Sales", "Projects", "Sites", "Reports", "Finance"];

export const PAGE_LABEL: Record<string, string> = {
  Sales: "Sales & Outreach", Sites: "Site Assessments", Reports: "Reports & Compliance"
};

/* Activity top-bar tabs map onto the existing activity lenses. */
export const ACTIVITY_TABS: [string, string][] = [
  ["all", "All Activity"], ["ai", "Agent Actions"], ["data", "System Events"], ["attention", "Alerts"]
];
