import { NextRequest, NextResponse } from "next/server";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import { constantTimeCompare } from "@/lib/security";
import { clearPendingBackupMessageId } from "@/lib/tallyLiveRedis";
import { flushRedisCheckinsToBlob } from "@/lib/tallySubmissions";

export const dynamic = "force-dynamic";

function isCronOrQStashAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization")?.trim();
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && bearerToken && constantTimeCompare(bearerToken, cronSecret)) {
    return true;
  }
  return false;
}

/**
 * POST /api/tally-submissions/flush
 * Flushes live check-ins from Upstash Redis to permanent Vercel Blob (checkins.json).
 * Triggered automatically by QStash after the 30-min check-in window, or manually from the UI.
 */
export async function POST(req: NextRequest) {
  const authorized =
    isCronOrQStashAuthorized(req) || (await isAreaRiservataAuthenticated());

  if (!authorized) {
    return NextResponse.json(
      { success: false, error: "Accesso non autorizzato." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const formId = typeof body?.formId === "string" ? body.formId.trim() : "";
    const force = Boolean(body?.force);

    if (!formId) {
      return NextResponse.json({ success: false, error: "formId mancante." }, { status: 400 });
    }

    const result = await flushRedisCheckinsToBlob(formId, force);
    await clearPendingBackupMessageId(formId).catch(() => {});

    return NextResponse.json({
      success: true,
      formId,
      ...result
    });
  } catch (err: unknown) {
    console.error("[API Tally Flush POST Error]", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Errore durante il salvataggio su Blob." },
      { status: 500 }
    );
  }
}
