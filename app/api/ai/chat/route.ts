import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/ai";
import { smartChat } from "@/lib/chatbot";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { message, selectedLanguage } = await req.json();

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    const ai = await chatWithAI(message, selectedLanguage);

    console.log("AI OUTPUT:", ai);

    
    // Doctor Availability
  
    if (ai.intent === "doctor_availability") {

      const doctor = await db.query(
        `
        SELECT *
        FROM doctors
        WHERE LOWER(specialization)=LOWER($1)
        LIMIT 1
        `,
        [ai.entity]
      );

      return NextResponse.json({
        success: true,
        intent: ai.intent,
        language: ai.language,
        doctor: doctor.rows[0] || null,
        reply: doctor.rows.length
          ? `${doctor.rows[0].full_name} is available. Cabin ${doctor.rows[0].cabin_number}, ${doctor.rows[0].floor} Floor. Current Queue: ${doctor.rows[0].current_queue}.`
          : "Sorry, no doctor is available.",
      });
    }

    
    // Department Location
    
    if (ai.intent === "department_location") {

      const department = await db.query(
        `
        SELECT
          specialization,
          cabin_number,
          floor
        FROM doctors
        WHERE LOWER(specialization)=LOWER($1)
        LIMIT 1
        `,
        [ai.entity]
      );

      return NextResponse.json({
        success: true,
        intent: ai.intent,
        language: ai.language,
        department: department.rows[0] || null,
        reply: department.rows.length
          ? `${department.rows[0].specialization} Department is located at Cabin ${department.rows[0].cabin_number}, ${department.rows[0].floor} Floor.`
          : "Sorry, department not found.",
      });
    }

    
    // Registration
    
    if (ai.intent === "registration") {

      return NextResponse.json({
        success: true,
        intent: ai.intent,
        language: ai.language,
        registration: ai.registration,
        reply: "Your registration details have been captured successfully.",
      });
    }

  
    // Queue Status
   
    if (ai.intent === "queue_status") {

      return NextResponse.json({
        success: true,
        intent: ai.intent,
        language: ai.language,
        reply: "Current estimated waiting time is around 20 minutes.",
      });
    }

    if (ai.intent === "hospital_faq") {

  const reply = await smartChat(message);

  return NextResponse.json({
    success: true,
    intent: ai.intent,
    language: ai.language,
    reply,
  });

}

    if (ai.intent === "prescription_explain") {

  const reply = await smartChat(message);

  return NextResponse.json({
    success: true,
    intent: ai.intent,
    language: ai.language,
    reply,
  });

}

   if (ai.intent === "general_chat") {

  const reply = await smartChat(message);

  return NextResponse.json({
    success: true,
    intent: ai.intent,
    language: ai.language,
    reply,
  });

}

return NextResponse.json({
  success: true,
  intent: ai.intent,
  language: ai.language,
  reply: "I couldn't understand your request.",
});

  } catch (error) {

    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}