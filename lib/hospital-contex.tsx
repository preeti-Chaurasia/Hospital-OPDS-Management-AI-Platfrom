"use client"

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react"
import {
  INITIAL_QUEUE,
  buildBeds,
  MEDICINE_INVENTORY,
  LAB_TESTS,
  PRESCRIPTIONS,
  type QueuePatient,
  type Bed,
  type BedStatus,
  type LabTest,
  type Prescription,
  type MedicineStock,
} from "./medical-data"

interface HospitalContextType {
  // Queue management
  queue: QueuePatient[]
  updateQueueWaitTime: (minutes: number) => void
  admitPatient: (patientId: string, bedId: string) => void
  
  // Bed management
  beds: Bed[]
  updateBedStatus: (bedId: string, status: BedStatus) => void
  reserveBed: (bedId: string, patientId: string, patientName: string) => void
  
  // Medicine/Pharmacy
  medicines: MedicineStock[]
  updateMedicineStock: (name: string, quantity: number) => void
  
  // Lab tests
  labTests: LabTest[]
  updateLabTestStatus: (testId: string, status: "Pending" | "In Progress" | "Ready" | "Delivered") => void
  
  // Prescriptions
  prescriptions: Prescription[]
  updatePrescriptionStatus: (rxId: string, status: "New" | "Being Prepared" | "Ready for Pickup" | "Dispensed") => void
  
  // Emergency mode
  emergencyMode: boolean
  toggleEmergencyMode: () => void
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined)

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_QUEUE)
  const [beds, setBeds] = useState<Bed[]>(buildBeds())
  const [medicines, setMedicines] = useState<MedicineStock[]>(MEDICINE_INVENTORY)
  const [labTests, setLabTests] = useState<LabTest[]>(LAB_TESTS)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(PRESCRIPTIONS)
  const [emergencyMode, setEmergencyMode] = useState(false)

  const updateQueueWaitTime = useCallback((minutes: number) => {
    setQueue((q) =>
      q.map((p) => ({
        ...p,
        waitMins: Math.max(0, p.waitMins + minutes),
      }))
    )
  }, [])

  const admitPatient = useCallback((patientId: string, bedId: string) => {
    setQueue((q) => {
      const patient = q.find((p) => p.id === patientId)
      
      // Update bed status
      setBeds((b) =>
        b.map((bed) =>
          bed.id === bedId
            ? {
                ...bed,
                status: "Occupied" as BedStatus,
                patientName: patient?.name || "",
                patientId: patientId,
              }
            : bed
        )
      )
      
      // Remove patient from queue
      return q.filter((p) => p.id !== patientId)
    })
  }, [])

  const updateBedStatus = useCallback(
    (bedId: string, status: BedStatus) => {
      setBeds((b) =>
        b.map((bed) =>
          bed.id === bedId
            ? { ...bed, status }
            : bed
        )
      )
    },
    []
  )

  const reserveBed = useCallback(
    (bedId: string, patientId: string, patientName: string) => {
      setBeds((b) =>
        b.map((bed) =>
          bed.id === bedId
            ? {
                ...bed,
                status: "Available" as BedStatus,
                patientName,
                patientId,
              }
            : bed
        )
      )
    },
    []
  )

  const updateMedicineStock = useCallback(
    (name: string, quantity: number) => {
      setMedicines((m) =>
        m.map((med) =>
          med.name === name
            ? { ...med, stock: Math.max(0, med.stock + quantity) }
            : med
        )
      )
    },
    []
  )

  const updateLabTestStatus = useCallback(
    (testId: string, status: "Pending" | "In Progress" | "Ready" | "Delivered") => {
      setLabTests((tests) =>
        tests.map((t) =>
          t.id === testId ? { ...t, status } : t
        )
      )
    },
    []
  )

  const updatePrescriptionStatus = useCallback(
    (rxId: string, status: "New" | "Being Prepared" | "Ready for Pickup" | "Dispensed") => {
      setPrescriptions((rxs) =>
        rxs.map((rx) =>
          rx.id === rxId ? { ...rx, status } : rx
        )
      )
    },
    []
  )

  const toggleEmergencyMode = useCallback(() => {
    setEmergencyMode((prev) => !prev)
  }, [])

  return (
    <HospitalContext.Provider
      value={{
        queue,
        updateQueueWaitTime,
        admitPatient,
        beds,
        updateBedStatus,
        reserveBed,
        medicines,
        updateMedicineStock,
        labTests,
        updateLabTestStatus,
        prescriptions,
        updatePrescriptionStatus,
        emergencyMode,
        toggleEmergencyMode,
      }}
    >
      {children}
    </HospitalContext.Provider>
  )
}

export function useHospital() {
  const context = useContext(HospitalContext)
  if (!context) {
    throw new Error("useHospital must be used within HospitalProvider")
  }
  return context
}
