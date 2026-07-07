"use client"

import { useState, useEffect } from "react"
import {
  DIAGNOSIS_CODES,
  COMMON_MEDS,
  buildBeds,
  PRIORITY_STYLES,
  type QueuePatient,
} from "@/lib/medical-data"
import {
  AlertTriangle,
  Clock,
  X,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DoctorCommandCenter() {
  const [queue, setQueue] = useState<QueuePatient[]>([])
  const [activePatient, setActivePatient] = useState<QueuePatient | null>(null)
  const [selectedBufferSlot, setSelectedBufferSlot] = useState<string | null>(null)
  const [backupPatient, setBackupPatient] = useState<QueuePatient | null>(null)
  
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Clinical States Form Input
  const [progressNote, setProgressNote] = useState("")
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("")
  const [prescribedMeds, setPrescribedMeds] = useState<any[]>([]) // Objects array for detailed mapping
  const [searchMeds, setSearchMeds] = useState("")

  const allBeds = buildBeds()

  // 1. Fetch live queue data directly from Neon Database
  const fetchLiveQueue = async () => {
    try {
      const res = await fetch('/api/doctor?action=fetchQueue')
      const data = await res.json()
      
      // Map database columns to match frontend naming conventions
      const mappedData = data.map((p: any) => ({
        id: p.patient_id.toString(),
        token: p.token_number,
        name: p.patient_name,
        age: p.age,
        sex: p.sex || "M",
        complaint: p.symptoms_text || "No chief complaint logged",
        priority: p.triage_status || "Stable",
        waitMins: p.estimated_wait_mins || 20,
        vitals: p.vitals || { bp: "120/80", hr: 72, temp: 98.6, spo2: 98, resp: 16 }
      }))

      setQueue(mappedData)
      
      // Initialize active patient view if not already selected
      if (mappedData.length > 0 && !activePatient && !selectedBufferSlot) {
        setActivePatient(mappedData[0])
        setBackupPatient(mappedData[0])
      }
      setLoading(false)
    } catch (err) {
      console.error("Failed to sync queue matrix:", err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveQueue()
    const interval = setInterval(fetchLiveQueue, 8000) // Auto sync queue every 8 seconds
    return () => clearInterval(interval)
  }, [])

  // 2. Emergency Mode Action Toggle Channel
  const handleToggleEmergency = async () => {
    const nextState = !emergencyMode
    setEmergencyMode(nextState)
    
    try {
      await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'toggleEmergency', 
          status: nextState ? 'activate' : 'deactivate' 
        })
      })
      fetchLiveQueue() // Refresh changes instantly
    } catch (err) {
      console.error("Emergency sync failed:", err)
    }
  }

  // 3. Submit Consultation Records (Prescriptions + Labs)
  const handleSubmitConsultation = async () => {
    const currentToken = activePatient?.token || backupPatient?.token
    if (!currentToken) return

    try {
      const response = await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'submitConsult',
          token_number: currentToken,
          patient_name: activePatient?.name || backupPatient?.name,
          doctor_id: 1, // Fallback Doctor Amelia Shaw ID
          doctor_name: "Dr. Amelia Shaw",
          medicines: prescribedMeds,
          lab_tests: selectedDiagnosis ? [selectedDiagnosis] : [] // Binds selected tests array
        })
      })

      if (response.ok) {
        alert(`Consultation submitted for Token ${currentToken}! Dispatched to Pharmacy & Labs.`);
        // Reset local states fields
        setProgressNote("")
        setSelectedDiagnosis("")
        setPrescribedMeds([])
        handleCallNextPatient()
      }
    } catch (err) {
      console.error("Consult transmission error:", err)
    }
  }

  const handleCallNextPatient = () => {
    if (queue.length > 1) {
      const currentIndex = queue.findIndex((p) => p.id === (activePatient?.id || backupPatient?.id))
      const nextIndex = (currentIndex + 1) % queue.length
      setActivePatient(queue[nextIndex])
      setBackupPatient(queue[nextIndex])
      setSelectedBufferSlot(null)
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
    }
  }

  const handleAddMedicine = (medName: string) => {
    const exists = prescribedMeds.some(m => m.name === medName)
    if (!exists) {
      // Map details directly matching database serialization columns
      setPrescribedMeds([...prescribedMeds, { name: medName, dosage: "1-0-1", duration: 5, qty: 15 }])
    }
  }

  const handleCloseBufferView = () => {
    setSelectedBufferSlot(null)
    setActivePatient(backupPatient) 
  }

  if (loading) {
    return <div className="text-center p-10 font-medium text-xs text-muted-foreground">Synchronizing live cloud infrastructure...</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      
      {/* ─── LEFT COLUMN: ACTIVE PATENT QUEUE STREAM ─── */}
      <div className="rounded-lg border border-border bg-card p-4 lg:col-span-1 space-y-3 shadow-sm h-[calc(100vh-140px)] overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Active Patient Queue ({queue.length})
        </h3>
        
        <div className="space-y-2">
          {queue.map((p, index) => {
            const isSelected = activePatient?.id === p.id && !selectedBufferSlot
            const prio = PRIORITY_STYLES[p.priority as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.Stable
            
            const patientCard = (
              <div
                key={p.id}
                onClick={() => {
                  setActivePatient(p)
                  setBackupPatient(p)
                  setSelectedBufferSlot(null)
                }}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-all",
                  isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-secondary/10 hover:bg-secondary/30"
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

            const shouldInjectBufferAfter = (index + 1) % 5 === 0
            const bufferRoomNumber = Math.ceil((index + 1) / 5)

            return (
              <div key={`wrapper-${p.id}`} className="space-y-2">
                {patientCard}
                {shouldInjectBufferAfter && (
                  <div
                    onClick={() => {
                      setSelectedBufferSlot(`B${bufferRoomNumber}`)
                      setActivePatient(null)
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg border border-dashed p-3 transition-all my-2",
                      selectedBufferSlot === `B${bufferRoomNumber}` ? "border-amber-500 bg-amber-500/5" : "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 tracking-wide uppercase">Buffer Slot B{bufferRoomNumber}</span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-500/30">Interval Block</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-normal">10-15 Min systematic diagnostic cooling buffer slot.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── MIDDLE & RIGHT AREA: RENDER CONSOLE VIEWS ─── */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-y-auto pr-1">
        
        {selectedBufferSlot ? (
          <div className="md:col-span-3 rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">Buffer Slot Window Segment: {selectedBufferSlot}</h2>
              </div>
              <button onClick={handleCloseBufferView} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2.5">
                <p className="font-bold text-sm text-foreground">Dynamic Window Parameters</p>
                <p className="text-muted-foreground">Assigned Framework: <span className="text-foreground font-semibold">10 to 15 Minutes Cooldown</span></p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/10 p-4">
                <p className="font-bold text-sm text-foreground">Operational Notice</p>
                <p className="text-muted-foreground mt-1 leading-relaxed">Patients waiting for diagnostic reports occupy this slot segment without shifting active sequence line.</p>
              </div>
            </div>
          </div>
        ) : activePatient ? (
          <>
            <div className="md:col-span-2 space-y-4">
              {emergencyMode && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-destructive animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Emergency Mode Active (+20 mins appended)</p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-foreground">{activePatient.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{activePatient.age} Yrs · Token: <span className="font-mono font-bold text-primary">{activePatient.token}</span></p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Logged Nurse Vitals Triage</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                    {[
                      { label: "Blood Pressure", val: activePatient.vitals.bp },
                      { label: "Heart Rate", val: `${activePatient.vitals.hr} BPM` },
                      { label: "Temperature", val: `${activePatient.vitals.temp} °F` },
                      { label: "SpO₂ Oxygen", val: `${activePatient.vitals.spo2} %` },
                    ].map((v) => (
                      <div key={v.label} className="rounded border border-border bg-secondary/20 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium">{v.label}</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{v.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs border-t border-border/40 pt-2.5">
                  <p className="font-bold text-muted-foreground mb-1">Chief Symptoms / Complaint</p>
                  <p className="bg-secondary/30 p-2 rounded text-foreground font-medium">{activePatient.complaint}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2.5 shadow-sm">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Electronic Health Progress Note</p>
                <textarea
                  placeholder="Document clinical findings, assessment plans..."
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="h-28 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* RIGHT SUB-PANEL: DIAGNOSIS & PRESCRIPTIONS */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-1.5">Diagnosis & Prescriptions</p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Primary Diagnosis / Lab Tests</label>
                    <select
                      value={selectedDiagnosis}
                      onChange={(e) => setSelectedDiagnosis(e.target.value)}
                      className="w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Select Lab Investigation / Code...</option>
                      {DIAGNOSIS_CODES.map((d) => (
                        <option key={d.code} value={d.label}>{d.code} - {d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Prescribe Pharmacy Drugs</label>
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
                        <span key={med.name} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] text-primary font-medium border border-primary/20">
                          {med.name}
                          <X className="h-2.5 w-2.5 cursor-pointer hover:text-destructive" onClick={() => setPrescribedMeds(prev => prev.filter(m => m.name !== med.name))} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleSkipPatient} className="rounded-md border border-border bg-card py-2 text-xs font-semibold text-foreground hover:bg-accent transition">Skip Patient</button>
                    <button onClick={() => setIsAdmitModalOpen(true)} className="rounded-md bg-amber-600/10 border border-amber-600/20 py-2 text-xs font-bold text-amber-700 hover:bg-amber-600/20 transition">Admit Patient</button>
                  </div>

                  <button onClick={handleSubmitConsultation} className="w-full rounded-md bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition">
                    Sign & Dispatch Consultation ➔
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

      {/* Bed Management Popup Allocation Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Available Bed Allocation Matrix</h3>
              </div>
              <button onClick={() => setIsAdmitModalOpen(false)} className="rounded p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-medium">
              {allBeds.filter((bed) => bed.status !== "Occupied").map((bed) => (
                <div
                  key={bed.id}
                  onClick={() => {
                    alert(`Bed ${bed.id} allocated successfully!`);
                    setIsAdmitModalOpen(false);
                  }}
                  className={cn(
                    "border p-3 rounded-lg text-center cursor-pointer transition transform hover:scale-105",
                    bed.status === "Available" ? "bg-success/10 text-success border-success/30 hover:bg-success/20" : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
                  )}
                >
                  <p className="font-bold text-sm">{bed.id}</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{bed.ward}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}