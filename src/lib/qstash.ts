/**
 * Lightweight Upstash QStash REST helper for delayed background callbacks.
 */

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  const cleaned = val.trim().replace(/^["']|["']$/g, "").trim();
  return cleaned || undefined;
}

export function isQStashConfigured(): boolean {
  return Boolean(cleanEnv(process.env.QSTASH_TOKEN) && cleanEnv(process.env.CRON_SECRET));
}

export async function enqueueQStashDelayed(options: {
  callbackUrl: string;
  delaySeconds: number;
  body?: Record<string, unknown>;
  retries?: number;
}): Promise<string> {
  const token = cleanEnv(process.env.QSTASH_TOKEN);
  const cronSecret = cleanEnv(process.env.CRON_SECRET);
  const baseUrl = (cleanEnv(process.env.QSTASH_URL) || "https://qstash.upstash.io").replace(/\/$/, "");

  if (!token) {
    throw new Error("QSTASH_TOKEN non configurato nelle variabili d'ambiente del server.");
  }
  if (!cronSecret) {
    throw new Error("CRON_SECRET non configurato nelle variabili d'ambiente del server.");
  }

  const delay = Math.max(1, Math.round(options.delaySeconds));
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Upstash-Delay": `${delay}s`,
    "Upstash-Forward-Authorization": `Bearer ${cronSecret}`
  };

  if (typeof options.retries === "number") {
    headers["Upstash-Retries"] = String(Math.max(0, options.retries));
  }

  const bypassSecret = cleanEnv(process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  if (bypassSecret) {
    headers["Upstash-Forward-x-vercel-protection-bypass"] = bypassSecret;
  }

  const res = await fetch(`${baseUrl}/v2/publish/${options.callbackUrl}`, {
    method: "POST",
    headers,
    body: JSON.stringify(options.body || {})
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

export async function cancelQStashMessage(messageId?: string | null): Promise<void> {
  if (!messageId) return;
  const token = cleanEnv(process.env.QSTASH_TOKEN);
  if (!token) return;
  const baseUrl = (cleanEnv(process.env.QSTASH_URL) || "https://qstash.upstash.io").replace(/\/$/, "");

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
