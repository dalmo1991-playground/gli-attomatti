import { NextRequest, NextResponse } from "next/server";
import { listFailedEmails, removeFailedEmail, clearAllFailedEmails, enqueueFailedEmail, isBlobStorageAvailable } from "@/lib/email/dlq";

export const dynamic = "force-dynamic";

import { checkAdminAuth } from "@/lib/adminAuth";

/**
 * GET /api/email/queue
 * Returns list of failed emails currently in the Dead Letter Queue.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const items = await listFailedEmails();
    const isBlob = isBlobStorageAvailable();
    return NextResponse.json({
      success: true,
      count: items.length,
      storage: isBlob ? "vercel-blob" : "local-memory",
      blobConfigured: isBlob,
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
    const auth = checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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

/**
 * POST /api/email/queue
 * Simulates or inserts a test failed email record into the DLQ (useful for testing cron alerts).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const recipientEmail = body.email || "test.mario.rossi@example.com";
    const recipientName = body.name || "Mario Rossi (Test DLQ)";
    const subject = body.subject || "Conferma Prenotazione: Spettacolo Gli Attomatti";
    const errorMessage = body.error || "Resend: Daily quota limit of 100 emails exceeded (Code 429)";

    const record = await enqueueFailedEmail({
      recipient: { email: recipientEmail, name: recipientName },
      subject,
      error: {
        message: errorMessage,
        statusCode: 429
      },
      compiledOptions: {
        to: recipientEmail,
        subject,
        html: `<p>Questa è un'email di prova salvata in coda per simulare il superamento del limite giornaliero di Resend.</p>`,
        text: `Questa è un'email di prova salvata in coda per simulare il superamento del limite giornaliero di Resend.`
      },
      originalRequest: {
        body: { simulated: true, simulatedAt: new Date().toISOString() }
      }
    });

    const isBlob = isBlobStorageAvailable();
    return NextResponse.json({
      success: true,
      storage: isBlob ? "vercel-blob" : "local-memory",
      message: isBlob
        ? "Email di simulazione salvata con successo su Vercel Blob!"
        : "Email di simulazione salvata (in memoria locale/fallback).",
      item: record
    });
  } catch (error: any) {
    console.error("[Email Queue POST Exception]", error);
    return NextResponse.json(
      { error: "Errore durante la simulazione dell'email in coda: " + error?.message },
      { status: 500 }
    );
  }
}
