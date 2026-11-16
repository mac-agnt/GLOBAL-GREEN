/* ─────────────────────────────────────────────────────────────────────────────
   Global Green · Pulse demo — single source of truth.

   Every page, chart, agent, task and relationship in the demo reads from this
   file (plus the in-memory overrides in ./store). Figures are an illustrative
   operating snapshot for Monday 16 November 2026, NOT verified Global Green data.

   Only Niall Kiernan is a real, named person. Every other person, client contact,
   prospect, email address and figure below is fictional demo data.
   ───────────────────────────────────────────────────────────────────────────── */

export const TODAY = "2026-11-16";
export const DEMO_LABEL = "Illustrative demo data · 16 Nov 2026";

/* ── dates ─────────────────────────────────────────────────────────────────── */
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = parseDate(iso);
  return d.getUTCDate() + " " + MON[d.getUTCMonth()];
}
export function fmtDay(iso?: string): string {
  if (!iso) return "—";
  const d = parseDate(iso);
  return DOW[d.getUTCDay()] + " " + d.getUTCDate() + " " + MON[d.getUTCMonth()];
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}
/** Positive when `iso` is in the past relative to the demo date. */
export function daysAgo(iso: string): number { return daysBetween(iso, TODAY); }
export function daysUntil(iso: string): number { return daysBetween(TODAY, iso); }

/* ── money ─────────────────────────────────────────────────────────────────── */
export function eur(n: number, dp = 0): string {
  const s = Math.abs(n).toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (n < 0 ? "−€" : "€") + s;
}
export function eurK(n: number): string {
  if (Math.abs(n) >= 1000) return "€" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return eur(n);
}
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* ── brand ─────────────────────────────────────────────────────────────────── */
/* Provisional demo approximations, not official Global Green brand codes. */
export const BRAND = {
  green: "#168763", blue: "#187EA2", lime: "#A9D75E", ink: "#17272B",
  /* lifted tints that hold contrast on the dark Harbour surfaces */
  greenLift: "#3fbf8f", blueLift: "#4fb0d4", limeLift: "#b6e070"
};

/* ── organisation ──────────────────────────────────────────────────────────── */
export const ORG = {
  name: "Global Green",
  website: "https://www.globalgreen.ie",
  founded: 2011,
  sector: "Environmental, energy and sustainability consultancy",
  managingPartner: "Niall Kiernan",
  headOffice: "The Hive, Dublin Road, Carrick-on-Shannon, Co. Leitrim, N41 YH72",
  offices: [
    {name:"The Hive (head office)", address:"Dublin Road, Carrick-on-Shannon, Co. Leitrim, N41 YH72"},
    {name:"Carlisle Offices", address:"Sandyford, Dublin"},
    {name:"Omagh Enterprise Centre", address:"Omagh, Co. Tyrone, UK"}
  ],
  methodology: [
    ["S", "Sustainability Assessment"],
    ["M", "Measurement & Mapping"],
    ["A", "Actionable Strategy"],
    ["R", "Resource Optimisation"],
    ["T", "Team Empowerment"]
  ] as [string, string][]
};

export const SERVICES = [
  "Energy audit", "Environmental assessment", "Renewable feasibility", "ISO 14001",
  "ISO 50001", "ISO 14064", "ESG & sustainability", "Carbon & climate action",
  "B Corp support", "Energy monitoring"
] as const;
export type Service = typeof SERVICES[number];

/* ── team ──────────────────────────────────────────────────────────────────── */
export type StaffId = "niall" | "aoife" | "eoin" | "sarah" | "dara" | "ciara" | "mark" | "louise" | "emma";
export interface Staff {
  id: StaffId; name: string; first: string; initials: string; role: string; dept: string;
  office: string; email: string; color: string; level: "Admin" | "Manager" | "Consultant" | "Coordinator";
  /** billable days available per week */
  capacity: number; skills: string[];
}
export const STAFF: Staff[] = [
  {id:"niall", name:"Niall Kiernan", first:"Niall", initials:"NK", role:"Managing Partner", dept:"Leadership",
   office:"Carrick-on-Shannon", email:"niall@gg-demo.example", color:"#3fbf8f", level:"Admin", capacity:2,
   skills:["Client strategy","SMART™ assessments","Climate action plans"]},
  {id:"aoife", name:"Aoife Brennan", first:"Aoife", initials:"AB", role:"Operations & Projects Lead", dept:"Operations",
   office:"Carrick-on-Shannon", email:"aoife.brennan@gg-demo.example", color:"#4fb0d4", level:"Manager", capacity:3,
   skills:["Delivery planning","Resourcing","B Corp support"]},
  {id:"eoin", name:"Eoin Gallagher", first:"Eoin", initials:"EG", role:"Senior Energy Engineer", dept:"Energy",
   office:"Sandyford, Dublin", email:"eoin.gallagher@gg-demo.example", color:"#b6e070", level:"Consultant", capacity:4.5,
   skills:["Industrial energy audits","ISO 50001","Renewable heat"]},
  {id:"sarah", name:"Sarah McHugh", first:"Sarah", initials:"SM", role:"Environmental Consultant", dept:"Environmental",
   office:"Carrick-on-Shannon", email:"sarah.mchugh@gg-demo.example", color:"#e6c78a", level:"Consultant", capacity:4.5,
   skills:["Environmental assessment","ISO 14001","Ecology coordination"]},
  {id:"dara", name:"Dara Flynn", first:"Dara", initials:"DF", role:"Carbon & ESG Consultant", dept:"Carbon & ESG",
   office:"Sandyford, Dublin", email:"dara.flynn@gg-demo.example", color:"#c8b4f0", level:"Consultant", capacity:4.5,
   skills:["ISO 14064","Carbon baselines","CSRD / ESG"]},
  {id:"ciara", name:"Ciara Doyle", first:"Ciara", initials:"CD", role:"Energy Auditor", dept:"Energy",
   office:"Carrick-on-Shannon", email:"ciara.doyle@gg-demo.example", color:"#9fd6f0", level:"Consultant", capacity:4.5,
   skills:["Commercial building audits","Thermal imaging","Energy action plans"]},
  {id:"mark", name:"Mark Reilly", first:"Mark", initials:"MR", role:"Technical Analyst", dept:"Energy",
   office:"Omagh", email:"mark.reilly@gg-demo.example", color:"#f0b08a", level:"Consultant", capacity:4.5,
   skills:["Meter data analysis","Monitoring & targeting","EnPI modelling"]},
  {id:"louise", name:"Louise Kelly", first:"Louise", initials:"LK", role:"Sales & Client Coordinator", dept:"Sales",
   office:"Carrick-on-Shannon", email:"louise.kelly@gg-demo.example", color:"#f0a0c0", level:"Coordinator", capacity:0,
   skills:["Discovery calls","Proposals","OnePageCRM"]},
  {id:"emma", name:"Emma Walsh", first:"Emma", initials:"EW", role:"Administration & Accounts", dept:"Finance",
   office:"Carrick-on-Shannon", email:"emma.walsh@gg-demo.example", color:"#a8e0c0", level:"Coordinator", capacity:0,
   skills:["QuickBooks Online","Credit control","Expenses"]}
];
export const staff = (id?: string) => STAFF.find(s => s.id === id) as Staff;

export const EXTERNALS = [
  {id:"ext-acct", name:"Brendan Moran", org:"Moran & Co. Chartered Accountants", role:"External accountant",
   email:"brendan@moran-demo.example", access:"Finance · review only", note:"Reviews expense exceptions and month-end. Not a Global Green employee."},
  {id:"ext-ecol", name:"Orla Tighe", org:"Tighe Ecology (subconsultant)", role:"Ecologist",
   email:"orla@tighe-ecology-demo.example", access:"Oakfield Solar evidence only", note:"Provides bat and bird survey reports for GG-252."}
];

/* ── clients (36 active organisations) ─────────────────────────────────────── */
export interface Client {
  id: string; name: string; sector: string; county: string; lead: StaffId; since: number;
  services: Service[]; lifetime: number; health: "good" | "watch" | "risk"; contact?: string;
}
export const CLIENTS: Client[] = [
  {id:"westhaven", name:"Westhaven Retail Parks", sector:"Retail property", county:"Galway", lead:"niall", since:2019, services:["Energy audit","Energy monitoring"], lifetime:96400, health:"risk", contact:"ct-westhaven"},
  {id:"glenmere", name:"Glenmere Foods", sector:"Food manufacturing", county:"Cavan", lead:"eoin", since:2021, services:["Energy audit","ISO 50001"], lifetime:58200, health:"watch", contact:"ct-glenmere"},
  {id:"oakfield", name:"Oakfield Solar", sector:"Renewable energy developer", county:"Offaly", lead:"sarah", since:2023, services:["Environmental assessment"], lifetime:41700, health:"watch", contact:"ct-oakfield"},
  {id:"carrick", name:"Carrick Logistics", sector:"Logistics & warehousing", county:"Leitrim", lead:"dara", since:2020, services:["ISO 50001","Carbon & climate action"], lifetime:63900, health:"risk", contact:"ct-carrick"},
  {id:"shannonside", name:"Shannonside Dairies", sector:"Dairy processing", county:"Roscommon", lead:"ciara", since:2018, services:["Energy audit","Energy monitoring"], lifetime:121300, health:"good", contact:"ct-shannonside"},
  {id:"breifne", name:"Bréifne Hotels Group", sector:"Hospitality", county:"Leitrim", lead:"dara", since:2022, services:["Carbon & climate action","Energy audit"], lifetime:47800, health:"watch", contact:"ct-breifne"},
  {id:"mullingar", name:"Mullingar Precision Engineering", sector:"Manufacturing", county:"Westmeath", lead:"sarah", since:2022, services:["ISO 14001"], lifetime:38600, health:"good", contact:"ct-mullingar"},
  {id:"lougharrow", name:"Lough Arrow Distillery", sector:"Beverages", county:"Sligo", lead:"eoin", since:2024, services:["Renewable feasibility"], lifetime:17300, health:"good", contact:"ct-lougharrow"},
  {id:"midlands", name:"Midlands Cold Storage", sector:"Cold chain", county:"Longford", lead:"mark", since:2021, services:["Energy audit","Energy monitoring"], lifetime:52100, health:"risk", contact:"ct-midlands"},
  {id:"corrib", name:"Corrib Medical Devices", sector:"Medical technology", county:"Galway", lead:"dara", since:2023, services:["ISO 14064","ESG & sustainability"], lifetime:33900, health:"watch", contact:"ct-corrib"},
  {id:"ardmore", name:"Ardmore Business Park", sector:"Commercial property", county:"Dublin", lead:"ciara", since:2020, services:["Energy audit"], lifetime:44500, health:"good", contact:"ct-ardmore"},
  {id:"kilnamanagh", name:"Kilnamanagh Plastics", sector:"Plastics manufacturing", county:"Dublin", lead:"ciara", since:2023, services:["Energy audit"], lifetime:19800, health:"good"},
  {id:"ernevalley", name:"Erne Valley Meats", sector:"Meat processing", county:"Fermanagh", lead:"sarah", since:2019, services:["ISO 14001","Environmental assessment"], lifetime:71200, health:"watch"},
  {id:"tyrone", name:"Tyrone Aggregates", sector:"Quarrying", county:"Tyrone", lead:"sarah", since:2021, services:["Environmental assessment"], lifetime:28400, health:"good"},
  {id:"sligobay", name:"Sligo Bay Leisure Centre", sector:"Leisure", county:"Sligo", lead:"ciara", since:2022, services:["Energy audit","Energy monitoring"], lifetime:15600, health:"watch"},
  {id:"boyle", name:"Boyle Community Care Trust", sector:"Healthcare", county:"Roscommon", lead:"niall", since:2021, services:["Carbon & climate action"], lifetime:22900, health:"good"},
  {id:"docklands", name:"Docklands Office Partners", sector:"Commercial property", county:"Dublin", lead:"eoin", since:2020, services:["Energy audit","ISO 50001"], lifetime:67300, health:"good"},
  {id:"athlone", name:"Athlone Pharma Packaging", sector:"Pharma packaging", county:"Westmeath", lead:"dara", since:2026, services:["ESG & sustainability"], lifetime:10750, health:"good", contact:"ct-athlone"},
  {id:"clewbay", name:"Clew Bay Seafoods", sector:"Food processing", county:"Mayo", lead:"mark", since:2022, services:["Energy monitoring"], lifetime:24100, health:"good"},
  {id:"foyle", name:"Foyle Valley Recycling", sector:"Waste & recycling", county:"Donegal", lead:"sarah", since:2023, services:["Environmental assessment","ISO 14001"], lifetime:18200, health:"good"},
  {id:"ballinamore", name:"Ballinamore Timber Products", sector:"Timber processing", county:"Leitrim", lead:"eoin", since:2020, services:["Renewable feasibility","Energy audit"], lifetime:36700, health:"good"},
  {id:"kells", name:"Kells Agri Supplies", sector:"Agri retail", county:"Meath", lead:"ciara", since:2024, services:["Energy audit"], lifetime:9400, health:"watch"},
  {id:"castlebar", name:"Castlebar Retail Centre", sector:"Retail property", county:"Mayo", lead:"ciara", since:2022, services:["Energy audit"], lifetime:16900, health:"watch"},
  {id:"newry", name:"Newry Print Works", sector:"Printing", county:"Down", lead:"mark", since:2023, services:["Energy monitoring"], lifetime:11800, health:"good"},
  {id:"portlaoise", name:"Portlaoise Data Hub", sector:"Data centre", county:"Laois", lead:"eoin", since:2025, services:["ISO 50001","Energy monitoring"], lifetime:31600, health:"good", contact:"ct-portlaoise"},
  {id:"offaly", name:"Offaly Craft Brewing", sector:"Brewing", county:"Offaly", lead:"aoife", since:2025, services:["B Corp support"], lifetime:7200, health:"good"},
  {id:"wicklow", name:"Wicklow Hills Wind Farm", sector:"Wind energy", county:"Wicklow", lead:"sarah", since:2024, services:["Environmental assessment"], lifetime:26300, health:"good"},
  {id:"ennis", name:"Ennis Office Campus", sector:"Commercial property", county:"Clare", lead:"ciara", since:2021, services:["Energy audit"], lifetime:21700, health:"good"},
  {id:"navan", name:"Navan Food Hall", sector:"Food retail", county:"Meath", lead:"ciara", since:2023, services:["Energy audit"], lifetime:8900, health:"watch"},
  {id:"boyne", name:"Boyne Precast Products", sector:"Building materials", county:"Louth", lead:"dara", since:2022, services:["ISO 14064","Carbon & climate action"], lifetime:29500, health:"good"},
  {id:"letterkenny", name:"Letterkenny Business Hotel", sector:"Hospitality", county:"Donegal", lead:"ciara", since:2023, services:["Energy audit"], lifetime:12300, health:"good"},
  {id:"cavanpoultry", name:"Cavan Poultry Co-op", sector:"Agri-food", county:"Cavan", lead:"eoin", since:2021, services:["Energy audit","Renewable feasibility"], lifetime:48600, health:"good"},
  {id:"limerickfab", name:"Limerick Fabrication Ltd", sector:"Metal fabrication", county:"Limerick", lead:"mark", since:2024, services:["Energy audit"], lifetime:13200, health:"good"},
  {id:"sandyford", name:"Sandyford Tech Campus", sector:"Commercial property", county:"Dublin", lead:"niall", since:2026, services:["Carbon & climate action","ESG & sustainability"], lifetime:6200, health:"good", contact:"ct-sandyford"},
  {id:"clones", name:"Clones Growers Co-op", sector:"Horticulture", county:"Monaghan", lead:"eoin", since:2022, services:["Renewable feasibility"], lifetime:14800, health:"good"},
  {id:"galwaybay", name:"Galway Bay Hotel Partners", sector:"Hospitality", county:"Galway", lead:"dara", since:2021, services:["Carbon & climate action","Energy audit"], lifetime:39200, health:"good"}
];
export const client = (id?: string) => CLIENTS.find(c => c.id === id) as Client;

