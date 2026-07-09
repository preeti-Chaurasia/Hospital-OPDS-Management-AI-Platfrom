"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import React from "react"
import {
  AlarmClock,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  QrCode,
  Sparkles,
  Ticket,
  TimerReset,
  TriangleAlert,
  UserPlus,
  Activity,
  Bot,
  ScanLine,
  Pill,      // Added for Pharmacy Orders
  FileText,  // Added for Lab Reports
  Heart,     // Added for BP
  Thermometer, // Added for Temperature
  Droplet,   // Added for SpO2
  Wind       // Added for Respiration
} from "lucide-react"

import { Panel, PanelHeader, Badge, Stat, Field, inputCls } from "../ui"
import { ADMISSION_STAGES } from "@/lib/medical-data"
import { cn } from "@/lib/utils"

interface PatientForm {
  name: string
  phone: string
  age: string
  symptoms: string
}

interface ChatMsg {
  id: number
  from: "bot" | "user"
  text: string
}

// Global Keywords & Datasets for AI Triage Engine
const SYMPTOM_KEYWORDS = [
  "fever", "pain", "cough", "headache", "nausea", "breath", "dizzy", 
  "migraine", "chest pain", "heart", "skin", "rash", "cold", "body ache", "vomiting"
]

const HOSPITAL_FAQS = [
  {
    keywords: ["doctor available", "doctor", "available", "dr", "shaw", "amelia"],
    answer: "Dr. Amelia Shaw is currently available in Bay 3, Internal Medicine."
  },
  {
    keywords: ["cardiology", "heart department", "cardio", "heart room"],
    answer: "Cardiology Department is located on Floor 2, Room 214."
  },
  {
    keywords: ["neurology", "neuro", "brain department"],
    answer: "Neurology Department is located on Floor 3, Room 301."
  },
  {
    keywords: ["emergency", "icu", "casualty"],
    answer: "Emergency Ward is located on the Ground Floor."
  },
  {
    keywords: ["token", "wait time", "waiting", "queue"],
    answer: "Current estimated waiting time is approximately 50 minutes."
  },
  {
    keywords: ["location", "where is", "direction", "find", "room", "floor", "department"],
    answer: "General Medicine is on the Ground Floor (Room 101). Cardiology is on Floor 2 (Room 214). Neurology is on Floor 3 (Room 301)."
  }
]

const DEPARTMENTS = [
  {
    symptoms: ["fever", "cough", "cold", "body ache", "chills"],
    department: "General Medicine",
    room: "Room 101 Ground Floor",
  },
  {
    symptoms: ["headache", "migraine", "dizzy", "dizziness"],
    department: "Neurology",
    room: "Room 301 Third Floor",
  },
  {
    symptoms: ["chest pain", "heart", "palpitation", "breathless"],
    department: "Cardiology",
    room: "Room 214 Second Floor",
  },
  {
    symptoms: ["skin", "rash", "itching", "allergy"],
    department: "Dermatology",
    room: "Room 118 First Floor",
  }
]

