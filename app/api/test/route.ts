import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query("SELECT NOW()");

    return NextResponse.json({
      success: true,
      databaseTime: result.rows[0]
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      success: false,
      error: "Database connection failed"
    }, { status: 500 });
  }
}