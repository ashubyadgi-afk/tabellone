import { NextResponse } from "next/server";
import { getChatbotResponse } from "@/lib/services/ai.service";

export async function POST(request: Request) {
  const { message } = await request.json();
  const reply = getChatbotResponse(message || "");
  return NextResponse.json({ reply });
}
