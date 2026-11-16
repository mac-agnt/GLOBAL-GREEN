/* Demo data and pure helpers for the Pulse prototype (Global Green).
   Global Green records come from ../gg/data (the single source of truth). */
import { STAFF as GG_STAFF, CONTACTS as GG_CONTACTS, METRICS as GG_METRICS, eur } from "../gg/data";

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  navSales:"M3.5 5h17l-6.4 7.6v5.6l-4.2 2v-7.6L3.5 5Z",
  navProjects:"M4.5 5.5h7.5 M8.5 10h9.5 M6 14.5h8 M11 19h8.5",
  navSites:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  navReports:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 14l2 2 4-4.2",
  navFinance:"M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M15.2 8.6a3.9 3.9 0 1 0 0 6.8 M7.6 11h5.6 M7.6 13.2h5.6"
};

/* Ontology stays first and is never removed (PulseLogic enforces this too). */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every record connects: entities, predicates and the paths between them."},
  {id:"files", label:"Files", blurb:"Documents, contracts and certificates — indexed where Helios can read them."},
  {id:"contacts", label:"Contacts", blurb:"Every person Global Green deals with: team, clients, prospects and partners."},
  {id:"relationships", label:"Relationships", blurb:"Pick a client and see everything connected to it."},
  {id:"search", label:"Search", blurb:"Search every record in one place."}
];

const CONTACT_TAG = (c) => c.kind === "prospect" ? "prospect" : c.kind === "partner" ? "partner"
  : c.orgId === "westhaven" ? "overdue" : c.orgId === "carrick" ? "blocked"
  : (c.orgId === "glenmere" || c.orgId === "oakfield") ? "watch" : "client";
const CONTACT_TINT = ["#9fd6f0","#e6c78a","#c8b4f0","#a8e0c0","#e2a08c","#b6e070"];
const CONTACTS = GG_STAFF.map(s => [s.name, s.role, s.email, "Global Green", "staff", s.color])
  .concat(GG_CONTACTS.map((c, i) => [c.name, c.title, c.email, c.org, CONTACT_TAG(c), CONTACT_TINT[i % CONTACT_TINT.length]]));

const FILE_TREE = [
  {type:"folder", id:"f-cli", name:"Clients", depth:0},
  {type:"file", id:"fl-1", name:"Glenmere Foods, energy bills 2025-26.pdf", depth:1, parent:"f-cli", indexed:true,
   path:"Clients / Glenmere Foods / GG-241", title:"Glenmere Foods, 12 months of energy bills",
   facts:[["TYPE","PDF · 24 pages"],["ADDED","16 Oct 2026"],["INDEXED","All 24 pages"],["OWNER","Eoin Gallagher"]],
   body:["Twelve months of electricity and gas bills for the Cootehill plant, received on 16 October. Electricity is about 61% of spend and gas 39%.",
     "The bills give monthly totals only. The half-hourly MPRN data, the GPRN readings and the compressed-air sub-meter export are still missing, so the energy balance cannot be closed from this file alone.",
     "The site assessment is on Wednesday 18 November and the report is due on 30 November."],
   links:[["Glenmere Foods","org"],["GG-241","project"],["Peter Lynch","person"]]},
  {type:"file", id:"fl-2", name:"Oakfield Solar, habitat survey (Fossitt).pdf", depth:1, parent:"f-cli", indexed:true,
   path:"Clients / Oakfield Solar / GG-252", title:"Oakfield Solar, habitat survey",
   facts:[["TYPE","PDF · 38 pages"],["ADDED","30 Oct 2026"],["INDEXED","All 38 pages"],["OWNER","Sarah McHugh"]],
   body:["Habitat classification of the proposed 48 MW array footprint by Tighe Ecology: mostly improved agricultural grassland, with hedgerows and one drainage ditch.",
     "The survey flags the hedgerows as likely bat commuting routes. The bat activity survey and the breeding bird report, both due on 13 November, are still outstanding.",
     "Sarah's site walkover is on Thursday 19 November and the assessment pack is due on 2 December."],
   links:[["Oakfield Solar","org"],["GG-252","project"],["Orla Tighe","person"]]},
  {type:"file", id:"fl-3", name:"Carrick Logistics, signed energy policy.pdf", depth:1, parent:"f-cli", indexed:true,
   path:"Clients / Carrick Logistics / GG-236", title:"Carrick Logistics, signed energy policy",
   facts:[["TYPE","PDF · 3 pages"],["ADDED","24 Sep 2026"],["INDEXED","All 3 pages"],["OWNER","Dara Flynn"]],
   body:["The ISO 50001 energy policy, signed by Declan Farrell, Operations Director, on 24 September.",
     "The next two milestones, the energy review and baseline and agreeing EnPIs, need 12 months of electricity, diesel and LPG data that was requested on 15 October.",
     "Both milestones are blocked until that data arrives."],
   links:[["Carrick Logistics","org"],["GG-236","project"],["Declan Farrell","person"]]},
  {type:"folder", id:"f-sales", name:"Proposals", depth:0},
  {type:"file", id:"fl-4", name:"P-034 Liffey Packaging, carbon roadmap.pdf", depth:1, parent:"f-sales", indexed:true,
   path:"Proposals / Liffey Packaging", title:"P-034 Liffey Packaging, carbon baseline and roadmap",
   facts:[["TYPE","PDF · 9 pages"],["SENT","7 Nov 2026"],["VALUE","€24,000"],["OWNER","Louise Kelly"]],
   body:["Carbon baseline and reduction roadmap for Liffey Packaging, priced at €24,000 across three stages.",
     "Sent on 7 November and opened twice (simulated tracking). No reply after nine days.",
     "Rachel Doherty mentioned supplier carbon requests from two FMCG customers, which is the strongest reason to phase the baseline first."],
   links:[["Liffey Packaging","org"],["L-034","opportunity"],["Rachel Doherty","person"]]},
  {type:"folder", id:"f-fin", name:"Finance", depth:0},
  {type:"file", id:"fl-5", name:"INV-1048 Westhaven Retail Parks.pdf", depth:1, parent:"f-fin", indexed:true,
   path:"Finance / Invoices", title:"INV-1048, Westhaven Retail Parks",
   facts:[["TYPE","PDF · 2 pages"],["VALUE","€18,400"],["AGE","42 days overdue"],["OWNER","Emma Walsh"]],
   body:["Invoice for the portfolio energy audits across Westhaven's four retail parks (GG-219), issued on 5 September on 30-day terms.",
     "Due on 5 October and now 42 days overdue. One reminder went on 12 October. A second, firmer reminder is drafted and waiting for Emma's approval.",
     "It is the largest item in the €42,350 overdue balance."],
   links:[["Westhaven Retail Parks","org"],["INV-1048","invoice"],["Gráinne Costello","person"]]},
  {type:"file", id:"fl-6", name:"EXP-OCT-11 receipts (11 images).zip", depth:1, parent:"f-fin", indexed:false,
   path:"Finance / Expenses", title:"EXP-OCT-11, October receipts",
   facts:[["TYPE","ZIP · 11 images"],["ADDED","15 Nov 2026"],["INDEXED","Extracted, not indexed"],["OWNER","Emma Walsh"]],
   body:["October receipts: 11 receipts totalling €1,845. Pulse read the vendor, date, amount and VAT from each one.",
     "Eight are suggested matches to simulated QuickBooks card lines (€1,205). Three exceptions (€640) are routed to the external accountant.",
     "Nothing has been posted or reconciled in QuickBooks."],
   links:[["EXP-OCT-11","expense"],["Emma Walsh","person"]]},
  {type:"folder", id:"f-rep", name:"Reports", depth:0},
  {type:"file", id:"fl-7", name:"RPT-257 Kilnamanagh draft v0.6.docx", depth:1, parent:"f-rep", indexed:true,
   path:"Reports / Kilnamanagh Plastics", title:"RPT-257, compressed air audit draft v0.6",
   facts:[["TYPE","DOCX · 31 pages"],["ADDED","15 Nov 2026"],["INDEXED","All 31 pages"],["OWNER","Ciara Doyle"]],
   body:["Draft compressed air and process energy audit for Kilnamanagh Plastics. Pulse drafted the executive summary from the logger data and findings; it is marked for engineer review.",
     "Headline finding: 31 compressed-air leaks worth an estimated €29,600 a year, for about €3,200 of repairs.",
     "Due to the client on 3 December after technical review by Eoin Gallagher."],
   links:[["Kilnamanagh Plastics","org"],["RPT-257","report"],["Ciara Doyle","person"]]}
];

const ONTO_NODES = [
  ["Client","entity",500,290,1,"Organisations Global Green works for. Every other record hangs off a client."],
  ["Contact","entity",300,190,1,"People at clients, prospects and partners. Staff are Employees."],
  ["Opportunity","entity",690,170,1,"A lead moving through discovery, qualification and proposal. Mirrors OnePageCRM (simulated)."],
  ["Proposal","ledger",850,260,0,"Scope and fee sent to a prospect. A won proposal becomes a project."],
  ["Project","entity",520,430,1,"A piece of consultancy work with a fee, team and milestones. Mirrors Monday.com (simulated)."],
  ["Site","entity",300,400,0,"A plant, building or development site where assessments happen."],
  ["Assessment","module",160,320,0,"A site visit: energy audit, environmental walkover or data review."],
  ["Evidence","entity",150,470,0,"Meter data, surveys, drawings and photos that support a report."],
  ["Report","entity",730,470,0,"A technical deliverable. Always reviewed and approved by a person before issue."],
  ["Invoice","ledger",380,90,0,"Read from QuickBooks Online (simulated). Pulse never posts to the ledger."],
  ["Payment","ledger",600,70,0,"Receipts against invoices, read from QuickBooks (simulated)."],
  ["Employee","entity",870,400,0,"The nine-person Global Green team, with roles, capacity and permissions."],
  ["Task","entity",870,120,0,"Work attached to any record, with an owner, due date and status."],
  ["works at","predicate",400,240,0,"Contact → Client."],
  ["delivers for","predicate",510,360,0,"Project → Client."],
  ["supports","predicate",150,395,0,"Evidence → Assessment and Report."],
  ["billed to","predicate",440,190,0,"Invoice → Client."]
];

