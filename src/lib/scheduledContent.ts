/**
 * Scheduled content.json persistence & Upstash QStash integration.
 * Stores one pending snapshot per branch ("dev" | "main") in Vercel Blob
 * and schedules a one-shot delayed callback via Upstash QStash.
 */

import { put, del, get } from "@vercel/blob";

export type SchedulableBranch = "dev" | "main";

export interface ScheduledContentRecord {
  branch: SchedulableBranch;
  publishAt: string; // ISO 8601 UTC string
  createdAt: string; // ISO 8601 UTC string
  commitMessage: string;
  qstashMessageId?: string;
  content: Record<string, unknown>;
}

export interface ScheduledContentSummary {
  branch: SchedulableBranch;
  publishAt: string;
  createdAt: string;
  commitMessage: string;
  qstashMessageId?: string;
}

const MAX_DELAY_MS = 7 * 24 * 60 * 60 * 1000; // Upstash QStash Free tier limit (7 days)

function getBlobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

function getBlobPathname(branch: SchedulableBranch): string {
  return `scheduled-content/${branch}.json`;
}

export function normalizeSchedulableBranch(branch: string): SchedulableBranch {
  return branch === "main" ? "main" : "dev";
}

export function validatePublishAt(publishAtRaw: string): { ok: true; iso: string } | { ok: false; error: string } {
  const date = new Date(publishAtRaw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Data e ora di pubblicazione non valide." };
  }

  const now = Date.now();
  const targetMs = date.getTime();
  if (targetMs <= now + 30_000) {
    return { ok: false, error: "La data programmata deve essere almeno 1 minuto nel futuro." };
  }
  if (targetMs > now + MAX_DELAY_MS) {
    return { ok: false, error: "La programmazione può essere impostata al massimo 7 giorni nel futuro (limite piano gratuito QStash)." };
  }

  return { ok: true, iso: date.toISOString() };
}

export async function getScheduledContent(branch: SchedulableBranch): Promise<ScheduledContentRecord | null> {
  const token = getBlobToken();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN non configurato sul server.");
  }

  const pathname = getBlobPathname(branch);
  try {
    const res = await get(pathname, { access: "private", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      const text = await new Response(res.stream).text();
      return JSON.parse(text) as ScheduledContentRecord;
    }
  } catch {
    // Blob does not exist yet
  }
  return null;
}

export async function saveScheduledContent(record: ScheduledContentRecord): Promise<void> {
  const token = getBlobToken();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN non configurato sul server.");
  }

  await put(getBlobPathname(record.branch), JSON.stringify(record), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token
  });
}

export async function clearScheduledContent(branch: SchedulableBranch): Promise<void> {
  const token = getBlobToken();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN non configurato sul server.");
  }

  try {
    await del(getBlobPathname(branch), { token });
  } catch {
    // Ignore if already deleted
  }
}

function getQStashConfig(): { baseUrl: string; token: string; cronSecret: string } {
  const token = process.env.QSTASH_TOKEN?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const baseUrl = (process.env.QSTASH_URL?.trim() || "https://qstash.upstash.io").replace(/\/$/, "");

  if (!token) {
    throw new Error("QSTASH_TOKEN non configurato nelle variabili d'ambiente del server.");
  }
  if (!cronSecret) {
    throw new Error("CRON_SECRET non configurato nelle variabili d'ambiente del server.");
  }

  return { baseUrl, token, cronSecret };
}

export async function enqueueQStashPublish(callbackUrl: string, publishAtIso: string): Promise<string> {
  const { baseUrl, token, cronSecret } = getQStashConfig();
  const notBeforeUnix = Math.floor(new Date(publishAtIso).getTime() / 1000);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Upstash-Not-Before": String(notBeforeUnix),
    "Upstash-Forward-Authorization": `Bearer ${cronSecret}`
  };

  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (bypassSecret) {
    headers["Upstash-Forward-x-vercel-protection-bypass"] = bypassSecret;
  }

  const res = await fetch(`${baseUrl}/v2/publish/${callbackUrl}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scheduledAt: publishAtIso })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Errore Upstash QStash (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { messageId?: string };
  if (!data.messageId) {
    throw new Error("Upstash QStash non ha restituito un messageId valido.");
  }
  return data.messageId;
}

export async function cancelQStashMessage(messageId?: string): Promise<void> {
  if (!messageId) return;
  const token = process.env.QSTASH_TOKEN?.trim();
  if (!token) return;
  const baseUrl = (process.env.QSTASH_URL?.trim() || "https://qstash.upstash.io").replace(/\/$/, "");

  const res = await fetch(`${baseUrl}/v2/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text().catch(() => res.statusText);
    console.warn(`[QStash] Impossibile annullare il messaggio ${messageId}: ${errText}`);
  }
}