/* ── contacts (all fictional, mock emails) ─────────────────────────────────── */
export interface Contact { id: string; name: string; title: string; org: string; orgId?: string; email: string; phone: string; kind: "client" | "prospect" | "partner"; }
export const CONTACTS: Contact[] = [
  {id:"ct-westhaven", name:"Gráinne Costello", title:"Finance Director", org:"Westhaven Retail Parks", orgId:"westhaven", email:"g.costello@westhaven-demo.example", phone:"+353 91 555 0142", kind:"client"},
  {id:"ct-glenmere", name:"Peter Lynch", title:"Operations Manager", org:"Glenmere Foods", orgId:"glenmere", email:"p.lynch@glenmere-demo.example", phone:"+353 49 555 0187", kind:"client"},
  {id:"ct-glenmere-2", name:"Siobhán Duffy", title:"Site Engineer", org:"Glenmere Foods", orgId:"glenmere", email:"s.duffy@glenmere-demo.example", phone:"+353 49 555 0188", kind:"client"},
  {id:"ct-oakfield", name:"Tom Hennessy", title:"Development Manager", org:"Oakfield Solar", orgId:"oakfield", email:"tom@oakfield-demo.example", phone:"+353 57 555 0119", kind:"client"},
  {id:"ct-carrick", name:"Declan Farrell", title:"Operations Director", org:"Carrick Logistics", orgId:"carrick", email:"d.farrell@carricklog-demo.example", phone:"+353 71 555 0163", kind:"client"},
  {id:"ct-carrick-2", name:"Úna Keane", title:"Facilities Manager", org:"Carrick Logistics", orgId:"carrick", email:"u.keane@carricklog-demo.example", phone:"+353 71 555 0164", kind:"client"},
  {id:"ct-shannonside", name:"Michael Rourke", title:"Plant Manager", org:"Shannonside Dairies", orgId:"shannonside", email:"m.rourke@shannonside-demo.example", phone:"+353 90 555 0131", kind:"client"},
  {id:"ct-breifne", name:"Fiona Gilmartin", title:"Group General Manager", org:"Bréifne Hotels Group", orgId:"breifne", email:"fiona@breifne-demo.example", phone:"+353 71 555 0175", kind:"client"},
  {id:"ct-mullingar", name:"Kevin Daly", title:"Quality & EHS Manager", org:"Mullingar Precision Engineering", orgId:"mullingar", email:"k.daly@mpe-demo.example", phone:"+353 44 555 0110", kind:"client"},
  {id:"ct-lougharrow", name:"Aisling Conlon", title:"Distillery Manager", org:"Lough Arrow Distillery", orgId:"lougharrow", email:"aisling@lougharrow-demo.example", phone:"+353 71 555 0198", kind:"client"},
  {id:"ct-midlands", name:"Ger Mulligan", title:"Engineering Manager", org:"Midlands Cold Storage", orgId:"midlands", email:"g.mulligan@midcold-demo.example", phone:"+353 43 555 0127", kind:"client"},
  {id:"ct-corrib", name:"Hannah Burke", title:"EHS Lead", org:"Corrib Medical Devices", orgId:"corrib", email:"h.burke@corrib-demo.example", phone:"+353 91 555 0151", kind:"client"},
  {id:"ct-ardmore", name:"Paul Cassidy", title:"Facilities Manager", org:"Ardmore Business Park", orgId:"ardmore", email:"p.cassidy@ardmore-demo.example", phone:"+353 1 555 0172", kind:"client"},
  {id:"ct-athlone", name:"Nora Fallon", title:"Head of Sustainability", org:"Athlone Pharma Packaging", orgId:"athlone", email:"n.fallon@app-demo.example", phone:"+353 90 555 0144", kind:"client"},
  {id:"ct-portlaoise", name:"Shane Brophy", title:"Data Centre Manager", org:"Portlaoise Data Hub", orgId:"portlaoise", email:"s.brophy@pdh-demo.example", phone:"+353 57 555 0108", kind:"client"},
  {id:"ct-sandyford", name:"Claire Nolan", title:"Estates Director", org:"Sandyford Tech Campus", orgId:"sandyford", email:"c.nolan@stc-demo.example", phone:"+353 1 555 0139", kind:"client"},
  {id:"ct-liffey", name:"Rachel Doherty", title:"Head of Sustainability", org:"Liffey Packaging", email:"r.doherty@liffeypack-demo.example", phone:"+353 1 555 0156", kind:"prospect"},
  {id:"ct-liffey-2", name:"Conor Whelan", title:"Chief Financial Officer", org:"Liffey Packaging", email:"c.whelan@liffeypack-demo.example", phone:"+353 1 555 0157", kind:"prospect"},
  {id:"ct-tralee", name:"Eimear Sheehan", title:"Operations Director", org:"Tralee Food Ingredients", email:"e.sheehan@tfi-demo.example", phone:"+353 66 555 0121", kind:"prospect"},
  {id:"ct-shannonav", name:"Brian Quinlan", title:"Facilities Director", org:"Shannon Aviation Services", email:"b.quinlan@sas-demo.example", phone:"+353 61 555 0133", kind:"prospect"},
  {id:"ct-ecology", name:"Orla Tighe", title:"Ecologist (subconsultant)", org:"Tighe Ecology", email:"orla@tighe-ecology-demo.example", phone:"+353 90 555 0190", kind:"partner"},
  {id:"ct-accountant", name:"Brendan Moran", title:"External accountant", org:"Moran & Co. Chartered Accountants", email:"brendan@moran-demo.example", phone:"+353 71 555 0102", kind:"partner"}
];
export const contact = (id?: string) => CONTACTS.find(c => c.id === id) as Contact;

/* ── projects (18 active: 12 on track, 4 at risk, 2 blocked) ──────────────── */
export type ProjectStatus = "on_track" | "at_risk" | "blocked";
export interface Project {
  id: string; clientId: string; title: string; service: Service; owner: StaffId; team: StaffId[];
  value: number; budgetHours: number; hoursSpent: number; start: string; due: string;
  status: ProjectStatus; progress: number; nextMilestone: string; nextDate: string;
  issue?: string; dependency?: string; site?: string; story?: number; feeType: "Fixed fee" | "Staged fee" | "Retainer";
}
/** blended internal delivery cost per hour, used for margin forecasts */
export const COST_RATE = 58;

export const PROJECTS: Project[] = [
  {id:"GG-241", clientId:"glenmere", title:"Industrial energy audit", service:"Energy audit", owner:"eoin", team:["eoin","ciara","mark"],
   value:12800, budgetHours:118, hoursSpent:71, start:"2026-10-05", due:"2026-11-30", status:"at_risk", progress:55,
   nextMilestone:"Site assessment visit", nextDate:"2026-11-18", site:"Cootehill plant, Co. Cavan",
   issue:"3 meter-data files not received from client", dependency:"Client meter data (MPRN half-hourly, GPRN, compressed-air sub-meter)", story:2, feeType:"Staged fee"},
  {id:"GG-252", clientId:"oakfield", title:"Environmental assessment, 48 MW solar farm", service:"Environmental assessment", owner:"sarah", team:["sarah"],
   value:14600, budgetHours:132, hoursSpent:64, start:"2026-10-12", due:"2026-12-02", status:"at_risk", progress:48,
   nextMilestone:"Site walkover", nextDate:"2026-11-19", site:"Clara, Co. Offaly",
   issue:"2 ecology documents outstanding before the assessment pack can be completed", dependency:"Bat activity survey and breeding bird report (Tighe Ecology)", story:4, feeType:"Staged fee"},
  {id:"GG-236", clientId:"carrick", title:"ISO 50001 implementation support", service:"ISO 50001", owner:"dara", team:["dara","mark"],
   value:16200, budgetHours:150, hoursSpent:63, start:"2026-09-01", due:"2026-12-18", status:"blocked", progress:40,
   nextMilestone:"Energy review & baseline", nextDate:"2026-11-27", site:"Carrick-on-Shannon depot",
   issue:"2 milestones blocked pending client energy-consumption information", dependency:"12 months of electricity, diesel and LPG consumption data from Carrick Logistics", story:6, feeType:"Staged fee"},
  {id:"GG-244", clientId:"midlands", title:"Refrigeration energy optimisation study", service:"Energy audit", owner:"mark", team:["mark","eoin"],
   value:9400, budgetHours:84, hoursSpent:27, start:"2026-10-19", due:"2026-12-11", status:"blocked", progress:30,
   nextMilestone:"BMS trend data analysis", nextDate:"2026-11-20", site:"Longford cold store",
   issue:"No access to BMS trend logs", dependency:"Remote read-only BMS access from the client's controls contractor", feeType:"Fixed fee"},
  {id:"GG-249", clientId:"breifne", title:"Carbon baseline & reduction roadmap (5 hotels)", service:"Carbon & climate action", owner:"dara", team:["dara","ciara"],
   value:18900, budgetHours:168, hoursSpent:58, start:"2026-10-20", due:"2026-12-15", status:"at_risk", progress:35,
   nextMilestone:"Scope 1 & 2 data return", nextDate:"2026-11-24", site:"5 hotels, Leitrim & Sligo",
   issue:"Dara is over-allocated in weeks 47–48", feeType:"Staged fee"},
  {id:"GG-238", clientId:"corrib", title:"ISO 14064-1 GHG inventory & verification prep", service:"ISO 14064", owner:"dara", team:["dara","mark"],
   value:11200, budgetHours:102, hoursSpent:76, start:"2026-09-14", due:"2026-12-04", status:"at_risk", progress:62,
   nextMilestone:"Technical review of inventory", nextDate:"2026-11-23",
   issue:"Scope 3 purchased-goods data has gaps; hours trending 12% over budget", feeType:"Fixed fee"},
  {id:"GG-243", clientId:"shannonside", title:"Energy audit & energy action plan", service:"Energy audit", owner:"ciara", team:["ciara","mark"],
   value:10600, budgetHours:96, hoursSpent:52, start:"2026-10-12", due:"2026-12-09", status:"on_track", progress:58,
   nextMilestone:"Site assessment visit", nextDate:"2026-11-17", site:"Ballaghaderreen plant, Co. Roscommon", feeType:"Staged fee"},
  {id:"GG-245", clientId:"mullingar", title:"ISO 14001 implementation", service:"ISO 14001", owner:"sarah", team:["sarah"],
   value:13500, budgetHours:124, hoursSpent:55, start:"2026-09-21", due:"2027-01-22", status:"on_track", progress:44,
   nextMilestone:"Aspects & impacts register sign-off", nextDate:"2026-11-26", feeType:"Staged fee"},
  {id:"GG-246", clientId:"lougharrow", title:"Renewable heat feasibility study", service:"Renewable feasibility", owner:"eoin", team:["eoin","mark"],
   value:8900, budgetHours:78, hoursSpent:38, start:"2026-10-26", due:"2026-12-12", status:"on_track", progress:50,
   nextMilestone:"Heat-load site survey", nextDate:"2026-11-19", site:"Lough Arrow, Co. Sligo", feeType:"Fixed fee"},
  {id:"GG-247", clientId:"ardmore", title:"Commercial building energy audits (3 blocks)", service:"Energy audit", owner:"ciara", team:["ciara"],
   value:7800, budgetHours:70, hoursSpent:54, start:"2026-10-06", due:"2026-11-27", status:"on_track", progress:80,
   nextMilestone:"Block C walk-through", nextDate:"2026-11-16", site:"Ardmore Business Park, Dublin 24", feeType:"Fixed fee"},
  {id:"GG-248", clientId:"athlone", title:"Sustainability & ESG strategy (CSRD readiness)", service:"ESG & sustainability", owner:"dara", team:["dara","niall"],
   value:21500, budgetHours:190, hoursSpent:44, start:"2026-10-13", due:"2027-01-29", status:"on_track", progress:25,
   nextMilestone:"Double materiality workshop", nextDate:"2026-12-01", feeType:"Staged fee"},
  {id:"GG-250", clientId:"clewbay", title:"Energy monitoring & resource optimisation", service:"Energy monitoring", owner:"mark", team:["mark"],
   value:6400, budgetHours:60, hoursSpent:41, start:"2026-07-01", due:"2026-12-31", status:"on_track", progress:70,
   nextMilestone:"November M&T report", nextDate:"2026-12-03", feeType:"Retainer"},
  {id:"GG-251", clientId:"foyle", title:"Environmental compliance review (waste licence)", service:"Environmental assessment", owner:"sarah", team:["sarah"],
   value:5900, budgetHours:52, hoursSpent:33, start:"2026-10-05", due:"2026-12-05", status:"on_track", progress:66,
   nextMilestone:"Technical review", nextDate:"2026-11-25", feeType:"Fixed fee"},
  {id:"GG-253", clientId:"offaly", title:"B Corp certification support", service:"B Corp support", owner:"aoife", team:["aoife","dara"],
   value:7200, budgetHours:66, hoursSpent:13, start:"2026-11-02", due:"2027-02-20", status:"on_track", progress:20,
   nextMilestone:"B Impact Assessment baseline", nextDate:"2026-11-30", feeType:"Staged fee"},
  {id:"GG-254", clientId:"portlaoise", title:"ISO 50001 energy review & EnPI baseline", service:"ISO 50001", owner:"eoin", team:["eoin","mark"],
   value:15800, budgetHours:138, hoursSpent:40, start:"2026-10-26", due:"2027-01-30", status:"on_track", progress:30,
   nextMilestone:"Significant energy uses workshop", nextDate:"2026-11-18", feeType:"Staged fee"},
  {id:"GG-255", clientId:"wicklow", title:"Environmental assessment, grid connection route", service:"Environmental assessment", owner:"sarah", team:["sarah"],
   value:9800, budgetHours:88, hoursSpent:45, start:"2026-10-19", due:"2026-12-18", status:"on_track", progress:52,
   nextMilestone:"Route walkover", nextDate:"2026-11-20", site:"Grid route, Co. Wicklow", feeType:"Fixed fee"},
  {id:"GG-256", clientId:"sandyford", title:"Climate action plan & SMART™ assessment", service:"Carbon & climate action", owner:"niall", team:["niall","dara"],
   value:12400, budgetHours:108, hoursSpent:39, start:"2026-10-26", due:"2027-01-14", status:"on_track", progress:38,
   nextMilestone:"Measurement & mapping review", nextDate:"2026-11-25", feeType:"Staged fee"},
  {id:"GG-257", clientId:"kilnamanagh", title:"Compressed air & process energy audit", service:"Energy audit", owner:"ciara", team:["ciara","mark"],
   value:6900, budgetHours:62, hoursSpent:44, start:"2026-10-12", due:"2026-12-03", status:"on_track", progress:74,
   nextMilestone:"Draft report", nextDate:"2026-11-24", feeType:"Fixed fee"}
];
export const project = (id?: string) => PROJECTS.find(p => p.id === id) as Project;

/* Recently completed work referenced by invoices (not counted as active). */
export const COMPLETED_PROJECTS = [
  {id:"GG-219", clientId:"westhaven", title:"Portfolio energy audits (4 retail parks)", value:18400, completed:"2026-09-02", owner:"eoin" as StaffId},
  {id:"GG-224", clientId:"breifne", title:"Hotel energy audits, phase 1", value:4800, completed:"2026-09-18", owner:"ciara" as StaffId},
  {id:"GG-226", clientId:"ernevalley", title:"ISO 14001 surveillance support", value:3950, completed:"2026-09-22", owner:"sarah" as StaffId}
];

