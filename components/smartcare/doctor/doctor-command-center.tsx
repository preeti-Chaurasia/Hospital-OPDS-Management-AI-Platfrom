"use client"

import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"
import {
  DIAGNOSIS_CODES,
  COMMON_MEDS,
  buildBeds,
  BED_STATUS_STYLES,
  PRIORITY_STYLES,
  type QueuePatient,
} from "@/lib/medical-data"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Clock,
  Heart,
  Plus,
  Search,
  Sliders,
  User,
  X,
  Layers,
  BedDouble,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Bed = {
  bed_id:number
  bed_number:string
  ward_name:string
  bed_type:string
  status:string
  occupied_by:number | null
  predicted_available:string | null
  last_updated:string
}

export function DoctorCommandCenter() {
  
const [queue,setQueue]=useState<QueuePatient[]>([])

const [activePatient,setActivePatient] =
useState<QueuePatient | null>(null)
const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);

const [backupPatient,setBackupPatient] =
useState<QueuePatient | null>(null)
  const [selectedBufferSlot, setSelectedBufferSlot] = useState<string | null>(null)
  const [selectedLab,setSelectedLab]=useState("")
  const [selectedOrder,setSelectedOrder]=useState<any>(null)
  // Backup pointer to remember which patient was open before clicking the buffer slot

  const [emergencyMode, setEmergencyMode] = useState(false)
  const [labReports,setLabReports]=useState<any[]>([])
  // Clinical States Form Input
  const [progressNote, setProgressNote] = useState("")
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("")
 const [prescribedMeds, setPrescribedMeds] = useState<any[]>([])
  const [searchMeds, setSearchMeds] = useState("")
const [medicines,setMedicines]=useState<any[]>([])

useEffect(() => {

  const loadQueue = async () => {

    const res = await fetch("/api/doctor/queue")
    const data = await res.json()

    setQueue(data)

    if(data.length>0){
      setActivePatient(data[0])
      setBackupPatient(data[0])
    }

  }

  loadQueue()

socket.on("queueUpdated", (newQueue) => {
  setQueue(newQueue);

  if (newQueue.length > 0) {
    setActivePatient(newQueue[0]);
    setBackupPatient(newQueue[0]);
  } else {
    setActivePatient(null);
    setBackupPatient(null);
  }
});

  return ()=>{

    socket.off("queueUpdated")

  }

},[])

useEffect(()=>{

const loadMedicines=async()=>{

const res=await fetch("/api/doctor/medicines")

const data=await res.json()

setMedicines(data)

}

loadMedicines()

socket.on("medicineUpdated",()=>{

loadMedicines()

})

return ()=>{

socket.off("medicineUpdated")

}

},[])
  // ─── ✅ NEW STATE: REAL-TIME PHARMACY DATA LOCK BANNER STATES ───
  const [stockWarning, setStockWarning] = useState<{ type: "danger" | "warning"; message: string } | null>(null)

  // ─── UPDATED: CONVERTED TO REACTIVE STATE MATRIX FOR IMMUTABLE FLOWS ───
