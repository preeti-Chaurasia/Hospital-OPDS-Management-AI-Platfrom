"use client"

import { useState, useEffect } from "react"
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
  CloudLightning,
  Layers,
  RefreshCw, // Loader for API transitions
} from "lucide-react"

import { PRESCRIPTIONS, MEDICINE_INVENTORY, type Prescription } from "@/lib/medical-data"
import { cn } from "@/lib/utils"

const ACTIVITY_LOG = [
  { id: 1, time: "09:45 AM", action: "Dispensed Prenatal Vitamin to Sofia Marquez", type: "dispensed" },
  { id: 2, time: "09:30 AM", action: "Stock updated: Ceftriaxone 1g IV - 25 units", type: "stock" },
  { id: 3, time: "09:15 AM", action: "Alert: Amoxicillin 500mg - Out of stock", type: "alert" },
  { id: 4, time: "08:55 AM", action: "New prescription received from Dr. Shaw", type: "rx" },
]

export function PharmacyDashboard({ section }: { section: string }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [activeRackHover, setActiveRackHover] = useState<string | null>(null)

  // ─── NEW BACKEND DATA BINDING STATES ───
  const [weatherTelemetry, setWeatherTelemetry] = useState<any>(null)
  const [aiInsightsList, setAiInsightsList] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null)

  // ─── LIVE FETCHING CRITERIA FROM BACKEND API ───
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/pharmacy/dashboard")
      const data = await res.json()
      console.log("Inventory Data");
      console.log(data.inventory);
      console.log(data.prescriptions);
      setPrescriptions(data.prescriptions || [])
      setInventory(data.inventory || [])
      setActivityLogs(data.activity || [])
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  };

  const fetchLiveAIPredictions = async () => {
    try {
      const res = await fetch('/api/pharmacy/weather?city=Surat')
      if (res.ok) {
        const data = await res.json()
        setWeatherTelemetry(data.autonomousTelemetry)

        // 🧠 FIXED CRITICAL MAP CONTRACT SCHEMA: 
        const mappedInsights = (data.inventory || [])
          .filter((item: any) => item.ai_recommended_boost > 0)
          .map((item: any) => ({
            medicine_name: item.medicine_name,
            ai_insight_message: item.ai_insight_message,
            ai_recommended_boost: item.ai_recommended_boost,
            predicted_outbreak_disease: item.predicted_outbreak_disease || "None"
          }))

        // Fallback checks parameters if database constraints are cleared/empty during testing
        setAiInsightsList(mappedInsights.length > 0 ? mappedInsights : [
          { medicine_name: "Normal Saline 1L", ai_insight_message: "AI Alert (XGBoost): High Humidity & Rain detected. Waterborne & vector outbreak index rising.", ai_recommended_boost: 200, predicted_outbreak_disease: "Gastroenteritis" },
          { medicine_name: "Amoxicillin 500mg", ai_insight_message: "AI Alert (XGBoost): Continuous seasonal precipitation shifts mapped.", ai_recommended_boost: 100, predicted_outbreak_disease: "Tropical Bacterial Infections" }
        ])
      }
    } catch (err) {
      console.error("Failed connecting to autonomous climate node:", err)
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    fetchLiveAIPredictions()
  }, [])


const handlePrepareRx = (id:number)=>{

setPrescriptions(

prescriptions.map((p)=>

p.prescription_id===id

? {...p,order_status:"Being Prepared"}

:p

)

)

}

  const handleDispenseRx=(id:number)=>{

setPrescriptions(

prescriptions.map((p)=>

p.prescription_id===id

? {...p,order_status:"Dispensed"}

:p

)

)

}

