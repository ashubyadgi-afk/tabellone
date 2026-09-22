import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

type NominatimHit = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Tabellone/1.0 (https://tabellone.app; location picker)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: { message: "Place search is unavailable right now." } },
        { status: 502 }
      );
    }

    const results = (await res.json()) as NominatimHit[];
    const items = results
      .filter((hit) => hit.lat && hit.lon && hit.display_name)
      .map((hit) => ({
        displayName: hit.display_name as string,
        lat: Number(hit.lat),
        lng: Number(hit.lon),
      }))
      .filter((hit) => Number.isFinite(hit.lat) && Number.isFinite(hit.lng));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: { message: "Could not search places right now." } },
      { status: 502 }
    );
  }
}
