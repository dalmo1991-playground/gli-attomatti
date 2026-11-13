import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { fetchTallyFormQuestions, isTallyApiConfigured } from "@/lib/tallySubmissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
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
    const { formId } = await context.params;
    const questions = await fetchTallyFormQuestions(formId);
    return NextResponse.json({ success: true, formId, questions });
  } catch (err: unknown) {
    console.error("[Admin Tally Questions Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || "Errore durante il recupero dei campi Tally."
      },
      { status: 500 }
    );
  }
}

