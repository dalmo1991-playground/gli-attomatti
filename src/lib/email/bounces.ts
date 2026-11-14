import { getRedis } from "@/lib/redis";

export interface ResendBounceRecord {
  id: string;
  email: string;
  subject: string;
  eventType: "email.bounced" | "email.complained";
  reason: string;
  timestamp: string;
  emailId?: string;
}

const PENDING_BOUNCES_KEY = "resend:bounces:pending";
const TTL_30_DAYS_SEC = 30 * 24 * 60 * 60;

/**
 * Stores a Resend bounce/complaint event in Upstash Redis for the next daily summary email.
 */
export async function recordResendBounce(record: ResendBounceRecord): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[Resend Bounce] Upstash Redis non configurato; evento bounce ignorato.");
    return false;
  }

  await redis.rpush(PENDING_BOUNCES_KEY, JSON.stringify(record));
  await redis.expire(PENDING_BOUNCES_KEY, TTL_30_DAYS_SEC);
  return true;
}

/**
 * Lists all pending Resend bounce/complaint events waiting for the daily summary email.
 */
export async function listPendingResendBounces(): Promise<ResendBounceRecord[]> {
  const redis = getRedis();
  if (!redis) return [];

  const rawList = await redis.lrange<unknown>(PENDING_BOUNCES_KEY, 0, -1);
  const parsed: ResendBounceRecord[] = [];

  for (const item of rawList || []) {
    if (typeof item === "string") {
      try {
        parsed.push(JSON.parse(item) as ResendBounceRecord);
      } catch {
        // Ignore malformed entry
      }
    } else if (item && typeof item === "object") {
      parsed.push(item as ResendBounceRecord);
    }
  }

  return parsed;
}

/**
 * Clears pending bounces after the daily summary email has been sent.
 */
export async function clearPendingResendBounces(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(PENDING_BOUNCES_KEY);
}