export interface Milestone { id: string; projectId: string; title: string; owner: StaffId; planned: string; done?: string; status: "done" | "in_progress" | "upcoming" | "late" | "blocked"; dependsOn?: string; }
export const MILESTONES: Milestone[] = [
  {id:"M-241-1", projectId:"GG-241", title:"Kick-off & data request", owner:"eoin", planned:"2026-10-07", done:"2026-10-07", status:"done"},
  {id:"M-241-2", projectId:"GG-241", title:"Bills & production data review", owner:"mark", planned:"2026-10-30", done:"2026-11-02", status:"done"},
  {id:"M-241-3", projectId:"GG-241", title:"Site assessment visit", owner:"eoin", planned:"2026-11-18", status:"in_progress", dependsOn:"3 meter-data files"},
  {id:"M-241-4", projectId:"GG-241", title:"Energy balance & savings analysis", owner:"mark", planned:"2026-11-25", status:"upcoming", dependsOn:"Site visit + meter data"},
  {id:"M-241-5", projectId:"GG-241", title:"Audit report issued", owner:"eoin", planned:"2026-11-30", status:"upcoming"},
  {id:"M-252-1", projectId:"GG-252", title:"Desk study & scoping", owner:"sarah", planned:"2026-10-23", done:"2026-10-22", status:"done"},
  {id:"M-252-2", projectId:"GG-252", title:"Site walkover", owner:"sarah", planned:"2026-11-19", status:"in_progress"},
  {id:"M-252-3", projectId:"GG-252", title:"Ecology inputs received", owner:"sarah", planned:"2026-11-13", status:"late", dependsOn:"Bat survey + bird report"},
  {id:"M-252-4", projectId:"GG-252", title:"Assessment pack complete", owner:"sarah", planned:"2026-12-02", status:"upcoming"},
  {id:"M-236-1", projectId:"GG-236", title:"EnMS scope & energy policy", owner:"dara", planned:"2026-09-25", done:"2026-09-24", status:"done"},
  {id:"M-236-2", projectId:"GG-236", title:"Energy review & baseline (EnB)", owner:"mark", planned:"2026-11-13", status:"blocked", dependsOn:"12 months consumption data"},
  {id:"M-236-3", projectId:"GG-236", title:"EnPIs & objectives agreed", owner:"dara", planned:"2026-11-27", status:"blocked", dependsOn:"Energy review & baseline"},
  {id:"M-236-4", projectId:"GG-236", title:"Internal audit readiness", owner:"dara", planned:"2026-12-18", status:"upcoming"},
  {id:"M-244-1", projectId:"GG-244", title:"Plant survey", owner:"mark", planned:"2026-10-29", done:"2026-10-29", status:"done"},
  {id:"M-244-2", projectId:"GG-244", title:"BMS trend data analysis", owner:"mark", planned:"2026-11-12", status:"blocked", dependsOn:"BMS remote access"},
  {id:"M-249-1", projectId:"GG-249", title:"Scope 1 & 2 data return", owner:"dara", planned:"2026-11-24", status:"in_progress"},
  {id:"M-238-1", projectId:"GG-238", title:"Technical review of inventory", owner:"dara", planned:"2026-11-23", status:"in_progress"},
  {id:"M-243-1", projectId:"GG-243", title:"Site assessment visit", owner:"ciara", planned:"2026-11-17", status:"upcoming"},
  {id:"M-245-1", projectId:"GG-245", title:"Aspects & impacts register sign-off", owner:"sarah", planned:"2026-11-26", status:"upcoming"},
  {id:"M-247-1", projectId:"GG-247", title:"Block C walk-through", owner:"ciara", planned:"2026-11-16", status:"in_progress"},
  {id:"M-251-1", projectId:"GG-251", title:"Technical review", owner:"sarah", planned:"2026-11-25", status:"upcoming"},
  {id:"M-254-1", projectId:"GG-254", title:"Significant energy uses workshop", owner:"eoin", planned:"2026-11-18", status:"upcoming"},
  {id:"M-257-1", projectId:"GG-257", title:"Draft report", owner:"ciara", planned:"2026-11-24", status:"in_progress"},
  {id:"M-256-1", projectId:"GG-256", title:"Measurement & mapping review", owner:"niall", planned:"2026-11-25", status:"upcoming"}
];

/* ── sales: 12 open opportunities, €162,000 pipeline ───────────────────────── */
export const STAGES = ["New lead", "Discovery", "Qualified", "Proposal sent", "Negotiation"] as const;
export type Stage = typeof STAGES[number] | "Won" | "Lost";
export interface Opportunity {
  id: string; company: string; contact: string; contactTitle: string; email: string; sector: string; county: string;
  service: Service; title: string; value: number; stage: Stage; owner: StaffId; created: string; expectedClose: string;
  probability: number; source: "Calendly" | "Referral" | "Website" | "LinkedIn" | "Email campaign" | "Existing client";
  score: number; lastActivity: string; nextAction: string; proposalId?: string; clientId?: string; story?: number;
  interactions: [string, string, string][]; // date, channel, note
}
export const OPPORTUNITIES: Opportunity[] = [
  {id:"L-034", company:"Liffey Packaging", contact:"Rachel Doherty", contactTitle:"Head of Sustainability", email:"r.doherty@liffeypack-demo.example",
   sector:"Packaging manufacturing", county:"Dublin", service:"Carbon & climate action", title:"Carbon baseline and reduction roadmap",
   value:24000, stage:"Proposal sent", owner:"louise", created:"2026-10-08", expectedClose:"2026-11-30", probability:55, source:"Calendly",
   score:84, lastActivity:"2026-11-07", nextAction:"Follow up proposal sent 7 Nov (9 days, no reply)", proposalId:"P-034", story:3,
   interactions:[["2026-10-08","Calendly","Discovery call booked from the website"],["2026-10-14","Meeting","Discovery call: CSRD supply-chain pressure from two FMCG customers"],
     ["2026-10-29","Site","Site visit, Ballymount plant, with Niall"],["2026-11-07","Email","Proposal P-034 sent (€24,000)"],["2026-11-10","Email","Proposal opened twice (simulated tracking)"]]},
  {id:"L-035", company:"Tralee Food Ingredients", contact:"Eimear Sheehan", contactTitle:"Operations Director", email:"e.sheehan@tfi-demo.example",
   sector:"Food ingredients", county:"Kerry", service:"Energy audit", title:"Industrial energy audit (EED obligation)",
   value:14500, stage:"Discovery", owner:"louise", created:"2026-11-04", expectedClose:"2026-12-18", probability:30, source:"Email campaign",
   score:77, lastActivity:"2026-11-12", nextAction:"Discovery call Wed 18 Nov 11:00 (Calendly)",
   interactions:[["2026-11-04","Email campaign","Replied to CMP-05 ISO 50001 for food manufacturers"],["2026-11-12","Calendly","Discovery call booked for 18 Nov"]]},
  {id:"L-036", company:"Brookfield Nursing Homes Group", contact:"Joanne Ryan", contactTitle:"Group Facilities Lead", email:"j.ryan@brookfield-demo.example",
   sector:"Healthcare", county:"Westmeath", service:"Energy audit", title:"Energy efficiency audits (6 nursing homes)",
   value:21000, stage:"Qualified", owner:"niall", created:"2026-10-21", expectedClose:"2026-12-11", probability:45, source:"Referral",
   score:81, lastActivity:"2026-11-11", nextAction:"Draft proposal P-036 is ready for review", proposalId:"P-036",
   interactions:[["2026-10-21","Referral","Introduced by Boyle Community Care Trust"],["2026-11-11","Meeting","Scoping call: 6 sites, SEAI grant timing matters"]]},
  {id:"L-037", company:"Midwest Concrete Ltd", contact:"Tadhg Hogan", contactTitle:"Managing Director", email:"t.hogan@midwestconcrete-demo.example",
   sector:"Building materials", county:"Limerick", service:"ISO 14001", title:"ISO 14001 implementation",
   value:16500, stage:"Proposal sent", owner:"louise", created:"2026-10-02", expectedClose:"2026-12-04", probability:50, source:"Website",
   score:72, lastActivity:"2026-11-12", nextAction:"Proposal sent 12 Nov; check in Thu 19 Nov", proposalId:"P-037",
   interactions:[["2026-10-02","Website","Enquiry form: tender requires ISO 14001"],["2026-11-12","Email","Proposal P-037 sent (€16,500)"]]},
  {id:"L-038", company:"Harbour Point Offices", contact:"Lisa Kenny", contactTitle:"Property Manager", email:"l.kenny@harbourpoint-demo.example",
   sector:"Commercial property", county:"Cork", service:"Energy audit", title:"Commercial building audit",
   value:6500, stage:"New lead", owner:"louise", created:"2026-11-13", expectedClose:"2027-01-15", probability:15, source:"LinkedIn",
   score:58, lastActivity:"2026-11-13", nextAction:"Qualify: BER and lease timing",
   interactions:[["2026-11-13","LinkedIn","Commented on Niall's post about commercial building audits"]]},
  {id:"L-039", company:"Kinsale Craft Foods", contact:"Ciarán O'Neill", contactTitle:"Founder", email:"ciaran@kinsalecraft-demo.example",
   sector:"Food & drink", county:"Cork", service:"B Corp support", title:"B Corp certification support",
   value:9000, stage:"Discovery", owner:"louise", created:"2026-11-06", expectedClose:"2027-01-08", probability:30, source:"Calendly",
   score:69, lastActivity:"2026-11-10", nextAction:"Discovery call Thu 19 Nov 15:00 (Calendly)",
   interactions:[["2026-11-06","Calendly","Discovery call booked"],["2026-11-10","Email","Shared current B Impact Assessment export"]]},
  {id:"L-040", company:"Shannon Aviation Services", contact:"Brian Quinlan", contactTitle:"Facilities Director", email:"b.quinlan@sas-demo.example",
   sector:"Aviation services", county:"Clare", service:"ISO 50001", title:"ISO 50001 implementation, 3 hangars",
   value:18000, stage:"Negotiation", owner:"niall", created:"2026-09-15", expectedClose:"2026-11-27", probability:70, source:"Referral",
   score:88, lastActivity:"2026-11-13", nextAction:"Agree phased payment schedule; revised proposal v2 under review", proposalId:"P-040",
   interactions:[["2026-09-15","Referral","Referred by Docklands Office Partners"],["2026-10-28","Email","Proposal P-040 v1 sent"],["2026-11-10","Email","Revised proposal v2 sent"],["2026-11-13","Call","Asked for staged payments across Q1"]]},
  {id:"L-041", company:"Mayo Renewables Co-op", contact:"Seán Gallagher", contactTitle:"Secretary", email:"sean@mayorenew-demo.example",
   sector:"Community energy", county:"Mayo", service:"Renewable feasibility", title:"Community solar feasibility study",
   value:11000, stage:"Qualified", owner:"eoin", created:"2026-10-27", expectedClose:"2026-12-16", probability:40, source:"Website",
   score:66, lastActivity:"2026-11-09", nextAction:"Confirm SEAI community grant eligibility",
   interactions:[["2026-10-27","Website","Enquiry: community solar on 3 farm roofs"],["2026-11-09","Call","Qualified with Eoin"]]},
  {id:"L-042", company:"Bray Leisureplex", contact:"Gavin Murray", contactTitle:"General Manager", email:"g.murray@brayleisure-demo.example",
   sector:"Leisure", county:"Wicklow", service:"Energy monitoring", title:"Energy monitoring & targeting",
   value:4500, stage:"New lead", owner:"louise", created:"2026-11-14", expectedClose:"2027-01-29", probability:15, source:"Email campaign",
   score:54, lastActivity:"2026-11-14", nextAction:"Send monitoring case study (Sligo Bay)",
   interactions:[["2026-11-14","Email campaign","Clicked monitoring case study link"]]},
  {id:"L-043", company:"Cork Harbour Logistics", contact:"Deirdre Walsh", contactTitle:"ESG Manager", email:"d.walsh@chl-demo.example",
   sector:"Logistics", county:"Cork", service:"ISO 14064", title:"ISO 14064 carbon accounting",
   value:13000, stage:"Qualified", owner:"dara", created:"2026-10-16", expectedClose:"2026-12-18", probability:45, source:"LinkedIn",
   score:79, lastActivity:"2026-11-05", nextAction:"Proposal P-043 drafted; needs Dara's scope check", proposalId:"P-043",
   interactions:[["2026-10-16","LinkedIn","Connected after Dara's ISO 14064 post"],["2026-11-05","Meeting","Scoping: Scope 3 categories 4 and 9"]]},
  {id:"L-044", company:"Shannonside Dairies", contact:"Michael Rourke", contactTitle:"Plant Manager", email:"m.rourke@shannonside-demo.example",
   sector:"Dairy processing", county:"Roscommon", service:"Renewable feasibility", title:"Rooftop solar PV feasibility",
   value:8500, stage:"Proposal sent", owner:"louise", created:"2026-10-19", expectedClose:"2026-12-02", probability:60, source:"Existing client",
   score:83, lastActivity:"2026-11-03", nextAction:"Discuss at Tue 17 Nov site visit (Ciara on site)", proposalId:"P-044", clientId:"shannonside",
   interactions:[["2026-10-19","Existing client","Raised during GG-243 kick-off"],["2026-11-03","Email","Proposal P-044 sent (€8,500)"]]},
  {id:"L-045", company:"Dundalk Biotech Park", contact:"Aoibhinn Carroll", contactTitle:"Sustainability Lead", email:"a.carroll@dbp-demo.example",
   sector:"Life sciences campus", county:"Louth", service:"ESG & sustainability", title:"ESG strategy & CSRD gap analysis",
   value:15500, stage:"Discovery", owner:"niall", created:"2026-11-09", expectedClose:"2027-01-22", probability:25, source:"LinkedIn",
   score:74, lastActivity:"2026-11-12", nextAction:"Discovery call Tue 24 Nov 10:00 (Calendly)",
   interactions:[["2026-11-09","LinkedIn","Accepted Niall's connection; viewed CSRD article"],["2026-11-12","Calendly","Discovery call booked for 24 Nov"]]}
];
export const opportunity = (id?: string) => OPPORTUNITIES.find(o => o.id === id) as Opportunity;

export interface Proposal { id: string; oppId: string; company: string; title: string; value: number; status: "draft" | "sent" | "negotiation" | "won" | "lost"; sent?: string; version: number; views: number; owner: StaffId; projectId?: string; note?: string; }
export const PROPOSALS: Proposal[] = [
  {id:"P-034", oppId:"L-034", company:"Liffey Packaging", title:"Carbon baseline and reduction roadmap", value:24000, status:"sent", sent:"2026-11-07", version:1, views:2, owner:"louise", note:"Opened twice, no reply in 9 days"},
  {id:"P-037", oppId:"L-037", company:"Midwest Concrete Ltd", title:"ISO 14001 implementation", value:16500, status:"sent", sent:"2026-11-12", version:1, views:1, owner:"louise"},
  {id:"P-044", oppId:"L-044", company:"Shannonside Dairies", title:"Rooftop solar PV feasibility", value:8500, status:"sent", sent:"2026-11-03", version:1, views:3, owner:"louise", note:"Raise on site Tue 17 Nov"},
  {id:"P-040", oppId:"L-040", company:"Shannon Aviation Services", title:"ISO 50001 implementation, 3 hangars", value:18000, status:"negotiation", sent:"2026-11-10", version:2, views:4, owner:"niall", note:"Client asked for staged payments"},
  {id:"P-036", oppId:"L-036", company:"Brookfield Nursing Homes Group", title:"Energy efficiency audits (6 sites)", value:21000, status:"draft", version:1, views:0, owner:"niall", note:"AI first draft from scoping notes; needs pricing check"},
  {id:"P-043", oppId:"L-043", company:"Cork Harbour Logistics", title:"ISO 14064 carbon accounting", value:13000, status:"draft", version:1, views:0, owner:"dara"},
  {id:"P-031", oppId:"", company:"Sandyford Tech Campus", title:"Climate action plan & SMART™ assessment", value:12400, status:"won", sent:"2026-10-09", version:1, views:5, owner:"niall", projectId:"GG-256"},
  {id:"P-029", oppId:"", company:"Athlone Pharma Packaging", title:"Sustainability & ESG strategy", value:21500, status:"won", sent:"2026-09-28", version:2, views:7, owner:"niall", projectId:"GG-248"},
  {id:"P-030", oppId:"", company:"Leinster Coatings", title:"Energy audit", value:7400, status:"lost", sent:"2026-09-30", version:1, views:2, owner:"louise", note:"Lost on price to a sole trader"}
];

