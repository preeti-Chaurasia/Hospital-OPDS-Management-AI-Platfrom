"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Bed,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Mic,
  Pill,
  QrCode,
  Route,
  Stethoscope,
  UserPlus,
  TrendingDown,
  FileText,
  FlaskConical
} from "lucide-react"
import type { Role } from "@/lib/medical-data"
import { Login } from "@/components/smartcare/login"
import { AppShell, type NavItem } from "@/components/smartcare/app-shell"
import { PatientConsole } from "@/components/smartcare/patient/patient-console"
import { DoctorCommandCenter } from "@/components/smartcare/doctor/doctor-command-center"
import { AdminDashboard } from "@/components/smartcare/admin/admin-dashboard"
import { StaffDashboard } from "@/components/smartcare/staff/staff-dashboard"
import { PharmacyDashboard } from "@/components/smartcare/pharmacy/pharmacy-dashboard"

// ─── CONNECTED MODULES IMPORTS FROM FOLDER VIEW EXPLORER ───
import { BedMatrix } from "@/components/smartcare/modules/bed-matrix"
import { MedicineSearch } from "@/components/smartcare/modules/medicine-search"
const NAV: Record<Role, NavItem[]> = {
  patient: [
    { key: "dashboard", label: "My Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "receptionist", label: "AI Voice Receptionist", icon: <Mic className="h-4 w-4" /> },
    { key: "register", label: "Smart Registration", icon: <UserPlus className="h-4 w-4" /> },
    { key: "checkin", label: "QR Check-In", icon: <QrCode className="h-4 w-4" /> },
    { key: "admission", label: "Admission Pipeline", icon: <Route className="h-4 w-4" /> },
  ],
  doctor: [
    { key: "command", label: "Command Center", icon: <Stethoscope className="h-4 w-4" /> },
    { key: "beds", label: "Bed Management", icon: <Bed className="h-4 w-4" /> },
    { key: "medicines", label: "Medicine Database", icon: <Pill className="h-4 w-4" /> },
    { key: "labs", label: "Lab Reports", icon: <FlaskConical className="h-4 w-4" /> },
  ],
  admin: [
    { key: "overview", label: "Operations Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "beds", label: "Bed Allocation Matrix", icon: <Bed className="h-4 w-4" /> },
    { key: "pharmacy", label: "Pharmacy Inventory", icon: <Pill className="h-4 w-4" /> },
    { key: "reports", label: "Clinical Reports", icon: <ClipboardList className="h-4 w-4" /> },
  ],
  staff: [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "registration", label: "Patient Registration", icon: <UserPlus className="h-4 w-4" /> },
    { key: "labs", label: "Lab Reports", icon: <FileText className="h-4 w-4" /> },
  ],
  pharmacy: [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "inventory", label: "Smart Inventory & Alerts", icon: <Pill className="h-4 w-4" /> },
    { key: "predictions", label: "AI Demand Predictions", icon: <TrendingDown className="h-4 w-4" /> },
  ],
}

export default function Page() {
  const [role, setRole] = useState<Role | null>(null)
  const [section, setSection] = useState<string>("dashboard")
  
  const [patientSession, setPatientSession] = useState<{ name: string; phone: string; token: string | null; patient_id: number } | null>(null)

  const nav = useMemo(() => (role ? NAV[role] : []), [role])

  useEffect(() => {
    if (role && NAV[role]?.[0]) {
      setSection(NAV[role][0].key)
    }
  }, [role])

  if (!role) {
    return (
      <Login
        onLogin={(selectedRole: Role) => {
          setRole(selectedRole)
          if (selectedRole === "patient") {
            setPatientSession({
              name: "Marcus Delgado",
              phone: "9876543201",
              token: "A-118",
              patient_id: 118
            })
          }
        }}
      />
    )
  }

  return (
    <AppShell
      role={role}
      nav={nav}
      active={section}
      onNavigate={setSection}
      onLogout={() => {
        setRole(null)
        setPatientSession(null)
      }}
    >
      {/* Patient Section */}
      {role === "patient" && (
        <PatientConsole 
          section={section} 
          onNavigate={setSection} 
          patientSession={patientSession} 
        />
      )}
      
      {/* ─── DYNAMIC DOCTOR ROUTING CHANNELS ─── */}
      {role === "doctor" && (
        <>
          {section === "command" && <DoctorCommandCenter />}
          {section === "beds" && <BedMatrix />}
          
          {/* 🔴 NEW MAPPING: Render Pharmacy view under Doctor segment */}
          {section === "medicines" && <MedicineSearch />}
          {/* Fallback segment for database screens */}
          {section !== "command" && section !== "beds" && section !== "medicines" && (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-card">
              🔒 The {section} database segment view is currently operational behind secure background threads.
            </div>
          )}
        </>
      )}

      {/* Admin, Staff, Pharmacy Sections */}
      {role === "admin" && <AdminDashboard section={section} />}
      {role === "staff" && <StaffDashboard section={section} />}
      {role === "pharmacy" && <PharmacyDashboard section={section} />}
    </AppShell>
  )
}