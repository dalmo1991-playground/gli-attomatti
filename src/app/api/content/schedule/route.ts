import { NextResponse } from "next/server";
import { resolveTargetBranch } from "@/lib/github";
import { constantTimeCompare, getClientIp, checkRateLimit } from "@/lib/security";
import {
  cancelQStashMessage,
  clearScheduledContent,
  enqueueQStashPublish,
  getScheduledContent,
  normalizeSchedulableBranch,
  saveScheduledContent,
  ScheduledContentSummary,
  validatePublishAt
} from "@/lib/scheduledContent";

export const dynamic = "force-dynamic";

function isLocalHost(host: string): boolean {
  const clean = host.split(":")[0].toLowerCase();
  return (
    process.env.NODE_ENV === "development" ||
    clean === "localhost" ||
    clean === "127.0.0.1" ||
    clean === "0.0.0.0"
  );
}

function authorizeAdmin(request: Request): { ok: true } | { ok: false; response: NextResponse } {
  const secret = request.headers.get("x-admin-secret")?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  if (!configuredSecret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ADMIN_SECRET non configurato nelle variabili d'ambiente del server." },
        { status: 500 }
      )
    };
  }

  if (!constantTimeCompare(secret, configuredSecret)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Password non autorizzata. Verifica la chiave inserita." },
        { status: 401 }
      )
    };
  }

  return { ok: true };
}

function toSummary(record: {
  branch: "dev" | "main";
  publishAt: string;
  createdAt: string;
  commitMessage: string;
  qstashMessageId?: string;
}): ScheduledContentSummary {
  return {
    branch: record.branch,
    publishAt: record.publishAt,
    createdAt: record.createdAt,
    commitMessage: record.commitMessage,
    qstashMessageId: record.qstashMessageId
  };
}

export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const branch = normalizeSchedulableBranch(resolveTargetBranch(host));

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json({ scheduled: null, branch });
  }

  try {
    const existing = await getScheduledContent(branch);
    return NextResponse.json(
      {
        branch,
        scheduled: existing ? toSummary(existing) : null
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[Schedule GET] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`content-schedule:${clientIp}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Troppe richieste ravvicinate. Attendi un momento prima di riprovare." },
      { status: 429 }
    );
  }

  const auth = authorizeAdmin(request);
  if (!auth.ok) return auth.response;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  if (isLocalHost(host) || !host) {
    return NextResponse.json(
      { error: "La programmazione è disponibile solo negli ambienti deployati (dev o main), non in localhost." },
      { status: 400 }
    );
  }

  const branch = normalizeSchedulableBranch(resolveTargetBranch(host));

  try {
    const body = await request.json();
    const { content, publishAt, commitMessage } = body || {};

    if (!content || typeof content !== "object" || Array.isArray(content) || Object.keys(content).length < 2) {
      return NextResponse.json(
        { error: "Payload del contenuto non valido. Deve essere un oggetto JSON con le sezioni del sito." },
        { status: 400 }
      );
    }

    const timeCheck = validatePublishAt(String(publishAt || ""));
    if (!timeCheck.ok) {
      return NextResponse.json({ error: timeCheck.error }, { status: 400 });
    }

    // Cancel any existing schedule for this branch before creating the new one
    const existing = await getScheduledContent(branch).catch(() => null);
    if (existing?.qstashMessageId) {
      await cancelQStashMessage(existing.qstashMessageId);
    }

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const callbackUrl = `${proto}://${host}/api/cron/publish-scheduled?branch=${branch}`;

    const qstashMessageId = await enqueueQStashPublish(callbackUrl, timeCheck.iso);
    const cleanMessage =
      typeof commitMessage === "string" && commitMessage.trim()
        ? commitMessage.trim().slice(0, 200)
        : "Aggiornamento programmato da Admin Console";

    const record = {
      branch,
      publishAt: timeCheck.iso,
      createdAt: new Date().toISOString(),
      commitMessage: cleanMessage,
      qstashMessageId,
      content
    };

    await saveScheduledContent(record);

    return NextResponse.json({
      success: true,
      scheduled: toSummary(record)
    });
  } catch (error) {
    console.error("[Schedule POST] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`content-schedule:${clientIp}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Troppe richieste ravvicinate. Attendi un momento prima di riprovare." },
      { status: 429 }
    );
  }

  const auth = authorizeAdmin(request);
  if (!auth.ok) return auth.response;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const branch = normalizeSchedulableBranch(resolveTargetBranch(host));

  try {
    const existing = await getScheduledContent(branch);
    if (existing?.qstashMessageId) {
      await cancelQStashMessage(existing.qstashMessageId);
    }
    await clearScheduledContent(branch);

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    console.error("[Schedule DELETE] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