export interface Meeting { id: string; when: string; time: string; title: string; with: string; org: string; owner: StaffId; source: "Calendly" | "Calendar"; oppId?: string; }
export const MEETINGS: Meeting[] = [
  {id:"MT-1", when:"2026-11-16", time:"14:00", title:"Proposal review: Shannon Aviation v2", with:"Brian Quinlan", org:"Shannon Aviation Services", owner:"niall", source:"Calendar", oppId:"L-040"},
  {id:"MT-2", when:"2026-11-18", time:"11:00", title:"Discovery call", with:"Eimear Sheehan", org:"Tralee Food Ingredients", owner:"louise", source:"Calendly", oppId:"L-035"},
  {id:"MT-3", when:"2026-11-18", time:"15:00", title:"SEU workshop kick-off (Teams)", with:"Shane Brophy", org:"Portlaoise Data Hub", owner:"eoin", source:"Calendar"},
  {id:"MT-4", when:"2026-11-19", time:"15:00", title:"Discovery call", with:"Ciarán O'Neill", org:"Kinsale Craft Foods", owner:"louise", source:"Calendly", oppId:"L-039"},
  {id:"MT-5", when:"2026-11-24", time:"10:00", title:"Discovery call", with:"Aoibhinn Carroll", org:"Dundalk Biotech Park", owner:"niall", source:"Calendly", oppId:"L-045"}
];

/* ── outreach (all simulated: nothing is ever sent or posted) ──────────────── */
export interface Campaign { id: string; name: string; audience: string; size: number; status: "draft" | "scheduled" | "completed"; owner: StaffId; created: string; sent?: number; opens?: number; replies?: number; meetings?: number; steps: {day: number; subject: string; body: string}[]; segments: [string, number][]; }
export const CAMPAIGNS: Campaign[] = [
  {id:"CMP-07", name:"EED energy audit obligations 2027", audience:"Commercial & industrial prospects, ROI and NI", size:120, status:"draft", owner:"louise", created:"2026-11-13",
   segments:[["Food & drink manufacturing", 34], ["Logistics & cold chain", 22], ["Commercial property", 28], ["Industrial manufacturing", 25], ["Hospitality groups", 11]],
   steps:[
     {day:0, subject:"{{company}} and the 2027 energy audit obligation", body:"Hi {{first_name}},\n\nUnder the Energy Efficiency Directive, organisations of {{company}}'s size need a compliant energy audit or an ISO 50001 system in place. We have helped {{peer_example}} do this with savings identified in the first visit.\n\nWould a 20-minute call next week be useful? You can pick a time here: {{calendly_link}}\n\nNiall Kiernan\nManaging Partner, Global Green"},
     {day:4, subject:"Re: {{company}} and the 2027 energy audit obligation", body:"Hi {{first_name}},\n\nA short follow-up. A typical {{sector}} site we audit finds 12 to 18% of energy spend in no-cost or low-cost measures. Happy to share an anonymised example.\n\nNiall"},
     {day:10, subject:"Last note on energy audits", body:"Hi {{first_name}},\n\nI will leave it here. If the timing is better in the new year, reply \"January\" and I will get back to you then.\n\nNiall"}
   ]},
  {id:"CMP-06", name:"B Corp readiness for Irish SMEs", audience:"Food, drink and consumer SMEs", size:64, status:"completed", owner:"louise", created:"2026-10-05", sent:64, opens:31, replies:6, meetings:2, steps:[], segments:[["Food & drink", 38], ["Consumer goods", 26]]},
  {id:"CMP-05", name:"ISO 50001 for food manufacturers", audience:"Food & drink manufacturers > 250 staff", size:86, status:"completed", owner:"louise", created:"2026-09-08", sent:86, opens:35, replies:7, meetings:3, steps:[], segments:[["Food & drink manufacturing", 86]]}
];
export interface OutreachDraft { id: string; campaignId: string; company: string; contact: string; title: string; sector: string; county: string; fit: number; personalisation: string; }
export const OUTREACH_SAMPLE: OutreachDraft[] = [
  {id:"OD-1", campaignId:"CMP-07", company:"Ballyhaunis Meat Packers", contact:"Martina Coyne", title:"Operations Manager", sector:"Food & drink manufacturing", county:"Mayo", fit:91, personalisation:"References their 2025 site expansion and refrigeration load."},
  {id:"OD-2", campaignId:"CMP-07", company:"Naas Distribution Centre", contact:"Owen Keogh", title:"Facilities Manager", sector:"Logistics & cold chain", county:"Kildare", fit:87, personalisation:"Mentions 24/7 cold-store operation and peer result at Midlands Cold Storage (anonymised)."},
  {id:"OD-3", campaignId:"CMP-07", company:"Liberty Square Offices", contact:"Maeve Brennan", title:"Asset Manager", sector:"Commercial property", county:"Dublin", fit:82, personalisation:"Ties the audit to lease renewals and BER upgrades."},
  {id:"OD-4", campaignId:"CMP-07", company:"Sligo Precision Moulding", contact:"Rory Feeney", title:"Plant Director", sector:"Industrial manufacturing", county:"Sligo", fit:79, personalisation:"Local to the Carrick office; compressed-air savings angle."},
  {id:"OD-5", campaignId:"CMP-07", company:"Atlantic Coast Hotels", contact:"Niamh Tobin", title:"Group Operations Director", sector:"Hospitality groups", county:"Galway", fit:76, personalisation:"Multi-site hotel group; heat pump and BMS angle."}
];

export interface LinkedInPost { id: string; date: string; author: StaffId; title: string; body: string; status: "draft" | "awaiting_approval" | "approved" | "published"; pillar: string; impressions?: number; reactions?: number; comments?: number; }
export const LINKEDIN_POSTS: LinkedInPost[] = [
  {id:"LI-21", date:"2026-11-17", author:"niall", title:"What the EED audit obligation means for Irish manufacturers", body:"Three things most manufacturers miss about the 2027 energy audit obligation, and the one that costs the most if you get it wrong…", status:"awaiting_approval", pillar:"Compliance explainer"},
  {id:"LI-22", date:"2026-11-19", author:"niall", title:"Case note: 14% gas saving at a Cavan food plant (anonymised)", body:"A boiler sequencing change and two steam-trap repairs. No capital spend. Here is how we found it…", status:"draft", pillar:"Client results"},
  {id:"LI-23", date:"2026-11-24", author:"dara", title:"ISO 14064 vs GHG Protocol: which one do your customers want?", body:"We are getting this question weekly from suppliers to multinationals…", status:"draft", pillar:"Carbon & ESG"},
  {id:"LI-24", date:"2026-11-26", author:"niall", title:"SMART™ in practice: Measurement & Mapping", body:"Second in a short series on how we run sustainability assessments…", status:"draft", pillar:"SMART™ methodology"},
  {id:"LI-18", date:"2026-11-05", author:"niall", title:"Why commercial building audits are back on the agenda", body:"", status:"published", pillar:"Compliance explainer", impressions:4210, reactions:96, comments:14},
  {id:"LI-19", date:"2026-11-10", author:"dara", title:"ISO 14064 verification: what auditors actually ask for", body:"", status:"published", pillar:"Carbon & ESG", impressions:2870, reactions:61, comments:9}
];
export const LINKEDIN_ENGAGEMENT: {name: string; title: string; org: string; action: string; post: string; fit: number; oppId?: string; suggested: string}[] = [
  {name:"Lisa Kenny", title:"Property Manager", org:"Harbour Point Offices", action:"Commented", post:"LI-18", fit:78, oppId:"L-038", suggested:"Already a lead (L-038). Send the commercial audit one-pager."},
  {name:"Aoibhinn Carroll", title:"Sustainability Lead", org:"Dundalk Biotech Park", action:"Reacted and viewed profile", post:"LI-19", fit:81, oppId:"L-045", suggested:"Discovery call booked 24 Nov. Share the CSRD readiness checklist beforehand."},
  {name:"Patrick Duggan", title:"Head of Engineering", org:"Westmeath Feeds", action:"Reacted", post:"LI-18", fit:72, suggested:"Not in CRM. Connect with a note about feed-mill drying energy."},
  {name:"Sinéad Hayes", title:"EHS Manager", org:"Clonmel Medical Plastics", action:"Commented", post:"LI-19", fit:69, suggested:"Not in CRM. Offer the ISO 14064 verification checklist."},
  {name:"Darragh Lyons", title:"Operations Director", org:"Shannon Cold Chain", action:"Shared post", post:"LI-18", fit:84, suggested:"High fit for CMP-07. Add to the EED campaign audience."}
];

/* ── finance ───────────────────────────────────────────────────────────────── */
export interface Invoice { id: string; clientId: string; projectId?: string; issued: string; due: string; amount: number; status: "paid" | "current" | "overdue"; paidOn?: string; reminders: number; story?: number; }
export const INVOICES: Invoice[] = [
  /* 8 overdue invoices, €42,350 in total */
  {id:"INV-1048", clientId:"westhaven", projectId:"GG-219", issued:"2026-09-05", due:"2026-10-05", amount:18400, status:"overdue", reminders:1, story:1},
  {id:"INV-1052", clientId:"breifne", projectId:"GG-224", issued:"2026-09-20", due:"2026-10-20", amount:4800, status:"overdue", reminders:1},
  {id:"INV-1055", clientId:"ernevalley", projectId:"GG-226", issued:"2026-09-24", due:"2026-10-24", amount:3950, status:"overdue", reminders:1},
  {id:"INV-1057", clientId:"castlebar", issued:"2026-09-28", due:"2026-10-28", amount:2600, status:"overdue", reminders:0},
  {id:"INV-1059", clientId:"sligobay", issued:"2026-10-01", due:"2026-10-31", amount:1850, status:"overdue", reminders:0},
  {id:"INV-1061", clientId:"mullingar", projectId:"GG-245", issued:"2026-10-04", due:"2026-11-03", amount:4500, status:"overdue", reminders:0},
  {id:"INV-1063", clientId:"navan", issued:"2026-10-07", due:"2026-11-06", amount:2150, status:"overdue", reminders:0},
  {id:"INV-1064", clientId:"kells", issued:"2026-10-10", due:"2026-11-09", amount:4100, status:"overdue", reminders:0},
  /* October paid and current */
  {id:"INV-1060", clientId:"ardmore", projectId:"GG-247", issued:"2026-10-02", due:"2026-11-01", amount:5200, status:"paid", paidOn:"2026-10-28", reminders:0},
  {id:"INV-1062", clientId:"corrib", projectId:"GG-238", issued:"2026-10-06", due:"2026-11-05", amount:5600, status:"paid", paidOn:"2026-10-30", reminders:0},
  {id:"INV-1065", clientId:"athlone", projectId:"GG-248", issued:"2026-10-13", due:"2026-11-12", amount:10750, status:"paid", paidOn:"2026-11-06", reminders:0},
  {id:"INV-1066", clientId:"shannonside", projectId:"GG-243", issued:"2026-10-20", due:"2026-11-19", amount:5300, status:"current", reminders:0},
  {id:"INV-1067", clientId:"portlaoise", projectId:"GG-254", issued:"2026-10-21", due:"2026-11-20", amount:7900, status:"current", reminders:0},
  {id:"INV-1068", clientId:"lougharrow", projectId:"GG-246", issued:"2026-10-22", due:"2026-11-21", amount:4450, status:"paid", paidOn:"2026-11-12", reminders:0},
  {id:"INV-1069", clientId:"sandyford", projectId:"GG-256", issued:"2026-10-23", due:"2026-11-22", amount:6200, status:"current", reminders:0},
  {id:"INV-1070", clientId:"clewbay", projectId:"GG-250", issued:"2026-10-27", due:"2026-11-26", amount:1600, status:"current", reminders:0},
  {id:"INV-1071", clientId:"wicklow", projectId:"GG-255", issued:"2026-10-28", due:"2026-11-27", amount:4900, status:"current", reminders:0},
  {id:"INV-1072", clientId:"kilnamanagh", projectId:"GG-257", issued:"2026-10-29", due:"2026-11-28", amount:3450, status:"current", reminders:0},
  {id:"INV-1073", clientId:"foyle", projectId:"GG-251", issued:"2026-10-30", due:"2026-11-29", amount:2950, status:"current", reminders:0},
  {id:"INV-1074", clientId:"mullingar", projectId:"GG-245", issued:"2026-10-30", due:"2026-11-29", amount:5900, status:"current", reminders:0},
  /* November to date */
  {id:"INV-1075", clientId:"glenmere", projectId:"GG-241", issued:"2026-11-03", due:"2026-12-03", amount:6400, status:"current", reminders:0},
  {id:"INV-1076", clientId:"oakfield", projectId:"GG-252", issued:"2026-11-05", due:"2026-12-05", amount:7300, status:"current", reminders:0},
  {id:"INV-1077", clientId:"carrick", projectId:"GG-236", issued:"2026-11-06", due:"2026-12-06", amount:5400, status:"current", reminders:0}
];
export const invoice = (id?: string) => INVOICES.find(i => i.id === id) as Invoice;

/* Monthly invoiced revenue (Oct is computed from INVOICES and must equal €76,800). */
export const REVENUE_HISTORY: [string, number][] = [
  ["Dec", 51200], ["Jan", 44800], ["Feb", 58300], ["Mar", 63900], ["Apr", 61200], ["May", 67400],
  ["Jun", 70100], ["Jul", 58600], ["Aug", 49700], ["Sep", 72300]
];

