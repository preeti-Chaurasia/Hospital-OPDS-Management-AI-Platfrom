"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Pill,
  TrendingDown,
  Package,
  Calendar,
} from "lucide-react"
import { PRESCRIPTIONS, MEDICINE_INVENTORY, AI_MEDICINE_INSIGHTS, type Prescription } from "@/lib/medical-data"
import { cn } from "@/lib/utils"

const ACTIVITY_LOG = [
  { id: 1, time: "09:45 AM", action: "Dispensed Prenatal Vitamin to Sofia Marquez", type: "dispensed" },
  { id: 2, time: "09:30 AM", action: "Stock updated: Ceftriaxone 1g IV - 25 units", type: "stock" },
  { id: 3, time: "09:15 AM", action: "Alert: Amoxicillin 500mg - Out of stock", type: "alert" },
  { id: 4, time: "08:55 AM", action: "New prescription received from Dr. Shaw", type: "rx" },
]

export function PharmacyDashboard({ section }: { section: string }) {
  const [prescriptions, setPrescriptions] = useState(PRESCRIPTIONS)
  const [inventory, setInventory] = useState(MEDICINE_INVENTORY)
  const [searchQ, setSearchQ] = useState("")

  const handlePrepareRx = (rxId: string) => {
    setPrescriptions(
      prescriptions.map((p) =>
        p.id === rxId ? { ...p, status: "Being Prepared" } : p
      ),
    )
  }

  const handleDispenseRx = (rxId: string) => {
    setPrescriptions(
      prescriptions.map((p) =>
        p.id === rxId ? { ...p, status: "Dispensed" } : p
      ),
    )
  }

  const handleMarkReady = (rxId: string) => {
    setPrescriptions(
      prescriptions.map((p) =>
        p.id === rxId ? { ...p, status: "Ready for Pickup" } : p
      ),
    )
  }

  const readyCount = prescriptions.filter((p) => p.status === "Dispensed" || p.status === "Ready for Pickup").length
  const newRxCount = prescriptions.filter((p) => p.status === "New").length
  const lowStockCount = inventory.filter((m) => m.stock > 0 && m.stock <= m.reorder / 2).length
  const outOfStockCount = inventory.filter((m) => m.stock === 0).length

  if (section === "dashboard") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today's Prescriptions", value: prescriptions.length, color: "primary" },
            { label: "Ready for Pickup", value: readyCount, color: "success" },
            { label: "Low Stock", value: lowStockCount, color: "warning" },
            { label: "Out of Stock", value: outOfStockCount, color: "destructive" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-3 sm:p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className={cn("mt-2 text-2xl font-bold", `text-${stat.color}`)}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <div className="mt-3 space-y-2.5">
            {ACTIVITY_LOG.map((log) => (
              <div key={log.id} className="flex gap-3 border-l-2 border-primary/30 bg-secondary/30 px-3 py-2">
                <span className="shrink-0 text-xs font-mono text-muted-foreground">{log.time}</span>
                <p className="text-sm text-foreground/80">{log.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (section === "prescriptions") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Live Prescriptions</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search patient/medicine..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-8 w-40 rounded border border-border bg-secondary px-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            {prescriptions
              .filter(
                (p) =>
                  p.patientName.toLowerCase().includes(searchQ.toLowerCase()) ||
                  p.medicines.some((m) =>
                    m.toLowerCase().includes(searchQ.toLowerCase()),
                  ),
              )
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{p.patientName}</p>
                      <p className="text-xs text-muted-foreground">{p.doctorName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.medicines.map((med, i) => (
                          <span
                            key={i}
                            className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.status === "New" && (
                        <>
                          <span className="text-xs font-semibold text-primary">New</span>
                          <button
                            onClick={() => handlePrepareRx(p.id)}
                            className="rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            Prepare
                          </button>
                        </>
                      )}
                      {p.status === "Being Prepared" && (
                        <>
                          <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                            <Clock className="h-3 w-3" />
                            Preparing
                          </span>
                          <button
                            onClick={() => handleMarkReady(p.id)}
                            className="rounded-md bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/20"
                          >
                            Ready
                          </button>
                        </>
                      )}
                      {p.status === "Ready for Pickup" && (
                        <>
                          <span className="flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle className="h-3 w-3" />
                            Ready
                          </span>
                          <button
                            onClick={() => handleDispenseRx(p.id)}
                            className="rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            Dispense
                          </button>
                        </>
                      )}
                      {p.status === "Dispensed" && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-success">
                          <CheckCircle className="h-3 w-3" />
                          Dispensed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (section === "inventory") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Medicine Inventory</h3>
            <input
              type="text"
              placeholder="Search..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="h-8 w-32 rounded border border-border bg-secondary px-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Medicine</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Stock</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Rack Location</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Expiry</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Batch</th>
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter((m) =>
                    m.name.toLowerCase().includes(searchQ.toLowerCase()),
                  )
                  .map((m, idx) => {
                    let statusBg = "bg-success/10 text-success"
                    if (m.stock === 0) statusBg = "bg-destructive/10 text-destructive"
                    else if (m.stock <= m.reorder / 2) statusBg = "bg-warning/10 text-warning"

                    return (
                      <tr
                        key={idx}
                        className="border-b border-border/50 hover:bg-secondary/30"
                      >
                        <td className="px-3 py-2 font-medium text-foreground">{m.name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {m.stock} / {m.reorder}
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusBg)}>
                            {m.stock === 0 && "Out of Stock"}
                            {m.stock > 0 && m.stock <= m.reorder / 2 && "Low"}
                            {m.stock > m.reorder / 2 && "OK"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {m.rack && m.shelf && m.boxNumber ? (
                            <span className="font-mono text-xs">
                              {m.rack}-{m.shelf}-{m.boxNumber}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{m.expiryDate}</td>
                        <td className="px-3 py-2 text-muted-foreground">{m.batchNumber}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (section === "alerts") {
    const alerts = inventory.filter((m) => m.stock === 0 || m.stock <= m.reorder / 2)

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Stock Alerts</h3>
          <div className="mt-3 space-y-2">
            {alerts.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-lg border p-3",
                  m.stock === 0
                    ? "border-destructive/30 bg-destructive/10"
                    : "border-warning/30 bg-warning/10",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current: {m.stock} | Reorder: {m.reorder}
                    </p>
                    {new Date(m.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                      <p className="mt-1 text-xs text-orange-600">Expiring: {m.expiryDate}</p>
                    )}
                  </div>
                  {m.stock === 0 && (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                  )}
                  {m.stock > 0 && m.stock <= m.reorder / 2 && (
                    <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-success" />
                <p className="mt-2 text-sm text-muted-foreground">All stock levels healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (section === "collection") {
    const readyForPickup = prescriptions.filter((p) => p.status === "Ready for Pickup" || p.status === "Dispensed")

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Ready for Pickup / Dispensed</h3>
          <div className="mt-3 space-y-2">
            {readyForPickup.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{p.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.medicines.join(", ")}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle className="h-3 w-3" />
                  {p.status}
                </span>
              </div>
            ))}
            {readyForPickup.length === 0 && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No medicines ready for pickup</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (section === "dashboard") {
    return (
      <div className="space-y-4">
        {/* Existing KPI section omitted - shown above */}
      </div>
    )
  }

  // AI Insights View
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">AI Medicine Demand Predictions</h3>
        <p className="mt-1 text-xs text-muted-foreground">Powered by seasonal patterns & weather trends</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AI_MEDICINE_INSIGHTS.map((insight, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-3",
                insight.priority === "high"
                  ? "border-destructive/30 bg-destructive/5"
                  : insight.priority === "medium"
                    ? "border-warning/30 bg-warning/5"
                    : "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {insight.priority === "high" && (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  {insight.priority === "medium" && (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  )}
                  {insight.priority === "low" && (
                    <Pill className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{insight.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                  <div className="mt-2 rounded-md bg-secondary/30 px-2 py-1.5">
                    <p className="text-xs font-medium text-foreground">
                      💡 {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