// 👨‍👩‍👧‍👦 ADDED EXCLUSIVELY: MOCK RECORD DATA FOR FAMILY MEMBERS
const FAMILY_DATA = {
  self: {
    name: "Marcus Delgado",
    tokenFallback: 121,
    medicines: [
      { name: "Amoxicillin 500mg", dosage: "1-0-1 (After Food)", duration: "5 Days", status: "Ready for Pickup" },
      { name: "Paracetamol 650mg", dosage: "SOS (When Needed)", duration: "3 Days", status: "Preparing" }
    ],
    labReports: [
      { testName: "Complete Blood Count (CBC)", orderedBy: "Dr. Amelia Shaw", status: "In-Progress" },
      { testName: "Chest X-Ray", orderedBy: "Dr. Amelia Shaw", status: "Pending Upload" }
    ],
    vitals: { bp: "120/80 mmHg", heartRate: "72 bpm", temp: "98.6 °F", spo2: "98%", respiratoryRate: "18 /min" }
  },
  father: {
    name: "Ramanathan K.",
    tokenFallback: 125,
    medicines: [
      { name: "Atorvastatin 10mg", dosage: "0-0-1 (Night)", duration: "30 Days", status: "Ready for Pickup" }
    ],
    labReports: [
      { testName: "HbA1c Blood Screen", orderedBy: "Dr. Amelia Shaw", status: "Completed" }
    ],
    vitals: { bp: "140/90 mmHg", heartRate: "80 bpm", temp: "98.0 °F", spo2: "96%", respiratoryRate: "16 /min" }
  },
  mother: {
    name: "Lakshmi Raman",
    tokenFallback: 128,
    medicines: [
      { name: "Ibuprofen 400mg", dosage: "1-0-1 (After Food)", duration: "3 Days", status: "Preparing" }
    ],
    labReports: [
      { testName: "Widal Test", orderedBy: "Dr. Amelia Shaw", status: "In-Progress" }
    ],
    vitals: { bp: "115/75 mmHg", heartRate: "75 bpm", temp: "100.4 °F", spo2: "99%", respiratoryRate: "18 /min" }
  },
  child: {
    name: "Aarav Raman",
    tokenFallback: 132,
    medicines: [
      { name: "Amoxicillin Syrup", dosage: "5ml (Twice Daily)", duration: "5 Days", status: "Ready for Pickup" }
    ],
    labReports: [],
    vitals: { bp: "105/70 mmHg", heartRate: "95 bpm", temp: "98.2 °F", spo2: "99%", respiratoryRate: "22 /min" }
  }
}

/* =========================================================================
   MAIN PARENT COMPONENT: PatientConsole
   ========================================================================= */
export function PatientConsole({
  section,
  onNavigate,
  patientSession = null,
}: {
  section: string
  onNavigate: (key: string) => void
  patientSession?: { name: string; phone: string; token: string | null; patient_id?: number } | null
})  {
  const [form, setForm] = useState<PatientForm>({
    name: "",
    phone: "",
    age: "",
    symptoms: "",
  })
  const [token, setToken] = useState<string | null>(null)
  const [stage, setStage] = useState(0)

  // ─── ✅ ADDED STATE: FAMILY PATIENT SWITCH ENGINE ───
  const [selectedMember, setSelectedMember] = useState<keyof typeof FAMILY_DATA>("self")

  const generateToken = useCallback(() => {
    const num = 118 + Math.floor(Math.random() * 40)
    setToken(`A-${num}`)
    setStage((s) => Math.max(s, 1))
  }, [])

  return (
    <div className="space-y-5">
      {/* ─── ✅ ADDED UI SEGMENT: PURE DROPDOWN WITH ABSOLUTELY ZERO LAYOUT DISTURBANCE ─── */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Family Gateway</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Select Patient:</span>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value as keyof typeof FAMILY_DATA)}
            className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="self">Self (Marcus Delgado)</option>
            <option value="father">Father (Ramanathan K.)</option>
            <option value="mother">Mother (Lakshmi Raman)</option>
            <option value="child">Child (Aarav Raman)</option>
          </select>
        </div>
      </div>

      {section === "dashboard" && (
        <PatientDashboard token={token} stage={stage} onNavigate={onNavigate} memberKey={selectedMember} />
      )}
      {section === "receptionist" && (
        <VoiceReceptionist
          form={form}
          onTriage={(parsed) => {
            setForm((f) => ({ ...f, ...parsed }))
          }}
          onGoRegister={() => onNavigate("register")}
        />
      )}
      {section === "register" && (
        <SmartRegistration
          form={form}
          setForm={setForm}
          token={token}
          onGenerate={generateToken}
        />
      )}
      {section === "checkin" && <QrCheckIn token={token} />}
      {section === "admission" && <AdmissionPipeline stage={stage} setStage={setStage} />}
    </div>
  )
}

/* =========================================================================
   SUB-COMPONENT 1: Dashboard (Modified smoothly for family switching)
   ========================================================================= */
