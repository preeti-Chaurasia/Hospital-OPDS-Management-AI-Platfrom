"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  BedDouble,
  ChevronRight,
  Droplet,
  FlaskConical,
  Gauge,
  HeartPulse,
  Pill,
  Plus,
  SkipForward,
  Stethoscope,
  Thermometer,
  TriangleAlert,
  UserRound,
  Wind,
  X,
  AlertTriangle,
} from "lucide-react"
import {
  INITIAL_QUEUE,
  PRIORITY_STYLES,
  DIAGNOSIS_CODES,
  COMMON_MEDS,
  type QueuePatient,
} from "@/lib/medical-data"
import { Panel, PanelHeader, Badge } from "../ui"
import { BedMatrix } from "../modules/bed-matrix"
import { MedicineSearch } from "../modules/medicine-search"
import { LabReports } from "../modules/lab-reports"
import { cn } from "@/lib/utils"

 type QueueItem =
  | {
      type: "patient"
      data: QueuePatient
    }
  | 
  {
    type:"buffer"
id:string
lane:string

capacity:number
occupied:number

estimatedEntry:string
date:string
timeWindow:string
countdown:string
runningToken:string
currentServing:string

patientsAhead:number
estimatedWait:string

prediction:string

patients:QueuePatient[] 
    }
    type BufferItem = Extract<QueueItem, { type: "buffer" }>  

interface DoctorDashboardSectionProps {
  section?: string
}
export function DoctorCommandCenter({
  section = "command",
}: DoctorDashboardSectionProps) {
  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_QUEUE)

    function createBufferQueue(patients: QueuePatient[]): QueueItem[] {
  const result: QueueItem[] = []

  let lane = 1

  for (let i = 0; i < patients.length; i += 5) {
    const chunk = patients.slice(i, i + 5)

    // patients block
   chunk.forEach((p) => {
  result.push({
    type: "patient",
    data: p,
  })
})

    // buffer block
   result.push({
  type: "buffer",

  id: `B${lane}`,
  lane: `Room ${lane}`,

  capacity: 5,
  occupied: chunk.length,

  estimatedEntry: "10:12 AM",
  date: "Today",
  timeWindow: "10:00 - 10:30",
  countdown: "12m",
  runningToken: "R05",
  currentServing: "R05",

  patientsAhead: 2,
  estimatedWait: "20 min",

  prediction: "Doctor free in 4 min",

  patients: chunk,
})

    lane++
  }

  return result
}
const queueItems = useMemo(() => createBufferQueue(queue), [queue])


  const [activeId, setActiveId] = useState<string>(INITIAL_QUEUE[0].id)
  const [mobilePanel, setMobilePanel] = useState<"queue" | "file" | "notes">("file")
  const [emergencyMode, setEmergencyMode] = useState(false)


  const [selectedBuffer, setSelectedBuffer] =
useState<BufferItem | null>(null)

