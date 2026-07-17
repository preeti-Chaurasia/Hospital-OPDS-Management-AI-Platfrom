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
  Sparkles,
  CheckCircle,
  HelpCircle,
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

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState(0);
const ticker = dashboard?.liveEvents || [];
 

  useEffect(() => {
  async function loadDashboard() {
    try {
      const res = await fetch("/api/admin/overview");

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
        console.log(data.departmentChart);
setDashboard(data);
     
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Bottleneck Index" value="0.34" sub="Below critical threshold (0.6)" icon={<Gauge className="h-4 w-4" />} tone="success" />
        <Stat label="Active Staff" value={loading ? "--" : dashboard?.stats?.todayPatients}sub="32 physicians · 78 nursing" icon={<Users className="h-4 w-4" />} />
        <Stat label="Ward Load" value={loading ? "--" : dashboard?.stats?.availableBeds + "%"} sub="Occupancy across 50 beds" icon={<BedDouble className="h-4 w-4" />} tone="warning" />
        <Stat label="Live Connections" value={loading ? "--" : connections.toLocaleString()} sub="WebSocket sessions" icon={<Radio className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Department Throughput" subtitle="Patients processed · last 8 hours" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="p-4">
            <ThroughputChart
data={dashboard?.departmentChart || []}
/>
<WardLoadPanel
    wards={dashboard?.wardStats || []}
/>
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
         {ticker.map((t: any, i: number) => (
  <li key={i} className="flex items-start gap-2 px-4 py-2.5 text-xs">
    <span className="mt-0.5 font-mono text-[10px] text-primary">
      {i === 0 ? "now" : `${i * 3}s`}
    </span>

    <span className="text-foreground">
      {t.description}
    </span>
  </li>
))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
       <WardLoadPanel
wards={dashboard?.wardStats || []}
/>
        <Panel>
          <PanelHeader title="Critical Alerts" icon={<TriangleAlert className="h-4 w-4" />} />
          <div className="divide-y divide-border">
          {dashboard?.criticalAlerts?.map((a:any) => (
  <div
    key={a.alert_id}
    className="flex items-center justify-between gap-3 px-4 py-3"
  >
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          a.severity === "Critical"
            ? "bg-destructive"
            : "bg-warning"
        )}
      />

      <div>
        <p className="text-sm font-medium">
          {a.medicine_name}
        </p>

        <p className="text-xs text-muted-foreground">
          {a.alert_type}
        </p>
      </div>
    </div>

    <Badge>
      Stock : {a.current_stock}
    </Badge>
  </div>
))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ThroughputChart({ data }: { data: any[] }) {

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-muted-foreground">
        No Data Available
      </div>
    );
  }

  const values = data.map((d) => Number(d.patients));
  console.log(values);
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((item: any, index: number) => (
        <div key={index} className="flex flex-1 flex-col items-center">
          <div
            className="w-full rounded-t bg-blue-500"
            style={{
          
  height: `${Math.max((values[index] / max) * 100, 10)}%`,
              minHeight: "8px",
            }}
          />
          <span className="mt-2 text-xs">
            {item.hour}:00
          </span>
        </div>
      ))}
    </div>
  );
}

function WardLoadPanel({ wards }: { wards: any[] }) {
  return (
    <Panel>
      <PanelHeader title="Ward Load Statistics" icon={<BedDouble className="h-4 w-4" />} />
      <div className="space-y-4 p-4">
        {wards.map((w) => (
          <div key={w.ward_name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{w.ward_name}</span>
              <span className="tabular-nums text-muted-foreground">{w.occupancy}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  w.tone === "danger" ? "bg-destructive" : w.tone === "warning" ? "bg-warning" : "bg-success",
                )}
                style={{ width: `${w.occupancy}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------- Bed matrix ------------------------------ */

/* ------------------------------- Bed matrix ------------------------------ */

export default function BedMatrix() {
  const [beds, setBeds] = useState<Bed[]>(() => buildBeds())
  const [ward, setWard] = useState<(typeof WARDS)[number] | "All">("All")
  
  const [timelineMode, setTimelineMode] = useState<"current" | "predicted">("current")
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([])

  // Dynamic Status Cycle with Cleaning Phase integration
  const cycle: Record<string, string> = {
    "Occupied": "Vacating Soon",
    "Vacating Soon": "Available",
    "Available": "Cleaning Phase",
    "Cleaning Phase": "Occupied",
  }

  // Local style configuration overrides to dynamic layout injected seamlessly
  const currentStyles: Record<string, string> = {
    ...BED_STATUS_STYLES,
    "Cleaning Phase": "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20",
  }

  const handleTimelinePrediction = () => {
    setTimelineMode("predicted")
    setOptimizationLogs([
      "Clinical discharge criteria satisfied for 3 Critical Care profiles.",
      "ICU-02 & ICU-07 downgraded to General Medicine step-down protocol.",
      "ICU-09 routed safely to Surgical Ward based on recovery rate patterns.",
      "Optimized downstream pipeline: Reserved GEN-04, GEN-07, and SURG-02.",
      "Warning prevented: Avoided emergency block overflow SLA breach by 14%."
    ])
    
    setBeds((currentBeds) =>
      currentBeds.map((b) => {
        if (b.id === "ICU-02" || b.id === "ICU-07" || b.id === "ICU-09" || b.id === "PED-02") {
          return { ...b, status: "Available" as BedStatus }
        }
        if (b.id === "GEN-01" || b.id === "GEN-03" || b.id === "SURG-04") {
          return { ...b, status: "Vacating Soon" as BedStatus }
        }
        return b
      })
    )
  }

  const resetTimeline = () => {
    setTimelineMode("current")
    setOptimizationLogs([])
    setBeds(buildBeds()) 
  }

  const visible = useMemo(
    () => (ward === "All" ? beds : beds.filter((b) => b.ward === ward)),
    [beds, ward],
  )

  const counts = useMemo(() => {
    const c = { Occupied: 0, Available: 0, "Vacating Soon": 0, "Cleaning Phase": 0 }
    for (const b of visible) {
      if (b.status in c) {
        c[b.status as keyof typeof c]++
      }
    }
    return c
  }, [visible])

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                Predictive Resource Logistics Core Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                Simulates predictive downstream ward flow. Our ML engine matches upcoming ICU step-down clearances with expected general and surgical bed availabilities 12 hours in advance to eliminate bottleneck overheads.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1 shadow-sm shrink-0 self-start lg:self-auto">
            <button 
              type="button"
              onClick={resetTimeline}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition",
                timelineMode === "current" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-accent"
              )}
            >
              ⌛ Realtime (Live)
            </button>
            <button 
              type="button"
              onClick={handleTimelinePrediction}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5",
                timelineMode === "predicted" ? "bg-amber-500 text-white shadow shadow-amber-500/20" : "text-muted-foreground hover:bg-accent"
              )}
            >
              🔮 Predict Next 12h Flow
            </button>
          </div>
        </div>

        {optimizationLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/10 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2 md:col-span-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                ⚡ Realtime Auto-Allocation Optimization Actions Taken:
              </p>
            </div>
            {optimizationLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 bg-background/60 rounded-md p-2 border border-border/50 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-tight">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Occupied" value={counts.Occupied} sub="Active patients" icon={<BedDouble className="h-4 w-4" />} tone="danger" />
        <Stat label="Available" value={counts.Available} sub="Ready for allocation" icon={<BedDouble className="h-4 w-4" />} tone="success" />
        <Stat label="Vacating Soon" value={counts["Vacating Soon"]} sub="Predicted discharge" icon={<BedDouble className="h-4 w-4" />} tone="warning" />
        <Stat label="Cleaning Phase" value={counts["Cleaning Phase"]} sub="Housekeeping turn-around" icon={<BedDouble className="h-4 w-4" />} />
      </div>

      <Panel>
        <PanelHeader
          title="Predictive Bed Allocation Matrix"
          subtitle="Click any bed to cycle its status manually"
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
                          list.map((x) => (x.id === b.id ? { ...x, status: cycle[x.status] as BedStatus } : x)),
                        )
                      }
                      className={cn(
                        "rounded-md border p-2 text-left transition hover:ring-2 hover:ring-ring/30",
                        currentStyles[b.status],
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
          <Legend cls="bg-blue-500" label="Cleaning Phase" />
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