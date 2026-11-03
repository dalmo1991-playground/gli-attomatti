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

const SNAPSHOT_KEY = "assenze/_all.json";
const LOCAL_SNAPSHOT_FILE = path.join(LOCAL_DIR, "_all.json");

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
        token
      });
      return;
    }
    throw err;
  }
}

/**
 * Reads a blob's content, supporting both public and private stores and direct fetch fallback.
 */
async function readBlobContent(
  blob: { pathname: string; url: string; downloadUrl?: string },
  token: string
): Promise<string | null> {
  // 1. Try get() with public
  try {
    const res = await get(blob.url || blob.pathname, { access: "public", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      return await new Response(res.stream).text();
    }
  } catch {}

  // 2. Try get() with private
  try {
    const res = await get(blob.url || blob.pathname, { access: "private", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      return await new Response(res.stream).text();
    }
  } catch {}

  // 3. Try direct fetch fallback
  const fetchUrl = blob.downloadUrl || blob.url;
  if (fetchUrl) {
    try {
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (res.ok) {
        return await res.text();
      }
    } catch {}
  }

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
      const blobList = await list({ prefix: pathname, token });
      const matched = blobList.blobs.find((b) => b.pathname === pathname);

      if (matched) {
        const text = await readBlobContent(matched, token);
        if (text) {
          const data = JSON.parse(text) as MemberAbsenceFile;
          return data?.absences || [];
        }
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
 * Saves absences for a specific member.
 * Operates strictly on assenze/[slug].json, avoiding race conditions between members.
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

  // If running in Vercel environment (Production or Preview):
  if (isVercel) {
    if (!token) {
      throw new Error(
        "Storage Vercel Blob non configurato: la variabile BLOB_READ_WRITE_TOKEN non è attiva per l'ambiente Preview su Vercel. Vai nella Dashboard Vercel > Settings > Environment Variables e assicurati che BLOB_READ_WRITE_TOKEN sia abilitata per 'Preview'."
      );
    }
    const pathname = `assenze/${slug}.json`;
    await putBlobFile(pathname, payload, token);
    // Rebuild the aggregated snapshot after saving member's file
    await rebuildSnapshot();
    return;
  }

  // If local development (macOS/Node):
  if (token) {
    try {
      const pathname = `assenze/${slug}.json`;
      await putBlobFile(pathname, payload, token);
      await rebuildSnapshot();
      return;
    } catch (err) {
      console.warn(`[Blob write failed locally, falling back to disk for ${cleanName}]:`, err);
    }
  }

  // Local file write
  ensureLocalDir();
  const filePath = getLocalFilePath(slug);
  fs.writeFileSync(filePath, payload, "utf-8");
  await rebuildSnapshot();
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
 * Compiles all individual member files into a single snapshot (_all.json).
 * This ensures that reads are reduced to a single operation while each member's
 * data remains isolated in their own file.
 */
export async function rebuildSnapshot(configuredMembers?: string[]): Promise<AbsenceResponseData> {
  const token = getBlobToken();
  const baseMembers =
    configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS;
  const membersSet = new Set<string>(baseMembers);
  const allAbsences: AbsenceRecord[] = [];

  if (token) {
    try {
      const blobList = await list({ prefix: "assenze/", token });
      const jsonBlobs = blobList.blobs.filter(
        (b) => b.pathname.endsWith(".json") && !b.pathname.endsWith("_all.json")
      );

      const promises = jsonBlobs.map(async (blob) => {
        try {
          const text = await readBlobContent(blob, token);
          if (text) {
            const data = JSON.parse(text) as MemberAbsenceFile;
            if (data?.memberName && !configuredMembers?.length) {
              membersSet.add(data.memberName);
            }
            if (Array.isArray(data?.absences)) {
              return data.absences;
            }
          }
        } catch (e) {
          console.error(`[Error reading blob ${blob.pathname}]`, e);
        }
        return [];
      });

      const results = await Promise.all(promises);
      for (const list of results) {
        allAbsences.push(...list);
      }

      const resultData: AbsenceResponseData = {
        members: Array.from(membersSet).sort((a, b) => a.localeCompare(b, "it")),
        absences: allAbsences.sort((a, b) => a.startDate.localeCompare(b.startDate)),
        storage: "vercel-blob"
      };

      // Write compiled snapshot to blob
      try {
        await putBlobFile(SNAPSHOT_KEY, JSON.stringify(resultData, null, 2), token);
      } catch (err) {
        console.error("[Blob Snapshot Put Error]", err);
      }

      absencesMemoryCache = {
        data: resultData,
        timestamp: Date.now()
      };

      return resultData;
    } catch (err) {
      console.error("[Blob List Error]", err);
      if (isVercel) {
        throw err;
      }
    }
  }

  // Local fallback (macOS or serverless /tmp)
  ensureLocalDir();
  try {
    const files = fs
      .readdirSync(LOCAL_DIR)
      .filter((f) => f.endsWith(".json") && f !== "_all.json");

    for (const file of files) {
      try {
        const filePath = path.join(LOCAL_DIR, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content) as MemberAbsenceFile;
        if (data?.memberName && !configuredMembers?.length) {
          membersSet.add(data.memberName);
        }
        if (Array.isArray(data?.absences)) {
          allAbsences.push(...data.absences);
        }
      } catch (e) {
        console.error(`[Error reading local file ${file}]`, e);
      }
    }
  } catch (err) {
    console.error("[Local Dir Read Error]", err);
  }

  const localResultData: AbsenceResponseData = {
    members: Array.from(membersSet).sort((a, b) => a.localeCompare(b, "it")),
    absences: allAbsences.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    storage: "local-file"
  };

  try {
    fs.writeFileSync(LOCAL_SNAPSHOT_FILE, JSON.stringify(localResultData, null, 2), "utf-8");
  } catch (err) {
    console.error("[Local Snapshot Write Error]", err);
  }

  absencesMemoryCache = {
    data: localResultData,
    timestamp: Date.now()
  };

  return localResultData;
}

/**
 * Retrieves all absences and active members list.
 * Priority 1: In-memory cache (60s TTL) unless forceRefresh is true.
 * Priority 2: Single snapshot file (_all.json) -> 1 single read operation.
 * Priority 3: Rebuild snapshot from individual files if _all.json doesn't exist yet or forceRefresh.
 */
export async function getAllAbsences(
  configuredMembers?: string[],
  forceRefresh = false
): Promise<AbsenceResponseData> {
  if (!forceRefresh && absencesMemoryCache && Date.now() - absencesMemoryCache.timestamp < CACHE_TTL_MS) {
    return absencesMemoryCache.data;
  }

  const token = getBlobToken();

  // Try reading single snapshot file (_all.json) for 1-read efficiency
  if (!forceRefresh) {
    if (token) {
      try {
        const blobList = await list({ prefix: SNAPSHOT_KEY, token });
        const snapshotBlob = blobList.blobs.find((b) => b.pathname === SNAPSHOT_KEY);

        if (snapshotBlob) {
          const text = await readBlobContent(snapshotBlob, token);
          if (text) {
            const data = JSON.parse(text) as AbsenceResponseData;
            if (data && Array.isArray(data.absences)) {
              if (configuredMembers && configuredMembers.length > 0) {
                data.members = configuredMembers;
              }
              data.storage = "vercel-blob";
              absencesMemoryCache = {
                data,
                timestamp: Date.now()
              };
              return data;
            }
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
            if (configuredMembers && configuredMembers.length > 0) {
              data.members = configuredMembers;
            }
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
  }

  // Fallback: rebuild snapshot from all individual files
  return rebuildSnapshot(configuredMembers);
}
