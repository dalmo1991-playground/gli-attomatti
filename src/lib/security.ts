import crypto from "crypto";
import { NextRequest } from "next/server";

/**
 * Constant-time string comparison using crypto.timingSafeEqual.
 * Protects secret tokens and admin passwords against side-channel timing attacks.
 */
export function constantTimeCompare(a?: string | null, b?: string | null): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const bufA = Buffer.from(a.trim());
  const bufB = Buffer.from(b.trim());

  if (bufA.length === 0 || bufB.length === 0) {
    return false;
  }

  // If lengths differ, compare bufA with itself to prevent timing leak on length before returning false
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extracts the real client IP address from Vercel or reverse-proxy headers.
 */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;

  // Set by Vercel's edge: cannot be forged by the client
  const vercelForwarded = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelForwarded) return vercelForwarded;

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "127.0.0.1";
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for expired rate limit keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000).unref?.();

/**
 * Lightweight in-memory rate limiter per IP or action key.
 *
 * @param key Unique key (e.g. `send-email:192.168.1.1` or `admin-auth:1.2.3.4`)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, existing.resetAt - now)
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetMs: Math.max(0, existing.resetAt - now)
  };
}

/**
 * Verifies the HMAC-SHA256 signature sent by Tally webhooks in the `tally-signature` header.
 */
export function verifyTallySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingSecret: string
): boolean {
  if (!signatureHeader || !signingSecret || !rawBody) {
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac("sha256", signingSecret.trim())
      .update(rawBody)
      .digest("base64");

    return constantTimeCompare(computedSignature, signatureHeader.trim());
  } catch (err) {
    console.error("[Security] Error calculating Tally webhook HMAC signature:", err);
    return false;
  }
}
