import { NextRequest, NextResponse } from "next/server";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import { getContent } from "@/lib/data";
import { isTallyApiConfigured, syncTallyFormToBlob } from "@/lib/tallySubmissions";
import { TallyFormConfig } from "@/types/tally";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAreaRiservataAuthenticated())) {
    return NextResponse.json(
      {
        success: false,
        error: "Accesso non autorizzato. Autenticazione all'Area Riservata richiesta."
      },
      { status: 401 }
    );
  }

  if (!isTallyApiConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "TALLY_API_KEY non configurata sul server. Contatta l'amministratore."
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const formId = typeof body?.formId === "string" ? body.formId.trim() : "";

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "ID del modulo Tally mancante." },
        { status: 400 }
      );
    }

    const content = await getContent();
    const configuredForms: TallyFormConfig[] = content?.tally_checkin_forms || [];
    const targetForm = configuredForms.find((f) => f && f.id === formId && f.enabled !== false);

    if (!targetForm) {
      return NextResponse.json(
        { success: false, error: "Modulo Tally non configurato o non abilitato." },
        { status: 404 }
      );
    }

    const result = await syncTallyFormToBlob(targetForm);
    return NextResponse.json({ success: true, formId, ...result });
  } catch (err: unknown) {
    console.error("[API Tally Sync Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || "Errore durante la sincronizzazione con Tally."
      },
      { status: 500 }
    );
  }
}

