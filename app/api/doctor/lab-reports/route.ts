import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const appointment_id = searchParams.get("appointment_id");

    if (!appointment_id) {
      return NextResponse.json(
        { message: "Appointment Id Missing" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT
        report_id,
        report_name,
        status,
        file_path,
        uploaded_at,
        remarks,
        report_type

      FROM lab_reports

      WHERE
        appointment_id=$1
        AND status='Completed'

      ORDER BY uploaded_at DESC
      `,
      [appointment_id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Failed" },
      { status: 500 }
    );
  }
}