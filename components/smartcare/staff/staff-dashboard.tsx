"use client"

import { useState, useEffect,useMemo } from "react"

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Plus,
  QrCode,
  Search,
  AlertTriangle,
  Sparkles,
  BedDouble,
  LayoutDashboard,
  UserPlus,
  Users,
  Activity,
  UploadCloud,
  FileText,
} from "lucide-react"
import { Panel, PanelHeader, Badge, Stat } from "../ui"
import { type PatientVitals } from "@/lib/medical-data"
import { cn } from "@/lib/utils"
import {
  BED_STATUS_STYLES,
  BedStatus,
  buildBeds,
  WARDS,
  getVitalsRecommendations,
  type Bed,
} from "@/lib/medical-data"

const PRIORITY_STYLES = {
  emergency: {
    cls: "bg-red-100 text-red-700 border-red-300",
    label: "Emergency",
  },

  urgent: {
    cls: "bg-yellow-100 text-yellow-700 border-yellow-300",
    label: "Urgent",
  },

  stable: {
    cls: "bg-green-100 text-green-700 border-green-300",
    label: "Stable",
  },

  routine: {
    cls: "bg-blue-100 text-blue-700 border-blue-300",
    label: "Routine",
  },
}

const NOTIFICATION_ITEMS = [
  { id: 1, time: "09:45 AM", msg: "Dr. Shaw admitted Marcus Delgado to ICU-01", type: "admission" },
  { id: 2, time: "09:30 AM", msg: "Lab report ready for Priya Raman - Chest X-Ray", type: "lab" },
  { id: 3, time: "09:15 AM", msg: "New emergency patient registered - Token A-125", type: "registration" },
  { id: 4, time: "09:00 AM", msg: "Bed ICU-03 now available for allocation", type: "bed" },
]


