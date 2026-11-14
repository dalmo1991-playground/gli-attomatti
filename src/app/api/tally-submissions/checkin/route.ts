import { NextRequest, NextResponse } from "next/server";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import { getContent } from "@/lib/data";
import { applyCheckinBatch } from "@/lib/tallySubmissions";
import { CheckinBatchItem, TallyFormConfig } from "@/types/tally";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
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
    const body = await req.json().catch(() => ({}));
    const formId = typeof body?.formId === "string" ? body.formId.trim() : "";
    const changes: CheckinBatchItem[] = Array.isArray(body?.changes) ? body.changes : [];
    const liveMode = Boolean(body?.liveMode);

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "ID del modulo Tally mancante." },
        { status: 400 }
      );
    }

    if (changes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nessuna modifica di check-in da sincronizzare." },
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

    const result = await applyCheckinBatch(formId, changes, liveMode);
    return NextResponse.json({ success: true, formId, ...result });
  } catch (err: unknown) {
    console.error("[API Tally Checkin PATCH Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || "Errore durante il salvataggio dei check-in."
      },
      { status: 500 }
    );
  }
}

