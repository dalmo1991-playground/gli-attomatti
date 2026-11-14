import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { commitToGitHub, resolveTargetBranch } from "@/lib/github";
import { constantTimeCompare } from "@/lib/security";
import {
  clearScheduledContent,
  getScheduledContent,
  normalizeSchedulableBranch
} from "@/lib/scheduledContent";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization")?.trim();
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  const adminSecretHeader = req.headers.get("x-admin-secret")?.trim();

  const cronSecret = process.env.CRON_SECRET?.trim();
  const adminSecret = process.env.ADMIN_SECRET?.trim();

  if (cronSecret && bearerToken && constantTimeCompare(bearerToken, cronSecret)) {
    return true;
  }

  if (adminSecret) {
    if (adminSecretHeader && constantTimeCompare(adminSecretHeader, adminSecret)) return true;
    if (bearerToken && constantTimeCompare(bearerToken, adminSecret)) return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handlePublishScheduled(req);
}

export async function POST(req: NextRequest) {
  return handlePublishScheduled(req);
}

async function handlePublishScheduled(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Non autorizzato. Fornisci un CRON_SECRET o ADMIN_SECRET valido." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const requestedBranch = url.searchParams.get("branch");
  const branch = normalizeSchedulableBranch(requestedBranch || resolveTargetBranch(host));

  try {
    const record = await getScheduledContent(branch);
    if (!record) {
      return NextResponse.json({
        success: true,
        skipped: true,
        branch,
        reason: "Nessuna pubblicazione programmata trovata."
      });
    }

    // 10s tolerance for minor clock skew between QStash and Vercel
    const scheduledMs = new Date(record.publishAt).getTime();
    if (Date.now() < scheduledMs - 10_000) {
      return NextResponse.json({
        success: true,
        skipped: true,
        branch,
        publishAt: record.publishAt,
        reason: "Orario di pubblicazione non ancora raggiunto."
      });
    }

    const commitResult = await commitToGitHub({
      path: "src/data/content.json",
      content: JSON.stringify(record.content, null, 2),
      message: record.commitMessage || "Aggiornamento programmato da Admin Console",
      branch: record.branch,
      isBinary: false
    });

    await clearScheduledContent(record.branch);
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      branch: commitResult.branch,
      commitSha: commitResult.commitSha,
      shortSha: commitResult.shortSha,
      commitUrl: commitResult.commitUrl
    });
  } catch (error) {
    console.error("[Publish Scheduled] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