export interface Receipt { id: string; vendor: string; date: string; amount: number; vat: number; category: string; staff: StaffId; projectId?: string; status: "matched" | "exception"; txnId?: string; confidence: number; issue?: string; extracted: string; }
export const EXPENSE_BATCH = {id:"EXP-OCT-11", period:"October 2026", owner:"emma" as StaffId, receipts:11, total:1845, matched:8, matchedValue:1205, exceptions:3, exceptionValue:640, story:5};
export const RECEIPTS: Receipt[] = [
  {id:"R-01", vendor:"Applegreen, Carrick-on-Shannon", date:"2026-10-06", amount:78.40, vat:14.66, category:"Fuel", staff:"eoin", projectId:"GG-241", status:"matched", txnId:"QB-8812", confidence:98, extracted:"Fuel · diesel 46.1 L · VAT 23%"},
  {id:"R-02", vendor:"Irish Rail", date:"2026-10-09", amount:54.90, vat:0, category:"Travel", staff:"sarah", projectId:"GG-252", status:"matched", txnId:"QB-8817", confidence:97, extracted:"Return, Carrick-on-Shannon to Dublin Connolly · VAT exempt"},
  {id:"R-03", vendor:"Maldron Hotel, Cavan", date:"2026-10-14", amount:129.00, vat:11.73, category:"Accommodation", staff:"eoin", projectId:"GG-241", status:"matched", txnId:"QB-8826", confidence:96, extracted:"1 night, room only · VAT 9%"},
  {id:"R-04", vendor:"Screwfix, Sligo", date:"2026-10-15", amount:96.35, vat:18.02, category:"PPE & site equipment", staff:"ciara", status:"matched", txnId:"QB-8829", confidence:94, extracted:"Hi-vis vests ×3, safety glasses ×4 · VAT 23%"},
  {id:"R-05", vendor:"RS Components", date:"2026-10-20", amount:212.80, vat:39.79, category:"Monitoring equipment", staff:"mark", projectId:"GG-244", status:"matched", txnId:"QB-8840", confidence:95, extracted:"Data-logger batteries, 2 clamp probes · VAT 23%"},
  {id:"R-06", vendor:"Circle K, Athlone", date:"2026-10-22", amount:71.55, vat:13.38, category:"Fuel", staff:"ciara", projectId:"GG-243", status:"matched", txnId:"QB-8843", confidence:98, extracted:"Fuel · diesel 42.0 L · VAT 23%"},
  {id:"R-07", vendor:"Engineers Ireland", date:"2026-10-23", amount:173.00, vat:32.35, category:"Training & CPD", staff:"dara", status:"matched", txnId:"QB-8845", confidence:92, extracted:"CPD course: carbon accounting for engineers · VAT 23%"},
  {id:"R-08", vendor:"Tailte Éireann (mapping)", date:"2026-10-27", amount:389.00, vat:72.74, category:"Data & licences", staff:"sarah", projectId:"GG-252", status:"matched", txnId:"QB-8851", confidence:93, extracted:"Mapping licence, Clara, Co. Offaly · VAT 23%"},
  {id:"R-09", vendor:"The Landmark Hotel, Carrick-on-Shannon", date:"2026-10-16", amount:286.50, vat:23.66, category:"Client entertainment", staff:"niall", status:"exception", confidence:41, issue:"No matching card transaction; may have been paid personally. Client entertainment VAT is not recoverable.", extracted:"Dinner for 4 · VAT 9% · no supplier VAT number"},
  {id:"R-10", vendor:"Amazon.ie", date:"2026-10-19", amount:218.40, vat:40.84, category:"Monitoring equipment", staff:"mark", projectId:"GG-244", status:"exception", txnId:"QB-8836", confidence:58, issue:"Two identical card transactions found (QB-8836 and QB-8838). Possible duplicate charge.", extracted:"Thermal camera lens adapter · VAT 23%"},
  {id:"R-11", vendor:"Taxi (Galway)", date:"2026-10-29", amount:135.10, vat:0, category:"Travel", staff:"louise", status:"exception", confidence:34, issue:"Receipt image unreadable; amount taken from card feed, supplier and VAT unknown.", extracted:"Handwritten receipt · amount partly legible"}
];

export interface BankTxn { id: string; date: string; description: string; amount: number; account: string; receiptId?: string; confidence?: number; state: "suggested" | "unmatched" | "duplicate" | "no_receipt"; }
export const QBO_TXNS: BankTxn[] = [
  {id:"QB-8812", date:"2026-10-06", description:"APPLEGREEN CARRICK", amount:-78.40, account:"Business card ••2291", receiptId:"R-01", confidence:98, state:"suggested"},
  {id:"QB-8817", date:"2026-10-09", description:"IRISH RAIL WEB", amount:-54.90, account:"Business card ••2291", receiptId:"R-02", confidence:97, state:"suggested"},
  {id:"QB-8826", date:"2026-10-14", description:"MALDRON CAVAN", amount:-129.00, account:"Business card ••2291", receiptId:"R-03", confidence:96, state:"suggested"},
  {id:"QB-8829", date:"2026-10-15", description:"SCREWFIX SLIGO", amount:-96.35, account:"Business card ••7740", receiptId:"R-04", confidence:94, state:"suggested"},
  {id:"QB-8836", date:"2026-10-19", description:"AMAZON MKTPLACE EU", amount:-218.40, account:"Business card ••7740", receiptId:"R-10", confidence:58, state:"duplicate"},
  {id:"QB-8838", date:"2026-10-19", description:"AMAZON MKTPLACE EU", amount:-218.40, account:"Business card ••7740", confidence:58, state:"duplicate"},
  {id:"QB-8840", date:"2026-10-20", description:"RS COMPONENTS IE", amount:-212.80, account:"Business card ••7740", receiptId:"R-05", confidence:95, state:"suggested"},
  {id:"QB-8843", date:"2026-10-22", description:"CIRCLE K ATHLONE", amount:-71.55, account:"Business card ••2291", receiptId:"R-06", confidence:98, state:"suggested"},
  {id:"QB-8845", date:"2026-10-23", description:"ENGINEERS IRELAND", amount:-173.00, account:"Business card ••2291", receiptId:"R-07", confidence:92, state:"suggested"},
  {id:"QB-8849", date:"2026-10-29", description:"CARD PAYMENT TAXI GALWAY", amount:-135.10, account:"Business card ••5103", confidence:34, state:"no_receipt"},
  {id:"QB-8851", date:"2026-10-27", description:"TAILTE EIREANN", amount:-389.00, account:"Business card ••2291", receiptId:"R-08", confidence:93, state:"suggested"},
  {id:"QB-8855", date:"2026-10-30", description:"MICROSOFT 365 BUSINESS", amount:-142.60, account:"Business current ••4417", state:"unmatched"}
];

/** Simulated operating costs for cash forecasting (monthly). */
export const OPEX_MONTHLY = [
  ["Salaries & PRSI", 52400], ["Office & premises (3 sites)", 4900], ["Vehicles & travel", 3600],
  ["Software & data", 1850], ["Insurance & PI cover", 1200], ["Subconsultants", 3400]
] as [string, number][];
export const OPENING_CASH = 84600;

/* ── site assessments ──────────────────────────────────────────────────────── */
export type VisitStatus = "confirmed" | "in_progress" | "at_risk" | "evidence_pending" | "conflict" | "completed";
export interface SiteVisit { id: string; projectId: string; clientId: string; site: string; address: string; date: string; time: string; engineers: StaffId[]; type: string; status: VisitStatus; checklist: [string, boolean][]; brief: string; story?: number; }
export const SITE_VISITS: SiteVisit[] = [
  {id:"SV-301", projectId:"GG-247", clientId:"ardmore", site:"Ardmore Business Park, Block C", address:"Ardmore Business Park, Dublin 24", date:"2026-11-16", time:"10:00", engineers:["ciara"], type:"Commercial building audit", status:"in_progress",
   checklist:[["Access confirmed with facilities", true],["Previous audit (Blocks A, B) reviewed", true],["Thermal camera charged", true],["BMS screenshots captured", false]], brief:"Final block of three. Focus on AHU scheduling and lighting controls."},
  {id:"SV-302", projectId:"GG-243", clientId:"shannonside", site:"Shannonside Dairies, Ballaghaderreen plant", address:"Ballaghaderreen, Co. Roscommon", date:"2026-11-17", time:"09:30", engineers:["ciara","mark"], type:"Industrial energy audit", status:"confirmed",
   checklist:[["Site induction booked", true],["12 months bills received", true],["Steam system drawings", true],["Refrigeration plant list", true],["Raise solar PV proposal P-044 with plant manager", false]], brief:"Steam, refrigeration and CIP. Michael Rourke on site from 09:00."},
  {id:"SV-303", projectId:"GG-241", clientId:"glenmere", site:"Glenmere Foods, Cootehill plant", address:"Cootehill, Co. Cavan", date:"2026-11-18", time:"08:30", engineers:["eoin","ciara"], type:"Industrial energy audit", status:"at_risk",
   checklist:[["Site induction booked", true],["12 months energy bills", true],["Production volumes 2025–26", true],["MPRN half-hourly meter data", false],["GPRN gas meter readings", false],["Compressed-air sub-meter export", false],["PPE & thermal camera", true]], brief:"Three meter-data files outstanding. Without them the energy balance cannot be closed on site.", story:2},
  {id:"SV-304", projectId:"GG-252", clientId:"oakfield", site:"Oakfield Solar, proposed array site", address:"Clara, Co. Offaly", date:"2026-11-19", time:"10:00", engineers:["sarah"], type:"Environmental site walkover", status:"evidence_pending",
   checklist:[["Landowner access agreed", true],["Site layout drawing rev C", true],["Habitat survey (Fossitt)", true],["Bat activity survey", false],["Breeding bird report", false],["Hydrology desk study", true]], brief:"Walkover of array footprint and watercourse buffers. Ecology inputs from Tighe Ecology still outstanding.", story:4},
  {id:"SV-305", projectId:"GG-246", clientId:"lougharrow", site:"Lough Arrow Distillery", address:"Lough Arrow, Co. Sligo", date:"2026-11-19", time:"14:00", engineers:["eoin"], type:"Renewable heat site survey", status:"confirmed",
   checklist:[["Heat demand data received", true],["Boiler nameplate photos", true],["Biomass storage options listed", false]], brief:"Heat-load survey for biomass vs heat pump options."},
  {id:"SV-306", projectId:"GG-255", clientId:"wicklow", site:"Wicklow Hills grid route", address:"Roundwood to Kilmacanogue, Co. Wicklow", date:"2026-11-20", time:"09:00", engineers:["sarah"], type:"Environmental route walkover", status:"conflict",
   checklist:[["Route maps printed", true],["Landowner notices issued", true],["Second surveyor assigned", false]], brief:"Route walkover. Sarah is also needed for the Oakfield follow-up; second surveyor not yet assigned."},
  {id:"SV-296", projectId:"GG-257", clientId:"kilnamanagh", site:"Kilnamanagh Plastics", address:"Tallaght, Dublin 24", date:"2026-11-04", time:"09:00", engineers:["ciara","mark"], type:"Compressed air audit", status:"completed",
   checklist:[["Leak survey", true],["Logger install", true],["Logger retrieval", true]], brief:"Completed. Leak survey found 31 leaks."},
  {id:"SV-298", projectId:"GG-247", clientId:"ardmore", site:"Ardmore Business Park, Blocks A & B", address:"Ardmore Business Park, Dublin 24", date:"2026-11-09", time:"10:00", engineers:["ciara"], type:"Commercial building audit", status:"completed",
   checklist:[["Walk-through", true],["Thermal imaging", true]], brief:"Completed."},
  {id:"SV-299", projectId:"GG-238", clientId:"corrib", site:"Corrib Medical Devices", address:"Galway", date:"2026-11-10", time:"11:00", engineers:["dara","mark"], type:"GHG inventory data review", status:"completed",
   checklist:[["Scope 1 sources confirmed", true],["Refrigerant log reviewed", true]], brief:"Completed."},
  {id:"SV-307", projectId:"GG-249", clientId:"breifne", site:"Bréifne Hotels, Carrick-on-Shannon", address:"Carrick-on-Shannon, Co. Leitrim", date:"2026-11-23", time:"10:00", engineers:["dara","ciara"], type:"Carbon baseline site data review", status:"confirmed",
   checklist:[["Meter list", true],["Refrigerant records request", false]], brief:"First of five hotels."},
  {id:"SV-308", projectId:"GG-244", clientId:"midlands", site:"Midlands Cold Storage", address:"Longford", date:"2026-11-25", time:"09:00", engineers:["mark"], type:"Refrigeration follow-up", status:"at_risk",
   checklist:[["BMS remote access", false],["Compressor run-hour logs", false]], brief:"Depends on BMS access being granted."}
];

export interface Evidence { id: string; projectId: string; title: string; kind: "Meter data" | "Energy bills" | "Drawing" | "Site photos" | "Study" | "Register" | "Survey" | "Licence" | "Report"; status: "received" | "missing" | "requested" | "in_review"; from: string; date?: string; size?: string; note?: string; story?: number; }
export const EVIDENCE: Evidence[] = [
  {id:"EV-241-01", projectId:"GG-241", title:"12 months electricity & gas bills", kind:"Energy bills", status:"received", from:"Glenmere Foods", date:"2026-10-16", size:"4.2 MB"},
  {id:"EV-241-02", projectId:"GG-241", title:"Production volumes 2025–26", kind:"Register", status:"received", from:"Glenmere Foods", date:"2026-10-21", size:"310 KB"},
  {id:"EV-241-03", projectId:"GG-241", title:"Site drawings & plant layout", kind:"Drawing", status:"received", from:"Glenmere Foods", date:"2026-10-21", size:"8.9 MB"},
  {id:"EV-241-04", projectId:"GG-241", title:"MPRN half-hourly meter data (12 months)", kind:"Meter data", status:"missing", from:"Glenmere Foods", note:"Requested 7 Oct and 28 Oct", story:2},
  {id:"EV-241-05", projectId:"GG-241", title:"GPRN gas meter readings (monthly)", kind:"Meter data", status:"missing", from:"Glenmere Foods", note:"Requested 7 Oct and 28 Oct", story:2},
  {id:"EV-241-06", projectId:"GG-241", title:"Compressed-air sub-meter export", kind:"Meter data", status:"missing", from:"Glenmere Foods", note:"Client's controls contractor holds the export", story:2},
  {id:"EV-252-01", projectId:"GG-252", title:"Site layout drawing rev C", kind:"Drawing", status:"received", from:"Oakfield Solar", date:"2026-10-14", size:"6.1 MB"},
  {id:"EV-252-02", projectId:"GG-252", title:"Habitat survey (Fossitt classification)", kind:"Survey", status:"received", from:"Tighe Ecology", date:"2026-10-30", size:"12.4 MB"},
  {id:"EV-252-03", projectId:"GG-252", title:"Hydrology desk study", kind:"Study", status:"received", from:"Global Green", date:"2026-11-02", size:"2.3 MB"},
  {id:"EV-252-04", projectId:"GG-252", title:"Bat activity survey (Sept 2026)", kind:"Survey", status:"missing", from:"Tighe Ecology", note:"Due 13 Nov, not received", story:4},
  {id:"EV-252-05", projectId:"GG-252", title:"Breeding bird survey report", kind:"Survey", status:"missing", from:"Tighe Ecology", note:"Due 13 Nov, not received", story:4},
  {id:"EV-236-01", projectId:"GG-236", title:"12 months electricity consumption", kind:"Meter data", status:"missing", from:"Carrick Logistics", note:"Requested 15 Oct; chased 2 Nov", story:6},
  {id:"EV-236-02", projectId:"GG-236", title:"Diesel & LPG fuel records", kind:"Register", status:"missing", from:"Carrick Logistics", note:"Requested 15 Oct; chased 2 Nov", story:6},
  {id:"EV-236-03", projectId:"GG-236", title:"Energy policy (signed)", kind:"Report", status:"received", from:"Carrick Logistics", date:"2026-09-24", size:"180 KB"},
  {id:"EV-244-01", projectId:"GG-244", title:"BMS trend logs (compressors, evaporators)", kind:"Meter data", status:"requested", from:"Midlands Cold Storage", note:"Waiting on controls contractor"},
  {id:"EV-243-01", projectId:"GG-243", title:"Steam system drawings", kind:"Drawing", status:"received", from:"Shannonside Dairies", date:"2026-11-05", size:"5.6 MB"},
  {id:"EV-243-02", projectId:"GG-243", title:"Refrigeration plant list", kind:"Register", status:"received", from:"Shannonside Dairies", date:"2026-11-06", size:"95 KB"},
  {id:"EV-247-01", projectId:"GG-247", title:"Thermal images, Blocks A & B", kind:"Site photos", status:"in_review", from:"Global Green", date:"2026-11-09", size:"64 photos"},
  {id:"EV-257-01", projectId:"GG-257", title:"Compressed-air logger data (7 days)", kind:"Meter data", status:"received", from:"Global Green", date:"2026-11-11", size:"1.8 MB"},
  {id:"EV-238-01", projectId:"GG-238", title:"Purchased goods spend data (Scope 3, cat. 1)", kind:"Register", status:"in_review", from:"Corrib Medical Devices", date:"2026-11-12", size:"640 KB", note:"Gaps for 3 supplier categories"}
];

