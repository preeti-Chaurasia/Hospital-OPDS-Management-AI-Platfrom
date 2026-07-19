import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      appointment_id,
      patient_id,
      doctor_id,
      diagnosis_code,
      progress_note,
      status,
    } = body;

    await pool.query(
      `
      INSERT INTO admission_requests
      (
        appointment_id,
        patient_id,
        doctor_id,
        diagnosis_code,
        progress_note,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        appointment_id,
        patient_id,
        doctor_id,
        diagnosis_code,
        progress_note,
        status ?? "Pending",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Admission Request Sent Successfully",
    });
  } catch (error) {
    console.error("Admission Request Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send admission request",
      },
      {
        status: 500,
      }
    );
  }
}