const [bufferDrawerOpen, setBufferDrawerOpen] = useState(false)
  
  const toggleEmergencyMode = () => {
    setEmergencyMode((prev) => !prev)
    if (!emergencyMode) {
      setQueue((q) =>
        q.map((p) => ({
          ...p,
          waitMins: Math.max(0, p.waitMins + 10),
        }))
      )
    }
  }

  const active = useMemo(
    () => queue.find((p) => p.id === activeId) ?? queue[0],
    [queue, activeId],
  )
  
  // Show different views based on section - must be after all hooks
  if (section === "beds") return <BedMatrix showAdmitButton={true} onAdmitClick={(bedId) => {}} />
  if (section === "medicines") return <MedicineSearch />
  if (section === "labs") return <LabReports />

  function callNext() {
    setQueue((q) => {
      if (q.length <= 1) return q
      const [, ...rest] = q
      setActiveId(rest[0].id)
      return rest
    })
  }

  function skip() {
    setQueue((q) => {
      if (q.length <= 1) return q
      const [first, ...rest] = q
      const next = [...rest, first]
      setActiveId(next[0].id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Emergency mode alert */}
      {emergencyMode && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">Emergency Mode Active</p>
            <p className="text-xs text-destructive/80">All patients now have +10 min wait times</p>
          </div>
          <button
            type="button"
            onClick={toggleEmergencyMode}
            className="text-xs px-3 py-1 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/20 transition"
          >
            Disable
          </button>
        </div>
      )}

      {/* Mobile column switcher */}
      <div className="flex gap-2 lg:hidden">
        {(["queue", "file", "notes"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setMobilePanel(p)}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-xs font-semibold capitalize transition",
              mobilePanel === p
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {p === "file" ? "Patient File" : p}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        {/* Left: queue */}
       {/* Left: Buffer Queue */}
<div className={cn("lg:col-span-3", mobilePanel !== "queue" && "hidden lg:block")}>
<BufferQueueColumn
    items={queueItems}
    activeId={active?.id}
     onPatientSelect={(id) => {
    setActiveId(id)
    setMobilePanel("file")
    setBufferDrawerOpen(false)
}}
    onBufferClick={(buffer) => {
    if (buffer.type === "buffer") {
        setSelectedBuffer(buffer)
        setBufferDrawerOpen(true)
    }
}}
/>
</div>

        {/* Center: open file */}
        <div className={cn("lg:col-span-5", mobilePanel !== "file" && "hidden lg:block")}>
          {active ? <PatientFile patient={active} /> : <EmptyQueue />}
        </div>

        {/* Right: clinical notes */}
       <div className="relative lg:col-span-4">

    <ClinicalNotes
        patient={active}
        queueLength={queue.length}
        onCallNext={callNext}
        onSkip={skip}
        emergencyMode={emergencyMode}
        onToggleEmergency={toggleEmergencyMode}
        onEmergencyActivate={toggleEmergencyMode}
    />

    {bufferDrawerOpen && (
        <BufferDrawer
            buffer={selectedBuffer}
            onClose={() => setBufferDrawerOpen(false)}
        />
    )}

</div>

</div>
      </div>
  )
  }
function BufferDrawer({
  buffer,
  onClose,
}: {
  buffer: BufferItem | null
  onClose: () => void
}) {
  if (!buffer) return null

  return (
    <>
      {/* Background Blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30 z-40"
      />()

      {/* Drawer */}
      <div className="absolute top-0 right-0 h-full w-[430px] bg-white shadow-2xl border-l z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold">
              {buffer.id}
            </h2>

            <p className="text-sm text-gray-500">
              {buffer.lane}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border p-2 hover:bg-gray-100"
          >
            <X className="w-5 h-5"/>
          </button>

        </div>

        <div className="space-y-5 p-5">
      

<div className="rounded-xl border p-5">

  <h3 className="text-lg font-semibold">
    Buffer Slot Information
  </h3>

  <p className="text-sm text-gray-500 mb-5">
    Live overview of the current slot
  </p>

  <div className="grid grid-cols-2 gap-y-4">

    <div>
      <p className="text-sm text-gray-500">Buffer #</p>
      <p className="font-semibold">{buffer.id}</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Estimated Entry</p>
      <p className="font-semibold">10:12 AM</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Date</p>
      <p className="font-semibold">Today</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Current Serving</p>
      <p className="font-semibold">R05</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Time Window</p>
      <p className="font-semibold">10:00 - 10:30</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Patients Ahead</p>
      <p className="font-semibold">2</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Countdown</p>
      <p className="font-semibold text-orange-500">12m</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Estimated Wait</p>
      <p className="font-semibold">20 min</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Running Token</p>
      <p className="font-semibold">R05</p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Capacity</p>
      <p className="font-semibold">
        {buffer.occupied}/{buffer.capacity}
      </p>
    </div>

  </div>

</div>
          {/* Capacity */}

          <div className="rounded-xl border p-4">

            <p className="text-xs text-gray-500">
              Capacity
            </p>

            <p className="mt-2 text-3xl font-bold">
              {buffer.occupied}/{buffer.capacity}
            </p>

            <div className="mt-3 h-2 rounded bg-gray-200">

              <div
                className="h-2 rounded bg-sky-500"
                style={{
                  width: `${(buffer.occupied / buffer.capacity) * 100}%`,
                }}
              />

            </div>

          </div>

          {/* AI Prediction */}

          <div className="rounded-xl border p-4">

            <h3 className="font-semibold">
              AI Prediction
            </h3>

            <p className="mt-2 text-sky-600 font-medium">
              {buffer.prediction}
            </p>

          </div>

          {/* Status */}

          <div className="rounded-xl border p-4">

            <h3 className="font-semibold">
              Buffer Status
            </h3>

            <p className="mt-2 text-sm text-gray-600">

              Waiting patients stay here until doctor becomes available.

            </p>

          </div>

          {/* AI Suggestions */}

          <div className="rounded-xl border p-4">

            <h3 className="font-semibold mb-3">
              AI Suggestions
            </h3>

            <ul className="space-y-2 text-sm">

              <li>
                ✔ Move next patient after 3 mins
              </li>

              <li>
                ✔ Bed likely available in 7 mins
              </li>

              <li>
                ✔ Doctor utilization 92%
              </li>

              <li>
                ✔ Queue overload risk : Low
              </li>

            </ul>

          </div>

          {/* Live Analytics */}

          <div className="rounded-xl border p-4">

            <h3 className="font-semibold mb-3">
              Live Analytics
            </h3>

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-lg bg-sky-50 p-3">

                <p className="text-xs text-gray-500">
                  Avg Wait
                </p>

                <p className="font-bold text-xl">
                  8 min
                </p>

              </div>

              <div className="rounded-lg bg-green-50 p-3">

                <p className="text-xs text-gray-500">
                  Beds Free
                </p>

                <p className="font-bold text-xl">
                  12
                </p>

              </div>

              <div className="rounded-lg bg-yellow-50 p-3">

                <p className="text-xs text-gray-500">
                  Critical
                </p>

                <p className="font-bold text-xl">
                  1
                </p>

              </div>

              <div className="rounded-lg bg-red-50 p-3">

                <p className="text-xs text-gray-500">
                  Occupancy
                </p>

                <p className="font-bold text-xl">
                  84%
                </p>

              </div>

            </div>

          </div>

          {/* Patient List */}

          <div className="rounded-xl border p-4">

            <h3 className="font-semibold mb-3">
              Patients Inside Buffer
            </h3>

           {buffer.patients.map((p) => (
  <div
    key={p.id}
    className="flex justify-between border-b py-3"
  >
    <div>
      <p className="font-medium">{p.name}</p>

      <p className="text-xs text-gray-500">
        {p.complaint} • Waiting {p.waitMins} min
      </p>
    </div>

   <Badge
  className={PRIORITY_STYLES[p.priority as keyof typeof PRIORITY_STYLES].cls}
>
  {PRIORITY_STYLES[p.priority as keyof typeof PRIORITY_STYLES].label}
</Badge>
  </div>
))}

          </div>

        </div>

      </div>
    </>
  )
}
/* ------------------------------ Queue column ----------------------------- */

function BufferQueueColumn({
  items,
  activeId,
  onPatientSelect,
  onBufferClick,
}: {
  items: QueueItem[]
  activeId?: string
  onPatientSelect: (id: string) => void
 onBufferClick:(buffer:BufferItem)=>void
}) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Active Patient Line"
         subtitle={`${items.filter((i) => i.type === "patient").length} Patients`}
        icon={<UserRound className="h-4 w-4" />}
      />
      <div className="flex-1 divide-y divide-border overflow-y-auto">
       {items.map((item, index) => {

  // ---------------- Patient Card ----------------

  if (item.type === "patient") {

    const p = item.data
    const ps = PRIORITY_STYLES[p.priority]
    const selected = p.id === activeId

    return (
      <button
        key={p.id}
        type="button"
        onClick={() => onPatientSelect(p.id)}
        className={cn(
          "flex w-full items-start gap-3 px-3 py-3 text-left transition",
          selected ? "bg-accent" : "hover:bg-secondary",
        )}
      >
        <div className="flex flex-col items-center">
          <span className="font-mono text-sm font-bold text-primary">
            {p.token}
          </span>

          {index === 0 && (
            <span className="mt-1 text-[10px] text-green-600">
              Up Next
            </span>
          )}
        </div>

        <div className="flex-1">
          <p className="font-semibold">{p.name}</p>

          <p className="text-xs text-muted-foreground">
            {p.age}
            {p.sex} • {p.complaint}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <Badge className={ps.cls}>{ps.label}</Badge>

            <span className="text-xs">
              {p.waitMins} min
            </span>
          </div>
        </div>
      </button>
    )
  }

 if (item.type === "buffer") {
  return (
    <button
      key={item.id}
      type="button"
      onClick={() => onBufferClick(item)}
      className="
        w-full
        px-3
        py-3
        text-left
        transition
        hover:bg-orange-100
      "
    >
      <div className="rounded-xl border border-orange-300 bg-orange-50 p-4">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm font-bold text-orange-700">
              BUFFER SLOT {item.id}
            </p>

            <p className="text-xs text-orange-600">
              {item.lane}
            </p>
          </div>

          <Badge className="bg-orange-200 text-orange-800">
            {item.occupied}/{item.capacity}
          </Badge>

        </div>

        <div className="mt-4 space-y-2">

          <div className="flex justify-between text-sm">
            <span>AI Prediction</span>

            <span className="font-semibold text-sky-600">
              {item.prediction}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Current Serving</span>

            <span>{item.currentServing}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Estimated Wait</span>

            <span>{item.estimatedWait}</span>
          </div>

        </div>

        <div className="mt-4">

          <div className="h-2 rounded-full bg-orange-200">

            <div
              className="h-2 rounded-full bg-orange-500"
              style={{
                width: `${(item.occupied / item.capacity) * 100}%`,
              }}
            />

          </div>

        </div>

      </div>
    </button>
  )
}

})}
      </div>
    </Panel>
  )
}

