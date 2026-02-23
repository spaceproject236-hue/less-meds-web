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
function LessMedsDashboard() {
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

      <div style={{ fontWeight:600, color:t.textMuted, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>All Cases</div>
      <div style={{ marginBottom:16 }}>
        <PatientSearchBar cases={cases} onSelect={onSelect} placeholder="Quick patient search — name, MRN, medication, condition…" />
      </div>
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
// ─── Patient Search Bar ──────────────────────────────────────────────────────
// Reusable across Cases, Dashboard, Recommendations.
// Searches: name · MRN · DOB · age · physician · pharmacist ·
//           coordinator · conditions · medication names · status
function PatientSearchBar({ cases, onSelect, placeholder }) {
  const t = useTheme();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const ph = placeholder || "Search patients…";

  // Split into tokens so "patel warfarin" matches patients with Dr. Patel AND Warfarin
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const results = tokens.length === 0 ? [] : cases.filter(c => {
    const haystack = [
      c.name,
      c.mrn,
      String(c.age),
      c.dob || "",
      c.physician || "",
      c.pharmacist || "",
      c.coordinator || "",
      c.status || "",
      ...(c.conditions || []),
      ...(c.medications || []).map(m => m.name),
      ...(c.medications || []).map(m => m.class || ""),
    ].join(" ").toLowerCase();
    return tokens.every(tok => haystack.includes(tok));
  }).slice(0, 8);

  // Wraps matched tokens in a yellow highlight span
  function hl(text) {
    if (!tokens.length || !text) return text;
    const parts = String(text).split(
      new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")
    );
    return parts.map((p, i) =>
      tokens.some(tok => p.toLowerCase() === tok)
        ? <mark key={i} style={{ background: t.accent + "44", color: t.accent, borderRadius: 2, padding: "0 1px", fontWeight: 700 }}>{p}</mark>
        : p
    );
  }

  const showResults = focused && query.trim().length > 0;
  const showHints   = focused && !query.trim();

  return (
    <div style={{ position: "relative" }}>
      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: t.inputBg,
        border: `1.5px solid ${focused ? t.accent : t.border}`,
        borderRadius: 10, padding: "9px 14px",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: focused ? `0 0 0 3px ${t.accent}18` : "none",
      }}>
        <span style={{ color: t.textMuted, fontSize: 15, flexShrink: 0 }}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={e => {
            if (e.key === "Escape") { setQuery(""); setFocused(false); }
            if (e.key === "Enter" && results.length === 1) { onSelect(results[0].id); setQuery(""); setFocused(false); }
          }}
          placeholder={ph}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: t.textPrimary, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}
          autoComplete="off" spellCheck="false"
        />
        {query && (
          <button onClick={() => setQuery("")}
            style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        )}
      </div>

      {/* Dropdown panel */}
      {(showResults || showHints) && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
          background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.28)", overflow: "hidden",
        }}>

          {/* Hints (empty query, just focused) */}
          {showHints && (
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Search by any of these</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  ["👤","Patient name","e.g. Whitmore"],
                  ["🪪","MRN","e.g. MRN-4421"],
                  ["🎂","Date of birth","e.g. 1946-03-14"],
                  ["💊","Medication","e.g. Warfarin"],
                  ["🏥","Condition","e.g. Diabetes"],
                  ["👨‍⚕️","Physician","e.g. Dr. Patel"],
                  ["🧪","Pharmacist","e.g. Pharm. Chen"],
                  ["📋","Drug class","e.g. Statin"],
                ].map(([icon, label, hint]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 8, background: t.cardBg2, border: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, lineHeight: 1.2 }}>{label}</div>
                      <div style={{ fontSize: 10, color: t.textMuted }}>{hint}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: t.textMuted }}>Tip: combine terms — <em>"patel warfarin"</em> finds patients on Warfarin under Dr. Patel</div>
            </div>
          )}

          {/* Results */}
          {showResults && (results.length === 0 ? (
            <div style={{ padding: "18px 16px", color: t.textMuted, fontSize: 13, textAlign: "center" }}>
              No patients match <strong style={{ color: t.textSecondary }}>"{query}"</strong>
              <div style={{ fontSize: 11, marginTop: 4 }}>Try name, MRN, condition, medication, or physician</div>
            </div>
          ) : (
            <>
              <div style={{ padding: "8px 16px 6px", fontSize: 10, color: t.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>
                {results.length} match{results.length !== 1 ? "es" : ""} · press Enter to open if only one result
              </div>
              {results.map(c => {
                const critCount   = c.flags.filter(f => f.sev === "high").length;
                const matchedMeds = (c.medications || []).filter(m =>
                  tokens.some(tok => m.name.toLowerCase().includes(tok) || (m.class || "").toLowerCase().includes(tok))
                ).map(m => m.name);
                const matchedConds = (c.conditions || []).filter(cd =>
                  tokens.some(tok => cd.toLowerCase().includes(tok))
                );
                return (
                  <div key={c.id}
                    onMouseDown={() => { onSelect(c.id); setQuery(""); setFocused(false); }}
                    style={{ padding: "11px 16px", cursor: "pointer", borderBottom: `1px solid ${t.border}`, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.tableRowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + MRN row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>{hl(c.name)}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: t.accent, background: t.accentBg, padding: "1px 6px", borderRadius: 4 }}>{hl(c.mrn)}</span>
                        </div>
                        {/* Secondary info */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: t.textMuted, marginBottom: 4 }}>
                          <span>Age {c.age}</span>
                          {c.dob && <span>DOB {hl(c.dob)}</span>}
                          <span>{hl(c.physician)}</span>
                          {c.pharmacist && <span>{hl(c.pharmacist)}</span>}
                        </div>
                        {/* Matched medications / conditions chips */}
                        {(matchedMeds.length > 0 || matchedConds.length > 0) && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {matchedMeds.map(m => (
                              <span key={m} style={{ fontSize: 10, padding: "1px 8px", borderRadius: 20, background: t.accentBg, color: t.accent, fontWeight: 600, border: `1px solid ${t.accent}33` }}>💊 {m}</span>
                            ))}
                            {matchedConds.map(cd => (
                              <span key={cd} style={{ fontSize: 10, padding: "1px 8px", borderRadius: 20, background: t.chipBg, color: t.chipText, border: `1px solid ${t.border}` }}>🏥 {cd}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Score + critical badge */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <ScoreBadge score={c.score} />
                        {critCount > 0 && (
                          <span style={{ fontSize: 10, color: t.danger, fontWeight: 700 }}>🔴 {critCount} critical</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cases List ───────────────────────────────────────────────────────────────
function CasesList({ cases, onSelect, onNew }) {
  const t = useTheme();
  const isMobile = useIsMobileCtx();
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy,  setSortBy]  = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  const filtered = cases
    .filter(c => {
      if (riskFilter === "high")     return c.score >= 71;
      if (riskFilter === "moderate") return c.score >= 41 && c.score < 71;
      if (riskFilter === "low")      return c.score < 41;
      if (riskFilter === "critical") return c.flags.filter(f => f.sev === "high").length > 0;
      if (riskFilter === "review")   return c.flags.some(f => f.type === "REVIEW");
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name")   return a.name.localeCompare(b.name) * dir;
      if (sortBy === "score")  return (a.score - b.score) * dir;
      if (sortBy === "age")    return (a.age - b.age) * dir;
      if (sortBy === "meds")   return (a.medications.length - b.medications.length) * dir;
      if (sortBy === "review") return a.lastReview.localeCompare(b.lastReview) * dir;
      if (sortBy === "flags")  return (a.flags.filter(f=>f.sev==="high").length - b.flags.filter(f=>f.sev==="high").length) * dir;
      return 0;
    });

  // Sortable column header
  function SortTh({ col, label, style: extraStyle }) {
    const active = sortBy === col;
    return (
      <th onClick={() => toggleSort(col)}
        style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase",
          cursor:"pointer", userSelect:"none", whiteSpace:"nowrap",
          color: active ? t.accent : t.textMuted,
          ...extraStyle }}>
        {label}
        <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 10 }}>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </th>
    );
  }

  const filterCounts = {
    all:      cases.length,
    critical: cases.filter(c => c.flags.some(f => f.sev === "high")).length,
    high:     cases.filter(c => c.score >= 71).length,
    moderate: cases.filter(c => c.score >= 41 && c.score < 71).length,
    low:      cases.filter(c => c.score < 41).length,
    review:   cases.filter(c => c.flags.some(f => f.type === "REVIEW")).length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: isMobile ? 14 : 20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight:700, color:t.textPrimary, margin:0 }}>Patient Cases</h2>
          <p style={{ color:t.textMuted, fontSize:13, margin:"2px 0 0" }}>
            {filtered.length === cases.length
              ? `${cases.length} active cases`
              : `${filtered.length} of ${cases.length} cases`}
          </p>
        </div>
        <ActionBtn onClick={onNew}>+ New Case</ActionBtn>
      </div>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: 14 }}>
        <PatientSearchBar
          cases={cases}
          onSelect={onSelect}
          placeholder="Search by name, MRN, DOB, medication, condition, physician, drug class…"
        />
      </div>

      {/* ── Risk / review filter pills ── */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom: isMobile ? 14 : 18 }}>
        {[
          { id:"all",      label:"All Cases" },
          { id:"critical", label:"🔴 Critical" },
          { id:"high",     label:"High Risk" },
          { id:"moderate", label:"Moderate" },
          { id:"low",      label:"Low Risk" },
          { id:"review",   label:"⏰ Needs Review" },
        ].map(f => (
          <button key={f.id} onClick={() => setRiskFilter(f.id)} style={{
            padding:"5px 13px", borderRadius:20, fontSize:12,
            fontWeight: riskFilter === f.id ? 700 : 500,
            border:`1px solid ${riskFilter === f.id ? t.accent : t.border}`,
            background: riskFilter === f.id ? t.accentBg : "transparent",
            color: riskFilter === f.id ? t.accent : t.textSecondary,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
          }}>
            {f.label}
            <span style={{ marginLeft:5, opacity:0.6, fontSize:11 }}>({filterCounts[f.id]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState>No patients match this filter.</EmptyState>}

      {/* Mobile: card list */}
      {isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>onSelect(c.id)}
              style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:14, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:t.textPrimary, fontSize:14, marginBottom:2 }}>{c.name}</div>
                <div style={{ color:t.textMuted, fontSize:11 }}>Age {c.age} · {c.mrn} · {c.medications.length} meds · {c.lastReview}</div>
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
        /* Desktop: sortable table */
        <div style={{ background:t.tableBg, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.border}`, background: t.appBg==="#f0f4f8" ? t.cardBg2 : "transparent" }}>
                <SortTh col="name"   label="Patient" />
                <SortTh col="age"    label="Age" />
                <th style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>MRN</th>
                <SortTh col="meds"   label="Medications" />
                <SortTh col="score"  label="Risk Score" />
                <SortTh col="flags"  label="Flags" />
                <SortTh col="review" label="Last Review" />
                <th style={{ padding:"12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>(
                <tr key={c.id} style={{ borderBottom:`1px solid ${t.border}`, cursor:"pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.background=t.tableRowHover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>onSelect(c.id)}>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ fontWeight:600, color:t.textPrimary, fontSize:14 }}>{c.name}</div>
                    <div style={{ color:t.textMuted, fontSize:11, marginTop:2 }}>{c.physician}</div>
                  </td>
                  <td style={{ padding:"14px 16px", color:t.textSecondary, fontSize:13 }}>{c.age}</td>
                  <td style={{ padding:"14px 16px", color:t.accent, fontSize:12, fontFamily:"monospace" }}>{c.mrn}</td>
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
  const [recQuery, setRecQuery] = useState("");
  const [recFocused, setRecFocused] = useState(false);
  const all = cases.flatMap(c => c.recommendations.map(r=>({...r,caseName:c.name,caseId:c.id})));
  const pendingAll = all.filter(r=>r.status==="pending");
  const pending = pendingAll.filter(r => {
    if (!recQuery.trim()) return true;
    const q = recQuery.toLowerCase();
    return (
      r.caseName.toLowerCase().includes(q) ||
      r.drug.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      (r.proposedBy || "").toLowerCase().includes(q) ||
      (r.reason || "").toLowerCase().includes(q)
    );
  });
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 14px" }}>Recommendations</h2>

      {/* Filter search */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14,
        background: t.inputBg, border:`1.5px solid ${recFocused ? t.accent : t.border}`,
        borderRadius:10, padding:"9px 14px", transition:"border-color 0.15s",
        boxShadow: recFocused ? `0 0 0 3px ${t.accent}18` : "none" }}>
        <span style={{ color:t.textMuted, fontSize:14, flexShrink:0 }}>🔍</span>
        <input
          value={recQuery}
          onChange={e=>setRecQuery(e.target.value)}
          onFocus={()=>setRecFocused(true)}
          onBlur={()=>setRecFocused(false)}
          placeholder="Filter by patient name, drug, action type, or proposer…"
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}
        />
        {recQuery && <button onClick={()=>setRecQuery("")} style={{ background:"none", border:"none", color:t.textMuted, cursor:"pointer", fontSize:16, padding:0 }}>×</button>}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, marginBottom:20,
        background: pharmacistMode ? t.accentBg : t.successBg,
        border: `1px solid ${pharmacistMode ? t.accent+"44" : t.successBorder}` }}>
        <span style={{ fontSize:16 }}>{pharmacistMode ? "⚗" : "👤"}</span>
        <span style={{ fontSize:13, color:t.textSecondary }}>
          {pharmacistMode
            ? `${pending.length}${recQuery ? ` of ${pendingAll.length}` : ""} recommendation${pending.length!==1?"s":""} awaiting physician review — proposed by pharmacist`
            : `${pending.length}${recQuery ? ` of ${pendingAll.length}` : ""} recommendation${pending.length!==1?"s":""} pending — Physician-Only mode active`}
        </span>
      </div>
      {pending.length === 0 && <EmptyState>{recQuery ? `No recommendations match "${recQuery}".` : "No pending recommendations."}</EmptyState>}
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


// ═══════════════════════════════════════════════════════════════════════════════
// LESSMEDS MARKETING SITE + B2B ONBOARDING
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Data ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "solo",
    name: "Solo Practice",
    tagline: "For independent physicians",
    seats: "1–3 providers",
    price: 149,
    highlight: false,
    color: "#38bdf8",
    features: [
      "Up to 3 provider seats",
      "Unlimited patient cases",
      "Full risk-scoring engine",
      "Caregiver mobile app sync",
      "1 EHR integration",
      "Email support",
    ],
  },
  {
    id: "practice",
    name: "Group Practice",
    tagline: "For small–mid-size offices",
    seats: "4–25 providers",
    price: 549,
    highlight: true,
    color: "#06b6d4",
    features: [
      "Up to 25 provider seats",
      "Unlimited patient cases",
      "Pharmacist + physician workflow",
      "Caregiver mobile app sync",
      "Up to 3 EHR integrations",
      "Risk analytics dashboard",
      "Priority email & chat support",
    ],
  },
  {
    id: "clinic",
    name: "Multi-Site Clinic",
    tagline: "For growing organizations",
    seats: "26–100 providers",
    price: 1299,
    highlight: false,
    color: "#818cf8",
    features: [
      "Up to 100 provider seats",
      "Multi-site management",
      "Full EHR integration suite",
      "Audit log & HIPAA tools",
      "Population-level reporting",
      "SSO / SAML support",
      "Dedicated onboarding call",
    ],
  },
  {
    id: "health-system",
    name: "Health System",
    tagline: "For hospitals & IDNs",
    seats: "101–500 providers",
    price: 2999,
    highlight: false,
    color: "#34d399",
    features: [
      "Up to 500 provider seats",
      "Unlimited EHR integrations",
      "Custom clinical rule sets",
      "Population analytics suite",
      "SLA 99.9% uptime",
      "Custom reporting & exports",
      "Customer success manager",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For large health networks",
    seats: "500+ providers",
    price: null,
    highlight: false,
    color: "#fb923c",
    features: [
      "Unlimited seats",
      "White-label & custom branding",
      "Dedicated infrastructure",
      "On-site training & implementation",
      "Executive business reviews",
      "24/7 phone support",
      "Custom contract & BAA",
    ],
  },
];

const EHR_OPTIONS = [
  { id: "epic",        name: "Epic",               icon: "⬡", note: "MyChart · SMART on FHIR R4" },
  { id: "cerner",      name: "Oracle Cerner",      icon: "◈", note: "Millennium · HL7 FHIR R4" },
  { id: "athena",      name: "athenahealth",       icon: "◎", note: "athenaNet · REST API" },
  { id: "allscripts",  name: "Allscripts",         icon: "▣", note: "TouchWorks · FHIR" },
  { id: "ecw",         name: "eClinicalWorks",     icon: "◐", note: "eCW FHIR API" },
  { id: "nextgen",     name: "NextGen",            icon: "◍", note: "Enterprise EHR · FHIR" },
  { id: "meditech",    name: "MEDITECH",           icon: "⬟", note: "Expanse · Web API" },
  { id: "pointclick",  name: "PointClickCare",     icon: "◆", note: "LTC · Open API" },
  { id: "manual",      name: "Manual Entry",       icon: "✎", note: "No EHR — enter data manually" },
];

const STATS = [
  { n: "340+",  label: "drug interactions monitored" },
  { n: "94%",   label: "reduction in missed interactions" },
  { n: "4.8×",  label: "faster deprescribing workflow" },
  { n: "HIPAA", label: "compliant · AES-256 encrypted" },
];

const TESTIMONIALS = [
  {
    quote: "LessMeds caught a Warfarin–Aspirin interaction I had missed for three months. The risk score flagged it on the first import.",
    name: "Dr. Aarav Mehta", role: "Internal Medicine · 8-physician group", initials: "AM",
  },
  {
    quote: "My pharmacist and I now collaborate in one platform. Recommendations, approvals, audit trail — all in one place. Our workflow transformed.",
    name: "Dr. Linda Osei", role: "Family Medicine · Solo practice", initials: "LO",
  },
  {
    quote: "Families actually use the caregiver app. We get symptom reports before patients even call the office. That alone is worth it.",
    name: "Sarah Kim, PharmD", role: "Clinical Pharmacist · Community Health", initials: "SK",
  },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

const S = {
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: "1.5px solid #1e3a5f", background: "#071428",
    color: "#e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  },
  label: {
    display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
    textTransform: "uppercase", color: "#64748b", marginBottom: 6,
  },
  card: {
    background: "#071428", border: "1px solid #1e3a5f",
    borderRadius: 14, padding: 24,
  },
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function FocusInput({ style: extra, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{ ...S.input, borderColor: focused ? "#06b6d4" : "#1e3a5f", boxShadow: focused ? "0 0 0 3px rgba(6,182,212,0.12)" : "none", ...extra }}
    />
  );
}

function FocusSelect({ style: extra, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{ ...S.input, cursor: "pointer", borderColor: focused ? "#06b6d4" : "#1e3a5f", boxShadow: focused ? "0 0 0 3px rgba(6,182,212,0.12)" : "none", ...extra }}
    />
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ size = "md", siteTheme = "dark" }) {
  const dark = siteTheme !== "light";
  const sz = size === "sm" ? 22 : 28;
  const fsz = size === "sm" ? 17 : 21;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, userSelect: "none" }}>
      <div style={{ width: sz, height: sz, borderRadius: sz * 0.28, background: "linear-gradient(135deg,#06b6d4 0%,#2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.55, flexShrink: 0, boxShadow: "0 0 16px rgba(6,182,212,0.4)" }}>
        💊
      </div>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: fsz, letterSpacing: -0.5, color: dark ? "#f1f5f9" : "#0f172a", lineHeight: 1 }}>
        Less<span style={{ color: "#06b6d4" }}>Meds</span>
      </span>
    </div>
  );
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────

function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, fontFamily: "'DM Sans', sans-serif" }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, transition: "all 0.25s",
                background: done ? "#06b6d4" : active ? "rgba(6,182,212,0.15)" : "transparent",
                border: `2px solid ${done || active ? "#06b6d4" : "#1e3a5f"}`,
                color: done ? "#000" : active ? "#06b6d4" : "#475569",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? "#e2e8f0" : done ? "#94a3b8" : "#475569", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? "#06b6d4" : "#1e3a5f", margin: "0 10px", minWidth: 20, transition: "background 0.25s" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Marketing Nav ────────────────────────────────────────────────────────────

function MarketingNav({ onClinicianSignup, onConsumer, onPharmacist, siteTheme, setSiteTheme }) {
  const [scrolled, setScrolled] = React.useState(false);
  const dark = siteTheme === "dark";
  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navBg = scrolled
    ? dark ? "rgba(4,10,22,0.95)" : "rgba(248,250,252,0.95)"
    : "transparent";
  const borderC = scrolled ? (dark ? "#1e3a5f" : "#e2e8f0") : "transparent";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: navBg, backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: `1px solid ${borderC}`, transition: "all 0.3s", padding: "0 32px",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo siteTheme={siteTheme} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Theme toggle */}
          <button onClick={() => setSiteTheme(dark ? "light" : "dark")}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${dark ? "#1e3a5f" : "#e2e8f0"}`, background: dark ? "#071428" : "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.2s", flexShrink: 0 }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <button onClick={onPharmacist} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${dark ? "#1e3a5f" : "#e2e8f0"}`, borderRadius: 8, color: dark ? "#94a3b8" : "#475569", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.color = "#8b5cf6"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? "#1e3a5f" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#94a3b8" : "#475569"; }}>
            For Pharmacists
          </button>
          <button onClick={onConsumer} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${dark ? "#1e3a5f" : "#e2e8f0"}`, borderRadius: 8, color: dark ? "#94a3b8" : "#475569", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.color = "#06b6d4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? "#1e3a5f" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#94a3b8" : "#475569"; }}>
            For Families
          </button>
          <button onClick={onClinicianSignup} style={{ padding: "9px 20px", background: "#06b6d4", border: "none", borderRadius: 8, color: "#001a24", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 0 24px rgba(6,182,212,0.35)", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#22d3ee"}
            onMouseLeave={e => e.currentTarget.style.background = "#06b6d4"}>
            Clinician Sign Up →
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ onClinicianSignup, onConsumer, st }) {
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 80px", position: "relative", overflow: "hidden", background: st.pageBg, transition: "background 0.3s" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${st.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${st.gridLine} 1px, transparent 1px)`, backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "18%", left: "8%", width: 600, height: 600, background: `radial-gradient(circle, ${st.glow1} 0%, transparent 65%)`, borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "6%", width: 500, height: 500, background: `radial-gradient(circle, ${st.glow2} 0%, transparent 65%)`, borderRadius: "50%", pointerEvents: "none" }} />

      <div style={{ maxWidth: 820, textAlign: "center", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: st.accentSoft, border: `1px solid ${st.accentBorder}`, borderRadius: 30, padding: "6px 18px", marginBottom: 36 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#06b6d4", display: "inline-block", animation: "lm-pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, color: "#06b6d4", fontWeight: 600, letterSpacing: 0.5 }}>HIPAA Compliant · Now in early access</span>
        </div>

        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(40px,6.5vw,78px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: -2.5, color: st.textPrimary, margin: "0 0 28px", transition: "color 0.3s" }}>
          Safer medication<br />
          <span style={{ background: "linear-gradient(100deg,#06b6d4 0%,#2563eb 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            management.
          </span>
        </h1>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(16px,2.2vw,21px)", color: st.textMuted, lineHeight: 1.75, maxWidth: 580, margin: "0 auto 52px", fontWeight: 400, transition: "color 0.3s" }}>
          LessMeds helps family practices and health systems detect dangerous drug combinations, coordinate deprescribing, and keep families informed — in one clinical workflow.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onClinicianSignup} style={{ padding: "16px 38px", background: "#06b6d4", border: "none", borderRadius: 10, color: "#001a24", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 0 40px rgba(6,182,212,0.3)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#22d3ee"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#06b6d4"; e.currentTarget.style.transform = "none"; }}>
            Start free trial — clinicians →
          </button>
          <button onClick={onConsumer} style={{ padding: "16px 38px", background: "transparent", border: `1.5px solid ${st.border}`, borderRadius: 10, color: st.textSecondary, fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.color = st.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = st.border; e.currentTarget.style.color = st.textSecondary; }}>
            Free medication check →
          </button>
        </div>

        <div style={{ marginTop: 64, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: st.textMuted, letterSpacing: 1, textTransform: "uppercase", marginRight: 4 }}>Integrates with</span>
          {["Epic", "Cerner", "athenahealth", "NextGen", "eClinicalWorks"].map(name => (
            <span key={name} style={{ padding: "4px 12px", background: st.accentSoft, border: `1px solid ${st.border}`, borderRadius: 6, fontSize: 11, color: st.textMuted, fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s" }}>{name}</span>
          ))}
          <span style={{ fontSize: 11, color: st.textDim, fontFamily: "'DM Sans', sans-serif" }}>+ more</span>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsBar({ st }) {
  return (
    <div style={{ background: st.pageBg2, borderTop: `1px solid ${st.border}`, borderBottom: `1px solid ${st.border}`, padding: "52px 24px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 32, textAlign: "center" }}>
        {STATS.map(s => (
          <div key={s.n}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 48, fontWeight: 900, color: "#06b6d4", letterSpacing: -2, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: st.textMuted, marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection({ st }) {
  const features = [
    { icon: "◎", color: "#06b6d4", title: "Automated risk scoring", body: "Every patient gets a dynamic polypharmacy risk score — recalculated in real time from medication count, interactions, Beers Criteria flags, and missed dose patterns." },
    { icon: "⚗", color: "#818cf8", title: "Pharmacist + physician workflow", body: "Pharmacists propose deprescribing recommendations. Physicians review and approve with one click. Full audit trail for every decision." },
    { icon: "📱", color: "#34d399", title: "Caregiver mobile sync", body: "Family caregivers log symptoms, receive alerts, and message the care team directly — all HIPAA-compliant and tied to the patient's chart." },
    { icon: "⬡", color: "#fb923c", title: "EHR integration", body: "Connect to Epic, Cerner, athenahealth, and more. Medication lists, diagnoses, and labs sync automatically on every visit." },
    { icon: "◈", color: "#f472b6", title: "Real-time drug alerts", body: "Critical interactions and high-risk prescriptions surface the moment they're detected — not buried in a monthly report." },
    { icon: "▣", color: "#38bdf8", title: "HIPAA audit log", body: "Every recommendation, approval, and edit is timestamped and attributed. Compliance documentation is always up to date." },
  ];
  return (
    <section style={{ padding: "100px 24px", background: st.pageBg, transition: "background 0.3s" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 68 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#06b6d4", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>What's included</p>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(28px,4vw,50px)", fontWeight: 900, letterSpacing: -1.5, color: st.textPrimary, margin: 0, lineHeight: 1.1, transition: "color 0.3s" }}>
            Built for the clinical team.<br /><span style={{ color: st.textDim, fontWeight: 300 }}>Not just the administrator.</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: st.cardBg, border: `1px solid ${st.border}`, borderRadius: 16, padding: 28, transition: "all 0.2s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + "66"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = st.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: f.color + "18", border: `1px solid ${f.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 20 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: st.textPrimary, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: st.textMuted, lineHeight: 1.75 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection({ st }) {
  return (
    <section style={{ padding: "100px 24px", background: st.pageBg2, borderTop: `1px solid ${st.border}`, transition: "background 0.3s" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#818cf8", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>From the field</p>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(26px,3.5vw,46px)", fontWeight: 900, letterSpacing: -1.5, color: st.textPrimary, margin: 0, transition: "color 0.3s" }}>Trusted by clinicians who care.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: st.cardBg2, border: `1px solid ${st.border}`, borderRadius: 16, padding: 30, transition: "background 0.3s" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 36, color: "#06b6d4", lineHeight: 1, marginBottom: 18, opacity: 0.6 }}>"</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: st.textSecondary, lineHeight: 1.85, margin: "0 0 28px", fontStyle: "italic" }}>{t.quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: st.textPrimary }}>{t.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: st.textMuted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function PricingSection({ onSelectPlan, st }) {
  return (
    <section id="pricing" style={{ padding: "100px 24px 80px", background: st.pageBg, transition: "background 0.3s" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#06b6d4", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Transparent pricing</p>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(28px,4vw,50px)", fontWeight: 900, letterSpacing: -1.5, color: st.textPrimary, margin: "0 0 14px", transition: "color 0.3s" }}>Plans for every practice size.</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: st.textMuted, margin: 0 }}>14-day free trial. No credit card required. Cancel anytime.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, alignItems: "start" }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{ position: "relative", background: st.cardBg, border: `2px solid ${plan.highlight ? plan.color : st.border}`, borderRadius: 18, padding: "28px 24px", transition: "all 0.2s", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 48px ${plan.color}1a`; e.currentTarget.style.borderColor = plan.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = plan.highlight ? plan.color : st.border; }}>

              {plan.highlight && (
                <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#001a24", fontSize: 10, fontWeight: 800, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 0.8, fontFamily: "'DM Sans', sans-serif" }}>MOST POPULAR</div>
              )}

              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: plan.color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{plan.seats}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: st.textPrimary, marginBottom: 2 }}>{plan.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: st.textMuted, marginBottom: 20 }}>{plan.tagline}</div>

              <div style={{ borderTop: `1px solid ${st.border}`, paddingTop: 20, marginBottom: 20 }}>
                {plan.price ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 40, fontWeight: 900, color: plan.color, letterSpacing: -2, lineHeight: 1 }}>${plan.price.toLocaleString()}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: st.textMuted }}>/mo</span>
                  </div>
                ) : (
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 900, color: plan.color }}>Custom</div>
                )}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 9 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: st.textSecondary, alignItems: "flex-start", lineHeight: 1.4 }}>
                    <span style={{ color: plan.color, flexShrink: 0, fontWeight: 700, marginTop: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>

              <button onClick={() => onSelectPlan(plan)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", border: `1.5px solid ${plan.color}`, background: plan.highlight ? plan.color : "transparent", color: plan.highlight ? "#001a24" : plan.color }}>
                {plan.id === "enterprise" ? "Contact sales →" : "Start free trial →"}
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", textAlign: "center", color: st.textDim, fontSize: 13, marginTop: 40 }}>
          All plans include HIPAA-compliant data handling, AES-256 encryption, and caregiver mobile app access.
        </p>
      </div>
    </section>
  );
}

// ─── Consumer CTA ──────────────────────────────────────────────────────────────

function ConsumerSection({ st }) {
  return (
    <section style={{ padding: "100px 24px", background: st.pageBg2, borderTop: `1px solid ${st.border}`, transition: "background 0.3s" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#34d399,#059669)", margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 0 32px rgba(52,211,153,0.25)" }}>📱</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#34d399", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>For families & caregivers</p>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(26px,3.5vw,46px)", fontWeight: 900, letterSpacing: -1.5, color: st.textPrimary, margin: "0 0 20px", lineHeight: 1.12, transition: "color 0.3s" }}>
          Free medication safety check.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: st.textMuted, lineHeight: 1.8, margin: "0 0 44px" }}>
          Enter any medication list and get an instant risk score — no account needed. If your physician uses LessMeds, the app connects directly to their care team for real-time coordination.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 30 }}>
          {[
            { label: "App Store", icon: "🍎", sub: "Download on the" },
            { label: "Google Play", icon: "▶", sub: "Get it on" },
          ].map(btn => (
            <a key={btn.label} href="#" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", background: "#040a16", border: "1.5px solid #1e3a5f", borderRadius: 12, textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.background = "rgba(6,182,212,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = st.border; e.currentTarget.style.background = st.cardBg2; }}>
              <span style={{ fontSize: 26 }}>{btn.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{btn.sub}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: st.textPrimary }}>{btn.label}</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {["Free — always", "No account required", "HIPAA-safe"].map(t => (
            <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: st.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#34d399" }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function SiteFooter({ onClinicianSignup, st }) {
  return (
    <footer style={{ background: st.pageBg, borderTop: `1px solid ${st.border}`, transition: "background 0.3s", padding: "56px 32px 36px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40, marginBottom: 48 }}>
          <div style={{ maxWidth: 280 }}>
            <Logo siteTheme={st.dark ? "dark" : "light"} />
            <p style={{ fontSize: 13, color: st.textMuted, lineHeight: 1.7, marginTop: 14 }}>Clinical-grade polypharmacy management for family practices and health systems.</p>
            <button onClick={onClinicianSignup} style={{ marginTop: 20, padding: "9px 20px", background: "#06b6d4", border: "none", borderRadius: 8, color: "#001a24", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Start free trial →
            </button>
          </div>
          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            {[
              { heading: "Product", links: ["Features", "Pricing", "EHR Integrations", "Security & HIPAA", "Changelog"] },
              { heading: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "BAA", "HIPAA Notice"] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: st.textDim, marginBottom: 16 }}>{col.heading}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: st.textMuted, marginBottom: 11, cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#06b6d4"}
                    onMouseLeave={e => e.currentTarget.style.color = st.textMuted}>{l}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: st.textDim }}>© 2026 LessMeds Inc. All rights reserved.</span>
          <span style={{ fontSize: 12, color: st.textDim }}>HIPAA Compliant · AES-256 · TLS 1.3 · SOC 2 Type II In Progress</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Marketing Site ──────────────────────────────────────────────────────────

// ─── Video Section ────────────────────────────────────────────────────────────
function VideoSection({ st }) {
  const [playing, setPlaying] = React.useState(false);
  // Dr. DeLon's intro video - replace VIDEO_ID with actual YouTube ID at launch
  const VIDEO_ID = "L771z-GnmHM";

  return (
    <section style={{ padding: "100px 24px", background: st.pageBg2, borderTop: `1px solid ${st.border}`, transition: "background 0.3s" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "5px 14px", marginBottom: 18 }}>
            <span style={{ fontSize: 12 }}>🎥</span>
            <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>From our founder</span>
          </div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(26px,3.5vw,46px)", fontWeight: 900, letterSpacing: -1.5, color: st.textPrimary, margin: "0 0 16px", lineHeight: 1.12, transition: "color 0.3s" }}>
            Why we built LessMeds.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: st.textMuted, lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
                  Dr. DeLon Canterbury, PharmD explains the polypharmacy crisis in America and how LessMeds is designed to solve it — for clinicians, families, and the patients caught in between.
          </p>
        </div>

        {/* Video embed */}
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "#000", boxShadow: `0 32px 80px rgba(0,0,0,${st.dark ? 0.5 : 0.15})`, border: `1px solid ${st.border}` }}>
          {!playing ? (
            /* Thumbnail / poster state */
            <div style={{ position: "relative", paddingBottom: "56.25%", background: "linear-gradient(135deg, #071428 0%, #0d1b35 100%)", cursor: "pointer" }} onClick={() => setPlaying(true)}>
              {/* YouTube thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
                alt="Dr. DeLon Canterbury — LessMeds Introduction"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                onError={e => { e.target.style.display = "none"; }}
              />
              {/* Dark overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(4,10,22,0.3), rgba(4,10,22,0.6))" }} />

              {/* Placeholder content when no thumb */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                {/* Play button */}
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 16px rgba(6,182,212,0.15), 0 0 0 32px rgba(6,182,212,0.07)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 0 0 20px rgba(6,182,212,0.2), 0 0 0 40px rgba(6,182,212,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 0 16px rgba(6,182,212,0.15), 0 0 0 32px rgba(6,182,212,0.07)"; }}>
                  <span style={{ fontSize: 28, marginLeft: 6, color: "#001a24" }}>▶</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Dr. DeLon Canterbury, PharmD</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94a3b8" }}>Founder & Chief Pharmacist Officer · LessMeds</div>
                </div>
              </div>

              {/* Duration badge */}
              <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.75)", borderRadius: 5, padding: "3px 8px", fontSize: 12, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                3:47
              </div>
            </div>
          ) : (
            /* Active YouTube embed */
            <div style={{ position: "relative", paddingBottom: "56.25%" }}>
              <iframe
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1`}
                title="Dr. DeLon Canterbury — LessMeds Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Below-video meta */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 28, flexWrap: "wrap" }}>
          {[
            { icon: "⏱", text: "3 min 47 sec" },
            { icon: "📚", text: "Why polypharmacy is America's hidden crisis" },
            { icon: "💡", text: "How LessMeds helps your practice" },
          ].map(item => (
            <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: st.textMuted }}>
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pharmacist Network Section ───────────────────────────────────────────────
function PharmacistNetworkSection({ onPharmacist, st }) {
  const perks = [
    { icon: "💰", title: "Get paid per review", body: "Earn $35–$85 per completed medication review, deposited bi-weekly to your bank account via direct deposit." },
    { icon: "📋", title: "Structured review workflow", body: "Each case comes pre-loaded with the patient's full medication list, diagnoses, labs, and risk flags — ready for your clinical assessment." },
    { icon: "⚗", title: "Propose deprescribing recs", body: "Submit structured recommendations that go directly to the prescribing physician for approval. Every action is documented in the audit trail." },
    { icon: "🗓", title: "Work on your schedule", body: "Take cases when it fits your schedule. Set your weekly capacity and case preferences. No minimums, no maximums." },
    { icon: "🏥", title: "Work with any practice", body: "LessMeds connects you with family practices, geriatric clinics, and health systems — no cold outreach required." },
    { icon: "📜", title: "CE credit eligible", body: "Select review pathways qualify for continuing pharmacy education credit through our accredited CE partnerships." },
  ];

  return (
    <section style={{ padding: "100px 24px", background: st.pageBg, borderTop: `1px solid ${st.border}`, transition: "background 0.3s" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* Left: copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "5px 14px", marginBottom: 20 }}>
              <span style={{ fontSize: 12 }}>⚗</span>
              <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>For licensed pharmacists</span>
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: st.textPrimary, margin: "0 0 20px", lineHeight: 1.1, transition: "color 0.3s" }}>
              Join the LessMeds<br />
              <span style={{ background: "linear-gradient(100deg, #818cf8, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Pharmacist Network.
              </span>
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: st.textMuted, lineHeight: 1.8, marginBottom: 32 }}>
              LessMeds connects licensed pharmacists with physician practices for structured, paid medication reviews. You use your clinical expertise to improve patient safety — and get compensated fairly for it.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {[
                ["$35 – $85", "per completed medication review"],
                ["Bi-weekly", "direct deposit payouts"],
                ["100%", "remote — work from anywhere licensed"],
              ].map(([val, label]) => (
                <div key={val} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: "#818cf8", minWidth: 80 }}>{val}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: st.textSecondary }}>{label}</span>
                </div>
              ))}
            </div>

            <button onClick={onPharmacist}
              style={{ padding: "16px 36px", background: "#8b5cf6", border: "none", borderRadius: 11, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 0 32px rgba(139,92,246,0.3)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.transform = "none"; }}>
              Apply to the network →
            </button>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: st.textMuted, marginTop: 12 }}>
              PharmD or RPh license required · Takes ~5 minutes to apply
            </div>
          </div>

          {/* Right: perk cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {perks.map(p => (
              <div key={p.title} style={{ background: st.cardBg, border: `1px solid ${st.border}`, borderRadius: 14, padding: "18px 16px", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#818cf644"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = st.border; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{p.icon}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: st.textPrimary, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: st.textMuted, lineHeight: 1.65 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Light/Dark theme tokens for marketing site ───────────────────────────────
function mkSiteTheme(mode) {
  const dark = mode === "dark";
  return {
    dark,
    pageBg:       dark ? "#040a16"  : "#f8fafc",
    pageBg2:      dark ? "#071428"  : "#ffffff",
    border:       dark ? "#1e3a5f"  : "#e2e8f0",
    borderSub:    dark ? "#0d2040"  : "#f1f5f9",
    textPrimary:  dark ? "#f1f5f9"  : "#0f172a",
    textSecondary:dark ? "#94a3b8"  : "#475569",
    textMuted:    dark ? "#475569"  : "#94a3b8",
    textDim:      dark ? "#334155"  : "#cbd5e1",
    cardBg:       dark ? "#071428"  : "#ffffff",
    cardBg2:      dark ? "#040a16"  : "#f8fafc",
    inputBg:      dark ? "#071428"  : "#ffffff",
    accent:       "#06b6d4",
    accentSoft:   dark ? "rgba(6,182,212,0.08)"  : "rgba(6,182,212,0.06)",
    accentBorder: dark ? "rgba(6,182,212,0.25)"  : "rgba(6,182,212,0.35)",
    gridLine:     dark ? "rgba(30,58,95,0.18)"   : "rgba(148,163,184,0.15)",
    glow1:        dark ? "rgba(6,182,212,0.07)"  : "rgba(6,182,212,0.05)",
    glow2:        dark ? "rgba(37,99,235,0.06)"  : "rgba(37,99,235,0.04)",
    scrollTrack:  dark ? "#040a16"  : "#f8fafc",
    scrollThumb:  dark ? "#1e3a5f"  : "#e2e8f0",
  };
}

function MarketingSite({ onClinicianSignup, onConsumer, onSelectPlan, onPharmacist }) {
  const [siteTheme, setSiteTheme] = React.useState("dark");
  const st = mkSiteTheme(siteTheme);
  return (
    <div style={{ background: st.pageBg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <style>{`
        @keyframes lm-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${st.scrollTrack}}
        ::-webkit-scrollbar-thumb{background:${st.scrollThumb};border-radius:3px}
      `}</style>
      <MarketingNav onClinicianSignup={onClinicianSignup} onConsumer={onConsumer} onPharmacist={onPharmacist} siteTheme={siteTheme} setSiteTheme={setSiteTheme} />
      <HeroSection onClinicianSignup={onClinicianSignup} onConsumer={onConsumer} st={st} />
      <StatsBar st={st} />
      <VideoSection st={st} />
      <FeaturesSection st={st} />
      <TestimonialsSection st={st} />
      <PricingSection onSelectPlan={onSelectPlan} st={st} />
      <PharmacistNetworkSection onPharmacist={onPharmacist} st={st} />
      <ConsumerSection st={st} />
      <SiteFooter onClinicianSignup={onClinicianSignup} st={st} />
    </div>
  );
}

// ─── Consumer Modal ───────────────────────────────────────────────────────────

function ConsumerModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: 20, padding: "40px 36px", maxWidth: 460, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📱</div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 14, letterSpacing: -0.5 }}>Free Medication Check</h2>
        <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.75, marginBottom: 36 }}>
          The LessMeds family app lets you enter any medication list and instantly see polypharmacy risks — completely free. Download on your phone to get started.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {[{ label: "App Store", icon: "🍎" }, { label: "Google Play", icon: "▶" }].map(btn => (
            <a key={btn.label} href="#" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 22px", background: "#040a16", border: "1.5px solid #1e3a5f", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>
              <span style={{ fontSize: 22 }}>{btn.icon}</span>{btn.label}
            </a>
          ))}
        </div>
        <div style={{ background: "#040a16", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Is your doctor using LessMeds?</div>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>Ask your physician's office for a caregiver access code. The app will connect directly to their clinical dashboard for coordinated care.</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Back to site</button>
      </div>
    </div>
  );
}

// ─── Enterprise Contact Modal ─────────────────────────────────────────────────

function EnterpriseModal({ onClose }) {
  const [f, setF] = useState({ name: "", title: "", email: "", phone: "", org: "", size: "", notes: "" });
  const [sent, setSent] = useState(false);
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const valid = f.name && f.email && f.org;

  function submit() {
    if (!valid) return;
    setSent(true);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: 20, padding: "40px 36px", maxWidth: 520, width: "100%", maxHeight: "92vh", overflowY: "auto" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, color: "#f1f5f9", marginBottom: 12 }}>Message received.</h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>Our enterprise team will be in touch within one business day to schedule a discovery call.</p>
            <button onClick={onClose} style={{ padding: "12px 28px", background: "#06b6d4", border: "none", borderRadius: 9, color: "#001a24", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "#fb923c", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Enterprise · 500+ providers</div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, letterSpacing: -0.5 }}>Talk to our sales team</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>Custom pricing, dedicated implementation, and white-glove onboarding for large health systems and networks.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Full Name *"><FocusInput value={f.name} onChange={u("name")} placeholder="Dr. Jane Smith" /></Field>
              <Field label="Title / Role"><FocusInput value={f.title} onChange={u("title")} placeholder="CMO, Medical Director…" /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Work Email *"><FocusInput type="email" value={f.email} onChange={u("email")} placeholder="jane@healthsystem.org" /></Field>
              <Field label="Phone"><FocusInput type="tel" value={f.phone} onChange={u("phone")} placeholder="(555) 000-0000" /></Field>
            </div>
            <Field label="Organization Name *"><FocusInput value={f.org} onChange={u("org")} placeholder="Health system or hospital name" /></Field>
            <Field label="Approximate Provider Count">
              <FocusSelect value={f.size} onChange={u("size")}>
                <option value="">Select…</option>
                <option>500 – 1,000</option><option>1,000 – 5,000</option>
                <option>5,000 – 20,000</option><option>20,000+</option>
              </FocusSelect>
            </Field>
            <Field label="Tell us about your needs">
              <textarea value={f.notes} onChange={u("notes")} placeholder="Current EHR, key pain points, timeline…" rows={4}
                style={{ ...S.input, resize: "vertical", lineHeight: 1.65 }} />
            </Field>

            <button onClick={submit} disabled={!valid}
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: valid ? "#fb923c" : "#1e3a5f", color: valid ? "#001a24" : "#334155", fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
              Send to sales team →
            </button>
            <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "#334155", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Signup: Step 1 — Plan Confirm ────────────────────────────────────────────

function StepPlanConfirm({ plan, onNext, onChangePlan }) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, letterSpacing: -0.5 }}>Your plan</h2>
        <p style={{ fontSize: 14, color: "#475569" }}>Confirm the plan you'd like to start with. You can upgrade or downgrade at any time.</p>
      </div>

      <div style={{ background: "#071428", border: `2px solid ${plan.color}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: plan.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{plan.seats}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, color: "#f1f5f9" }}>{plan.name}</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{plan.tagline}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 42, fontWeight: 900, color: plan.color, letterSpacing: -2, lineHeight: 1 }}>${plan.price.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>per month</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
          {plan.features.map(f => (
            <div key={f} style={{ display: "flex", gap: 9, fontSize: 13, color: "#64748b", alignItems: "flex-start" }}>
              <span style={{ color: plan.color, flexShrink: 0 }}>✓</span>{f}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, padding: "10px 14px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 8, fontSize: 12, color: "#475569" }}>
          14-day free trial · No credit card required · Cancel anytime
        </div>
      </div>

      <button onClick={onNext} style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: "#06b6d4", color: "#001a24", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
        Continue → Practice information
      </button>
      <button onClick={onChangePlan} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "1px solid #1e3a5f", background: "transparent", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        ← Choose a different plan
      </button>
    </div>
  );
}

// ─── Signup: Step 2 — Practice Info ──────────────────────────────────────────

function StepPracticeInfo({ onNext, onBack }) {
  const [f, setF] = useState({ practiceName: "", type: "", npi: "", address: "", city: "", state: "", zip: "", adminName: "", adminEmail: "", adminPhone: "" });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const valid = f.practiceName && f.type && f.adminName && f.adminEmail;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, letterSpacing: -0.5 }}>Practice information</h2>
        <p style={{ fontSize: 14, color: "#475569" }}>This sets up your organization in LessMeds and creates your administrator account.</p>
      </div>

      {/* Practice block */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#334155", marginBottom: 20 }}>Practice details</div>
        <Field label="Practice / Organization Name *"><FocusInput value={f.practiceName} onChange={u("practiceName")} placeholder="e.g. Riverside Family Medicine" /></Field>
        <Field label="Practice Type *">
          <FocusSelect value={f.type} onChange={u("type")}>
            <option value="">Select…</option>
            <option>Family Medicine / Primary Care</option>
            <option>Internal Medicine</option>
            <option>Geriatrics / Gerontology</option>
            <option>Cardiology</option>
            <option>Community Health Center / FQHC</option>
            <option>Multi-Specialty Group Practice</option>
            <option>Hospital / Health System</option>
            <option>Long-Term Care / SNF</option>
            <option>Other</option>
          </FocusSelect>
        </Field>
        <Field label="NPI Number (optional)"><FocusInput value={f.npi} onChange={u("npi")} placeholder="1234567890" maxLength={10} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12 }}>
          <Field label="City"><FocusInput value={f.city} onChange={u("city")} placeholder="Springfield" /></Field>
          <Field label="State"><FocusInput value={f.state} onChange={u("state")} placeholder="IL" maxLength={2} /></Field>
          <Field label="ZIP"><FocusInput value={f.zip} onChange={u("zip")} placeholder="62701" maxLength={5} /></Field>
        </div>
      </div>

      {/* Admin account block */}
      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#334155", marginBottom: 20 }}>Administrator account</div>
        <Field label="Full Name *"><FocusInput value={f.adminName} onChange={u("adminName")} placeholder="Dr. Jane Smith" /></Field>
        <Field label="Work Email *"><FocusInput type="email" value={f.adminEmail} onChange={u("adminEmail")} placeholder="jane@yourpractice.com" /></Field>
        <Field label="Phone"><FocusInput type="tel" value={f.adminPhone} onChange={u("adminPhone")} placeholder="(555) 000-0000" /></Field>
      </div>

      <button onClick={() => valid && onNext(f)} disabled={!valid}
        style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: valid ? "#06b6d4" : "#1e3a5f", color: valid ? "#001a24" : "#334155", fontSize: 15, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
        Continue → Connect your EHR
      </button>
      <button onClick={onBack} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "1px solid #1e3a5f", background: "transparent", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        ← Back
      </button>
    </div>
  );
}

// ─── Signup: Step 3 — EHR Selection ──────────────────────────────────────────

function StepEhrConnect({ practiceInfo, onComplete, onBack }) {
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);

  const syncSteps = selected?.id === "manual"
    ? ["Creating your workspace…", "Setting up provider accounts…", "Configuring security settings…", "All done!"]
    : [
        `Authenticating with ${selected?.name}…`,
        "Importing patient demographics…",
        "Syncing medication lists…",
        "Importing diagnoses & allergies…",
        "Applying clinical rule sets…",
        "Finalizing setup…",
        "All done!",
      ];

  function startSync() {
    if (!selected) return;
    setSyncing(true);
    let i = 0;
    const tick = () => {
      if (i >= syncSteps.length - 1) { setTimeout(onComplete, 900); return; }
      i++;
      setSyncStep(i);
      setTimeout(tick, 850);
    };
    setTimeout(tick, 700);
  }

  const pct = syncing ? Math.round((syncStep / (syncSteps.length - 1)) * 100) : 0;
  const done = syncing && syncStep === syncSteps.length - 1;

  if (syncing) {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 24 }}>{done ? "🎉" : "⚙️"}</div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 10, letterSpacing: -0.5 }}>
          {done ? "You're all set!" : selected.id === "manual" ? "Setting up workspace…" : `Connecting ${selected.name}…`}
        </h2>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 36 }}>{syncSteps[syncStep]}</p>
        <div style={{ background: "#1e3a5f", borderRadius: 8, height: 8, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(90deg,#06b6d4,#818cf8)", width: `${pct}%`, transition: "width 0.7s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <div style={{ fontSize: 12, color: "#334155" }}>{pct}% complete</div>
        {done && (
          <div style={{ marginTop: 24, padding: "14px 18px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, fontSize: 14, color: "#34d399", fontWeight: 600 }}>
            ✓ Setup complete — opening your dashboard…
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, letterSpacing: -0.5 }}>Connect your EHR</h2>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
          Select your electronic health record system. LessMeds will import patient demographics, medication lists, diagnoses, and labs. You can add or change integrations anytime in Settings.
          <span style={{ display: "block", marginTop: 8, color: "#334155", fontSize: 13 }}>Note: Full API integrations are live at general availability. This demo simulates the connection process.</span>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
        {EHR_OPTIONS.map(ehr => {
          const active = selected?.id === ehr.id;
          return (
            <div key={ehr.id} onClick={() => setSelected(ehr)}
              style={{ background: "#071428", border: `2px solid ${active ? "#06b6d4" : "#1e3a5f"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s", boxShadow: active ? "0 0 0 4px rgba(6,182,212,0.1)" : "none" }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "#334155"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "#1e3a5f"; }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: active ? "rgba(6,182,212,0.15)" : "#040a16", border: `1px solid ${active ? "#06b6d4" : "#1e3a5f"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, transition: "all 0.15s" }}>
                {ehr.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: active ? "#06b6d4" : "#e2e8f0", marginBottom: 2 }}>{ehr.name}</div>
                <div style={{ fontSize: 11, color: "#334155" }}>{ehr.note}</div>
              </div>
              {active && <span style={{ color: "#06b6d4", fontSize: 16, flexShrink: 0 }}>✓</span>}
            </div>
          );
        })}
      </div>

      {selected && selected.id !== "manual" && (
        <div style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.18)", borderRadius: 10, padding: "13px 16px", marginBottom: 20, fontSize: 13, color: "#475569", lineHeight: 1.65 }}>
          <strong style={{ color: "#64748b" }}>{selected.name}</strong> uses OAuth 2.0 / SMART on FHIR for secure authentication. Your patient data never leaves encrypted, HIPAA-compliant channels.
        </div>
      )}

      <button onClick={startSync} disabled={!selected}
        style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: selected ? "#06b6d4" : "#1e3a5f", color: selected ? "#001a24" : "#334155", fontSize: 15, fontWeight: 700, cursor: selected ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
        {selected
          ? selected.id === "manual" ? "Set up workspace →" : `Connect ${selected.name} & launch →`
          : "Select a system above"}
      </button>
      <button onClick={onBack} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "1px solid #1e3a5f", background: "transparent", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        ← Back
      </button>
    </div>
  );
}

// ─── Clinician Signup Shell ───────────────────────────────────────────────────

function ClinicianSignup({ initialPlan, onBack, onComplete }) {
  const [step, setStep] = useState(initialPlan ? 0 : -1); // -1 = choose plan inline
  const [plan, setPlan] = useState(initialPlan || null);
  const [practiceInfo, setPracticeInfo] = useState(null);
  const [showEnterprise, setShowEnterprise] = useState(false);

  const STEP_LABELS = ["Plan", "Practice Info", "EHR Connect"];
  const currentStepIdx = step; // 0,1,2

  function handleSelectPlan(p) {
    if (p.id === "enterprise") { setShowEnterprise(true); return; }
    setPlan(p);
    setStep(0);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#040a16", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`*{box-sizing:border-box}`}</style>

      {/* Top bar */}
      <div style={{ height: 60, background: "#071428", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <Logo size="sm" />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Back to site</button>
      </div>

      {/* Stepper (only when plan chosen) */}
      {step >= 0 && (
        <div style={{ background: "#071428", borderBottom: "1px solid #1e3a5f", padding: "0 32px" }}>
          <div style={{ maxWidth: 540, margin: "0 auto", height: 52, display: "flex", alignItems: "center" }}>
            <Stepper steps={STEP_LABELS} current={step} />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: step === -1 ? "60px 24px 80px" : "52px 24px 80px", overflowY: "auto" }}>
        {step === -1 && (
          <div style={{ maxWidth: 1220, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: -1.5, color: "#f1f5f9", margin: "0 0 12px" }}>Choose your plan</h2>
              <p style={{ fontSize: 15, color: "#475569" }}>14-day free trial on all plans. No credit card required.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, alignItems: "start" }}>
              {PLANS.map(p => (
                <div key={p.id} style={{ position: "relative", background: "#071428", border: `2px solid ${p.highlight ? p.color : "#1e3a5f"}`, borderRadius: 18, padding: "28px 22px", cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => handleSelectPlan(p)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${p.color}18`; e.currentTarget.style.borderColor = p.color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = p.highlight ? p.color : "#1e3a5f"; }}>
                  {p.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: p.color, color: "#001a24", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 0.8 }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 10, color: p.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{p.seats}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 21, fontWeight: 900, color: "#f1f5f9", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>{p.tagline}</div>
                  <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 16, marginBottom: 18 }}>
                    {p.price ? (
                      <><span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 36, fontWeight: 900, color: p.color, letterSpacing: -1.5 }}>${p.price.toLocaleString()}</span><span style={{ fontSize: 12, color: "#475569", marginLeft: 4 }}>/mo</span></>
                    ) : (
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, color: p.color }}>Custom</span>
                    )}
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {p.features.map(f => <li key={f} style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748b", alignItems: "flex-start" }}><span style={{ color: p.color, flexShrink: 0 }}>✓</span>{f}</li>)}
                  </ul>
                  <button onClick={e => { e.stopPropagation(); handleSelectPlan(p); }}
                    style={{ width: "100%", padding: "11px", borderRadius: 9, border: `1.5px solid ${p.color}`, background: p.highlight ? p.color : "transparent", color: p.highlight ? "#001a24" : p.color, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {p.id === "enterprise" ? "Contact sales →" : "Select plan →"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 0 && plan && (
          <StepPlanConfirm plan={plan} onNext={() => setStep(1)} onChangePlan={() => setStep(-1)} />
        )}
        {step === 1 && (
          <StepPracticeInfo onNext={info => { setPracticeInfo(info); setStep(2); }} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepEhrConnect practiceInfo={practiceInfo} onComplete={onComplete} onBack={() => setStep(1)} />
        )}
      </div>

      {showEnterprise && <EnterpriseModal onClose={() => setShowEnterprise(false)} />}
    </div>
  );
}

// ─── Pharmacist Join Modal ────────────────────────────────────────────────────
function PharmacistJoinModal({ onClose, onComplete }) {
  const [step, setStep] = React.useState(0); // 0=form, 1=success
  const [f, setF] = React.useState({
    firstName: "", lastName: "", email: "", phone: "",
    license: "", licenseState: "", licenseType: "PharmD",
    employer: "", yearsExp: "", specialties: [], availability: "",
    linkedin: "", notes: "",
  });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const toggleSpec = spec => setF(p => ({
    ...p,
    specialties: p.specialties.includes(spec) ? p.specialties.filter(s => s !== spec) : [...p.specialties, spec],
  }));
  const valid = f.firstName && f.lastName && f.email && f.license && f.licenseState;

  const specialtyOptions = ["Geriatrics", "Oncology", "Cardiology", "Psychiatry", "Nephrology", "Endocrinology", "Pain Management", "General / Primary Care"];
  const availabilityOptions = ["1-5 reviews/week", "6-10 reviews/week", "11-20 reviews/week", "20+ reviews/week"];

  const inpStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 8,
    border: "1.5px solid #1e3a5f", background: "#071428",
    color: "#e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: 22, padding: "40px 36px", maxWidth: 560, width: "100%", marginTop: 20, marginBottom: 40 }}>
        {step === 1 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 12, letterSpacing: -0.5 }}>Application submitted!</h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 12 }}>
              Thanks, <strong style={{ color: "#94a3b8" }}>{f.firstName}</strong>! Our pharmacist network team will review your application and reach out within 2 business days.
            </p>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>We'll send onboarding information and your first case access to <strong style={{ color: "#818cf8" }}>{f.email}</strong>.</p>
            <button onClick={() => { onClose(); onComplete?.(); }}
              style={{ padding: "13px 32px", background: "#8b5cf6", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚗</div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: "#f1f5f9", letterSpacing: -0.5 }}>Join the Pharmacist Network</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>Licensed PharmD or RPh · Remote · Paid per review</div>
                </div>
              </div>
            </div>

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>First Name *</label><input value={f.firstName} onChange={u("firstName")} placeholder="Jane" style={inpStyle} /></div>
              <div><label style={labelStyle}>Last Name *</label><input value={f.lastName} onChange={u("lastName")} placeholder="Smith" style={inpStyle} /></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Email *</label><input type="email" value={f.email} onChange={u("email")} placeholder="jane@email.com" style={inpStyle} /></div>
              <div><label style={labelStyle}>Phone</label><input type="tel" value={f.phone} onChange={u("phone")} placeholder="(555) 000-0000" style={inpStyle} /></div>
            </div>

            {/* License */}
            <div style={{ background: "#040a16", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#475569", marginBottom: 14 }}>License Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>License # *</label>
                  <input value={f.license} onChange={u("license")} placeholder="RPH-12345" style={inpStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State *</label>
                  <input value={f.licenseState} onChange={u("licenseState")} placeholder="CA" maxLength={2} style={inpStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Credential</label>
                  <select value={f.licenseType} onChange={u("licenseType")} style={inpStyle}>
                    <option>PharmD</option><option>RPh</option><option>BCPS</option>
                    <option>BCGP</option><option>BCOP</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Current Employer / Practice</label>
                <input value={f.employer} onChange={u("employer")} placeholder="Hospital, pharmacy, etc." style={inpStyle} />
              </div>
              <div>
                <label style={labelStyle}>Years of Experience</label>
                <select value={f.yearsExp} onChange={u("yearsExp")} style={inpStyle}>
                  <option value="">Select…</option>
                  <option>1–2 years</option><option>3–5 years</option>
                  <option>6–10 years</option><option>11–20 years</option><option>20+ years</option>
                </select>
              </div>
            </div>

            {/* Specialties */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Clinical Specialties <span style={{ color: "#334155", textTransform: "none", fontWeight: 400 }}>(select all that apply)</span></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {specialtyOptions.map(s => {
                  const active = f.specialties.includes(s);
                  return (
                    <button key={s} onClick={() => toggleSpec(s)}
                      style={{ padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${active ? "#818cf8" : "#1e3a5f"}`, background: active ? "rgba(139,92,246,0.12)" : "transparent", color: active ? "#818cf8" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Weekly Review Capacity</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {availabilityOptions.map(a => {
                  const active = f.availability === a;
                  return (
                    <button key={a} onClick={() => setF(p => ({ ...p, availability: a }))}
                      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${active ? "#06b6d4" : "#1e3a5f"}`, background: active ? "rgba(6,182,212,0.1)" : "transparent", color: active ? "#06b6d4" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => { if (valid) setStep(1); }} disabled={!valid}
              style={{ width: "100%", padding: "14px", borderRadius: 11, border: "none", background: valid ? "#8b5cf6" : "#1e3a5f", color: valid ? "#fff" : "#334155", fontSize: 15, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", marginBottom: 10, boxShadow: valid ? "0 0 24px rgba(139,92,246,0.3)" : "none" }}>
              Submit Application →
            </button>
            <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "#334155", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pharmacist Dashboard ─────────────────────────────────────────────────────
function PharmacistDashboard({ onBack }) {
  const [activeTab, setActiveTab] = React.useState("queue");
  const [selectedCase, setSelectedCase] = React.useState(null);
  const [recText, setRecText] = React.useState("");
  const [recAction, setRecAction] = React.useState("deprescribe");
  const [recDrug, setRecDrug] = React.useState("");
  const [submitted, setSubmitted] = React.useState([]);

  // Mock queue cases for pharmacist review
  const PHARM_CASES = [
    { id: "pc1", name: "Eleanor Whitmore", age: 82, mrn: "MRN-4421", score: 89, meds: 14, flags: 3, physician: "Dr. Patel", conditions: ["AFib", "Diabetes T2", "Hypertension", "CKD Stage 3"], medications: ["Warfarin 5mg", "Aspirin 81mg", "Metformin 1000mg", "Lisinopril 10mg", "Furosemide 40mg", "Digoxin 0.125mg", "Atorvastatin 40mg", "Omeprazole 20mg", "Amlodipine 5mg", "Gabapentin 300mg", "Melatonin 5mg", "Vitamin D3", "Fish Oil", "Magnesium"], priority: "high", fee: 75 },
    { id: "pc2", name: "Harold Simmons", age: 76, mrn: "MRN-3872", score: 67, meds: 9, flags: 1, physician: "Dr. Chen", conditions: ["COPD", "Hypertension", "Depression"], medications: ["Tiotropium inhaler", "Albuterol PRN", "Lisinopril 20mg", "Amlodipine 10mg", "Sertraline 100mg", "Lorazepam 0.5mg", "Atorvastatin 40mg", "Aspirin 81mg", "Omeprazole 20mg"], priority: "medium", fee: 50 },
    { id: "pc3", name: "Dorothy Huang", age: 79, mrn: "MRN-5190", score: 74, meds: 11, flags: 2, physician: "Dr. Patel", conditions: ["Osteoporosis", "Hypothyroidism", "Insomnia", "Anxiety"], medications: ["Levothyroxine 100mcg", "Alendronate 70mg weekly", "Calcium Carbonate 1200mg", "Vitamin D3 2000IU", "Zolpidem 10mg", "Alprazolam 0.25mg", "Sertraline 50mg", "Atorvastatin 20mg", "Lisinopril 5mg", "Aspirin 81mg", "Vitamin B12"], priority: "medium", fee: 60 },
    { id: "pc4", name: "Robert Castillo", age: 88, mrn: "MRN-2934", score: 92, meds: 16, flags: 4, physician: "Dr. Wilson", conditions: ["Heart Failure", "AFib", "CKD Stage 4", "Diabetes T2", "Gout"], medications: ["Furosemide 80mg", "Spironolactone 25mg", "Carvedilol 12.5mg", "Sacubitril/Valsartan 49/51mg", "Warfarin 7mg", "Digoxin 0.125mg", "Allopurinol 300mg", "Colchicine 0.6mg", "Insulin Glargine 30U", "Metformin 500mg", "Atorvastatin 40mg", "Aspirin 81mg", "Omeprazole 40mg", "Potassium Chloride 20mEq", "Vitamin D3", "Fish Oil"], priority: "critical", fee: 85 },
  ];

  const priorityColor = { critical: "#ef4444", high: "#f59e0b", medium: "#06b6d4" };
  const priorityLabel = { critical: "🔴 Critical", high: "🟡 High", medium: "⬤ Medium" };

  const t = {
    pageBg: "#060b14", sidebarBg: "#0a1628", cardBg: "#0a1628", cardBg2: "#0d1b2a",
    border: "#1e293b", borderStrong: "#334155",
    textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
    accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)",
  };

  function submitRec() {
    if (!recText || !recDrug) return;
    const newRec = {
      id: Date.now(), caseId: selectedCase.id, patientName: selectedCase.name,
      drug: recDrug, action: recAction, rationale: recText,
      submittedAt: new Date().toLocaleString(), status: "pending",
      fee: selectedCase.fee,
    };
    setSubmitted(p => [newRec, ...p]);
    setRecText(""); setRecDrug(""); setRecAction("deprescribe");
    setSelectedCase(null);
    setActiveTab("submitted");
  }

  const navItems = [
    { id: "queue", icon: "📋", label: "Review Queue" },
    { id: "submitted", icon: "✅", label: "Submitted" },
    { id: "earnings", icon: "💰", label: "Earnings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.pageBg, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ height: 60, background: t.sidebarBg, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo size="sm" />
          <div style={{ width: 1, height: 20, background: t.border }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>⚗ Pharmacist Dashboard</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 13, color: t.textMuted }}>Pharm. Sarah Chen, PharmD</div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#818cf8,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>SC</div>
          <button onClick={onBack} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${t.border}`, borderRadius: 7, color: t.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Back to site</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: t.sidebarBg, borderRight: `1px solid ${t.border}`, padding: "24px 0", flexShrink: 0 }}>
          <div style={{ padding: "0 16px 20px", borderBottom: `1px solid ${t.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>This Week</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Reviews complete", val: submitted.length + 2 },
                { label: "Pending approval", val: submitted.filter(r => r.status === "pending").length + 1 },
                { label: "Est. earnings", val: `$${(submitted.length * 60 + 120).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: t.textMuted }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedCase(null); }}
              style={{ width: "100%", textAlign: "left", padding: "10px 20px", background: activeTab === item.id ? "rgba(139,92,246,0.12)" : "transparent", border: "none", borderRight: activeTab === item.id ? "2px solid #8b5cf6" : "2px solid transparent", color: activeTab === item.id ? "#818cf8" : t.textMuted, fontSize: 14, fontWeight: activeTab === item.id ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
              <span>{item.icon}</span>{item.label}
              {item.id === "queue" && <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{PHARM_CASES.length}</span>}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {/* ── Review Queue ── */}
          {activeTab === "queue" && !selectedCase && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>Review Queue</h2>
                <p style={{ fontSize: 13, color: t.textMuted }}>{PHARM_CASES.length} cases assigned · sorted by priority</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {PHARM_CASES.map(c => (
                  <div key={c.id} style={{ background: t.cardBg, border: `1px solid ${c.priority === "critical" ? "#ef444433" : t.border}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                    onClick={() => setSelectedCase(c)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.priority === "critical" ? "#ef444433" : t.border; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: t.textPrimary }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: priorityColor[c.priority], fontWeight: 700 }}>{priorityLabel[c.priority]}</span>
                        </div>
                        <div style={{ fontSize: 12, color: t.textMuted }}>Age {c.age} · {c.mrn} · {c.physician}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: "#22c55e" }}>${c.fee}</div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>review fee</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                      <span style={{ padding: "3px 10px", background: "#ef444418", border: "1px solid #ef444433", borderRadius: 6, fontSize: 11, color: "#ef4444", fontWeight: 600 }}>⚠ {c.flags} flags</span>
                      <span style={{ padding: "3px 10px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 6, fontSize: 11, color: "#818cf8", fontWeight: 600 }}>💊 {c.meds} medications</span>
                      <span style={{ padding: "3px 10px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 6, fontSize: 11, color: "#06b6d4", fontWeight: 600 }}>Risk: {c.score}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {c.conditions.map(cond => (
                        <span key={cond} style={{ padding: "2px 9px", background: t.cardBg2, border: `1px solid ${t.border}`, borderRadius: 5, fontSize: 11, color: t.textMuted }}>{cond}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Case Review Detail ── */}
          {activeTab === "queue" && selectedCase && (
            <div>
              <button onClick={() => setSelectedCase(null)} style={{ display: "flex", alignItems: "center", gap: 7, background: "transparent", border: "none", color: t.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 24, padding: 0 }}>
                ← Back to queue
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {/* Patient summary */}
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Patient</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>{selectedCase.name}</div>
                  <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 14 }}>Age {selectedCase.age} · {selectedCase.mrn} · {selectedCase.physician}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selectedCase.conditions.map(c => (
                      <span key={c} style={{ padding: "4px 10px", background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 6, fontSize: 12, color: "#06b6d4" }}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* Risk summary */}
                <div style={{ background: t.cardBg, border: `1px solid ${selectedCase.score >= 80 ? "#ef444433" : t.border}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Risk Summary</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 48, fontWeight: 900, color: selectedCase.score >= 80 ? "#ef4444" : selectedCase.score >= 60 ? "#f59e0b" : "#22c55e", letterSpacing: -2, lineHeight: 1, marginBottom: 8 }}>{selectedCase.score}</div>
                  <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 14 }}>Polypharmacy risk score</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ padding: "6px 12px", background: "#ef444418", borderRadius: 7, fontSize: 12, color: "#ef4444", fontWeight: 700 }}>{selectedCase.flags} critical flags</div>
                    <div style={{ padding: "6px 12px", background: "rgba(139,92,246,0.1)", borderRadius: 7, fontSize: 12, color: "#818cf8", fontWeight: 700 }}>{selectedCase.meds} medications</div>
                  </div>
                </div>
              </div>

              {/* Medication list */}
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Medication List</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 10 }}>
                  {selectedCase.medications.map((med, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: t.cardBg2, borderRadius: 9, border: `1px solid ${t.border}` }}>
                      <span style={{ fontSize: 15 }}>💊</span>
                      <span style={{ fontSize: 13, color: t.textSecondary }}>{med}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation form */}
              <div style={{ background: t.cardBg, border: "1.5px solid rgba(139,92,246,0.3)", borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>⚗ Submit Recommendation</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Action Type</label>
                    <select value={recAction} onChange={e => setRecAction(e.target.value)}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1.5px solid #1e293b", background: t.cardBg2, color: t.textPrimary, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                      <option value="deprescribe">Deprescribe</option>
                      <option value="dose-reduce">Reduce Dose</option>
                      <option value="switch">Switch Medication</option>
                      <option value="add">Add Medication</option>
                      <option value="monitor">Increase Monitoring</option>
                      <option value="lab">Order Lab Work</option>
                      <option value="consult">Specialist Consult</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Medication(s)</label>
                    <input value={recDrug} onChange={e => setRecDrug(e.target.value)} placeholder="e.g. Zolpidem 10mg"
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1.5px solid #1e293b", background: t.cardBg2, color: t.textPrimary, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Clinical Rationale *</label>
                  <textarea value={recText} onChange={e => setRecText(e.target.value)} rows={5}
                    placeholder="Provide detailed clinical rationale for this recommendation. Include relevant guidelines, drug interaction concerns, patient-specific factors, and proposed monitoring plan..."
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #1e293b", background: t.cardBg2, color: t.textPrimary, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", lineHeight: 1.65 }} />
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button onClick={submitRec} disabled={!recText || !recDrug}
                    style={{ padding: "13px 28px", background: recText && recDrug ? "#8b5cf6" : "#1e293b", border: "none", borderRadius: 10, color: recText && recDrug ? "#fff" : "#475569", fontSize: 14, fontWeight: 700, cursor: recText && recDrug ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", boxShadow: recText && recDrug ? "0 0 24px rgba(139,92,246,0.3)" : "none" }}>
                    Submit to Dr. {selectedCase.physician.split(" ")[1]} →
                  </button>
                  <div style={{ fontSize: 12, color: t.textMuted }}>
                    Review fee: <strong style={{ color: "#22c55e" }}>${selectedCase.fee}</strong> · paid upon physician review
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Submitted ── */}
          {activeTab === "submitted" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>Submitted Recommendations</h2>
                <p style={{ fontSize: 13, color: t.textMuted }}>{submitted.length} this session</p>
              </div>
              {submitted.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px", color: t.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                  <div style={{ fontSize: 15, marginBottom: 8 }}>No recommendations submitted yet</div>
                  <div style={{ fontSize: 13 }}>Complete a case from the review queue to see it here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {submitted.map(r => (
                    <div key={r.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, marginBottom: 3 }}>{r.patientName} — {r.drug}</div>
                          <div style={{ fontSize: 12, color: t.textMuted }}>{r.action} · Submitted {r.submittedAt}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ padding: "4px 12px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 20, fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>Pending Review</div>
                          <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4, fontWeight: 700 }}>${r.fee} pending</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: t.textSecondary, background: t.cardBg2, borderRadius: 8, padding: "10px 12px", lineHeight: 1.65 }}>{r.rationale}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Earnings ── */}
          {activeTab === "earnings" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>Earnings</h2>
                <p style={{ fontSize: 13, color: t.textMuted }}>Your review history and payment status</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "This month", val: `$${(submitted.length * 60 + 420).toLocaleString()}`, color: "#22c55e" },
                  { label: "Pending payout", val: `$${(submitted.length * 60 + 120).toLocaleString()}`, color: "#f59e0b" },
                  { label: "Total earned", val: `$${(submitted.length * 60 + 1840).toLocaleString()}`, color: "#818cf8" },
                  { label: "Reviews done", val: submitted.length + 28, color: "#06b6d4" },
                ].map(s => (
                  <div key={s.label} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: -1, marginBottom: 6 }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: t.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Recent Payments</div>
                {[
                  { date: "Feb 16, 2026", amount: "$420", reviews: 7, status: "paid" },
                  { date: "Feb 2, 2026", amount: "$360", reviews: 6, status: "paid" },
                  { date: "Jan 19, 2026", amount: "$480", reviews: 8, status: "paid" },
                  { date: "Jan 5, 2026", amount: "$300", reviews: 5, status: "paid" },
                ].map(p => (
                  <div key={p.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div>
                      <div style={{ fontSize: 14, color: t.textPrimary, fontWeight: 600 }}>{p.date}</div>
                      <div style={{ fontSize: 12, color: t.textMuted }}>{p.reviews} reviews</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e", fontFamily: "'Outfit', sans-serif" }}>{p.amount}</div>
                      <div style={{ padding: "2px 8px", background: "rgba(34,197,94,0.1)", borderRadius: 5, fontSize: 10, color: "#22c55e", fontWeight: 700, display: "inline-block" }}>Direct Deposit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function LessMeds() {
  const [view, setView] = useState("marketing"); // "marketing" | "signup" | "dashboard" | "pharmacist-dashboard"
  const [signupPlan, setSignupPlan] = useState(null);
  const [showConsumer, setShowConsumer] = useState(false);
  const [showPharmJoin, setShowPharmJoin] = useState(false);

  if (view === "dashboard") return <LessMedsDashboard />;
  if (view === "pharmacist-dashboard") return <PharmacistDashboard onBack={() => setView("marketing")} />;

  if (view === "signup") {
    return (
      <ClinicianSignup
        initialPlan={signupPlan}
        onBack={() => { setView("marketing"); setSignupPlan(null); }}
        onComplete={() => setView("dashboard")}
      />
    );
  }

  return (
    <>
      <MarketingSite
        onClinicianSignup={() => setView("signup")}
        onConsumer={() => setShowConsumer(true)}
        onPharmacist={() => setShowPharmJoin(true)}
        onSelectPlan={plan => {
          if (plan.id === "enterprise") return;
          setSignupPlan(plan);
          setView("signup");
        }}
      />
      {showConsumer && <ConsumerModal onClose={() => setShowConsumer(false)} />}
      {showPharmJoin && (
        <PharmacistJoinModal
          onClose={() => setShowPharmJoin(false)}
          onComplete={() => {
            setShowPharmJoin(false);
            // After applying, offer to open pharmacist dashboard demo
            setTimeout(() => setView("pharmacist-dashboard"), 500);
          }}
        />
      )}
    </>
  );
}