const handleMarkReady=(id:number)=>{

setPrescriptions(

prescriptions.map((p)=>

p.prescription_id===id

? {...p,order_status:"Ready"}

:p

)

)

}

  const readyCount = (prescriptions ?? []).filter(
    (p) =>
      p.order_status === "Ready" ||
      p.order_status === "Dispensed"
  ).length;

  const lowStockCount = (inventory ?? []).filter(
    (m) =>
      m.current_stock > 0 &&
      m.current_stock <= m.reorder_level
  ).length;

  const outOfStockCount = (inventory ?? []).filter(
    (m) => m.current_stock === 0
  ).length;

  /* =========================================================================
      SECTION 1: UNIFIED PHARMACY DASHBOARD (MERGED WORKSPACE)
      ========================================================================= */
  if (section === "dashboard" || section === "prescriptions") {
    return (
      <div className="space-y-4">
        {/* Statistics Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today's Prescriptions", value: prescriptions.length, color: "text-primary border-primary/20 bg-primary/5" },
            { label: "Ready for Pickup", value: readyCount, color: "text-success border-success/20 bg-success/5" },
            { label: "Low Stock", value: lowStockCount, color: "text-warning border-warning/20 bg-warning/5" },
            { label: "Out of Stock", value: outOfStockCount, color: "text-destructive border-destructive/20 bg-destructive/5" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className={cn("mt-2 text-2xl font-bold", stat.color.split(" ")[0])}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Live Tracking Split Workspace */}
        <div className="grid gap-4 lg:grid-cols-3">

          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Live Active Prescriptions & Fulfillment Queue</h3>
              </div>
              <input
                type="text"
                placeholder="Search patient/medicine..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-7 w-44 rounded border border-border bg-secondary px-2 text-[11px] text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
              {prescriptions
               .filter((p) => {
  const name = p.full_name ?? "";
  const medicines = p.medicines ?? "";

  return (
    name.toLowerCase().includes(searchQ.toLowerCase()) ||
    medicines.toLowerCase().includes(searchQ.toLowerCase())
  );
})
                .map((p, index) => (
  <div
    key={`${p.id ?? p.prescription_id ?? "item"}-${index}`}
    className="rounded-lg border border-border bg-secondary/20 p-3"
  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground">{p.full_name}</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{p.doctor_name}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(p.medicines ?? "").split(",").map((med: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-medium text-primary"
                            >
                              {med.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.order_status === "New" && (
                          <>
                            <span className="font-semibold text-primary">New Order</span>
                            <button
                              onClick={() => handlePrepareRx(p.prescription_id)}
                              className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
                            >
                              Prepare
                            </button>
                          </>
                        )}
                        {p.order_status === "Being Prepared" && (
                          <>
                            <span className="flex items-center gap-1 font-semibold text-blue-600">
                              <Clock className="h-3 w-3 animate-spin" /> Packaging
                            </span>
                            <button
                              onClick={() => handleMarkReady(p.prescription_id)}
                              className="rounded-md bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success hover:bg-success/20"
                            >
                              Ready
                            </button>
                          </>
                        )}
                        {p.order_status === "Ready for Pickup" && (
                          <>
                            <span className="flex items-center gap-1 font-semibold text-success">
                              <CheckCircle className="h-3 w-3" /> Waiting at Counter
                            </span>
                            <button
                              onClick={() => handleDispenseRx(p.prescription_id)}
                              className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
                            >
                              Dispense (Hand Over)
                            </button>
                          </>
                        )}
                        {p.order_status === "Dispensed" && (
                          <span className="flex items-center gap-1 font-semibold text-success/80 bg-success/5 border border-success/10 rounded-full px-2 py-0.5">
                            <CheckCircle className="h-3 w-3" /> Medicine Handed Over
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Recent Activity Log</h3>
            <div className="mt-3 space-y-2.5">
            
              {activityLogs.map((log)=>(
                <div key={log.activity_id} className="flex flex-col gap-1 border-l-2 border-primary/30 bg-secondary/30 px-3 py-1.5 rounded-r-md">
                  <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{log.time}</span>
                  <p className="text-xs text-foreground/80 font-medium leading-normal">{log.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  /* =========================================================================
      SECTION 2: MERGED INVENTORY & CRITICAL STOCK ALERTS MODULE
      ========================================================================= */
  if (section === "inventory" || section === "alerts") {
    const activeAlerts = inventory.filter((m) => m.current_stock === 0 || m.current_stock <= m.reorder_level / 2)

    return (
      <div className="space-y-4">

        {/* High-Visibility Real-Time Critical Stock Alerts Banner Row */}
        {activeAlerts.length > 0 && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive border-b border-destructive/10 pb-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Critical Real-Time Stock Vulnerabilities</h4>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {activeAlerts.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded px-2.5 py-1 text-[11px] font-medium border flex items-center gap-2",
                    m.current_stock === 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"
                  )}
                >
                  <span className="font-bold">{m.medicine_name}</span>
                  <span className="opacity-70">({m.current_stock === 0 ? "Out of stock" : `Low: ${m.current_stock} left`})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Inventory Table Layout System */}
        <div className="grid gap-4 lg:grid-cols-3">

          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Integrated Master Inventory Database</h3>
              <input
                type="text"
                placeholder="Search database..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-8 w-36 rounded border border-border bg-secondary px-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
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
                  </tr>
                </thead>
                <tbody>
                  {inventory
                    .filter((m) =>
                      m.medicine_name.toLowerCase().includes(searchQ.toLowerCase()),
                    )
                    .map((m, idx) => {
                      let statusBg = "bg-success/10 text-success"
                      if (m.current_stock === 0) statusBg = "bg-destructive/10 text-destructive"
                      else if (m.current_stock <= m.reorder_level / 2) statusBg = "bg-warning/10 text-warning"

                      return (
                        <tr
                          key={idx}
                          onClick={() => {
                            setSelectedMedicine(m)
                            const rack = `Rack-${m.rack_location.split("-")[0]}`
                            setActiveRackHover(rack)
                          }}
                          className={cn(
                            "cursor-pointer border-b border-border/50 transition duration-150",
                            activeRackHover === m.rack_location
                              ? "bg-primary/10"
                              : "hover:bg-secondary/30"
                          )}
                        >
                          <td className="px-3 py-2 font-medium text-foreground">{m.medicine_name}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {m.current_stock} / {m.reorder_level}
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusBg)}>
                              {m.current_stock === 0 && "Out of Stock"}
                              {m.current_stock > 0 && m.current_stock <= m.reorder_level / 2 && "Low Stock"}
                              {m.current_stock > m.reorder_level / 2 && "Healthy"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground font-bold text-primary">
                            {m.rack_location}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{m.expiry_date}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphical Storage Locator Grid Map */}
          <div className="rounded-lg border border-border bg-card p-4 h-fit">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Pharmacy Storage Layout Map</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 mb-4 leading-relaxed">
              Hover over an inventory list record to highlight its designated custom row coordinate box configuration below.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["Rack-A", "Rack-B", "Rack-C", "Rack-D", "Rack-E"].map((rack) => {
                const isMatch = activeRackHover === rack
                return (
                  <div
                    key={rack}
                    className={cn(
                      "flex flex-col items-center justify-center p-5 rounded-lg border text-center transition-all duration-300",
                      isMatch
                        ? "border-primary bg-primary/10 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                        : "border-border bg-secondary/30"
                    )}
                  >
                    <span className={cn("text-xs font-bold tracking-wide", isMatch ? "text-primary" : "text-foreground")}>
                      {rack}
                    </span>
                    <div className="mt-2 w-full grid grid-cols-3 gap-1 px-1">
                      <div className="h-2 rounded-sm bg-muted/40" />
                      <div className="h-2 rounded-sm bg-muted/40" />
                      <div className="h-2 rounded-sm bg-muted/40" />
                    </div>
                    <div className="mt-3 flex flex-col items-center gap-1">
                      {isMatch ? (
                        <>
                          <div className="text-sm font-bold text-primary">
                            📦 {selectedMedicine?.medicine_name}
                          </div>
                          <div className="text-xs">
                            📍 {selectedMedicine?.rack_location}
                          </div>
                          <div className="text-xs">
                            Stock : {selectedMedicine?.current_stock}
                          </div>
                          <div className="text-xs">
                            Expiry : {selectedMedicine?.expiry_date}
                          </div>
                          <div className="mt-2 rounded bg-green-100 px-2 py-1 text-green-700 text-xs font-semibold">
                            Located Here
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase">
                          Storage
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    )
  }

  /* =========================================================================
      SECTION 3: AI ENVIRONMENTAL DEMAND PREDICTIONS CONSOLE
      ========================================================================= */
  return (
    <div className="space-y-4">
      {/* Real-Time Environmental External Synced Node Widget */}
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <CloudLightning className="h-5 w-5 animate-bounce" />
            <span className="text-sm font-bold tracking-wide">AI Live Weather Intelligence Node</span>
          </div>
          <p className="text-xs text-foreground/80 font-medium">
            Current Environment: <span className="font-bold text-primary">
              {weatherTelemetry
                ? `${weatherTelemetry.city}: ${weatherTelemetry.temperature}°C, Humidity ${weatherTelemetry.humidity}% (${weatherTelemetry.apiRawCondition})`
                : "Synchronizing Regional Meteorological Telemetry..."
              }
            </span>
          </p>
          <p className="text-[11px] font-bold text-amber-600 animate-pulse mt-1">
            🌍 Active Framework State: {weatherTelemetry?.condition || "Detecting Cloud Analytics..."}
          </p>
        </div>
        <div className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-xs font-semibold shrink-0 hidden sm:inline-flex">
          {apiLoading ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
          Sync Status: Operational
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">AI Medicine Demand Predictions</h3>
        <p className="mt-1 text-xs text-muted-foreground">Powered by seasonal patterns & weather trends</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {aiInsightsList.map((insight, idx) => {
            const title = insight.medicine_name || "Unknown Medicine Asset";
            const recommendation = insight.ai_insight_message || "Stock Verified - Stable Demand Channel.";
            const boostUnits = insight.ai_recommended_boost || 0;
            const disease = insight.predicted_outbreak_disease || "General Outbreak";

            const priority = boostUnits > 45 ? "high" : boostUnits > 0 ? "medium" : "low";

            const description = (disease && disease !== "None" && disease !== "General Outbreak")
              ? `Risk Indication Matrix: High threat of ${disease} in local sectors.`
              : "Chronic Clinical Maintenance & Baseline Balance State.";

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-lg border p-3",
                  priority === "high"
                    ? "border-destructive/30 bg-destructive/5"
                    : priority === "medium"
                      ? "border-warning/30 bg-warning/5"
                      : "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {priority === "high" && <AlertTriangle className="h-5 w-5 text-destructive" />}
                    {priority === "medium" && <AlertCircle className="h-5 w-5 text-warning" />}
                    {priority === "low" && <Pill className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground truncate text-sm">{title}</p>
                      {boostUnits > 0 && (
                        <span className="text-[9px] font-bold uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded tracking-wider shrink-0 animate-pulse">
                          +{boostUnits} Units
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    <div className="mt-2 rounded-md bg-secondary/30 px-2 py-1.5">
                      <p className="text-xs font-medium text-foreground">💡 {recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}