import React, { useState, useCallback, createContext, useContext, useEffect, useRef } from "react";

// ─── Responsive Hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ─── Theme Definitions ────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    name: "Accessibility Dark",
    description: "High-contrast dark theme optimized for color accessibility",
    // Backgrounds
    appBg: "#060b14",
    sidebarBg: "#0a1628",
    cardBg: "#0a1628",
    cardBg2: "#0d1b2a",
    inputBg: "#0f172a",
    headerBg: "#0a1628",
    tableBg: "#0a1628",
    tableRowHover: "#0d1b2a",
    modalBg: "#0d1b2a",
    // Borders
    border: "#1e293b",
    borderStrong: "#334155",
    // Text
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    // Accent
    accent: "#06b6d4",
    accentBg: "rgba(6,182,212,0.1)",
    accentBgHover: "rgba(6,182,212,0.2)",
    // Status colors
    success: "#22c55e",
    successBg: "#052e16",
    successBorder: "#16a34a",
    warning: "#f59e0b",
    warningBg: "#1c1200",
    warningBorder: "#f59e0b44",
    danger: "#ef4444",
    dangerBg: "#1c0002",
    dangerBorder: "#ef444433",
    dangerText: "#fca5a5",
    warningText: "#fcd34d",
    successText: "#86efac",
    // Nav
    navActive: "rgba(6,182,212,0.12)",
    navActiveText: "#06b6d4",
    navText: "#94a3b8",
    // Chip
    chipBg: "#1e293b",
    chipText: "#94a3b8",
    // Score ring bg
    scoreRingBg: "#052e16",
    scoreRingBgMod: "#451a03",
    scoreRingBgHigh: "#1c0002",
    // Section title
    sectionTitle: "#64748b",
    // Toast
    toastBg: "#052e16",
    toastBorder: "#16a34a",
    // Button
    btnPrimary: "#06b6d4",
    btnPrimaryText: "#000",
    btnSecondaryBg: "transparent",
    btnSecondaryBorder: "#334155",
    btnSecondaryText: "#94a3b8",
  },
  light: {
    name: "Clinical Light",
    description: "Clean white theme designed for medical professionals",
    // Backgrounds
    appBg: "#f0f4f8",
    sidebarBg: "#ffffff",
    cardBg: "#ffffff",
    cardBg2: "#f8fafc",
    inputBg: "#f8fafc",
    headerBg: "#ffffff",
    tableBg: "#ffffff",
    tableRowHover: "#f0f9ff",
    modalBg: "#ffffff",
    // Borders
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    // Text
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    // Accent
    accent: "#0369a1",
    accentBg: "rgba(3,105,161,0.08)",
    accentBgHover: "rgba(3,105,161,0.14)",
    // Status colors
    success: "#16a34a",
    successBg: "#f0fdf4",
    successBorder: "#86efac",
    warning: "#d97706",
    warningBg: "#fffbeb",
    warningBorder: "#fde68a",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
    dangerBorder: "#fecaca",
    dangerText: "#dc2626",
    warningText: "#b45309",
    successText: "#15803d",
    // Nav
    navActive: "rgba(3,105,161,0.08)",
    navActiveText: "#0369a1",
    navText: "#64748b",
    // Chip
    chipBg: "#f1f5f9",
    chipText: "#475569",
    // Score ring bg
    scoreRingBg: "#f0fdf4",
    scoreRingBgMod: "#fffbeb",
    scoreRingBgHigh: "#fef2f2",
    // Section title
    sectionTitle: "#64748b",
    // Toast
    toastBg: "#f0fdf4",
    toastBorder: "#86efac",
    // Button
    btnPrimary: "#0369a1",
    btnPrimaryText: "#ffffff",
    btnSecondaryBg: "#ffffff",
    btnSecondaryBorder: "#e2e8f0",
    btnSecondaryText: "#475569",
  },
};

const ThemeContext = createContext(THEMES.dark);
function useTheme() { return useContext(ThemeContext); }
const MobileContext = createContext(false);
function useIsMobileCtx() { return useContext(MobileContext); }

// ─── Audit Log ────────────────────────────────────────────────────────────────
const auditLog = [];
function logAudit(user, action, detail) {
  auditLog.unshift({ id: Date.now() + Math.random(), timestamp: new Date().toISOString(), user, action, detail });
}

// ─── Shared Symptom Store (simulates cross-app sync) ──────────────────────────
// In production this would be a real-time database. Here we use a module-level
// array so both the web app and a simulated mobile submission can share state.
const symptomStore = {
  entries: [],
  listeners: [],
  add(entry) {
    this.entries.unshift(entry);
    this.listeners.forEach(fn => fn([...this.entries]));
  },
  subscribe(fn) { this.listeners.push(fn); },
  unsubscribe(fn) { this.listeners = this.listeners.filter(l => l !== fn); },
};

const SEVERE_SYMPTOMS = ["Chest pain", "Shortness of breath", "Confusion", "Seizure", "Loss of consciousness", "Severe rash"];


const HIGH_RISK_DRUGS = ["Warfarin", "Digoxin", "Amiodarone", "Methotrexate", "Lithium", "Opioids"];
const INTERACTION_PAIRS = [
  ["Warfarin", "Aspirin"], ["Warfarin", "Ibuprofen"], ["Metformin", "Contrast Dye"],
  ["Lisinopril", "Potassium"], ["Digoxin", "Amiodarone"], ["Lithium", "Ibuprofen"],
];

function computeScore(medications, age) {
  let score = 0; const flags = []; const count = medications.length;
  if (count >= 10) { score += 30; flags.push({ type:"HIGH_POLY", sev:"high", msg:`${count} medications — high polypharmacy risk (≥10)` }); }
  else if (count >= 5) { score += 15; flags.push({ type:"POLY", sev:"moderate", msg:`${count} medications — polypharmacy risk (≥5)` }); }
  else score += count * 2;
  const names = medications.map(m => m.name);
  let intCount = 0;
  INTERACTION_PAIRS.forEach(([a, b]) => { if (names.includes(a) && names.includes(b)) { intCount++; flags.push({ type:"INTERACTION", sev:"high", msg:`Drug interaction: ${a} + ${b}` }); } });
  score += Math.min(intCount * 10, 30);
  const highRisk = medications.filter(m => HIGH_RISK_DRUGS.includes(m.name));
  if (age >= 65 && highRisk.length > 0) { score += highRisk.length * 7; highRisk.forEach(m => flags.push({ type:"GERI_RISK", sev:"high", msg:`Geriatric safety warning: ${m.name} for patient age ${age}` })); }
  const missedCount = medications.reduce((s, m) => s + (m.missedDoses || 0), 0);
  if (missedCount >= 3) { score += 10; flags.push({ type:"ADHERENCE", sev:"moderate", msg:`${missedCount} missed doses in last 7 days` }); }
  const classes = medications.map(m => m.class).filter(Boolean);
  const seen = new Set();
  classes.forEach(c => { if (seen.has(c)) { score += 5; flags.push({ type:"DUPLICATE", sev:"moderate", msg:`Duplicate therapy class: ${c}` }); } seen.add(c); });
  return { score: Math.min(100, Math.round(score)), flags };
}