const ONTO_EDGES = [
  [500,290,300,190],[500,290,690,170],[690,170,850,260],[500,290,520,430],
  [520,430,300,400],[300,400,160,320],[160,320,150,470],[150,470,730,470],
  [730,470,520,430],[500,290,380,90],[380,90,600,70],[520,430,870,400],
  [870,120,690,170],[850,260,520,430]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid — the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status — built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each — for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: 13 settings areas in five groups ---- */
const PEOPLE = GG_STAFF.map(s => [s.name, s.role, s.email, s.office, "active",
    s.id === "niall" ? "Admin" : (s.id === "aoife" ? "Manager" : "Standard"),
    {niall:"2 min ago", aoife:"6 min ago", eoin:"21 min ago", sarah:"1 h ago", dara:"34 min ago", ciara:"Today 09:58", mark:"2 h ago", louise:"12 min ago", emma:"8 min ago"}[s.id]])
  .concat([
    ["Brendan Moran","External accountant · Moran & Co.","brendan@moran-demo.example","—","external","External","3 days ago"],
    ["Orla Tighe","Ecologist · Tighe Ecology","orla@tighe-ecology-demo.example","—","external","External","9 days ago"]
  ]);
const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve payments"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release payments","Send money out"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Modules, roles, integrations"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their location","Assigned only"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};
const INTEGRATIONS = [
  {name:"Calendly", blurb:"Discovery meetings booked from the website create a lead and a meeting in Pulse. Demo connection, simulated.", tint:"#4fb0d4", status:"simulated", statusKind:"ok",
   glyph:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z",
   lastSync:"4 min ago (simulated)", usage:"3 bookings this week", auth:"OAuth 2.0 (demo)", scopes:["Read"]},
  {name:"OnePageCRM", blurb:"Deals, contacts and next actions stay matched to Pulse opportunities. Demo connection, simulated.", tint:"#f0a060", status:"simulated", statusKind:"ok",
   glyph:"M12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z M12 4v3.4 M12 16.6V20 M4 12h3.4 M16.6 12H20",
   lastSync:"6 min ago (simulated)", usage:"12 open deals", auth:"API key (demo)", scopes:["Read","Write"]},
  {name:"Monday.com", blurb:"Won deals create a delivery board; items and statuses sync to Projects. Demo connection, simulated.", tint:"#f06a8a", status:"simulated", statusKind:"ok",
   glyph:"M4.5 5.5h7.5 M8.5 10h9.5 M6 14.5h8 M11 19h8.5",
   lastSync:"11 min ago (simulated)", usage:"18 boards · 214 items", auth:"API token (demo)", scopes:["Read","Write"]},
  {name:"QuickBooks Online", blurb:"Invoices, payments and bank lines are read for debtors and expense matching. Pulse never posts to the ledger.", tint:"#3fbf8f", status:"read only", statusKind:"warn",
   glyph:"M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M15.2 8.6a3.9 3.9 0 1 0 0 6.8 M7.6 11h5.6 M7.6 13.2h5.6",
   lastSync:"14 min ago (simulated)", usage:"23 invoices · 12 bank lines", auth:"OAuth 2.0 (demo)", scopes:["Read"]},
  {name:"LinkedIn", blurb:"Proposed integration. Drafts, a content calendar and engagement signals; posting would always need approval.", tint:"#4f8fd4", status:"proposed", statusKind:"off",
   glyph:"M5 9.5v9 M5 5.6v.1 M9.5 18.5v-5.2a3.2 3.2 0 0 1 6.4 0v5.2 M9.5 9.5v9",
   lastSync:"—", usage:"—", auth:"—", scopes:[]},
  {name:"Outbound email", blurb:"Proposed integration. A separate sending domain with warm-up and a suppression list for cold outreach.", tint:"#b6e070", status:"proposed", statusKind:"off",
   glyph:"M3.5 12 20.5 4 16 20l-3.4-6.6L3.5 12Z",
   lastSync:"—", usage:"—", auth:"—", scopes:[]}
];

