import { put, list, get, del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import {
  AbsenceRecord,
  MemberAbsenceFile,
  AbsenceResponseData,
  DEFAULT_MEMBERS,
  memberNameToSlug
} from "@/types/absence";

export { DEFAULT_MEMBERS, memberNameToSlug };

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DIR = isVercel
  ? path.join("/tmp", ".data", "assenze")
  : path.join(process.cwd(), ".data", "assenze");

const SNAPSHOT_KEY = "assenze/all.json";
const LOCAL_SNAPSHOT_FILE = path.join(LOCAL_DIR, "all.json");

function getBlobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

export function isBlobStorageAvailable(): boolean {
  return Boolean(getBlobToken());
}

// In-memory cache for aggregated absences (60 seconds TTL)
let absencesMemoryCache: {
  data: AbsenceResponseData;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000;

export function invalidateAbsencesCache() {
  absencesMemoryCache = null;
}

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
}

function getLocalFilePath(slug: string): string {
  return path.join(LOCAL_DIR, `${slug}.json`);
}

/**
 * Writes a file to Vercel Blob with automatic fallback between public and private access.
 */
async function putBlobFile(
  pathname: string,
  content: string,
  token: string
): Promise<void> {
  try {
    await put(pathname, content, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      token
    });
  } catch (err: any) {
    const msg = String(err?.message || "").toLowerCase();
    // If the Blob store is configured as private, retry with access: 'private'
    if (
      msg.includes("private") ||
      msg.includes("access") ||
      msg.includes("forbidden") ||
      msg.includes("not allowed")
    ) {
      await put(pathname, content, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });
      return;
    }
    throw err;
  }
}

/**
 * Reads directly from a Vercel Blob pathname or URL.
 * Strongly consistent: does not rely on list().
 */
async function getBlobText(pathnameOrUrl: string, token: string): Promise<string | null> {
  // 1. Try get() with public
  try {
    const res = await get(pathnameOrUrl, { access: "public", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      return await new Response(res.stream).text();
    }
  } catch { }

  // 2. Try get() with private
  try {
    const res = await get(pathnameOrUrl, { access: "private", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      return await new Response(res.stream).text();
    }
  } catch { }

  return null;
}

/**
 * Reads absences for a single member from Vercel Blob or local file.
 */
export async function getMemberAbsences(memberName: string): Promise<AbsenceRecord[]> {
  const slug = memberNameToSlug(memberName);
  if (!slug) return [];

  const token = getBlobToken();

  if (token) {
    try {
      const pathname = `assenze/${slug}.json`;
      const text = await getBlobText(pathname, token);
      if (text) {
        const data = JSON.parse(text) as MemberAbsenceFile;
        return data?.absences || [];
      }
      return [];
    } catch (err) {
      console.error(`[Blob Read Error for ${memberName}]`, err);
    }
  }

  // Local file fallback
  try {
    ensureLocalDir();
    const filePath = getLocalFilePath(slug);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content) as MemberAbsenceFile;
      return data?.absences || [];
    }
  } catch (err) {
    console.error(`[Local Read Error for ${memberName}]`, err);
  }

  return [];
}

/**
 * Synchronously and deterministically updates the snapshot (all.json)
 * with a member's newly saved absences without relying on list() eventual consistency.
 */