export function StaffDashboard({ section }: { section: string }) {
const [registrations, setRegistrations] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
const [queueEntries, setQueueEntries] = useState<any[]>([])
const [labTests, setLabTests] = useState<any[]>([])

  const [searchQ, setSearchQ] = useState("")
  const [expandedLabTest, setExpandedLabTest] = useState<string | null>(null)
  const [loading,setLoading]=useState(true)
  const [labRemarks, setLabRemarks] = useState<Record<string, string>>({})
  const [beds, setBeds] = useState<Bed[]>(() => buildBeds())
const [ward, setWard] = useState<(typeof WARDS)[number] | "All">("All")
const [timelineMode, setTimelineMode] = useState<"current" | "predicted">("current")
const [optimizationLogs, setOptimizationLogs] = useState<string[]>([])

useEffect(() => {
  console.log("Total Beds:", beds.length)
}, [beds])

useEffect(()=>{
   fetchDashboard()
},[])
async function fetchDashboard() {
  try {
    const res = await fetch("/api/staff/dashboard")

    const data = await res.json()

   setDashboardData(data)

setQueueEntries(data.queue || [])

setLabTests(data.labTests || [])
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    sex: "M" as "M" | "F",
    complaint: "",
    phone: "",
  })
  
  const [vitalsForm, setVitalsForm] = useState<PatientVitals>({
    bp: "",
    pulse: 0,
    temp: 0,
    spo2: 0,
    height: 0,
    weight: 0,
  })
  const [recommendedVitals, setRecommendedVitals] = useState<string[]>([])

  // Receptionist Token generation logic + mapping queue lists live (Fixed Type Mismatches)
  const handleRegisterPatient = async () => {
    if (newPatientForm.name && newPatientForm.age && newPatientForm.complaint) {

      const response = await fetch("/api/patient/register", {
  method:"POST",
  headers:{
    "Content-Type":"application/json"
  },
  body:JSON.stringify({
    full_name:newPatientForm.name,
    phone:newPatientForm.phone,
    age:parseInt(newPatientForm.age),
    gender:newPatientForm.sex,
    chief_complaint:newPatientForm.complaint,

    owner_patient_id:null,
    relationship:"self"
  })
})


const result = await response.json()

console.log("REGISTER RESULT:",result)


if(!result.success){
  alert("Patient registration failed")
  return
}
      const nextTokenNum = 122 + queueEntries.length
      const tokenGenerated = `A-${nextTokenNum}`

      
      // 1. Add to registration history database tracking block
      const newReg = {
        id: `sr-${dashboardData?.stats?.todaysPatients + 1}`,
        name: newPatientForm.name,
        age: parseInt(newPatientForm.age),
        sex: newPatientForm.sex,
        complaint: newPatientForm.complaint,
        phone: newPatientForm.phone,
        registeredAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        vitals: vitalsForm.bp && vitalsForm.pulse > 0 ? vitalsForm : undefined,
      }

      // 2. Insert immediately inside live queuing dashboard line with exact Capitalized priorities
      const newQueueNode = {
        id: `q-${queueEntries.length + 1}`,
        token: tokenGenerated,
        patientName: newPatientForm.name,
        name: newPatientForm.name,
        age: parseInt(newPatientForm.age),
        sex: newPatientForm.sex,
        complaint: newPatientForm.complaint,
        registeredTime: "Just Now",
        waitMins: 5,
        priority: (parseInt(newPatientForm.age) > 60 || newPatientForm.complaint.toLowerCase().includes("chest") 
          ? "Emergency" 
          : "Stable") as any, 
        status: "In Queue" as any 
      }

      setRegistrations([newReg, ...registrations])
      setQueueEntries([newQueueNode, ...queueEntries])
      
      // Reset workflows form values safely
      setNewPatientForm({ name: "", age: "", sex: "M", complaint: "", phone: "" })
      setVitalsForm({ bp: "", pulse: 0, temp: 0, spo2: 0, height: 0, weight: 0 })
      setRecommendedVitals([])
    }
  }
  
  // FIXED TYPO HERE: Changed "NewPatientForm" to "setNewPatientForm"

  const handleComplaintChange = (complaint: string) => {
    setNewPatientForm({ ...newPatientForm, complaint })
    if (newPatientForm.age) {
      const recommendations = getVitalsRecommendations(
        parseInt(newPatientForm.age),
        newPatientForm.sex,
        complaint
      )
      setRecommendedVitals(recommendations)
    }
  }

  const handleLabReportReady = (testId: string, filename: string) => {
    setLabTests(
      labTests.map((t) =>
        t.report_id === testId
          ? { ...t, status: "Ready", reportFile: filename || "clinical_report.pdf" }
          : t
      ),
    )
  }

 const handleConsultationCheckIn = (queueId: number) => {
    setQueueEntries(
      queueEntries.map((q:any) =>
        q.appointment_id === queueId ? { ...q, status: "In Consultation" } : q
      ),
    )
  }
const cycle: Record<BedStatus, BedStatus> = {
  Occupied: "Vacating Soon",
  "Vacating Soon": "Available",
  Available: "Cleaning Required",
  "Cleaning Required": "Cleaning In Progress",
  "Cleaning In Progress": "Occupied",
}

const currentStyles = BED_STATUS_STYLES

const handleTimelinePrediction = () => {
  setTimelineMode("predicted")

  setOptimizationLogs([
    "Clinical discharge criteria satisfied for 3 Critical Care profiles.",
    "ICU-02 & ICU-07 downgraded to General Medicine step-down protocol.",
    "ICU-09 routed safely to Surgical Ward based on recovery rate patterns.",
    "Optimized downstream pipeline: Reserved GEN-04, GEN-07, and SURG-02.",
    "Warning prevented: Avoided emergency block overflow SLA breach by 14%.",
  ])

  setBeds((currentBeds) =>
    currentBeds.map((b) => {
      if (
        b.id === "ICU-02" ||
        b.id === "ICU-07" ||
        b.id === "ICU-09" ||
        b.id === "PED-02"
      ) {
        return {
          ...b,
          status: "Available" as BedStatus,
        }
      }

      if (
        b.id === "GEN-01" ||
        b.id === "GEN-03" ||
        b.id === "SURG-04"
      ) {
        return {
          ...b,
          status: "Vacating Soon" as BedStatus,
        }
      }

      return b
    })
  )
}

const resetTimeline = () => {
  setTimelineMode("current")
  setOptimizationLogs([])
  setBeds(buildBeds())
}

const visible = useMemo(() => {
  return ward === "All"
    ? beds
    : beds.filter((b) => b.ward === ward)
}, [beds, ward])

const counts = useMemo(() => {
const c = {
  Occupied: 0,
  Available: 0,
  "Vacating Soon": 0,
  "Cleaning Required": 0,
  "Cleaning In Progress": 0,
}
  visible.forEach((b) => {
    if (b.status in c) {
      c[b.status as keyof typeof c]++
    }
  })

  return c
}, [visible])
  /* =========================================================================
      VIEW 1: RECEPTIONIST + LAB OPERATIONAL CONSOLE DASHBOARD VIEW
      ========================================================================= */
  if (section === "dashboard" || section === "queue") {
    return (
      <div className="space-y-4">
        {/* Core Counting Matrix Headers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today's Walk-ins", value: dashboardData?.stats?.todaysPatients, color: "text-primary border-primary/20 bg-primary/5" },
            { label: "Live Queue Line",value: dashboardData?.stats?.liveQueue || 0, color: "text-success border-success/20 bg-success/5" },
            { label: "Pending Diagnostics", value: dashboardData?.stats?.pendingDiagnostics || 0, color: "text-warning border-warning/20 bg-warning/5" },
            { label: "Uploaded Records Today", value: dashboardData?.stats?.pendingDiagnostics || 0, color: "text-primary border-primary/20 bg-primary/5" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={cn("mt-2 text-2xl font-bold", stat.color.split(" ")[0])}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Split Screen Grid View Area */}
        <div className="grid gap-4 lg:grid-cols-3">
          
          {/* Left Block Area: Active Live Patient Queue Stream */}
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Live Hospital Consultation Line</h3>
              </div>
              <input
                type="text"
                placeholder="Search line tracker..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-7 w-36 rounded border border-border bg-secondary px-2 text-[11px] text-foreground placeholder-muted-foreground focus:outline-none"
              />
            </div>

            <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {queueEntries
                ?.filter((q) => q.full_name && q.full_name.toLowerCase().includes(searchQ.toLowerCase()))
                ?.map((q) => {
                const prio =
PRIORITY_STYLES[
(q.age > 60 ||
q.chief_complaint?.toLowerCase().includes("chest"))
? "emergency"
: "stable"
] || { cls: "bg-primary/10 text-primary", label: "Routine" }
                  return (
                    <div key={q.appointment_id} className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between transition hover:bg-secondary/40">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary font-mono">
                          {q.token_number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground">{q.full_name}</p>
                         <p className="text-[11px] text-muted-foreground">
    Estimated Wait : {q.estimated_wait} min
</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold border", prio.cls)}>
                          {prio.label}
                        </span>
                        {q.status === "In Queue" ? (
                          <button
                            onClick={() => handleConsultationCheckIn(q.appointment_id)}
                            className="rounded-md bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success border border-success/20 hover:bg-success/20"
                          >
                            Send to Cabin
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-orange-600 bg-warning/5 px-2 py-0.5 rounded border border-warning/10">In Doctor Cabin</span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Right Block Area: Quick Operations Activity Log */}
          <div className="rounded-lg border border-border bg-card p-4 h-fit shadow-sm">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Live Clinical Stream</h3>
            <div className="mt-3 space-y-2.5">
              {dashboardData?.activity?.map((n:any)=>(
                <div key={n.activity_id} className="flex flex-col gap-1 border-l-2 border-primary/30 bg-secondary/30 px-3 py-1.5 rounded-r-md">
                  <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{new Date(n.created_at).toLocaleTimeString()}</span>
                  <p className="text-xs text-foreground/80 font-medium leading-normal">{`${n.activity_type} by ${n.performed_by} (${n.role}) - ${n.full_name}`}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  /* =========================================================================
      VIEW 2: RECEPTIONIST CONTROL - MANUAL PATIENT TOKENS & VITALS LOG CONSOLE
      ========================================================================= */
  if (section === "registration") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
            <UserPlus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">On-Site Direct Walk-In Kiosk Registration</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Delgado"
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Age</label>
                  <input
                    type="number"
                    placeholder="21"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                  <select
                    value={newPatientForm.sex}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, sex: e.target.value as "M" | "F" })}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Chief Complaint / Symptoms</label>
                <input
                  type="text"
                  placeholder="Describe emergency parameters..."
                  value={newPatientForm.complaint}
                  onChange={(e) => handleComplaintChange(e.target.value)}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Vitals Entry Layout Subbox Component */}
            <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border pb-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span>Immediate Pre-Check Triage Vitals Logging</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Blood Pressure</label>
                  <input type="text" placeholder="120/80" value={vitalsForm.bp} onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Pulse Rate (BPM)</label>
                  <input type="number" placeholder="72" value={vitalsForm.pulse || ""} onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: parseInt(e.target.value) || 0 })} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Temperature (°F)</label>
                  <input type="number" step="0.1" placeholder="98.6" value={vitalsForm.temp || ""} onChange={(e) => setVitalsForm({ ...vitalsForm, temp: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">SpO₂ Oxygen (%)</label>
                  <input type="number" placeholder="98" value={vitalsForm.spo2 || ""} onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: parseInt(e.target.value) || 0 })} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Height (cm)</label>
                  <input type="number" placeholder="170" value={vitalsForm.height || ""} onChange={(e) => setVitalsForm({ ...vitalsForm, height: parseInt(e.target.value) || 0 })} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Weight (kg)</label>
                  <input type="number" placeholder="65" value={vitalsForm.weight || ""} onChange={(e) => setVitalsForm({ ...vitalsForm, weight: parseInt(e.target.value) || 0 })} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Dynamic AI Diagnostic Recommendations Fields */}
              {recommendedVitals.length > 0 && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2 mt-2 animate-fade-in">
                  <p className="text-[11px] font-bold text-primary mb-1">💡 AI Smart Suggested Triage Panels:</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendedVitals.map((v) => (
                      <span key={v} className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <button
              onClick={handleRegisterPatient}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Issue Kiosk Ticket & Log Patient Vitals
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================================
      VIEW 3: LAB TECHNICIAN CONTROL - UPLOAD LABORATORY TESTING REPORTS
      ========================================================================= */
  if (section === "labs") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Doctor Requested Laboratory Diagnostics Console</h3>
          </div>

          <div className="space-y-3">
            {labTests.map((t:any) => (
              <div key={t.report_id} className="rounded-lg border border-border bg-secondary/20 p-4 transition hover:bg-secondary/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground">{t.full_name}</p>
                      <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">Token Attached</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ordered Investigation: <span className="font-semibold text-foreground">{t.report_name}</span> · Required By: <span className="font-medium text-foreground">{t.doctor_name}</span>
                    </p>
          
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold border flex items-center gap-1",
                      t.status === "Ready" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                    )}>
                      {t.status === "Ready" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-pulse" />}
                      {t.status === "Ready" ? "Uploaded & Dispatched" : "Awaiting Result Input"}
                    </span>
                    
                    <button
                      onClick={() => setExpandedLabTest(expandedLabTest === t.report_id ? null : t.report_id)}
                      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition"
                    >
                      {expandedLabTest === t.report_id ? "Close Panel" : "Upload & Review"}
                    </button>
                  </div>
                </div>

                {/* Secure Laboratory Document Attachment Node Form */}
                {expandedLabTest === t.report_id && (
                  <div className="mt-4 border-t border-border pt-3 space-y-3 bg-card p-3 rounded-lg border border-border/50 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                        <UploadCloud className="h-3.5 w-3.5 text-primary" />
                        <label>Simulate PDF Digital Lab Document Attachment</label>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g., blood_test_cbc_results_77a.pdf"
                        defaultValue={t.reportFile || ""}
                        id={`file_input_${t.report_id}`}
                        className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-foreground">Pathology Lab Notes / Remarks</label>
                      <textarea
                        placeholder="Type laboratory findings, normal/abnormal margins, or diagnostic impressions here..."
                        value={labRemarks[t.report_id] || ""}
                        onChange={(e) => setLabRemarks({ ...labRemarks, [t.report_id]: e.target.value })}
                        className="h-16 w-full rounded-md border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-primary"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const inputEl = document.getElementById(`file_input_${t.report_id}`) as HTMLInputElement;
                        handleLabReportReady(t.report_id, inputEl?.value);
                        setExpandedLabTest(null);
                      }}
                      className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
                    >
                      Dispatch Report Directly to Patient & Doctor Dashboard
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
if (section === "beds") {
 
      /* ------------------------------- Bed matrix ------------------------------ */


  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                Predictive Resource Logistics Core Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                Simulates predictive downstream ward flow. Our ML engine matches upcoming ICU step-down clearances with expected general and surgical bed availabilities 12 hours in advance to eliminate bottleneck overheads.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1 shadow-sm shrink-0 self-start lg:self-auto">
            <button 
              type="button"
              onClick={resetTimeline}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition",
                timelineMode === "current" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-accent"
              )}
            >
              ⌛ Realtime (Live)
            </button>
            <button 
              type="button"
              onClick={handleTimelinePrediction}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5",
                timelineMode === "predicted" ? "bg-amber-500 text-white shadow shadow-amber-500/20" : "text-muted-foreground hover:bg-accent"
              )}
            >
              🔮 Predict Next 12h Flow
            </button>
          </div>
        </div>

        {optimizationLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/10 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2 md:col-span-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                ⚡ Realtime Auto-Allocation Optimization Actions Taken:
              </p>
            </div>
            {optimizationLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 bg-background/60 rounded-md p-2 border border-border/50 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-tight">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Occupied" value={counts.Occupied} sub="Active patients" icon={<BedDouble className="h-4 w-4" />} tone="danger" />
        <Stat label="Available" value={counts.Available} sub="Ready for allocation" icon={<BedDouble className="h-4 w-4" />} tone="success" />
        <Stat label="Vacating Soon" value={counts["Vacating Soon"]} sub="Predicted discharge" icon={<BedDouble className="h-4 w-4" />} tone="warning" />
     <Stat
  label="Cleaning Required"
  value={counts["Cleaning Required"]}
  sub="Needs housekeeping"
  icon={<BedDouble className="h-4 w-4" />}
/>

<Stat
  label="Cleaning In Progress"
  value={counts["Cleaning In Progress"]}
  sub="Housekeeping running"
  icon={<BedDouble className="h-4 w-4" />}
/>
      </div>

      <Panel>
        <PanelHeader
          title="Predictive Bed Allocation Matrix"
          subtitle="Click any bed to cycle its status manually"
          icon={<BedDouble className="h-4 w-4" />}
          actions={
            <div className="flex flex-wrap gap-1.5">
              {(["All", ...WARDS] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWard(w)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                    ward === w
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          }
        />
        <div className="space-y-5 p-4">
          {(ward === "All" ? WARDS : [ward]).map((w) => {
            const wardBeds = beds.filter((b) => b.ward === w)
            return (
              <div key={w}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {w} · {wardBeds.length} beds
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {wardBeds.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setBeds((list) =>
                          list.map((x) => (x.id === b.id ? { ...x, status: cycle[x.status] as BedStatus } : x)),
                        )
                      }
                      className={cn(
                        "rounded-md border p-2 text-left transition hover:ring-2 hover:ring-ring/30",
                        currentStyles[b.status],
                      )}
                    >
                      <span className="block font-mono text-xs font-bold">{b.id}</span>
                      <span className="mt-0.5 block text-[10px] leading-tight">{b.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3 text-xs">
          <Legend cls="bg-destructive" label="Occupied" />
          <Legend cls="bg-success" label="Available" />
          <Legend cls="bg-warning" label="Vacating Soon" />
       <Legend
cls="bg-orange-500"
label="Cleaning Required"
/>

<Legend
cls="bg-blue-500"
label="Cleaning In Progress"
/>
        </div>
      </Panel>
    </div>
  )
}
  function Legend({
  cls,
  label,
}: {
  cls: string
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-2.5 w-2.5 rounded-sm", cls)} />
      {label}
    </span>
  )
}

  return null
}