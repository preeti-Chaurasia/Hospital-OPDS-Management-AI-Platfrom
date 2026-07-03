"use client"

import { useState } from "react"
import { Search, AlertTriangle, CheckCircle, AlertCircle, Pill } from "lucide-react"
import { MEDICINE_INVENTORY } from "@/lib/medical-data"
import { Panel, PanelHeader } from "../ui"
import { cn } from "@/lib/utils"

export function MedicineSearch() {
  const [medicines] = useState(MEDICINE_INVENTORY)
  const [searchQ, setSearchQ] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">("all")

  const filtered = medicines.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(searchQ.toLowerCase())
    if (filterStatus === "low") return matchSearch && m.stock > 0 && m.stock <= m.reorder / 2
    if (filterStatus === "out") return matchSearch && m.stock === 0
    return matchSearch
  })

  const lowStockCount = medicines.filter((m) => m.stock > 0 && m.stock <= m.reorder / 2).length
  const outOfStockCount = medicines.filter((m) => m.stock === 0).length

  const getStockStatus = (medicine: typeof medicines[0]) => {
    if (medicine.stock === 0) return { label: "Out of Stock", icon: AlertTriangle, color: "text-destructive" }
    if (medicine.stock <= medicine.reorder / 2) return { label: "Low Stock", icon: AlertCircle, color: "text-warning" }
    return { label: "In Stock", icon: CheckCircle, color: "text-success" }
  }

  return (
    <Panel>
      <PanelHeader
        title="Medicine Database"
        subtitle={`${medicines.length} medicines · ${lowStockCount} low · ${outOfStockCount} out`}
        icon={<Pill className="h-4 w-4" />}
      />

      <div className="space-y-4 p-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medicine..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-card text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-md border border-border bg-card text-sm"
          >
            <option value="all">All</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Medicine Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-semibold">Medicine</th>
                <th className="text-left p-2 font-semibold">Stock</th>
                <th className="text-left p-2 font-semibold">Status</th>
                <th className="text-left p-2 font-semibold">Expiry</th>
                <th className="text-left p-2 font-semibold">Batch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((med) => {
                const status = getStockStatus(med)
                const StatusIcon = status.icon
                return (
                  <tr key={med.name} className="border-b border-border hover:bg-secondary/50">
                    <td className="p-2 font-medium">{med.name}</td>
                    <td className="p-2">
                      <span className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                        {med.stock} / {med.reorder}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={cn("h-4 w-4", status.color)} />
                        <span className={status.color}>{status.label}</span>
                      </div>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{med.expiryDate}</td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">{med.batchNumber}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No medicines found
          </div>
        )}
      </div>
    </Panel>
  )
}
