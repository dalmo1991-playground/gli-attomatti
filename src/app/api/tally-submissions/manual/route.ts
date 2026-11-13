import { NextRequest, NextResponse } from "next/server";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import { getContent } from "@/lib/data";
import {
  addManualCheckinGuest,
  removeManualCheckinGuest
} from "@/lib/tallySubmissions";
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

  try {
    const body = await req.json().catch(() => ({}));
    const formId = typeof body?.formId === "string" ? body.formId.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const participantsCount = Number(body?.participantsCount) || 1;
    const note = typeof body?.note === "string" ? body.note.trim() : undefined;
    const createdBy = typeof body?.createdBy === "string" ? body.createdBy.trim() : undefined;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "ID del modulo Tally mancante." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Il nome dell'ospite è obbligatorio." },
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

    const result = await addManualCheckinGuest(formId, {
      name,
      participantsCount,
      note,
      createdBy
    });

    return NextResponse.json({ success: true, formId, ...result });
  } catch (err: unknown) {
    console.error("[API Tally Manual Guest POST Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || "Errore durante l'aggiunta dell'ospite."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const formId = url.searchParams.get("formId")?.trim() || "";
    const guestId = url.searchParams.get("guestId")?.trim() || "";

    if (!formId || !guestId) {
      return NextResponse.json(
        { success: false, error: "Parametri formId e guestId obbligatori." },
        { status: 400 }
      );
    }

    const result = await removeManualCheckinGuest(formId, guestId);
    return NextResponse.json({ success: true, formId, guestId, ...result });
  } catch (err: unknown) {
    console.error("[API Tally Manual Guest DELETE Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || "Errore durante la rimozione dell'ospite."
      },
      { status: 500 }
    );
  }
}

