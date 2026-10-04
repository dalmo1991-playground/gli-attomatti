import { NextRequest, NextResponse } from "next/server";
import { listFailedEmails, removeFailedEmail, clearAllFailedEmails } from "@/lib/email/dlq";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const url = new URL(req.url);
  const secret =
    req.headers.get("x-admin-secret")?.trim() ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    url.searchParams.get("secret")?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim() || process.env.EMAIL_API_SECRET?.trim();

  if (!configuredSecret) {
    // In dev without secret configured, allow access
    return process.env.NODE_ENV !== "production";
  }

  return secret === configuredSecret;
}

/**
 * GET /api/email/queue
 * Returns list of failed emails currently in the Dead Letter Queue.
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const items = await listFailedEmails();
    return NextResponse.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error: any) {
    console.error("[Email Queue API Exception]", error);
    return NextResponse.json(
      { error: "Errore durante il recupero della coda: " + error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/queue?id=... (or ?all=true)
 * Discards a failed email from the queue.
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const url = new URL(req.url);
    const clearAll = url.searchParams.get("all") === "true";
    const id = url.searchParams.get("id");

    if (clearAll) {
      const removedCount = await clearAllFailedEmails();
      return NextResponse.json({
        success: true,
        message: `Svuotata l'intera coda (${removedCount} email rimosse)`
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Specifica il parametro ?id=... oppure ?all=true" },
        { status: 400 }
      );
    }

    const removed = await removeFailedEmail(id);
    return NextResponse.json({
      success: removed,
      message: removed ? `Email ${id} rimossa dalla coda` : `Email ${id} non trovata nella coda`
    });
  } catch (error: any) {
    console.error("[Email Queue Delete Exception]", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione: " + error?.message },
      { status: 500 }
    );
  }
}
