export type Role = "patient" | "doctor" | "admin" | "staff" | "pharmacy"

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
  {
  id: "p7",
  token: "A-124",
  name: "John Carter",
  age: 48,
  sex: "M",
  complaint: "High Blood Pressure",
  priority: "Routine",
  waitMins: 12,
  vitals: { bp: "145/90", hr: 82, temp: 98.4, spo2: 98, resp: 18 },
  allergies: [],
  history: ["Hypertension"],
},
{
  id: "p8",
  token: "A-125",
  name: "Emma Wilson",
  age: 36,
  sex: "F",
  complaint: "Fever",
  priority: "Stable",
  waitMins: 10,
  vitals: { bp: "118/76", hr: 88, temp: 100.5, spo2: 99, resp: 18 },
  allergies: [],
  history: [],
},
{
  id: "p9",
  token: "A-126",
  name: "Noah Brown",
  age: 29,
  sex: "M",
  complaint: "Fractured Hand",
  priority: "Critical",
  waitMins: 8,
  vitals: { bp: "122/80", hr: 95, temp: 98.7, spo2: 99, resp: 18 },
  allergies: [],
  history: [],
},
{
  id: "p10",
  token: "A-127",
  name: "Olivia Taylor",
  age: 42,
  sex: "F",
  complaint: "Severe Headache",
  priority: "Stable",
  waitMins: 16,
  vitals: { bp: "120/78", hr: 84, temp: 98.6, spo2: 98, resp: 17 },
  allergies: [],
  history: [],
},
{
  id: "p11",
  token: "A-128",
  name: "David Lee",
  age: 51,
  sex: "M",
  complaint: "Chest Tightness",
  priority: "Emergency",
  waitMins: 3,
  vitals: { bp: "160/95", hr: 110, temp: 99.1, spo2: 94, resp: 22 },
  allergies: [],
  history: ["Heart Disease"],
},
{
  id: "p12",
  token: "A-129",
  name: "Sophia Martin",
  age: 31,
  sex: "F",
  complaint: "Abdominal Pain",
  priority: "Critical",
  waitMins: 9,
  vitals: { bp: "116/72", hr: 96, temp: 99.4, spo2: 99, resp: 18 },
  allergies: [],
  history: [],
},
{
  id: "p13",
  token: "A-130",
  name: "James Walker",
  age: 38,
  sex: "M",
  complaint: "Back Pain",
  priority: "Routine",
  waitMins: 18,
  vitals: { bp: "124/82", hr: 78, temp: 98.5, spo2: 99, resp: 17 },
  allergies: [],
  history: [],
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

export type LabTestStatus = "Pending" | "In Progress" | "Ready" | "Delivered"

export interface LabTest {
  id: string
  patientName: string
  testType: string
  requestedBy: string
  status: LabTestStatus
  requestedAt: string
  reportFile?: string
  remarks?: string
  uploadedAt?: string
}

export const LAB_TESTS: LabTest[] = [
  { id: "lab-1", patientName: "Marcus Delgado", testType: "ECG, Troponin I", requestedBy: "Dr. Shaw", status: "In Progress", requestedAt: "09:15 AM" },
  { id: "lab-2", patientName: "Priya Raman", testType: "Chest X-Ray, CBC", requestedBy: "Dr. Shaw", status: "Ready", requestedAt: "08:42 AM" },
  { id: "lab-3", patientName: "Edward Chen", testType: "MRI Lumbar Spine", requestedBy: "Dr. Anderson", status: "Pending", requestedAt: "09:33 AM" },
  { id: "lab-4", patientName: "Henry Okafor", testType: "BNP, Echocardiogram", requestedBy: "Dr. Kumar", status: "Ready", requestedAt: "07:55 AM" },
]

export type PrescriptionStatus = "New" | "Being Prepared" | "Ready for Pickup" | "Dispensed"

export interface Prescription {
  id: string
  patientName: string
  doctorName: string
  medicines: string[]
  status: PrescriptionStatus
  createdAt: string
}

export const PRESCRIPTIONS: Prescription[] = [
  { id: "rx-1", patientName: "Sofia Marquez", doctorName: "Dr. Shaw", medicines: ["Prenatal Vitamin", "Iron Supplement"], status: "Dispensed", createdAt: "08:20 AM" },
  { id: "rx-2", patientName: "Marcus Delgado", doctorName: "Dr. Shaw", medicines: ["Aspirin 81mg", "Atorvastatin 40mg"], status: "New", createdAt: "09:45 AM" },
  { id: "rx-3", patientName: "Priya Raman", doctorName: "Dr. Shaw", medicines: ["Ceftriaxone 1g IV", "Albuterol inhaler"], status: "Being Prepared", createdAt: "09:10 AM" },
  { id: "rx-4", patientName: "Lena Vogt", doctorName: "Dr. Kumar", medicines: ["Sumatriptan 50mg", "Ondansetron 4mg"], status: "Ready for Pickup", createdAt: "08:55 AM" },
]

export interface MedicineStock {
  name: string
  stock: number
  reorder: number
  lastRestocked: string
  expiryDate: string
  batchNumber: string
  rack?: string
  shelf?: number
  boxNumber?: number
}

export const MEDICINE_INVENTORY: MedicineStock[] = [
  { name: "Amoxicillin 500mg", stock: 0, reorder: 200, lastRestocked: "2025-06-15", expiryDate: "2026-06-15", batchNumber: "BAT20230601", rack: "A", shelf: 1, boxNumber: 5 },
  { name: "Atorvastatin 40mg", stock: 84, reorder: 150, lastRestocked: "2025-06-18", expiryDate: "2026-06-18", batchNumber: "BAT20230615", rack: "A", shelf: 2, boxNumber: 8 },
  { name: "Lisinopril 10mg", stock: 640, reorder: 200, lastRestocked: "2025-06-20", expiryDate: "2026-12-20", batchNumber: "BAT20230701", rack: "B", shelf: 1, boxNumber: 12 },
  { name: "Ceftriaxone 1g IV", stock: 22, reorder: 60, lastRestocked: "2025-06-10", expiryDate: "2025-12-10", batchNumber: "BAT20230501", rack: "C", shelf: 3, boxNumber: 2 },
  { name: "Furosemide 40mg", stock: 410, reorder: 150, lastRestocked: "2025-06-19", expiryDate: "2026-06-19", batchNumber: "BAT20230610", rack: "B", shelf: 2, boxNumber: 6 },
  { name: "Albuterol Inhaler", stock: 9, reorder: 40, lastRestocked: "2025-05-20", expiryDate: "2026-05-20", batchNumber: "BAT20230420", rack: "C", shelf: 1, boxNumber: 3 },
  { name: "Insulin Glargine", stock: 58, reorder: 50, lastRestocked: "2025-06-17", expiryDate: "2025-09-17", batchNumber: "BAT20230517", rack: "D", shelf: 2, boxNumber: 4 },
  { name: "Morphine 10mg/mL", stock: 14, reorder: 30, lastRestocked: "2025-06-05", expiryDate: "2025-12-05", batchNumber: "BAT20230305", rack: "D", shelf: 3, boxNumber: 1 },
]

export interface PatientVitals {
  bp: string
  pulse: number
  temp: number
  spo2: number
  height: number
  weight: number
}

export interface StaffRegistration {
  id: string
  name: string
  age: number
  sex: "M" | "F"
  complaint: string
  phone: string
  registeredAt: string
  vitals?: PatientVitals
}

export const STAFF_REGISTRATIONS: StaffRegistration[] = [
  { id: "sr-1", name: "Rajesh Kumar", age: 42, sex: "M", complaint: "Follow-up checkup", phone: "9876543210", registeredAt: "09:30 AM" },
  { id: "sr-2", name: "Anita Singh", age: 28, sex: "F", complaint: "Routine vaccination", phone: "9876543211", registeredAt: "09:45 AM" },
  { id: "sr-3", name: "Vikram Patel", age: 55, sex: "M", complaint: "Blood pressure check", phone: "9876543212", registeredAt: "10:00 AM" },
]

export interface QueueEntry {
  id: string
  token: string
  patientName: string
  registeredTime: string
  status: "In Queue" | "In Consultation" | "Completed"
  priority: Priority
}

export const QUEUE_ENTRIES: QueueEntry[] = [
  { id: "qe-1", token: "A-118", patientName: "Marcus Delgado", registeredTime: "09:15 AM", status: "In Consultation", priority: "Emergency" },
  { id: "qe-2", token: "A-119", patientName: "Priya Raman", registeredTime: "09:20 AM", status: "In Queue", priority: "Critical" },
  { id: "qe-3", token: "A-120", patientName: "Edward Chen", registeredTime: "09:35 AM", status: "In Queue", priority: "Stable" },
  { id: "qe-4", token: "A-121", patientName: "Sofia Marquez", registeredTime: "09:45 AM", status: "In Queue", priority: "Routine" },
]

export interface AdmissionRequest {
  id: string
  patientName: string
  doctorName: string
  bedNeeded: string
  stage: string
  createdAt: string
}

export const ADMISSION_REQUESTS: AdmissionRequest[] = [
  { id: "ar-1", patientName: "Marcus Delgado", doctorName: "Dr. Shaw", bedNeeded: "ICU", stage: "Awaiting allocation", createdAt: "09:45 AM" },
  { id: "ar-2", patientName: "Henry Okafor", doctorName: "Dr. Kumar", bedNeeded: "ICU", stage: "Allocated - ICU-02", createdAt: "08:10 AM" },
]

export function getVitalsRecommendations(age: number, sex: "M" | "F", complaint: string): string[] {
  const recommendations: string[] = []
  
  if (age > 60) {
    recommendations.push("Blood Pressure", "Blood Sugar", "ECG")
  } else if (age < 12) {
    recommendations.push("Weight", "Temperature", "Growth metrics")
  }
  
  if (sex === "F" && (complaint.toLowerCase().includes("pregnant") || complaint.toLowerCase().includes("prenatal"))) {
    recommendations.push("Blood Pressure", "Hemoglobin", "Blood Sugar")
  }
  
  if (complaint.toLowerCase().includes("fever") || complaint.toLowerCase().includes("cough")) {
    recommendations.push("Temperature", "Pulse", "Oxygen Saturation")
  }
  
  if (complaint.toLowerCase().includes("chest") || complaint.toLowerCase().includes("heart")) {
    recommendations.push("Blood Pressure", "ECG", "Heart Rate")
  }
  
  return recommendations.length > 0 ? recommendations : ["Blood Pressure", "Temperature", "Pulse", "Oxygen Saturation"]
}

export interface AIMedicineInsight {
  title: string
  description: string
  recommendation: string
  priority: "high" | "medium" | "low"
}

export const AI_MEDICINE_INSIGHTS: AIMedicineInsight[] = [
  {
    title: "High Fever Cases Expected",
    description: "Current weather patterns indicate increased respiratory infections",
    recommendation: "Increase Paracetamol & Ibuprofen stock by 20%",
    priority: "high"
  },
  {
    title: "High Dengue Risk Detected",
    description: "Seasonal patterns and local disease surveillance data",
    recommendation: "Increase ORS inventory & platelet transfusion units",
    priority: "high"
  },
  {
    title: "Flu Season Alert",
    description: "Predictive modeling for coming weeks",
    recommendation: "Increase cough syrup, antiviral, and vaccine supplies",
    priority: "medium"
  },
  {
    title: "Low Stock Alert",
    description: "Amoxicillin 500mg currently out of stock",
    recommendation: "Emergency reorder required - affects antibiotic availability",
    priority: "high"
  },
]
