"use client"

import { useState } from "react"
import { FlaskConical, Download, Search } from "lucide-react"
import { LAB_TESTS } from "@/lib/medical-data"
import { Panel, PanelHeader, Badge } from "../ui"
import { cn } from "@/lib/utils"

export function LabReports() {
  const [labTests, setLabTests] = useState(LAB_TESTS)
  const [searchQ, setSearchQ] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "ready">("all")

  const updateLabTestStatus = (testId: string, status: "Pending" | "In Progress" | "Ready" | "Delivered") => {
    setLabTests((tests) =>
      tests.map((t) =>
        t.id === testId ? { ...t, status } : t
      )
    )
  }

  const filtered = labTests.filter((t) => {
    const matchSearch = t.patientName.toLowerCase().includes(searchQ.toLowerCase())
    if (filterStatus === "pending") return matchSearch && t.status !== "Ready" && t.status !== "Delivered"
    if (filterStatus === "ready") return matchSearch && (t.status === "Ready" || t.status === "Delivered")
    return matchSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready":
      case "Delivered":
        return "text-success"
      case "In Progress":
        return "text-warning"
      default:
        return "text-muted-foreground"
    }
  }

  const readyCount = labTests.filter((t) => t.status === "Ready" || t.status === "Delivered").length
  const pendingCount = labTests.filter((t) => t.status === "Pending" || t.status === "In Progress").length

  return (
    <Panel>
      <PanelHeader
        title="Lab Reports"
        subtitle={`${readyCount} ready · ${pendingCount} pending`}
        icon={<FlaskConical className="h-4 w-4" />}
      />

      <div className="space-y-4 p-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient..."
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
            <option value="pending">Pending</option>
            <option value="ready">Ready</option>
          </select>
        </div>

        {/* Lab Tests List */}
        <div className="divide-y divide-border">
          {filtered.map((test) => (
            <div key={test.id} className="py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{test.patientName}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {test.testType}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Requested by {test.requestedBy} at {test.requestedAt}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
               <Badge 
  className={cn(
    "px-2 py-0.5 rounded text-xs font-medium",
    test.status === "Ready" || test.status === "Delivered" 
      ? "bg-success/10 text-success border border-success/20" 
      : "bg-warning/10 text-warning border border-warning/20"
  )}
>
  {test.status}
</Badge>
                
                <div className="flex gap-1.5">
                  {test.status !== "Delivered" && (
                    <button
                      type="button"
                      onClick={() => updateLabTestStatus(test.id, "Ready")}
                      className="text-xs px-2 py-1 rounded-md border border-primary text-primary hover:bg-primary/10 transition"
                    >
                      Mark Ready
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary transition flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No lab reports found
          </div>
        )}
      </div>
    </Panel>
  )
}