async function syncMemberIntoSnapshot(
  memberName: string,
  newAbsences: AbsenceRecord[],
  configuredMembers?: string[]
): Promise<void> {
  const cleanName = memberName.trim();
  const token = getBlobToken();
  const baseMembers =
    configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS;

  let snapshotData: AbsenceResponseData | null = null;

  // Try reading current snapshot directly
  if (token) {
    const text = await getBlobText(SNAPSHOT_KEY, token);
    if (text) {
      try {
        snapshotData = JSON.parse(text) as AbsenceResponseData;
      } catch { }
    }
  } else {
    try {
      ensureLocalDir();
      if (fs.existsSync(LOCAL_SNAPSHOT_FILE)) {
        const text = fs.readFileSync(LOCAL_SNAPSHOT_FILE, "utf-8");
        snapshotData = JSON.parse(text) as AbsenceResponseData;
      }
    } catch { }
  }

  // If snapshot does not exist yet, build full snapshot
  if (!snapshotData || !Array.isArray(snapshotData.absences)) {
    await rebuildSnapshot(configuredMembers);
    return;
  }

  // Merge: remove previous absences for this member, add new ones
  const filtered = snapshotData.absences.filter(
    (a) => a.memberName.trim().toLowerCase() !== cleanName.toLowerCase()
  );
  const merged = [...filtered, ...newAbsences].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  const membersSet = new Set<string>(snapshotData.members || baseMembers);
  membersSet.add(cleanName);

  const updatedSnapshot: AbsenceResponseData = {
    members: Array.from(membersSet).sort((a, b) => a.localeCompare(b, "it")),
    absences: merged,
    storage: token ? "vercel-blob" : "local-file"
  };

  const payload = JSON.stringify(updatedSnapshot, null, 2);

  // Write updated snapshot to cloud
  if (token) {
    await putBlobFile(SNAPSHOT_KEY, payload, token);
  }

  // Also write locally as cache
  try {
    ensureLocalDir();
    fs.writeFileSync(LOCAL_SNAPSHOT_FILE, payload, "utf-8");
  } catch { }

  // Update RAM cache
  absencesMemoryCache = {
    data: updatedSnapshot,
    timestamp: Date.now()
  };
}

/**
 * Saves absences for a specific member.
 * Operates strictly on assenze/[slug].json, avoiding race conditions between members,
 * and immediately updates the unified snapshot (all.json).
 */
export async function saveMemberAbsences(
  memberName: string,
  absences: AbsenceRecord[]
): Promise<void> {
  const cleanName = memberName.trim();
  const slug = memberNameToSlug(cleanName);
  if (!slug) throw new Error("Nome membro non valido");

  const fileData: MemberAbsenceFile = {
    memberName: cleanName,
    updatedAt: new Date().toISOString(),
    absences
  };

  const payload = JSON.stringify(fileData, null, 2);
  const token = getBlobToken();

  // 1. If running in Vercel environment:
  if (isVercel) {
    if (!token) {
      throw new Error(
        "Storage Vercel Blob non configurato: variabile BLOB_READ_WRITE_TOKEN assente per l'ambiente Preview/Production. Vai su Vercel Dashboard > Settings > Environment Variables e abilitala per Preview."
      );
    }
    const pathname = `assenze/${slug}.json`;
    await putBlobFile(pathname, payload, token);
    await syncMemberIntoSnapshot(cleanName, absences);
    return;
  }

  // 2. If local development (macOS/Node):
  if (token) {
    try {
      const pathname = `assenze/${slug}.json`;
      await putBlobFile(pathname, payload, token);
    } catch (err) {
      console.warn(`[Blob write failed locally, falling back to disk for ${cleanName}]:`, err);
    }
  }

  // Local file write
  ensureLocalDir();
  const filePath = getLocalFilePath(slug);
  fs.writeFileSync(filePath, payload, "utf-8");
  await syncMemberIntoSnapshot(cleanName, absences);
}

/**
 * Adds an absence for a member.
 */
export async function addAbsence(
  item: Omit<AbsenceRecord, "id" | "createdAt">
): Promise<AbsenceRecord> {
  const cleanName = item.memberName.trim();
  if (!cleanName) throw new Error("Il nome è obbligatorio");
  if (!item.startDate) throw new Error("La data iniziale è obbligatoria");

  const newRecord: AbsenceRecord = {
    id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    memberName: cleanName,
    startDate: item.startDate,
    endDate: item.endDate || item.startDate,
    status: item.status || "certain",
    note: item.note?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  const existing = await getMemberAbsences(cleanName);
  // Avoid duplicate exact range
  const updated = [
    ...existing.filter(
      (a) =>
        !(
          a.startDate === newRecord.startDate &&
          a.endDate === newRecord.endDate &&
          a.note === newRecord.note
        )
    ),
    newRecord
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));

  await saveMemberAbsences(cleanName, updated);
  return newRecord;
}

