import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { getContent } from "@/lib/data";
import {
  buildTallyDistributionList,
  isTallyApiConfigured,
  TallyCheckinFilter,
  TallyDistributionField
} from "@/lib/tallySubmissions";
import { TallyFormConfig } from "@/types/tally";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status || 401 }
    );
  }

  if (!isTallyApiConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "TALLY_API_KEY non configurata nelle variabili d'ambiente del server."
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const formId = typeof body?.formId === "string" ? body.formId.trim() : "";
    const emailQuestionId =
      typeof body?.emailQuestionId === "string" ? body.emailQuestionId.trim() : "";
    const emailColumnName =
      typeof body?.emailColumnName === "string" ? body.emailColumnName.trim() : "email";
    const checkinFilter: TallyCheckinFilter =
      body?.checkinFilter === "checked_in" || body?.checkinFilter === "not_checked_in"
        ? body.checkinFilter
        : "all";
    const includeCheckinMeta = Boolean(body?.includeCheckinMeta);
    const selectedFields: TallyDistributionField[] = Array.isArray(body?.selectedFields)
      ? body.selectedFields.filter(
          (f: unknown): f is TallyDistributionField =>
            Boolean(f) &&
            typeof (f as TallyDistributionField).questionId === "string" &&
            typeof (f as TallyDistributionField).columnName === "string"
        )
      : [];

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Seleziona un modulo Tally." },
        { status: 400 }
      );
    }

    if (!emailQuestionId) {
      return NextResponse.json(
        { success: false, error: "Seleziona il campo Email del modulo Tally." },
        { status: 400 }
      );
    }

    const content = await getContent();
    const configuredForms: TallyFormConfig[] = Array.isArray(content?.tally_checkin_forms)
      ? content.tally_checkin_forms
      : [];
    const formConfig = configuredForms.find((f) => f && f.id === formId);

    const result = await buildTallyDistributionList({
      formId,
      emailQuestionId,
      emailColumnName,
      selectedFields,
      checkinFilter,
      participantsMode: formConfig?.participantsMode,
      participantsFieldId: formConfig?.participantsFieldId,
      includeCheckinMeta
    });

    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err: unknown) {
    console.error("[Admin Tally Distribution List Error]", err);
    return NextResponse.json(
      {
        success: false,
        error:
          (err as Error)?.message ||
          "Errore durante la generazione della distribution list da Tally."
      },
      { status: 500 }
    );
  }
}