export interface Finding { id: string; projectId: string; title: string; area: string; severity: "high" | "medium" | "low"; kwh: number; eur: number; capex: number; co2: number; status: "draft" | "engineer_review" | "client_review" | "accepted"; recommendation: string; }
export const FINDINGS: Finding[] = [
  {id:"F-257-1", projectId:"GG-257", title:"31 compressed-air leaks", area:"Compressed air", severity:"high", kwh:148000, eur:29600, capex:3200, co2:37.6, status:"engineer_review", recommendation:"Repair leaks in priority order; repeat ultrasonic survey every 6 months."},
  {id:"F-257-2", projectId:"GG-257", title:"Compressor running at weekends with no demand", area:"Compressed air", severity:"medium", kwh:52000, eur:10400, capex:450, co2:13.2, status:"engineer_review", recommendation:"Fit a time-clock interlock to the main compressor."},
  {id:"F-257-3", projectId:"GG-257", title:"Injection moulding barrel insulation", area:"Process heat", severity:"medium", kwh:61000, eur:12200, capex:8400, co2:15.5, status:"draft", recommendation:"Insulation jackets on 14 barrels; payback under 9 months."},
  {id:"F-247-1", projectId:"GG-247", title:"AHUs running 24/7 in Blocks A & B", area:"HVAC", severity:"high", kwh:96000, eur:21100, capex:1800, co2:24.4, status:"client_review", recommendation:"Reprogramme BMS schedules to occupancy; add CO₂-based demand control."},
  {id:"F-247-2", projectId:"GG-247", title:"T8 fluorescent lighting in car park & stairwells", area:"Lighting", severity:"low", kwh:38000, eur:8400, capex:14600, co2:9.7, status:"client_review", recommendation:"LED retrofit with PIR controls; eligible for SEAI support."},
  {id:"F-238-1", projectId:"GG-238", title:"Refrigerant top-ups not logged consistently", area:"Scope 1", severity:"medium", kwh:0, eur:0, capex:0, co2:41.0, status:"engineer_review", recommendation:"Introduce an F-gas log with technician sign-off for each top-up."},
  {id:"F-243-0", projectId:"GG-243", title:"Steam trap failures suspected (pre-visit analysis)", area:"Steam", severity:"medium", kwh:84000, eur:7100, capex:2400, co2:17.0, status:"draft", recommendation:"Confirm with ultrasonic trap survey on 17 Nov visit."},
  {id:"F-219-1", projectId:"GG-219", title:"Car park lighting controls (4 parks)", area:"Lighting", severity:"medium", kwh:212000, eur:46600, capex:52000, co2:53.8, status:"accepted", recommendation:"Accepted by Westhaven in September; part of the delivered audit."}
];

/* ── reports & compliance ──────────────────────────────────────────────────── */
export const REPORT_STAGES = ["Data collection", "Analysis", "Draft", "Technical review", "Client delivery"] as const;
export type ReportStage = typeof REPORT_STAGES[number] | "Delivered";
export interface Report { id: string; projectId: string; title: string; type: "Energy audit report" | "Environmental assessment report" | "Carbon baseline report" | "Energy action plan" | "Feasibility study" | "ISO readiness document" | "Compliance review"; stage: ReportStage; owner: StaffId; reviewer: StaffId; due: string; version: string; missing: number; story?: number; }
export const REPORTS: Report[] = [
  {id:"RPT-241", projectId:"GG-241", title:"Glenmere Foods energy audit report", type:"Energy audit report", stage:"Data collection", owner:"eoin", reviewer:"niall", due:"2026-11-30", version:"v0.2", missing:3, story:2},
  {id:"RPT-252", projectId:"GG-252", title:"Oakfield Solar environmental assessment", type:"Environmental assessment report", stage:"Data collection", owner:"sarah", reviewer:"niall", due:"2026-12-02", version:"v0.3", missing:2, story:4},
  {id:"RPT-236", projectId:"GG-236", title:"Carrick Logistics energy review & baseline", type:"ISO readiness document", stage:"Data collection", owner:"dara", reviewer:"eoin", due:"2026-11-27", version:"v0.1", missing:2, story:6},
  {id:"RPT-243", projectId:"GG-243", title:"Shannonside Dairies energy action plan", type:"Energy action plan", stage:"Analysis", owner:"ciara", reviewer:"eoin", due:"2026-12-09", version:"v0.2", missing:0},
  {id:"RPT-246", projectId:"GG-246", title:"Lough Arrow renewable heat feasibility", type:"Feasibility study", stage:"Analysis", owner:"eoin", reviewer:"niall", due:"2026-12-12", version:"v0.2", missing:0},
  {id:"RPT-249", projectId:"GG-249", title:"Bréifne Hotels carbon baseline", type:"Carbon baseline report", stage:"Analysis", owner:"dara", reviewer:"niall", due:"2026-12-15", version:"v0.1", missing:1},
  {id:"RPT-257", projectId:"GG-257", title:"Kilnamanagh Plastics compressed-air audit", type:"Energy audit report", stage:"Draft", owner:"ciara", reviewer:"eoin", due:"2026-12-03", version:"v0.6", missing:0},
  {id:"RPT-247", projectId:"GG-247", title:"Ardmore Business Park building audits", type:"Energy audit report", stage:"Draft", owner:"ciara", reviewer:"eoin", due:"2026-11-27", version:"v0.5", missing:0},
  {id:"RPT-238", projectId:"GG-238", title:"Corrib Medical GHG inventory (ISO 14064-1)", type:"Carbon baseline report", stage:"Technical review", owner:"dara", reviewer:"eoin", due:"2026-12-04", version:"v0.9", missing:1},
  {id:"RPT-251", projectId:"GG-251", title:"Foyle Valley waste licence compliance review", type:"Compliance review", stage:"Technical review", owner:"sarah", reviewer:"niall", due:"2026-12-05", version:"v0.8", missing:0},
  {id:"RPT-245", projectId:"GG-245", title:"Mullingar ISO 14001 aspects & impacts register", type:"ISO readiness document", stage:"Client delivery", owner:"sarah", reviewer:"dara", due:"2026-11-26", version:"v1.0", missing:0},
  {id:"RPT-250", projectId:"GG-250", title:"Clew Bay October M&T report", type:"Energy action plan", stage:"Client delivery", owner:"mark", reviewer:"eoin", due:"2026-11-18", version:"v1.0", missing:0},
  {id:"RPT-219", projectId:"GG-219", title:"Westhaven portfolio energy audits", type:"Energy audit report", stage:"Delivered", owner:"eoin", reviewer:"niall", due:"2026-09-02", version:"v1.1", missing:0}
];
export interface Certification { id: string; clientId: string; standard: "ISO 14001" | "ISO 50001" | "ISO 14064" | "B Corp"; status: string; progress: number; next: string; nextLabel: string; lead: StaffId; projectId?: string; note: string; }
export const CERTIFICATIONS: Certification[] = [
  {id:"CERT-1", clientId:"mullingar", standard:"ISO 14001", status:"Implementing", progress:44, next:"2027-03-10", nextLabel:"Stage 1 certification audit", lead:"sarah", projectId:"GG-245", note:"Aspects register with client for sign-off."},
  {id:"CERT-2", clientId:"ernevalley", standard:"ISO 14001", status:"Certified", progress:100, next:"2027-02-16", nextLabel:"Surveillance audit", lead:"sarah", note:"Certified 2024; surveillance support delivered (GG-226)."},
  {id:"CERT-3", clientId:"foyle", standard:"ISO 14001", status:"Gap analysis", progress:30, next:"2027-01-20", nextLabel:"Gap analysis report", lead:"sarah", projectId:"GG-251", note:"Linked to waste licence review."},
  {id:"CERT-4", clientId:"carrick", standard:"ISO 50001", status:"Implementing · blocked", progress:40, next:"2026-11-27", nextLabel:"Energy review & baseline milestone", lead:"dara", projectId:"GG-236", note:"Blocked pending 12 months consumption data."},
  {id:"CERT-5", clientId:"portlaoise", standard:"ISO 50001", status:"Energy review", progress:30, next:"2027-01-30", nextLabel:"EnPI baseline agreed", lead:"eoin", projectId:"GG-254", note:"SEU workshop Wed 18 Nov."},
  {id:"CERT-6", clientId:"docklands", standard:"ISO 50001", status:"Certified", progress:100, next:"2027-04-14", nextLabel:"Surveillance audit", lead:"eoin", note:"Certified 2025."},
  {id:"CERT-7", clientId:"corrib", standard:"ISO 14064", status:"Verification prep", progress:62, next:"2026-12-04", nextLabel:"Inventory to verifier", lead:"dara", projectId:"GG-238", note:"Scope 3 cat. 1 data gaps."},
  {id:"CERT-8", clientId:"boyne", standard:"ISO 14064", status:"Verified", progress:100, next:"2027-05-01", nextLabel:"Annual re-verification", lead:"dara", note:"2025 inventory verified."},
  {id:"CERT-9", clientId:"offaly", standard:"B Corp", status:"Baseline assessment", progress:20, next:"2026-11-30", nextLabel:"B Impact Assessment baseline", lead:"aoife", projectId:"GG-253", note:"Current BIA score 62.4; target 80+."}
];
export interface AuditEntry { id: string; reportId: string; when: string; who: string; action: string; version: string; evidence?: string; }
export const AUDIT_TRAIL: AuditEntry[] = [
  {id:"AT-1", reportId:"RPT-238", when:"2026-11-13 16:20", who:"Dara Flynn", action:"Submitted for technical review", version:"v0.9"},
  {id:"AT-2", reportId:"RPT-238", when:"2026-11-14 10:05", who:"Eoin Gallagher", action:"Review comments added (7)", version:"v0.9", evidence:"EV-238-01"},
  {id:"AT-3", reportId:"RPT-251", when:"2026-11-12 11:40", who:"Sarah McHugh", action:"Submitted for technical review", version:"v0.8"},
  {id:"AT-4", reportId:"RPT-245", when:"2026-11-11 15:10", who:"Dara Flynn", action:"Technical review approved", version:"v1.0"},
  {id:"AT-5", reportId:"RPT-245", when:"2026-11-12 09:00", who:"Sarah McHugh", action:"Issued to client for sign-off", version:"v1.0"},
  {id:"AT-6", reportId:"RPT-247", when:"2026-11-13 17:30", who:"Pulse (Compliance & Evidence)", action:"AI draft summary generated from 64 thermal images and walk-through notes (human review required)", version:"v0.5", evidence:"EV-247-01"},
  {id:"AT-7", reportId:"RPT-241", when:"2026-11-16 07:02", who:"Pulse (Compliance & Evidence)", action:"Flagged 3 missing meter-data files against report requirements", version:"v0.2", evidence:"EV-241-04"},
  {id:"AT-8", reportId:"RPT-252", when:"2026-11-14 08:15", who:"Pulse (Compliance & Evidence)", action:"Flagged 2 ecology inputs overdue (due 13 Nov)", version:"v0.3", evidence:"EV-252-04"},
  {id:"AT-9", reportId:"RPT-219", when:"2026-09-02 12:00", who:"Niall Kiernan", action:"Final report approved and issued", version:"v1.1"},
  {id:"AT-10", reportId:"RPT-257", when:"2026-11-15 18:10", who:"Ciara Doyle", action:"Draft updated with leak-survey findings", version:"v0.6", evidence:"EV-257-01"}
];

/* An AI-generated draft summary, with source references to simulated evidence. */
export const DRAFT_SUMMARY = {
  reportId:"RPT-257", title:"Kilnamanagh Plastics: compressed air & process energy audit, executive summary (AI draft)",
  paragraphs:[
    ["Compressed air is the largest controllable load on site, at an estimated 41% of electricity use during production hours.", "EV-257-01"],
    ["The ultrasonic survey on 4 November found 31 leaks. Repairing them is estimated to save 148 MWh and €29,600 a year for around €3,200 of work.", "F-257-1"],
    ["The main compressor continued to run at weekends with no production demand. A time-clock interlock would save a further 52 MWh a year.", "F-257-2"],
    ["Insulating 14 injection-moulding barrels is estimated to pay back in under nine months.", "F-257-3"]
  ] as [string, string][],
  caveat:"Draft prepared by Pulse from project evidence. Engineering conclusions, savings figures and the final report must be reviewed and approved by a Global Green engineer before issue."
};

/* ── work: tasks ───────────────────────────────────────────────────────────── */
export type TaskStatus = "Not started" | "In progress" | "Waiting on client" | "In review" | "Done";
export const TASK_STATUSES: TaskStatus[] = ["Not started", "In progress", "Waiting on client", "In review", "Done"];
export interface Task { id: string; title: string; owner: StaffId; due: string; priority: "High" | "Medium" | "Low"; status: TaskStatus; dept: string; clientId?: string; projectId?: string; record?: string; story?: number; source: "Pulse" | "Monday.com" | "OnePageCRM" | "QuickBooks" | "Agent"; }
export const TASKS: Task[] = [
  {id:"T-101", title:"Request Glenmere meter data (3 files) before Wednesday's visit", owner:"eoin", due:"2026-11-16", priority:"High", status:"Not started", dept:"Energy", clientId:"glenmere", projectId:"GG-241", record:"EV-241-04", story:2, source:"Agent"},
  {id:"T-102", title:"Follow up Liffey Packaging proposal P-034", owner:"louise", due:"2026-11-16", priority:"High", status:"Not started", dept:"Sales", record:"L-034", story:3, source:"Agent"},
  {id:"T-103", title:"Review Westhaven payment reminder for INV-1048", owner:"emma", due:"2026-11-16", priority:"High", status:"In review", dept:"Finance", clientId:"westhaven", record:"INV-1048", story:1, source:"Agent"},
  {id:"T-104", title:"Confirm Oakfield ecology documents with Tighe Ecology", owner:"sarah", due:"2026-11-17", priority:"High", status:"In progress", dept:"Environmental", clientId:"oakfield", projectId:"GG-252", record:"EV-252-04", story:4, source:"Agent"},
  {id:"T-105", title:"Review EXP-OCT-11 expense exceptions (3 receipts, €640)", owner:"emma", due:"2026-11-18", priority:"Medium", status:"Not started", dept:"Finance", record:"EXP-OCT-11", story:5, source:"Agent"},
  {id:"T-106", title:"Escalate Carrick Logistics energy data dependency", owner:"dara", due:"2026-11-17", priority:"High", status:"Not started", dept:"Carbon & ESG", clientId:"carrick", projectId:"GG-236", record:"M-236-2", story:6, source:"Agent"},
  {id:"T-107", title:"Chase BMS remote access for Midlands Cold Storage", owner:"mark", due:"2026-11-17", priority:"High", status:"Waiting on client", dept:"Energy", clientId:"midlands", projectId:"GG-244", record:"EV-244-01", source:"Monday.com"},
  {id:"T-108", title:"Resolve Dara's week 47–48 over-allocation (Bréifne vs Corrib)", owner:"aoife", due:"2026-11-18", priority:"High", status:"In progress", dept:"Operations", projectId:"GG-249", source:"Agent"},
  {id:"T-109", title:"Technical review: Corrib GHG inventory v0.9", owner:"eoin", due:"2026-11-23", priority:"Medium", status:"In progress", dept:"Energy", clientId:"corrib", projectId:"GG-238", record:"RPT-238", source:"Monday.com"},
  {id:"T-110", title:"Approve Ardmore audit report draft v0.5", owner:"eoin", due:"2026-11-24", priority:"Medium", status:"Not started", dept:"Energy", clientId:"ardmore", projectId:"GG-247", record:"RPT-247", source:"Monday.com"},
  {id:"T-111", title:"Price-check Brookfield proposal draft P-036", owner:"niall", due:"2026-11-18", priority:"Medium", status:"Not started", dept:"Leadership", record:"P-036", source:"OnePageCRM"},
  {id:"T-112", title:"Prepare Tralee Food Ingredients discovery call", owner:"louise", due:"2026-11-18", priority:"Medium", status:"In progress", dept:"Sales", record:"L-035", source:"OnePageCRM"},
  {id:"T-113", title:"Assign second surveyor for Wicklow route walkover", owner:"aoife", due:"2026-11-18", priority:"Medium", status:"Not started", dept:"Operations", clientId:"wicklow", projectId:"GG-255", record:"SV-306", source:"Agent"},
  {id:"T-114", title:"Approve LinkedIn post LI-21 (EED explainer)", owner:"niall", due:"2026-11-17", priority:"Low", status:"Not started", dept:"Sales", record:"LI-21", source:"Agent"},
  {id:"T-115", title:"Review CMP-07 campaign drafts before scheduling", owner:"niall", due:"2026-11-19", priority:"Medium", status:"Not started", dept:"Sales", record:"CMP-07", source:"Agent"},
  {id:"T-116", title:"Send Mullingar aspects register for client sign-off", owner:"sarah", due:"2026-11-26", priority:"Low", status:"In progress", dept:"Environmental", clientId:"mullingar", projectId:"GG-245", record:"RPT-245", source:"Monday.com"},
  {id:"T-117", title:"Issue November retainer invoice, Clew Bay Seafoods", owner:"emma", due:"2026-11-27", priority:"Low", status:"Not started", dept:"Finance", clientId:"clewbay", projectId:"GG-250", source:"QuickBooks"},
  {id:"T-118", title:"Shannonside site visit: steam trap survey", owner:"ciara", due:"2026-11-17", priority:"Medium", status:"Not started", dept:"Energy", clientId:"shannonside", projectId:"GG-243", record:"SV-302", source:"Monday.com"},
  {id:"T-119", title:"Upload Ardmore Block C thermal images", owner:"ciara", due:"2026-11-17", priority:"Low", status:"Not started", dept:"Energy", clientId:"ardmore", projectId:"GG-247", record:"SV-301", source:"Monday.com"},
  {id:"T-120", title:"VAT return (Sept–Oct) filed", owner:"emma", due:"2026-11-13", priority:"Medium", status:"Done", dept:"Finance", source:"QuickBooks"},
  {id:"T-121", title:"Offaly Craft Brewing BIA kick-off", owner:"aoife", due:"2026-11-10", priority:"Low", status:"Done", dept:"Operations", clientId:"offaly", projectId:"GG-253", source:"Monday.com"}
];