function PatientDashboard({
  token,
  stage,
  onNavigate,
  memberKey, // ✅ Passed memberKey parameter
}: {
  token: string | null
  stage: number
  onNavigate: (k: string) => void
  memberKey: keyof typeof FAMILY_DATA // ✅ Type security
}) {
  const nowServing = 114
  
  // ─── ✅ DYNAMICALLY READ FROM FAMILY RECORDS Snapshot ───
  const activeData = FAMILY_DATA[memberKey]
  const myNumber = token ? Number(token.split("-")[1]) : activeData.tokenFallback
  const ahead = Math.max(0, myNumber - nowServing)
  const delay = ahead * 6

  const dummyMedicines = activeData.medicines
  const dummyLabReports = activeData.labReports
  const dummyVitals = activeData.vitals

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Now Serving" value={`A-${nowServing}`} sub="Counter 02 · Internal Medicine" icon={<Ticket className="h-4 w-4" />} />
        <Stat label="Your Token" value={token ?? `A-${activeData.tokenFallback}`} sub={`${ahead} patients ahead`} icon={<Ticket className="h-4 w-4" />} tone="success" />
        <Stat label="Est. Wait" value={`${delay}m`} sub="Recalculated live every 30s" icon={<Clock className="h-4 w-4" />} tone="warning" />
        <Stat label="Triage Status" value={stage >= 1 ? "Queued" : "Pending"} sub={`Stage ${stage + 1} of 5`} icon={<Activity className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Panel>
            <PanelHeader
              title="Prescribed Medications"
              subtitle="Live sync with pharmacy fulfillment counter"
              icon={<Pill className="h-4 w-4" />}
            />
            <div className="p-4 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="pb-2">Medication</th>
                      <th className="pb-2">Dosage</th>
                      <th className="pb-2">Duration</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dummyMedicines.map((med, idx) => (
                      <tr key={idx} className="text-foreground">
                        <td className="py-3 font-medium">{med.name}</td>
                        <td className="py-3 text-muted-foreground">{med.dosage}</td>
                        <td className="py-3 text-muted-foreground">{med.duration}</td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                            med.status === "Ready for Pickup" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                          )}>
                            {med.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Requested Diagnostic Lab Reports"
              subtitle="Reports automatically routing to buffer slot on upload"
              icon={<FileText className="h-4 w-4" />}
            />
            <div className="p-4 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="pb-2">Test Name</th>
                      <th className="pb-2">Ordered By</th>
                      <th className="pb-2 text-right">Lab Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dummyLabReports.map((report, idx) => (
                      <tr key={idx} className="text-foreground">
                        <td className="py-3 font-medium">{report.testName}</td>
                        <td className="py-3 text-muted-foreground">{report.orderedBy}</td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium">
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Nurse Pre-Check Vitals" icon={<Activity className="h-4 w-4" />} />
          <div className="space-y-4 p-4 text-sm">
            <div className="p-3 rounded-lg border border-border bg-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4 text-destructive" />
                <span>Blood Pressure</span>
              </div>
              <span className="font-semibold text-foreground">{dummyVitals.bp}</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                <span>Pulse (Heart Rate)</span>
              </div>
              <span className="font-semibold text-foreground">{dummyVitals.heartRate}</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-4 w-4 text-warning" />
                <span>Temperature</span>
              </div>
              <span className="font-semibold text-foreground">{dummyVitals.temp}</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4 text-info" />
                <span>Oxygen (SpO2)</span>
              </div>
              <span className="font-semibold text-foreground">{dummyVitals.spo2}</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TimerReset className="h-4 w-4 text-success" />
                <span>Respiration Rate</span>
              </div>
              <span className="font-semibold text-foreground">{dummyVitals.respiratoryRate}</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* =========================================================================
   SUB-COMPONENT 2: Voice Receptionist (💯 100% ORIGINAL - UNTOUCHED)
   ========================================================================= */
function VoiceReceptionist({
  form,
  onTriage,
  onGoRegister,
}: {
  form: PatientForm
  onTriage: (p: Partial<PatientForm>) => void
  onGoRegister: () => void
}) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      from: "bot",
      text: "Hello, I'm your SmartCare AI receptionist. Tap the mic, describe how you're feeling, or ask any question.",
    },
  ])
  const [flash, setFlash] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const idRef = useRef(1)

  useEffect(() => {
    const SR = typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)
    if (!SR) {
      setSupported(false)
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = "en-US"
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string
      handleTranscript(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
  }, [])

  function pushMsg(from: "bot" | "user", text: string) {
    setMessages((m) => [...m, { id: idRef.current++, from, text }])
  }

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  function handleTranscript(transcript: string) {
    pushMsg("user", transcript)
    const lower = transcript.toLowerCase()

    if (
      lower.includes("register") || 
      lower.includes("form") || 
      lower.includes("fill") || 
      lower.includes("open form") ||
      lower.includes("haan") ||
      lower.includes("yes")
    ) {
      onTriage({
        name: "Marcus Delgado",
        age: "21",
        phone: "+91 9876543210",
        symptoms: form.symptoms || transcript,
      })

      const answer = "I have successfully prepared your registration form with your stated symptoms. You can click 'Open Form' whenever you are ready."
      pushMsg("bot", answer)
      speak(answer)
      setFlash("Registration prepared successfully • Dynamic Symptoms Linked")
      return
    }

    const faqMatch = HOSPITAL_FAQS.find((faq) =>
      faq.keywords.some((k) => lower.includes(k))
    )

    if (faqMatch) {
      pushMsg("bot", faqMatch.answer)
      speak(faqMatch.answer)
      return
    }

    const deptMatch = DEPARTMENTS.find((d) =>
      d.symptoms.some((s) => lower.includes(s))
    )

    if (deptMatch) {
      onTriage({
        name: "Marcus Delgado",
        age: "21",
        phone: "+91 9876543210",
        symptoms: transcript, 
      })

      const answer = `I see. Based on your symptoms, I recommend visiting ${deptMatch.department} at ${deptMatch.room}. Would you like me to fill out your registration form? Just say "Fill the form" or "Register".`
      pushMsg("bot", answer)
      speak(answer)
      setFlash(`${deptMatch.department} recommended • Symptoms updated dynamically`)
      return
    }

    const fallback = "I can help with Department locations, Doctor availability, Queue wait times, or Symptom triage. Try saying: 'I have a fever' or 'Where is Cardiology?'"
    pushMsg("bot", fallback)
    speak(fallback)
  }

  function toggleListen() {
    if (!supported) {
      handleTranscript("I have a high fever and severe body ache, please register my form.")
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel className="lg:col-span-2 flex flex-col">
        <PanelHeader
          title="AI Voice Receptionist"
          subtitle="Browser-native speech recognition · autonomous triage parsing"
          icon={<Bot className="h-4 w-4" />}
          actions={
            <Badge className={supported ? "bg-success/10 text-success border-success/30" : "bg-warning/15 text-warning border-warning/40"}>
              {supported ? "Mic ready" : "Demo mode"}
            </Badge>
          }
        />
        <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 420 }}>
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed", m.from === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground")}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {flash ? (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
            <Sparkles className="h-4 w-4" />
            {flash}
            <button type="button" onClick={onGoRegister} className="ml-auto rounded border border-success/40 px-2 py-0.5 text-xs hover:bg-success/15">
              Open form
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3 border-t border-border p-4">
          <button type="button" onClick={toggleListen} className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground transition", listening ? "animate-pulse bg-destructive" : "bg-primary hover:opacity-90")} aria-label={listening ? "Stop listening" : "Start listening"}>
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <div className="text-sm">
            <p className="font-medium text-foreground">{listening ? "Listening… speak now" : "Tap to speak"}</p>
            <p className="text-xs text-muted-foreground">{supported ? 'Try: "I have a fever" or "Open registration form"' : "Speech API unavailable — tap to run a sample triage."}</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="How Triage Works" icon={<Sparkles className="h-4 w-4" />} />
        <div className="space-y-3 p-4 text-sm">
          {["Tap the microphone and talk naturally about how you are feeling", "The AI will suggest the right medical department and confirm room locations", "Auto-fill name, phone & symptoms", "Say Register my form or Fill form to securely pre-populate your medical details"].map((s, i) => (
            <div key={s} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <p className="text-foreground">{s}</p>
            </div>
          ))}
          <div className="mt-2 rounded-md border border-border bg-secondary p-3 text-xs text-muted-foreground">
             Speak clearly about any past exposure or current infection symptoms to help us automate immediate protective care pathways
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* =========================================================================
   SUB-COMPONENT 3: Smart Registration (💯 ORIGINAL BLUE PASSPORT BOX PRESERVED)
   ========================================================================= */
function SmartRegistration({
  form,
  setForm,
  token,
  onGenerate,
}: {
  form: PatientForm
  setForm: React.Dispatch<React.SetStateAction<PatientForm>>
  token: string | null
  onGenerate: () => void
}) {
  const [showPass, setShowPass] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onGenerate()
    setShowPass(true)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <PanelHeader title="Smart Registration" subtitle="Fields auto-populate from AI voice triage" icon={<UserPlus className="h-4 w-4" />} />
        <form className="grid gap-4 p-4" onSubmit={submit}>
          <Field label="Full Name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya Raman" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number">
              <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 415 555 0100" />
            </Field>
            <Field label="Age">
              <input className={inputCls} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="33" />
            </Field>
          </div>
          <Field label="Symptoms / Chief Complaint">
            <textarea className={cn(inputCls, "min-h-24 resize-none")} value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} placeholder="Describe symptoms…" />
          </Field>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            <Ticket className="h-4 w-4" /> Generate Token
          </button>
        </form>
      </Panel>

      {/* 🔵 ORIGINAL UNTOUCHED BLUE ACCOUNT CARD ENVELOPE */}
      <Panel className="overflow-hidden">
        <PanelHeader title="Digital Hospital Passport" icon={<Ticket className="h-4 w-4" />} />
        <div className="p-4">
          {token ? (
            <div className={cn("rounded-xl border border-primary/30 bg-sidebar p-5 text-sidebar-foreground transition-all duration-500", showPass ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sidebar-primary" />
                  <span className="text-sm font-bold">SmartCare AI</span>
                </div>
                <Badge className="border-success/40 bg-success/15 text-success">Confirmed</Badge>
              </div>
              <div className="mt-5 text-center">
                <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60">Queue Token</p>
                <p className="text-5xl font-bold tracking-tight text-sidebar-primary-foreground">{token}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Passport k="Patient" v={form.name || "—"} />
                <Passport k="Age" v={form.age || "—"} />
                <Passport k="Phone" v={form.phone || "—"} />
                <Passport k="Department" v="Internal Medicine" />
                <Passport k="Provider" v="Dr. Amelia Shaw" />
                <Passport k="Slot" v="Today · 2:40 PM" />
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 rounded-md bg-sidebar-accent py-2 text-xs text-sidebar-foreground/70">
                <QrCode className="h-4 w-4" /> Scan at kiosk for instant check-in
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary text-center">
              <Ticket className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No token yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">Complete the form and tap Generate Token to receive your digital hospital passport.</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}

function Passport({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-sidebar-accent/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-sidebar-foreground/50">{k}</p>
      <p className="truncate text-sm font-medium text-sidebar-foreground">{v}</p>
    </div>
  )
}

/* =========================================================================
   SUB-COMPONENT 4: QrCheckIn (💯 ORIGINAL - UNTOUCHED)
   ========================================================================= */
function QrCheckIn({ 
  token,
  queue = []
}: { 
  token: string | null 
  queue?: any[]
}) {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)

  const mockQueue = queue.length > 0 ? queue : [
    { id: "1", token: "A-118", name: "Marcus Delgado", age: 54, sex: "M", complaint: "Acute chest pain...", priority: "emergency", waitMins: 2 },
    { id: "2", token: "A-119", name: "Priya Raman", age: 33, sex: "F", complaint: "High-grade fever...", priority: "critical", waitMins: 9 },
    { id: "3", token: "A-120", name: "Edward Chen", age: 41, sex: "M", complaint: "Lower back pain...", priority: "stable", waitMins: 18 }
  ]

  const PRIORITY_STYLES: Record<string, { cls: string; label: string; dot: string }> = {
    emergency: { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Emergency", dot: "bg-destructive" },
    critical: { cls: "bg-warning/10 text-warning border-warning/20", label: "Critical", dot: "bg-warning" },
    stable: { cls: "bg-success/10 text-success border-success/20", label: "Stable", dot: "bg-success" },
    routine: { cls: "bg-primary/10 text-primary border-primary/20", label: "Routine", dot: "bg-primary" }
  }

  function startScan() {
    setScanning(true)
    setScanned(false)
    window.setTimeout(() => {
      setScanning(false)
      setScanned(true)
    }, 2200)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel>
        <PanelHeader title="QR Pre-Arrival Check-In" subtitle="Contactless kiosk scanner simulator" icon={<QrCode className="h-4 w-4" />} />
        <div className="flex flex-col items-center justify-center p-6">
          <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border-2 border-primary/30 bg-sidebar">
            <span className="absolute left-3 top-3 h-7 w-7 border-l-2 border-t-2 border-sidebar-primary" />
            <span className="absolute right-3 top-3 h-7 w-7 border-r-2 border-t-2 border-sidebar-primary" />
            <span className="absolute bottom-3 left-3 h-7 w-7 border-b-2 border-l-2 border-sidebar-primary" />
            <span className="absolute bottom-3 right-3 h-7 w-7 border-b-2 border-r-2 border-sidebar-primary" />

            {scanned ? (
              <div className="text-center text-sidebar-foreground animate-fade-in">
                <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
                <p className="mt-2 text-sm font-semibold">Check-in confirmed</p>
                <p className="text-xs text-sidebar-foreground/60">{token ?? "A-121"} verified</p>
              </div>
            ) : (
              <>
                <QrCode className="h-28 w-28 text-sidebar-foreground/80" />
                {scanning && (
                  <span className="absolute left-3 right-3 top-3 h-0.5 bg-sidebar-primary shadow-[0_0_12px_2px] shadow-sidebar-primary" style={{ animation: "scanline 2s linear infinite" }} />
                )}
              </>
            )}
          </div>

          <button type="button" onClick={startScan} disabled={scanning} className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 w-full justify-center">
            <ScanLine className="h-4 w-4" /> {scanning ? "Scanning…" : scanned ? "Scan again" : "Start scan"}
          </button>
          <style>{`@keyframes scanline {0%{top:0.75rem}50%{top:14rem}100%{top:0.75rem}}`}</style>
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel>
          <PanelHeader title="Arrival Window" icon={<AlarmClock className="h-4 w-4" />} />
          <div className="p-4">
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <p className="text-3xl font-bold text-primary">30 min</p>
              <p className="mt-1 text-sm font-medium text-foreground">Pre-Arrival Requirement</p>
              <p className="mt-1 text-xs text-muted-foreground">Scan your QR within 30 minutes before your slot to lock your position in the live queue.</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Grace Window Engine" icon={<TimerReset className="h-4 w-4" />} />
          <div className="p-4">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="text-3xl font-bold text-warning">3 tokens</p>
              <p className="mt-1 text-sm font-medium text-foreground">Queue Holding Engine</p>
              <p className="mt-1 text-xs text-muted-foreground">If you arrive late, your slot is held for up to 3 tokens before automatic re-queue.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="flex flex-col h-full max-h-[440px]">
        <PanelHeader title="Live Active Patient Line" subtitle={`${mockQueue.length} cases processing currently`} icon={<Activity className="h-4 w-4" />} />
        <div className="flex-1 divide-y divide-border overflow-y-auto bg-card">
          {mockQueue.map((p, i) => {
            const ps = PRIORITY_STYLES[p.priority] || PRIORITY_STYLES.stable
            return (
              <div key={p.id} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/20">
                <div className="flex flex-col items-center shrink-0">
                  <span className="font-mono text-sm font-bold text-primary">{p.token}</span>
                  {i === 0 ? (
                    <span className="mt-0.5 text-[9px] font-bold uppercase text-success tracking-wide animate-pulse">In Cabin</span>
                  ) : i === 1 ? (
                    <span className="mt-0.5 text-[9px] font-medium uppercase text-warning tracking-wide">Up Next</span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", ps.dot)} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{p.age}{p.sex} · {p.complaint}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge className={cn("text-[10px] px-2 py-0.5 font-semibold border", ps.cls)}>{ps.label}</Badge>
                    <span className="text-[11px] text-muted-foreground font-medium">{p.waitMins}m wait</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/* =========================================================================
   SUB-COMPONENT 5: AdmissionPipeline (💯 ORIGINAL - UNTOUCHED)
   ========================================================================= */
function AdmissionPipeline({
  stage,
  setStage,
}: {
  stage: number
  setStage: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeader
          title="Admission Pipeline Tracker"
          subtitle="Predictive room allocation & live status rail"
          icon={<Activity className="h-4 w-4" />}
          actions={
            <div className="flex gap-2">
              <button type="button" onClick={() => setStage((s) => Math.max(0, s - 1))} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent">Step back</button>
              <button type="button" onClick={() => setStage((s) => Math.min(ADMISSION_STAGES.length - 1, s + 1))} className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90">Advance stage</button>
            </div>
          }
        />
        <div className="p-5">
          <ol className="flex flex-col gap-0 md:flex-row md:gap-2">
            {ADMISSION_STAGES.map((s, i) => {
              const done = i < stage
              const current = i === stage
              return (
                <li key={s.key} className="flex flex-1 gap-3 md:flex-col">
                  <div className="flex flex-col items-center md:w-full md:flex-row">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition", done ? "border-success bg-success text-white" : current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={cn("mx-2 hidden h-0.5 flex-1 md:block", i < ADMISSION_STAGES.length - 1 ? (done ? "bg-success" : "bg-border") : "bg-transparent")} />
                    <span className={cn("ml-3 w-0.5 flex-1 md:hidden", i < ADMISSION_STAGES.length - 1 ? (done ? "bg-success" : "bg-border") : "bg-transparent")} />
                  </div>
                  <div className="pb-6 md:pb-0 md:pt-3">
                    <p className={cn("text-sm font-semibold", current ? "text-primary" : "text-foreground")}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Predictive Room Allocation" icon={<TriangleAlert className="h-4 w-4" />} />
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {[
              { room: "GEN-08", ward: "General Medicine", prob: "92%", tone: "success" as const },
              { room: "GEN-11", ward: "General Medicine", prob: "74%", tone: "warning" as const },
              { room: "ICU-03", ward: "Intensive Care", prob: "41%", tone: "default" as const },
            ].map((r) => (
              <div key={r.room} className="rounded-lg border border-border bg-secondary p-4">
                <p className="text-lg font-bold text-foreground">{r.room}</p>
                <p className="text-xs text-muted-foreground">{r.ward}</p>
                <p className={cn("mt-3 text-sm font-semibold", r.tone === "success" ? "text-success" : r.tone === "warning" ? "text-warning" : "text-primary")}>{r.prob} match</p>
              </div>
            ))}
          </div>
        </Panel>
        
        <Panel>
          <PanelHeader title="Care Team" icon={<Activity className="h-4 w-4" />} />
          <div className="space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Academic Attending</span>
              <span className="font-medium text-foreground">Dr. Amelia Shaw</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Nurse Core</span>
              <span className="font-medium text-foreground">J. Okonkwo, RN</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Target ward</span>
              <span className="font-medium text-foreground">General Medicine</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ETA to bed</span>
              <span className="font-medium text-foreground">
                <Badge className="border-warning/40 bg-warning/15 text-warning">~22 min</Badge>
              </span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}