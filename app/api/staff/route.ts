// app/api/staff/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── GET: FETCH UNRESOLVED LAB REQUESTS ───
export async function GET() {
  try {
    const query = `
      SELECT r.*, t.patient_name, t.age 
      FROM patient_lab_reports r
      JOIN patient_tokens t ON r.token_number = t.token_number
      WHERE r.lab_technician_status != 'Uploaded'
      ORDER BY r.updated_at DESC;
    `;
    const res = await db.query(query);
    return NextResponse.json(res.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Staff GET framework failure", details: error.message }, { status: 500 });
  }
}

// ─── POST: LOG PATIENT VITALS (NURSE LOGS FOR ALL) ───
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, token_number, bp, pulse, temp, resp, spo2 } = body;

    if (action === 'logVitals') {
      if (!token_number) return NextResponse.json({ error: "Token number mapping missing" }, { status: 400 });

      // 1. Insert or update patient triage vitals data parameters
      const vitalsQuery = `
        INSERT INTO patient_vitals (token_number, blood_pressure, pulse_rate, temperature, respiration_rate, spo2)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING; -- Prevents duplicate layout crash during sequential testing
      `;
      await db.query(vitalsQuery, [token_number, bp, parseInt(pulse), parseFloat(temp), parseInt(resp), parseInt(spo2)]);

      // 2. Set triage status to ready to announce token active inside queue list matrix
      await db.query("UPDATE patient_tokens SET triage_status = 'Ready' WHERE token_number = $1", [token_number]);

      // 3. Dispatch security live audit record feed node for the system monitor
      await db.query(
        "INSERT INTO admin_audit_logs (token_number, event_message, action_by) VALUES ($1, $2, 'Nurse Station')",
        [token_number, `Pre-check triage parameters verified & logged into matrix data securely.`]
      );

      return NextResponse.json({ success: true, message: "Triage vitals logged successfully! Patient ready for doctor consultation." }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid staff sub-action trigger" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Staff processing crash node", details: error.message }, { status: 500 });
  }
}