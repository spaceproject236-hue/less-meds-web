import { useState, useEffect, useCallback } from "react";

// ─── Audit Log ────────────────────────────────────────────────────────────────
const auditLog = [];
function logAudit(user, action, detail) {
  auditLog.unshift({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    user,
    action,
    detail,
  });
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const HIGH_RISK_DRUGS = ["Warfarin", "Digoxin", "Amiodarone", "Methotrexate", "Lithium", "Opioids"];
const INTERACTION_PAIRS = [
  ["Warfarin", "Aspirin"],
  ["Warfarin", "Ibuprofen"],
  ["Metformin", "Contrast Dye"],
  ["Lisinopril", "Potassium"],
  ["Digoxin", "Amiodarone"],
  ["Lithium", "Ibuprofen"],
];

function computeScore(medications, age) {
  let score = 0;
  const flags = [];
  const count = medications.length;

  // Count factor (max 30)
  if (count >= 10) { score += 30; flags.push({ type: "HIGH_POLY", sev: "high", msg: `${count} medications — high polypharmacy risk (≥10)` }); }
  else if (count >= 5) { score += 15; flags.push({ type: "POLY", sev: "moderate", msg: `${count} medications — polypharmacy risk (≥5)` }); }
  else score += count * 2;

  // Interactions (max 30)
  const names = medications.map(m => m.name);
  let intCount = 0;
  INTERACTION_PAIRS.forEach(([a, b]) => {
    if (names.includes(a) && names.includes(b)) {
      intCount++;
      flags.push({ type: "INTERACTION", sev: "high", msg: `Drug interaction: ${a} + ${b}` });
    }
  });
  score += Math.min(intCount * 10, 30);

  // High-risk drugs (max 20)
  const highRisk = medications.filter(m => HIGH_RISK_DRUGS.includes(m.name));
  if (age >= 65 && highRisk.length > 0) {
    score += highRisk.length * 7;
    highRisk.forEach(m => flags.push({ type: "GERI_RISK", sev: "high", msg: `Geriatric safety warning: ${m.name} for patient age ${age}` }));
  }

  // Adherence (max 10)
  const missedCount = medications.reduce((s, m) => s + (m.missedDoses || 0), 0);
  if (missedCount >= 3) { score += 10; flags.push({ type: "ADHERENCE", sev: "moderate", msg: `${missedCount} missed doses in last 7 days` }); }

  // Duplicate classes (max 10)
  const classes = medications.map(m => m.class).filter(Boolean);
  const seen = new Set();
  classes.forEach(c => {
    if (seen.has(c)) { score += 5; flags.push({ type: "DUPLICATE", sev: "moderate", msg: `Duplicate therapy class: ${c}` }); }
    seen.add(c);
  });

  score = Math.min(100, Math.round(score));
  return { score, flags };
}

const INITIAL_CASES = [
  {
    id: "C001", name: "Eleanor Whitmore", age: 78, dob: "1946-03-14", mrn: "MRN-4421",
    conditions: ["Type 2 Diabetes", "Hypertension", "AFib", "Osteoporosis"],
    physician: "Dr. Patel", pharmacist: "Pharm. Chen", coordinator: "Sarah Mills",
    status: "active", lastReview: "2024-11-20",
    medications: [
      { id: "m1", name: "Warfarin", dose: "5mg", frequency: "Daily", class: "Anticoagulant", missedDoses: 1, startDate: "2022-01-10" },
      { id: "m2", name: "Metformin", dose: "1000mg", frequency: "Twice daily", class: "Antidiabetic", missedDoses: 0, startDate: "2019-05-01" },
      { id: "m3", name: "Lisinopril", dose: "10mg", frequency: "Daily", class: "ACE Inhibitor", missedDoses: 2, startDate: "2020-03-15" },
      { id: "m4", name: "Aspirin", dose: "81mg", frequency: "Daily", class: "Antiplatelet", missedDoses: 0, startDate: "2021-06-01" },
      { id: "m5", name: "Atorvastatin", dose: "40mg", frequency: "Daily", class: "Statin", missedDoses: 1, startDate: "2020-01-01" },
      { id: "m6", name: "Alendronate", dose: "70mg", frequency: "Weekly", class: "Bisphosphonate", missedDoses: 0, startDate: "2023-02-01" },
      { id: "m7", name: "Potassium", dose: "20mEq", frequency: "Daily", class: "Supplement", missedDoses: 3, startDate: "2022-08-01" },
    ],
    recommendations: [
      { id: "r1", drug: "Aspirin", action: "Deprescribe", reason: "High bleeding risk with Warfarin co-administration. Evidence suggests net harm in elderly AFib patients.", proposedBy: "Pharm. Chen", status: "pending", createdAt: "2025-02-10" },
    ],
    sideEffects: [],
    notes: [],
  },
  {
    id: "C002", name: "Harold Bergstrom", age: 71, dob: "1953-07-22", mrn: "MRN-3309",
    conditions: ["COPD", "Depression", "Hypertension"],
    physician: "Dr. Patel", pharmacist: "Pharm. Chen", coordinator: "Sarah Mills",
    status: "active", lastReview: "2025-01-05",
    medications: [
      { id: "m8", name: "Tiotropium", dose: "18mcg", frequency: "Daily", class: "Bronchodilator", missedDoses: 0, startDate: "2021-09-01" },
      { id: "m9", name: "Sertraline", dose: "50mg", frequency: "Daily", class: "SSRI", missedDoses: 0, startDate: "2022-04-01" },
      { id: "m10", name: "Amlodipine", dose: "5mg", frequency: "Daily", class: "CCB", missedDoses: 0, startDate: "2020-11-01" },
    ],
    recommendations: [],
    sideEffects: [],
    notes: [],
  },
];

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, size = "md" }) {
  const color = score <= 40 ? "#22c55e" : score <= 70 ? "#f59e0b" : "#ef4444";
  const label = score <= 40 ? "Low Risk" : score <= 70 ? "Moderate" : "High Risk";
  const bg = score <= 40 ? "#052e16" : score <= 70 ? "#451a03" : "#1c0002";
  const dim = size === "lg" ? 88 : 56;
  const fs = size === "lg" ? 22 : 14;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={dim} height={dim} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="38" fill={bg} stroke="#1e293b" strokeWidth="2"/>
        <circle cx="44" cy="44" r="38" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${(score / 100) * 239} 239`}
          strokeDashoffset="0" strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray 0.8s ease" }}/>
        <text x="44" y="48" textAnchor="middle" fill={color} fontSize={fs} fontWeight="700" fontFamily="monospace">{score}</text>
      </svg>
      <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

// ─── Flag Pill ────────────────────────────────────────────────────────────────
function FlagPill({ flag }) {
  const colors = { high: { bg:"#2d0a0a", border:"#ef4444", text:"#fca5a5" }, moderate: { bg:"#1c1200", border:"#f59e0b", text:"#fcd34d" }, low: { bg:"#0a1a0a", border:"#22c55e", text:"#86efac" } };
  const c = colors[flag.sev] || colors.low;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 12px", borderRadius:8, background:c.bg, border:`1px solid ${c.border}`, marginBottom:6 }}>
      <span style={{ fontSize:14, marginTop:1 }}>{flag.sev === "high" ? "🔴" : "🟡"}</span>
      <span style={{ fontSize:13, color:c.text, lineHeight:1.4 }}>{flag.msg}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function LessMeds() {
  const [currentUser] = useState({ name: "Dr. Patel", role: "physician", id: "u1" });
  const [cases, setCases] = useState(INITIAL_CASES);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseTab, setCaseTab] = useState("overview");
  const [showNewCase, setShowNewCase] = useState(false);
  const [showNewMed, setShowNewMed] = useState(false);
  const [showNewRec, setShowNewRec] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Compute scores for all cases
  const casesWithScores = cases.map(c => {
    const { score, flags } = computeScore(c.medications, c.age);
    const daysSinceReview = c.lastReview ? Math.floor((Date.now() - new Date(c.lastReview)) / 86400000) : 999;
    const reviewFlag = daysSinceReview >= 90 ? [{ type:"REVIEW", sev:"moderate", msg:`No review in ${daysSinceReview} days — review recommended` }] : [];
    return { ...c, score, flags: [...flags, ...reviewFlag] };
  });

  const selectedCaseData = casesWithScores.find(c => c.id === selectedCase);

  // Toast alerts
  function showAlert(msg, type = "info") {
    const id = Date.now();
    setAlerts(a => [...a, { id, msg, type }]);
    setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 4000);
  }

  function approveRec(caseId, recId) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : {
      ...c,
      recommendations: c.recommendations.map(r => r.id !== recId ? r : { ...r, status:"approved", approvedBy: currentUser.name, approvedAt: new Date().toISOString().slice(0,10) })
    }));
    logAudit(currentUser.name, "APPROVE_RECOMMENDATION", `Case ${caseId}, Rec ${recId}`);
    showAlert("Recommendation approved and logged.", "success");
  }

  function rejectRec(caseId, recId) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : {
      ...c,
      recommendations: c.recommendations.map(r => r.id !== recId ? r : { ...r, status:"rejected", rejectedBy: currentUser.name })
    }));
    logAudit(currentUser.name, "REJECT_RECOMMENDATION", `Case ${caseId}, Rec ${recId}`);
    showAlert("Recommendation rejected.", "info");
  }

  function addMedication(caseId, med) {
    const newMed = { ...med, id: "m" + Date.now(), missedDoses: 0, startDate: new Date().toISOString().slice(0,10) };
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, medications: [...c.medications, newMed] }));
    logAudit(currentUser.name, "ADD_MEDICATION", `${med.name} added to case ${caseId}`);
    showAlert(`${med.name} added to medication list.`, "success");
  }

  function removeMedication(caseId, medId) {
    const med = cases.find(c => c.id === caseId)?.medications.find(m => m.id === medId);
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, medications: c.medications.filter(m => m.id !== medId) }));
    logAudit(currentUser.name, "REMOVE_MEDICATION", `${med?.name} removed from case ${caseId}`);
    showAlert(`Medication removed.`, "info");
  }

  function addRecommendation(caseId, rec) {
    const newRec = { ...rec, id: "r" + Date.now(), status:"pending", proposedBy: currentUser.name, createdAt: new Date().toISOString().slice(0,10) };
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, recommendations: [...c.recommendations, newRec] }));
    logAudit(currentUser.name, "PROPOSE_RECOMMENDATION", `${rec.action} ${rec.drug} for case ${caseId}`);
    showAlert("Recommendation submitted for physician review.", "success");
  }

  const navItems = [
    { id:"dashboard", label:"Dashboard", icon:"⬡" },
    { id:"cases", label:"Cases", icon:"◈" },
    { id:"recommendations", label:"Recommendations", icon:"◎" },
    { id:"reports", label:"Reports", icon:"▣" },
    { id:"audit", label:"Audit Log", icon:"◐" },
    { id:"settings", label:"Settings", icon:"◍" },
  ];

  const totalHighRisk = casesWithScores.filter(c => c.score >= 71).length;
  const totalPending = casesWithScores.reduce((s, c) => s + c.recommendations.filter(r => r.status === "pending").length, 0);
  const totalFlags = casesWithScores.reduce((s, c) => s + c.flags.filter(f => f.sev === "high").length, 0);

  return (
    <div style={{ display:"flex", height:"100vh", background:"#060b14", color:"#e2e8f0", fontFamily:"'DM Sans', sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Sidebar */}
      <aside style={{ width:220, background:"#0a1628", borderRight:"1px solid #1e293b", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid #1e293b" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⬡</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:"#f1f5f9", letterSpacing:0.5 }}>LessMeds</div>
              <div style={{ fontSize:10, color:"#64748b", letterSpacing:1, textTransform:"uppercase" }}>Medication Mgmt</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:"12px 10px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); setSelectedCase(null); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2,
                background: activeNav === item.id ? "rgba(6,182,212,0.12)" : "transparent",
                color: activeNav === item.id ? "#06b6d4" : "#94a3b8",
                fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight: activeNav === item.id ? 600 : 400, textAlign:"left" }}>
              <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:"16px 14px", borderTop:"1px solid #1e293b" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>
              {currentUser.name.split(" ").map(w=>w[0]).join("")}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9" }}>{currentUser.name}</div>
              <div style={{ fontSize:11, color:"#64748b", textTransform:"capitalize" }}>{currentUser.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <header style={{ height:56, background:"#0a1628", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", padding:"0 24px", gap:12, flexShrink:0 }}>
          <div style={{ flex:1, fontSize:16, fontWeight:600, color:"#f1f5f9" }}>
            {selectedCase ? `Case: ${selectedCaseData?.name}` : navItems.find(n=>n.id===activeNav)?.label}
          </div>
          {totalHighRisk > 0 && <Chip color="#ef4444" bg="#2d0a0a">{totalHighRisk} High Risk</Chip>}
          {totalPending > 0 && <Chip color="#f59e0b" bg="#1c1200">{totalPending} Pending</Chip>}
          {totalFlags > 0 && <Chip color="#ef4444" bg="#2d0a0a">🔴 {totalFlags} Critical Flags</Chip>}
        </header>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
          {activeNav === "dashboard" && !selectedCase && <Dashboard cases={casesWithScores} onSelect={id=>{setSelectedCase(id);setActiveNav("cases");setCaseTab("overview");}} />}
          {activeNav === "cases" && !selectedCase && <CasesList cases={casesWithScores} onSelect={id=>{setSelectedCase(id);setCaseTab("overview");}} onNew={()=>setShowNewCase(true)} />}
          {activeNav === "cases" && selectedCase && selectedCaseData && (
            <CaseDetail
              caseData={selectedCaseData} tab={caseTab} setTab={setCaseTab}
              onBack={()=>setSelectedCase(null)}
              onApprove={(rid)=>approveRec(selectedCase,rid)}
              onReject={(rid)=>rejectRec(selectedCase,rid)}
              onAddMed={med=>addMedication(selectedCase,med)}
              onRemoveMed={mid=>removeMedication(selectedCase,mid)}
              onAddRec={rec=>addRecommendation(selectedCase,rec)}
              showNewMed={showNewMed} setShowNewMed={setShowNewMed}
              showNewRec={showNewRec} setShowNewRec={setShowNewRec}
              currentUser={currentUser}
            />
          )}
          {activeNav === "recommendations" && <AllRecommendations cases={casesWithScores} onApprove={approveRec} onReject={rejectRec} currentUser={currentUser} />}
          {activeNav === "reports" && <Reports cases={casesWithScores} />}
          {activeNav === "audit" && <AuditLogView log={auditLog} />}
          {activeNav === "settings" && <SettingsView />}
        </div>
      </main>

      {/* Toast Alerts */}
      <div style={{ position:"fixed", bottom:24, right:24, display:"flex", flexDirection:"column", gap:8, zIndex:1000 }}>
        {alerts.map(a => (
          <div key={a.id} style={{ padding:"12px 16px", borderRadius:10, background: a.type==="success" ? "#052e16" : a.type==="error" ? "#1c0002" : "#0f172a",
            border:`1px solid ${a.type==="success"?"#16a34a":a.type==="error"?"#dc2626":"#334155"}`, color:"#f1f5f9", fontSize:13, maxWidth:300,
            boxShadow:"0 4px 20px rgba(0,0,0,0.4)", animation:"slideIn 0.3s ease" }}>
            {a.type==="success"?"✅ ":a.type==="error"?"❌ ":"ℹ️ "}{a.msg}
          </div>
        ))}
      </div>

      {/* New Case Modal */}
      {showNewCase && <NewCaseModal onClose={()=>setShowNewCase(false)} onSave={(data)=>{
        const newCase = { ...data, id:"C"+Date.now(), status:"active", medications:[], recommendations:[], sideEffects:[], notes:[], lastReview: new Date().toISOString().slice(0,10) };
        setCases(prev=>[...prev, newCase]);
        logAudit(currentUser.name, "CREATE_CASE", `New case for ${data.name}`);
        setShowNewCase(false); showAlert("New case created.","success");
      }}/>}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#0a1628; } ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:3px; }
      `}</style>
    </div>
  );
}

