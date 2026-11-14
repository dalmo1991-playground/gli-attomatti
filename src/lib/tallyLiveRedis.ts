import { getRedis } from "@/lib/redis";
import { CheckinBatchItem, CheckinRecord } from "@/types/tally";

const TTL_14_DAYS_SEC = 14 * 24 * 60 * 60; // 14 days safety retention in Redis
const DIRTY_SET_KEY = "checkin:dirty";

function countsKey(formId: string) {
  return `checkin:counts:${formId}`;
}
function metaKey(formId: string) {
  return `checkin:meta:${formId}`;
}
function seededKey(formId: string) {
  return `checkin:seeded:${formId}`;
}
function verKey(formId: string) {
  return `checkin:ver:${formId}`;
}
function backupMsgKey(formId: string) {
  return `checkin:backup-msg:${formId}`;
}

/**
 * Seeds Redis with the permanent Blob checkins map if Redis doesn't have it yet.
 */
export async function ensureRedisSeeded(
  formId: string,
  blobCheckins: Record<string, CheckinRecord>
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const exists = await redis.exists(seededKey(formId));
  if (exists === 1) {
    return true;
  }

  const pipe = redis.pipeline();
  const entries = Object.entries(blobCheckins || {});
  if (entries.length > 0) {
    const countsObj: Record<string, number> = {};
    const metaObj: Record<string, string> = {};
    for (const [subId, rec] of entries) {
      const count =
        typeof rec.checkedInCount === "number"
          ? Math.max(0, rec.checkedInCount)
          : rec.checkedIn
            ? 1
            : 0;
      countsObj[subId] = count;
      metaObj[subId] = JSON.stringify({
        updatedAt: rec.updatedAt || new Date().toISOString(),
        ...(rec.checkedInBy ? { checkedInBy: rec.checkedInBy } : {})
      });
    }
    pipe.hset(countsKey(formId), countsObj);
    pipe.hset(metaKey(formId), metaObj);
    pipe.expire(countsKey(formId), TTL_14_DAYS_SEC);
    pipe.expire(metaKey(formId), TTL_14_DAYS_SEC);
  }

  pipe.set(seededKey(formId), "1", { ex: TTL_14_DAYS_SEC });
  pipe.setnx(verKey(formId), 1);
  pipe.expire(verKey(formId), TTL_14_DAYS_SEC);
  await pipe.exec();
  return true;
}

/**
 * Reads all live check-in records from Redis for a given formId.
 * Returns null if Redis is not configured or not yet seeded for this form.
 */
export async function getRedisCheckins(
  formId: string
): Promise<{ ver: number; checkins: Record<string, CheckinRecord> } | null> {
  const redis = getRedis();
  if (!redis) return null;

  const isSeeded = await redis.exists(seededKey(formId));
  if (isSeeded !== 1) return null;

  const [verRaw, countsRaw, metaRaw] = await Promise.all([
    redis.get<number>(verKey(formId)),
    redis.hgetall<Record<string, number | string>>(countsKey(formId)),
    redis.hgetall<Record<string, unknown>>(metaKey(formId))
  ]);

  const checkins: Record<string, CheckinRecord> = {};
  const allIds = new Set([
    ...Object.keys(countsRaw || {}),
    ...Object.keys(metaRaw || {})
  ]);

  for (const subId of allIds) {
    const rawCount = countsRaw?.[subId];
    const count = Math.max(0, Number(rawCount ?? 0) || 0);
    let parsedMeta: { updatedAt?: string; checkedInBy?: string } = {};
    const rawMeta = metaRaw?.[subId];
    if (typeof rawMeta === "string") {
      try {
        parsedMeta = JSON.parse(rawMeta);
      } catch {
        parsedMeta = {};
      }
    } else if (rawMeta && typeof rawMeta === "object") {
      parsedMeta = rawMeta as { updatedAt?: string; checkedInBy?: string };
    }

    checkins[subId] = {
      checkedIn: count > 0,
      checkedInCount: count,
      updatedAt: parsedMeta.updatedAt || new Date().toISOString(),
      ...(parsedMeta.checkedInBy ? { checkedInBy: parsedMeta.checkedInBy } : {})
    };
  }

  return {
    ver: Number(verRaw) || 1,
    checkins
  };
}

