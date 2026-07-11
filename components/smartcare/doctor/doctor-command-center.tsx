"use client"

import { useState } from "react"
import {
  INITIAL_QUEUE,
  DIAGNOSIS_CODES,
  COMMON_MEDS,
  buildBeds,
  BED_STATUS_STYLES,
  PRIORITY_STYLES,
  WARDS,
  PHARMACY, // ✅ ENSURED CORE FORMULARY MAP IMPORT
  type QueuePatient,
} from "@/lib/medical-data"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Clock,
  Heart,
  Plus,
  Search,
  Sliders,
  User,
  X,
  Layers,
  BedDouble,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DoctorCommandCenter() {
  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_QUEUE)
  const [activePatient, setActivePatient] = useState<QueuePatient | null>(INITIAL_QUEUE[0])
  const [selectedBufferSlot, setSelectedBufferSlot] = useState<string | null>(null)
  
  // Backup pointer to remember which patient was open before clicking the buffer slot
  const [backupPatient, setBackupPatient] = useState<QueuePatient | null>(INITIAL_QUEUE[0])
  
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  
  // Clinical States Form Input
  const [progressNote, setProgressNote] = useState("")
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("")
  const [prescribedMeds, setPrescribedMeds] = useState<string[]>([])
  const [searchMeds, setSearchMeds] = useState("")

  // ─── ✅ NEW STATE: REAL-TIME PHARMACY DATA LOCK BANNER STATES ───
  const [stockWarning, setStockWarning] = useState<{ type: "danger" | "warning"; message: string } | null>(null)

  // ─── UPDATED: CONVERTED TO REACTIVE STATE MATRIX FOR IMMUTABLE FLOWS ───
  const [beds, setBeds] = useState(() => buildBeds())

  // Emergency Button Handler
  const handleToggleEmergency = () => {
    const isActivating = !emergencyMode
    setEmergencyMode(isActivating)
    setQueue((prevQueue) =>
      prevQueue.map((p) => ({
        ...p,
        waitMins: isActivating ? p.waitMins + 10 : Math.max(2, p.waitMins - 10),
      }))
    )
  }

  const handleCallNextPatient = () => {
    if (queue.length > 1) {
      const currentIndex = queue.findIndex((p) => p.id === (activePatient?.id || backupPatient?.id))
      const nextIndex = (currentIndex + 1) % queue.length
      setActivePatient(queue[nextIndex])
      setBackupPatient(queue[nextIndex])
      setSelectedBufferSlot(null)
      setStockWarning(null) // Reset banner gracefully on transition
    }
  }

  const handleSkipPatient = () => {
    const targetId = activePatient?.id || backupPatient?.id
    if (targetId) {
      const remaining = queue.filter((p) => p.id !== targetId)
      setQueue(remaining)
      if (remaining.length > 0) {
        setActivePatient(remaining[0])
        setBackupPatient(remaining[0])
      } else {
        setActivePatient(null)
        setBackupPatient(null)
      }
      setSelectedBufferSlot(null)
      setStockWarning(null) // Reset clean slate
    }
  }

  // ─── NEW HANDLER: DIRECT ALLOCATION FLOW FLIPPER ───
  const handleAllocateBedToPatient = (bedId: string) => {
    setBeds((currentBeds) =>
      currentBeds.map((b) => (b.id === bedId ? { ...b, status: "Occupied" } : b))
    )
    handleSkipPatient() // Auto forwards current patient structure out of queue stream
    setIsAdmitModalOpen(false) // Dynamic modal clear
  }

  // ─── ✅ MODIFIED HANDLER: AUTONOMOUS PHARMACY STOCK GUARDRAIL ENGINE ───
  const handleAddMedicine = (medName: string) => {
    const pharmacyItem = PHARMACY.find((p) => p.name.toLowerCase() === medName.toLowerCase())

    if (pharmacyItem) {
      const ratio = pharmacyItem.stock / pharmacyItem.reorder
      
      // A. CRITICAL CASE: Out of Stock Check
      if (pharmacyItem.stock === 0) {
        setStockWarning({
          type: "danger",
          message: `🛑 CRITICAL ALERT: "${medName}" is completely OUT OF STOCK in pharmacy inventory! Please select an alternative formulary.`
        })
        return // Blocks adding to prescription list completely!
      }
      
      // B. WARNING CASE: Low Stock Margin Metrics
      if (ratio < 1) {
        setStockWarning({
          type: "warning",
          message: `⚠️ INVENTORY ALERT: "${medName}" has LOW STOCK remaining (${pharmacyItem.stock} ${pharmacyItem.unit} left). Replenishment is pending.`
        })
      } else {
        setStockWarning(null) // Clear warnings if stock levels are safe
      }
    }

    if (!prescribedMeds.includes(medName)) {
      setPrescribedMeds([...prescribedMeds, medName])
    }
  }

  // Safely restore the previous active patient's card layout context upon closing buffer slot
  const handleCloseBufferView = () => {
    setSelectedBufferSlot(null)
    setActivePatient(backupPatient) 
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      
      {/* ─── LEFT COLUMN: AUTOMATIC 5-PATIENT SPLIT BUFFER STREAM ─── */}
      <div className="rounded-lg border border-border bg-card p-4 lg:col-span-1 space-y-3 shadow-sm h-[calc(100vh-140px)] overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Active Patient Queue
        </h3>
        
        <div className="space-y-2">
          {queue.map((p, index) => {
            const isSelected = activePatient?.id === p.id && !selectedBufferSlot
            const prio = PRIORITY_STYLES[p.priority]
            
            // Render regular patient card
            const patientCard = (
              <div
                key={p.id}
                onClick={() => {
                  setActivePatient(p)
                  setBackupPatient(p) // Remember this selection pointer context
                  setSelectedBufferSlot(null)
                  setStockWarning(null) // Safe layout transition state reset
                }}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-secondary/10 hover:bg-secondary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">{p.token}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold border", prio.cls)}>
                    {prio.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.complaint}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-medium border-t border-border/40 pt-1.5">
                  <span>Age/Sex: {p.age}{p.sex}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    Est: {p.waitMins}m
                  </span>
                </div>
              </div>
            )

            // DYNAMIC INJECTION RULE: Inject Buffer block after every 5 patients chunk interval
            const shouldInjectBufferAfter = (index + 1) % 5 === 0
            const bufferRoomNumber = Math.ceil((index + 1) / 5)

            return (
              <div key={`wrapper-${p.id}`} className="space-y-2">
                {patientCard}
                {shouldInjectBufferAfter && (
                  <div
                    onClick={() => {
                      setSelectedBufferSlot(`B${bufferRoomNumber}`)
                      setActivePatient(null) // Safely hide open profiles view
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg border border-dashed p-3 transition-all my-2",
                      selectedBufferSlot === `B${bufferRoomNumber}` ? "border-amber-500 bg-amber-500/5" : "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 tracking-wide uppercase">Buffer Slot B{bufferRoomNumber}</span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-500/30">
                        Interval Block
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                      10-15 Min systematic diagnostic cooling buffer assigned automatically here.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── MIDDLE & RIGHT AREA: RENDER CONSOLE VIEWS ─── */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-y-auto pr-1">
        
        {/* IF BUFFER SLOT DRAWER VIEW REQ: ACTIVE COMPONENT LAYER */}
        {selectedBufferSlot ? (
          <div className="md:col-span-3 rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">Buffer Slot Window Segment: {selectedBufferSlot}</h2>
              </div>
              <button onClick={handleCloseBufferView} className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2.5 text-xs">
                <p className="font-bold text-sm text-foreground">Dynamic Window Parameters</p>
                <p className="text-muted-foreground">Assigned Framework: <span className="text-foreground font-semibold">10 to 15 Minutes Cooldown</span></p>
                <p className="text-muted-foreground">Current Status Token Node: <span className="font-mono text-primary font-bold">Active Tracking Segment Matrix</span></p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/10 p-4 space-y-2 text-xs">
                <p className="font-bold text-sm text-foreground">Operational Notice</p>
                <p className="text-muted-foreground leading-relaxed">
                  Patients waiting for diagnostic reports or laboratory results occupy this slot segment without shifting or disturbing the active OPD sequence throughput line.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Patients Holding Inside This Cooldown Window</p>
              {queue.slice(0, 3).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs transition hover:bg-secondary/20">
                  <div>
                    <p className="font-bold text-foreground">{p.name} <span className="text-muted-foreground font-mono font-medium text-[11px]">({p.token})</span></p>
                    <p className="text-muted-foreground text-[11px] mt-0.5 truncate max-w-md">{p.complaint}</p>
                  </div>
                  <span className="font-medium text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">Awaiting Lab Dispatch</span>
                </div>
              ))}
            </div>
          </div>
        ) : activePatient ? (
          
          /* IF REGULAR PATIENT CHOSEN: RENDER LOGS AND MEDICAL WORKSPACE DATA */
          <>
            <div className="md:col-span-2 space-y-4">
              {emergencyMode && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-destructive animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Emergency Mode Active (+10 mins appended)</p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-foreground">{activePatient.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activePatient.age} Yrs · {activePatient.sex === "M" ? "Male" : "Female"} · Token: <span className="font-mono font-bold text-primary">{activePatient.token}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Logged Nurse Vitals Triage</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                    {[
                      { label: "Blood Pressure", val: activePatient.vitals.bp, desc: "mmHg" },
                      { label: "Heart Rate", val: `${activePatient.vitals.hr} BPM`, desc: "Normal Sinus" },
                      { label: "Temperature", val: `${activePatient.vitals.temp} °F`, desc: "Axillary" },
                      { label: "SpO₂ Oxygen", val: `${activePatient.vitals.spo2} %`, desc: "Room Air" },
                    ].map((v) => (
                      <div key={v.label} className="rounded border border-border bg-secondary/20 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium">{v.label}</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{v.val}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{v.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2 text-xs border-t border-border/40 pt-2.5">
                  <div>
                    <p className="font-bold text-muted-foreground mb-1">Chief Symptoms / Complaint</p>
                    <p className="bg-secondary/30 p-2 rounded text-foreground font-medium">{activePatient.complaint}</p>
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground mb-1">Allergies Mapped</p>
                    <div className="flex flex-wrap gap-1">
                      {activePatient.allergies.length > 0 ? (
                        activePatient.allergies.map((a) => (
                          <span key={a} className="rounded bg-destructive/10 border border-destructive/20 text-destructive font-semibold px-2 py-0.5 text-[10px]">{a}</span>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">No known drug allergies</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2.5 shadow-sm">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Electronic Health Progress Note</p>
                <textarea
                  placeholder="Document clinical findings, assessment plans, diagnostic reasoning..."
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="h-28 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-1.5">
                    Diagnosis & Prescriptions
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Primary Diagnosis (ICD-10)</label>
                    <select
                      value={selectedDiagnosis}
                      onChange={(e) => setSelectedDiagnosis(e.target.value)}
                      className="w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Select ICD Code...</option>
                      {DIAGNOSIS_CODES.map((d) => (
                        <option key={d.code} value={d.code}>{d.code} - {d.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* ─── ✅ DYNAMIC LIVE INVENTORY ALERT BANNER CONTAINER ─── */}
                  {stockWarning && (
                    <div className={cn(
                      "rounded-lg border p-2.5 text-[11px] font-semibold animate-in fade-in slide-in-from-top-2 duration-200 relative mt-2",
                      stockWarning.type === "danger" 
                        ? "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/5" 
                        : "border-warning/30 bg-warning/10 text-warning dark:bg-warning/5"
                    )}>
                      <div className="flex items-start gap-1.5 pr-4">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <p className="leading-snug">{stockWarning.message}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setStockWarning(null)} 
                        className="absolute top-1.5 right-1.5 p-0.5 rounded text-muted-foreground hover:bg-secondary transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Prescribe Pharmacy Stock Drugs</label>
                    <input
                      type="text"
                      placeholder="Search prescription database..."
                      value={searchMeds}
                      onChange={(e) => setSearchMeds(e.target.value)}
                      className="h-7 w-full rounded border border-border bg-secondary px-2 text-[11px] text-foreground focus:outline-none"
                    />
                    {searchMeds && (
                      <div className="border border-border rounded bg-card max-h-24 overflow-y-auto p-1 space-y-1 text-[11px]">
                        {COMMON_MEDS.filter((m) => m.toLowerCase().includes(searchMeds.toLowerCase())).map((m) => (
                          <div
                            key={m}
                            onClick={() => {
                              handleAddMedicine(m)
                              setSearchMeds("")
                            }}
                            className="p-1 hover:bg-primary/10 rounded cursor-pointer text-foreground font-medium"
                          >
                            + {m}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {prescribedMeds.length > 0 && (
                    <div className="flex flex-wrap gap-1 bg-secondary/20 p-2 rounded-md border border-border/60">
                      {prescribedMeds.map((med) => (
                        <span key={med} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] text-primary font-medium border border-primary/20">
                          {med}
                          <X className="h-2.5 w-2.5 cursor-pointer hover:text-destructive" onClick={() => setPrescribedMeds(prev => prev.filter(m => m !== med))} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleSkipPatient} className="rounded-md border border-border bg-card py-2 text-xs font-semibold text-foreground hover:bg-accent transition">
                      Skip Patient
                    </button>
                    <button onClick={() => setIsAdmitModalOpen(true)} className="rounded-md bg-amber-600/10 border border-amber-600/20 py-2 text-xs font-bold text-amber-700 hover:bg-amber-600/20 transition">
                      Admit Patient
                    </button>
                  </div>

                  <button onClick={handleCallNextPatient} className="w-full rounded-md bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition">
                    Call Next Patient ➔
                  </button>

                  <button
                    onClick={handleToggleEmergency}
                    className={cn(
                      "w-full rounded-md border py-2 text-xs font-bold uppercase tracking-wider transition",
                      emergencyMode ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                    )}
                  >
                    {emergencyMode ? "Disable Emergency Mode" : "🚨 Activate Emergency Mode"}
                  </button>
                </div>

              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ─── BED MANAGEMENT POPUP: MODIFIED STYLES & EXCLUSIVE FILTERS FOR DOCTOR VIEW ─── */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Available Bed Allocation Matrix</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Filtering strictly for <span className="text-success font-semibold">Available</span> & <span className="text-warning font-semibold">Vacating Soon</span> beds.</p>
              </div>
              <button onClick={() => setIsAdmitModalOpen(false)} className="rounded p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-medium">
              {/* 🔴 EXCLUSIVE STRICT FILTER LOOP RENDERING */}
              {beds
                .filter((bed) => bed.status === "Available" || bed.status === "Vacating Soon")
                .map((bed) => (
                  <div
                    key={bed.id}
                    onClick={() => handleAllocateBedToPatient(bed.id)}
                    className={cn(
                      "border p-3 rounded-lg text-center cursor-pointer transition transform hover:scale-105 hover:ring-2 hover:ring-ring/20",
                      bed.status === "Available" 
                        ? "bg-success/10 text-success border-success/30 hover:bg-success/20" 
                        : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
                    )}
                  >
                    <p className="font-bold text-sm">{bed.id}</p>
                    <p className="text-[10px] mt-0.5 opacity-80">{bed.ward}</p>
                    <span className="text-[9px] mt-2 block font-semibold px-1 py-0.5 rounded bg-background/50 uppercase tracking-wide">
                      {bed.status}
                    </span>
                  </div>
                ))}
            </div>

            {/* Empty check helper context */}
            {beds.filter((bed) => bed.status === "Available" || bed.status === "Vacating Soon").length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground font-medium border border-dashed rounded-lg">
                ⚠️ All system beds are currently occupied. Clear downstream channels inside Admin Panel.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}