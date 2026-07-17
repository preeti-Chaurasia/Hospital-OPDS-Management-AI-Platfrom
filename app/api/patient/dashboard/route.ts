import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "Patient ID required" },
        { status: 400 }
      );
    }

    // ===========================
    // Patient
    // ===========================

    const patientResult = await db.query(
      `
      SELECT
        patient_id,
        full_name,
        age,
        gender,
        phone
      FROM patients
      WHERE patient_id=$1
      `,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }

    const patient = patientResult.rows[0];

    // ===========================
    // Appointment
    // ===========================

    const appointmentResult = await db.query(
      `
      SELECT
        appointment_id,
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

    const appointment =
      appointmentResult.rows.length > 0
        ? appointmentResult.rows[0]
        : null;

    let medicines: any[] = [];
    let labReports: any[] = [];
    let vitals: any = null;

    // ===========================
    // If Appointment Exists
    // ===========================

    if (appointment) {


      // Medicines

      const medicineResult = await db.query(
        `
        SELECT
          medicine_name,
          dosage,
          duration,
          status
        FROM prescriptions
        WHERE appointment_id=$1
        `,
        [appointment.appointment_id]
      );

      medicines = medicineResult.rows;

      // Lab Reports

      const reportResult = await db.query(
        `
        SELECT
          report_name,
          status
        FROM lab_reports
        WHERE appointment_id=$1
        `,
        [appointment.appointment_id]
      );

      labReports = reportResult.rows;

      // Vitals

      const vitalResult = await db.query(
        `
        SELECT
          blood_pressure,
          heart_rate,
          temperature,
          spo2,
          respiration_rate
        FROM patient_vitals
        WHERE appointment_id=$1
        LIMIT 1
        `,
        [appointment.appointment_id]
      );

      vitals =
        vitalResult.rows.length > 0
          ? vitalResult.rows[0]
          : null;
    }

    return NextResponse.json({
      success: true,
      patient,
      appointment,
      medicines,
      labReports,
      vitals,
    });

  } catch (err) {

    console.log(err);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error"
      },
      {
        status: 500
      }
    );

  }
}