const INITIAL_CASES = [
  {
    id:"C001", name:"Eleanor Whitmore", age:78, dob:"1946-03-14", mrn:"MRN-4421",
    conditions:["Type 2 Diabetes","Hypertension","AFib","Osteoporosis"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2024-11-20",
    medications:[
      { id:"m1", name:"Warfarin", dose:"5mg", frequency:"Daily", class:"Anticoagulant", missedDoses:1, startDate:"2022-01-10" },
      { id:"m2", name:"Metformin", dose:"1000mg", frequency:"Twice daily", class:"Antidiabetic", missedDoses:0, startDate:"2019-05-01" },
      { id:"m3", name:"Lisinopril", dose:"10mg", frequency:"Daily", class:"ACE Inhibitor", missedDoses:2, startDate:"2020-03-15" },
      { id:"m4", name:"Aspirin", dose:"81mg", frequency:"Daily", class:"Antiplatelet", missedDoses:0, startDate:"2021-06-01" },
      { id:"m5", name:"Atorvastatin", dose:"40mg", frequency:"Daily", class:"Statin", missedDoses:1, startDate:"2020-01-01" },
      { id:"m6", name:"Alendronate", dose:"70mg", frequency:"Weekly", class:"Bisphosphonate", missedDoses:0, startDate:"2023-02-01" },
      { id:"m7", name:"Potassium", dose:"20mEq", frequency:"Daily", class:"Supplement", missedDoses:3, startDate:"2022-08-01" },
    ],
    recommendations:[
      { id:"r1", drug:"Aspirin", action:"Deprescribe", reason:"High bleeding risk with Warfarin co-administration. Evidence suggests net harm in elderly AFib patients.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-02-10" },
    ],
    notes:[],
  },
  {
    id:"C002", name:"Harold Bergstrom", age:71, dob:"1953-07-22", mrn:"MRN-3309",
    conditions:["COPD","Depression","Hypertension"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2025-01-05",
    medications:[
      { id:"m8", name:"Tiotropium", dose:"18mcg", frequency:"Daily", class:"Bronchodilator", missedDoses:0, startDate:"2021-09-01" },
      { id:"m9", name:"Sertraline", dose:"50mg", frequency:"Daily", class:"SSRI", missedDoses:0, startDate:"2022-04-01" },
      { id:"m10", name:"Amlodipine", dose:"5mg", frequency:"Daily", class:"CCB", missedDoses:0, startDate:"2020-11-01" },
    ],
    recommendations:[], notes:[],
  },
  {
    id:"C003", name:"Dorothy Kessler", age:83, dob:"1942-08-30", mrn:"MRN-5587",
    conditions:["Heart Failure","Type 2 Diabetes","CKD Stage 3","Hypothyroidism","Anemia"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2024-09-14",
    medications:[
      { id:"c3m1", name:"Digoxin", dose:"0.125mg", frequency:"Daily", class:"Cardiac Glycoside", missedDoses:2, startDate:"2020-06-01" },
      { id:"c3m2", name:"Furosemide", dose:"40mg", frequency:"Twice daily", class:"Diuretic", missedDoses:1, startDate:"2020-06-01" },
      { id:"c3m3", name:"Metformin", dose:"500mg", frequency:"Daily", class:"Antidiabetic", missedDoses:0, startDate:"2018-03-10" },
      { id:"c3m4", name:"Levothyroxine", dose:"75mcg", frequency:"Daily", class:"Thyroid Agent", missedDoses:0, startDate:"2016-11-20" },
      { id:"c3m5", name:"Epoetin Alfa", dose:"4000 units", frequency:"Weekly", class:"Other", missedDoses:0, startDate:"2023-01-15" },
      { id:"c3m6", name:"Carvedilol", dose:"6.25mg", frequency:"Twice daily", class:"Beta Blocker", missedDoses:3, startDate:"2021-02-01" },
      { id:"c3m7", name:"Spironolactone", dose:"25mg", frequency:"Daily", class:"Diuretic", missedDoses:0, startDate:"2021-02-01" },
      { id:"c3m8", name:"Atorvastatin", dose:"20mg", frequency:"Daily", class:"Statin", missedDoses:2, startDate:"2019-07-01" },
      { id:"c3m9", name:"Aspirin", dose:"81mg", frequency:"Daily", class:"Antiplatelet", missedDoses:0, startDate:"2020-06-01" },
      { id:"c3m10", name:"Ferrous Sulfate", dose:"325mg", frequency:"Twice daily", class:"Supplement", missedDoses:4, startDate:"2023-03-01" },
      { id:"c3m11", name:"Omeprazole", dose:"20mg", frequency:"Daily", class:"Other", missedDoses:0, startDate:"2022-05-01" },
    ],
    recommendations:[
      { id:"c3r1", drug:"Metformin", action:"Dose Reduction", reason:"CKD Stage 3 with eGFR trending downward. Current 500mg dose may require reduction or discontinuation per renal dosing guidelines.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-01-28" },
      { id:"c3r2", drug:"Spironolactone", action:"Monitor", reason:"Dual diuretic therapy with Furosemide. Monitor potassium closely — hyperkalemia risk elevated in CKD.", proposedBy:"Pharm. Chen", status:"approved", approvedBy:"Dr. Patel", approvedAt:"2025-02-01" },
    ],
    notes:[],
  },
  {
    id:"C004", name:"Raymond Okafor", age:67, dob:"1957-12-05", mrn:"MRN-6612",
    conditions:["Hypertension","Hyperlipidemia","Gout","Insomnia"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"James Cooper",
    status:"active", lastReview:"2025-01-18",
    medications:[
      { id:"c4m1", name:"Losartan", dose:"100mg", frequency:"Daily", class:"ARB", missedDoses:0, startDate:"2019-04-01" },
      { id:"c4m2", name:"Hydrochlorothiazide", dose:"25mg", frequency:"Daily", class:"Diuretic", missedDoses:0, startDate:"2019-04-01" },
      { id:"c4m3", name:"Rosuvastatin", dose:"20mg", frequency:"Daily", class:"Statin", missedDoses:1, startDate:"2020-08-01" },
      { id:"c4m4", name:"Allopurinol", dose:"300mg", frequency:"Daily", class:"Other", missedDoses:0, startDate:"2021-03-15" },
      { id:"c4m5", name:"Zolpidem", dose:"10mg", frequency:"As needed", class:"Other", missedDoses:0, startDate:"2022-11-01" },
    ],
    recommendations:[
      { id:"c4r1", drug:"Zolpidem", action:"Deprescribe", reason:"Zolpidem in patients over 65 is on the Beers Criteria for potentially inappropriate medications. Associated with fall risk, cognitive impairment, and dependency. Recommend trial of cognitive behavioral therapy for insomnia (CBT-I) first.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-02-05" },
    ],
    notes:[],
  },
  {
    id:"C005", name:"Margaret Tran", age:74, dob:"1950-05-18", mrn:"MRN-7734",
    conditions:["Parkinson's Disease","Osteoarthritis","Hypertension","Anxiety"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2025-02-01",
    medications:[
      { id:"c5m1", name:"Levodopa/Carbidopa", dose:"25/100mg", frequency:"Three times daily", class:"Other", missedDoses:0, startDate:"2021-06-01" },
      { id:"c5m2", name:"Ropinirole", dose:"2mg", frequency:"Three times daily", class:"Other", missedDoses:1, startDate:"2022-01-01" },
      { id:"c5m3", name:"Lisinopril", dose:"5mg", frequency:"Daily", class:"ACE Inhibitor", missedDoses:0, startDate:"2018-09-01" },
      { id:"c5m4", name:"Ibuprofen", dose:"400mg", frequency:"As needed", class:"NSAID", missedDoses:0, startDate:"2023-04-01" },
      { id:"c5m5", name:"Lorazepam", dose:"0.5mg", frequency:"As needed", class:"Benzodiazepine", missedDoses:0, startDate:"2022-08-15" },
    ],
    recommendations:[
      { id:"c5r1", drug:"Ibuprofen", action:"Substitute", reason:"NSAIDs worsen hypertension and increase fall risk in Parkinson's patients. Recommend acetaminophen as safer alternative for osteoarthritis pain.", proposedBy:"Pharm. Chen", status:"approved", approvedBy:"Dr. Patel", approvedAt:"2025-02-03" },
    ],
    notes:[],
  },
  {
    id:"C006", name:"Walter Simmons", age:69, dob:"1955-02-27", mrn:"MRN-8821",
    conditions:["Type 2 Diabetes","CAD","Hypertension","Depression","Sleep Apnea"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"James Cooper",
    status:"active", lastReview:"2024-12-10",
    medications:[
      { id:"c6m1", name:"Metformin", dose:"1000mg", frequency:"Twice daily", class:"Antidiabetic", missedDoses:0, startDate:"2017-03-01" },
      { id:"c6m2", name:"Glipizide", dose:"10mg", frequency:"Twice daily", class:"Antidiabetic", missedDoses:2, startDate:"2020-01-01" },
      { id:"c6m3", name:"Aspirin", dose:"81mg", frequency:"Daily", class:"Antiplatelet", missedDoses:0, startDate:"2018-06-01" },
      { id:"c6m4", name:"Metoprolol", dose:"50mg", frequency:"Twice daily", class:"Beta Blocker", missedDoses:1, startDate:"2018-06-01" },
      { id:"c6m5", name:"Lisinopril", dose:"20mg", frequency:"Daily", class:"ACE Inhibitor", missedDoses:0, startDate:"2018-06-01" },
      { id:"c6m6", name:"Sertraline", dose:"100mg", frequency:"Daily", class:"SSRI", missedDoses:3, startDate:"2021-09-01" },
      { id:"c6m7", name:"Atorvastatin", dose:"80mg", frequency:"Daily", class:"Statin", missedDoses:0, startDate:"2018-06-01" },
    ],
    recommendations:[
      { id:"c6r1", drug:"Glipizide", action:"Deprescribe", reason:"Duplicate antidiabetic therapy with Metformin. Glipizide carries hypoglycemia risk especially with poor adherence. Consider replacing with SGLT2 inhibitor for added cardiovascular benefit.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-02-12" },
    ],
    notes:[],
  },
  {
    id:"C007", name:"Beverly Nguyen", age:66, dob:"1958-10-03", mrn:"MRN-9043",
    conditions:["Rheumatoid Arthritis","Osteoporosis","GERD"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2025-02-10",
    medications:[
      { id:"c7m1", name:"Methotrexate", dose:"15mg", frequency:"Weekly", class:"Other", missedDoses:0, startDate:"2020-04-01" },
      { id:"c7m2", name:"Folic Acid", dose:"1mg", frequency:"Daily", class:"Supplement", missedDoses:1, startDate:"2020-04-01" },
      { id:"c7m3", name:"Prednisone", dose:"5mg", frequency:"Daily", class:"Corticosteroid", missedDoses:0, startDate:"2022-11-01" },
      { id:"c7m4", name:"Alendronate", dose:"70mg", frequency:"Weekly", class:"Bisphosphonate", missedDoses:0, startDate:"2021-06-01" },
      { id:"c7m5", name:"Omeprazole", dose:"40mg", frequency:"Daily", class:"Other", missedDoses:0, startDate:"2020-04-01" },
      { id:"c7m6", name:"Calcium Carbonate", dose:"500mg", frequency:"Twice daily", class:"Supplement", missedDoses:2, startDate:"2021-06-01" },
    ],
    recommendations:[
      { id:"c7r1", drug:"Prednisone", action:"Dose Reduction", reason:"Long-term corticosteroid use accelerates bone loss. With concurrent Methotrexate achieving disease control, consider tapering to lowest effective dose or discontinuation.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-02-08" },
    ],
    notes:[],
  },
  {
    id:"C008", name:"Frank Deluca", age:80, dob:"1944-07-11", mrn:"MRN-1156",
    conditions:["Dementia","Hypertension","BPH","Urinary Incontinence"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"James Cooper",
    status:"active", lastReview:"2024-10-30",
    medications:[
      { id:"c8m1", name:"Donepezil", dose:"10mg", frequency:"Daily", class:"Other", missedDoses:2, startDate:"2022-03-01" },
      { id:"c8m2", name:"Memantine", dose:"10mg", frequency:"Twice daily", class:"Other", missedDoses:3, startDate:"2023-01-01" },
      { id:"c8m3", name:"Amlodipine", dose:"10mg", frequency:"Daily", class:"CCB", missedDoses:1, startDate:"2019-08-01" },
      { id:"c8m4", name:"Tamsulosin", dose:"0.4mg", frequency:"Daily", class:"Other", missedDoses:0, startDate:"2020-05-01" },
      { id:"c8m5", name:"Oxybutynin", dose:"5mg", frequency:"Twice daily", class:"Other", missedDoses:0, startDate:"2021-10-01" },
      { id:"c8m6", name:"Lorazepam", dose:"1mg", frequency:"As needed", class:"Benzodiazepine", missedDoses:0, startDate:"2022-06-01" },
    ],
    recommendations:[
      { id:"c8r1", drug:"Oxybutynin", action:"Deprescribe", reason:"Anticholinergic medication contraindicated in dementia patients. Significantly worsens cognitive function. Recommend behavioral interventions or safer alternatives such as mirabegron.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-01-15" },
      { id:"c8r2", drug:"Lorazepam", action:"Deprescribe", reason:"Benzodiazepines in dementia patients increase fall risk, sedation, and paradoxical agitation. Beers Criteria strongly recommends avoidance.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-01-15" },
    ],
    notes:[],
  },
  {
    id:"C009", name:"Ruth Nakamura", age:72, dob:"1952-04-22", mrn:"MRN-2278",
    conditions:["Hypertension","Hyperlipidemia"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2025-01-30",
    medications:[
      { id:"c9m1", name:"Amlodipine", dose:"5mg", frequency:"Daily", class:"CCB", missedDoses:0, startDate:"2021-02-01" },
      { id:"c9m2", name:"Rosuvastatin", dose:"10mg", frequency:"Daily", class:"Statin", missedDoses:0, startDate:"2021-02-01" },
    ],
    recommendations:[], notes:[],
  },
  {
    id:"C010", name:"George Fitzpatrick", age:75, dob:"1949-11-14", mrn:"MRN-3392",
    conditions:["AFib","Heart Failure","CKD Stage 2","Type 2 Diabetes","Hypertension","Hyperlipidemia"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"James Cooper",
    status:"active", lastReview:"2024-08-22",
    medications:[
      { id:"c10m1", name:"Amiodarone", dose:"200mg", frequency:"Daily", class:"Antiarrhythmic", missedDoses:0, startDate:"2021-11-01" },
      { id:"c10m2", name:"Warfarin", dose:"7.5mg", frequency:"Daily", class:"Anticoagulant", missedDoses:1, startDate:"2021-11-01" },
      { id:"c10m3", name:"Digoxin", dose:"0.125mg", frequency:"Daily", class:"Cardiac Glycoside", missedDoses:0, startDate:"2022-03-01" },
      { id:"c10m4", name:"Furosemide", dose:"80mg", frequency:"Daily", class:"Diuretic", missedDoses:2, startDate:"2021-11-01" },
      { id:"c10m5", name:"Lisinopril", dose:"10mg", frequency:"Daily", class:"ACE Inhibitor", missedDoses:0, startDate:"2021-11-01" },
      { id:"c10m6", name:"Metformin", dose:"500mg", frequency:"Daily", class:"Antidiabetic", missedDoses:1, startDate:"2018-04-01" },
      { id:"c10m7", name:"Atorvastatin", dose:"40mg", frequency:"Daily", class:"Statin", missedDoses:0, startDate:"2019-01-01" },
      { id:"c10m8", name:"Aspirin", dose:"81mg", frequency:"Daily", class:"Antiplatelet", missedDoses:0, startDate:"2021-11-01" },
      { id:"c10m9", name:"Potassium", dose:"20mEq", frequency:"Daily", class:"Supplement", missedDoses:3, startDate:"2021-11-01" },
      { id:"c10m10", name:"Spironolactone", dose:"25mg", frequency:"Daily", class:"Diuretic", missedDoses:0, startDate:"2022-06-01" },
    ],
    recommendations:[
      { id:"c10r1", drug:"Amiodarone", action:"Monitor", reason:"Amiodarone + Digoxin interaction increases Digoxin toxicity risk. Recommend Digoxin level monitoring every 3 months and dose adjustment if levels exceed therapeutic range.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-02-14" },
      { id:"c10r2", drug:"Aspirin", action:"Deprescribe", reason:"Warfarin already provides anticoagulation for AFib. Dual therapy adds bleeding risk without demonstrated benefit in this patient profile.", proposedBy:"Pharm. Chen", status:"pending", createdAt:"2025-02-14" },
    ],
    notes:[],
  },
  {
    id:"C011", name:"Sylvia Chambers", age:68, dob:"1956-09-07", mrn:"MRN-4415",
    conditions:["Type 2 Diabetes","Peripheral Neuropathy","Hypertension","Obesity"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills",
    status:"active", lastReview:"2025-01-22",
    medications:[
      { id:"c11m1", name:"Metformin", dose:"1000mg", frequency:"Twice daily", class:"Antidiabetic", missedDoses:0, startDate:"2016-07-01" },
      { id:"c11m2", name:"Gabapentin", dose:"300mg", frequency:"Three times daily", class:"Other", missedDoses:2, startDate:"2021-04-01" },
      { id:"c11m3", name:"Lisinopril", dose:"10mg", frequency:"Daily", class:"ACE Inhibitor", missedDoses:0, startDate:"2019-02-01" },
      { id:"c11m4", name:"Duloxetine", dose:"60mg", frequency:"Daily", class:"SNRI", missedDoses:1, startDate:"2022-08-01" },
      { id:"c11m5", name:"Aspirin", dose:"81mg", frequency:"Daily", class:"Antiplatelet", missedDoses:0, startDate:"2019-02-01" },
    ],
    recommendations:[], notes:[],
  },
  {
    id:"C012", name:"Arthur Pennington", age:77, dob:"1947-03-19", mrn:"MRN-5528",
    conditions:["COPD","Lung Cancer (remission)","Hypertension","Chronic Pain","Depression"],
    physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"James Cooper",
    status:"active", lastReview:"2024-07-15",
    medications:[
      { id:"c12m1", name:"Tiotropium", dose:"18mcg", frequency:"Daily", class:"Bronchodilator", missedDoses:0, startDate:"2019-03-01" },
      { id:"c12m2", name:"Fluticasone/Salmeterol", dose:"250/50mcg", frequency:"Twice daily", class:"Corticosteroid", missedDoses:1, startDate:"2019-03-01" },
      { id:"c12m3", name:"Opioids", dose:"10mg", frequency:"Twice daily", class:"Opioid", missedDoses:0, startDate:"2023-06-01" },
      { id:"c12m4", name:"Amlodipine", dose:"5mg", frequency:"Daily", class:"CCB", missedDoses:0, startDate:"2018-01-01" },
      { id:"c12m5", name:"Mirtazapine", dose:"30mg", frequency:"Daily", class:"Other", missedDoses:2, startDate:"2022-10-01" },
      { id:"c12m6", name:"Pregabalin", dose:"75mg", frequency:"Twice daily", class:"Other", missedDoses:1, startDate:"2023-06-01" },
      { id:"c12m7", name:"Omeprazole", dose:"20mg", frequency:"Daily", class:"Other", missedDoses:0, startDate:"2023-06-01" },
      { id:"c12m8", name:"Naloxone", dose:"4mg", frequency:"As needed", class:"Other", missedDoses:0, startDate:"2023-06-01" },
    ],
    recommendations:[
      { id:"c12r1", drug:"Opioids", action:"Monitor", reason:"Opioid therapy in COPD patient presents respiratory depression risk. Ensure lowest effective dose is maintained. Naloxone co-prescription is appropriate and confirmed.", proposedBy:"Pharm. Chen", status:"approved", approvedBy:"Dr. Patel", approvedAt:"2025-01-10" },
    ],
    notes:[],
  },
];

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, size = "md" }) {
  const t = useTheme();
  const color = score <= 40 ? t.success : score <= 70 ? t.warning : t.danger;
  const bg = score <= 40 ? t.scoreRingBg : score <= 70 ? t.scoreRingBgMod : t.scoreRingBgHigh;
  const label = score <= 40 ? "Low Risk" : score <= 70 ? "Moderate" : "High Risk";
  const dim = size === "lg" ? 88 : 56; const fs = size === "lg" ? 22 : 14;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={dim} height={dim} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="38" fill={bg} stroke={t.border} strokeWidth="2"/>
        <circle cx="44" cy="44" r="38" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${(score/100)*239} 239`} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{transition:"stroke-dasharray 0.8s ease"}}/>
        <text x="44" y="48" textAnchor="middle" fill={color} fontSize={fs} fontWeight="700" fontFamily="monospace">{score}</text>
      </svg>
      <span style={{ fontSize:10, color, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

// ─── Flag Pill ────────────────────────────────────────────────────────────────
function FlagPill({ flag }) {
  const t = useTheme();
  const bg = flag.sev === "high" ? t.dangerBg : t.warningBg;
  const border = flag.sev === "high" ? t.dangerBorder : t.warningBorder;
  const text = flag.sev === "high" ? t.dangerText : t.warningText;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 12px", borderRadius:8, background:bg, border:`1px solid ${border}`, marginBottom:6 }}>
      <span style={{ fontSize:14, marginTop:1 }}>{flag.sev === "high" ? "🔴" : "🟡"}</span>
      <span style={{ fontSize:13, color:text, lineHeight:1.4 }}>{flag.msg}</span>
    </div>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  const t = useTheme();
  return <div style={{ fontSize:12, fontWeight:700, color:t.sectionTitle, letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{children}</div>;
}
function EmptyState({ children }) {
  const t = useTheme();
  return <div style={{ padding:32, textAlign:"center", color:t.textMuted, fontSize:13, background:t.cardBg, border:`1px dashed ${t.border}`, borderRadius:12 }}>{children}</div>;
}
function ActionBtn({ children, onClick, small }) {
  const t = useTheme();
  return (
    <button onClick={onClick} style={{ padding: small ? "5px 12px" : "8px 18px", borderRadius:8, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent,
      fontSize: small ? 12 : 13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", transition:"background 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.background=t.accentBgHover}
      onMouseLeave={e=>e.currentTarget.style.background=t.accentBg}>
      {children}
    </button>
  );
}
function Chip({ children, color, bg }) {
  return <div style={{ padding:"4px 10px", borderRadius:20, background:bg, color, fontSize:12, fontWeight:600, border:`1px solid ${color}33` }}>{children}</div>;
}

// ─── Logo Component (Option A — Descending Pill) ──────────────────────────────
function LogoA({ theme = "dark", size = "sidebar" }) {
  const isLight = theme === "light";
  const capsuleLeft = isLight ? "#0369a1" : "#06b6d4";
  const capsuleRight = isLight ? "#0ea5e9" : "#0e7490";
  const arrowColor = isLight ? "#0369a1" : "#06b6d4";
  const dashColor = isLight ? "#f8fafc" : "#060b14";
  const textPrimary = isLight ? "#0f172a" : "#f1f5f9";

  if (size === "icon") {
    // Small square icon for favicon / tiny use
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill={isLight ? "#f0f9ff" : "#0a1628"}/>
        <g transform="translate(16,16)">
          <path d="M-7 -5 C-7 -8 -5 -10 -2 -10 L0 -10 L0 4 L-2 4 C-5 4 -7 2 -7 -1 Z" fill={capsuleLeft}/>
          <path d="M0 -10 L2 -10 C5 -10 7 -8 7 -5 L7 -1 C7 2 5 4 2 4 L0 4 Z" fill={capsuleRight}/>
          <line x1="0" y1="-9" x2="0" y2="3" stroke={dashColor} strokeWidth="0.8" strokeDasharray="1.5 1.5"/>
        </g>
        <path d="M16 20 L16 24" stroke={arrowColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 22 L16 26 L19 22" stroke={arrowColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    );
  }

  if (size === "sidebar") {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Capsule icon */}
        <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 18 C4 11 8 6 14 6 L18 6 L18 30 L14 30 C8 30 4 25 4 18 Z" fill={capsuleLeft}/>
          <path d="M18 6 L22 6 C28 6 32 11 32 18 C32 25 28 30 22 30 L18 30 Z" fill={capsuleRight}/>
          <line x1="18" y1="6" x2="18" y2="30" stroke={dashColor} strokeWidth="1.5" strokeDasharray="2 2"/>
          <path d="M18 33 L18 39" stroke={arrowColor} strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 36 L18 41 L22 36" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        {/* Wordmark */}
        <div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:16, color:textPrimary, letterSpacing:"-0.5px", lineHeight:1 }}>Less</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:300, fontSize:13, color:arrowColor, letterSpacing:"2px", lineHeight:1, marginTop:2 }}>MEDS</div>
        </div>
      </div>
    );
  }

  // Full horizontal logo for headers etc.
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20 C4 12 9 6 16 6 L20 6 L20 34 L16 34 C9 34 4 28 4 20 Z" fill={capsuleLeft}/>
        <path d="M20 6 L24 6 C31 6 36 12 36 20 C36 28 31 34 24 34 L20 34 Z" fill={capsuleRight}/>
        <line x1="20" y1="6" x2="20" y2="34" stroke={dashColor} strokeWidth="1.5" strokeDasharray="2 2"/>
        <path d="M20 37 L20 43" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M15 40 L20 46 L25 40" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <div>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:20, color:textPrimary, letterSpacing:"-0.5px", lineHeight:1 }}>Less</div>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:300, fontSize:15, color:arrowColor, letterSpacing:"3px", lineHeight:1, marginTop:3 }}>MEDS</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function LessMeds() {
  const [themeName, setThemeName] = useState("dark");
  const theme = THEMES[themeName];
  const [currentUser] = useState({ name:"Dr. Patel", role:"physician", id:"u1" });
  const [cases, setCases] = useState(INITIAL_CASES);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseTab, setCaseTab] = useState("overview");
  const [showNewCase, setShowNewCase] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [symptomEntries, setSymptomEntries] = useState([]);
  const [pharmacistMode, setPharmacistMode] = useState(true);

  // Subscribe to shared symptom store — simulates real-time sync from mobile app
  React.useEffect(() => {
    const handler = (entries) => {
      setSymptomEntries([...entries]);
      const latest = entries[0];
      if (!latest) return;
      const severe = latest.symptoms.filter(s => SEVERE_SYMPTOMS.includes(s));
      if (severe.length > 0) {
        setAlerts(a => { const id = Date.now(); setTimeout(()=>setAlerts(x=>x.filter(v=>v.id!==id)),6000); return [...a,{id, msg:`🚨 ${latest.patientName}: Caregiver reported ${severe.join(', ')}`, type:'error'}]; });
      } else {
        setAlerts(a => { const id = Date.now(); setTimeout(()=>setAlerts(x=>x.filter(v=>v.id!==id)),4000); return [...a,{id, msg:`♥ ${latest.patientName}: New symptom report from caregiver`, type:'info'}]; });
      }
    };
    symptomStore.subscribe(handler);
    return () => symptomStore.unsubscribe(handler);
  }, []);

  const casesWithScores = cases.map(c => {
    const { score, flags } = computeScore(c.medications, c.age);
    const daysSinceReview = c.lastReview ? Math.floor((Date.now() - new Date(c.lastReview)) / 86400000) : 999;
    const reviewFlag = daysSinceReview >= 90 ? [{ type:"REVIEW", sev:"moderate", msg:`No review in ${daysSinceReview} days` }] : [];
    return { ...c, score, flags: [...flags, ...reviewFlag] };
  });

  const selectedCaseData = casesWithScores.find(c => c.id === selectedCase);

  function showAlert(msg, type = "info") {
    const id = Date.now();
    setAlerts(a => [...a, { id, msg, type }]);
    setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 4000);
  }
  function approveRec(caseId, recId) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, recommendations: c.recommendations.map(r => r.id !== recId ? r : { ...r, status:"approved", approvedBy:currentUser.name, approvedAt:new Date().toISOString().slice(0,10) }) }));
    logAudit(currentUser.name, "APPROVE_RECOMMENDATION", `Case ${caseId}, Rec ${recId}`);
    showAlert("Recommendation approved and logged.", "success");
  }
  function rejectRec(caseId, recId) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, recommendations: c.recommendations.map(r => r.id !== recId ? r : { ...r, status:"rejected", rejectedBy:currentUser.name }) }));
    logAudit(currentUser.name, "REJECT_RECOMMENDATION", `Case ${caseId}, Rec ${recId}`);
    showAlert("Recommendation rejected.", "info");
  }
  function addMedication(caseId, med) {
    const newMed = { ...med, id:"m"+Date.now(), missedDoses:0, startDate:new Date().toISOString().slice(0,10) };
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, medications:[...c.medications, newMed] }));
    logAudit(currentUser.name, "ADD_MEDICATION", `${med.name} added to case ${caseId}`);
    showAlert(`${med.name} added to medication list.`, "success");
  }
  function removeMedication(caseId, medId) {
    const med = cases.find(c => c.id === caseId)?.medications.find(m => m.id === medId);
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, medications:c.medications.filter(m => m.id !== medId) }));
    logAudit(currentUser.name, "REMOVE_MEDICATION", `${med?.name} removed from case ${caseId}`);
    showAlert("Medication removed.", "info");
  }
  function editMedication(caseId, updatedMed) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : {
      ...c, medications: c.medications.map(m => m.id !== updatedMed.id ? m : {
        ...m,
        name: updatedMed.name,
        dose: updatedMed.dose,
        frequency: updatedMed.frequency,
        class: updatedMed.class,
      })
    }));
    logAudit(currentUser.name, "EDIT_MEDICATION", `${updatedMed.name} updated in case ${caseId}${updatedMed.changeReason ? " — " + updatedMed.changeReason : ""}`);
    showAlert(`${updatedMed.name} updated successfully.`, "success");
  }
  function addRecommendation(caseId, rec) {
    const newRec = { ...rec, id:"r"+Date.now(), status:"pending", proposedBy:currentUser.name, createdAt:new Date().toISOString().slice(0,10) };
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, recommendations:[...c.recommendations, newRec] }));
    logAudit(currentUser.name, "PROPOSE_RECOMMENDATION", `${rec.action} ${rec.drug} for case ${caseId}`);
    showAlert("Recommendation submitted for physician review.", "success");
  }

  const navItems = [
    { id:"dashboard", label:"Dashboard", icon:"⬡" }, { id:"cases", label:"Cases", icon:"◈" },
    { id:"recommendations", label:"Recommendations", icon:"◎" }, { id:"reports", label:"Reports", icon:"▣" },
    { id:"audit", label:"Audit Log", icon:"◐" }, { id:"settings", label:"Settings", icon:"◍" },
  ];

  const totalHighRisk = casesWithScores.filter(c => c.score >= 71).length;
  const totalPending = casesWithScores.reduce((s, c) => s + c.recommendations.filter(r => r.status === "pending").length, 0);
  const totalFlags = casesWithScores.reduce((s, c) => s + c.flags.filter(f => f.sev === "high").length, 0);
  const t = theme;

  const isMobile = useIsMobile();

  return (
    <MobileContext.Provider value={isMobile}>
    <ThemeContext.Provider value={t}>
      <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", height:"100vh", background:t.appBg, color:t.textPrimary, fontFamily:"'DM Sans', sans-serif", overflow:"hidden" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;700;800&display=swap" rel="stylesheet"/>

        {/* ── Desktop Sidebar (hidden on mobile) ── */}
        {!isMobile && (
          <aside style={{ width:220, background:t.sidebarBg, borderRight:`1px solid ${t.border}`, display:"flex", flexDirection:"column", flexShrink:0, boxShadow: themeName==="light" ? "2px 0 8px rgba(0,0,0,0.06)" : "none" }}>
            <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${t.border}` }}>
              <LogoA theme={themeName} size="sidebar" />
            </div>
            <nav style={{ flex:1, padding:"12px 10px" }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => { setActiveNav(item.id); setSelectedCase(null); }}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2,
                    background: activeNav === item.id ? t.navActive : "transparent",
                    color: activeNav === item.id ? t.navActiveText : t.navText,
                    fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight: activeNav === item.id ? 600 : 400, textAlign:"left" }}>
                  <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
                </button>
              ))}
            </nav>
            <div style={{ padding:"12px 14px", borderTop:`1px solid ${t.border}` }}>
              <div style={{ fontSize:10, color:t.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Theme</div>
              <div style={{ display:"flex", gap:6 }}>
                {Object.entries(THEMES).map(([key, th]) => (
                  <button key={key} onClick={() => setThemeName(key)}
                    style={{ flex:1, padding:"5px 4px", borderRadius:6, border:`1px solid ${themeName===key ? t.accent : t.border}`, background:themeName===key ? t.accentBg : "transparent",
                      color:themeName===key ? t.accent : t.textMuted, fontSize:9, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:0.3 }}>
                    {key === "dark" ? "🌙 Dark" : "☀️ Light"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding:"16px 14px", borderTop:`1px solid ${t.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
                  {currentUser.name.split(" ").map(w=>w[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{currentUser.name}</div>
                  <div style={{ fontSize:11, color:t.textMuted, textTransform:"capitalize" }}>{currentUser.role}</div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── Main content area ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", paddingBottom: isMobile ? 64 : 0 }}>

          {/* Mobile top bar */}
          {isMobile && (
            <header style={{ height:52, background:t.headerBg, borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", padding:"0 16px", gap:10, flexShrink:0 }}>
              <LogoA theme={themeName} size="sidebar" />
              <div style={{ flex:1 }}/>
              {totalHighRisk > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:t.dangerBg, color:t.dangerText, fontWeight:700 }}>🔴 {totalHighRisk}</span>}
              {totalPending > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:t.warningBg, color:t.warningText, fontWeight:700 }}>⏳ {totalPending}</span>}
            </header>
          )}

          {/* Desktop top bar */}
          {!isMobile && (
            <header style={{ height:56, background:t.headerBg, borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:12, flexShrink:0, boxShadow: themeName==="light" ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>
              <div style={{ flex:1, fontSize:16, fontWeight:600, color:t.textPrimary }}>
                {selectedCase ? `Case: ${selectedCaseData?.name}` : navItems.find(n=>n.id===activeNav)?.label}
              </div>
              {totalHighRisk > 0 && <Chip color={t.danger} bg={t.dangerBg}>{totalHighRisk} High Risk</Chip>}
              {totalPending > 0 && <Chip color={t.warning} bg={t.warningBg}>{totalPending} Pending</Chip>}
              {totalFlags > 0 && <Chip color={t.danger} bg={t.dangerBg}>🔴 {totalFlags} Critical</Chip>}
            </header>
          )}

          <div style={{ flex:1, overflowY:"auto", padding: isMobile ? 14 : 24 }}>
            {activeNav==="dashboard" && !selectedCase && <Dashboard cases={casesWithScores} symptomEntries={symptomEntries} onSelect={id=>{setSelectedCase(id);setActiveNav("cases");setCaseTab("overview");}} />}
            {activeNav==="cases" && !selectedCase && <CasesList cases={casesWithScores} onSelect={id=>{setSelectedCase(id);setCaseTab("overview");}} onNew={()=>setShowNewCase(true)} />}
            {activeNav==="cases" && selectedCase && selectedCaseData && (
              <CaseDetail caseData={selectedCaseData} symptomEntries={symptomEntries} pharmacistMode={pharmacistMode} tab={caseTab} setTab={setCaseTab} onBack={()=>setSelectedCase(null)}
                onApprove={(rid)=>approveRec(selectedCase,rid)} onReject={(rid)=>rejectRec(selectedCase,rid)}
                onAddMed={med=>addMedication(selectedCase,med)} onRemoveMed={mid=>removeMedication(selectedCase,mid)}
                onEditMed={med=>editMedication(selectedCase,med)}
                onAddRec={rec=>addRecommendation(selectedCase,rec)} currentUser={currentUser} />
            )}
            {activeNav==="recommendations" && <AllRecommendations cases={casesWithScores} onApprove={approveRec} onReject={rejectRec} currentUser={currentUser} pharmacistMode={pharmacistMode} />}
            {activeNav==="reports" && <Reports cases={casesWithScores} />}
            {activeNav==="audit" && <AuditLogView log={auditLog} />}
            {activeNav==="settings" && <SettingsView themeName={themeName} setThemeName={setThemeName} pharmacistMode={pharmacistMode} setPharmacistMode={setPharmacistMode} />}
          </div>
        </main>

        {/* Toast Alerts */}
        <div style={{ position:"fixed", bottom: isMobile ? 80 : 24, right: isMobile ? 12 : 24, left: isMobile ? 12 : "auto", display:"flex", flexDirection:"column", gap:8, zIndex:1000 }}>
          {alerts.map(a => (
            <div key={a.id} style={{ padding:"12px 16px", borderRadius:10,
              background: a.type==="success" ? t.successBg : a.type==="error" ? t.dangerBg : t.cardBg2,
              border:`1px solid ${a.type==="success" ? t.successBorder : a.type==="error" ? t.dangerBorder : t.border}`,
              color:t.textPrimary, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.15)", animation:"slideIn 0.3s ease" }}>
              {a.type==="success"?"✅ ":a.type==="error"?"❌ ":"ℹ️ "}{a.msg}
            </div>
          ))}
        </div>

        {/* ── Mobile Bottom Nav ── */}
        {isMobile && (
          <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:64, background:t.sidebarBg, borderTop:`1px solid ${t.border}`, display:"flex", alignItems:"center", zIndex:100, boxShadow:"0 -2px 12px rgba(0,0,0,0.15)" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); setSelectedCase(null); }}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, padding:"8px 4px", border:"none", background:"transparent", cursor:"pointer",
                  color: activeNav === item.id ? t.navActiveText : t.textMuted, fontFamily:"'DM Sans',sans-serif" }}>
                <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:9, fontWeight: activeNav===item.id ? 700 : 400, letterSpacing:0.3 }}>{item.label}</span>
                {activeNav === item.id && <div style={{ width:20, height:2, borderRadius:2, background:t.accent, marginTop:1 }}/>}
              </button>
            ))}
          </nav>
        )}

        {showNewCase && <NewCaseModal onClose={()=>setShowNewCase(false)} onSave={(data)=>{
          const newCase = { ...data, id:"C"+Date.now(), status:"active", medications:[], recommendations:[], notes:[], lastReview:new Date().toISOString().slice(0,10) };
          setCases(prev=>[...prev,newCase]);
          logAudit(currentUser.name,"CREATE_CASE",`New case for ${data.name}`);
          setShowNewCase(false); showAlert("New case created.","success");
        }}/>}

        <style>{`
          @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
          ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:${t.appBg}; } ::-webkit-scrollbar-thumb { background:${t.border}; border-radius:3px; }
        `}</style>
      </div>
    </ThemeContext.Provider>
    </MobileContext.Provider>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ cases, symptomEntries, onSelect }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  const highRisk = cases.filter(c => c.score >= 71);
  const avgScore = Math.round(cases.reduce((s,c)=>s+c.score,0)/cases.length);
  const criticalFlags = cases.flatMap(c => c.flags.filter(f=>f.sev==="high").map(f=>({...f,caseName:c.name,caseId:c.id})));
  const recentSymptoms = (symptomEntries||[]).slice(0,5);
  const severeSymptoms = (symptomEntries||[]).filter(e=>e.symptoms.some(s=>SEVERE_SYMPTOMS.includes(s)));
  return (
    <div>
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight:700, color:t.textPrimary, margin:0 }}>Clinical Overview</h2>
        <p style={{ color:t.textMuted, fontSize:13, margin:"4px 0 0" }}>Population-level medication risk summary</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 24 }}>
        {[
          { label:"Total Cases", value:cases.length, icon:"◈", color:t.accent },
          { label:"High Risk", value:highRisk.length, icon:"🔴", color:t.danger },
          { label:"Avg Risk Score", value:avgScore, icon:"◎", color:avgScore<=40?t.success:avgScore<=70?t.warning:t.danger },
          { label:"Symptom Reports", value:(symptomEntries||[]).length, icon:"♥", color:t.warning },
        ].map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>

      {severeSymptoms.length > 0 && (
        <div style={{ background:t.dangerBg, border:`1px solid ${t.danger}55`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:700, color:t.danger, marginBottom:12, fontSize:14 }}>🚨 Urgent Caregiver Symptom Reports</div>
          {severeSymptoms.map((e,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${t.dangerBorder}` }}>
              <div>
                <span style={{ color:t.dangerText, fontSize:13, fontWeight:600 }}>{e.patientName}</span>
                <span style={{ color:t.textMuted, fontSize:12 }}> — {e.symptoms.filter(s=>SEVERE_SYMPTOMS.includes(s)).join(", ")}</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:11, color:t.textMuted }}>{e.time}</span>
                <button onClick={()=>onSelect(e.caseId)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${t.danger}`, background:t.dangerBg, color:t.danger, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View Case</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {criticalFlags.length > 0 && (
        <div style={{ background:t.cardBg, border:`1px solid ${t.dangerBorder}`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:700, color:t.danger, marginBottom:14, fontSize:14 }}>🔴 Critical Medication Alerts</div>
          {criticalFlags.slice(0,6).map((f,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
              <div><span style={{ color:t.textMuted, fontSize:12 }}>{f.caseName} — </span><span style={{ color:t.dangerText, fontSize:13 }}>{f.msg}</span></div>
              <button onClick={()=>onSelect(f.caseId)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${t.danger}`, background:t.dangerBg, color:t.danger, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View</button>
            </div>
          ))}
        </div>
      )}

      {recentSymptoms.length > 0 && (
        <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:700, color:t.textPrimary, marginBottom:14, fontSize:14 }}>♥ Recent Caregiver Symptom Reports</div>
          {recentSymptoms.map((e,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
              <div>
                <span style={{ color:t.textPrimary, fontSize:13, fontWeight:600 }}>{e.patientName}</span>
                <span style={{ color:t.textMuted, fontSize:12 }}> — {e.symptoms.slice(0,3).join(", ")}{e.symptoms.length>3?` +${e.symptoms.length-3} more`:""}</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:11, color:t.textMuted }}>{e.time}</span>
                <button onClick={()=>onSelect(e.caseId)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontWeight:600, color:t.textMuted, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>All Cases</div>
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: isMobile ? 10 : 16 }}>
        {cases.map(c => <CaseCard key={c.id} caseData={c} onClick={()=>onSelect(c.id)} />)}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const t = useTheme();
  return (
    <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:"18px 20px", boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <span style={{ fontSize:11, color:t.textMuted, fontWeight:500, letterSpacing:0.5, textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:16 }}>{icon}</span>
      </div>
      <div style={{ fontSize:32, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

function CaseCard({ caseData, onClick }) {
  const t = useTheme();
  return (
    <div onClick={onClick} style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:18, cursor:"pointer", transition:"border-color 0.2s,transform 0.1s,box-shadow 0.2s",
      boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none";}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontWeight:600, color:t.textPrimary, fontSize:15 }}>{caseData.name}</div>
          <div style={{ color:t.textMuted, fontSize:12 }}>Age {caseData.age} · {caseData.mrn}</div>
        </div>
        <ScoreBadge score={caseData.score} />
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {caseData.conditions.slice(0,2).map(c=><span key={c} style={{ fontSize:10, padding:"2px 8px", background:t.chipBg, borderRadius:20, color:t.textSecondary }}>{c}</span>)}
        {caseData.conditions.length > 2 && <span style={{ fontSize:10, padding:"2px 8px", background:t.chipBg, borderRadius:20, color:t.textMuted }}>+{caseData.conditions.length-2}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:12, borderTop:`1px solid ${t.border}` }}>
        <span style={{ fontSize:12, color:t.textMuted }}>{caseData.medications.length} medications</span>
        <span style={{ fontSize:12, color: caseData.flags.filter(f=>f.sev==="high").length > 0 ? t.danger : t.textMuted }}>
          {caseData.flags.filter(f=>f.sev==="high").length} critical flags
        </span>
      </div>
    </div>
  );
}

// ─── Cases List ───────────────────────────────────────────────────────────────
function CasesList({ cases, onSelect, onNew }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: isMobile ? 14 : 20 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight:700, color:t.textPrimary, margin:0 }}>Patient Cases</h2>
          <p style={{ color:t.textMuted, fontSize:13, margin:"2px 0 0" }}>{cases.length} active cases</p>
        </div>
        <ActionBtn onClick={onNew}>+ New Case</ActionBtn>
      </div>

      {/* Mobile: card list */}
      {isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {cases.map(c=>(
            <div key={c.id} onClick={()=>onSelect(c.id)}
              style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:14, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:t.textPrimary, fontSize:14, marginBottom:2 }}>{c.name}</div>
                <div style={{ color:t.textMuted, fontSize:11 }}>Age {c.age} · {c.medications.length} meds · {c.lastReview}</div>
                <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
                  {c.flags.filter(f=>f.sev==="high").length > 0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:t.dangerBg, color:t.dangerText, fontWeight:700 }}>🔴 {c.flags.filter(f=>f.sev==="high").length} Critical</span>}
                  {c.flags.filter(f=>f.sev==="moderate").length > 0 && c.flags.filter(f=>f.sev==="high").length===0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:t.warningBg, color:t.warningText, fontWeight:600 }}>🟡 Moderate</span>}
                  {c.flags.length===0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:t.successBg, color:t.successText, fontWeight:600 }}>✓ Clear</span>}
                </div>
              </div>
              <ScoreBadge score={c.score} />
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: full table */
        <div style={{ background:t.tableBg, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.border}`, background: t.appBg==="#f0f4f8" ? t.cardBg2 : "transparent" }}>
                {["Patient","Age","MRN","Medications","Risk Score","Flags","Last Review",""].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map(c=>(
                <tr key={c.id} style={{ borderBottom:`1px solid ${t.border}`, cursor:"pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.background=t.tableRowHover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>onSelect(c.id)}>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ fontWeight:600, color:t.textPrimary, fontSize:14 }}>{c.name}</div>
                    <div style={{ color:t.textMuted, fontSize:11, marginTop:2 }}>{c.physician}</div>
                  </td>
                  <td style={{ padding:"14px 16px", color:t.textSecondary, fontSize:13 }}>{c.age}</td>
                  <td style={{ padding:"14px 16px", color:t.textSecondary, fontSize:12, fontFamily:"monospace" }}>{c.mrn}</td>
                  <td style={{ padding:"14px 16px", color:t.textSecondary, fontSize:13 }}>{c.medications.length}</td>
                  <td style={{ padding:"14px 16px" }}><ScoreBadge score={c.score} /></td>
                  <td style={{ padding:"14px 16px" }}>
                    {c.flags.filter(f=>f.sev==="high").length > 0 && <span style={{ color:t.danger, fontSize:12, fontWeight:600 }}>🔴 {c.flags.filter(f=>f.sev==="high").length} Critical</span>}
                    {c.flags.filter(f=>f.sev==="moderate").length > 0 && c.flags.filter(f=>f.sev==="high").length === 0 && <span style={{ color:t.warning, fontSize:12, fontWeight:600 }}>🟡 Moderate</span>}
                    {c.flags.length === 0 && <span style={{ color:t.success, fontSize:12 }}>✓ Clear</span>}
                  </td>
                  <td style={{ padding:"14px 16px", color:t.textMuted, fontSize:12 }}>{c.lastReview}</td>
                  <td style={{ padding:"14px 16px" }}><ActionBtn onClick={()=>onSelect(c.id)} small>View</ActionBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Case Detail ──────────────────────────────────────────────────────────────
function CaseDetail({ caseData, symptomEntries, pharmacistMode, tab, setTab, onBack, onApprove, onReject, onAddMed, onRemoveMed, onEditMed, onAddRec, currentUser }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  const [showNewMed, setShowNewMed] = useState(false);
  const [showNewRec, setShowNewRec] = useState(false);
  const caseSymptoms = (symptomEntries || []).filter(e => e.caseId === caseData.id);
  const tabs = ["overview","medications","risk-report","recommendations","symptoms","notes"];
  return (
    <div>
      <button onClick={onBack} style={{ background:"transparent", border:"none", color:t.accent, fontSize:13, cursor:"pointer", marginBottom:12, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
        ← Back to Cases
      </button>

      {/* Patient header — compact on mobile */}
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding: isMobile ? 14 : 20, marginBottom: isMobile ? 14 : 20, display:"flex", alignItems:"center", gap: isMobile ? 12 : 24 }}>
        <div style={{ width: isMobile?40:56, height: isMobile?40:56, borderRadius:14, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isMobile?16:20, fontWeight:700, color:"#fff", flexShrink:0 }}>
          {caseData.name.split(" ").map(w=>w[0]).join("")}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize: isMobile?16:20, fontWeight:700, color:t.textPrimary }}>{caseData.name}</div>
          <div style={{ color:t.textMuted, fontSize: isMobile?11:13, marginTop:2 }}>
            Age {caseData.age} · {caseData.mrn}{!isMobile && ` · DOB ${caseData.dob} · Physician: ${caseData.physician}`}
          </div>
          {!isMobile && (
            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
              {caseData.conditions.map(c=><span key={c} style={{ fontSize:11, padding:"3px 10px", background:t.chipBg, borderRadius:20, color:t.textSecondary }}>{c}</span>)}
            </div>
          )}
          {isMobile && (
            <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
              {caseData.conditions.slice(0,2).map(c=><span key={c} style={{ fontSize:10, padding:"2px 7px", background:t.chipBg, borderRadius:20, color:t.textSecondary }}>{c}</span>)}
              {caseData.conditions.length>2 && <span style={{ fontSize:10, padding:"2px 7px", background:t.chipBg, borderRadius:20, color:t.textMuted }}>+{caseData.conditions.length-2}</span>}
            </div>
          )}
        </div>
        <ScoreBadge score={caseData.score} size={isMobile?"sm":"lg"} />
      </div>

      {/* Tab bar — horizontally scrollable on mobile */}
      <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling:"touch", marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ display:"flex", gap:4, background:t.cardBg2, border:`1px solid ${t.border}`, borderRadius:10, padding:4, minWidth: isMobile ? "max-content" : "auto" }}>
          {tabs.map(tb=>(
            <button key={tb} onClick={()=>setTab(tb)} style={{ flex: isMobile ? "none" : 1, padding: isMobile ? "8px 14px" : "8px 4px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:tab===tb?600:400, textTransform:"capitalize", whiteSpace:"nowrap",
              background:tab===tb ? t.accent : "transparent", color:tab===tb ? (t.appBg==="#f0f4f8"?"#fff":t.btnPrimaryText) : t.navText, transition:"all 0.15s" }}>
              {tb.replace("-"," ")}
            </button>
          ))}
        </div>
      </div>
      {tab==="overview" && <CaseOverview caseData={caseData} symptoms={caseSymptoms} />}
      {tab==="medications" && <MedicationsTab caseData={caseData} onAdd={onAddMed} onRemove={onRemoveMed} onEdit={onEditMed} showNew={showNewMed} setShowNew={setShowNewMed} currentUser={currentUser} />}
      {tab==="risk-report" && <RiskReport caseData={caseData} />}
      {tab==="recommendations" && <RecommendationsTab caseData={caseData} onApprove={onApprove} onReject={onReject} onAdd={onAddRec} showNew={showNewRec} setShowNew={setShowNewRec} currentUser={currentUser} pharmacistMode={pharmacistMode} />}
      {tab==="symptoms" && <SymptomsTab caseData={caseData} symptoms={caseSymptoms} />}
      {tab==="notes" && <EmptyState>No clinical notes recorded. Notes feature coming in Phase 2.</EmptyState>}
    </div>
  );
}

function CaseOverview({ caseData, symptoms }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  return (
    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 16 }}>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20 }}>
        <SectionTitle>Risk Flags Summary</SectionTitle>
        {caseData.flags.length === 0 ? <div style={{ color:t.success, fontSize:13 }}>✓ No flags detected</div> : caseData.flags.map((f,i)=><FlagPill key={i} flag={f}/>)}
      </div>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20 }}>
        <SectionTitle>Pending Recommendations</SectionTitle>
        {caseData.recommendations.filter(r=>r.status==="pending").length === 0 ?
          <div style={{ color:t.textMuted, fontSize:13 }}>No pending recommendations</div> :
          caseData.recommendations.filter(r=>r.status==="pending").map(r=>(
            <div key={r.id} style={{ padding:"10px 12px", background:t.warningBg, border:`1px solid ${t.warningBorder}`, borderRadius:8, marginBottom:8 }}>
              <div style={{ color:t.warningText, fontSize:13, fontWeight:600 }}>{r.action}: {r.drug}</div>
              <div style={{ color:t.textSecondary, fontSize:12, marginTop:4 }}>{r.reason.slice(0,80)}...</div>
            </div>
          ))}
      </div>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20 }}>
        <SectionTitle>Current Medications</SectionTitle>
        {caseData.medications.slice(0,5).map(m=>(
          <div key={m.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
            <div style={{ color:t.textPrimary, fontSize:13 }}>{m.name}</div>
            <div style={{ color:t.textMuted, fontSize:12 }}>{m.dose} · {m.frequency}</div>
          </div>
        ))}
        {caseData.medications.length > 5 && <div style={{ color:t.textMuted, fontSize:12, marginTop:8 }}>+{caseData.medications.length-5} more</div>}
      </div>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20 }}>
        <SectionTitle>Care Team</SectionTitle>
        {[{role:"Physician",name:caseData.physician},{role:"Pharmacist",name:caseData.pharmacist},{role:"Coordinator",name:caseData.coordinator}].map(m=>(
          <div key={m.role} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
            <div style={{ color:t.textMuted, fontSize:12 }}>{m.role}</div>
            <div style={{ color:t.textPrimary, fontSize:13, fontWeight:500 }}>{m.name}</div>
          </div>
        ))}
      </div>
      <div style={{ background:t.cardBg, border:`1px solid ${(symptoms||[]).some(e=>e.symptoms.some(s=>SEVERE_SYMPTOMS.includes(s)))?t.danger+"55":t.border}`, borderRadius:12, padding:20, gridColumn:"1 / -1" }}>
        <SectionTitle>Recent Caregiver Reports ({(symptoms||[]).length})</SectionTitle>
        {(symptoms||[]).length === 0 ? (
          <div style={{ color:t.textMuted, fontSize:13 }}>No symptoms reported yet via the mobile caregiver app.</div>
        ) : (symptoms||[]).slice(0,3).map(e=>{
          const hasSevere = e.symptoms.some(s=>SEVERE_SYMPTOMS.includes(s));
          return (
            <div key={e.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom:`1px solid ${t.border}` }}>
              <span style={{ fontSize:16 }}>{hasSevere?"🚨":"♥"}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:4 }}>
                  {e.symptoms.map(s=><span key={s} style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:SEVERE_SYMPTOMS.includes(s)?t.dangerBg:t.chipBg, color:SEVERE_SYMPTOMS.includes(s)?t.dangerText:t.textSecondary }}>{s}</span>)}
                </div>
                <div style={{ fontSize:11, color:t.textMuted }}>{e.reportedBy} · {e.date} {e.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MedicationsTab({ caseData, onAdd, onRemove, onEdit, showNew, setShowNew }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  const [newMed, setNewMed] = useState({ name:"", dose:"", frequency:"Daily", class:"" });
  const [editingMed, setEditingMed] = useState(null);
  const medClasses = ["Anticoagulant","Antidiabetic","ACE Inhibitor","ARB","Statin","Beta Blocker","CCB","Cardiac Glycoside","Diuretic","Antiplatelet","Antiarrhythmic","Antibiotic","Antifungal","Antiviral","SSRI","SNRI","Antipsychotic","Benzodiazepine","Opioid","NSAID","Corticosteroid","Bronchodilator","Bisphosphonate","Thyroid Agent","Supplement","Other"];
  const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };
  const freqOptions = ["Daily","Twice daily","Three times daily","Four times daily","Weekly","Every other day","As needed","With meals"];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:t.textMuted, fontSize:13 }}>{caseData.medications.length} medications on record</div>
        <ActionBtn onClick={()=>setShowNew(true)}>+ Add Medication</ActionBtn>
      </div>
      {/* Mobile: medication cards */}
      {isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {caseData.medications.map(m=>{
            const isHighRisk = HIGH_RISK_DRUGS.includes(m.name);
            return (
              <div key={m.id} style={{ background:t.cardBg, border:`1px solid ${isHighRisk?t.danger+"44":t.border}`, borderRadius:12, padding:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:700, color:t.textPrimary, fontSize:14 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:t.textSecondary, marginTop:2 }}>{m.dose} · {m.frequency}</div>
                    {m.class && <div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>{m.class}</div>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    {isHighRisk && caseData.age>=65
                      ? <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:t.dangerBg, color:t.dangerText, fontWeight:700 }}>⚠ Geri Risk</span>
                      : <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:t.successBg, color:t.successText }}>✓ OK</span>}
                    <span style={{ fontSize:11, color: m.missedDoses>=3?t.danger:m.missedDoses>0?t.warning:t.success, fontWeight:600 }}>
                      {m.missedDoses} missed
                    </span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>setEditingMed({...m})} style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✏ Edit</button>
                  <button onClick={()=>{if(window.confirm(`Remove ${m.name}?`))onRemove(m.id);}} style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${t.borderStrong}`, background:t.btnSecondaryBg, color:t.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: full table */
        <div style={{ background:t.tableBg, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.border}`, background: t.appBg==="#f0f4f8" ? t.cardBg2 : "transparent" }}>
                {["Medication","Dose","Frequency","Class","Missed","Start Date","Risk","Actions"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caseData.medications.map(m=>{
                const isHighRisk = HIGH_RISK_DRUGS.includes(m.name);
                return (
                  <tr key={m.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ fontWeight:600, color:t.textPrimary, fontSize:13 }}>{m.name}</div>
                      {isHighRisk && <div style={{ fontSize:10, color:t.danger, marginTop:2 }}>⚠ High-Risk Drug</div>}
                    </td>
                    <td style={{ padding:"12px 14px", color:t.textSecondary, fontSize:13 }}>{m.dose}</td>
                    <td style={{ padding:"12px 14px", color:t.textSecondary, fontSize:13 }}>{m.frequency}</td>
                    <td style={{ padding:"12px 14px", color:t.textSecondary, fontSize:12 }}>{m.class}</td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ color: m.missedDoses>=3?t.danger:m.missedDoses>0?t.warning:t.success, fontSize:13, fontWeight:600 }}>{m.missedDoses}</span>
                    </td>
                    <td style={{ padding:"12px 14px", color:t.textMuted, fontSize:12 }}>{m.startDate}</td>
                    <td style={{ padding:"12px 14px" }}>
                      {isHighRisk && caseData.age>=65 ? <span style={{ fontSize:12, color:t.danger, fontWeight:600 }}>⚠ Geri</span> : <span style={{color:t.success,fontSize:12}}>✓</span>}
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>setEditingMed({ ...m })} title="Edit medication"
                          style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4 }}>
                          ✏ Edit
                        </button>
                        <button onClick={()=>{if(window.confirm(`Remove ${m.name}?`))onRemove(m.id);}}
                          style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${t.borderStrong}`, background:t.btnSecondaryBg, color:t.textSecondary, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Medication Modal */}
      {showNew && (
        <ThemedModal title="Add Medication" onClose={()=>{ setShowNew(false); setNewMed({name:"",dose:"",frequency:"Daily",class:""}); }} onSave={()=>{if(newMed.name){onAdd(newMed);setShowNew(false);setNewMed({name:"",dose:"",frequency:"Daily",class:""});}}}>
          <ThemedField label="Drug Name"><input value={newMed.name} onChange={e=>setNewMed(p=>({...p,name:e.target.value}))} placeholder="e.g. Metformin" style={inputStyle}/></ThemedField>
          <ThemedField label="Dose"><input value={newMed.dose} onChange={e=>setNewMed(p=>({...p,dose:e.target.value}))} placeholder="e.g. 500mg" style={inputStyle}/></ThemedField>
          <ThemedField label="Frequency"><select value={newMed.frequency} onChange={e=>setNewMed(p=>({...p,frequency:e.target.value}))} style={inputStyle}>{freqOptions.map(f=><option key={f}>{f}</option>)}</select></ThemedField>
          <ThemedField label="Drug Class"><select value={newMed.class} onChange={e=>setNewMed(p=>({...p,class:e.target.value}))} style={inputStyle}><option value="">Select...</option>{medClasses.map(c=><option key={c}>{c}</option>)}</select></ThemedField>
        </ThemedModal>
      )}

      {/* Edit Medication Modal */}
      {editingMed && (
        <ThemedModal
          title="Edit Medication"
          onClose={()=>setEditingMed(null)}
          onSave={()=>{
            if(editingMed.name){ onEdit(editingMed); setEditingMed(null); }
          }}>
          {/* Read-only start date notice */}
          <div style={{ padding:"8px 12px", borderRadius:8, background:t.cardBg2, border:`1px solid ${t.border}`, marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:t.textMuted }}>Start Date (locked)</span>
            <span style={{ fontSize:12, color:t.textSecondary, fontFamily:"monospace" }}>{editingMed.startDate}</span>
          </div>
          <ThemedField label="Drug Name">
            <input value={editingMed.name} onChange={e=>setEditingMed(p=>({...p,name:e.target.value}))} style={inputStyle}/>
          </ThemedField>
          <ThemedField label="Dose">
            <input value={editingMed.dose} onChange={e=>setEditingMed(p=>({...p,dose:e.target.value}))} placeholder="e.g. 500mg" style={inputStyle}/>
          </ThemedField>
          <ThemedField label="Frequency">
            <select value={editingMed.frequency} onChange={e=>setEditingMed(p=>({...p,frequency:e.target.value}))} style={inputStyle}>
              {freqOptions.map(f=><option key={f}>{f}</option>)}
            </select>
          </ThemedField>
          <ThemedField label="Drug Class">
            <select value={editingMed.class} onChange={e=>setEditingMed(p=>({...p,class:e.target.value}))} style={inputStyle}>
              <option value="">Select...</option>
              {medClasses.map(c=><option key={c}>{c}</option>)}
            </select>
          </ThemedField>
          {/* Change reason — good clinical practice */}
          <ThemedField label="Reason for Change">
            <select value={editingMed.changeReason||""} onChange={e=>setEditingMed(p=>({...p,changeReason:e.target.value}))} style={inputStyle}>
              <option value="">Select reason...</option>
              {["Dose adjustment","Frequency change","Correction of entry error","Physician order","Pharmacist recommendation","Side effect management","Renal/hepatic adjustment"].map(r=><option key={r}>{r}</option>)}
            </select>
          </ThemedField>
        </ThemedModal>
      )}
    </div>
  );
}

