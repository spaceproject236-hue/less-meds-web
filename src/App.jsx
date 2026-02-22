import React, { useState, useCallback, createContext, useContext } from "react";

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

// ─── Audit Log ────────────────────────────────────────────────────────────────
const auditLog = [];
function logAudit(user, action, detail) {
  auditLog.unshift({ id: Date.now() + Math.random(), timestamp: new Date().toISOString(), user, action, detail });
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
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

  return (
    <ThemeContext.Provider value={t}>
      <div style={{ display:"flex", height:"100vh", background:t.appBg, color:t.textPrimary, fontFamily:"'DM Sans', sans-serif", overflow:"hidden" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

        {/* Sidebar */}
        <aside style={{ width:220, background:t.sidebarBg, borderRight:`1px solid ${t.border}`, display:"flex", flexDirection:"column", flexShrink:0, boxShadow: themeName==="light" ? "2px 0 8px rgba(0,0,0,0.06)" : "none" }}>
          <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${t.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⬡</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:t.textPrimary, letterSpacing:0.5 }}>LessMeds</div>
                <div style={{ fontSize:10, color:t.textMuted, letterSpacing:1, textTransform:"uppercase" }}>Medication Mgmt</div>
              </div>
            </div>
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
          {/* Theme switcher mini preview in sidebar */}
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

        {/* Main */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <header style={{ height:56, background:t.headerBg, borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:12, flexShrink:0, boxShadow: themeName==="light" ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>
            <div style={{ flex:1, fontSize:16, fontWeight:600, color:t.textPrimary }}>
              {selectedCase ? `Case: ${selectedCaseData?.name}` : navItems.find(n=>n.id===activeNav)?.label}
            </div>
            {totalHighRisk > 0 && <Chip color={t.danger} bg={t.dangerBg}>{totalHighRisk} High Risk</Chip>}
            {totalPending > 0 && <Chip color={t.warning} bg={t.warningBg}>{totalPending} Pending</Chip>}
            {totalFlags > 0 && <Chip color={t.danger} bg={t.dangerBg}>🔴 {totalFlags} Critical</Chip>}
          </header>

          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
            {activeNav==="dashboard" && !selectedCase && <Dashboard cases={casesWithScores} onSelect={id=>{setSelectedCase(id);setActiveNav("cases");setCaseTab("overview");}} />}
            {activeNav==="cases" && !selectedCase && <CasesList cases={casesWithScores} onSelect={id=>{setSelectedCase(id);setCaseTab("overview");}} onNew={()=>setShowNewCase(true)} />}
            {activeNav==="cases" && selectedCase && selectedCaseData && (
              <CaseDetail caseData={selectedCaseData} tab={caseTab} setTab={setCaseTab} onBack={()=>setSelectedCase(null)}
                onApprove={(rid)=>approveRec(selectedCase,rid)} onReject={(rid)=>rejectRec(selectedCase,rid)}
                onAddMed={med=>addMedication(selectedCase,med)} onRemoveMed={mid=>removeMedication(selectedCase,mid)}
                onAddRec={rec=>addRecommendation(selectedCase,rec)} currentUser={currentUser} />
            )}
            {activeNav==="recommendations" && <AllRecommendations cases={casesWithScores} onApprove={approveRec} onReject={rejectRec} currentUser={currentUser} />}
            {activeNav==="reports" && <Reports cases={casesWithScores} />}
            {activeNav==="audit" && <AuditLogView log={auditLog} />}
            {activeNav==="settings" && <SettingsView themeName={themeName} setThemeName={setThemeName} />}
          </div>
        </main>

        {/* Toast Alerts */}
        <div style={{ position:"fixed", bottom:24, right:24, display:"flex", flexDirection:"column", gap:8, zIndex:1000 }}>
          {alerts.map(a => (
            <div key={a.id} style={{ padding:"12px 16px", borderRadius:10,
              background: a.type==="success" ? t.successBg : t.cardBg2,
              border:`1px solid ${a.type==="success" ? t.successBorder : t.border}`,
              color:t.textPrimary, fontSize:13, maxWidth:300, boxShadow:"0 4px 20px rgba(0,0,0,0.15)", animation:"slideIn 0.3s ease" }}>
              {a.type==="success"?"✅ ":a.type==="error"?"❌ ":"ℹ️ "}{a.msg}
            </div>
          ))}
        </div>

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
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ cases, onSelect }) {
  const t = useTheme();
  const highRisk = cases.filter(c => c.score >= 71);
  const avgScore = Math.round(cases.reduce((s,c)=>s+c.score,0)/cases.length);
  const criticalFlags = cases.flatMap(c => c.flags.filter(f=>f.sev==="high").map(f=>({...f,caseName:c.name,caseId:c.id})));
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:t.textPrimary, margin:0 }}>Clinical Overview</h2>
        <p style={{ color:t.textMuted, fontSize:13, margin:"4px 0 0" }}>Population-level medication risk summary</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Cases", value:cases.length, icon:"◈", color:t.accent },
          { label:"High Risk", value:highRisk.length, icon:"🔴", color:t.danger },
          { label:"Avg Risk Score", value:avgScore, icon:"◎", color:avgScore<=40?t.success:avgScore<=70?t.warning:t.danger },
          { label:"Critical Flags", value:criticalFlags.length, icon:"⚠", color:t.warning },
        ].map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>
      {criticalFlags.length > 0 && (
        <div style={{ background:t.cardBg, border:`1px solid ${t.dangerBorder}`, borderRadius:12, padding:20, marginBottom:24 }}>
          <div style={{ fontWeight:700, color:t.danger, marginBottom:14, fontSize:14 }}>🔴 Critical Alerts Requiring Attention</div>
          {criticalFlags.slice(0,6).map((f,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
              <div><span style={{ color:t.textMuted, fontSize:12 }}>{f.caseName} — </span><span style={{ color:t.dangerText, fontSize:13 }}>{f.msg}</span></div>
              <button onClick={()=>onSelect(f.caseId)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${t.danger}`, background:t.dangerBg, color:t.danger, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontWeight:600, color:t.textMuted, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>All Cases</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
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
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:0 }}>Patient Cases</h2>
          <p style={{ color:t.textMuted, fontSize:13, margin:"2px 0 0" }}>{cases.length} active cases</p>
        </div>
        <ActionBtn onClick={onNew}>+ New Case</ActionBtn>
      </div>
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
    </div>
  );
}

// ─── Case Detail ──────────────────────────────────────────────────────────────
function CaseDetail({ caseData, tab, setTab, onBack, onApprove, onReject, onAddMed, onRemoveMed, onAddRec, currentUser }) {
  const t = useTheme();
  const [showNewMed, setShowNewMed] = useState(false);
  const [showNewRec, setShowNewRec] = useState(false);
  const tabs = ["overview","medications","risk-report","recommendations","notes"];
  return (
    <div>
      <button onClick={onBack} style={{ background:"transparent", border:"none", color:t.accent, fontSize:13, cursor:"pointer", marginBottom:16, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
        ← Back to Cases
      </button>
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:20, marginBottom:20, display:"flex", alignItems:"center", gap:24, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
        <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff", flexShrink:0 }}>
          {caseData.name.split(" ").map(w=>w[0]).join("")}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:700, color:t.textPrimary }}>{caseData.name}</div>
          <div style={{ color:t.textMuted, fontSize:13, marginTop:3 }}>Age {caseData.age} · DOB {caseData.dob} · {caseData.mrn} · Physician: {caseData.physician}</div>
          <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
            {caseData.conditions.map(c=><span key={c} style={{ fontSize:11, padding:"3px 10px", background:t.chipBg, borderRadius:20, color:t.textSecondary }}>{c}</span>)}
          </div>
        </div>
        <ScoreBadge score={caseData.score} size="lg" />
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:20, background:t.cardBg2, border:`1px solid ${t.border}`, borderRadius:10, padding:4 }}>
        {tabs.map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} style={{ flex:1, padding:"8px 4px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:tab===tb?600:400, textTransform:"capitalize",
            background:tab===tb ? t.accent : "transparent", color:tab===tb ? (t.appBg==="#f0f4f8"?"#fff":t.btnPrimaryText) : t.navText, transition:"all 0.15s" }}>
            {tb.replace("-"," ")}
          </button>
        ))}
      </div>
      {tab==="overview" && <CaseOverview caseData={caseData} />}
      {tab==="medications" && <MedicationsTab caseData={caseData} onAdd={onAddMed} onRemove={onRemoveMed} showNew={showNewMed} setShowNew={setShowNewMed} currentUser={currentUser} />}
      {tab==="risk-report" && <RiskReport caseData={caseData} />}
      {tab==="recommendations" && <RecommendationsTab caseData={caseData} onApprove={onApprove} onReject={onReject} onAdd={onAddRec} showNew={showNewRec} setShowNew={setShowNewRec} currentUser={currentUser} />}
      {tab==="notes" && <EmptyState>No clinical notes recorded. Notes feature coming in Phase 2.</EmptyState>}
    </div>
  );
}

function CaseOverview({ caseData }) {
  const t = useTheme();
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
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
    </div>
  );
}

function MedicationsTab({ caseData, onAdd, onRemove, showNew, setShowNew }) {
  const t = useTheme();
  const [newMed, setNewMed] = useState({ name:"", dose:"", frequency:"Daily", class:"" });
  const medClasses = ["Anticoagulant","Antidiabetic","ACE Inhibitor","Statin","Beta Blocker","CCB","Diuretic","Antiplatelet","SSRI","Opioid","Bronchodilator","Bisphosphonate","Supplement","Other"];
  const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:t.textMuted, fontSize:13 }}>{caseData.medications.length} medications on record</div>
        <ActionBtn onClick={()=>setShowNew(true)}>+ Add Medication</ActionBtn>
      </div>
      <div style={{ background:t.tableBg, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${t.border}`, background: t.appBg==="#f0f4f8" ? t.cardBg2 : "transparent" }}>
              {["Medication","Dose","Frequency","Class","Missed","Start Date","Risk",""].map(h=>(
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
                    <button onClick={()=>{if(confirm(`Remove ${m.name}?`))onRemove(m.id);}}
                      style={{ padding:"3px 10px", borderRadius:6, border:`1px solid ${t.borderStrong}`, background:t.btnSecondaryBg, color:t.textSecondary, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showNew && (
        <ThemedModal title="Add Medication" onClose={()=>setShowNew(false)} onSave={()=>{if(newMed.name){onAdd(newMed);setShowNew(false);setNewMed({name:"",dose:"",frequency:"Daily",class:""});}}}>
          <ThemedField label="Drug Name"><input value={newMed.name} onChange={e=>setNewMed(p=>({...p,name:e.target.value}))} placeholder="e.g. Metformin" style={inputStyle}/></ThemedField>
          <ThemedField label="Dose"><input value={newMed.dose} onChange={e=>setNewMed(p=>({...p,dose:e.target.value}))} placeholder="e.g. 500mg" style={inputStyle}/></ThemedField>
          <ThemedField label="Frequency"><select value={newMed.frequency} onChange={e=>setNewMed(p=>({...p,frequency:e.target.value}))} style={inputStyle}>{["Daily","Twice daily","Three times daily","Weekly","As needed"].map(f=><option key={f}>{f}</option>)}</select></ThemedField>
          <ThemedField label="Drug Class"><select value={newMed.class} onChange={e=>setNewMed(p=>({...p,class:e.target.value}))} style={inputStyle}><option value="">Select...</option>{medClasses.map(c=><option key={c}>{c}</option>)}</select></ThemedField>
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

function RecommendationsTab({ caseData, onApprove, onReject, onAdd, showNew, setShowNew, currentUser }) {
  const t = useTheme();
  const [newRec, setNewRec] = useState({ drug:"", action:"Deprescribe", reason:"" });
  const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:t.textMuted, fontSize:13 }}>{caseData.recommendations.filter(r=>r.status==="pending").length} pending review</div>
        <ActionBtn onClick={()=>setShowNew(true)}>+ Propose Recommendation</ActionBtn>
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
          {r.status==="pending" && currentUser.role==="physician" && (
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

function AllRecommendations({ cases, onApprove, onReject, currentUser }) {
  const t = useTheme();
  const all = cases.flatMap(c => c.recommendations.map(r=>({...r,caseName:c.name,caseId:c.id})));
  const pending = all.filter(r=>r.status==="pending");
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 6px" }}>Recommendations</h2>
      <p style={{ color:t.textMuted, fontSize:13, margin:"0 0 20px" }}>{pending.length} pending physician review</p>
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
function SettingsView({ themeName, setThemeName }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:t.textPrimary, margin:"0 0 6px" }}>Settings</h2>
      <p style={{ color:t.textMuted, fontSize:13, margin:"0 0 24px" }}>Organization settings and compliance configuration</p>

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
                <div style={{ width:32, height:32, borderRadius:8, background: key==="dark" ? "#060b14" : "#ffffff", border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                  {key==="dark" ? "🌙" : "☀️"}
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
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:t.modalBg, border:`1px solid ${t.border}`, borderRadius:16, padding:28, width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:17, fontWeight:700, color:t.textPrimary }}>{title}</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:t.textMuted, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        {children}
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${t.borderStrong}`, background:t.btnSecondaryBg, color:t.textSecondary, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={onSave} style={{ padding:"8px 18px", borderRadius:8, border:"none", background:t.btnPrimary, color:t.btnPrimaryText, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
