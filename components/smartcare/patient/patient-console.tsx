"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

const SYMPTOM_KEYWORDS = ["fever", "pain", "cough", "headache", "nausea", "breath", "dizzy"]

export function PatientConsole({
  section,
  onNavigate,
}: {
  section: string
  onNavigate: (key: string) => void
}) {
  const [form, setForm] = useState<PatientForm>({
    name: "",
    phone: "",
    age: "",
    symptoms: "",
  })
  const [token, setToken] = useState<string | null>(null)
  const [stage, setStage] = useState(0)

  const generateToken = useCallback(() => {
    const num = 118 + Math.floor(Math.random() * 40)
    setToken(`A-${num}`)
    setStage((s) => Math.max(s, 1))
  }, [])

  return (
    <div className="space-y-5">
      {section === "dashboard" && (
        <PatientDashboard token={token} stage={stage} onNavigate={onNavigate} />
      )}
      {section === "receptionist" && (
        <VoiceReceptionist
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

/* ------------------------------- Dashboard ------------------------------- */

function PatientDashboard({
  token,
  stage,
  onNavigate,
}: {
  token: string | null
  stage: number
  onNavigate: (k: string) => void
}) {
  const nowServing = 114
  const myNumber = token ? Number(token.split("-")[1]) : 121
  const ahead = Math.max(0, myNumber - nowServing)
  const delay = ahead * 6

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Now Serving" value={`A-${nowServing}`} sub="Counter 02 · Internal Medicine" icon={<Ticket className="h-4 w-4" />} />
        <Stat label="Your Token" value={token ?? "—"} sub={token ? `${ahead} patients ahead` : "Not yet generated"} icon={<Ticket className="h-4 w-4" />} tone="success" />
        <Stat label="Est. Wait" value={`${delay}m`} sub="Recalculated live every 30s" icon={<Clock className="h-4 w-4" />} tone="warning" />
        <Stat label="Triage Status" value={stage >= 1 ? "Queued" : "Pending"} sub={`Stage ${stage + 1} of ${ADMISSION_STAGES.length}`} icon={<Activity className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Today's Tasks"
            subtitle="High-visibility action items for your visit"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <div className="divide-y divide-border">
            {[
              { t: "Generate your visit token", done: !!token, cta: "register" },
              { t: "Complete QR pre-arrival check-in", done: false, cta: "checkin" },
              { t: "Confirm symptoms with AI receptionist", done: false, cta: "receptionist" },
              { t: "Review admission pipeline status", done: stage > 1, cta: "admission" },
            ].map((task) => (
              <TaskRow key={task.t} {...task} onNavigate={onNavigate} />
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Visit Snapshot" icon={<Activity className="h-4 w-4" />} />
          <div className="space-y-3 p-4 text-sm">
            <Row k="Department" v="Internal Medicine" />
            <Row k="Provider" v="Dr. Amelia Shaw" />
            <Row k="Appointment" v="Today · 2:40 PM" />
            <Row k="Room Target" v={<Badge className="bg-primary/10 text-primary border-primary/25">GEN-08 (predicted)</Badge>} />
            <Row k="Pre-arrival window" v="30 min before slot" />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function TaskRow({
  t,
  done,
  cta,
  onNavigate,
}: {
  t: string
  done: boolean
  cta: string
  onNavigate: (k: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border",
            done
              ? "border-success bg-success text-white"
              : "border-border text-transparent",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span className={cn("text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>
          {t}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onNavigate(cta)}
        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent"
      >
        {done ? "View" : "Start"}
      </button>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  )
}

/* --------------------------- Voice Receptionist -------------------------- */

function VoiceReceptionist({
  onTriage,
  onGoRegister,
}: {
  onTriage: (p: Partial<PatientForm>) => void
  onGoRegister: () => void
}) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      from: "bot",
      text: "Hello, I'm your SmartCare AI receptionist. Tap the mic and describe how you're feeling — for example, \"I have a fever and bad cough.\"",
    },
  ])
  const [flash, setFlash] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const idRef = useRef(1)

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushMsg(from: "bot" | "user", text: string) {
    setMessages((m) => [...m, { id: idRef.current++, from, text }])
  }

  function handleTranscript(transcript: string) {
    pushMsg("user", transcript)
    const lower = transcript.toLowerCase()
    const found = SYMPTOM_KEYWORDS.filter((k) => lower.includes(k))

    if (found.length > 0) {
      const parsed: Partial<PatientForm> = {
        symptoms: transcript,
      }
      // Heuristic name + phone extraction (frontend triage parser)
      const nameMatch = transcript.match(/(?:my name is|i am|this is)\s+([a-z]+(?:\s[a-z]+)?)/i)
      if (nameMatch) parsed.name = capitalize(nameMatch[1])
      const phoneMatch = transcript.match(/(\+?\d[\d\s-]{8,}\d)/)
      if (phoneMatch) parsed.phone = phoneMatch[1].replace(/\s+/g, "")
      if (!parsed.name) parsed.name = "Priya Raman"
      if (!parsed.phone) parsed.phone = "+1 415 555 0199"

      onTriage(parsed)
      pushMsg(
        "bot",
        `I detected possible symptoms: ${found.join(", ")}. I've auto-filled your Smart Registration form with name, phone and symptoms. Please review and generate your token.`,
      )
      setFlash(`Triage matched: ${found.join(", ")} — registration pre-filled.`)
      window.setTimeout(() => setFlash(null), 6000)
    } else {
      pushMsg(
        "bot",
        "I didn't catch a clear symptom. Try mentioning words like fever, pain, cough or headache so I can triage you.",
      )
    }
  }

  function toggleListen() {
    if (!supported) {
      // Graceful simulated fallback for non-supporting browsers
      handleTranscript("My name is Priya Raman, I have a high fever and a cough for four days")
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
            <div
              key={m.id}
              className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  m.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {flash ? (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
            <Sparkles className="h-4 w-4" />
            {flash}
            <button
              type="button"
              onClick={onGoRegister}
              className="ml-auto rounded border border-success/40 px-2 py-0.5 text-xs hover:bg-success/15"
            >
              Open form
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3 border-t border-border p-4">
          <button
            type="button"
            onClick={toggleListen}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground transition",
              listening ? "animate-pulse bg-destructive" : "bg-primary hover:opacity-90",
            )}
            aria-label={listening ? "Stop listening" : "Start listening"}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {listening ? "Listening… speak now" : "Tap to speak"}
            </p>
            <p className="text-xs text-muted-foreground">
              {supported
                ? "Try: \"I have a fever and a cough\""
                : "Speech API unavailable — tap to run a sample triage."}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="How Triage Works" icon={<Sparkles className="h-4 w-4" />} />
        <div className="space-y-3 p-4 text-sm">
          {[
            "Capture live voice via Web Speech API",
            "Scan transcript for clinical keywords",
            "Auto-fill name, phone & symptoms",
            "Flash confirmation & route to registration",
          ].map((s, i) => (
            <div key={s} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-foreground">{s}</p>
            </div>
          ))}
          <div className="mt-2 rounded-md border border-border bg-secondary p-3 text-xs text-muted-foreground">
            Detected keywords: {SYMPTOM_KEYWORDS.join(", ")}.
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* --------------------------- Smart Registration -------------------------- */

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
        <PanelHeader
          title="Smart Registration"
          subtitle="Fields auto-populate from AI voice triage"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <form className="grid gap-4 p-4" onSubmit={submit}>
          <Field label="Full Name">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Priya Raman"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 415 555 0100"
              />
            </Field>
            <Field label="Age">
              <input
                className={inputCls}
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                placeholder="33"
              />
            </Field>
          </div>
          <Field label="Symptoms / Chief Complaint">
            <textarea
              className={cn(inputCls, "min-h-24 resize-none")}
              value={form.symptoms}
              onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
              placeholder="Describe symptoms…"
            />
          </Field>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Ticket className="h-4 w-4" />
            Generate Token
          </button>
        </form>
      </Panel>

      {/* Digital hospital passport */}
      <Panel className="overflow-hidden">
        <PanelHeader title="Digital Hospital Passport" icon={<Ticket className="h-4 w-4" />} />
        <div className="p-4">
          {token ? (
            <div
              className={cn(
                "rounded-xl border border-primary/30 bg-sidebar p-5 text-sidebar-foreground transition-all duration-500",
                showPass ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sidebar-primary" />
                  <span className="text-sm font-bold">SmartCare AI</span>
                </div>
                <Badge className="border-success/40 bg-success/15 text-success">Confirmed</Badge>
              </div>
              <div className="mt-5 text-center">
                <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60">
                  Queue Token
                </p>
                <p className="text-5xl font-bold tracking-tight text-sidebar-primary-foreground">
                  {token}
                </p>
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
                <QrCode className="h-4 w-4" />
                Scan at kiosk for instant check-in
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary text-center">
              <Ticket className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No token yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Complete the form and tap Generate Token to receive your digital
                hospital passport.
              </p>
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

/* ------------------------------ QR Check-In ------------------------------ */

function QrCheckIn({ token }: { token: string | null }) {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)

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
      <Panel className="lg:col-span-2">
        <PanelHeader
          title="QR Pre-Arrival Check-In"
          subtitle="Contactless kiosk scanner simulator"
          icon={<QrCode className="h-4 w-4" />}
        />
        <div className="flex flex-col items-center justify-center p-6">
          <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border-2 border-primary/30 bg-sidebar">
            {/* corner brackets */}
            <span className="absolute left-3 top-3 h-7 w-7 border-l-2 border-t-2 border-sidebar-primary" />
            <span className="absolute right-3 top-3 h-7 w-7 border-r-2 border-t-2 border-sidebar-primary" />
            <span className="absolute bottom-3 left-3 h-7 w-7 border-b-2 border-l-2 border-sidebar-primary" />
            <span className="absolute bottom-3 right-3 h-7 w-7 border-b-2 border-r-2 border-sidebar-primary" />

            {scanned ? (
              <div className="text-center text-sidebar-foreground">
                <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
                <p className="mt-2 text-sm font-semibold">Check-in confirmed</p>
                <p className="text-xs text-sidebar-foreground/60">{token ?? "A-121"} verified</p>
              </div>
            ) : (
              <>
                <QrCode className="h-28 w-28 text-sidebar-foreground/80" />
                {scanning ? (
                  <span className="absolute left-3 right-3 top-3 h-0.5 animate-[scan_2s_linear_infinite] bg-sidebar-primary shadow-[0_0_12px_2px] shadow-sidebar-primary" style={{ animation: "scanline 2s linear infinite" }} />
                ) : null}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={startScan}
            disabled={scanning}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <ScanLine className="h-4 w-4" />
            {scanning ? "Scanning…" : scanned ? "Scan again" : "Start scan"}
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
              <p className="mt-1 text-sm font-medium text-foreground">
                Pre-Arrival Requirement
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Scan your QR within 30 minutes before your slot to lock your
                position in the live queue.
              </p>
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Grace Window Engine" icon={<TimerReset className="h-4 w-4" />} />
          <div className="p-4">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="text-3xl font-bold text-warning">3 tokens</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Queue Holding Engine
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                If you arrive late, your slot is held for up to 3 tokens before
                automatic re-queue.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* --------------------------- Admission Pipeline -------------------------- */

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
              <button
                type="button"
                onClick={() => setStage((s) => Math.max(0, s - 1))}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
              >
                Step back
              </button>
              <button
                type="button"
                onClick={() => setStage((s) => Math.min(ADMISSION_STAGES.length - 1, s + 1))}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                Advance stage
              </button>
            </div>
          }
        />
        <div className="p-5">
          {/* Horizontal rail (desktop), vertical (mobile) */}
          <ol className="flex flex-col gap-0 md:flex-row md:gap-2">
            {ADMISSION_STAGES.map((s, i) => {
              const done = i < stage
              const current = i === stage
              return (
                <li key={s.key} className="flex flex-1 gap-3 md:flex-col">
                  <div className="flex flex-col items-center md:w-full md:flex-row">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                        done
                          ? "border-success bg-success text-white"
                          : current
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "mx-2 hidden h-0.5 flex-1 md:block",
                        i < ADMISSION_STAGES.length - 1
                          ? done
                            ? "bg-success"
                            : "bg-border"
                          : "bg-transparent",
                      )}
                    />
                    <span
                      className={cn(
                        "ml-3 w-0.5 flex-1 md:hidden",
                        i < ADMISSION_STAGES.length - 1 ? (done ? "bg-success" : "bg-border") : "bg-transparent",
                      )}
                    />
                  </div>
                  <div className="pb-6 md:pb-0 md:pt-3">
                    <p className={cn("text-sm font-semibold", current ? "text-primary" : "text-foreground")}>
                      {s.label}
                    </p>
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
                <p
                  className={cn(
                    "mt-3 text-sm font-semibold",
                    r.tone === "success" ? "text-success" : r.tone === "warning" ? "text-warning" : "text-primary",
                  )}
                >
                  {r.prob} match
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Care Team" icon={<Activity className="h-4 w-4" />} />
          <div className="space-y-3 p-4 text-sm">
            <Row k="Attending" v="Dr. Amelia Shaw" />
            <Row k="Nurse" v="J. Okonkwo, RN" />
            <Row k="Target ward" v="General Medicine" />
            <Row k="ETA to bed" v={<Badge className="border-warning/40 bg-warning/15 text-warning">~22 min</Badge>} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
