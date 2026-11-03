import { put, list, get, del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { AbsenceRecord, MemberAbsenceFile, AbsenceResponseData, DEFAULT_MEMBERS, memberNameToSlug } from "@/types/absence";

export { DEFAULT_MEMBERS, memberNameToSlug };

const LOCAL_DIR = path.join(process.cwd(), ".data", "assenze");

function getBlobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

export function isBlobStorageAvailable(): boolean {
  return Boolean(getBlobToken());
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
 * Reads absences for a single member from Vercel Blob or local file.
 */
export async function getMemberAbsences(memberName: string): Promise<AbsenceRecord[]> {
  const slug = memberNameToSlug(memberName);
  if (!slug) return [];

  const token = getBlobToken();

  if (token) {
    try {
      const pathname = `assenze/${slug}.json`;
      // Try fetching blob directly
      const blobList = await list({ prefix: pathname, token });
      const matched = blobList.blobs.find((b) => b.pathname === pathname);

      if (matched) {
        // Try reading via get()
        try {
          const res = await get(matched.url, { access: "public", token, useCache: false });
          if (res?.statusCode === 200 && res.stream) {
            const text = await new Response(res.stream).text();
            const data = JSON.parse(text) as MemberAbsenceFile;
            return data?.absences || [];
          }
        } catch {
          // Fallback to direct fetch
        }

        const fetchUrl = matched.downloadUrl || matched.url;
        if (fetchUrl) {
          const res = await fetch(fetchUrl, { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as MemberAbsenceFile;
            return data?.absences || [];
          }
        }
      }
      return [];
    } catch (err) {
      console.error(`[Blob Read Error for ${memberName}]`, err);
      // Fall through to local fallback
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

  if (token) {
    try {
      const pathname = `assenze/${slug}.json`;
      await put(pathname, payload, {
        access: "public",
        addRandomSuffix: false,
        token
      });
      return;
    } catch (err) {
      console.error(`[Blob Put Error for ${cleanName}]`, err);
      // Fall through to local write
    }
  }

  // Local file write
  ensureLocalDir();
  const filePath = getLocalFilePath(slug);
  fs.writeFileSync(filePath, payload, "utf-8");
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
 * Retrieves all absences and active members list.
 * If configuredMembers is supplied from content.json, uses it as the source of truth for the members list.
 */
export async function getAllAbsences(configuredMembers?: string[]): Promise<AbsenceResponseData> {
  const token = getBlobToken();
  const baseMembers = configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS;
  const membersSet = new Set<string>(baseMembers);
  const allAbsences: AbsenceRecord[] = [];

  if (token) {
    try {
      const blobList = await list({ prefix: "assenze/", token });
      const jsonBlobs = blobList.blobs.filter((b) => b.pathname.endsWith(".json"));

      const promises = jsonBlobs.map(async (blob) => {
        try {
          const fetchUrl = blob.downloadUrl || blob.url;
          const res = await fetch(fetchUrl, { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as MemberAbsenceFile;
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

      return {
        members: Array.from(membersSet).sort((a, b) => a.localeCompare(b, "it")),
        absences: allAbsences.sort((a, b) => a.startDate.localeCompare(b.startDate)),
        storage: "vercel-blob"
      };
    } catch (err) {
      console.error("[Blob List Error]", err);
    }
  }

  // Local fallback
  ensureLocalDir();
  try {
    const files = fs.readdirSync(LOCAL_DIR).filter((f) => f.endsWith(".json"));
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

  return {
    members: Array.from(membersSet).sort((a, b) => a.localeCompare(b, "it")),
    absences: allAbsences.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    storage: "local-file"
  };
}
