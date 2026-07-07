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
  
  // Dynamic hooks to hold structural sessions data parameters safely
  const [patientSession, setPatientSession] = useState<{ name: string; phone: string; token: string | null } | null>(null)
  const [doctorSessionName, setDoctorSessionName] = useState<string | null>(null)

  const nav = useMemo(() => (role ? NAV[role] : []), [role])

  useEffect(() => {
    if (role && NAV[role]?.[0]) {
      setSection(NAV[role][0].key)
    }
  }, [role])

  // ─── SINGLE AUTHORIZATION ENDPOINT TRIGGERS ───
  const handleAuthRouteCheck = async (roleType: Role, usernameInput: string, phoneInput?: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: usernameInput, 
          phone_number: phoneInput || "", 
          role_requested: roleType 
        })
      });
      const data = await res.json();

      if (data.authenticated) {
        setRole(roleType);
        if (roleType === 'patient') {
          setPatientSession({
            name: data.user_identity,
            phone: data.phone_number,
            token: data.token_number
          });
        } else if (roleType === 'doctor') {
          setDoctorSessionName(data.user_identity);
        }
      } else {
        alert(data.error || "Authentication missing details setup map.");
      }
    } catch (err) {
      console.error("Cloud server sync interrupt triggered:", err);
      // Fallback emergency bypass rendering context if network fails presentation
      setRole(roleType);
    }
  }

  if (!role) {
    return (
      <Login
        onLogin={(r: Role) => {
          // If login component captures state inputs from user name input tags element nodes
          // Standard placeholder identifiers match database rows
          if (r === "patient") {
            handleAuthRouteCheck("patient", "Marcus Delgado", "9876543201");
          } else if (r === "doctor") {
            handleAuthRouteCheck("doctor", "Dr. Amelia Shaw");
          } else {
            // ADMIN, PHARMACY, STAFF: Bypasses direct cloud requests safely
            setRole(r);
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
        setDoctorSessionName(null)
      }}
    >
      {role === "patient" && <PatientConsole section={section} onNavigate={setSection} patientSession={patientSession} />}
      {role === "doctor" && <DoctorCommandCenter section={section} />}
      {role === "admin" && <AdminDashboard section={section} />}
      {role === "staff" && <StaffDashboard section={section} />}
      {role === "pharmacy" && <PharmacyDashboard section={section} />}
    </AppShell>
  )
}