/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#5ee79a"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Cream", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0071e3"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"structure", group:"ORGANISATION", title:"Organisation", icon:"structure", tint:"#3fbf8f",
   blurb:"Who Global Green is, where it works and how it presents itself.",
   tags:["Est. 2011","3 offices","EUR · GBP"],
   listLabel:"ORGANISATION DETAILS",
   rows:[["Company name","Global Green"],["Website","www.globalgreen.ie"],["Managing Partner","Niall Kiernan"],
     ["Head office","The Hive, Dublin Road, Carrick-on-Shannon, N41 YH72"],["Dublin office","Carlisle Offices, Sandyford"],
     ["Northern Ireland office","Omagh Enterprise Centre, Co. Tyrone"],["Methodology","SMART™"],["Currency and timezone","EUR, GBP (NI) · Europe/Dublin"]]},
  {id:"services", group:"ORGANISATION", title:"Service lines", icon:"modules", tint:"#4fb0d4",
   blurb:"The services Pulse uses to group projects, reports and pipeline.",
   tags:["10 services","18 live projects"],
   listLabel:"SERVICES",
   rows:[["Energy audits","8 projects"],["Environmental assessment","4 projects"],["ISO 50001","2 projects"],["ISO 14001","1 project"],
     ["ISO 14064","1 project"],["Carbon & climate action","2 projects"],["ESG & sustainability","1 project"],["Renewable feasibility","1 project"],
     ["B Corp support","1 project"],["Energy monitoring","1 retainer"]]},
  {id:"demo", group:"ORGANISATION", title:"Demo data notice", icon:"audit", tint:"#e6c78a",
   blurb:"Read this before sharing screens from this build.",
   tags:["Illustrative","16 Nov 2026"],
   heroLabel:"ABOUT THIS DEMO", heroAction:"Understood",
   heroText:"Figures are an illustrative operating snapshot, not verified Global Green data. Only Niall Kiernan is a real, named person; every other name, email and client record is fictional.",
   listLabel:"WHAT IS SIMULATED",
   rows:[["Calendly, OnePageCRM, Monday.com, QuickBooks","simulated demo connections"],["LinkedIn and outbound email","proposed integrations"],
     ["Emails, posts and reminders","drafted only, never sent"],["Bank reconciliation","suggested matches only"]]},

  {id:"people", group:"TEAM", title:"People & access", icon:"people", tint:"#6ad0f0",
   blurb:"The nine-person team and the two external collaborators who can see parts of Pulse.",
   tags:["9 staff","2 external","3 offices"], badge:"1 review", badgeKind:"warn",
   footer:"External accountant has finance review access only", action:"Review access",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Invite or remove team members","9 active"],["External collaborators","accountant, ecologist"],["Assign managers","Aoife Brennan (operations)"],
     ["Offices","Carrick-on-Shannon · Sandyford · Omagh"],["Suspend accounts","none suspended"],["Last login","9 of 9 today"]]},
  {id:"departments", group:"TEAM", title:"Departments & capacity", icon:"teams", tint:"#b6e070",
   blurb:"How the team is organised and how many billable days each person has.",
   tags:["7 departments","32 billable days a week"],
   listLabel:"DEPARTMENTS",
   rows:[["Leadership","Niall Kiernan · 2 days"],["Operations","Aoife Brennan · 3 days"],["Energy","Eoin, Ciara, Mark · 13.5 days"],
     ["Environmental","Sarah McHugh · 4.5 days"],["Carbon & ESG","Dara Flynn · 4.5 days"],["Sales","Louise Kelly · non-billable"],["Finance","Emma Walsh · non-billable"]]},

  {id:"teams", group:"PERMISSIONS", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Permission templates, and exactly what each person can reach.",
   tags:["4 roles","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"Pick a person and see every client, project, invoice and report they can reach, resolved through their role rather than guessed from the menus.",
   footer:"Preview Pulse as another user", action:"Open preview",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Admin","Niall Kiernan"],["Manager","Aoife Brennan"],["Consultant","6 people, assigned projects"],
     ["External","finance review or single-project evidence"],["Approve payment reminders","Emma Walsh, Niall Kiernan"],["Approve campaigns and posts","Niall Kiernan"]]},
  {id:"security", group:"PERMISSIONS", title:"Security", icon:"lock", tint:"#8fa6ff",
   blurb:"Sign-in, sessions, devices and simulated data access.",
   tags:["SSO on","2FA enforced"], badge:"1 advisory", badgeKind:"warn",
   footer:"Review external access every 90 days", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Single sign-on","Microsoft 365", true],["Two-factor authentication","enforced", true],["Login policies","30-day session"],
     ["Active sessions","12"],["IP restrictions","off", false],["Security alerts","on", true],["Data retention rules","7 years"]]},
  {id:"audit", group:"PERMISSIONS", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A locked history of who changed what, people and agents alike.",
   tags:["Append-only","7-year retention"],
   footer:"Nobody can edit or delete entries", action:"Export",
   listLabel:"WHAT IS RECORDED",
   rows:[["Approvals and rejections","every decision"],["Agent actions","118 this week"],["Report versions","per review step"],
     ["Permission changes","3 this month"],["Data exports","2"],["Simulated sync events","every run"]]},

  {id:"integrations", group:"SYSTEMS", title:"Systems", icon:"plug", tint:"#6ad0f0",
   blurb:"The tools Global Green already uses, and which way data flows.",
   tags:["4 demo connections","2 proposed"], badge:"2 proposed", badgeKind:"warn",
   footer:"All connections in this demo are simulated", action:"Review",
   listLabel:"CONNECTIONS",
   rows:[["Calendly","simulated"],["OnePageCRM","simulated"],["Monday.com","simulated"],["QuickBooks Online","read only, simulated"],
     ["LinkedIn","proposed"],["Outbound email","proposed"]]},
  {id:"health", group:"SYSTEMS", title:"Data health", icon:"health", tint:"#e2705c",
   blurb:"What is wrong with the data across the four systems, and the fix.",
   tags:["5 issue types","19 records affected"], badge:"7 evidence overdue", badgeKind:"bad",
   footer:"Last scanned 12 minutes ago", action:"Fix 2 automatically",
   listLabel:"ISSUES FOUND",
   trend:[41,37,33,29,26,22,19],
   bySeverity:[["High","9",RED],["Medium","6",AMBER],["Low","4",DIM]],
   issues:[["Evidence overdue from clients","7","high","Glenmere 3, Oakfield 2, Carrick 2","Review"],
     ["Duplicate contacts (OnePageCRM and Pulse)","4","medium","Merge on matching email","Fix automatically"],
     ["Invoices with no project attached","3","medium","INV-1057, INV-1059, INV-1063","Review"],
     ["Projects missing a Monday.com board link","2","high","GG-253 and GG-256","Fix automatically"],
     ["Contacts with no phone number","3","low","Flagged by Sales & Outreach","Review"]],
   rows:[]},
  {id:"modules", group:"SYSTEMS", title:"Modules & configuration", icon:"modules", tint:"#f0c04b",
   blurb:"Turn modules on, and make Pulse speak Global Green's own words.",
   tags:["5 modules","2 renamed terms"],
   heroLabel:"TERMINOLOGY", heroAction:"Edit terminology",
   heroText:"Organisation reads as Client and Job reads as Project everywhere in the interface, including what the agents say back to you.",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Sales & Outreach","on"],["Projects","on"],["Site Assessments","on"],["Reports & Compliance","on"],["Finance","on"],
     ["Custom fields","MPRN, GPRN, SEAI grant ref"],["Record types","13 types"]]},

  {id:"agents", group:"AI CONTROLS", title:"Agents & AI controls", icon:"agent", tint:"var(--accent)",
   blurb:"What agents may read, what they may do, and where they must stop.",
   tags:["8 agents","87 actions today"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent. Anything mid-run finishes its current step and then holds.",
   footer:"Every external action needs a person", action:"Review limits",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Approved agent roles","8"],["Data agents can read","by role and project"],["Actions agents can take","read, draft, recommend"],
     ["Send, post, pay or reconcile","never without approval", true],["Spending and usage limits","€60/month cap"],["Agent memory and retention","90 days"]]},
  {id:"wf", group:"AI CONTROLS", title:"Approval policies", icon:"flow", tint:"#9d8cf5",
   blurb:"Human-in-the-loop rules. Who must say yes before anything leaves the building.",
   tags:["7 policies","No auto-send"],
   footer:"Policies apply to people and agents alike", action:"Edit policies",
   listLabel:"POLICIES",
   rows:[["Client emails and evidence requests","project owner approves", true],["Payment reminders","Emma Walsh or Niall Kiernan", true],
     ["Campaigns and LinkedIn posts","Niall Kiernan", true],["Postings to QuickBooks","never by an agent", true],
     ["Bank reconciliation","accountant confirms", true],["Technical reports","engineer signs off before issue", true],["Compliance certification","never by AI", true]]},
  {id:"notif", group:"AI CONTROLS", title:"Notifications & logs", icon:"bell", tint:"#f0994b",
   blurb:"What reaches people, on which channel, and the AI action log.",
   tags:["Inbox","Email","Quiet 19:00 to 07:00"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Morning briefing","07:00 weekdays"],["Approval requests","in-app and email", true],["Mobile push","", false],
     ["Escalation rules","after 4 hours unread"],["AI action log","every run, kept 7 years"],["Weekly summary","Friday 16:00"]]},

  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Logo, accent colour and how agents appear.",
   tags:["Green accent","GG monogram"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company logo","GG monogram (placeholder)"],["Primary green","#168763 (provisional)"],["Secondary blue","#187EA2 (provisional)"],
     ["Accent lime","#A9D75E (provisional)"],["Agent appearance","8 faces"],["Client-facing documents","Global Green template"]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["Harbour default","Light and dark"],
   listLabel:"THEMES", rows:[]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(3,1fr)", "Organisation"],
  ["TEAM", "repeat(2,1fr)", "Team"],
  ["PERMISSIONS", "repeat(3,1fr)", "Permissions"],
  ["SYSTEMS", "repeat(3,1fr)", "Systems"],
  ["AI CONTROLS", "repeat(3,1fr)", "AI Controls"],
  ["EXPERIENCE", "repeat(2,1fr)", "Experience"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {Pulse:"var(--accent)", Agent:"var(--accent)", Calendly:"#4fb0d4", OnePageCRM:"#f0a060",
  "Monday.com":"#f06a8a", QuickBooks:"#3fbf8f", LinkedIn:"#4f8fd4", Email:"#f07a9d"};
const SRC_ABBR = {Pulse:"PL", Agent:"AI", Calendly:"CL", OnePageCRM:"OP", "Monday.com":"MD", QuickBooks:"QB", LinkedIn:"LI", Email:"EM"};

const DATA_EVENTS = [
  ["Discovery call booked","Tralee Food Ingredients booked Wed 18 Nov 11:00 through Calendly.","Calendly","Tralee Food Ingredients","Calendly","completed"],
  ["Deal synced","Shannon Aviation moved to Negotiation in OnePageCRM (simulated).","OnePageCRM sync","Shannon Aviation Services","OnePageCRM","completed"],
  ["Boards synced","18 project boards and 214 items read from Monday.com (simulated).","Monday.com sync","18 projects","Monday.com","completed"],
  ["Payment received","INV-1068 Lough Arrow Distillery, €4,450, read from QuickBooks (simulated).","QuickBooks sync","Lough Arrow Distillery","QuickBooks","completed"],
  ["Bank lines read","12 card and bank lines since 30 Oct. Read only; nothing posted.","QuickBooks sync","EXP-OCT-11","QuickBooks","completed"],
  ["Evidence uploaded","Compressed-air logger data (7 days) filed against GG-257.","Mark Reilly","Kilnamanagh Plastics","Pulse","completed"],
  ["Receipts extracted","11 receipts in EXP-OCT-11: vendor, date, amount and VAT read.","Finance Review","EXP-OCT-11","Agent","completed"],
  ["Lead from LinkedIn","Harbour Point Offices commented on Niall's audit post (proposed integration).","LinkedIn","Harbour Point Offices","LinkedIn","completed"],
  ["Sync retried","Monday.com rate limit on one board; succeeded on retry at 06:50.","Monday.com","Ops Watchdog","Monday.com","failed"]
];

const PEOPLE_EVENTS = [
  ["Eoin added review comments","7 comments on the Corrib GHG inventory v0.9.","Eoin Gallagher","Corrib Medical Devices","Monday.com","completed"],
  ["Louise sent proposal P-037","Midwest Concrete, ISO 14001, €16,500 (logged from OnePageCRM).","Louise Kelly","Midwest Concrete Ltd","OnePageCRM","completed"],
  ["Ciara completed a site visit","Ardmore Blocks A and B; 64 thermal images uploaded.","Ciara Doyle","Ardmore Business Park","Pulse","completed"],
  ["Sarah chased ecology inputs","Bat survey and bird report for Oakfield were due 13 Nov.","Sarah McHugh","Oakfield Solar","Pulse","awaiting"],
  ["Dara approved a technical review","Mullingar aspects and impacts register v1.0.","Dara Flynn","Mullingar Precision Engineering","Monday.com","completed"],
  ["Emma is reviewing a reminder","INV-1048 Westhaven, €18,400, 42 days overdue.","Emma Walsh","Westhaven Retail Parks","Pulse","awaiting"],
  ["Aoife is rebalancing week 47","Moving Bréifne data review support from Dara to Ciara.","Aoife Brennan","Bréifne Hotels Group","Pulse","awaiting"],
  ["Niall booked a discovery call","Dundalk Biotech Park, Tue 24 Nov 10:00.","Niall Kiernan","Dundalk Biotech Park","Calendly","completed"]
];

const AI_EVENTS = [
  ["Ops Watchdog flagged GG-241 at risk","3 meter-data files missing two days before the Glenmere visit.","Ops Watchdog","Glenmere Foods","Agent","working"],
  ["Finance Review drafted a reminder","INV-1048, €18,400, 42 days overdue. Waiting on Emma; not sent.","Finance Review","Westhaven Retail Parks","Agent","awaiting"],
  ["Sales & Outreach drafted a follow-up","Liffey Packaging P-034, 9 days without a reply. Waiting on Louise.","Sales & Outreach","Liffey Packaging","Agent","awaiting"],
  ["Ops Watchdog recommended an escalation","Carrick Logistics: 2 ISO 50001 milestones blocked 31 days.","Ops Watchdog","Carrick Logistics","Agent","awaiting"],
  ["Finance Review suggested 8 matches","EXP-OCT-11: €1,205 matched; 3 exceptions (€640) routed to the accountant.","Finance Review","EXP-OCT-11","Agent","working"],
  ["Fieldwork checked site readiness","6 visits this week: 3 ready, 3 need attention.","Fieldwork","Site Assessments","Agent","working"],
  ["Compliance & Evidence drafted a summary","RPT-257 executive summary, marked for engineer review.","Compliance & Evidence","Kilnamanagh Plastics","Agent","completed"],
  ["Briefing posted the morning brief","Two things need Niall today; the rest is covered.","Briefing","Niall Kiernan","Agent","completed"]
];

const STREAM_DEFS = [
  {id:"data", title:"New data", sub:"Information entering Pulse", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"Employee activity", sub:"Decisions people made", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"AI activity", sub:"Agents at work", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard", dot:true},
  {label:"Sales & Outreach", icon:"navSales", page:"Sales"},
  {label:"Projects", icon:"navProjects", page:"Projects"},
  {label:"Site Assessments", icon:"navSites", page:"Sites"},
  {label:"Reports & Compliance", icon:"navReports", page:"Reports"},
  {label:"Finance", icon:"navFinance", page:"Finance"},
  {label:"Work", icon:"navWork", page:"Work"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {label:"Activity", icon:"pulseLine", page:"Activity", dot:true}
];

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
const ITEMS = {
  westhaven:{kind:"Approval", importance:"critical", icon:ICONS.approvals, age:"42d", record:"APR-01",
    title:"INV-1048 Westhaven Retail Parks, €18,400 overdue",
    why:"42 days past due. Finance Review drafted a second reminder; it waits for Emma or you.",
    detail:"One reminder went on 12 October. The draft is firm but professional and attaches the delivered report summary. Approving marks it ready in the demo; nothing is sent.",
    actionLabel:"Review reminder", secondaryLabel:"Open invoice", group:"Approvals",
    fields:[{k:"Agent",v:"Finance Review"},{k:"Client",v:"Westhaven Retail Parks"},{k:"Value",v:"€18,400"},{k:"Record",v:"INV-1048"}],
    history:[{when:"12 Oct",text:"First reminder sent by Emma Walsh"},{when:"Today 06:30",text:"Second reminder drafted by Finance Review"}]},
  glenmere:{kind:"Alert", importance:"high", icon:ICONS.visits, age:"2d", record:"APR-03",
    title:"Glenmere visit Wednesday: 3 meter-data files missing",
    why:"Without them the energy balance cannot be closed on site, which puts the 30 Nov report at risk.",
    detail:"MPRN half-hourly data, GPRN readings and the compressed-air sub-meter export were requested on 7 and 28 October. A request to Peter Lynch is drafted for Eoin.",
    actionLabel:"Review request", secondaryLabel:"Open project", group:"Alerts",
    fields:[{k:"Project",v:"GG-241"},{k:"Owner",v:"Eoin Gallagher"},{k:"Visit",v:"Wed 18 Nov 08:30"},{k:"Report due",v:"30 Nov"}],
    history:[{when:"28 Oct",text:"Second data request sent"},{when:"Today 06:45",text:"Ops Watchdog marked GG-241 at risk"}]},
  liffey:{kind:"Approval", importance:"high", icon:ICONS.approvals, age:"9d", record:"APR-02",
    title:"Liffey Packaging proposal unanswered 9 days (€24,000)",
    why:"Opened twice, no reply. A tailored follow-up is drafted for Louise.",
    detail:"The draft offers to phase the Scope 1 and 2 baseline first, because two of Liffey's FMCG customers want supplier carbon data in the new year.",
    actionLabel:"Review follow-up", secondaryLabel:"Open opportunity", group:"Approvals",
    fields:[{k:"Opportunity",v:"L-034"},{k:"Owner",v:"Louise Kelly"},{k:"Value",v:"€24,000"},{k:"Sent",v:"7 Nov"}],
    history:[{when:"7 Nov",text:"Proposal P-034 sent"},{when:"Today 06:20",text:"Follow-up drafted by Sales & Outreach"}]},
  carrick:{kind:"Alert", importance:"high", icon:ICONS.health, age:"31d", record:"APR-06",
    title:"Carrick Logistics: 2 milestones blocked 31 days",
    why:"ISO 50001 baseline needs 12 months of energy data. Ops Watchdog recommends escalating.",
    detail:"Facilities was asked on 15 October and 2 November. The escalation proposes a call with Declan Farrell and a revised 4 December milestone.",
    actionLabel:"Review escalation", secondaryLabel:"Open project", group:"Work",
    fields:[{k:"Project",v:"GG-236"},{k:"Owner",v:"Dara Flynn"},{k:"Value",v:"€16,200"},{k:"Milestone",v:"27 Nov"}],
    history:[{when:"15 Oct",text:"Data requested"},{when:"2 Nov",text:"Chased by Dara Flynn"}]},
  expenses:{kind:"Task", importance:"normal", icon:ICONS.work, age:"1d", record:"APR-05",
    title:"EXP-OCT-11: 3 expense exceptions (€640)",
    why:"8 of 11 receipts matched. Three need a person before they go to the accountant.",
    detail:"No card transaction for the Landmark Hotel dinner, a possible duplicate Amazon charge, and an unreadable taxi receipt. Nothing is posted to QuickBooks.",
    actionLabel:"Review exceptions", secondaryLabel:"Open expenses", group:"Automations",
    fields:[{k:"Batch",v:"EXP-OCT-11"},{k:"Owner",v:"Emma Walsh"},{k:"Matched",v:"€1,205"},{k:"Exceptions",v:"€640"}],
    history:[{when:"Yesterday 22:10",text:"Receipts extracted by Finance Review"}]}
};
const ORDER = ["westhaven","glenmere","liffey","carrick","expenses"];

const ANSWERS = {
  attention:{tool:"briefing_today", effect:"read",
    text:"Good morning, Niall. There are 18 active projects, with 4 at risk and 2 blocked. Westhaven Retail Parks has an €18,400 invoice overdue by 42 days. Glenmere Foods is missing 3 meter-data files ahead of Wednesday's site visit. I have prepared the recommended follow-ups for your approval.",
    cols:["Item","Record","Value","Owner"],
    rows:[["Overdue invoice","INV-1048 Westhaven","€18,400 · 42d","E. Walsh"],["Missing meter data","GG-241 Glenmere","3 files","E. Gallagher"],
      ["Proposal follow-up","L-034 Liffey","€24,000 · 9d","L. Kelly"],["Blocked milestones","GG-236 Carrick","2 milestones","D. Flynn"]],
    actions:[["Review the approvals",1,"nav:Agents|Approvals"],["Open the Executive dashboard",0,"nav:Dashboard|Executive"]]},
  overdue:{tool:"finance_debtors", effect:"read",
    text:"Eight invoices are overdue, totalling €42,350. Westhaven Retail Parks is the one to act on: INV-1048 for €18,400 is 42 days past due and is 43% of the balance. One reminder went on 12 October; a second is drafted and waiting for Emma.",
    cols:["Invoice","Client","Value","Overdue"],
    rows:[["INV-1048","Westhaven Retail Parks","€18,400","42d"],["INV-1052","Bréifne Hotels Group","€4,800","27d"],["INV-1061","Mullingar Precision Eng.","€4,500","13d"],["INV-1064","Kells Agri Supplies","€4,100","7d"]],
    actions:[["Review the Westhaven reminder",1,"APR-01"],["Open Invoices",0,"nav:Finance|Invoices"]]},
  glenmere:{tool:"projects_find", effect:"read",
    text:"Glenmere Foods (GG-241, €12,800) is at risk. The site assessment is on Wednesday 18 November and three meter-data files have not arrived: MPRN half-hourly data, GPRN readings and the compressed-air sub-meter export. Without them the energy balance cannot be closed on site, which puts the 30 November report date at risk. Client Communications has drafted a request to Peter Lynch for Eoin's approval.",
    actions:[["Review the data request",1,"APR-03"],["Open GG-241",0,"GG-241"]]},
  sales:{tool:"pipeline_find", effect:"read",
    text:"The open pipeline is €162,000 across 12 opportunities, about €71,400 weighted. Liffey Packaging needs attention: the €24,000 carbon roadmap proposal went on 7 November, was opened twice and has had no reply in nine days. I drafted a follow-up that offers to phase the baseline first, because two of their FMCG customers want supplier carbon data.",
    cols:["Opportunity","Stage","Value","Next step"],
    rows:[["Liffey Packaging","Proposal sent","€24,000","Follow up"],["Shannon Aviation","Negotiation","€18,000","Staged payments"],["Brookfield Nursing Homes","Qualified","€21,000","Price-check draft"],["Midwest Concrete","Proposal sent","€16,500","Check in Thu"]],
    actions:[["Review the Liffey follow-up",1,"APR-02"],["Open the pipeline",0,"nav:Sales|Pipeline"]]},
  projects:{tool:"projects_health", effect:"read",
    text:"Of 18 active projects, 12 are on track, 4 at risk and 2 blocked. Both blocked projects are waiting on clients: Carrick Logistics (GG-236) needs 12 months of energy data for its ISO 50001 baseline, and Midlands Cold Storage (GG-244) needs BMS access. Carrick has been blocked for 31 days, so I recommend escalating to Declan Farrell.",
    cols:["Project","Client","Status","Waiting on"],
    rows:[["GG-236","Carrick Logistics","Blocked","Energy data"],["GG-244","Midlands Cold Storage","Blocked","BMS access"],["GG-241","Glenmere Foods","At risk","3 meter files"],["GG-252","Oakfield Solar","At risk","2 ecology docs"]],
    actions:[["Review the Carrick escalation",1,"APR-06"],["Open Milestones",0,"nav:Projects|Milestones"]]},
  visits:{tool:"site_visits_find", effect:"read",
    text:"Six site assessments are booked this week and three are ready. Glenmere Foods on Wednesday is missing meter data, Oakfield Solar on Thursday is waiting on two ecology reports, and the Wicklow route walkover on Friday still needs a second surveyor.",
    cols:["Visit","Client","When","Status"],
    rows:[["SV-302","Shannonside Dairies","Tue 09:30","Ready"],["SV-303","Glenmere Foods","Wed 08:30","At risk"],["SV-304","Oakfield Solar","Thu 10:00","Evidence pending"],["SV-306","Wicklow Hills Wind Farm","Fri 09:00","Needs surveyor"]],
    actions:[["Open the site schedule",1,"nav:Sites|Schedule"],["Review the Oakfield request",0,"APR-04"]]},
  expenses:{tool:"expenses_review", effect:"read",
    text:"October's batch, EXP-OCT-11, has 11 receipts totalling €1,845. Eight match card lines in QuickBooks (€1,205, simulated). Three exceptions (€640) need a person: the Landmark Hotel dinner has no card transaction, an Amazon charge looks duplicated, and a Galway taxi receipt is unreadable. I have not posted or reconciled anything.",
    actions:[["Review the exceptions",1,"nav:Finance|Expenses"],["Open Reconciliation",0,"nav:Finance|Reconciliation"]]},
  outreach:{tool:"outreach_status", effect:"read",
    text:"Campaign CMP-07 is drafted for 120 commercial and industrial prospects: a three-step sequence on the 2027 energy audit obligation, with personalised first lines. LinkedIn post LI-21 is ready for Tuesday. Both need your approval. LinkedIn and the outbound email infrastructure are proposed integrations, so nothing can be sent or posted from this demo.",
    actions:[["Review the campaign",1,"CMP-07"],["Open LinkedIn",0,"nav:Sales|LinkedIn"]]},
  chase:{tool:"email_draft", effect:"write", confirm:true,
    confirmSummary:"Second payment reminder to Gráinne Costello (Westhaven Retail Parks) for INV-1048, €18,400, 42 days overdue.",
    text:"Drafted. Sending is an external action, so it waits in the approval queue for Emma or you. Nothing has been sent.",
    actions:[["Review in Approvals",1,"APR-01"],["Open the invoice",0,"INV-1048"]]},
  fallback:{tool:"records_search", effect:"read",
    text:"I can answer from every record you can see: clients, projects, site visits, evidence, reports, invoices and the pipeline. Anything that would change a record or contact a client is drafted and stops for your approval.",
    actions:[["What needs my attention today?",1],["Which projects are blocked?",0]]}
};

// Turns a plain-English filter name into a full dashboard area — the "primitive
// vibe-coding" bit: no real backend, just a seeded generator so the same phrase
// always produces the same numbers, with direction and vocabulary nudged by
// keywords in the text (expansion/growth trends up, risk/issue trends down, a
// region/cost/people/ops/customer word picks which metrics show).
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR — 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR — 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY — 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  const s = q.toLowerCase();
  if (/glenmere|meter/.test(s)) return ANSWERS.glenmere;
  if (/expense|receipt|reconcil|dext|quickbooks/.test(s)) return ANSWERS.expenses;
  if (/campaign|outreach|linkedin|cold email|prospect/.test(s)) return ANSWERS.outreach;
  if (/liffey|proposal|pipeline|sales|lead|opportunit|deal/.test(s)) return ANSWERS.sales;
  if (/visit|site|assessment|this week/.test(s)) return ANSWERS.visits;
  if (/chase|remind|draft|send/.test(s)) return ANSWERS.chase;
  if (/overdue|debtor|invoice|owe|westhaven|cash|paid|payment/.test(s)) return ANSWERS.overdue;
  if (/project|block|risk|carrick|milestone|delay|delivery/.test(s)) return ANSWERS.projects;
  if (/attention|today|brief|morning|priorit|changed|summary|happening|need/.test(s)) return ANSWERS.attention;
  return ANSWERS.fallback;
}

const ORGS = [
  ["Westhaven Retail Parks","Client","€18,400","42 days","overdue"],
  ["Glenmere Foods","Client","€6,400","current","at risk"],
  ["Carrick Logistics","Client","€5,400","current","blocked"],
  ["Oakfield Solar","Client","€7,300","current","at risk"],
  ["Liffey Packaging","Prospect","—","—","proposal"],
  ["Shannonside Dairies","Client","€5,300","current","active"]
];
const TEAMS = [
  ["Energy","3 members","Eoin Gallagher","projects:energy:*"],
  ["Environmental & Carbon","2 members","Sarah McHugh","projects:env:*"],
  ["Operations & Sales","2 members","Aoife Brennan","pipeline:*, projects:view"],
  ["Leadership & Finance","2 members","Niall Kiernan","all permissions"]
];
const LOCATIONS = [
  ["The Hive (head office)","Carrick-on-Shannon, Co. Leitrim","6 staff","active"],
  ["Carlisle Offices","Sandyford, Dublin","2 staff","active"],
  ["Omagh Enterprise Centre","Omagh, Co. Tyrone","1 staff","active"]
];

const AGENT_DEFS = [
  {id:"standup", name:"Monday stand-up", shape:"rim-capsule", tint:"#1b2430", state:"working", group:true,
   members:["briefing","watchdog","finance"], role:"Briefing, Ops Watchdog and Finance Review working the same Monday morning",
   when:"07:10", preview:"ops watchdog: two blocked, both waiting on clients.",
   thread:[
     {kind:"stamp", text:"Today 07:04"},
     {kind:"routine", text:"Ran routine", routine:"Monday stand-up"},
     {kind:"agent", from:"watchdog", text:"two projects are blocked and both are waiting on clients: Carrick Logistics needs energy data, Midlands Cold Storage needs BMS access. Carrick has been stuck 31 days."},
     {kind:"agent", from:"finance", text:"€42,350 is overdue across eight invoices. Westhaven is €18,400 of it at 42 days. reminder drafted, not sent."},
     {kind:"agent", from:"briefing", text:"so this morning is three decisions: the Westhaven reminder, the Carrick escalation and the Glenmere data request."},
     {kind:"user", text:"do glenmere first, the visit is wednesday"},
     {kind:"agent", from:"watchdog", text:"agreed. the request to Peter Lynch is in Eoin's approval queue. if it goes this morning there is still time to collect the files on site."}
   ]},
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#191c1f", state:"complete", role:"Company-wide morning and on-demand summaries for Niall",
   when:"07:00", preview:"18 active, 4 at risk, 2 blocked. three things need you.",
   thread:[
     {kind:"stamp", text:"Today 07:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing:", lines:[
       {k:"Delivery", v:"18 active · 4 at risk · 2 blocked"},
       {k:"Cash", v:"€42,350 overdue · Westhaven €18,400 at 42 days"},
       {k:"Fieldwork", v:"6 visits this week · Glenmere missing 3 meter files"},
       {k:"Approvals", v:"9 waiting · nothing sent without you"}]},
     {kind:"agent", text:"three things need you today: the Westhaven reminder, the Glenmere data request and a yes or no on escalating Carrick. the rest is covered."},
     {kind:"user", text:"what's the pipeline looking like"},
     {kind:"agent", text:"€162,000 across 12 opportunities. Liffey Packaging (€24,000) has gone nine days without a reply; a follow-up is drafted for Louise."}
   ]},
  {id:"watchdog", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention", role:"Project risks, delays and operational exceptions",
   when:"06:45", preview:"carrick blocked 31 days. escalation drafted.",
   thread:[
     {kind:"stamp", text:"Today 06:45"},
     {kind:"agent", text:"GG-241 Glenmere is now at risk. three meter-data files are still missing and the visit is in two days. i created task T-101 for Eoin."},
     {kind:"agent", text:"GG-236 Carrick Logistics: the energy review and the EnPI milestones have been blocked 31 days on consumption data. facilities was asked twice. i recommend escalating to Declan Farrell, with a revised milestone of 4 December."},
     {kind:"user", text:"is anyone else at risk"},
     {kind:"agent", text:"Bréifne (Dara over-allocated in weeks 47 and 48) and Corrib (hours trending 12% over budget). both have owners and a plan; neither needs you today."}
   ]},
  {id:"sales", name:"Sales & Outreach", shape:"executive-capsule", tint:"#1b2430", state:"waiting", role:"Lead prioritisation, outreach and proposal follow-ups",
   when:"06:20", preview:"liffey follow-up drafted. campaign of 120 waiting on you.",
   thread:[
     {kind:"stamp", text:"Today 06:20"},
     {kind:"agent", text:"P-034 to Liffey Packaging has gone nine days without a reply and was opened twice. i drafted a follow-up for Louise that offers to phase the baseline first."},
     {kind:"agent", text:"CMP-07 is ready: 120 prospects, three steps, personalised first lines. nothing is scheduled. it needs your approval and a sending domain, which is a proposed integration."},
     {kind:"user", text:"who should we be talking to that we aren't"},
     {kind:"agent", text:"Darragh Lyons at Shannon Cold Chain shared your audit post and fits CMP-07 well. Patrick Duggan at Westmeath Feeds reacted too. neither is in OnePageCRM yet."}
   ]},
  {id:"delivery", name:"Project Delivery", shape:"control-cube", tint:"#16241f", state:"working", role:"Milestones, workload and delivery coordination",
   when:"07:05", preview:"dara at 118% next week. proposed a swap with ciara.",
   thread:[
     {kind:"stamp", text:"Today 07:05"},
     {kind:"agent", text:"Dara is at 118% in week 47 across Bréifne, Corrib and Athlone. Ciara has a day and a half free once Ardmore closes. i proposed moving Bréifne data review support to her on 23 November."},
     {kind:"agent", text:"Sarah is double-booked on Friday: the Wicklow route walkover and an Oakfield follow-up. the Wicklow walkover needs a second surveyor either way."}
   ]},
  {id:"fieldwork", name:"Fieldwork", shape:"low-dome", tint:"#241b2e", state:"working", role:"Site-visit planning, evidence and assessment readiness",
   when:"06:50", preview:"6 visits this week. 3 ready, 3 need attention.",
   thread:[
     {kind:"stamp", text:"Today 06:50"},
     {kind:"agent", text:"readiness for this week: Ardmore today and Shannonside tomorrow are ready. Glenmere on Wednesday is missing three meter files. Oakfield on Thursday is waiting on the bat and bird reports. Wicklow on Friday needs a second surveyor."},
     {kind:"user", text:"chase the ecologist"},
     {kind:"agent", text:"drafted a note to Orla Tighe asking for both reports by Wednesday and pencilled a 30-minute call. it is in Sarah's approval queue; nothing has been sent."}
   ]},
  {id:"compliance", name:"Compliance & Evidence", shape:"precision-brow", tint:"#191c1f", state:"thinking", role:"Report completeness, deadlines and audit trails",
   when:"07:02", preview:"3 reports stuck in data collection, 7 items missing.",
   thread:[
     {kind:"stamp", text:"Today 07:02"},
     {kind:"agent", text:"three reports cannot leave data collection: Glenmere (3 items), Oakfield (2) and Carrick (2). every other report has what it needs."},
     {kind:"agent", text:"i drafted the executive summary for the Kilnamanagh audit from the logger data and findings, with a source on every sentence. it needs an engineer's review before anything goes to the client. i don't sign off reports or certify compliance."}
   ]},
  {id:"finance", name:"Finance Review", shape:"rim-capsule", tint:"#2a2118", state:"waiting", role:"Debtors, expenses and reconciliation suggestions",
   when:"06:30", preview:"westhaven reminder and 3 expense exceptions waiting.",
   thread:[
     {kind:"stamp", text:"Yesterday 22:10"},
     {kind:"agent", text:"EXP-OCT-11: read 11 receipts, €1,845. eight match card lines in QuickBooks (€1,205). three exceptions (€640) are routed to Brendan Moran for review. nothing is posted or reconciled."},
     {kind:"stamp", text:"Today 06:30"},
     {kind:"agent", text:"INV-1048 Westhaven is 42 days overdue at €18,400. i drafted a second reminder for Emma. it is firm, attaches the delivered report summary and asks when payment is scheduled."},
     {kind:"user", text:"how bad is the debtor book overall"},
     {kind:"agent", text:"€42,350 across eight invoices. Westhaven is 43% of it. the next largest is Bréifne at €4,800, 27 days."}
   ]},
  {id:"comms", name:"Client Communications", shape:"offset-pebble", tint:"#16241f", state:"waiting", role:"Draft follow-ups and client status communications",
   when:"06:55", preview:"glenmere data request drafted for eoin.",
   thread:[
     {kind:"stamp", text:"Today 06:55"},
     {kind:"agent", text:"drafted the meter-data request to Peter Lynch at Glenmere Foods. it lists the three files, who holds the compressed-air export and why they matter for Wednesday. it waits for Eoin's approval."}
   ]}
];

const KPI_DEFS = {
  revenue:{label:"Invoiced (October)", value:eur(GG_METRICS.octRevenue), delta:"+6.2%", dir:"up", hint:"vs €72,300 in September", hero:true},
  pipeline:{label:"Open pipeline", value:eur(GG_METRICS.pipeline), delta:GG_METRICS.opportunities + " deals", dir:"up", hint:eur(Math.round(GG_METRICS.weightedPipeline)) + " weighted"},
  overdue:{label:"Overdue", value:eur(GG_METRICS.overdueValue), delta:GG_METRICS.overdueCount + " invoices", dir:"down", hint:"Westhaven €18,400 at 42 days"},
  projects:{label:"Active projects", value:String(GG_METRICS.projects), delta:GG_METRICS.atRisk + " at risk · " + GG_METRICS.blocked + " blocked", dir:"down", hint:GG_METRICS.onTrack + " on track"},
  visits:{label:"Site visits", value:String(GG_METRICS.visitsThisWeek), delta:"3 need prep", dir:"down", hint:"this week"},
  clients:{label:"Active clients", value:String(GG_METRICS.clients), delta:"+2 this year", dir:"up", hint:"client organisations"},
  approvals:{label:"Approvals waiting", value:"9", delta:"from 6 agents", dir:"up", hint:"nothing sent without a person"},
  team:{label:"Team", value:String(GG_METRICS.staff), delta:"3 offices", dir:"up", hint:"internal staff"}
};

const ASPECT_DEFS = [
  {id:"sales", label:"Sales", color:"var(--accent)", owner:"NIAMH CRONIN", description:"Counter, trade accounts and quotes out the door.",
   kind:"columns", chartTitle:"Revenue by month", chartUnit:"EUR",
   chart:[["Sep",288,"€0k"],["Oct",301,"€0k"],["Nov",352,"€0k"],["Dec",376,"€0k"],["Jan",268,"€0k"],["Feb",294,"€0k"],["Mar",318,"€0k"],["Apr",341,"€0k"],["May",362,"€0k"],["Jun",384,"€0k"],["Jul",398,"€0k"],["Aug",413,"€0k"]],
   splitTitle:"Where it came from",
   split:[["Trade counter","€214.6k","72%",1],["Contract accounts","€156.8k","53%",0],["Online orders","€41.4k","18%",0]],
   tableCols:["Account","Revenue","Change","Owner"],
   table:[["Glenmere Foods","€48,210","+12.4%","Louise Kelly"],["Westhaven Retail Parks","€28,410","−18.2%","Emma Walsh"],["Bréifne Hotels Group","€21,860","+4.1%","Louise Kelly"],["Midlands Cold Storage","€18,240","+9.6%","Aoife Brennan"]],
   metrics:[["Revenue","€412,800","+6.2%","up","30 days",[.4,.55,.44,.62,.5,.7,.6,.78,1]],
     ["Orders","318","+22","up","30 days",[.5,.6,.44,.7,.55,.75,.62,.8,.9]],
     ["Average order","€1,298","+1.8%","up","vs last month",[.6,.58,.62,.6,.66,.64,.7,.68,.74]],
     ["Quotes won","41%","−3pt","down","conversion",[.7,.66,.7,.6,.62,.55,.58,.5,.48]]]},
  {id:"development", label:"Development", color:"#9fd6f0", owner:"TOM WALSH", description:"Modules shipped into the client build and what they contributed.",
   kind:"rows", rows:[["approval routing","412 runs",412],["overdue reminder","308 runs",308],["visit escalation","286 runs",286],["quickbooks sync","198 runs",198],["briefing job","80 runs",80]], chartTitle:"Runs by automation", chartUnit:"RUNS · 30 DAYS",
   chart:[["Sep",620,"620"],["Oct",684,"684"],["Nov",712,"712"],["Dec",760,"760"],["Jan",802,"802"],["Feb",864,"864"],["Mar",918,"918"],["Apr",986,"986"],["May",1042,"1042"],["Jun",1128,"1128"],["Jul",1204,"1204"],["Aug",1284,"1284"]],
   splitTitle:"Runs by module",
   split:[["core","1,042","81%",1],["site-visits","198","15%",0],["ui-showcase","44","4%",0]],
   tableCols:["Module","Version","Contributions","State"],
   table:[["core","0.1.0","31 routes · 21 events","always installed"],["site-visits","1.0.0","1 entity · 2 tools","installed"],["ui-showcase","0.1.0","3 pages","installed"],["wholesale","—","6 entities · 9 tools","available"]],
   metrics:[["Modules live","3","+1","up","this quarter",[.2,.2,.4,.4,.4,.6,.6,.6,1]],
     ["Helios tools","11","+2","up","registered",[.4,.44,.5,.5,.6,.6,.7,.8,.9]],
     ["Automation runs","1,284","+9%","up","30 days",[.5,.55,.6,.58,.66,.7,.72,.8,.86]],
     ["Failure rate","0.9%","−0.4pt","up","of all runs",[.8,.74,.7,.62,.6,.5,.44,.4,.32]]]},
  {id:"marketing", label:"Marketing", color:"#e6c78a", owner:"AOIFE NOLAN", description:"Reach, enquiries and what turned into an account.",
   kind:"funnel", funnel:[["Enquiries","184","—",184],["Quoted","96","52% of enquiries",96],["Won","39","41% of quotes",39],["Repeat order","12","31% of wins",12]], chartTitle:"Enquiry to repeat order", chartUnit:"CONVERSION",
   chart:[["Sep",96,"96"],["Oct",104,"104"],["Nov",88,"88"],["Dec",112,"112"],["Jan",124,"124"],["Feb",118,"118"],["Mar",136,"136"],["Apr",142,"142"],["May",151,"151"],["Jun",164,"164"],["Jul",172,"172"],["Aug",184,"184"]],
   splitTitle:"Where they came from",
   split:[["Referral","78","42%",1],["Search","61","33%",0],["Trade shows","29","16%",0],["Direct","16","9%",0]],
   tableCols:["Channel","Enquiries","Change","Cost each"],
   table:[["Referral","78","+18.2%","€0.00"],["Search","61","+9.4%","€24.60"],["Trade shows","29","−6.1%","€41.20"],["Direct","16","+2.0%","€0.00"]],
   metrics:[["Enquiries","184","+31","up","30 days",[.3,.4,.36,.5,.46,.6,.58,.7,.86]],
     ["New accounts","12","+4","up","opened",[.2,.3,.24,.4,.36,.5,.44,.6,.7]],
     ["Cost per enquiry","€18.40","−€2.10","up","blended",[.8,.76,.7,.66,.6,.56,.5,.46,.4]],
     ["Repeat rate","68%","+3pt","up","ordering again",[.5,.54,.58,.56,.62,.64,.66,.7,.74]]]},
  {id:"operations", label:"Operations", color:"#dcded6", owner:"SÉAMUS BYRNE", description:"Engineers, vans, site visits and the work queue.",
   kind:"stacked", legend:["Head office","Carrick-on-Shannon office","Omagh office"], stacked:[["Sep",[34,28,9]],["Oct",[36,30,9]],["Nov",[39,32,10]],["Dec",[37,31,10]],["Jan",[32,27,8]],["Feb",[35,29,9]],["Mar",[40,33,10]],["Apr",[43,35,11]],["May",[46,37,12]],["Jun",[49,39,12]],["Jul",[52,42,13]],["Aug",[64,48,14]]], chartTitle:"Jobs completed by month", chartUnit:"JOBS",
   chart:[["Sep",88,"88"],["Oct",94,"94"],["Nov",102,"102"],["Dec",96,"96"],["Jan",84,"84"],["Feb",91,"91"],["Mar",104,"104"],["Apr",112,"112"],["May",118,"118"],["Jun",121,"121"],["Jul",124,"124"],["Aug",126,"126"]],
   splitTitle:"By location",
   split:[["Head office","64","51%",1],["Carrick-on-Shannon office","48","38%",0],["Omagh office","14","11%",0]],
   tableCols:["Engineer","Jobs","On time","Location"],
   table:[["Ciara Doyle","41","94%","Carrick-on-Shannon"],["Aoife Brennan","34","88%","Head office"],["Louise Kelly","28","96%","Head office"],["Unassigned","4","—","Carrick-on-Shannon"]],
   metrics:[["Jobs completed","126","+4","up","30 days",[.5,.6,.5,.66,.6,.7,.66,.76,.84]],
     ["Overdue tasks","11","+3","down","past due",[.3,.36,.3,.44,.4,.5,.56,.7,.85]],
     ["Visits completed","38","+11%","up","30 days",[.4,.5,.6,.5,.66,.6,.72,.8,.9]],
     ["Engineer hours","84%","−2pt","down","billable",[.8,.78,.8,.76,.78,.74,.76,.72,.7]]]},
  {id:"finance", label:"Finance", color:"#7fd8a4", owner:"AOIFE NOLAN", description:"Cash in, debt ageing and margin after cost.",
   kind:"area", chartTitle:"Cash collected by month", chartUnit:"EUR",
   chart:[["Sep",252,"€0k"],["Oct",268,"€0k"],["Nov",296,"€0k"],["Dec",318,"€0k"],["Jan",246,"€0k"],["Feb",264,"€0k"],["Mar",288,"€0k"],["Apr",306,"€0k"],["May",324,"€0k"],["Jun",342,"€0k"],["Jul",358,"€0k"],["Aug",368,"€0k"]],
   splitTitle:"Debt by age",
   split:[["0–30 days","€184.2k","61%",1],["31–60 days","€82.4k","27%",0],["61–90 days","€28.6k","9%",0],["90 days plus","€12.6k","4%",0]],
   tableCols:["Account","Balance","Change","Oldest"],
   table:[["Westhaven Retail Parks","€28,410","+42.0%","74 days"],["Bréifne Hotels Group","€9,240","+11.2%","63 days"],["Midlands Cold Storage","€3,560","−4.4%","61 days"],["Kells Agri Supplies","€1,180","−22.0%","8 days"]],
   metrics:[["Cash collected","€368,140","+4.1%","up","30 days",[.5,.56,.5,.62,.58,.68,.66,.74,.8]],
     ["Overdue debt","€41,200","+€8,410","down","60 days plus",[.3,.34,.4,.38,.46,.5,.6,.7,.84]],
     ["Gross margin","31.4%","−0.6pt","down","vs last month",[.7,.72,.7,.68,.68,.66,.64,.62,.6]],
     ["Days to pay","38","+6","down","weighted",[.4,.44,.42,.5,.52,.6,.62,.7,.76]]]},
  {id:"support", label:"Support", color:"#e2705c", owner:"NIAMH CRONIN", description:"Callbacks, warranty work and what came back twice.",
   kind:"dots", target:12, targetLabel:"Target: 12 callbacks a month or fewer", chartTitle:"Callbacks by month", chartUnit:"COUNT",
   chart:[["Sep",18,"18"],["Oct",16,"16"],["Nov",21,"21"],["Dec",19,"19"],["Jan",24,"24"],["Feb",22,"22"],["Mar",17,"17"],["Apr",15,"15"],["May",14,"14"],["Jun",12,"12"],["Jul",9,"9"],["Aug",7,"7"]],
   splitTitle:"By cause",
   split:[["Install fault","3","43%",1],["Part failure","2","29%",0],["User error","2","28%",0]],
   tableCols:["Site","Callbacks","First-visit fix","Cost"],
   table:[["Shannonside Dairies","2","50%","€840"],["Glenmere Foods","2","100%","€410"],["Bréifne Hotels Group","2","100%","€1,240"],["Navan Food Hall","1","100%","€650"]],
   metrics:[["Open callbacks","7","−2","up","live",[.6,.58,.54,.5,.48,.44,.4,.38,.34]],
     ["First-visit fix","82%","+4pt","up","of callbacks",[.5,.54,.56,.6,.6,.66,.7,.74,.8]],
     ["Warranty cost","€3,140","−€420","up","30 days",[.7,.66,.62,.6,.54,.5,.46,.44,.4]],
     ["Repeat faults","3","−1","up","same site",[.5,.5,.46,.4,.4,.36,.3,.3,.26]]]}
];

const FILTER_GROUPS = [
  {title:"AREA", items:["Sales","Development","Marketing","Operations","Finance","Support"]},
  {title:"SPINE", items:["Location","Team","Person","Organisation","Module"]},
  {title:"TIME", items:["This week","This month","This quarter","Year to date"]}
];

const OPS_DEFS = [
  {id:"o1", name:"Morning briefing", kind:"routine", owner:"Briefing", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 07:00", triggerKind:"schedule", next:"Tomorrow 07:00", last:"Delivered 07:00", status:"healthy", rate:100, on:true,
   what:"Reads projects, debtors, pipeline, site visits and approvals overnight and tells Niall the few things that need him.",
   why:"Niall was checking OnePageCRM, Monday.com and QuickBooks separately every morning.",
   saved:"9 hours a month",
   steps:[["Trigger","Every weekday at 07:00"],["Find","Overnight changes across delivery, cash, sales and fieldwork"],["Check","Drop anything already handled"],["Draft","Write the briefing"],["Send","Post to Home"]],
   runs:[["Today 07:00","21s","ok","1 briefing","€0.02"],["Fri 07:00","19s","ok","1 briefing","€0.02"],["Thu 07:00","23s","ok","1 briefing","€0.02"]]},
  {id:"o2", name:"Overdue invoice reminders", kind:"automation", owner:"Finance Review", ownerKind:"agent", initials:"FR",
   trigger:"Daily, 06:30", triggerKind:"schedule", next:"Tomorrow 06:30", last:"1 draft waiting", status:"approval", rate:96, on:true,
   what:"Finds invoices past due in QuickBooks (read only), drafts a reminder in Global Green's tone and parks it for Emma or Niall.",
   why:"Chasing happened in bursts, so the oldest debt got the least attention.",
   saved:"7 hours a month",
   steps:[["Trigger","Every weekday at 06:30"],["Find","Invoices past due (QuickBooks, simulated read)"],["Check","Exclude anything disputed"],["Draft","Write a reminder"],["Approval","Emma Walsh or Niall Kiernan reviews","gate"],["Send","Email the client (never automatic)","external"],["Update","Log the reminder on the invoice"]],
   runs:[["Today 06:30","6s","partial","1 drafted","€0.01","Awaiting approval: INV-1048 Westhaven"],["Fri 06:30","5s","ok","0 drafted","€0.00"],["Thu 06:30","7s","ok","1 drafted","€0.01"]]},
  {id:"o3", name:"Proposal follow-up", kind:"automation", owner:"Sales & Outreach", ownerKind:"agent", initials:"SO",
   trigger:"Proposal unanswered 7 days", triggerKind:"event", next:"Event-based", last:"Liffey draft waiting", status:"approval", rate:98, on:true,
   what:"When a proposal goes a week without a reply, drafts a tailored follow-up from the discovery notes.",
   why:"Proposals were going quiet without anyone noticing until month end.",
   saved:"5 hours a month",
   steps:[["Trigger","A proposal is 7 days old with no reply"],["Find","Discovery notes and interactions"],["Draft","Write the follow-up"],["Approval","Proposal owner reviews","gate"],["Update","Log the next action in OnePageCRM (simulated)"]],
   runs:[["Today 06:20","11s","partial","1 drafted","€0.01","Awaiting approval: P-034 Liffey Packaging"],["Tue 06:20","9s","ok","1 drafted","€0.01"]]},
  {id:"o4", name:"Calendly booking to lead", kind:"automation", owner:"Sales & Outreach", ownerKind:"agent", initials:"SO",
   trigger:"Calendly booking created", triggerKind:"event", next:"Event-based", last:"3 bookings this week", status:"healthy", rate:100, on:true,
   what:"A discovery booking creates or updates the lead in OnePageCRM, attaches the meeting and prepares a briefing note.",
   why:"Bookings were being retyped into the CRM by hand.",
   saved:"3 hours a month",
   steps:[["Trigger","A Calendly booking is created (simulated)"],["Find","Match against existing contacts"],["Update","Create the lead and meeting"],["Draft","Write a pre-call briefing"]],
   runs:[["Fri 16:40","4s","ok","Tralee Food Ingredients","€0.00"],["Thu 11:02","4s","ok","Dundalk Biotech Park","€0.00"]]},
  {id:"o5", name:"Won deal to Monday.com board", kind:"automation", owner:"Project Delivery", ownerKind:"agent", initials:"PD",
   trigger:"Deal marked won", triggerKind:"event", next:"Event-based", last:"Sandyford board created", status:"healthy", rate:100, on:true,
   what:"When a deal is won, creates the delivery board, milestones and kick-off task, and links the client record.",
   why:"Won work used to wait days before anyone set it up in Monday.com.",
   saved:"4 hours a month",
   steps:[["Trigger","A deal is marked won (simulated)"],["Find","Proposal scope and fee"],["Update","Create the project, board and milestones"],["Send","Notify the project owner"]],
   runs:[["21 Oct 15:12","9s","ok","GG-256 Sandyford","€0.01"],["30 Sep 10:40","8s","ok","GG-248 Athlone","€0.01"]]},
  {id:"o6", name:"Site readiness check", kind:"routine", owner:"Fieldwork", ownerKind:"agent", initials:"FW",
   trigger:"Daily, 06:50", triggerKind:"schedule", next:"Tomorrow 06:50", last:"3 of 6 visits need attention", status:"approval", rate:94, on:true,
   what:"Checks every visit in the next seven days for access, evidence and staffing, and drafts the requests that would unblock them.",
   why:"Engineers were arriving on site without the data they needed.",
   saved:"6 hours a month",
   steps:[["Trigger","Every day at 06:50"],["Find","Visits in the next 7 days"],["Check","Checklist, evidence and staffing"],["Draft","Evidence requests"],["Approval","Project owner reviews","gate"]],
   runs:[["Today 06:50","12s","partial","6 visits checked","€0.01","3 visits need attention"],["Fri 06:50","10s","ok","4 visits checked","€0.01"]]},
  {id:"o7", name:"Report completeness check", kind:"routine", owner:"Compliance & Evidence", ownerKind:"agent", initials:"CE",
   trigger:"Daily, 07:00", triggerKind:"schedule", next:"Tomorrow 07:00", last:"7 items missing", status:"healthy", rate:99, on:true,
   what:"Checks every report in progress against its evidence list and flags anything that would stop it moving stage.",
   why:"Reports were stalling at data collection without anyone noticing.",
   saved:"5 hours a month",
   steps:[["Trigger","Every day at 07:00"],["Find","Reports in progress"],["Check","Required evidence against what is received"],["Update","Flag gaps on the report"]],
   runs:[["Today 07:02","10s","ok","13 reports","€0.01"],["Fri 07:02","9s","ok","13 reports","€0.01"]]},
  {id:"o8", name:"Receipt extraction and matching", kind:"automation", owner:"Finance Review", ownerKind:"agent", initials:"FR",
   trigger:"Receipts uploaded", triggerKind:"event", next:"Event-based", last:"EXP-OCT-11: 3 exceptions", status:"approval", rate:91, on:true,
   what:"Reads each receipt, suggests a match to a QuickBooks card line and routes exceptions to the accountant. It never posts or reconciles.",
   why:"Receipts were keyed in by hand at month end.",
   saved:"8 hours a month",
   steps:[["Trigger","Receipts are uploaded"],["Find","Vendor, date, amount and VAT"],["Check","Suggest a match to a card line (simulated)"],["Approval","Emma Walsh reviews; exceptions to the accountant","gate"],["Update","Mark the suggestion, never post to QuickBooks"]],
   runs:[["Yesterday 22:10","48s","partial","11 receipts","€0.04","3 exceptions routed for review"],["1 Nov 21:30","41s","ok","9 receipts","€0.03"]]},
  {id:"o9", name:"Weekly capacity plan", kind:"report", owner:"Project Delivery", ownerKind:"agent", initials:"PD",
   trigger:"Mondays, 07:05", triggerKind:"schedule", next:"Mon 23 Nov 07:05", last:"Dara at 118%", status:"approval", rate:97, on:true,
   what:"Plans the next two weeks of billable time against milestones and site visits, and proposes reallocations.",
   why:"Over-allocation only showed up when a deadline slipped.",
   saved:"4 hours a month",
   steps:[["Trigger","Every Monday at 07:05"],["Find","Milestones, visits and remaining budget hours"],["Check","Capacity per person"],["Draft","Proposed reallocations"],["Approval","Aoife Brennan reviews","gate"]],
   runs:[["Today 07:05","16s","partial","9 people","€0.02","1 reallocation awaiting approval"],["Mon 9 Nov 07:05","14s","ok","9 people","€0.02"]]},
  {id:"o10", name:"QuickBooks read sync", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Hourly", triggerKind:"schedule", next:"10:00", last:"12 bank lines read", status:"healthy", rate:100, on:true,
   what:"Reads invoices, payments and bank lines from QuickBooks Online (simulated). Read only.",
   why:"Debtor figures in Pulse should never drift from the ledger.",
   saved:"3 hours a month",
   steps:[["Trigger","Every hour"],["Find","New invoices, payments and bank lines"],["Update","Refresh debtors and the expense queue"]],
   runs:[["Today 09:00","3s","ok","2 lines","€0.00"],["Today 08:00","3s","ok","0 lines","€0.00"],["Today 06:02","4s","ok","12 lines","€0.00"]]},
  {id:"o11", name:"Monday.com sync", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Every 15 minutes", triggerKind:"schedule", next:"09:15", last:"Retried after rate limit", status:"failed", rate:93, on:true,
   what:"Keeps project boards and items in step with Pulse projects, milestones and tasks (simulated).",
   why:"Delivery status lived only in Monday.com, away from the client and finance records.",
   saved:"6 hours a month",
   steps:[["Trigger","Every 15 minutes"],["Find","Changed boards and items"],["Update","Projects, milestones and tasks"]],
   runs:[["Sat 06:50","5s","ok","1 board","€0.00"],["Sat 06:45","3s","failed","0 of 1","€0.00","429 rate limit on board GG-249; retried at 06:50"]]},
  {id:"o12", name:"LinkedIn content drafts", kind:"task", owner:"Sales & Outreach", ownerKind:"agent", initials:"SO",
   trigger:"Thursdays, 12:00", triggerKind:"schedule", next:"Paused", last:"LI-21 waiting on Niall", status:"approval", rate:100, on:false,
   what:"Drafts next week's posts from recent findings and articles. Proposed integration: nothing is posted.",
   why:"Posting was irregular because nobody had time to write.",
   saved:"3 hours a month",
   steps:[["Trigger","Every Thursday at 12:00"],["Find","Recent findings and wins (anonymised)"],["Draft","Two or three posts"],["Approval","Niall Kiernan approves","gate"]],
   runs:[["Fri 13 Nov 12:00","9s","ok","1 draft","€0.01"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Every task across sales, delivery and finance, with owner, client and project. Status changes stay in this demo.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any due date"]},
  {id:"approvals", label:"Approvals", blurb:"What the agents have prepared and are waiting on a person to approve. Nothing is sent, posted or reconciled from here.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"Automations and agent routines: what runs on its own, who owns it, and where a person signs off.",
   views:[], filters:[]},
  {id:"schedules", label:"Calendar", blurb:"The team calendar: site visits, meetings and when recurring work fires.",
   views:[], filters:[]}
];

const WORK_TASKS = [
  {id:"w1", title:"Chase INV-1048 — Westhaven Retail Parks", status:"In progress", priority:"High", who:"AN",
   due:"2d overdue", late:true, client:"Westhaven Retail Parks", day:"Today", mins:"25 mins", view:"Due tasks"},
  {id:"w2", title:"Reassign the Omagh pool car jobs off Carrick-on-Shannon", status:"In progress", priority:"High", who:"MK",
   due:"Due today", late:false, client:"Carrick-on-Shannon office", day:"Today", mins:"50 mins", view:"Due tasks"},
  {id:"w3", title:"Approve purchase order EXP-OCT-11", status:"Review", priority:"Medium", who:"MK",
   due:"Due 12:00", late:false, client:"Tighe Ecology", day:"Today", mins:"15 mins", view:"Review"},
  {id:"w4", title:"Sign off August counter stocktake", status:"Not started", priority:"Medium", who:"SB",
   due:"No due date", late:false, client:"Head office", day:"Any day", mins:"Mins", view:"All tasks"},
  {id:"w5", title:"Carrick-on-Shannon lease decision", status:"Not started", priority:"High", who:"MK",
   due:"Thursday", late:false, client:"Carrick-on-Shannon office", day:"Thu", mins:"1 hour", view:"All tasks"},
  {id:"w6", title:"VAT return — August", status:"Done", priority:"Medium", who:"AN",
   due:"Filed Friday", late:false, client:"Head office", day:"Fri", mins:"2 hours", view:"Done", done:true}
];

const WORKFLOWS = [
  {name:"Overdue invoice reminder", state:"live", trigger:"schedule · daily 08:00",
   actions:[["notify.email","write"],["tasks.create","write"]], lastRun:"Today 08:00",
   result:"6 of 10 sent · partial", resultKind:"warn", runSummary:"11 ok · 3 partial",
   runs:["ok","ok","partial","ok","ok","ok","partial","ok","ok","ok","ok","ok","partial","partial"]},
  {name:"Approval routing over €10k", state:"live", trigger:"event · core.approval.created",
   actions:[["approvals.route","read"],["notify.inbox","write"]], lastRun:"Today 08:54",
   result:"ok", resultKind:"ok", runSummary:"14 ok",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok"]},
  {name:"Unassigned visit escalation", state:"live", trigger:"event · site-visits.visit.created",
   actions:[["notify.inbox","write"]], lastRun:"Today 07:00",
   result:"ok", resultKind:"ok", runSummary:"9 ok · 1 failed",
   runs:["idle","idle","ok","ok","failed","ok","ok","ok","idle","ok","ok","ok","ok","ok"]},
  {name:"QuickBooks invoice sync", state:"failing", trigger:"schedule · hourly",
   actions:[["quickbooks.read","external"]], lastRun:"Today 02:14",
   result:"invalid_grant · dead-lettered", resultKind:"bad", runSummary:"4 failed",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","failed","failed","failed","failed"]}
];

const SCHEDULES = [
  {id:"s1", name:"Morning briefing", cadence:"Every weekday · 07:00", next:"Tomorrow 07:00", owner:"Briefing agent", on:true, day:1},
  {id:"s2", name:"Overdue invoice reminder", cadence:"Daily · 08:00", next:"Tomorrow 08:00", owner:"Credit Control", on:true, day:1},
  {id:"s3", name:"QuickBooks invoice sync", cadence:"Hourly", next:"Paused", owner:"Ops Watchdog", on:false, day:0},
  {id:"s4", name:"Weekly stock check", cadence:"Thursdays · 09:00", next:"Thu 09:00", owner:"Stock Watch", on:true, day:3},
  {id:"s5", name:"Month-end close", cadence:"Last working day · 17:00", next:"Fri 17:00", owner:"Month-end close", on:true, day:4}
];

const WIDGET_DEFS = [["brief","Morning briefing"],["health","Business health"],["priorities","Today's priorities"],["visits","Site assessments"],["approvals","Approvals"],["ai","Handled by agents"]];
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"8", hint:"assigned to you", icon:"work", queue:"mine"},
  {id:"late", label:"Running late", value:"11", hint:"past their due date", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Unassigned", value:"1", hint:"nobody owns it yet", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"4", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted —
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Clients","records","Organisations, health and lifetime value"],
  ["Contacts","records","Client, prospect and partner contacts"],
  ["Files","records","Indexed documents, surveys and drawings"],
  ["Projects","work","Fees, teams, milestones and status"],
  ["Site visits","work","Bookings, engineers and checklists"],
  ["Evidence","work","Meter data, surveys and photos"],
  ["Reports","work","Pipeline stage, reviewer and version"],
  ["Opportunities","money","Pipeline, proposals and meetings"],
  ["Invoices","money","Issued, paid and overdue (read only)"],
  ["Expenses","money","Receipts and suggested matches"],
  ["Activity log","system","Every event, agent and human"],
  ["Approvals","system","What is waiting on a person"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read invoices","read"],
  ["Read site visits","read"],["Check report completeness","read"],
  ["Draft email","write"],["Create task","write"],["Update record","write"],
  ["Propose visit reschedule","write"],["Raise approval","write"],
  ["Send email","external"],["Post to LinkedIn","external"],["Write to QuickBooks","external"],["Update OnePageCRM","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "2,140 records"],
  ["Learning how Global Green words things", "organisation → client"],
  ["Researching energy and environmental consultancy", "14 sources"],
  ["Writing its own system prompt", "1,180 tokens"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like — we can refine later.",
   options:[["Calendar","Meetings and what is coming up"],["Email","Unread and actionable inbox items"],
            ["Records","Accounts that moved since yesterday"],["Money","Cash, overdue and anything at risk"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Every morning 07:30","Before the yard opens"],["Weekdays 08:00","Monday to Friday only"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Pebble"],["executive-capsule","Executive"],["shield","Shield"],
  ["glass-visor","Visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only, deliberately desaturated so none of them reads as a
   state. Each is a pair: the deep shell for light themes and its pale partner
   for dark ones (the eyes take the other). The status light carries the state. */
const FACE_TINTS = [
  ["#191c1f","Graphite","#e3e6e8"],["#1b2430","Slate","#d3dde9"],["#241b2e","Aubergine","#ddd4ea"],
  ["#2a2118","Bronze","#eadccb"],["#16241f","Pine","#d1e4da"],["#2b1b1e","Oxblood","#eed5d7"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Clients",          "#b6e070", 0.00, 0.62, 46],
  ["Contacts",         "#6ad0f0", 0.90, 0.70, 52],
  ["Projects",         "#45c992", 1.75, 0.66, 58],
  ["Tasks",            "#f0c04b", 2.55, 0.72, 44],
  ["Invoices",         "#f0567f", 3.35, 0.60, 38],
  ["Site assessments", "#4fb0d4", 4.15, 0.70, 40],
  ["Evidence",         "#f0803a", 4.95, 0.64, 30],
  ["Reports",          "#9d8cf5", 5.65, 0.72, 34]
];

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
