import crypto from "crypto";
import { get, put, del, list } from "@vercel/blob";
import { checkRateLimit } from "./security";

function getBlobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

/**
 * Checks if an IP that failed reCAPTCHA (or had low score) has already submitted
 * a request in the last 24 hours.
 *
 * Persisted on Vercel Blob with an in-memory fast check.
 * IP address is hashed with SHA-256 to protect user privacy (nLPD).
 */
export async function checkUntrustedDailyIpLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterHours?: number }> {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // 1. Fast in-memory check (catches warm-instance spam instantly with zero latency)
  const memCheck = checkRateLimit(`untrusted-daily:${ip}`, 1, ONE_DAY_MS);
  if (!memCheck.allowed) {
    const hoursLeft = Math.ceil(memCheck.resetMs / (60 * 60 * 1000));
    return { allowed: false, retryAfterHours: hoursLeft };
  }

  // 2. Cross-instance persistent check via Vercel Blob (catches cold-starts and VM scaling)
  const token = getBlobToken();
  if (!token) {
    // If Blob storage token is not configured, fall back gracefully to the in-memory check
    return { allowed: true };
  }

  const ipHash = crypto.createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32);
  const pathname = `rate-limit/untrusted-ip/${ipHash}.json`;

  try {
    const blobRes = await get(pathname, { access: "private", token, useCache: false });
    if (blobRes && blobRes.statusCode === 200 && blobRes.stream) {
      const text = await new Response(blobRes.stream).text();
      const parsed = JSON.parse(text);
      const lastSeen = Number(parsed.timestamp) || 0;
      const elapsed = now - lastSeen;

      if (elapsed < ONE_DAY_MS) {
        const hoursLeft = Math.max(1, Math.ceil((ONE_DAY_MS - elapsed) / (60 * 60 * 1000)));
        return { allowed: false, retryAfterHours: hoursLeft };
      }
    }
  } catch (err: any) {
    // Ignore 404 (file does not exist yet)
  }

  // Record this untrusted submission timestamp so all other serverless instances will know
  try {
    await put(
      pathname,
      JSON.stringify({ timestamp: now, date: new Date().toISOString() }),
      { access: "private", token, addRandomSuffix: false }
    );
  } catch (putErr) {
    console.warn("[RateLimit Blob Warning] Failed to persist untrusted IP timestamp:", putErr);
  }

  return { allowed: true };
}
