import { NextRequest, NextResponse } from "next/server";
import {
  parseEventDate,
  generateIcsCalendarContent
} from "@/lib/email/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title") || "Appuntamento - Gli Attomatti";
    const startParam = url.searchParams.get("start") || url.searchParams.get("date") || "";
    const endParam = url.searchParams.get("end") || "";
    const location = url.searchParams.get("location") || "Zurigo, Svizzera";
    const description = url.searchParams.get("description") || url.searchParams.get("desc") || "";

    const startDate = parseEventDate(startParam) || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = parseEventDate(endParam) || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const icsContent = generateIcsCalendarContent({
      title,
      description,
      location,
      startDate,
      endDate
    });

    const filename = `${title.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "evento"}.ics`;

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Errore generazione file calendario: " + error?.message }, { status: 500 });
  }
}