/**
 * Lightweight version check for 5s polling. Returns null if Redis is unavailable.
 */
export async function getRedisCheckinVersion(formId: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  const ver = await redis.get<number>(verKey(formId));
  return ver !== null && ver !== undefined ? Number(ver) : null;
}

// Atomic Lua script: applies delta (clamped to [0, maxCount]) or absolute value,
// updates metadata, bumps version, marks form dirty, and refreshes 14-day TTL.
const APPLY_DELTA_LUA = `
local cKey = KEYS[1]
local mKey = KEYS[2]
local vKey = KEYS[3]
local dirtyKey = KEYS[4]
local subId = ARGV[1]
local mode = ARGV[2]
local val = tonumber(ARGV[3])
local maxCount = tonumber(ARGV[4])
local metaJson = ARGV[5]
local formId = ARGV[6]
local ttl = tonumber(ARGV[7])

local nextCount = 0
if mode == "delta" then
  local cur = tonumber(redis.call("HGET", cKey, subId) or "0")
  nextCount = cur + val
  if nextCount < 0 then nextCount = 0 end
  if maxCount > 0 and nextCount > maxCount then nextCount = maxCount end
else
  nextCount = val
  if nextCount < 0 then nextCount = 0 end
  if maxCount > 0 and nextCount > maxCount then nextCount = maxCount end
end

redis.call("HSET", cKey, subId, nextCount)
redis.call("HSET", mKey, subId, metaJson)
redis.call("EXPIRE", cKey, ttl)
redis.call("EXPIRE", mKey, ttl)
local newVer = redis.call("INCR", vKey)
redis.call("EXPIRE", vKey, ttl)
redis.call("SADD", dirtyKey, formId)
return { nextCount, newVer }
`;

/**
 * Applies a batch of check-in updates atomically in Upstash Redis.
 */
export async function applyRedisCheckinBatch(
  formId: string,
  changes: CheckinBatchItem[],
  blobCheckins: Record<string, CheckinRecord>
): Promise<{ appliedCount: number; ver: number; updatedAt: string }> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Upstash Redis non configurato.");
  }

  await ensureRedisSeeded(formId, blobCheckins);

  let appliedCount = 0;
  let latestVer = 1;
  const nowIso = new Date().toISOString();

  for (const item of changes) {
    if (!item?.submissionId) continue;
    const upperBound = Math.max(1, item.maxCount || 99);
    const metaJson = JSON.stringify({
      updatedAt: item.updatedAt || nowIso,
      ...(item.checkedInBy ? { checkedInBy: item.checkedInBy } : {})
    });

    const isDelta = typeof item.delta === "number";
    const mode = isDelta ? "delta" : "set";
    const val = isDelta
      ? item.delta!
      : typeof item.checkedInCount === "number"
        ? item.checkedInCount
        : item.checkedIn
          ? upperBound
          : 0;

    const res = (await redis.eval(
      APPLY_DELTA_LUA,
      [countsKey(formId), metaKey(formId), verKey(formId), DIRTY_SET_KEY],
      [item.submissionId, mode, String(val), String(upperBound), metaJson, formId, String(TTL_14_DAYS_SEC)]
    )) as [number, number];

    latestVer = Number(res?.[1]) || latestVer;
    appliedCount += 1;
  }

  // Refresh seeded TTL
  await redis.expire(seededKey(formId), TTL_14_DAYS_SEC);

  return {
    appliedCount,
    ver: latestVer,
    updatedAt: nowIso
  };
}

export async function isFormDirtyInRedis(formId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const res = await redis.sismember(DIRTY_SET_KEY, formId);
  return res === 1;
}

export async function clearFormDirtyInRedis(formId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.srem(DIRTY_SET_KEY, formId);
}

export async function getPendingBackupMessageId(formId: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const msgId = await redis.get<string>(backupMsgKey(formId));
  return msgId || null;
}

export async function setPendingBackupMessageId(formId: string, messageId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(backupMsgKey(formId), messageId, { ex: 3600 });
}

export async function clearPendingBackupMessageId(formId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(backupMsgKey(formId));
}
