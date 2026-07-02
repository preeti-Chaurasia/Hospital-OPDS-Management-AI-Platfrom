"use client"

import { useState } from "react"
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  User,
  LayoutGrid,
  Lock,
  Users,
  Pill as PillIcon,
} from "lucide-react"
import type { Role } from "@/lib/medical-data"
import { Field, inputCls } from "./ui"
import { cn } from "@/lib/utils"

const PORTALS: {
  role: Role
  title: string
  desc: string
  icon: React.ReactNode
  defaultUser: string
}[] = [
  {
    role: "patient",
    title: "Patient Console",
    desc: "Tokens, AI receptionist, smart check-in & admission tracking.",
    icon: <User className="h-5 w-5" />,
    defaultUser: "priya.raman",
  },
  {
    role: "doctor",
    title: "Doctor Command Center",
    desc: "Live patient queue, clinical charting & prescription engine.",
    icon: <Stethoscope className="h-5 w-5" />,
    defaultUser: "dr.amelia.shaw",
  },
  {
    role: "admin",
    title: "Admin Operations",
    desc: "Bed allocation matrix, staff load & pharmacy intelligence.",
    icon: <LayoutGrid className="h-5 w-5" />,
    defaultUser: "ops.controller",
  },
  {
    role: "staff",
    title: "Staff Dashboard",
    desc: "Patient registration, queue management & lab coordination.",
    icon: <Users className="h-5 w-5" />,
    defaultUser: "staff.registration",
  },
  {
    role: "pharmacy",
    title: "Pharmacy Manager",
    desc: "Prescription fulfillment, inventory & stock management.",
    icon: <PillIcon className="h-5 w-5" />,
    defaultUser: "pharmacy.manager",
  },
]

export function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("patient")
  const active = PORTALS.find((p) => p.role === role)!

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Brand rail */}
      <div className="relative flex flex-col justify-between bg-sidebar px-8 py-10 text-sidebar-foreground lg:w-[42%] lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">SmartCare AI</p>
            <p className="text-[11px] text-sidebar-foreground/60">
              Clinical Operations Platform
            </p>
          </div>
        </div>

        <div className="my-10 max-w-md">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            The operations desk for modern hospitals.
          </h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-sidebar-foreground/70">
            Unify front-desk triage, physician workflows and capacity planning
            into a single high-density command surface — engineered for speed
            under pressure.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-sidebar-foreground/80">
            {[
              "AI voice triage & auto-registration",
              "Predictive bed allocation engine",
              "Real-time queue & bottleneck indexing",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-sidebar-foreground/50">
          HIPAA-aligned demo environment · No real patient data
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex flex-1 items-center justify-center bg-secondary px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Secure Access
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your portal to enter the command surface.
            </p>
          </div>

          <div className="grid gap-2.5">
            {PORTALS.map((p) => {
              const selected = p.role === role
              return (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => setRole(p.role)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition",
                    selected
                      ? "border-primary ring-2 ring-ring/30"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-primary",
                    )}
                  >
                    {p.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {p.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {p.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <form
            className="mt-6 grid gap-4 rounded-lg border border-border bg-card p-5"
            onSubmit={(e) => {
              e.preventDefault()
              onLogin(role)
            }}
          >
            <Field label="Username">
              <input
                className={inputCls}
                defaultValue={active.defaultUser}
                autoComplete="username"
              />
            </Field>
            <Field label="Passphrase" hint="Demo access — any value is accepted.">
              <input
                className={inputCls}
                type="password"
                defaultValue="••••••••••"
                autoComplete="current-password"
              />
            </Field>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Lock className="h-4 w-4" />
              Enter {active.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
