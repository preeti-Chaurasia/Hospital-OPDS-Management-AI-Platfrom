"use client"

import { useState, useMemo } from "react"
import { BedDouble, Sparkles, CheckCircle } from "lucide-react"
import { buildBeds, BED_STATUS_STYLES, WARDS, type Bed } from "@/lib/medical-data"
import { Panel, PanelHeader, Stat } from "../ui"
import { cn } from "@/lib/utils"

interface BedMatrixProps {
  onAdmitClick?: (bedId: string, patientName: string) => void
  showAdmitButton?: boolean
}

export function BedMatrix({ onAdmitClick, showAdmitButton = false }: BedMatrixProps) {
  const [beds, setBeds] = useState<Bed[]>(() => buildBeds())
  const [ward, setWard] = useState<(typeof WARDS)[number] | "All">("All")
  const [timelineMode, setTimelineMode] = useState<"current" | "predicted">("current")
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([])

 
  const cycle: Record<string, string> = {
    Occupied: "Vacating Soon",
    "Vacating Soon": "Available",
    Available: "Occupied",
  }

  // Admin Level Dynamic 12h Timeline Trigger Engine
  const handleTimelinePrediction = () => {
    setTimelineMode("predicted")
    setOptimizationLogs([
      "Clinical discharge criteria satisfied for 3 Critical Care profiles.",
      "ICU-02 & ICU-07 downgraded to General Medicine step-down protocol.",
      "ICU-09 routed safely to Surgical Ward based on recovery rate patterns.",
      "Optimized downstream pipeline: Shifted GEN-04, GEN-07, and SURG-02.",
      "Warning prevented: Avoided emergency block overflow SLA breach by 14%."
    ])
    
    setBeds((currentBeds) =>
      currentBeds.map((b) => {
        if (b.id === "ICU-02" || b.id === "ICU-07" || b.id === "ICU-09" || b.id === "PED-02") {
          return { ...b, status: "Available" as any }
        }
        if (b.id === "GEN-01" || b.id === "GEN-03" || b.id === "SURG-04") {
          return { ...b, status: "Vacating Soon" as any }
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
    const c = { Occupied: 0, Available: 0, "Vacating Soon": 0 }
    for (const b of visible) {
      if (b.status in c) {
        c[b.status as keyof typeof c]++
      }
    }
    return c
  }, [visible])

  return (
    <div className="space-y-5">
      {/* Predictive Core Header Module */}
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
                Simulates predictive downstream ward flow. Matches upcoming ICU step-down clearances with expected general and surgical bed availabilities 12 hours in advance.
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
                timelineMode === "predicted" ? "bg-amber-500 text-white shadow" : "text-muted-foreground hover:bg-accent"
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

      {/* Real-time Row Sync Counter Panel */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Occupied" value={counts.Occupied} sub="Active patients" icon={<BedDouble className="h-4 w-4" />} tone="danger" />
        <Stat label="Available" value={counts.Available} sub="Ready for allocation" icon={<BedDouble className="h-4 w-4" />} tone="success" />
        <Stat label="Vacating Soon" value={counts["Vacating Soon"]} sub="Predicted discharge" icon={<BedDouble className="h-4 w-4" />} tone="warning" />
      </div>

      {/* Advanced Granular Section Layer */}
      <Panel>
        <PanelHeader
          title="Predictive Bed Allocation Matrix"
          subtitle="Click any bed to cycle its status or execute operations"
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
            const wardBeds = visible.filter((b) => b.ward === w)
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
                      onClick={() => {
                        if (b.status === "Available" && onAdmitClick) {
                          onAdmitClick(b.id, "")
                        } else {
                          setBeds((list) =>
                            list.map((x) => (x.id === b.id ? { ...x, status: (cycle[x.status] || x.status) as any } : x)),
                          )
                        }
                      }}
                      className={cn(
                        "rounded-md border p-2 text-left transition hover:ring-2 hover:ring-ring/30",
                        BED_STATUS_STYLES[b.status as keyof typeof BED_STATUS_STYLES],
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
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-destructive" />Occupied</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-success" />Available</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-warning" />Vacating Soon</span>
        </div>
      </Panel>
    </div>
  )
}