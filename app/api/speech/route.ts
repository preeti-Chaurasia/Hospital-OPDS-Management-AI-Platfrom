import { NextRequest, NextResponse } from "next/server";
import { speakAzure } from "@/lib/azureSpeech";

export async function POST(req: NextRequest) {

  const { text, language } = await req.json();

  const audio = await speakAzure(text, language);

  return new NextResponse(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}