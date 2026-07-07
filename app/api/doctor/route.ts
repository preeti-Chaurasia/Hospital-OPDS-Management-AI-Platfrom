// app/api/doctor/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────
// 1. GET METHOD: Handling Queue Fetching AND Medicine Stock Checking
// ─────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'fetchQueue' or 'checkStock'

    // ---- PART A: LIVE QUEUE & NURSE VITALS FETCH ----
    if (action === 'fetchQueue') {
      const queueQuery = `
        SELECT t.*, v.blood_pressure, v.pulse_rate, v.temperature, v.respiration_rate, v.spo2
        FROM patient_tokens t
        LEFT JOIN patient_vitals v ON t.token_number = v.token_number
        WHERE t.current_status IN ('In Queue', 'In Consultation')
        ORDER BY 
          CASE WHEN t.triage_status = 'Emergency' THEN 1
               WHEN t.triage_status = 'Critical' THEN 2
               ELSE 3 END, 
          t.created_at ASC;
      `;
      const result = await db.query(queueQuery);
      
      const formattedQueue = result.rows.map(p => ({
        ...p,
        vitals: {
          bp: p.blood_pressure || 'Pending',
          hr: p.pulse_rate || 0,
          temp: p.temperature || 0,
          spo2: p.spo2 || 0,
          resp: p.respiration_rate || 0
        },
        history: p.current_status === 'In Consultation' ? p.symptoms_text : 'Hidden until patient turn'
      }));

      return NextResponse.json(formattedQueue, { status: 200 });
    }

    // ---- PART B: QUICK PHARMACY STOCK CHECK ALERT ----
    if (action === 'checkStock') {
      const medName = searchParams.get('medicine_name');
      if (!medName) return NextResponse.json({ error: "Medicine name required" }, { status: 400 });

      const res = await db.query(
        "SELECT current_stock, reorder_level FROM medicine_inventory WHERE medicine_name = $1",
        [medName]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ is_low: true, stock: 0, msg: "Out of Bounds" }, { status: 200 });
      }

      const { current_stock, reorder_level } = res.rows[0];
      const isLow = current_stock <= (reorder_level / 2);

      return NextResponse.json({
        is_low: isLow,
        stock: current_stock,
        msg: current_stock === 0 ? "Out of Stock" : isLow ? "Warning: Low Stock Alert" : "Healthy"
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid GET action specified" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "GET operation failed", details: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2. POST METHOD: Handling Consult Finalization AND Emergency ETA Trigger
// ─────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body; // 'submitConsult' or 'toggleEmergency'

    // ---- PART C: SUBMIT PRESCRIPTION & ORDER LAB TEST ----
    if (type === 'submitConsult') {
      const { token_number, patient_name, doctor_id, doctor_name, medicines, lab_tests } = body;
      if (!token_number) return NextResponse.json({ error: "Missing token number" }, { status: 400 });

      // Medicines entry inside prescriptions table
      if (medicines && medicines.length > 0) {
        for (const med of medicines) {
          await db.query(`
            INSERT INTO patient_prescriptions (token_number, medicine_name, dosage, duration_days, quantity_prescribed, fulfillment_status)
            VALUES ($1, $2, $3, $4, $5, 'Pending')
          `, [token_number, med.name, med.dosage, med.duration, med.qty]);
        }
      }

      // Labs entry inside reports table
      if (lab_tests && lab_tests.length > 0) {
        for (const test of lab_tests) {
          await db.query(`
            INSERT INTO patient_lab_reports (token_number, test_name, ordered_by_doctor_id, lab_technician_status)
            VALUES ($1, $2, $3, 'Requested')
          `, [token_number, test, doctor_id]);
        }
      }

      // Mark token check cycle as completed
      await db.query("UPDATE patient_tokens SET current_status = 'Completed' WHERE token_number = $1", [token_number]);

      // Insert live action event into admin logs
      const adminLogMsg = `Patient ${patient_name} (${token_number}) consult closed. Rx and Labs dispatched live.`;
      await db.query(
        "INSERT INTO admin_audit_logs (token_number, event_message, action_by) VALUES ($1, $2, $3)",
        [token_number, adminLogMsg, doctor_name || 'OPD Physician']
      );

      return NextResponse.json({ success: true, message: "Consult synchronized perfectly!" }, { status: 200 });
    }

    // ---- PART D: EMERGENCY MODE ETA TIMELINE INCREMENT (+15 to +30 Min) ----
    if (type === 'toggleEmergency') {
      const { status } = body; // 'activate' or 'deactivate'
      const timeDelta = 20; // 20 Mins block offset modification values
      const logMessage = status === 'activate' 
        ? "🚨 Emergency Mode Active: Added +20 mins delay framework across all waiting patient tokens."
        : "Emergency Mode Deactivated: Timeline constraints reverted back to normal throughput limits.";

      const updateQuery = status === 'activate'
        ? `UPDATE patient_tokens SET estimated_wait_mins = estimated_wait_mins + $1 WHERE current_status = 'In Queue'`
        : `UPDATE patient_tokens SET estimated_wait_mins = GREATEST(5, estimated_wait_mins - $1) WHERE current_status = 'In Queue'`;

      await db.query(updateQuery, [timeDelta]);

      // Admin log sync
      await db.query(
        "INSERT INTO admin_audit_logs (event_message, action_by) VALUES ($1, 'Doctor Dashboard Trigger')",
        [logMessage]
      );

      return NextResponse.json({ success: true, message: logMessage }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid POST type parameter layout" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "POST operation failed", details: error.message }, { status: 500 });
  }
}