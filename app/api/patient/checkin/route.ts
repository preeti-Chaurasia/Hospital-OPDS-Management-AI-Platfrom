import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ======================================================
// GET
// Fetch Check-In Details + Live Queue
// ======================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // ===========================================
    // Latest Appointment
    // ===========================================

    const appointmentResult = await db.query(
      `
      SELECT
        appointment_id,
        patient_id,
        token_number,
        department,
        doctor_name,
        queue_position,
        estimated_wait,
        status
      FROM appointments
      WHERE patient_id=$1
      ORDER BY appointment_id DESC
      LIMIT 1
      `,
      [patientId]
    );

    if (appointmentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        {
          status: 404,
        }
      );
    }

    const appointment = appointmentResult.rows[0];

    // ===========================================
    // Check-In Data
    // ===========================================

    const checkinResult = await db.query(
      `
   SELECT
    a.token_number,
    a.estimated_wait,
    a.status,

    p.full_name,
    p.age,
    p.gender,

    t.symptoms,
    t.suggested_department,
    t.ai_confidence

FROM appointments a

JOIN patients p
ON p.patient_id = a.patient_id

LEFT JOIN ai_voice_triage t
ON t.triage_id = a.triage_id

WHERE a.appointment_id = $1;
      `,
      [appointment.appointment_id]
    );

    const checkin =
      checkinResult.rows.length > 0
        ? checkinResult.rows[0]
        : null;

    // ===========================================
    // Live Queue
    // ===========================================

    const queueResult = await db.query(
      `
     SELECT

a.appointment_id,
a.token_number,
a.priority,
a.estimated_wait,
a.status,


p.patient_id,
p.full_name,
p.age,
p.gender,

t.symptoms,
t.suggested_department,
t.ai_confidence

FROM appointments a

JOIN patients p
ON a.patient_id = p.patient_id

LEFT JOIN ai_voice_triage t
ON a.triage_id = t.triage_id

ORDER BY a.queue_position ASC;
      `
    );

    return NextResponse.json({
      success: true,
      appointment,
      checkin,
      liveQueue: queueResult.rows,
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );

  }
}

// ======================================================
// POST
// QR Scan -> Update Database
// ======================================================

export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    const { patientId } = body;

    if (!patientId) {

      return NextResponse.json(
        {
          success: false,
          message: "Appointment ID required",
        },
        {
          status: 400,
        }
      );

    }

    // =====================================
    // Update Check-In
    // =====================================

    await db.query(
      `
      UPDATE qr_checkin

      SET

      status='Checked In',
      scan_time=NOW()

      WHERE appointment_id=$1
      `,
      [patientId]
    );

    // =====================================
    // Update Appointment
    // =====================================

    await db.query(
      `
      UPDATE appointments

      SET status='Checked In'

      WHERE appointment_id=$1
      `,
      [patientId]
    );

    return NextResponse.json({
      success: true,
      message: "Patient Checked In Successfully",
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );

  }

}