/**
 * Deletes an absence record by ID for a member.
 */
export async function deleteAbsence(id: string, memberName: string): Promise<boolean> {
  const existing = await getMemberAbsences(memberName);
  const filtered = existing.filter((a) => a.id !== id);

  if (filtered.length === existing.length) {
    return false; // Not found
  }

  await saveMemberAbsences(memberName, filtered);
  return true;
}

/**
 * Compiles all individual member files into a single snapshot (all.json).
 * Reads directly from each member's individual file without depending on list() latency.
 */
export async function rebuildSnapshot(configuredMembers?: string[]): Promise<AbsenceResponseData> {
  const token = getBlobToken();
  const baseMembers =
    configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS;
  const allAbsences: AbsenceRecord[] = [];

  // Parallel fetch directly for each known member's file (Strongly consistent)
  const promises = baseMembers.map(async (memberName) => {
    try {
      const absences = await getMemberAbsences(memberName);
      return absences;
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  for (const list of results) {
    allAbsences.push(...list);
  }

  const resultData: AbsenceResponseData = {
    members: baseMembers,
    absences: allAbsences.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    storage: token ? "vercel-blob" : "local-file"
  };

  const payload = JSON.stringify(resultData, null, 2);

  // Write compiled snapshot to blob
  if (token) {
    try {
      await putBlobFile(SNAPSHOT_KEY, payload, token);
    } catch (err) {
      console.error("[Blob Snapshot Put Error]", err);
      if (isVercel) throw err;
    }
  }

  // Local fallback / cache
  try {
    ensureLocalDir();
    fs.writeFileSync(LOCAL_SNAPSHOT_FILE, payload, "utf-8");
  } catch { }

  absencesMemoryCache = {
    data: resultData,
    timestamp: Date.now()
  };

  return resultData;
}

/**
 * Retrieves all absences and active members list.
 * Priority 1: In-memory cache (60s TTL) unless bypassMemoryCache is true.
 * Priority 2: Direct read from single snapshot file (all.json) -> EXACTLY 1 read.
 * Priority 3: If all.json does not exist, rebuildSnapshot from individual files.
 */
export async function getAllAbsences(
  configuredMembers?: string[],
  bypassMemoryCache = false
): Promise<AbsenceResponseData> {
  // 1. Check in-memory cache if not bypassing
  if (!bypassMemoryCache && absencesMemoryCache && Date.now() - absencesMemoryCache.timestamp < CACHE_TTL_MS) {
    return absencesMemoryCache.data;
  }

  const token = getBlobToken();
  const baseMembers =
    configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS;

  // 2. Read directly from the single snapshot file (all.json) in 1 operation
  if (token) {
    try {
      const text = await getBlobText(SNAPSHOT_KEY, token);
      if (text) {
        const data = JSON.parse(text) as AbsenceResponseData;
        if (data && Array.isArray(data.absences)) {
          data.members = baseMembers;
          data.storage = "vercel-blob";
          absencesMemoryCache = {
            data,
            timestamp: Date.now()
          };
          return data;
        }
      }
    } catch (err) {
      console.error("[Blob Snapshot Read Error, falling back to rebuild]", err);
    }
  } else {
    // Local snapshot read
    try {
      ensureLocalDir();
      if (fs.existsSync(LOCAL_SNAPSHOT_FILE)) {
        const content = fs.readFileSync(LOCAL_SNAPSHOT_FILE, "utf-8");
        const data = JSON.parse(content) as AbsenceResponseData;
        if (data && Array.isArray(data.absences)) {
          data.members = baseMembers;
          data.storage = "local-file";
          absencesMemoryCache = {
            data,
            timestamp: Date.now()
          };
          return data;
        }
      }
    } catch (err) {
      console.error("[Local Snapshot Read Error, falling back to rebuild]", err);
    }
  }

  // 3. Fallback only if all.json doesn't exist yet: rebuild snapshot from individual files
  return rebuildSnapshot(configuredMembers);
}