function Chip({ children, color, bg }) {
  return <div style={{ padding:"4px 10px", borderRadius:20, background:bg, color, fontSize:12, fontWeight:600, border:`1px solid ${color}33` }}>{children}</div>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ cases, onSelect }) {
  const highRisk = cases.filter(c => c.score >= 71);
  const moderate = cases.filter(c => c.score >= 41 && c.score < 71);
  const avgScore = Math.round(cases.reduce((s,c)=>s+c.score,0)/cases.length);
  const criticalFlags = cases.flatMap(c => c.flags.filter(f=>f.sev==="high").map(f=>({...f,caseName:c.name,caseId:c.id})));

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:"#f1f5f9", margin:0 }}>Clinical Overview</h2>
        <p style={{ color:"#64748b", fontSize:13, margin:"4px 0 0" }}>Population-level medication risk summary</p>
      </div>

      {/* Stats Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Cases", value:cases.length, icon:"◈", color:"#06b6d4" },
          { label:"High Risk", value:highRisk.length, icon:"🔴", color:"#ef4444" },
          { label:"Avg Risk Score", value:avgScore, icon:"◎", color: avgScore<=40?"#22c55e":avgScore<=70?"#f59e0b":"#ef4444" },
          { label:"Critical Flags", value:criticalFlags.length, icon:"⚠", color:"#f59e0b" },
        ].map(stat=>(
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Critical Flags */}
      {criticalFlags.length > 0 && (
        <div style={{ background:"#0d1b2a", border:"1px solid #ef444433", borderRadius:12, padding:20, marginBottom:24 }}>
          <div style={{ fontWeight:700, color:"#ef4444", marginBottom:14, fontSize:14 }}>🔴 Critical Alerts Requiring Attention</div>
          {criticalFlags.slice(0,6).map((f,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1e293b" }}>
              <div>
                <span style={{ color:"#94a3b8", fontSize:12 }}>{f.caseName} — </span>
                <span style={{ color:"#fca5a5", fontSize:13 }}>{f.msg}</span>
              </div>
              <button onClick={()=>onSelect(f.caseId)} style={{ padding:"4px 12px", borderRadius:6, border:"1px solid #ef4444", background:"transparent", color:"#ef4444", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View</button>
            </div>
          ))}
        </div>
      )}

      {/* Cases Grid */}
      <div style={{ fontWeight:600, color:"#94a3b8", fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>All Cases</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {cases.map(c => (
          <CaseCard key={c.id} caseData={c} onClick={()=>onSelect(c.id)} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <span style={{ fontSize:11, color:"#64748b", fontWeight:500, letterSpacing:0.5, textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:16 }}>{icon}</span>
      </div>
      <div style={{ fontSize:32, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

function CaseCard({ caseData, onClick }) {
  const scoreColor = caseData.score <= 40 ? "#22c55e" : caseData.score <= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div onClick={onClick} style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:18, cursor:"pointer", transition:"border-color 0.2s,transform 0.1s" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#06b6d4";e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e293b";e.currentTarget.style.transform="none";}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontWeight:600, color:"#f1f5f9", fontSize:15 }}>{caseData.name}</div>
          <div style={{ color:"#64748b", fontSize:12 }}>Age {caseData.age} · {caseData.mrn}</div>
        </div>
        <ScoreBadge score={caseData.score} />
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {caseData.conditions.slice(0,2).map(c=><span key={c} style={{ fontSize:10, padding:"2px 8px", background:"#1e293b", borderRadius:20, color:"#94a3b8" }}>{c}</span>)}
        {caseData.conditions.length > 2 && <span style={{ fontSize:10, padding:"2px 8px", background:"#1e293b", borderRadius:20, color:"#64748b" }}>+{caseData.conditions.length-2}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:12, borderTop:"1px solid #1e293b" }}>
        <span style={{ fontSize:12, color:"#64748b" }}>{caseData.medications.length} medications</span>
        <span style={{ fontSize:12, color: caseData.flags.filter(f=>f.sev==="high").length > 0 ? "#ef4444":"#64748b" }}>
          {caseData.flags.filter(f=>f.sev==="high").length} critical flags
        </span>
      </div>
    </div>
  );
}

// ─── Cases List ───────────────────────────────────────────────────────────────
function CasesList({ cases, onSelect, onNew }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", margin:0 }}>Patient Cases</h2>
          <p style={{ color:"#64748b", fontSize:13, margin:"2px 0 0" }}>{cases.length} active cases</p>
        </div>
        <ActionBtn onClick={onNew}>+ New Case</ActionBtn>
      </div>
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #1e293b" }}>
              {["Patient","Age","MRN","Medications","Risk Score","Flags","Last Review",""].map(h=>(
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map(c=>(
              <tr key={c.id} style={{ borderBottom:"1px solid #0f172a", cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background="#0d1b2a"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>onSelect(c.id)}>
                <td style={{ padding:"14px 16px" }}>
                  <div style={{ fontWeight:600, color:"#f1f5f9", fontSize:14 }}>{c.name}</div>
                  <div style={{ color:"#64748b", fontSize:11, marginTop:2 }}>{c.physician}</div>
                </td>
                <td style={{ padding:"14px 16px", color:"#94a3b8", fontSize:13 }}>{c.age}</td>
                <td style={{ padding:"14px 16px", color:"#94a3b8", fontSize:12, fontFamily:"monospace" }}>{c.mrn}</td>
                <td style={{ padding:"14px 16px", color:"#94a3b8", fontSize:13 }}>{c.medications.length}</td>
                <td style={{ padding:"14px 16px" }}>
                  <ScoreBadge score={c.score} />
                </td>
                <td style={{ padding:"14px 16px" }}>
                  {c.flags.filter(f=>f.sev==="high").length > 0 &&
                    <span style={{ color:"#ef4444", fontSize:12, fontWeight:600 }}>🔴 {c.flags.filter(f=>f.sev==="high").length} Critical</span>}
                  {c.flags.filter(f=>f.sev==="moderate").length > 0 && c.flags.filter(f=>f.sev==="high").length === 0 &&
                    <span style={{ color:"#f59e0b", fontSize:12, fontWeight:600 }}>🟡 {c.flags.filter(f=>f.sev==="moderate").length} Moderate</span>}
                  {c.flags.length === 0 && <span style={{ color:"#22c55e", fontSize:12 }}>✓ Clear</span>}
                </td>
                <td style={{ padding:"14px 16px", color:"#64748b", fontSize:12 }}>{c.lastReview}</td>
                <td style={{ padding:"14px 16px" }}>
                  <ActionBtn onClick={()=>onSelect(c.id)} small>View</ActionBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Case Detail ──────────────────────────────────────────────────────────────
function CaseDetail({ caseData, tab, setTab, onBack, onApprove, onReject, onAddMed, onRemoveMed, onAddRec, showNewMed, setShowNewMed, showNewRec, setShowNewRec, currentUser }) {
  const tabs = ["overview","medications","risk-report","recommendations","notes"];
  return (
    <div>
      <button onClick={onBack} style={{ background:"transparent", border:"none", color:"#06b6d4", fontSize:13, cursor:"pointer", marginBottom:16, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
        ← Back to Cases
      </button>

      {/* Case Header */}
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20, marginBottom:20, display:"flex", alignItems:"center", gap:24 }}>
        <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, flexShrink:0 }}>
          {caseData.name.split(" ").map(w=>w[0]).join("")}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#f1f5f9" }}>{caseData.name}</div>
          <div style={{ color:"#64748b", fontSize:13, marginTop:3 }}>
            Age {caseData.age} · DOB {caseData.dob} · {caseData.mrn} · Physician: {caseData.physician}
          </div>
          <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
            {caseData.conditions.map(c=><span key={c} style={{ fontSize:11, padding:"3px 10px", background:"#1e293b", borderRadius:20, color:"#94a3b8" }}>{c}</span>)}
          </div>
        </div>
        <ScoreBadge score={caseData.score} size="lg" />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20, background:"#0a1628", border:"1px solid #1e293b", borderRadius:10, padding:4 }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 4px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:tab===t?600:400, textTransform:"capitalize",
            background:tab===t?"#06b6d4" :"transparent", color:tab===t?"#000":"#94a3b8", transition:"all 0.15s" }}>
            {t.replace("-"," ")}
          </button>
        ))}
      </div>

      {tab === "overview" && <CaseOverview caseData={caseData} />}
      {tab === "medications" && <MedicationsTab caseData={caseData} onAdd={onAddMed} onRemove={onRemoveMed} showNew={showNewMed} setShowNew={setShowNewMed} currentUser={currentUser} />}
      {tab === "risk-report" && <RiskReport caseData={caseData} />}
      {tab === "recommendations" && <RecommendationsTab caseData={caseData} onApprove={onApprove} onReject={onReject} onAdd={onAddRec} showNew={showNewRec} setShowNew={setShowNewRec} currentUser={currentUser} />}
      {tab === "notes" && <NotesTab caseData={caseData} />}
    </div>
  );
}

function CaseOverview({ caseData }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
        <SectionTitle>Risk Flags Summary</SectionTitle>
        {caseData.flags.length === 0 ? <div style={{ color:"#22c55e", fontSize:13 }}>✓ No flags detected</div> : caseData.flags.map((f,i)=><FlagPill key={i} flag={f}/>)}
      </div>
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
        <SectionTitle>Pending Recommendations</SectionTitle>
        {caseData.recommendations.filter(r=>r.status==="pending").length === 0 ?
          <div style={{ color:"#64748b", fontSize:13 }}>No pending recommendations</div> :
          caseData.recommendations.filter(r=>r.status==="pending").map(r=>(
            <div key={r.id} style={{ padding:"10px 12px", background:"#1c1200", border:"1px solid #f59e0b44", borderRadius:8, marginBottom:8 }}>
              <div style={{ color:"#fcd34d", fontSize:13, fontWeight:600 }}>{r.action}: {r.drug}</div>
              <div style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>{r.reason.slice(0,80)}...</div>
            </div>
          ))}
      </div>
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
        <SectionTitle>Current Medications</SectionTitle>
        {caseData.medications.slice(0,5).map(m=>(
          <div key={m.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e293b" }}>
            <div style={{ color:"#f1f5f9", fontSize:13 }}>{m.name}</div>
            <div style={{ color:"#64748b", fontSize:12 }}>{m.dose} · {m.frequency}</div>
          </div>
        ))}
        {caseData.medications.length > 5 && <div style={{ color:"#64748b", fontSize:12, marginTop:8 }}>+{caseData.medications.length-5} more</div>}
      </div>
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
        <SectionTitle>Care Team</SectionTitle>
        {[{role:"Physician",name:caseData.physician},{role:"Pharmacist",name:caseData.pharmacist},{role:"Coordinator",name:caseData.coordinator}].map(m=>(
          <div key={m.role} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e293b" }}>
            <div style={{ color:"#94a3b8", fontSize:12 }}>{m.role}</div>
            <div style={{ color:"#f1f5f9", fontSize:13, fontWeight:500 }}>{m.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicationsTab({ caseData, onAdd, onRemove, showNew, setShowNew, currentUser }) {
  const [newMed, setNewMed] = useState({ name:"", dose:"", frequency:"Daily", class:"" });
  const medClasses = ["Anticoagulant","Antidiabetic","ACE Inhibitor","Statin","Beta Blocker","CCB","Diuretic","Antiplatelet","SSRI","Opioid","Bronchodilator","Bisphosphonate","Supplement","Other"];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:"#94a3b8", fontSize:13 }}>{caseData.medications.length} medications on record</div>
        {currentUser.role !== "physician" || true ? <ActionBtn onClick={()=>setShowNew(true)}>+ Add Medication</ActionBtn> : null}
      </div>

      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #1e293b" }}>
              {["Medication","Dose","Frequency","Class","Missed Doses","Start Date","Risk",""].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {caseData.medications.map(m=>{
              const isHighRisk = HIGH_RISK_DRUGS.includes(m.name);
              return (
                <tr key={m.id} style={{ borderBottom:"1px solid #0f172a" }}>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ fontWeight:600, color:"#f1f5f9", fontSize:13 }}>{m.name}</div>
                    {isHighRisk && <div style={{ fontSize:10, color:"#ef4444", marginTop:2 }}>⚠ High-Risk Drug</div>}
                  </td>
                  <td style={{ padding:"12px 14px", color:"#94a3b8", fontSize:13 }}>{m.dose}</td>
                  <td style={{ padding:"12px 14px", color:"#94a3b8", fontSize:13 }}>{m.frequency}</td>
                  <td style={{ padding:"12px 14px", color:"#94a3b8", fontSize:12 }}>{m.class}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ color: m.missedDoses >= 3 ? "#ef4444" : m.missedDoses > 0 ? "#f59e0b" : "#22c55e", fontSize:13, fontWeight:600 }}>{m.missedDoses}</span>
                  </td>
                  <td style={{ padding:"12px 14px", color:"#64748b", fontSize:12 }}>{m.startDate}</td>
                  <td style={{ padding:"12px 14px" }}>
                    {isHighRisk && caseData.age >= 65 ? <Chip color="#ef4444" bg="#2d0a0a">Geri Risk</Chip> : <span style={{color:"#22c55e",fontSize:12}}>✓</span>}
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <button onClick={()=>{ if(confirm(`Remove ${m.name}?`)) onRemove(m.id); }}
                      style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <Modal title="Add Medication" onClose={()=>setShowNew(false)} onSave={()=>{if(newMed.name){ onAdd(newMed); setShowNew(false); setNewMed({name:"",dose:"",frequency:"Daily",class:""}); }}}>
          <FormField label="Drug Name"><input value={newMed.name} onChange={e=>setNewMed(p=>({...p,name:e.target.value}))} placeholder="e.g. Metformin"/></FormField>
          <FormField label="Dose"><input value={newMed.dose} onChange={e=>setNewMed(p=>({...p,dose:e.target.value}))} placeholder="e.g. 500mg"/></FormField>
          <FormField label="Frequency">
            <select value={newMed.frequency} onChange={e=>setNewMed(p=>({...p,frequency:e.target.value}))}>
              {["Daily","Twice daily","Three times daily","Weekly","As needed"].map(f=><option key={f}>{f}</option>)}
            </select>
          </FormField>
          <FormField label="Drug Class">
            <select value={newMed.class} onChange={e=>setNewMed(p=>({...p,class:e.target.value}))}>
              <option value="">Select...</option>
              {medClasses.map(c=><option key={c}>{c}</option>)}
            </select>
          </FormField>
        </Modal>
      )}
    </div>
  );
}

function RiskReport({ caseData }) {
  const scoreColor = caseData.score <= 40 ? "#22c55e" : caseData.score <= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      {/* Score visualization */}
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:24, marginBottom:20, display:"flex", alignItems:"center", gap:32 }}>
        <ScoreBadge score={caseData.score} size="lg" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, color:"#64748b", marginBottom:8 }}>Risk Score Breakdown</div>
          <div style={{ background:"#0f172a", borderRadius:8, height:12, overflow:"hidden", marginBottom:4 }}>
            <div style={{ height:"100%", width:`${caseData.score}%`, background:`linear-gradient(90deg, #22c55e, ${scoreColor})`, borderRadius:8, transition:"width 0.8s ease" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#64748b" }}>
            <span>0 — Low Risk</span><span>50 — Moderate</span><span>100 — High Risk</span>
          </div>
        </div>
      </div>

      {/* Flags */}
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20, marginBottom:20 }}>
        <SectionTitle>Active Risk Flags ({caseData.flags.length})</SectionTitle>
        {caseData.flags.length === 0 ? <div style={{ color:"#22c55e", fontSize:13 }}>✓ No risk flags detected</div> : caseData.flags.map((f,i)=><FlagPill key={i} flag={f}/>)}
      </div>

      {/* Risk factors legend */}
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
        <SectionTitle>Score Factor Analysis</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { factor:"Medication Count", detail:`${caseData.medications.length} medications`, weight: caseData.medications.length >= 10 ? "High" : caseData.medications.length >= 5 ? "Moderate" : "Low" },
            { factor:"Drug Interactions", detail:`${caseData.flags.filter(f=>f.type==="INTERACTION").length} detected`, weight: caseData.flags.filter(f=>f.type==="INTERACTION").length > 0 ? "High" : "Low" },
            { factor:"High-Risk Drugs", detail:`${caseData.medications.filter(m=>HIGH_RISK_DRUGS.includes(m.name)).length} flagged`, weight: caseData.flags.filter(f=>f.type==="GERI_RISK").length > 0 ? "High" : "Low" },
            { factor:"Adherence", detail:`${caseData.medications.reduce((s,m)=>s+(m.missedDoses||0),0)} missed doses`, weight: caseData.medications.reduce((s,m)=>s+(m.missedDoses||0),0) >= 3 ? "Moderate" : "Low" },
          ].map(f=>(
            <div key={f.factor} style={{ padding:"12px 14px", background:"#0f172a", borderRadius:8 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9", marginBottom:4 }}>{f.factor}</div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>{f.detail}</div>
              <div style={{ marginTop:6, fontSize:11, fontWeight:700, color: f.weight==="High"?"#ef4444":f.weight==="Moderate"?"#f59e0b":"#22c55e" }}>{f.weight} Impact</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ caseData, onApprove, onReject, onAdd, showNew, setShowNew, currentUser }) {
  const [newRec, setNewRec] = useState({ drug:"", action:"Deprescribe", reason:"" });
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:"#94a3b8", fontSize:13 }}>{caseData.recommendations.filter(r=>r.status==="pending").length} pending recommendations</div>
        <ActionBtn onClick={()=>setShowNew(true)}>+ Propose Recommendation</ActionBtn>
      </div>

      {caseData.recommendations.length === 0 && <EmptyState>No recommendations yet.</EmptyState>}

      {caseData.recommendations.map(r=>(
        <div key={r.id} style={{ background:"#0a1628", border:`1px solid ${r.status==="pending"?"#f59e0b44":r.status==="approved"?"#22c55e44":"#ef444433"}`, borderRadius:12, padding:20, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <span style={{ background: r.action==="Deprescribe"?"#1c0002":"#052e16", color: r.action==="Deprescribe"?"#fca5a5":"#86efac",
                padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, marginRight:8 }}>{r.action}</span>
              <span style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>{r.drug}</span>
            </div>
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize",
              background: r.status==="pending"?"#1c1200":r.status==="approved"?"#052e16":"#1c0002",
              color: r.status==="pending"?"#fcd34d":r.status==="approved"?"#86efac":"#fca5a5" }}>{r.status}</span>
          </div>
          <p style={{ color:"#94a3b8", fontSize:13, margin:"0 0 12px", lineHeight:1.6 }}>{r.reason}</p>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>Proposed by {r.proposedBy} on {r.createdAt}</div>
          {r.status === "pending" && currentUser.role === "physician" && (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onApprove(r.id)} style={{ padding:"6px 16px", borderRadius:7, border:"1px solid #22c55e", background:"#052e16", color:"#86efac", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✓ Approve</button>
              <button onClick={()=>onReject(r.id)} style={{ padding:"6px 16px", borderRadius:7, border:"1px solid #ef4444", background:"#1c0002", color:"#fca5a5", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✗ Reject</button>
            </div>
          )}
          {r.approvedBy && <div style={{ fontSize:12, color:"#22c55e", marginTop:8 }}>✓ Approved by {r.approvedBy} on {r.approvedAt}</div>}
        </div>
      ))}

      {showNew && (
        <Modal title="Propose Recommendation" onClose={()=>setShowNew(false)} onSave={()=>{if(newRec.drug&&newRec.reason){onAdd(newRec);setShowNew(false);setNewRec({drug:"",action:"Deprescribe",reason:""});}}}>
          <FormField label="Drug"><input value={newRec.drug} onChange={e=>setNewRec(p=>({...p,drug:e.target.value}))} placeholder="Drug name"/></FormField>
          <FormField label="Action">
            <select value={newRec.action} onChange={e=>setNewRec(p=>({...p,action:e.target.value}))}>
              {["Deprescribe","Dose Reduction","Substitute","Monitor","Discontinue"].map(a=><option key={a}>{a}</option>)}
            </select>
          </FormField>
          <FormField label="Clinical Reasoning">
            <textarea value={newRec.reason} onChange={e=>setNewRec(p=>({...p,reason:e.target.value}))} placeholder="Evidence-based rationale..." rows={4} style={{ resize:"vertical" }}/>
          </FormField>
        </Modal>
      )}
    </div>
  );
}

function NotesTab({ caseData }) {
  return (
    <div>
      <EmptyState>No clinical notes recorded. Notes feature coming in Phase 2.</EmptyState>
    </div>
  );
}

// ─── All Recommendations ──────────────────────────────────────────────────────
function AllRecommendations({ cases, onApprove, onReject, currentUser }) {
  const all = cases.flatMap(c => c.recommendations.map(r=>({...r,caseName:c.name,caseId:c.id})));
  const pending = all.filter(r=>r.status==="pending");
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", margin:"0 0 6px" }}>Recommendations</h2>
      <p style={{ color:"#64748b", fontSize:13, margin:"0 0 20px" }}>{pending.length} pending physician review</p>

      {pending.length === 0 && <EmptyState>No pending recommendations.</EmptyState>}
      {pending.map(r=>(
        <div key={r.id} style={{ background:"#0a1628", border:"1px solid #f59e0b44", borderRadius:12, padding:20, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div>
              <span style={{ color:"#94a3b8", fontSize:12 }}>{r.caseName} · </span>
              <span style={{ color:"#fca5a5", fontWeight:700 }}>{r.action}: {r.drug}</span>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onApprove(r.caseId,r.id)} style={{ padding:"5px 14px", borderRadius:7, border:"1px solid #22c55e", background:"#052e16", color:"#86efac", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Approve</button>
              <button onClick={()=>onReject(r.caseId,r.id)} style={{ padding:"5px 14px", borderRadius:7, border:"1px solid #ef4444", background:"#1c0002", color:"#fca5a5", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Reject</button>
            </div>
          </div>
          <p style={{ color:"#94a3b8", fontSize:13, margin:0, lineHeight:1.5 }}>{r.reason}</p>
          <div style={{ fontSize:11, color:"#64748b", marginTop:8 }}>Proposed by {r.proposedBy} · {r.createdAt}</div>
        </div>
      ))}

      {all.filter(r=>r.status!=="pending").length > 0 && (
        <div>
          <div style={{ fontSize:12, color:"#64748b", letterSpacing:1, textTransform:"uppercase", margin:"24px 0 12px" }}>Resolved</div>
          {all.filter(r=>r.status!=="pending").map(r=>(
            <div key={r.id} style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:16, marginBottom:8, opacity:0.7 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#64748b", fontSize:13 }}>{r.caseName} · {r.action}: {r.drug}</span>
                <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:r.status==="approved"?"#052e16":"#1c0002", color:r.status==="approved"?"#86efac":"#fca5a5" }}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports({ cases }) {
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", margin:"0 0 6px" }}>Reports & Exports</h2>
      <p style={{ color:"#64748b", fontSize:13, margin:"0 0 20px" }}>Generate and export medication summaries</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16, marginBottom:24 }}>
        {cases.map(c=>(
          <div key={c.id} style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, color:"#f1f5f9" }}>{c.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{c.mrn} · {c.medications.length} meds · Score: {c.score}</div>
              </div>
              <ScoreBadge score={c.score} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>exportCase(c)} style={{ flex:1, padding:"7px", borderRadius:7, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Export Summary</button>
              <button onClick={()=>printMedList(c)} style={{ flex:1, padding:"7px", borderRadius:7, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Med List PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function exportCase(c) {
  const text = `LESS MEDS CASE REPORT\n${"=".repeat(40)}\nPatient: ${c.name}\nMRN: ${c.mrn}\nAge: ${c.age}\nRisk Score: ${c.score}\nGenerated: ${new Date().toLocaleString()}\n\nMEDICATIONS:\n${c.medications.map(m=>`- ${m.name} ${m.dose} ${m.frequency}`).join("\n")}\n\nRISK FLAGS:\n${c.flags.map(f=>`[${f.sev.toUpperCase()}] ${f.msg}`).join("\n") || "None"}\n`;
  const blob = new Blob([text], {type:"text/plain"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${c.mrn}-report.txt`; a.click();
}
function printMedList(c) { exportCase(c); }

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditLogView({ log }) {
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", margin:"0 0 6px" }}>Audit Log</h2>
      <p style={{ color:"#64748b", fontSize:13, margin:"0 0 20px" }}>HIPAA-compliant record of all sensitive actions</p>
      <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
        {log.length === 0 ? (
          <div style={{ padding:24, color:"#64748b", fontSize:13 }}>No audit events recorded yet. Actions you take will appear here.</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1e293b" }}>
                {["Timestamp","User","Action","Detail"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map(entry=>(
                <tr key={entry.id} style={{ borderBottom:"1px solid #0f172a" }}>
                  <td style={{ padding:"10px 14px", color:"#64748b", fontSize:12, fontFamily:"monospace" }}>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8", fontSize:12 }}>{entry.user}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ padding:"2px 8px", borderRadius:4, background:"#1e293b", color:"#06b6d4", fontSize:11, fontFamily:"monospace" }}>{entry.action}</span>
                  </td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8", fontSize:12 }}>{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsView() {
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", margin:"0 0 6px" }}>Settings</h2>
      <p style={{ color:"#64748b", fontSize:13, margin:"0 0 24px" }}>Organization settings and compliance configuration</p>
      {[
        { title:"Security", items:[["Multi-Factor Authentication","Enabled ✓"],["Session Timeout","30 minutes"],["Encryption","AES-256 at rest · TLS 1.3 in transit"]] },
        { title:"Risk Thresholds", items:[["Polypharmacy Threshold","≥5 medications"],["High Polypharmacy","≥10 medications"],["Review Reminder","90 days"],["Missed Dose Alert","3+ in 7 days"]] },
        { title:"Compliance", items:[["HIPAA Mode","Enabled"],["PHI in Notifications","Disabled"],["Audit Logging","All actions"],["Access Control","Role-based (RBAC)"]] },
      ].map(section=>(
        <div key={section.title} style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:20, marginBottom:16 }}>
          <SectionTitle>{section.title}</SectionTitle>
          {section.items.map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e293b" }}>
              <span style={{ color:"#94a3b8", fontSize:13 }}>{k}</span>
              <span style={{ color:"#22c55e", fontSize:13, fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── New Case Modal ───────────────────────────────────────────────────────────
function NewCaseModal({ onClose, onSave }) {
  const [data, setData] = useState({ name:"", age:"", dob:"", mrn:"", conditions:"", physician:"Dr. Patel", pharmacist:"Pharm. Chen", coordinator:"Sarah Mills" });
  return (
    <Modal title="New Patient Case" onClose={onClose} onSave={()=>{
      if(data.name && data.age) onSave({ ...data, age:parseInt(data.age), conditions: data.conditions.split(",").map(s=>s.trim()).filter(Boolean) });
    }}>
      <FormField label="Full Name"><input value={data.name} onChange={e=>setData(p=>({...p,name:e.target.value}))} placeholder="Patient full name"/></FormField>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FormField label="Age"><input type="number" value={data.age} onChange={e=>setData(p=>({...p,age:e.target.value}))} placeholder="e.g. 72"/></FormField>
        <FormField label="Date of Birth"><input type="date" value={data.dob} onChange={e=>setData(p=>({...p,dob:e.target.value}))}/></FormField>
      </div>
      <FormField label="MRN"><input value={data.mrn} onChange={e=>setData(p=>({...p,mrn:e.target.value}))} placeholder="MRN-XXXX"/></FormField>
      <FormField label="Conditions (comma-separated)"><input value={data.conditions} onChange={e=>setData(p=>({...p,conditions:e.target.value}))} placeholder="e.g. Hypertension, Diabetes"/></FormField>
    </Modal>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <div style={{ fontSize:12, fontWeight:700, color:"#64748b", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{children}</div>;
}

function EmptyState({ children }) {
  return <div style={{ padding:32, textAlign:"center", color:"#64748b", fontSize:13, background:"#0a1628", border:"1px dashed #1e293b", borderRadius:12 }}>{children}</div>;
}

function ActionBtn({ children, onClick, small }) {
  return (
    <button onClick={onClick} style={{ padding: small ? "5px 12px" : "8px 18px", borderRadius:8, border:"1px solid #06b6d4", background:"rgba(6,182,212,0.1)", color:"#06b6d4",
      fontSize: small ? 12 : 13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
      transition:"background 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(6,182,212,0.2)"}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(6,182,212,0.1)"}>
      {children}
    </button>
  );
}

const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #1e293b", background:"#0f172a", color:"#f1f5f9", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" };

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, color:"#64748b", fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
      {React.cloneElement(children, { style: inputStyle })}
    </div>
  );
}

function Modal({ title, onClose, onSave, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#0d1b2a", border:"1px solid #1e293b", borderRadius:16, padding:28, width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:17, fontWeight:700, color:"#f1f5f9" }}>{title}</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#64748b", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        {children}
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={onSave} style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#06b6d4", color:"#000", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Need to import React for cloneElement
import React from "react";