const [beds,setBeds]=useState<any[]>([])
const [selectedBed, setSelectedBed] = useState<any>(null)
  // Emergency Button Handler
  const handleToggleEmergency = () => {
    const isActivating = !emergencyMode
    setEmergencyMode(isActivating)
    setQueue((prevQueue) =>
      prevQueue.map((p) => ({
        ...p,
        waitMins: isActivating ? p.waitMins + 10 : Math.max(2, p.waitMins - 10),
      }))
    )
  }

  const handleCallNextPatient = () => {
    if (queue.length > 1) {
      const currentIndex = queue.findIndex((p) => p.id === (activePatient?.id || backupPatient?.id))
      const nextIndex = (currentIndex + 1) % queue.length
      setActivePatient(queue[nextIndex])
      setBackupPatient(queue[nextIndex])
      setSelectedBufferSlot(null)
      setStockWarning(null) // Reset banner gracefully on transition
    }
  }

  const handleSkipPatient = () => {
    const targetId = activePatient?.id || backupPatient?.id
    if (targetId) {
      const remaining = queue.filter((p) => p.id !== targetId)
      setQueue(remaining)
      if (remaining.length > 0) {
        setActivePatient(remaining[0])
        setBackupPatient(remaining[0])
      } else {
        setActivePatient(null)
        setBackupPatient(null)
      }
      setSelectedBufferSlot(null)
      setStockWarning(null) // Reset clean slate
    }
  }

  // ─── NEW HANDLER: DIRECT ALLOCATION FLOW FLIPPER
  //  ───

  const handleAdmissionRequest = async () => {
  if (!activePatient) {
    alert("No patient selected");
    return;
  }

  console.log("Sending Admission Request");

  try {
    const res = await fetch("/api/doctor/admission-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointment_id: activePatient.appointmentId,
        patient_id: activePatient.id,
        doctor_id: 1,
        diagnosis_code: selectedDiagnosis,
        progress_note: progressNote,
        status: "Pending",
      }),
    });

    console.log("Status:", res.status);

    const data = await res.json();
    console.log("Response:", data);

   if (data.success) {
  alert("Admission Request Sent");

  socket.emit("admissionRequestAdded");

  const updatedQueue = queue.filter(
    (p) => p.id !== activePatient.id
  );

  setQueue(updatedQueue);

  if (updatedQueue.length > 0) {
    setActivePatient(updatedQueue[0]);
    setBackupPatient(updatedQueue[0]);
  } else {
    setActivePatient(null);
    setBackupPatient(null);
  }

  setIsAdmitModalOpen(false);
} else {
      alert(data.message || "Admission Failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
};
const handleSavePrescription = async()=>{

try{

const response = await fetch(
"/api/doctor/prescription",
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

appointment_id: activePatient?.appointmentId,

doctor_id:1,

medicines: prescribedMeds

})

}
)


const data = await response.json()


if(data.success){

socket.emit(
"medicineUpdated"
)

alert("Prescription Saved")

setPrescribedMeds([])

}
else{

alert(data.message)

}


}
catch(error){

console.log("Prescription Error",error)

alert("Prescription Failed")

}

}
const handleAddMedicine=(medicineName:string)=>{

const exists = prescribedMeds.find(
(m)=>m.name===medicineName
)

if(!exists){

setPrescribedMeds([
...prescribedMeds,
{
name:medicineName,
dosage:"500mg",
frequency:"2 times/day",
duration:"5 days",
instructions:"",
quantity:1
}
])

}

}

useEffect(()=>{

const loadBeds=async()=>{

const res=await fetch("/api/doctor/beds")

const data=await res.json()

setBeds(data)

}

loadBeds()

socket.on("bedsUpdated",(updatedBeds)=>{

setBeds(updatedBeds)

})

return ()=>{

socket.off("bedsUpdated")

}

},[])

const handleSaveNotes = async()=>{


try{


const res = await fetch(
"/api/doctor/notes",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

appointment_id:
activePatient?.appointmentId,

doctor_id:1,

diagnosis_code: selectedDiagnosis,

progress_note: progressNote
})


}

)


const data = await res.json()
console.log("Response", data);

if(data.success){

alert("Notes Saved ")

}


}
catch(error){

console.log(error)

}


}
const handleLabRequest=async()=>{


const res=await fetch(
"/api/doctor/lab-request",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

appointment_id:
activePatient?.appointmentId,

patient_id:
activePatient?.id,

doctor_id:1,

test_name:selectedLab,

priority:"Normal"

})

}

)


const data=await res.json()