function RiskReport({ caseData }) {
  const t = useTheme();
  const scoreColor = caseData.score<=40?t.success:caseData.score<=70?t.warning:t.danger;
  return (
    <div>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:24, marginBottom:20, display:"flex", alignItems:"center", gap:32 }}>
        <ScoreBadge score={caseData.score} size="lg" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:8 }}>Risk Score Breakdown</div>
          <div style={{ background:t.cardBg2, borderRadius:8, height:12, overflow:"hidden", marginBottom:4 }}>
            <div style={{ height:"100%", width:`${caseData.score}%`, background:`linear-gradient(90deg,${t.success},${scoreColor})`, borderRadius:8, transition:"width 0.8s ease" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.textMuted }}>
            <span>0 — Low Risk</span><span>50 — Moderate</span><span>100 — High Risk</span>
          </div>
        </div>
      </div>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <SectionTitle>Active Risk Flags ({caseData.flags.length})</SectionTitle>
        {caseData.flags.length === 0 ? <div style={{ color:t.success, fontSize:13 }}>✓ No risk flags detected</div> : caseData.flags.map((f,i)=><FlagPill key={i} flag={f}/>)}
      </div>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20 }}>
        <SectionTitle>Score Factor Analysis</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { factor:"Medication Count", detail:`${caseData.medications.length} medications`, weight:caseData.medications.length>=10?"High":caseData.medications.length>=5?"Moderate":"Low" },
            { factor:"Drug Interactions", detail:`${caseData.flags.filter(f=>f.type==="INTERACTION").length} detected`, weight:caseData.flags.filter(f=>f.type==="INTERACTION").length>0?"High":"Low" },
            { factor:"High-Risk Drugs", detail:`${caseData.medications.filter(m=>HIGH_RISK_DRUGS.includes(m.name)).length} flagged`, weight:caseData.flags.filter(f=>f.type==="GERI_RISK").length>0?"High":"Low" },
            { factor:"Adherence", detail:`${caseData.medications.reduce((s,m)=>s+(m.missedDoses||0),0)} missed doses`, weight:caseData.medications.reduce((s,m)=>s+(m.missedDoses||0),0)>=3?"Moderate":"Low" },
          ].map(f=>(
            <div key={f.factor} style={{ padding:"12px 14px", background:t.cardBg2, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary, marginBottom:4 }}>{f.factor}</div>
              <div style={{ fontSize:12, color:t.textSecondary }}>{f.detail}</div>
              <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:f.weight==="High"?t.danger:f.weight==="Moderate"?t.warning:t.success }}>{f.weight} Impact</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ caseData, onApprove, onReject, onAdd, showNew, setShowNew, currentUser, pharmacistMode }) {
  const t = useTheme();
  const [newRec, setNewRec] = useState({ drug:"", action:"Deprescribe", reason:"" });
  const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };
  // In pharmacist-off mode, the physician can propose directly; the "pending review" step is skipped
  const proposeLabel = pharmacistMode ? "+ Propose Recommendation" : "+ Add Recommendation";
  return (
    <div>
      {/* Workflow mode banner */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, marginBottom:16,
        background: pharmacistMode ? t.accentBg : t.successBg,
        border: `1px solid ${pharmacistMode ? t.accent+"44" : t.successBorder}` }}>
        <span style={{ fontSize:16 }}>{pharmacistMode ? "⚗" : "👤"}</span>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color: pharmacistMode ? t.accent : t.successText }}>
            {pharmacistMode ? "Pharmacist Review Mode" : "Physician-Only Mode"}
          </div>
          <div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>
            {pharmacistMode
              ? "Pharmacist proposes → Physician approves. Change this in Settings."
              : "Physician creates and approves recommendations directly. Change in Settings."}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:t.textMuted, fontSize:13 }}>{caseData.recommendations.filter(r=>r.status==="pending").length} pending review</div>
        <ActionBtn onClick={()=>setShowNew(true)}>{proposeLabel}</ActionBtn>
      </div>
      {caseData.recommendations.length === 0 && <EmptyState>No recommendations yet.</EmptyState>}
      {caseData.recommendations.map(r=>(
        <div key={r.id} style={{ background:t.cardBg, border:`1px solid ${r.status==="pending"?t.warningBorder:r.status==="approved"?t.successBorder:t.dangerBorder}`, borderRadius:12, padding:20, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <span style={{ background:r.action==="Deprescribe"?t.dangerBg:t.successBg, color:r.action==="Deprescribe"?t.dangerText:t.successText, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, marginRight:8 }}>{r.action}</span>
              <span style={{ fontSize:16, fontWeight:700, color:t.textPrimary }}>{r.drug}</span>
            </div>
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize",
              background:r.status==="pending"?t.warningBg:r.status==="approved"?t.successBg:t.dangerBg,
              color:r.status==="pending"?t.warningText:r.status==="approved"?t.successText:t.dangerText }}>{r.status}</span>
          </div>
          <p style={{ color:t.textSecondary, fontSize:13, margin:"0 0 12px", lineHeight:1.6 }}>{r.reason}</p>
          <div style={{ fontSize:12, color:t.textMuted, marginBottom:12 }}>Proposed by {r.proposedBy} on {r.createdAt}</div>
          {r.status==="pending" && (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onApprove(r.id)} style={{ padding:"6px 16px", borderRadius:7, border:`1px solid ${t.success}`, background:t.successBg, color:t.successText, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✓ Approve</button>
              <button onClick={()=>onReject(r.id)} style={{ padding:"6px 16px", borderRadius:7, border:`1px solid ${t.danger}`, background:t.dangerBg, color:t.dangerText, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✗ Reject</button>
            </div>
          )}
          {r.approvedBy && <div style={{ fontSize:12, color:t.success, marginTop:8 }}>✓ Approved by {r.approvedBy} on {r.approvedAt}</div>}
        </div>
      ))}
      {showNew && (
        <ThemedModal title="Propose Recommendation" onClose={()=>setShowNew(false)} onSave={()=>{if(newRec.drug&&newRec.reason){onAdd(newRec);setShowNew(false);setNewRec({drug:"",action:"Deprescribe",reason:""});}}}>
          <ThemedField label="Drug"><input value={newRec.drug} onChange={e=>setNewRec(p=>({...p,drug:e.target.value}))} placeholder="Drug name" style={inputStyle}/></ThemedField>
          <ThemedField label="Action"><select value={newRec.action} onChange={e=>setNewRec(p=>({...p,action:e.target.value}))} style={inputStyle}>{["Deprescribe","Dose Reduction","Substitute","Monitor","Discontinue"].map(a=><option key={a}>{a}</option>)}</select></ThemedField>
          <ThemedField label="Clinical Reasoning"><textarea value={newRec.reason} onChange={e=>setNewRec(p=>({...p,reason:e.target.value}))} placeholder="Evidence-based rationale..." rows={4} style={{...inputStyle,resize:"vertical"}}/></ThemedField>
        </ThemedModal>
      )}
    </div>
  );
}

function AllRecommendations({ cases, onApprove, onReject, currentUser, pharmacistMode }) {
  const t = useTheme();
  const all = cases.flatMap(c => c.recommendations.map(r=>({...r,caseName:c.name,caseId:c.id})));
  const pending = all.filter(r=>r.status==="pending");
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 6px" }}>Recommendations</h2>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, marginBottom:20,
        background: pharmacistMode ? t.accentBg : t.successBg,
        border: `1px solid ${pharmacistMode ? t.accent+"44" : t.successBorder}` }}>
        <span style={{ fontSize:16 }}>{pharmacistMode ? "⚗" : "👤"}</span>
        <span style={{ fontSize:13, color:t.textSecondary }}>
          {pharmacistMode
            ? `${pending.length} recommendation${pending.length!==1?"s":""} awaiting physician review — proposed by pharmacist`
            : `${pending.length} recommendation${pending.length!==1?"s":""} pending — Physician-Only mode active`}
        </span>
      </div>
      {pending.length === 0 && <EmptyState>No pending recommendations.</EmptyState>}
      {pending.map(r=>(
        <div key={r.id} style={{ background:t.cardBg, border:`1px solid ${t.warningBorder}`, borderRadius:12, padding:20, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div><span style={{ color:t.textMuted, fontSize:12 }}>{r.caseName} · </span><span style={{ color:t.dangerText, fontWeight:700 }}>{r.action}: {r.drug}</span></div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onApprove(r.caseId,r.id)} style={{ padding:"5px 14px", borderRadius:7, border:`1px solid ${t.success}`, background:t.successBg, color:t.successText, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Approve</button>
              <button onClick={()=>onReject(r.caseId,r.id)} style={{ padding:"5px 14px", borderRadius:7, border:`1px solid ${t.danger}`, background:t.dangerBg, color:t.dangerText, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Reject</button>
            </div>
          </div>
          <p style={{ color:t.textSecondary, fontSize:13, margin:0, lineHeight:1.5 }}>{r.reason}</p>
          <div style={{ fontSize:11, color:t.textMuted, marginTop:8 }}>Proposed by {r.proposedBy} · {r.createdAt}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Symptoms Tab ─────────────────────────────────────────────────────────────
function SymptomsTab({ caseData, symptoms }) {
  const t = useTheme();
  const SYMPTOM_OPTIONS = ["Dizziness","Nausea","Fatigue","Shortness of breath","Swelling","Confusion","Headache","Chest pain","Rash","Other"];
  const [simOpen, setSimOpen] = useState(false);
  const [simSelected, setSimSelected] = useState([]);
  const [simNotes, setSimNotes] = useState("");
  const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };

  function toggleSim(s) { setSimSelected(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]); }
  function submitSim() {
    if (!simSelected.length) return;
    symptomStore.add({
      id: Date.now(),
      caseId: caseData.id,
      patientName: caseData.name,
      symptoms: simSelected,
      notes: simNotes,
      reportedBy: "Caregiver (Mobile App)",
      time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
    });
    setSimSelected([]); setSimNotes(""); setSimOpen(false);
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:t.textPrimary }}>Caregiver Symptom Reports</div>
          <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>Reported via the Less Meds caregiver mobile app</div>
        </div>
        <button onClick={()=>setSimOpen(p=>!p)} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
          📱 Simulate Mobile Report
        </button>
      </div>

      {/* Mobile simulator panel */}
      {simOpen && (
        <div style={{ background:t.cardBg2, border:`1px solid ${t.accent}44`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ width:28, height:28, borderRadius:6, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📱</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:t.textPrimary }}>Simulating: Caregiver Mobile App</div>
              <div style={{ fontSize:11, color:t.textMuted }}>Patient: {caseData.name} · This simulates a caregiver tapping symptoms on their phone</div>
            </div>
          </div>
          <div style={{ fontSize:11, color:t.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Select Symptoms</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
            {SYMPTOM_OPTIONS.map(s => (
              <button key={s} onClick={()=>toggleSim(s)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight: simSelected.includes(s) ? 700 : 400,
                border:`1px solid ${simSelected.includes(s) ? t.accent : t.border}`,
                background: simSelected.includes(s) ? t.accentBg : "transparent",
                color: simSelected.includes(s) ? t.accent : t.textSecondary,
                outline: SEVERE_SYMPTOMS.includes(s) ? `1px dashed ${t.danger}55` : "none" }}>
                {SEVERE_SYMPTOMS.includes(s) ? "⚠ " : ""}{s}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:t.textMuted, marginBottom:6 }}>Note: ⚠ symptoms trigger an urgent alert on the clinical dashboard</div>
          <textarea value={simNotes} onChange={e=>setSimNotes(e.target.value)} placeholder="Caregiver notes (optional)..." rows={2}
            style={{...inputStyle, resize:"vertical", marginBottom:12}}/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{setSimOpen(false);setSimSelected([]);setSimNotes("");}} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:t.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={submitSim} disabled={!simSelected.length} style={{ padding:"8px 20px", borderRadius:8, border:"none", background: simSelected.length ? t.btnPrimary : t.border, color: simSelected.length ? t.btnPrimaryText : t.textMuted, fontSize:12, fontWeight:700, cursor: simSelected.length ? "pointer" : "not-allowed", fontFamily:"'DM Sans',sans-serif" }}>
              Submit Report →
            </button>
          </div>
        </div>
      )}

      {/* Symptom timeline */}
      {symptoms.length === 0 ? (
        <div style={{ padding:40, textAlign:"center", color:t.textMuted, fontSize:13, background:t.cardBg, border:`1px dashed ${t.border}`, borderRadius:12 }}>
          No symptoms reported yet for this patient.<br/>
          <span style={{ fontSize:12, marginTop:6, display:"block" }}>Caregivers can log symptoms via the Less Meds mobile app. Use "Simulate Mobile Report" above to test.</span>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:11, color:t.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>{symptoms.length} Report{symptoms.length!==1?"s":""} on File</div>
          {symptoms.map(e => {
            const hasSevere = e.symptoms.some(s => SEVERE_SYMPTOMS.includes(s));
            return (
              <div key={e.id} style={{ background:t.cardBg, border:`1px solid ${hasSevere ? t.danger+"55" : t.border}`, borderRadius:12, padding:18, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background: hasSevere ? t.dangerBg : t.accentBg, border:`1px solid ${hasSevere?t.danger+"44":t.accent+"44"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                      {hasSevere ? "🚨" : "♥"}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{e.reportedBy}</div>
                      <div style={{ fontSize:11, color:t.textMuted }}>{e.date} at {e.time}</div>
                    </div>
                  </div>
                  {hasSevere && <span style={{ padding:"3px 10px", borderRadius:20, background:t.dangerBg, color:t.dangerText, fontSize:11, fontWeight:700, border:`1px solid ${t.danger}44` }}>⚠ Urgent</span>}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: e.notes ? 10 : 0 }}>
                  {e.symptoms.map(s => (
                    <span key={s} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight: SEVERE_SYMPTOMS.includes(s) ? 700 : 400,
                      background: SEVERE_SYMPTOMS.includes(s) ? t.dangerBg : t.chipBg,
                      color: SEVERE_SYMPTOMS.includes(s) ? t.dangerText : t.textSecondary,
                      border:`1px solid ${SEVERE_SYMPTOMS.includes(s) ? t.danger+"44" : t.border}` }}>{s}</span>
                  ))}
                </div>
                {e.notes && <div style={{ fontSize:12, color:t.textSecondary, fontStyle:"italic", padding:"8px 12px", background:t.cardBg2, borderRadius:8, border:`1px solid ${t.border}` }}>{e.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Reports({ cases }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 6px" }}>Reports & Exports</h2>
      <p style={{ color:t.textMuted, fontSize:13, margin:"0 0 20px" }}>Generate and export medication summaries</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
        {cases.map(c=>(
          <div key={c.id} style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div><div style={{ fontWeight:600, color:t.textPrimary }}>{c.name}</div><div style={{ fontSize:12, color:t.textMuted }}>{c.mrn} · {c.medications.length} meds · Score: {c.score}</div></div>
              <ScoreBadge score={c.score} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>exportCase(c)} style={{ flex:1, padding:"7px", borderRadius:7, border:`1px solid ${t.borderStrong}`, background:t.btnSecondaryBg, color:t.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Export Summary</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function exportCase(c) {
  const text = `LESS MEDS CASE REPORT\n${"=".repeat(40)}\nPatient: ${c.name}\nMRN: ${c.mrn}\nAge: ${c.age}\nRisk Score: ${c.score}\nGenerated: ${new Date().toLocaleString()}\n\nMEDICATIONS:\n${c.medications.map(m=>`- ${m.name} ${m.dose} ${m.frequency}`).join("\n")}\n\nRISK FLAGS:\n${c.flags.map(f=>`[${f.sev.toUpperCase()}] ${f.msg}`).join("\n")||"None"}\n`;
  const blob = new Blob([text],{type:"text/plain"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${c.mrn}-report.txt`; a.click();
}

function AuditLogView({ log }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 6px" }}>Audit Log</h2>
      <p style={{ color:t.textMuted, fontSize:13, margin:"0 0 20px" }}>HIPAA-compliant record of all sensitive actions</p>
      <div style={{ background:t.tableBg, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden" }}>
        {log.length === 0 ? (
          <div style={{ padding:24, color:t.textMuted, fontSize:13 }}>No audit events recorded yet. Actions you take will appear here.</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.border}`, background: t.appBg==="#f0f4f8"?t.cardBg2:"transparent" }}>
                {["Timestamp","User","Action","Detail"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map(entry=>(
                <tr key={entry.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                  <td style={{ padding:"10px 14px", color:t.textMuted, fontSize:12, fontFamily:"monospace" }}>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td style={{ padding:"10px 14px", color:t.textSecondary, fontSize:12 }}>{entry.user}</td>
                  <td style={{ padding:"10px 14px" }}><span style={{ padding:"2px 8px", borderRadius:4, background:t.chipBg, color:t.accent, fontSize:11, fontFamily:"monospace" }}>{entry.action}</span></td>
                  <td style={{ padding:"10px 14px", color:t.textSecondary, fontSize:12 }}>{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Settings with Theme Switcher ─────────────────────────────────────────────
function SettingsView({ themeName, setThemeName, pharmacistMode, setPharmacistMode }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 6px" }}>Settings</h2>
      <p style={{ color:t.textMuted, fontSize:13, margin:"0 0 24px" }}>Organization settings and compliance configuration</p>

      {/* Workflow Mode Card */}
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20, marginBottom:16, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
        <SectionTitle>Recommendation Workflow</SectionTitle>
        <p style={{ color:t.textSecondary, fontSize:13, margin:"0 0 16px", lineHeight:1.6 }}>
          Choose how medication recommendations are created and approved in your practice.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            {
              key: true,
              icon: "⚗",
              title: "Pharmacist + Physician",
              desc: "Pharmacist proposes recommendations. Physician reviews and approves or rejects. Best for larger practices or health systems with a pharmacy team.",
              tags: ["Dual review", "Highest safety", "Recommended"],
            },
            {
              key: false,
              icon: "👤",
              title: "Physician Only",
              desc: "Physician creates and immediately approves recommendations directly. Best for solo or small practices without a dedicated pharmacist on staff.",
              tags: ["Streamlined", "Fewer steps", "Solo-friendly"],
            },
          ].map(opt => (
            <button key={String(opt.key)} onClick={()=>setPharmacistMode(opt.key)}
              style={{ padding:"18px", borderRadius:12, textAlign:"left", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s",
                border:`2px solid ${pharmacistMode===opt.key ? t.accent : t.border}`,
                background: pharmacistMode===opt.key ? t.accentBg : t.cardBg2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background: pharmacistMode===opt.key ? t.accent+"22" : t.chipBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:`1px solid ${pharmacistMode===opt.key?t.accent+"44":t.border}` }}>
                  {opt.icon}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:t.textPrimary }}>{opt.title}</div>
                  {pharmacistMode===opt.key && <div style={{ fontSize:10, color:t.accent, fontWeight:600, marginTop:1 }}>✓ ACTIVE</div>}
                </div>
              </div>
              <div style={{ fontSize:12, color:t.textSecondary, lineHeight:1.5, marginBottom:10 }}>{opt.desc}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {opt.tags.map(tag=>(
                  <span key={tag} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                    background: pharmacistMode===opt.key ? t.accent+"22" : t.chipBg,
                    color: pharmacistMode===opt.key ? t.accent : t.textMuted,
                    border:`1px solid ${pharmacistMode===opt.key?t.accent+"44":t.border}`, fontWeight:600 }}>{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
        {!pharmacistMode && (
          <div style={{ marginTop:12, padding:"10px 14px", borderRadius:8, background:t.warningBg, border:`1px solid ${t.warningBorder}` }}>
            <span style={{ fontSize:12, color:t.warningText }}>⚠ In Physician-Only mode, recommendations are approved immediately without a second clinical review. Ensure your practice has appropriate oversight procedures in place.</span>
          </div>
        )}
      </div>

      {/* Theme Switcher Card */}
      <div style={{ background:t.cardBg, border:`1px solid ${t.accent}44`, borderRadius:12, padding:20, marginBottom:16, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
        <SectionTitle>Display Theme</SectionTitle>
        <p style={{ color:t.textSecondary, fontSize:13, margin:"0 0 16px" }}>Choose a theme that works best for your viewing environment and accessibility needs.</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {Object.entries(THEMES).map(([key, th]) => (
            <button key={key} onClick={() => setThemeName(key)}
              style={{ padding:"16px", borderRadius:12, border:`2px solid ${themeName===key ? t.accent : t.border}`, background:themeName===key ? t.accentBg : t.cardBg2,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"left", transition:"all 0.2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ padding:"8px 10px", borderRadius:8, background: key==="dark" ? "#0a1628" : "#f0f9ff", border:`1px solid ${t.border}` }}>
                  <LogoA theme={key} size="icon" />
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:t.textPrimary }}>{th.name}</div>
                  {themeName===key && <div style={{ fontSize:10, color:t.accent, fontWeight:600, marginTop:1 }}>✓ ACTIVE</div>}
                </div>
              </div>
              <div style={{ fontSize:11, color:t.textSecondary, lineHeight:1.4 }}>{th.description}</div>
              {/* Mini preview swatches */}
              <div style={{ display:"flex", gap:4, marginTop:10 }}>
                {[key==="dark"?"#060b14":"#f0f4f8", key==="dark"?"#0a1628":"#ffffff", key==="dark"?"#06b6d4":"#0369a1", key==="dark"?"#ef4444":"#dc2626", key==="dark"?"#22c55e":"#16a34a"].map((color,i) => (
                  <div key={i} style={{ width:18, height:18, borderRadius:4, background:color, border:`1px solid ${t.border}` }}/>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {[
        { title:"Security", items:[["Multi-Factor Authentication","Enabled ✓"],["Session Timeout","30 minutes"],["Encryption","AES-256 at rest · TLS 1.3 in transit"]] },
        { title:"Risk Thresholds", items:[["Polypharmacy Threshold","≥5 medications"],["High Polypharmacy","≥10 medications"],["Review Reminder","90 days"],["Missed Dose Alert","3+ in 7 days"]] },
        { title:"Compliance", items:[["HIPAA Mode","Enabled"],["PHI in Notifications","Disabled"],["Audit Logging","All actions"],["Access Control","Role-based (RBAC)"]] },
      ].map(section=>(
        <div key={section.title} style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <SectionTitle>{section.title}</SectionTitle>
          {section.items.map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${t.border}` }}>
              <span style={{ color:t.textSecondary, fontSize:13 }}>{k}</span>
              <span style={{ color:t.success, fontSize:13, fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── New Case Modal ───────────────────────────────────────────────────────────
function NewCaseModal({ onClose, onSave }) {
  const t = useTheme();
  const [data, setData] = useState({ name:"", age:"", dob:"", mrn:"", conditions:"", physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills" });
  const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };
  return (
    <ThemedModal title="New Patient Case" onClose={onClose} onSave={()=>{if(data.name&&data.age)onSave({...data,age:parseInt(data.age),conditions:data.conditions.split(",").map(s=>s.trim()).filter(Boolean)});}}>
      <ThemedField label="Full Name"><input value={data.name} onChange={e=>setData(p=>({...p,name:e.target.value}))} placeholder="Patient full name" style={inputStyle}/></ThemedField>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <ThemedField label="Age"><input type="number" value={data.age} onChange={e=>setData(p=>({...p,age:e.target.value}))} placeholder="e.g. 72" style={inputStyle}/></ThemedField>
        <ThemedField label="Date of Birth"><input type="date" value={data.dob} onChange={e=>setData(p=>({...p,dob:e.target.value}))} style={inputStyle}/></ThemedField>
      </div>
      <ThemedField label="MRN"><input value={data.mrn} onChange={e=>setData(p=>({...p,mrn:e.target.value}))} placeholder="MRN-XXXX" style={inputStyle}/></ThemedField>
      <ThemedField label="Conditions (comma-separated)"><input value={data.conditions} onChange={e=>setData(p=>({...p,conditions:e.target.value}))} placeholder="e.g. Hypertension, Diabetes" style={inputStyle}/></ThemedField>
    </ThemedModal>
  );
}

function ThemedField({ label, children }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, color:t.textMuted, fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
      {children}
    </div>
  );
}

function ThemedModal({ title, onClose, onSave, children }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex",
        alignItems: isMobile ? "flex-end" : "center", justifyContent:"center",
        zIndex:100, padding: isMobile ? 0 : 24 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:t.modalBg, border:`1px solid ${t.border}`,
          borderRadius: isMobile ? "16px 16px 0 0" : "16px",
          padding: isMobile ? "20px 20px 36px" : "28px",
          width:"100%", maxWidth: isMobile ? "100%" : "480px",
          maxHeight: isMobile ? "88vh" : "85vh", overflowY:"auto",
          boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {isMobile && <div style={{ width:36, height:4, borderRadius:2, background:t.borderStrong, margin:"0 auto 16px" }}/>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:700, color:t.textPrimary }}>{title}</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:t.textMuted, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        {children}
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent: isMobile ? "stretch" : "flex-end" }}>
          <button onClick={onClose} style={{ flex: isMobile?1:0, padding:"10px 18px", borderRadius:8, border:`1px solid ${t.borderStrong}`, background:t.btnSecondaryBg, color:t.textSecondary, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={onSave} style={{ flex: isMobile?1:0, padding:"10px 18px", borderRadius:8, border:"none", background:t.btnPrimary, color:t.btnPrimaryText, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
