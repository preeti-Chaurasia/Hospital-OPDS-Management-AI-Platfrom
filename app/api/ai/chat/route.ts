import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    // STEP 1 - Gemini se intent lo
    const ai = await chatWithAI(message);

    // STEP 2 - Doctor Availability
    if (ai.intent === "doctor_availability") {
      const specialization = ai.entity || "";

      const doctor = await db.query(
        `SELECT *
         FROM doctors
         WHERE LOWER(specialization) = LOWER($1)
         LIMIT 1`,
        [specialization]
      );

      return NextResponse.json({
        success: true,
        intent: ai.intent,
        language: ai.language,
        doctor: doctor.rows[0] ?? null,
      });
    }

    // baaki intents baad me
    return NextResponse.json({
      success: true,
      data: ai,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Server Error",
      },
      { status: 500 }
    );
  }
}