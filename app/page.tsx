"use client"

import { useMemo, useState } from "react"
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
} from "lucide-react"
import type { Role } from "@/lib/medical-data"
import { Login } from "@/components/smartcare/login"
import { AppShell, type NavItem } from "@/components/smartcare/app-shell"
import { PatientConsole } from "@/components/smartcare/patient/patient-console"
import { DoctorCommandCenter } from "@/components/smartcare/doctor/doctor-command-center"
import { AdminDashboard } from "@/components/smartcare/admin/admin-dashboard"

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
  ],
  admin: [
    { key: "overview", label: "Operations Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "beds", label: "Bed Allocation Matrix", icon: <Bed className="h-4 w-4" /> },
    { key: "pharmacy", label: "Pharmacy Inventory", icon: <Pill className="h-4 w-4" /> },
    { key: "reports", label: "Clinical Reports", icon: <ClipboardList className="h-4 w-4" /> },
  ],
}

export default function Page() {
  const [role, setRole] = useState<Role | null>(null)
  const [section, setSection] = useState<string>("dashboard")

  const nav = useMemo(() => (role ? NAV[role] : []), [role])

  if (!role) {
    return (
      <Login
        onLogin={(r) => {
          setRole(r)
          setSection(NAV[r][0].key)
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
      onLogout={() => setRole(null)}
    >
      {role === "patient" && <PatientConsole section={section} onNavigate={setSection} />}
      {role === "doctor" && <DoctorCommandCenter />}
      {role === "admin" && <AdminDashboard section={section} />}
    </AppShell>
  )
}