/* ── agents ────────────────────────────────────────────────────────────────── */
export type AgentId = "briefing" | "watchdog" | "sales" | "delivery" | "fieldwork" | "compliance" | "finance" | "comms";
export interface GGAgent { id: AgentId; name: string; purpose: string; status: "working" | "waiting" | "attention" | "complete" | "thinking" | "idle"; shape: string; tint: string; reads: string[]; can: string[]; needsApproval: string[]; owner: StaffId; actionsToday: number; }
export const AGENTS: GGAgent[] = [
  {id:"briefing", name:"Briefing", purpose:"Company-wide morning and on-demand summaries for Niall", status:"complete", shape:"crown-pebble", tint:"#191c1f",
   reads:["Projects","Invoices","Opportunities","Site visits","Approvals"], can:["Summarise","Draft briefing"], needsApproval:[], owner:"niall", actionsToday:4},
  {id:"watchdog", name:"Ops Watchdog", purpose:"Project risks, delays and operational exceptions", status:"attention", shape:"shield", tint:"#2b1b1e",
   reads:["Projects","Milestones","Tasks","Evidence","Resourcing"], can:["Flag risk","Create task","Recommend escalation"], needsApproval:["Escalate to client"], owner:"aoife", actionsToday:11},
  {id:"sales", name:"Sales & Outreach", purpose:"Lead prioritisation, outreach and proposal follow-ups", status:"waiting", shape:"executive-capsule", tint:"#1b2430",
   reads:["Opportunities","Proposals","Meetings","Campaigns","LinkedIn engagement"], can:["Score leads","Draft email","Draft LinkedIn post","Draft campaign"], needsApproval:["Send email","Schedule campaign","Publish LinkedIn post"], owner:"louise", actionsToday:23},
  {id:"delivery", name:"Project Delivery", purpose:"Milestones, workload and delivery coordination", status:"working", shape:"control-cube", tint:"#16241f",
   reads:["Projects","Milestones","Staff capacity","Site visits"], can:["Plan workload","Propose reallocation","Create task"], needsApproval:["Reassign staff"], owner:"aoife", actionsToday:7},
  {id:"fieldwork", name:"Fieldwork", purpose:"Site-visit planning, evidence and assessment readiness", status:"working", shape:"low-dome", tint:"#241b2e",
   reads:["Site visits","Evidence","Checklists","Projects"], can:["Check readiness","Draft evidence request","Propose reschedule"], needsApproval:["Send client request","Reschedule visit"], owner:"aoife", actionsToday:9},
  {id:"compliance", name:"Compliance & Evidence", purpose:"Report completeness, deadlines and audit trails", status:"thinking", shape:"precision-brow", tint:"#191c1f",
   reads:["Reports","Evidence","Certifications","Audit trail"], can:["Check completeness","Draft report summary","Flag deadline"], needsApproval:["Issue anything to a client"], owner:"niall", actionsToday:6},
  {id:"finance", name:"Finance Review", purpose:"Debtors, expenses and reconciliation suggestions", status:"waiting", shape:"rim-capsule", tint:"#2a2118",
   reads:["Invoices","Receipts","QuickBooks transactions (simulated)"], can:["Extract receipts","Suggest matches","Draft payment reminder"], needsApproval:["Send reminder","Post or reconcile in QuickBooks"], owner:"emma", actionsToday:19},
  {id:"comms", name:"Client Communications", purpose:"Draft follow-ups and client status communications", status:"waiting", shape:"offset-pebble", tint:"#16241f",
   reads:["Projects","Evidence","Contacts","Activity"], can:["Draft status update","Draft follow-up"], needsApproval:["Send any client email"], owner:"aoife", actionsToday:8}
];
export const agent = (id?: string) => AGENTS.find(a => a.id === id) as GGAgent;

export interface AgentRun { id: string; agentId: AgentId; when: string; trigger: string; summary: string; outcome: "completed" | "awaiting_approval" | "no_action" | "failed"; duration: string; records: string[]; }
export const AGENT_RUNS: AgentRun[] = [
  {id:"RUN-9041", agentId:"briefing", when:"2026-11-16 07:00", trigger:"Schedule · weekdays 07:00", summary:"Morning briefing: 18 active projects (4 at risk, 2 blocked), €42,350 overdue, 6 site visits this week, 9 approvals waiting.", outcome:"completed", duration:"21s", records:["GG-241","INV-1048","L-034"]},
  {id:"RUN-9039", agentId:"watchdog", when:"2026-11-16 06:45", trigger:"Schedule · daily 06:45", summary:"Flagged GG-241 at risk: 3 meter-data files missing, visit in 2 days. Created task T-101.", outcome:"completed", duration:"14s", records:["GG-241","EV-241-04","T-101"]},
  {id:"RUN-9038", agentId:"watchdog", when:"2026-11-16 06:45", trigger:"Schedule · daily 06:45", summary:"GG-236 milestones M-236-2 and M-236-3 blocked 31 days on client data. Recommended escalation to Operations Director.", outcome:"awaiting_approval", duration:"9s", records:["GG-236","M-236-2","APR-06"]},
  {id:"RUN-9036", agentId:"finance", when:"2026-11-16 06:30", trigger:"Schedule · daily 06:30", summary:"INV-1048 (Westhaven, €18,400) now 42 days overdue. Drafted a professional reminder for Emma's review.", outcome:"awaiting_approval", duration:"6s", records:["INV-1048","APR-01"]},
  {id:"RUN-9033", agentId:"finance", when:"2026-11-15 22:10", trigger:"Event · 11 receipts uploaded", summary:"EXP-OCT-11: extracted 11 receipts, suggested 8 matches (€1,205), routed 3 exceptions (€640) for accountant review.", outcome:"awaiting_approval", duration:"48s", records:["EXP-OCT-11","APR-05"]},
  {id:"RUN-9031", agentId:"sales", when:"2026-11-16 06:20", trigger:"Rule · proposal unanswered 7+ days", summary:"P-034 Liffey Packaging unanswered 9 days, opened twice. Drafted a tailored follow-up referencing their CSRD customer requests.", outcome:"awaiting_approval", duration:"11s", records:["L-034","P-034","APR-02"]},
  {id:"RUN-9029", agentId:"sales", when:"2026-11-15 17:40", trigger:"Manual · Louise Kelly", summary:"Built CMP-07 audience (120 prospects) and 3-step sequence with personalised first lines. Nothing scheduled.", outcome:"awaiting_approval", duration:"2m 03s", records:["CMP-07","APR-07"]},
  {id:"RUN-9027", agentId:"sales", when:"2026-11-15 09:00", trigger:"Schedule · weekly", summary:"Scored 4 new leads. Harbour Point Offices 58, Bray Leisureplex 54. Suggested Darragh Lyons (Shannon Cold Chain) for CMP-07.", outcome:"completed", duration:"18s", records:["L-038","L-042"]},
  {id:"RUN-9025", agentId:"fieldwork", when:"2026-11-16 06:50", trigger:"Schedule · daily 06:50", summary:"Readiness check for 6 visits this week: 3 ready, SV-303 Glenmere at risk (meter data), SV-304 Oakfield evidence pending, SV-306 Wicklow needs a second surveyor.", outcome:"completed", duration:"12s", records:["SV-303","SV-304","SV-306"]},
  {id:"RUN-9024", agentId:"fieldwork", when:"2026-11-14 08:15", trigger:"Rule · evidence overdue", summary:"Bat survey and bird report for GG-252 overdue (due 13 Nov). Drafted request to Tighe Ecology and proposed a follow-up slot.", outcome:"awaiting_approval", duration:"7s", records:["GG-252","EV-252-04","APR-04"]},
  {id:"RUN-9022", agentId:"comms", when:"2026-11-16 06:55", trigger:"Event · task T-101 created", summary:"Drafted meter-data request to Peter Lynch (Glenmere) listing the 3 files and why they matter for Wednesday.", outcome:"awaiting_approval", duration:"5s", records:["GG-241","APR-03"]},
  {id:"RUN-9020", agentId:"delivery", when:"2026-11-16 07:05", trigger:"Schedule · daily", summary:"Dara at 118% in week 47. Proposed moving Bréifne data review support to Ciara on 23 Nov.", outcome:"awaiting_approval", duration:"16s", records:["GG-249","APR-09"]},
  {id:"RUN-9018", agentId:"compliance", when:"2026-11-13 17:30", trigger:"Event · evidence uploaded", summary:"Generated AI draft summary for RPT-257 from logger data and findings. Marked for engineer review.", outcome:"completed", duration:"34s", records:["RPT-257","F-257-1"]},
  {id:"RUN-9016", agentId:"compliance", when:"2026-11-16 07:02", trigger:"Schedule · daily", summary:"3 reports cannot progress past data collection: RPT-241, RPT-252, RPT-236 (7 missing items).", outcome:"completed", duration:"10s", records:["RPT-241","RPT-252","RPT-236"]},
  {id:"RUN-9012", agentId:"watchdog", when:"2026-11-14 06:45", trigger:"Schedule · daily 06:45", summary:"Monday.com sync check failed for 1 board (rate limit). Retried at 06:50 and succeeded.", outcome:"failed", duration:"3s", records:["Monday.com"]},
  {id:"RUN-9010", agentId:"sales", when:"2026-11-13 12:00", trigger:"Event · LinkedIn engagement", summary:"Drafted LinkedIn post LI-21 for Niall from the EED explainer notes.", outcome:"awaiting_approval", duration:"9s", records:["LI-21","APR-08"]}
];

export interface Approval { id: string; title: string; agentId: AgentId; owner: StaffId; kind: "Email draft" | "Payment reminder" | "Campaign" | "LinkedIn post" | "Expense routing" | "Escalation" | "Resource change" | "Evidence request"; record: string; summary: string; draft?: string; to?: string; value?: number; created: string; risk: "low" | "medium" | "high"; story?: number; }
export const APPROVALS: Approval[] = [
  {id:"APR-01", title:"Payment reminder to Westhaven Retail Parks for INV-1048", agentId:"finance", owner:"emma", kind:"Payment reminder", record:"INV-1048", value:18400, created:"2026-11-16 06:30", risk:"medium", story:1,
   to:"Gráinne Costello <g.costello@westhaven-demo.example>",
   summary:"€18,400 is 42 days overdue. One reminder sent 12 Oct. Pulse drafted a firm, professional second reminder.",
   draft:"Dear Gráinne,\n\nI hope you are well. Our records show that invoice INV-1048 for €18,400, covering the portfolio energy audits across your four retail parks, fell due on 5 October and remains outstanding.\n\nCould you let me know when payment is scheduled, or whether anything is holding it up on your side? I have attached a copy of the invoice and the delivered report summary for convenience.\n\nKind regards,\nEmma Walsh\nAdministration & Accounts, Global Green"},
  {id:"APR-02", title:"Follow-up email to Liffey Packaging on proposal P-034", agentId:"sales", owner:"louise", kind:"Email draft", record:"P-034", value:24000, created:"2026-11-16 06:20", risk:"low", story:3,
   to:"Rachel Doherty <r.doherty@liffeypack-demo.example>",
   summary:"Proposal sent 7 Nov, opened twice, no reply in 9 days. Draft references their two FMCG customers' supplier carbon requests.",
   draft:"Hi Rachel,\n\nI wanted to follow up on the carbon baseline and reduction roadmap proposal we sent on 7 November.\n\nYou mentioned that two of your FMCG customers have asked for supplier emissions data in the new year. If it helps, we could phase the work so the Scope 1 and 2 baseline lands first, in time for those requests, with the roadmap following in Q1.\n\nWould a 20-minute call this week suit to talk it through with Conor?\n\nBest regards,\nLouise Kelly\nGlobal Green"},
  {id:"APR-03", title:"Meter-data request to Glenmere Foods", agentId:"comms", owner:"eoin", kind:"Evidence request", record:"GG-241", created:"2026-11-16 06:55", risk:"medium", story:2,
   to:"Peter Lynch <p.lynch@glenmere-demo.example>",
   summary:"Wednesday's visit cannot close the energy balance without 3 meter-data files. Draft lists each file and who holds it.",
   draft:"Hi Peter,\n\nAhead of our site assessment on Wednesday 18 November, we are still missing three items:\n\n1. MPRN half-hourly electricity data (last 12 months)\n2. Monthly GPRN gas meter readings\n3. The compressed-air sub-meter export (your controls contractor may hold this)\n\nWith these we can close the energy balance on the day and keep the report on track for 30 November. If any are difficult to get, let me know and we can collect them together on site.\n\nThanks,\nEoin Gallagher\nSenior Energy Engineer, Global Green"},
  {id:"APR-04", title:"Ecology documents request and follow-up slot for Oakfield Solar", agentId:"fieldwork", owner:"sarah", kind:"Evidence request", record:"GG-252", created:"2026-11-14 08:15", risk:"medium", story:4,
   to:"Orla Tighe <orla@tighe-ecology-demo.example>",
   summary:"Bat activity survey and breeding bird report were due 13 Nov. Draft requests both by Wed 18 Nov and books a 30-minute follow-up.",
   draft:"Hi Orla,\n\nA quick check on the bat activity survey and the breeding bird report for Oakfield Solar (GG-252). Both were due on 13 November and I am on site at Clara this Thursday.\n\nCould you send them by Wednesday 18 November? If that is tight, a draft of the bat survey would let me complete the walkover notes.\n\nI have pencilled a 30-minute call for Wednesday at 16:00.\n\nThanks,\nSarah"},
  {id:"APR-05", title:"Route 3 expense exceptions (€640) to the external accountant", agentId:"finance", owner:"emma", kind:"Expense routing", record:"EXP-OCT-11", value:640, created:"2026-11-15 22:10", risk:"low", story:5,
   to:"Brendan Moran, Moran & Co. (review only)",
   summary:"8 receipts matched (€1,205). 3 exceptions: no card transaction for the Landmark Hotel dinner, a possible Amazon duplicate charge, and an unreadable taxi receipt. Nothing is posted or reconciled in QuickBooks."},
  {id:"APR-06", title:"Escalate Carrick Logistics data dependency to Operations Director", agentId:"watchdog", owner:"dara", kind:"Escalation", record:"GG-236", created:"2026-11-16 06:45", risk:"high", story:6,
   to:"Declan Farrell <d.farrell@carricklog-demo.example>",
   summary:"Two ISO 50001 milestones blocked 31 days. Facilities was asked twice. Escalation proposes a 30-minute call and a revised milestone of 4 Dec.",
   draft:"Hi Declan,\n\nI wanted to flag that two milestones on the ISO 50001 project are blocked: the energy review and baseline, and agreeing EnPIs and objectives. Both depend on 12 months of electricity, diesel and LPG consumption data, which we requested on 15 October.\n\nIf we can get the data by 24 November, we can still hold a revised 4 December milestone. Would a 30-minute call with Úna this week help unblock it?\n\nBest regards,\nDara Flynn\nCarbon & ESG Consultant, Global Green"},
  {id:"APR-07", title:"Schedule campaign CMP-07: EED energy audit obligations (120 prospects)", agentId:"sales", owner:"niall", kind:"Campaign", record:"CMP-07", created:"2026-11-15 17:40", risk:"high",
   summary:"3-step sequence to 120 commercial and industrial prospects with AI-personalised first lines. Approving marks it ready to schedule in the demo; nothing is sent."},
  {id:"APR-08", title:"Publish LinkedIn post LI-21 on Niall's profile", agentId:"sales", owner:"niall", kind:"LinkedIn post", record:"LI-21", created:"2026-11-13 12:00", risk:"low",
   summary:"\"What the EED audit obligation means for Irish manufacturers\". Proposed for Tue 17 Nov 08:30. LinkedIn is a proposed integration; nothing is posted."},
  {id:"APR-09", title:"Move Bréifne data review support from Dara to Ciara (23 Nov)", agentId:"delivery", owner:"aoife", kind:"Resource change", record:"GG-249", created:"2026-11-16 07:05", risk:"medium",
   summary:"Dara is at 118% in week 47. Ciara has 1.5 days free after the Ardmore audit closes."}
];

