export type Role = "patient" | "doctor" | "admin"

export type Priority = "Emergency" | "Critical" | "Stable" | "Routine"

export interface QueuePatient {
  id: string
  token: string
  name: string
  age: number
  sex: "M" | "F"
  complaint: string
  priority: Priority
  waitMins: number
  vitals: {
    bp: string
    hr: number
    temp: number
    spo2: number
    resp: number
  }
  allergies: string[]
  history: string[]
}

export const PRIORITY_STYLES: Record<
  Priority,
  { label: string; cls: string; dot: string }
> = {
  Emergency: {
    label: "Emergency",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
  Critical: {
    label: "Critical",
    cls: "bg-warning/15 text-warning border-warning/40",
    dot: "bg-warning",
  },
  Stable: {
    label: "Stable",
    cls: "bg-success/10 text-success border-success/30",
    dot: "bg-success",
  },
  Routine: {
    label: "Routine",
    cls: "bg-primary/10 text-primary border-primary/25",
    dot: "bg-primary",
  },
}

export const INITIAL_QUEUE: QueuePatient[] = [
  {
    id: "p1",
    token: "A-118",
    name: "Marcus Delgado",
    age: 54,
    sex: "M",
    complaint: "Acute chest pain, radiating to left arm",
    priority: "Emergency",
    waitMins: 2,
    vitals: { bp: "162/98", hr: 112, temp: 99.1, spo2: 94, resp: 22 },
    allergies: ["Penicillin"],
    history: ["Hypertension", "Type 2 Diabetes", "Prior MI (2021)"],
  },
  {
    id: "p2",
    token: "A-119",
    name: "Priya Raman",
    age: 33,
    sex: "F",
    complaint: "High-grade fever with productive cough, 4 days",
    priority: "Critical",
    waitMins: 9,
    vitals: { bp: "118/76", hr: 98, temp: 103.2, spo2: 96, resp: 20 },
    allergies: ["Sulfa drugs"],
    history: ["Asthma"],
  },
  {
    id: "p3",
    token: "A-120",
    name: "Edward Chen",
    age: 41,
    sex: "M",
    complaint: "Lower back pain, post-fall evaluation",
    priority: "Stable",
    waitMins: 18,
    vitals: { bp: "126/82", hr: 76, temp: 98.4, spo2: 99, resp: 16 },
    allergies: [],
    history: ["Lumbar strain (2023)"],
  },
  {
    id: "p4",
    token: "A-121",
    name: "Sofia Marquez",
    age: 28,
    sex: "F",
    complaint: "Routine prenatal follow-up, 26 weeks",
    priority: "Routine",
    waitMins: 24,
    vitals: { bp: "110/70", hr: 84, temp: 98.6, spo2: 99, resp: 15 },
    allergies: ["Latex"],
    history: ["G2P1"],
  },
  {
    id: "p5",
    token: "A-122",
    name: "Henry Okafor",
    age: 67,
    sex: "M",
    complaint: "Shortness of breath, peripheral edema",
    priority: "Critical",
    waitMins: 31,
    vitals: { bp: "148/90", hr: 104, temp: 98.9, spo2: 91, resp: 24 },
    allergies: [],
    history: ["CHF", "Atrial Fibrillation", "CKD Stage 3"],
  },
  {
    id: "p6",
    token: "A-123",
    name: "Lena Vogt",
    age: 19,
    sex: "F",
    complaint: "Migraine with photophobia, 6 hours",
    priority: "Stable",
    waitMins: 38,
    vitals: { bp: "114/72", hr: 80, temp: 98.5, spo2: 100, resp: 14 },
    allergies: ["Codeine"],
    history: ["Chronic migraine"],
  },
]

export const DIAGNOSIS_CODES = [
  { code: "I20.0", label: "Unstable angina" },
  { code: "I21.9", label: "Acute myocardial infarction, unspecified" },
  { code: "J18.9", label: "Pneumonia, unspecified organism" },
  { code: "J45.909", label: "Unspecified asthma, uncomplicated" },
  { code: "R50.9", label: "Fever, unspecified" },
  { code: "M54.5", label: "Low back pain" },
  { code: "I50.9", label: "Heart failure, unspecified" },
  { code: "G43.909", label: "Migraine, unspecified, not intractable" },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications" },
  { code: "I10", label: "Essential (primary) hypertension" },
  { code: "N18.3", label: "Chronic kidney disease, stage 3" },
  { code: "R06.02", label: "Shortness of breath" },
]

export const COMMON_MEDS = [
  "Amoxicillin 500mg",
  "Atorvastatin 40mg",
  "Lisinopril 10mg",
  "Metformin 1000mg",
  "Aspirin 81mg",
  "Furosemide 40mg",
  "Albuterol inhaler",
  "Ondansetron 4mg",
  "Sumatriptan 50mg",
  "Ceftriaxone 1g IV",
]

export type BedStatus = "Occupied" | "Available" | "Vacating Soon"

export interface Bed {
  id: string
  ward: string
  status: BedStatus
}

export const WARDS = ["ICU", "General Medicine", "Pediatrics", "Surgical"] as const

export function buildBeds(): Bed[] {
  const beds: Bed[] = []
  const config: Record<string, number> = {
    ICU: 12,
    "General Medicine": 16,
    Pediatrics: 10,
    Surgical: 12,
  }
  const statuses: BedStatus[] = ["Occupied", "Available", "Vacating Soon"]
  for (const ward of WARDS) {
    for (let i = 1; i <= config[ward]; i++) {
      const r = (i * 7 + ward.length * 3) % 10
      const status: BedStatus =
        r < 6 ? "Occupied" : r < 8 ? "Available" : "Vacating Soon"
      beds.push({ id: `${ward.slice(0, 3).toUpperCase()}-${i.toString().padStart(2, "0")}`, ward, status })
    }
  }
  return beds
}

export const BED_STATUS_STYLES: Record<BedStatus, string> = {
  Occupied: "bg-destructive/10 text-destructive border-destructive/30",
  Available: "bg-success/10 text-success border-success/30",
  "Vacating Soon": "bg-warning/15 text-warning border-warning/40",
}

export interface PharmacyItem {
  name: string
  category: string
  stock: number
  reorder: number
  unit: string
}

export const PHARMACY: PharmacyItem[] = [
  { name: "Amoxicillin 500mg", category: "Antibiotic", stock: 0, reorder: 200, unit: "caps" },
  { name: "Atorvastatin 40mg", category: "Statin", stock: 84, reorder: 150, unit: "tabs" },
  { name: "Lisinopril 10mg", category: "ACE Inhibitor", stock: 640, reorder: 200, unit: "tabs" },
  { name: "Ceftriaxone 1g IV", category: "Antibiotic", stock: 22, reorder: 60, unit: "vials" },
  { name: "Furosemide 40mg", category: "Diuretic", stock: 410, reorder: 150, unit: "tabs" },
  { name: "Albuterol Inhaler", category: "Bronchodilator", stock: 9, reorder: 40, unit: "units" },
  { name: "Insulin Glargine", category: "Antidiabetic", stock: 58, reorder: 50, unit: "pens" },
  { name: "Morphine 10mg/mL", category: "Analgesic", stock: 14, reorder: 30, unit: "amps" },
  { name: "Normal Saline 1L", category: "IV Fluid", stock: 1240, reorder: 400, unit: "bags" },
  { name: "Ondansetron 4mg", category: "Antiemetic", stock: 36, reorder: 80, unit: "amps" },
]

export const ADMISSION_STAGES = [
  { key: "registered", label: "Registered", desc: "Token issued & verified" },
  { key: "triage", label: "Triage Complete", desc: "Vitals & priority assigned" },
  { key: "consult", label: "Physician Consult", desc: "Clinical assessment" },
  { key: "allocation", label: "Bed Allocation", desc: "Predictive room target" },
  { key: "admitted", label: "Admitted", desc: "Transfer to ward" },
]
