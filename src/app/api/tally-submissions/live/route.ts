import { NextRequest, NextResponse } from "next/server";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import { isRedisConfigured } from "@/lib/redis";
import {
  getPendingBackupMessageId,
  getRedisCheckins,
  getRedisCheckinVersion,
  setPendingBackupMessageId
} from "@/lib/tallyLiveRedis";
import { activateRedisLiveSession } from "@/lib/tallySubmissions";
import { cancelQStashMessage, enqueueQStashDelayed, isQStashConfigured } from "@/lib/qstash";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

function resolveBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || SITE_URL || "https://gliattomatti.ch").replace(/\/$/, "");
}

/**
 * GET /api/tally-submissions/live?formId=...&ver=...
 * Lightweight 5s poll endpoint for Live Check-In Mode.
 */
export async function GET(req: NextRequest) {
  if (!(await isAreaRiservataAuthenticated())) {
    return NextResponse.json(
      { success: false, error: "Accesso non autorizzato." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const formId = url.searchParams.get("formId")?.trim() || "";
  const clientVerRaw = url.searchParams.get("ver");
  const clientVer = clientVerRaw !== null ? Number(clientVerRaw) : null;

  if (!formId) {
    return NextResponse.json({ success: false, error: "formId mancante." }, { status: 400 });
  }

  if (!isRedisConfigured()) {
    return NextResponse.json(
      { success: true, redisEnabled: false, changed: false },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }

  try {
    const currentVer = await getRedisCheckinVersion(formId);
    if (currentVer !== null && clientVer !== null && currentVer === clientVer) {
      return NextResponse.json(
        { success: true, redisEnabled: true, changed: false, ver: currentVer },
        { headers: { "Cache-Control": "no-store, must-revalidate" } }
      );
    }

    const live = await getRedisCheckins(formId);
    if (!live) {
      return NextResponse.json(
        { success: true, redisEnabled: true, changed: false, ver: currentVer ?? 0 },
        { headers: { "Cache-Control": "no-store, must-revalidate" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        redisEnabled: true,
        changed: true,
        ver: live.ver,
        checkins: live.checkins
      },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err: unknown) {
    console.error("[API Tally Live GET Error]", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Errore lettura live Redis." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tally-submissions/live
 * Activates (or renews) a 30-min Live Check-In session and schedules a QStash
 * delayed backup flush to Vercel Blob (+35 minutes).
 */
export async function POST(req: NextRequest) {
  if (!(await isAreaRiservataAuthenticated())) {
    return NextResponse.json(
      { success: false, error: "Accesso non autorizzato." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const formId = typeof body?.formId === "string" ? body.formId.trim() : "";
    if (!formId) {
      return NextResponse.json({ success: false, error: "formId mancante." }, { status: 400 });
    }

    const redisEnabled = isRedisConfigured();
    if (redisEnabled) {
      await activateRedisLiveSession(formId);
    }

    let backupScheduled = false;
    const baseUrl = resolveBaseUrl(req);
    const isLocal = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

    if (redisEnabled && isQStashConfigured() && !isLocal) {
      try {
        const prevMsgId = await getPendingBackupMessageId(formId);
        if (prevMsgId) {
          await cancelQStashMessage(prevMsgId);
        }

        const msgId = await enqueueQStashDelayed({
          callbackUrl: `${baseUrl}/api/tally-submissions/flush`,
          delaySeconds: 35 * 60, // 35 min (right after the 30-min check-in window)
          body: { formId },
          retries: 2
        });
        await setPendingBackupMessageId(formId, msgId);
        backupScheduled = true;
      } catch (qErr) {
        console.warn("[Live Check-In QStash Warning] Impossibile programmare il backup:", qErr);
      }
    }

    return NextResponse.json({
      success: true,
      redisEnabled,
      backupScheduled,
      backupDelayMinutes: 35
    });
  } catch (err: unknown) {
    console.error("[API Tally Live POST Error]", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Errore attivazione modalità live." },
      { status: 500 }
    );
  }
}
