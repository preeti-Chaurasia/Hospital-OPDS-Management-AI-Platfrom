"use client"

import { useState } from "react"
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
  Bed,
} from "lucide-react"
import {
  STAFF_REGISTRATIONS,
  QUEUE_ENTRIES,
  LAB_TESTS,
  ADMISSION_REQUESTS,
  PRIORITY_STYLES,
  type LabTest,
} from "@/lib/medical-data"
import { cn } from "@/lib/utils"

const NOTIFICATION_ITEMS = [
  { id: 1, time: "09:45 AM", msg: "Dr. Shaw admitted Marcus Delgado to ICU-01", type: "admission" },
  { id: 2, time: "09:30 AM", msg: "Lab report ready for Priya Raman - Chest X-Ray", type: "lab" },
  { id: 3, time: "09:15 AM", msg: "New emergency patient registered - Token A-125", type: "registration" },
  { id: 4, time: "09:00 AM", msg: "Bed ICU-03 now available for allocation", type: "bed" },
]

export function StaffDashboard({ section }: { section: string }) {
  const [registrations, setRegistrations] = useState(STAFF_REGISTRATIONS)
  const [queueEntries, setQueueEntries] = useState(QUEUE_ENTRIES)
  const [labTests, setLabTests] = useState(LAB_TESTS)
  const [admissions, setAdmissions] = useState(ADMISSION_REQUESTS)
  const [searchQ, setSearchQ] = useState("")
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    sex: "M" as "M" | "F",
    complaint: "",
    phone: "",
  })

  const handleRegisterPatient = () => {
    if (newPatientForm.name && newPatientForm.age && newPatientForm.complaint) {
      const newReg = {
        id: `sr-${registrations.length + 1}`,
        name: newPatientForm.name,
        age: parseInt(newPatientForm.age),
        sex: newPatientForm.sex,
        complaint: newPatientForm.complaint,
        phone: newPatientForm.phone,
        registeredAt: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      }
      setRegistrations([newReg, ...registrations])
      setNewPatientForm({ name: "", age: "", sex: "M", complaint: "", phone: "" })
    }
  }

  const handleLabReportReady = (testId: string) => {
    setLabTests(
      labTests.map((t) =>
        t.id === testId
          ? { ...t, status: "Ready" }
          : t
      ),
    )
  }

  const handleAllocateBed = (admissionId: string) => {
    setAdmissions(
      admissions.map((a) =>
        a.id === admissionId
          ? { ...a, stage: `Allocated - ICU-0${Math.floor(Math.random() * 4) + 1}` }
          : a
      ),
    )
  }

  const handleCheckIn = (queueId: string) => {
    setQueueEntries(
      queueEntries.map((q) =>
        q.id === queueId ? { ...q, status: "In Consultation" } : q
      ),
    )
  }

  if (section === "dashboard") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today's Registrations", value: registrations.length, color: "primary" },
            { label: "Active Queue", value: queueEntries.filter((q) => q.status === "In Queue").length, color: "primary" },
            { label: "Pending Lab Reports", value: labTests.filter((t) => t.status !== "Ready").length, color: "warning" },
            { label: "Pending Admissions", value: admissions.filter((a) => !a.stage.includes("Allocated")).length, color: "destructive" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-3 sm:p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className={cn("mt-2 text-2xl font-bold", `text-${stat.color}`)}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Live Notifications</h3>
          <div className="mt-3 space-y-2.5">
            {NOTIFICATION_ITEMS.map((n) => (
              <div key={n.id} className="flex gap-3 border-l-2 border-primary/30 bg-secondary/30 px-3 py-2">
                <span className="shrink-0 text-xs font-mono text-muted-foreground">{n.time}</span>
                <p className="text-sm text-foreground/80">{n.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (section === "registration") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Register New Patient</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Patient Name"
              value={newPatientForm.name}
              onChange={(e) =>
                setNewPatientForm({ ...newPatientForm, name: e.target.value })
              }
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              placeholder="Age"
              value={newPatientForm.age}
              onChange={(e) =>
                setNewPatientForm({ ...newPatientForm, age: e.target.value })
              }
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={newPatientForm.sex}
              onChange={(e) =>
                setNewPatientForm({
                  ...newPatientForm,
                  sex: e.target.value as "M" | "F",
                })
              }
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            <input
              type="tel"
              placeholder="Phone"
              value={newPatientForm.phone}
              onChange={(e) =>
                setNewPatientForm({ ...newPatientForm, phone: e.target.value })
              }
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Chief Complaint"
              value={newPatientForm.complaint}
              onChange={(e) =>
                setNewPatientForm({ ...newPatientForm, complaint: e.target.value })
              }
              className="col-span-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none sm:col-span-2"
            />
            <button
              onClick={handleRegisterPatient}
              className="col-span-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:col-span-2"
            >
              <Plus className="h-4 w-4" />
              Generate Token
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Registered Patients</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-8 w-32 rounded border border-border bg-secondary px-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Age</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Complaint</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Phone</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations
                  .filter((r) =>
                    r.name.toLowerCase().includes(searchQ.toLowerCase()),
                  )
                  .map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/50 hover:bg-secondary/30"
                    >
                      <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.age}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.complaint}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.phone}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.registeredAt}</td>
                      <td className="px-3 py-2">
                        <button className="rounded-sm bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20">
                          <QrCode className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (section === "queue") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Live Patient Queue</h3>
          <div className="mt-3 grid gap-2">
            {queueEntries.map((q) => {
              const prio = PRIORITY_STYLES[q.priority]
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                      {q.token}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{q.patientName}</p>
                      <p className="text-xs text-muted-foreground">{q.registeredTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", prio.cls)}>
                      {prio.label}
                    </span>
                    {q.status === "In Queue" && (
                      <button
                        onClick={() => handleCheckIn(q.id)}
                        className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success hover:bg-success/20"
                      >
                        QR Check-In
                      </button>
                    )}
                    {q.status === "In Consultation" && (
                      <span className="text-xs font-medium text-orange-600">In Consultation</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (section === "labs") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Pending Lab Tests</h3>
          <div className="mt-3 space-y-2">
            {labTests.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{t.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.testType} · Req by {t.requestedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === "Ready" && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle className="h-3 w-3" />
                      Ready
                    </span>
                  )}
                  {t.status === "Pending" && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                  {t.status === "In Progress" && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <AlertCircle className="h-3 w-3" />
                      In Progress
                    </span>
                  )}
                  {t.status !== "Ready" && (
                    <button
                      onClick={() => handleLabReportReady(t.id)}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (section === "admissions") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Pending Admissions</h3>
          <div className="mt-3 space-y-2">
            {admissions.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.doctorName} · {a.bedNeeded}
                  </p>
                  <p className="mt-1 text-xs text-primary">{a.stage}</p>
                </div>
                {!a.stage.includes("Allocated") && (
                  <button
                    onClick={() => handleAllocateBed(a.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Bed className="h-3 w-3" />
                    Allocate Bed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
