import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  const cleaned = val.trim().replace(/^["']|["']$/g, "").trim();
  return cleaned || undefined;
}

/**
 * Returns a singleton Upstash Redis client if UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured, or null otherwise.
 */
export function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function isRedisConfigured(): boolean {
  return Boolean(
    cleanEnv(process.env.UPSTASH_REDIS_REST_URL) &&
      cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}
