"use client"

import { useState } from "react"
import {
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react"
import type { Role } from "@/lib/medical-data"
import { cn } from "@/lib/utils"

export interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
}

const ROLE_META: Record<Role, { name: string; sub: string; tag: string }> = {
  patient: { name: "Priya Raman", sub: "Patient · MRN 4471-22", tag: "Patient" },
  doctor: { name: "Dr. Amelia Shaw", sub: "Internal Medicine · Bay 3", tag: "Physician" },
  admin: { name: "Operations Control", sub: "Capacity & Logistics", tag: "Admin" },
}

export function AppShell({
  role,
  nav,
  active,
  onNavigate,
  onLogout,
  children,
}: {
  role: Role
  nav: NavItem[]
  active: string
  onNavigate: (key: string) => void
  onLogout: () => void
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const meta = ROLE_META[role]
  const activeItem = nav.find((n) => n.key === active)

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight text-sidebar-foreground">
            SmartCare AI
          </p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">
            {meta.tag} Workspace
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Navigation
        </p>
        <ul className="space-y-1">
          {nav.map((item) => {
            const selected = item.key === active
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(item.key)
                    setDrawerOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition",
                    selected
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
       <div className="flex items-center gap-2.5 rounded-md bg-[#112B57] px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            {meta.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">
              {meta.name}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              {meta.sub}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="rounded p-1.5 text-sidebar-foreground/60 transition hover:bg-sidebar-border hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh bg-blue-50">
      {/* Desktop sidebar */}
   <aside className="hidden w-64 shrink-0 bg-[#061A36] text-white lg:block">
        <div className="sticky top-0 h-dvh">{SidebarBody}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 rounded p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarBody}
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md border border-border p-2 text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              {activeItem?.label ?? "Dashboard"}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {meta.tag} · SmartCare Clinical Operations
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-secondary px-2.5 py-1.5 md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search patients, tokens, beds…"
                className="w-48 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <span className="hidden items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              Live
            </span>
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-md border border-border p-2 text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                3
              </span>
            </button>
            <button
              type="button"
              className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground sm:flex"
            >
              {meta.tag}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}