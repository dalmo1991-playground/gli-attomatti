import { NextRequest, NextResponse } from "next/server";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import { getContent } from "@/lib/data";
import { getMergedTallySubmissions } from "@/lib/tallySubmissions";
import { TallyFormConfig } from "@/types/tally";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAreaRiservataAuthenticated())) {
    return NextResponse.json(
      {
        success: false,
        error: "Accesso non autorizzato. Autenticazione all'Area Riservata richiesta."
      },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const formId = url.searchParams.get("formId")?.trim();
    const bypassCache = url.searchParams.has("refresh");

    const content = await getContent();
    const configuredForms: TallyFormConfig[] = (content?.tally_checkin_forms || []).filter(
      (f: TallyFormConfig) => f && f.enabled !== false && f.id
    );

    if (!formId) {
      return NextResponse.json(
        { success: true, forms: configuredForms },
        { headers: { "Cache-Control": "no-store, must-revalidate" } }
      );
    }

    const targetForm = configuredForms.find((f) => f.id === formId);
    if (!targetForm) {
      return NextResponse.json(
        { success: false, error: "Modulo Tally non trovato o non abilitato." },
        { status: 404 }
      );
    }

    const data = await getMergedTallySubmissions(formId, bypassCache);
    return NextResponse.json(
      { success: true, ...data },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err: unknown) {
    console.error("[API Tally Submissions GET Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || "Errore durante il caricamento delle sottomissioni."
      },
      { status: 500 }
    );
  }
}