/* ── activity (one timeline, every entry links to a record) ────────────────── */
export type ActSource = "Pulse" | "Agent" | "Calendly" | "OnePageCRM" | "Monday.com" | "QuickBooks" | "Email" | "LinkedIn";
export type ActCategory = "Sales" | "Client comms" | "Projects" | "Site assessments" | "Reports" | "Finance" | "Agent" | "System";
export interface ActivityEvent { id: string; when: string; source: ActSource; category: ActCategory; title: string; detail: string; actor: string; record: string; alert?: boolean; }
export const ACTIVITY: ActivityEvent[] = [
  {id:"A-01", when:"2026-11-16 07:00", source:"Agent", category:"Agent", title:"Morning briefing prepared for Niall", detail:"4 at-risk and 2 blocked projects, €42,350 overdue, 9 approvals waiting.", actor:"Briefing", record:"RUN-9041"},
  {id:"A-02", when:"2026-11-16 06:55", source:"Agent", category:"Client comms", title:"Draft meter-data request to Glenmere Foods", detail:"Waiting for Eoin's approval. Not sent.", actor:"Client Communications", record:"APR-03"},
  {id:"A-03", when:"2026-11-16 06:50", source:"Agent", category:"Site assessments", title:"Site readiness check for 6 visits this week", detail:"SV-303 at risk, SV-304 evidence pending, SV-306 needs a second surveyor.", actor:"Fieldwork", record:"SV-303", alert:true},
  {id:"A-04", when:"2026-11-16 06:45", source:"Agent", category:"Projects", title:"GG-241 Glenmere Foods marked at risk", detail:"3 meter-data files missing, site visit Wed 18 Nov, report due 30 Nov.", actor:"Ops Watchdog", record:"GG-241", alert:true},
  {id:"A-05", when:"2026-11-16 06:45", source:"Agent", category:"Projects", title:"Escalation recommended for GG-236 Carrick Logistics", detail:"Two milestones blocked 31 days pending consumption data.", actor:"Ops Watchdog", record:"GG-236", alert:true},
  {id:"A-06", when:"2026-11-16 06:30", source:"Agent", category:"Finance", title:"INV-1048 Westhaven reached 42 days overdue", detail:"€18,400. Reminder drafted for Emma's review.", actor:"Finance Review", record:"INV-1048", alert:true},
  {id:"A-07", when:"2026-11-16 06:20", source:"Agent", category:"Sales", title:"Liffey Packaging proposal unanswered 9 days", detail:"P-034 €24,000. Follow-up drafted for Louise.", actor:"Sales & Outreach", record:"L-034"},
  {id:"A-08", when:"2026-11-16 06:05", source:"Monday.com", category:"System", title:"Monday.com boards synced (simulated)", detail:"18 project boards, 214 items. No conflicts.", actor:"Sync", record:"Monday.com"},
  {id:"A-09", when:"2026-11-16 06:02", source:"QuickBooks", category:"System", title:"QuickBooks Online feed read (simulated)", detail:"12 card and bank lines since 30 Oct. Read only.", actor:"Sync", record:"QuickBooks Online"},
  {id:"A-10", when:"2026-11-16 06:00", source:"OnePageCRM", category:"System", title:"OnePageCRM contacts and deals synced (simulated)", detail:"12 open deals, 3 next actions due today.", actor:"Sync", record:"OnePageCRM"},
  {id:"A-11", when:"2026-11-15 22:10", source:"Agent", category:"Finance", title:"EXP-OCT-11 receipts extracted", detail:"11 receipts, €1,845. 8 suggested matches, 3 exceptions routed.", actor:"Finance Review", record:"EXP-OCT-11"},
  {id:"A-12", when:"2026-11-15 18:10", source:"Monday.com", category:"Reports", title:"RPT-257 draft updated to v0.6", detail:"Leak-survey findings added.", actor:"Ciara Doyle", record:"RPT-257"},
  {id:"A-13", when:"2026-11-15 17:40", source:"Agent", category:"Sales", title:"Campaign CMP-07 drafted (120 prospects)", detail:"3-step EED sequence. Not scheduled.", actor:"Sales & Outreach", record:"CMP-07"},
  {id:"A-14", when:"2026-11-14 10:05", source:"Monday.com", category:"Reports", title:"Technical review comments on RPT-238", detail:"7 comments from Eoin on Corrib GHG inventory v0.9.", actor:"Eoin Gallagher", record:"RPT-238"},
  {id:"A-15", when:"2026-11-14 08:15", source:"Agent", category:"Site assessments", title:"Oakfield ecology inputs overdue", detail:"Bat survey and bird report were due 13 Nov.", actor:"Fieldwork", record:"GG-252", alert:true},
  {id:"A-16", when:"2026-11-13 16:40", source:"Calendly", category:"Sales", title:"Discovery call booked: Tralee Food Ingredients", detail:"Wed 18 Nov 11:00 with Louise.", actor:"Calendly", record:"L-035"},
  {id:"A-17", when:"2026-11-13 15:20", source:"Email", category:"Sales", title:"Shannon Aviation asked for staged payments", detail:"Revised proposal v2 under discussion.", actor:"Brian Quinlan", record:"L-040"},
  {id:"A-18", when:"2026-11-13 12:00", source:"Agent", category:"Sales", title:"LinkedIn post LI-21 drafted for Niall", detail:"Proposed for Tue 17 Nov 08:30. Not posted.", actor:"Sales & Outreach", record:"LI-21"},
  {id:"A-19", when:"2026-11-12 11:00", source:"QuickBooks", category:"Finance", title:"Payment received: INV-1068 Lough Arrow Distillery", detail:"€4,450 matched to invoice (simulated feed).", actor:"QuickBooks", record:"INV-1068"},
  {id:"A-20", when:"2026-11-12 09:30", source:"OnePageCRM", category:"Sales", title:"Proposal P-037 sent to Midwest Concrete", detail:"€16,500, ISO 14001 implementation.", actor:"Louise Kelly", record:"P-037"},
  {id:"A-21", when:"2026-11-11 15:10", source:"Monday.com", category:"Reports", title:"Mullingar aspects register approved in technical review", detail:"RPT-245 v1.0.", actor:"Dara Flynn", record:"RPT-245"},
  {id:"A-22", when:"2026-11-10 14:00", source:"Pulse", category:"Site assessments", title:"Corrib GHG data review visit completed", detail:"Refrigerant log gaps found (F-238-1).", actor:"Dara Flynn", record:"SV-299"},
  {id:"A-23", when:"2026-11-09 16:30", source:"Pulse", category:"Site assessments", title:"Ardmore Blocks A & B audit completed", detail:"64 thermal images uploaded for review.", actor:"Ciara Doyle", record:"SV-298"},
  {id:"A-24", when:"2026-11-06 10:20", source:"QuickBooks", category:"Finance", title:"Payment received: INV-1065 Athlone Pharma Packaging", detail:"€10,750 (stage 1 deposit).", actor:"QuickBooks", record:"INV-1065"},
  {id:"A-25", when:"2026-11-14 06:50", source:"Monday.com", category:"System", title:"Monday.com sync retried after rate limit", detail:"1 board failed at 06:45, succeeded at 06:50.", actor:"Ops Watchdog", record:"RUN-9012", alert:true}
];

/* ── integrations (demo connections and proposed ones) ─────────────────────── */
export const SYSTEMS = [
  {name:"Calendly", role:"Discovery-meeting scheduling", status:"Demo connection (simulated)", flows:"Bookings create leads and meetings", tint:"#4fb0d4", proposed:false},
  {name:"OnePageCRM", role:"Sales pipeline and customer records", status:"Demo connection (simulated)", flows:"Deals, contacts and next actions sync both ways", tint:"#f0a060", proposed:false},
  {name:"Monday.com", role:"Project management and delivery", status:"Demo connection (simulated)", flows:"Won deals create boards; items sync to Projects", tint:"#f06a8a", proposed:false},
  {name:"QuickBooks Online", role:"Accounting and financial records", status:"Demo connection (simulated, read only)", flows:"Invoices, payments and bank lines read; nothing posted", tint:"#3fbf8f", proposed:false},
  {name:"LinkedIn", role:"Company posting and engagement", status:"Proposed integration", flows:"Drafts and engagement only; posting requires approval", tint:"#4f8fd4", proposed:true},
  {name:"Outbound email infrastructure", role:"Cold-email prospecting sequences", status:"Proposed integration", flows:"Separate sending domain, warm-up and suppression list", tint:"#b6e070", proposed:true}
];

/* ── derived metrics (dashboards must use these, never hard-coded numbers) ── */
export function computeMetrics() {
  const active = PROJECTS;
  const overdue = INVOICES.filter(i => i.status === "overdue");
  const oct = INVOICES.filter(i => i.issued.startsWith("2026-10"));
  const visitsThisWeek = SITE_VISITS.filter(v => v.date >= "2026-11-16" && v.date <= "2026-11-22");
  return {
    staff: STAFF.length,
    clients: CLIENTS.length,
    projects: active.length,
    onTrack: active.filter(p => p.status === "on_track").length,
    atRisk: active.filter(p => p.status === "at_risk").length,
    blocked: active.filter(p => p.status === "blocked").length,
    opportunities: OPPORTUNITIES.length,
    pipeline: sum(OPPORTUNITIES.map(o => o.value)),
    weightedPipeline: sum(OPPORTUNITIES.map(o => o.value * o.probability / 100)),
    octRevenue: sum(oct.map(i => i.amount)),
    overdueCount: overdue.length,
    overdueValue: sum(overdue.map(i => i.amount)),
    visitsThisWeek: visitsThisWeek.length,
    activeValue: sum(active.map(p => p.value))
  };
}
export const METRICS = computeMetrics();

/** Lookup any record id to a human label and where it lives in the app. */
export function recordRef(id: string): {label: string; page: string; tab?: string; kind: string} {
  if (/^GG-/.test(id)) { const p = project(id) || COMPLETED_PROJECTS.find(c => c.id === id); return {label: id + (p ? " · " + client(p.clientId)?.name : ""), page:"Projects", tab:"Active Projects", kind:"Project"}; }
  if (/^INV-/.test(id)) { const i = invoice(id); return {label: id + (i ? " · " + client(i.clientId)?.name : ""), page:"Finance", tab:"Invoices", kind:"Invoice"}; }
  if (/^L-/.test(id)) { const o = opportunity(id); return {label: id + (o ? " · " + o.company : ""), page:"Sales", tab:"Pipeline", kind:"Opportunity"}; }
  if (/^P-/.test(id)) { const p = PROPOSALS.find(x => x.id === id); return {label: id + (p ? " · " + p.company : ""), page:"Sales", tab:"Proposals", kind:"Proposal"}; }
  if (/^SV-/.test(id)) { const s = SITE_VISITS.find(x => x.id === id); return {label: id + (s ? " · " + s.site : ""), page:"Sites", tab:"Site Visits", kind:"Site visit"}; }
  if (/^EV-/.test(id)) { const e = EVIDENCE.find(x => x.id === id); return {label: e ? e.title : id, page:"Sites", tab:"Evidence", kind:"Evidence"}; }
  if (/^RPT-/.test(id)) { const r = REPORTS.find(x => x.id === id); return {label: r ? r.title : id, page:"Reports", tab:"Report Pipeline", kind:"Report"}; }
  if (/^EXP-/.test(id)) return {label: id + " · October expenses", page:"Finance", tab:"Expenses", kind:"Expense batch"};
  if (/^CMP-/.test(id)) { const c = CAMPAIGNS.find(x => x.id === id); return {label: c ? c.name : id, page:"Sales", tab:"Email Campaigns", kind:"Campaign"}; }
  if (/^LI-/.test(id)) { const l = LINKEDIN_POSTS.find(x => x.id === id); return {label: l ? l.title : id, page:"Sales", tab:"LinkedIn", kind:"LinkedIn post"}; }
  if (/^APR-/.test(id)) { const a = APPROVALS.find(x => x.id === id); return {label: a ? a.title : id, page:"Agents", tab:"Approvals", kind:"Approval"}; }
  if (/^RUN-/.test(id)) return {label: id, page:"Agents", tab:"Runs", kind:"Agent run"};
  if (/^T-/.test(id)) { const t = TASKS.find(x => x.id === id); return {label: t ? t.title : id, page:"Work", tab:"Tasks", kind:"Task"}; }
  if (/^M-/.test(id)) { const m = MILESTONES.find(x => x.id === id); return {label: m ? m.title : id, page:"Projects", tab:"Milestones", kind:"Milestone"}; }
  if (/^F-/.test(id)) { const f = FINDINGS.find(x => x.id === id); return {label: f ? f.title : id, page:"Sites", tab:"Findings", kind:"Finding"}; }
  if (/^CERT-/.test(id)) return {label: id, page:"Reports", tab:"Certifications", kind:"Certification"};
  const c = CLIENTS.find(x => x.id === id || x.name === id);
  if (c) return {label: c.name, page:"Records", tab:"Relationships", kind:"Client"};
  return {label: id, page:"Settings", kind:"System"};
}
