"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BedDouble,
  ClipboardList,
  Download,
  Gauge,
  Pill,
  Radio,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react"
import {
  buildBeds,
  BED_STATUS_STYLES,
  WARDS,
  PHARMACY,
  type Bed,
  type BedStatus,
} from "@/lib/medical-data"
import { Panel, PanelHeader, Badge, Stat } from "../ui"
import { cn } from "@/lib/utils"

export function AdminDashboard({ section }: { section: string }) {
  return (
    <div className="space-y-5">
      {section === "overview" && <Overview />}
      {section === "beds" && <BedMatrix />}
      {section === "pharmacy" && <Pharmacy />}
      {section === "reports" && <Reports />}
    </div>
  )
}

/* -------------------------------- Overview ------------------------------- */

function Overview() {
  const [ticker, setTicker] = useState<string[]>([
    "WS · Patient A-118 escalated to Emergency",
    "WS · ICU-03 marked vacating soon",
    "WS · Pharmacy: Amoxicillin stock depleted",
  ])
  const [connections, setConnections] = useState(1284)

  useEffect(() => {
    const id = window.setInterval(() => {
      setConnections((c) => c + Math.floor(Math.random() * 7) - 3)
      const events = [
        "WS · New token A-1" + (20 + Math.floor(Math.random() * 70)) + " issued",
        "WS · Bed GEN-" + (1 + Math.floor(Math.random() * 16)) + " status changed",
        "WS · Triage queue depth recalculated",
        "WS · Staff check-in: Nurse station 4",
        "WS · Lab result posted for MRN 44" + (10 + Math.floor(Math.random() * 80)),
      ]
      const ev = events[Math.floor(Math.random() * events.length)]
      setTicker((t) => [ev, ...t].slice(0, 6))
    }, 2600)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Bottleneck Index" value="0.34" sub="Below critical threshold (0.6)" icon={<Gauge className="h-4 w-4" />} tone="success" />
        <Stat label="Active Staff" value="148" sub="32 physicians · 78 nursing" icon={<Users className="h-4 w-4" />} />
        <Stat label="Ward Load" value="82%" sub="Occupancy across 50 beds" icon={<BedDouble className="h-4 w-4" />} tone="warning" />
        <Stat label="Live Connections" value={connections.toLocaleString()} sub="WebSocket sessions" icon={<Radio className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Department Throughput" subtitle="Patients processed · last 8 hours" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="p-4">
            <ThroughputChart />
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader
            title="Live Event Stream"
            icon={<Radio className="h-4 w-4" />}
            actions={
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                Connected
              </span>
            }
          />
          <ul className="flex-1 divide-y divide-border overflow-y-auto" style={{ maxHeight: 280 }}>
            {ticker.map((t, i) => (
              <li key={`${t}-${i}`} className="flex items-start gap-2 px-4 py-2.5 text-xs">
                <span className="mt-0.5 font-mono text-[10px] text-primary">{i === 0 ? "now" : `${i * 3}s`}</span>
                <span className="text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <WardLoadPanel />
        <Panel>
          <PanelHeader title="Critical Alerts" icon={<TriangleAlert className="h-4 w-4" />} />
          <div className="divide-y divide-border">
            {[
              { t: "Amoxicillin 500mg — out of stock", tone: "danger" as const, tag: "Pharmacy" },
              { t: "ICU occupancy at 92% capacity", tone: "warning" as const, tag: "Capacity" },
              { t: "ED wait time exceeds 25 min SLA", tone: "warning" as const, tag: "Throughput" },
              { t: "Albuterol inhaler below reorder point", tone: "danger" as const, tag: "Pharmacy" },
            ].map((a) => (
              <div key={a.t} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className={cn("h-2 w-2 rounded-full", a.tone === "danger" ? "bg-destructive" : "bg-warning")} />
                  <span className="text-sm text-foreground">{a.t}</span>
                </div>
                <Badge className="border-border bg-secondary text-muted-foreground">{a.tag}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ThroughputChart() {
  const data = [42, 58, 71, 64, 88, 96, 79, 102]
  const max = Math.max(...data)
  return (
    <div className="flex h-44 items-stretch gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-primary/85 transition-all"
              style={{ height: `${(v / max) * 100}%` }}
              title={`${v} patients`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{`${8 + i}:00`}</span>
        </div>
      ))}
    </div>
  )
}

function WardLoadPanel() {
  const wards = [
    { name: "ICU", load: 92, tone: "danger" as const },
    { name: "General Medicine", load: 78, tone: "warning" as const },
    { name: "Pediatrics", load: 54, tone: "success" as const },
    { name: "Surgical", load: 68, tone: "warning" as const },
  ]
  return (
    <Panel>
      <PanelHeader title="Ward Load Statistics" icon={<BedDouble className="h-4 w-4" />} />
      <div className="space-y-4 p-4">
        {wards.map((w) => (
          <div key={w.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{w.name}</span>
              <span className="tabular-nums text-muted-foreground">{w.load}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  w.tone === "danger" ? "bg-destructive" : w.tone === "warning" ? "bg-warning" : "bg-success",
                )}
                style={{ width: `${w.load}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------- Bed matrix ------------------------------ */

function BedMatrix() {
  const [beds, setBeds] = useState<Bed[]>(() => buildBeds())
  const [ward, setWard] = useState<(typeof WARDS)[number] | "All">("All")

  const cycle: Record<BedStatus, BedStatus> = {
    Occupied: "Vacating Soon",
    "Vacating Soon": "Available",
    Available: "Occupied",
  }

  const visible = useMemo(
    () => (ward === "All" ? beds : beds.filter((b) => b.ward === ward)),
    [beds, ward],
  )

  const counts = useMemo(() => {
    const c = { Occupied: 0, Available: 0, "Vacating Soon": 0 }
    for (const b of visible) c[b.status]++
    return c
  }, [visible])

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Occupied" value={counts.Occupied} sub="Active patients" icon={<BedDouble className="h-4 w-4" />} tone="danger" />
        <Stat label="Available" value={counts.Available} sub="Ready for allocation" icon={<BedDouble className="h-4 w-4" />} tone="success" />
        <Stat label="Vacating Soon" value={counts["Vacating Soon"]} sub="Predicted discharge" icon={<BedDouble className="h-4 w-4" />} tone="warning" />
      </div>

      <Panel>
        <PanelHeader
          title="Predictive Bed Allocation Matrix"
          subtitle="Click any bed to cycle its status"
          icon={<BedDouble className="h-4 w-4" />}
          actions={
            <div className="flex flex-wrap gap-1.5">
              {(["All", ...WARDS] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWard(w)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                    ward === w
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          }
        />
        <div className="space-y-5 p-4">
          {(ward === "All" ? WARDS : [ward]).map((w) => {
            const wardBeds = beds.filter((b) => b.ward === w)
            return (
              <div key={w}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {w} · {wardBeds.length} beds
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {wardBeds.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setBeds((list) =>
                          list.map((x) => (x.id === b.id ? { ...x, status: cycle[x.status] } : x)),
                        )
                      }
                      className={cn(
                        "rounded-md border p-2 text-left transition hover:ring-2 hover:ring-ring/30",
                        BED_STATUS_STYLES[b.status],
                      )}
                    >
                      <span className="block font-mono text-xs font-bold">{b.id}</span>
                      <span className="mt-0.5 block text-[10px] leading-tight">{b.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3 text-xs">
          <Legend cls="bg-destructive" label="Occupied" />
          <Legend cls="bg-success" label="Available" />
          <Legend cls="bg-warning" label="Vacating Soon" />
        </div>
      </Panel>
    </div>
  )
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-2.5 w-2.5 rounded-sm", cls)} />
      {label}
    </span>
  )
}

/* -------------------------------- Pharmacy ------------------------------- */

function Pharmacy() {
  const items = PHARMACY.map((p) => {
    const ratio = p.stock / p.reorder
    const status =
      p.stock === 0
        ? "Out of Stock"
        : ratio < 0.5
          ? "Critical"
          : ratio < 1
            ? "Low"
            : "In Stock"
    return { ...p, status, ratio }
  })

  const lowCount = items.filter((i) => i.status !== "In Stock").length

  const statusStyle: Record<string, string> = {
    "Out of Stock": "bg-destructive/10 text-destructive border-destructive/30",
    Critical: "bg-destructive/10 text-destructive border-destructive/30",
    Low: "bg-warning/15 text-warning border-warning/40",
    "In Stock": "bg-success/10 text-success border-success/30",
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total SKUs" value={items.length} sub="Tracked formulary items" icon={<Pill className="h-4 w-4" />} />
        <Stat label="Restock Alerts" value={lowCount} sub="Below reorder threshold" icon={<TriangleAlert className="h-4 w-4" />} tone="warning" />
        <Stat label="Out of Stock" value={items.filter((i) => i.stock === 0).length} sub="Critical replenishment" icon={<TriangleAlert className="h-4 w-4" />} tone="danger" />
      </div>

      <Panel>
        <PanelHeader title="Pharmacy Asset Inventory" subtitle="Live stock with restock alarms" icon={<Pill className="h-4 w-4" />} />
        {/* horizontal scroll on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Medication</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium">Reorder At</th>
                <th className="px-4 py-2.5 font-medium">Level</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.name} className="hover:bg-secondary">
                  <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.category}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">
                    {i.stock} {i.unit}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{i.reorder}</td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          i.status === "In Stock" ? "bg-success" : i.status === "Low" ? "bg-warning" : "bg-destructive",
                        )}
                        style={{ width: `${Math.min(100, i.ratio * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusStyle[i.status]}>
                      {i.status === "Out of Stock" || i.status === "Critical" ? (
                        <TriangleAlert className="h-3 w-3" />
                      ) : null}
                      {i.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

/* -------------------------------- Reports -------------------------------- */

function Reports() {
  const reports = [
    { name: "Daily Operations Summary", date: "Today · auto-generated", type: "Operations" },
    { name: "ED Throughput & Wait Times", date: "Today · 06:00", type: "Throughput" },
    { name: "Bed Utilization Forecast", date: "Yesterday", type: "Capacity" },
    { name: "Pharmacy Consumption Report", date: "Yesterday", type: "Inventory" },
    { name: "Staff Allocation Audit", date: "2 days ago", type: "HR" },
  ]
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <PanelHeader title="Clinical & Operational Reports" icon={<ClipboardList className="h-4 w-4" />} />
        <div className="divide-y divide-border">
          {reports.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-border bg-secondary text-muted-foreground">{r.type}</Badge>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-accent"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="System Health" icon={<Activity className="h-4 w-4" />} />
        <div className="space-y-4 p-4">
          {[
            { k: "API Latency", v: "82 ms", tone: "success" as const },
            { k: "Queue Engine", v: "Operational", tone: "success" as const },
            { k: "WebSocket Uptime", v: "99.98%", tone: "success" as const },
            { k: "Last Sync", v: "4s ago", tone: "default" as const },
          ].map((s) => (
            <div key={s.k} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.k}</span>
              <span className={cn("font-semibold", s.tone === "success" ? "text-success" : "text-foreground")}>
                {s.v}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