/* ------------------------------ Patient file ----------------------------- */

function PatientFile({ patient }: { patient: QueuePatient }) {
  const ps = PRIORITY_STYLES[patient.priority]
  const vitals = [
    { icon: <Activity className="h-4 w-4" />, label: "Blood Pressure", value: patient.vitals.bp, unit: "mmHg" },
    { icon: <HeartPulse className="h-4 w-4" />, label: "Heart Rate", value: patient.vitals.hr, unit: "bpm" },
    { icon: <Thermometer className="h-4 w-4" />, label: "Temperature", value: patient.vitals.temp, unit: "°F" },
    { icon: <Droplet className="h-4 w-4" />, label: "SpO₂", value: patient.vitals.spo2, unit: "%" },
    { icon: <Wind className="h-4 w-4" />, label: "Resp. Rate", value: patient.vitals.resp, unit: "/min" },
    { icon: <Gauge className="h-4 w-4" />, label: "Triage", value: patient.priority, unit: "" },
  ]

  // simple sparkline points for HR trend
  const trend = [72, 78, 88, 84, 96, 102, patient.vitals.hr]
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const points = trend
    .map((v, i) => {
      const x = (i / (trend.length - 1)) * 100
      const y = 40 - ((v - min) / Math.max(1, max - min)) * 34 - 3
      return `${x},${y}`
    })
    .join(" ")

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Open Patient File"
        subtitle={`Token ${patient.token}`}
        icon={<Stethoscope className="h-4 w-4" />}
        actions={<Badge className={ps.cls}>{ps.label}</Badge>}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{patient.name}</p>
            <p className="text-xs text-muted-foreground">
              {patient.age} yrs · {patient.sex === "M" ? "Male" : "Female"} · MRN {4400 + patient.age}-{patient.token.slice(-2)}
            </p>
          </div>
        </div>

        {/* Chief complaint */}
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Chief Complaint
          </p>
          <p className="mt-1 text-sm text-foreground">{patient.complaint}</p>
        </div>

        {/* Allergies */}
        {patient.allergies.length > 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-foreground">
              <span className="font-semibold text-destructive">Allergies: </span>
              {patient.allergies.join(", ")}
            </p>
          </div>
        ) : null}

        {/* Vitals grid */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Vital Signs
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {vitals.map((v) => (
              <div key={v.label} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-primary">{v.icon}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide">{v.label}</span>
                </div>
                <p className="mt-1.5 text-lg font-bold tabular-nums text-foreground">
                  {v.value}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{v.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trend chart */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Heart Rate Trend · last 60 min
            </p>
            <span className="text-xs font-semibold text-primary">{patient.vitals.hr} bpm</span>
          </div>
          <svg viewBox="0 0 100 40" className="mt-2 h-20 w-full" preserveAspectRatio="none">
            <polyline
              points={points}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* History */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Medical History
          </p>
          <div className="flex flex-wrap gap-1.5">
            {patient.history.length > 0 ? (
              patient.history.map((h) => (
                <Badge key={h} className="border-border bg-secondary text-foreground">
                  {h}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No significant history on file.</span>
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function EmptyQueue() {
  return (
    <Panel className="flex h-full min-h-72 flex-col items-center justify-center p-8 text-center">
      <UserRound className="h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">Queue cleared</p>
      <p className="mt-1 text-xs text-muted-foreground">No active patients remaining.</p>
    </Panel>
  )
}

/* ----------------------------- Clinical notes ---------------------------- */

interface Rx {
  id: number
  med: string
  sig: string
}

function ClinicalNotes({
  patient,
  queueLength,
  onCallNext,
  onSkip,
  emergencyMode,
  onToggleEmergency,

}: {
  patient?: QueuePatient
  queueLength: number
  onCallNext: () => void
  onSkip: () => void
  emergencyMode: boolean
  onToggleEmergency: () => void
  onEmergencyActivate: () => void
}) {
  const [note, setNote] = useState("")
  const [dxQuery, setDxQuery] = useState("")
  const [dxOpen, setDxOpen] = useState(false)
  const [selectedDx, setSelectedDx] = useState<{ code: string; label: string }[]>([])
  const [medInput, setMedInput] = useState("")
  const [medOpen, setMedOpen] = useState(false)
  const [rx, setRx] = useState<Rx[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const dxResults = DIAGNOSIS_CODES.filter(
    (d) =>
      !selectedDx.some((s) => s.code === d.code) &&
      (d.code.toLowerCase().includes(dxQuery.toLowerCase()) ||
        d.label.toLowerCase().includes(dxQuery.toLowerCase())),
  ).slice(0, 6)

  const medResults = COMMON_MEDS.filter((m) =>
    m.toLowerCase().includes(medInput.toLowerCase()),
  ).slice(0, 6)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  function addMed(med: string) {
    setRx((r) => [...r, { id: Date.now(), med, sig: "1 tab PO BID × 7 days" }])
    setMedInput("")
    setMedOpen(false)
  }

  function applyMacro(text: string) {
    setNote((n) => (n ? `${n}\n${text}` : text))
  }

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Clinical Notes & Orders"
        subtitle={patient ? patient.name : "No patient"}
        icon={<FlaskConical className="h-4 w-4" />}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Macros */}
        <div className="flex flex-wrap gap-1.5">
          {[
            "Patient alert and oriented x3.",
            "No acute distress noted.",
            "Awaiting lab results.",
            "Counseled on medication adherence.",
          ].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => applyMacro(m)}
              className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/40"
            >
              + {m.length > 22 ? m.slice(0, 22) + "…" : m}
            </button>
          ))}
        </div>

        {/* Note */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground">Progress Note</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Document clinical findings, assessment & plan…"
            className="min-h-28 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {/* Diagnosis search */}
        <div className="relative">
          <p className="mb-1.5 text-xs font-medium text-foreground">Diagnosis Codes (ICD-10)</p>
          <input
            value={dxQuery}
            onChange={(e) => {
              setDxQuery(e.target.value)
              setDxOpen(true)
            }}
            onFocus={() => setDxOpen(true)}
            onBlur={() => window.setTimeout(() => setDxOpen(false), 150)}
            placeholder="Search code or condition…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          {dxOpen && dxResults.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {dxResults.map((d) => (
                <li key={d.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setSelectedDx((s) => [...s, d])
                      setDxQuery("")
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-mono text-xs font-bold text-primary">{d.code}</span>
                    <span className="truncate text-foreground">{d.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selectedDx.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedDx.map((d) => (
                <span
                  key={d.code}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-primary"
                >
                  <span className="font-mono font-bold">{d.code}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDx((s) => s.filter((x) => x.code !== d.code))}
                    aria-label={`Remove ${d.code}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Prescriptions */}
        <div className="relative">
          <p className="mb-1.5 text-xs font-medium text-foreground">Prescriptions</p>
          <div className="flex gap-2">
            <input
              value={medInput}
              onChange={(e) => {
                setMedInput(e.target.value)
                setMedOpen(true)
              }}
              onFocus={() => setMedOpen(true)}
              onBlur={() => window.setTimeout(() => setMedOpen(false), 150)}
              placeholder="Add medication…"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                if (medInput.trim()) addMed(medInput.trim())
              }}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {medOpen && medInput && medResults.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {medResults.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      addMed(m)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <Pill className="h-3.5 w-3.5 text-primary" />
                    <span className="text-foreground">{m}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {rx.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {rx.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.med}</p>
                    <p className="text-[11px] text-muted-foreground">{r.sig}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRx((list) => list.filter((x) => x.id !== r.id))}
                    aria-label="Remove prescription"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Macro action buttons */}
      <div className="space-y-2 border-t border-border p-4">
        {/* Emergency Mode Button */}
        <button
          type="button"
          onClick={() => {
            onToggleEmergency()
            flash(emergencyMode ? "Emergency Mode disabled" : "Emergency Mode activated - wait times +10min")
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition",
            emergencyMode
              ? "bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
              : "bg-secondary text-foreground border border-border hover:border-destructive/50"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          {emergencyMode ? "Disable Emergency Mode" : "Activate Emergency Mode"}
        </button>

        {toast ? (
          <div className="mb-1 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success">
            {toast}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            onCallNext()
            flash("Encounter signed. Next patient called.")
          }}
          disabled={queueLength <= 1}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          Call Next Patient
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onSkip()
              flash("Patient moved to end of queue.")
            }}
            disabled={queueLength <= 1}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </button>
          <button
            type="button"
            onClick={() => flash("Predictive bed admission authorized (GEN-08).")}
            className="flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            <BedDouble className="h-4 w-4" />
            Admit
          </button>
        </div>
      </div>
    </Panel>
  )
}
