import { NextResponse } from "next/server";
import { aiSearchAdSpaces } from "@/lib/services/ai.service";

export async function POST(request: Request) {
  const { query } = await request.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const result = await aiSearchAdSpaces(query);
  return NextResponse.json(result);
}
