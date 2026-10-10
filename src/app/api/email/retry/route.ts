import { NextRequest, NextResponse } from "next/server";
import {
  listFailedEmails,
  getFailedEmail,
  removeFailedEmail,
  updateFailedEmailAttempt,
  FailedEmailRecord
} from "@/lib/email/dlq";
import { sendTransactionalEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

import { checkAdminAuth } from "@/lib/adminAuth";

/**
 * Retries a single failed email record.
 */
async function retrySingleRecord(record: FailedEmailRecord) {
  try {
    const sendResult = await sendTransactionalEmail(record.compiledOptions);

    if (sendResult.success) {
      // Successfully sent! Remove from DLQ
      await removeFailedEmail(record.id);
      return {
        id: record.id,
        recipient: record.recipient.email,
        success: true,
        emailId: sendResult.id,
        simulated: sendResult.simulated || false
      };
    } else {
      // Failed again, update attempt count and error
      const updated = await updateFailedEmailAttempt(record.id, {
        message: sendResult.error || "Errore sconosciuto durante il re-invio"
      });
      return {
        id: record.id,
        recipient: record.recipient.email,
        success: false,
        attempts: updated?.attempts || record.attempts + 1,
        error: sendResult.error || "Errore durante il re-invio"
      };
    }
  } catch (err: any) {
    const updated = await updateFailedEmailAttempt(record.id, {
      message: err?.message || "Eccezione durante il re-invio"
    });
    return {
      id: record.id,
      recipient: record.recipient.email,
      success: false,
      attempts: updated?.attempts || record.attempts + 1,
      error: err?.message || "Eccezione durante il re-invio"
    };
  }
}

/**
 * POST /api/email/retry
 * Retries a specific failed email or all emails currently in the DLQ.
 * Body: { id?: string; all?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const url = new URL(req.url);
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const targetId = body.id || url.searchParams.get("id");
    const retryAll = Boolean(body.all || url.searchParams.get("all") === "true");

    // 1. Single email retry
    if (targetId) {
      const record = await getFailedEmail(targetId);
      if (!record) {
        return NextResponse.json(
          { error: `Nessuna email trovata in coda con ID: ${targetId}` },
          { status: 404 }
        );
      }

      const result = await retrySingleRecord(record);
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? "Email reinviata con successo e rimossa dalla coda"
          : `Re-invio fallito: ${result.error}`,
        result
      });
    }

    // 2. Retry all emails in DLQ
    if (retryAll) {
      const items = await listFailedEmails();
      if (items.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Nessuna email in attesa nella coda",
          processed: 0,
          succeeded: 0,
          failed: 0,
          results: []
        });
      }

      const results = [];
      let succeeded = 0;
      let failed = 0;

      // Process with slight delay to respect Resend rate limits (e.g. 2 req/sec)
      for (const item of items) {
        const res = await retrySingleRecord(item);
        results.push(res);
        if (res.success) {
          succeeded++;
        } else {
          failed++;
        }
        // Small 300ms pause between requests to prevent bursting rate limits
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      return NextResponse.json({
        success: failed === 0,
        message: `Elaborate ${items.length} email: ${succeeded} inviate con successo, ${failed} ancora in errore`,
        processed: items.length,
        succeeded,
        failed,
        results
      });
    }

    return NextResponse.json(
      { error: "Specifica 'id' dell'email oppure 'all: true' per ritriggerare la coda." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Email Retry API Exception]", error);
    return NextResponse.json(
      { error: "Errore interno durante il re-invio: " + error?.message },
      { status: 500 }
    );
  }
}