socket.emit("labRequested", {
  appointment_id: activePatient?.appointmentId
})
if (data.success) {
  alert("Lab Test Requested Successfully");

  setSelectedLab("");

  const reports = await fetch(
    `/api/doctor/lab-reports?appointment_id=${activePatient?.appointmentId}`
  );

  const reportData = await reports.json();

  setLabReports(reportData);
}
}
useEffect(()=>{

if(!activePatient) return

const loadReports=async()=>{

const res=await fetch(`/api/doctor/lab-reports?appointment_id=${activePatient.appointmentId}`)

const data=await res.json()

setLabReports(data)

}
loadReports();  

socket.on("labReportUpdated", async () => {

const res = await fetch(
`/api/doctor/lab-reports?appointment_id=${activePatient?.appointmentId}`
)

const data = await res.json()

setLabReports(data)

})

return ()=>{

socket.off("labReportUpdated")

}

},[activePatient])
  // ─── ✅ MODIFIED HANDLER: AUTONOMOUS PHARMACY STOCK GUARDRAIL ENGINE ───


  // Safely restore the previous active patient's card layout context upon closing buffer slot
  const handleCloseBufferView = () => {
    setSelectedBufferSlot(null)
    setActivePatient(backupPatient) 
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      
      {/* ─── LEFT COLUMN: AUTOMATIC 5-PATIENT SPLIT BUFFER STREAM ─── */}
      <div className="rounded-lg border border-border bg-card p-4 lg:col-span-1 space-y-3 shadow-sm h-[calc(100vh-140px)] overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Active Patient Queue
        </h3>
        
        <div className="space-y-2">
          {queue.map((p, index) => {
            const isSelected = activePatient?.id === p.id && !selectedBufferSlot
          const prio =
PRIORITY_STYLES[p.priority] ||
{
 cls:"bg-gray-100 text-gray-700",
 label:"Normal"
}
            
            // Render regular patient card
            const patientCard = (
             <div
 key={`${p.id}-${index}`}
 onClick={()=>{
                  setActivePatient(p)
                  setBackupPatient(p) // Remember this selection pointer context
                  setSelectedBufferSlot(null)
                  setStockWarning(null) // Safe layout transition state reset
                }}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-secondary/10 hover:bg-secondary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">{p.token}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold border", prio.cls)}>
                    {prio.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.complaint}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-medium border-t border-border/40 pt-1.5">
                  <span>Age/Sex: {p.age}{p.sex}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    Est: {p.waitMins}m
                  </span>
                </div>
              </div>
            )

            // DYNAMIC INJECTION RULE: Inject Buffer block after every 5 patients chunk interval
            const shouldInjectBufferAfter = (index + 1) % 5 === 0
            const bufferRoomNumber = Math.ceil((index + 1) / 5)

         return (
  <div key={`wrapper-${p.id}-${index}`} className="space-y-2">
                {patientCard}
                {shouldInjectBufferAfter && (
                  <div
                    onClick={() => {
                      setSelectedBufferSlot(`B${bufferRoomNumber}`)
                      setActivePatient(null) // Safely hide open profiles view
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg border border-dashed p-3 transition-all my-2",
                      selectedBufferSlot === `B${bufferRoomNumber}` ? "border-amber-500 bg-amber-500/5" : "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 tracking-wide uppercase">Buffer Slot B{bufferRoomNumber}</span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-500/30">
                        Interval Block
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                      10-15 Min systematic diagnostic cooling buffer assigned automatically here.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── MIDDLE & RIGHT AREA: RENDER CONSOLE VIEWS ─── */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-y-auto pr-1">
        
        {/* IF BUFFER SLOT DRAWER VIEW REQ: ACTIVE COMPONENT LAYER */}
        {selectedBufferSlot ? (
          <div className="md:col-span-3 rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">Buffer Slot Window Segment: {selectedBufferSlot}</h2>
              </div>
              <button onClick={handleCloseBufferView} className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2.5 text-xs">
                <p className="font-bold text-sm text-foreground">Dynamic Window Parameters</p>
                <p className="text-muted-foreground">Assigned Framework: <span className="text-foreground font-semibold">10 to 15 Minutes Cooldown</span></p>
                <p className="text-muted-foreground">Current Status Token Node: <span className="font-mono text-primary font-bold">Active Tracking Segment Matrix</span></p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/10 p-4 space-y-2 text-xs">
                <p className="font-bold text-sm text-foreground">Operational Notice</p>
                <p className="text-muted-foreground leading-relaxed">
                  Patients waiting for diagnostic reports or laboratory results occupy this slot segment without shifting or disturbing the active OPD sequence throughput line.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Patients Holding Inside This Cooldown Window</p>
              {queue.slice(0, 3).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs transition hover:bg-secondary/20">
                  <div>
                    <p className="font-bold text-foreground">{p.name} <span className="text-muted-foreground font-mono font-medium text-[11px]">({p.token})</span></p>
                    <p className="text-muted-foreground text-[11px] mt-0.5 truncate max-w-md">{p.complaint}</p>
                  </div>
                  <span className="font-medium text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">Awaiting Lab Dispatch</span>
                </div>
              ))}
            </div>
          </div>
        ) : activePatient ? (
          
          /* IF REGULAR PATIENT CHOSEN: RENDER LOGS AND MEDICAL WORKSPACE DATA */
          <>
            <div className="md:col-span-2 space-y-4">
              {emergencyMode && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-destructive animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Emergency Mode Active (+10 mins appended)</p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-foreground">{activePatient.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activePatient.age} Yrs · {activePatient.sex === "M" ? "Male" : "Female"} · Token: <span className="font-mono font-bold text-primary">{activePatient.token}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Logged Nurse Vitals Triage</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                    {[
                      { label: "Blood Pressure", val: activePatient.vitals.bp, desc: "mmHg" },
                      { label: "Heart Rate", val: `${activePatient.vitals.hr} BPM`, desc: "Normal Sinus" },
                      { label: "Temperature", val: `${activePatient.vitals.temp} °F`, desc: "Axillary" },
                      { label: "SpO₂ Oxygen", val: `${activePatient.vitals.spo2} %`, desc: "Room Air" },
                    ].map((v) => (
                      <div key={v.label} className="rounded border border-border bg-secondary/20 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium">{v.label}</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{v.val}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{v.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2 text-xs border-t border-border/40 pt-2.5">
                  <div>
                    <p className="font-bold text-muted-foreground mb-1">Chief Symptoms / Complaint</p>
                    <p className="bg-secondary/30 p-2 rounded text-foreground font-medium">{activePatient.complaint}</p>
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground mb-1">Allergies Mapped</p>
                    <div className="flex flex-wrap gap-1">
                      {activePatient.allergies?.length > 0 ? (
                        activePatient.allergies.map((a) => (
                          <span key={a} className="rounded bg-destructive/10 border border-destructive/20 text-destructive font-semibold px-2 py-0.5 text-[10px]">{a}</span>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">No known drug allergies</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2.5 shadow-sm">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Electronic Health Progress Note</p>
                <textarea
                  placeholder="Document clinical findings, assessment plans, diagnostic reasoning..."
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="h-28 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-1.5">
                    Diagnosis & Prescriptions
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Primary Diagnosis (ICD-10)</label>
                    <select
                      value={selectedDiagnosis}
                      onChange={(e) => setSelectedDiagnosis(e.target.value)}
                      className="w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Select ICD Code...</option>
                      {DIAGNOSIS_CODES.map((d) => (
                        <option key={d.code} value={d.code}>{d.code} - {d.label}</option>
                        
                      ))}
                    </select>
                        <button
onClick={handleSavePrescription}
className="w-full rounded-md bg-green-600 py-2 text-xs font-bold text-white"
>
Save Prescription
</button>
<button

onClick={handleSaveNotes}

className="w-full bg-blue-600 text-white py-2 rounded"

>
Save Clinical Notes
</button>
<select

value={selectedLab}

onChange={(e)=>setSelectedLab(e.target.value)}

>

<option value="">
Select Lab Test
</option>

<option>
CBC Blood Test
</option>

<option>
X-Ray
</option>

<option>
MRI Scan
</option>

<option>
CT Scan
</option>


</select>


<button

onClick={handleLabRequest}

className="bg-blue-600 text-white p-2 rounded"

>
Request Lab Test
</button>
                  </div>

                  {/* ─── ✅ DYNAMIC LIVE INVENTORY ALERT BANNER CONTAINER ─── */}
                  {stockWarning && (
                    <div className={cn(
                      "rounded-lg border p-2.5 text-[11px] font-semibold animate-in fade-in slide-in-from-top-2 duration-200 relative mt-2",
                      stockWarning.type === "danger" 
                        ? "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/5" 
                        : "border-warning/30 bg-warning/10 text-warning dark:bg-warning/5"
                    )}>
                      <div className="flex items-start gap-1.5 pr-4">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <p className="leading-snug">{stockWarning.message}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setStockWarning(null)} 
                        className="absolute top-1.5 right-1.5 p-0.5 rounded text-muted-foreground hover:bg-secondary transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Prescribe Pharmacy Stock Drugs</label>
                    <input
                      type="text"
                      placeholder="Search prescription database..."
                      value={searchMeds}
                      onChange={(e) => setSearchMeds(e.target.value)}
                      className="h-7 w-full rounded border border-border bg-secondary px-2 text-[11px] text-foreground focus:outline-none"
                    />
                    {searchMeds && (
                      <div className="border border-border rounded bg-card max-h-24 overflow-y-auto p-1 space-y-1 text-[11px]">
                    {medicines
.filter((m)=>
m.medicine_name
.toLowerCase()
.includes(searchMeds.toLowerCase())
)
.map((m)=>(
                          <div
                          key={m.medicine_id}


onClick={()=>{

handleAddMedicine(
m.medicine_name
)

}}
                            className="p-1 hover:bg-primary/10 rounded cursor-pointer text-foreground font-medium"
                          >
                        + {m.medicine_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {prescribedMeds.length > 0 && (
                    <div className="flex flex-wrap gap-1 bg-secondary/20 p-2 rounded-md border border-border/60">
              {prescribedMeds.map((med)=>(
<span 
key={med.name}
className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px]"
>

{med.name}


<X
className="h-2.5 w-2.5 cursor-pointer"

onClick={()=>{

setPrescribedMeds(
prev=>prev.filter(
(m)=>m.name!==med.name
)
)

}}

/>

</span>
))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleSkipPatient} className="rounded-md border border-border bg-card py-2 text-xs font-semibold text-foreground hover:bg-accent transition">
                      Skip Patient
                    </button>
            <button
  onClick={() => setIsAdmitModalOpen(true)}
  className="rounded-md bg-amber-600 text-white py-2 text-xs font-bold"
>
  Admit Patient
</button>


                  </div>

                  <button onClick={handleCallNextPatient} className="w-full rounded-md bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition">
                    Call Next Patient ➔
                  </button>

                  <button
                    onClick={handleToggleEmergency}
                    className={cn(
                      "w-full rounded-md border py-2 text-xs font-bold uppercase tracking-wider transition",
                      emergencyMode ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                    )}
                  >
                    {emergencyMode ? "Disable Emergency Mode" : "🚨 Activate Emergency Mode"}
                  </button>
                </div>

              </div>
            </div>
          </>
        ) : null}
      </div>


      {/* ─── BED MANAGEMENT POPUP: MODIFIED STYLES & EXCLUSIVE FILTERS FOR DOCTOR VIEW ─── */}
     {isAdmitModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

    <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">

      <h2 className="text-lg font-bold">
        Admit Patient
      </h2>

      <p className="mt-3 text-sm text-muted-foreground">
        This patient will be sent to the Admission Team.
        Bed allocation will be handled by Staff/Admin.
      </p>

      <div className="mt-6 flex justify-end gap-3">

        <button
          onClick={() => setIsAdmitModalOpen(false)}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>

    <button
  onClick={handleAdmissionRequest}
  className="px-4 py-2 rounded bg-green-600 text-white"
>
  Send Admission Request
</button>

      </div>

    </div>

  </div>
)}
          </div>
  )}