import { put, get } from "@vercel/blob";
import fs from "fs";
import path from "path";
import {
  CheckinBatchItem,
  CheckinRecord,
  MergedTallySubmission,
  StoredCheckinsFile,
  StoredTallySubmission,
  StoredTallySubmissionsFile,
  TallyApiFormSummary,
  TallyApiQuestion,
  TallyFormConfig,
  TallySubmissionsResponse
} from "@/types/tally";

const TALLY_API_BASE = "https://api.tally.so";
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DIR = isVercel
  ? path.join("/tmp", ".data", "tally-submissions")
  : path.join(process.cwd(), ".data", "tally-submissions");

const CACHE_TTL_MS = 45 * 1000;
const submissionsCache = new Map<
  string,
  { data: TallySubmissionsResponse; timestamp: number }
>();

function getBlobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

function getTallyApiKey(): string | undefined {
  const raw = process.env.TALLY_API_KEY;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

export function isTallyApiConfigured(): boolean {
  return Boolean(getTallyApiKey());
}

export function invalidateTallyCache(formId?: string) {
  if (formId) {
    submissionsCache.delete(formId);
  } else {
    submissionsCache.clear();
  }
}

function sanitizeFormId(formId: string): string {
  return formId.replace(/[^a-zA-Z0-9_-]/g, "");
}

function getBlobPath(formId: string, filename: "submissions.json" | "checkins.json"): string {
  return `tally-submissions/${sanitizeFormId(formId)}/${filename}`;
}

function getLocalPath(formId: string, filename: "submissions.json" | "checkins.json"): string {
  return path.join(LOCAL_DIR, sanitizeFormId(formId), filename);
}

async function putBlobJson(pathname: string, payload: unknown, token: string): Promise<void> {
  const content = JSON.stringify(payload);
  try {
    await put(pathname, content, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token
    });
  } catch (err: unknown) {
    const msg = String((err as Error)?.message || "").toLowerCase();
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
        contentType: "application/json",
        token
      });
      return;
    }
    throw err;
  }
}

async function getBlobText(pathname: string, token: string): Promise<string | null> {
  try {
    const res = await get(pathname, { access: "public", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      return await new Response(res.stream).text();
    }
  } catch {}

  try {
    const res = await get(pathname, { access: "private", token, useCache: false });
    if (res?.statusCode === 200 && res.stream) {
      return await new Response(res.stream).text();
    }
  } catch {}

  return null;
}

async function readJsonFile<T>(
  formId: string,
  filename: "submissions.json" | "checkins.json"
): Promise<{ data: T | null; storage: "vercel-blob" | "local-file" }> {
  const token = getBlobToken();
  if (token) {
    const text = await getBlobText(getBlobPath(formId, filename), token);
    if (text) {
      try {
        return { data: JSON.parse(text) as T, storage: "vercel-blob" };
      } catch (err) {
        console.error(`[Tally Blob Parse Error ${formId}/${filename}]`, err);
      }
    }
    return { data: null, storage: "vercel-blob" };
  }

  const localPath = getLocalPath(formId, filename);
  if (fs.existsSync(localPath)) {
    try {
      const text = fs.readFileSync(localPath, "utf-8");
      return { data: JSON.parse(text) as T, storage: "local-file" };
    } catch (err) {
      console.error(`[Tally Local Parse Error ${formId}/${filename}]`, err);
    }
  }
  return { data: null, storage: "local-file" };
}

async function writeJsonFile(
  formId: string,
  filename: "submissions.json" | "checkins.json",
  payload: unknown
): Promise<"vercel-blob" | "local-file"> {
  const token = getBlobToken();
  if (token) {
    await putBlobJson(getBlobPath(formId, filename), payload, token);
    return "vercel-blob";
  }

  const localPath = getLocalPath(formId, filename);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(localPath, JSON.stringify(payload, null, 2), "utf-8");
  return "local-file";
}

async function tallyFetch<T>(endpoint: string): Promise<T> {
  const apiKey = getTallyApiKey();
  if (!apiKey) {
    throw new Error(
      "TALLY_API_KEY non configurata sul server. Imposta la variabile d'ambiente TALLY_API_KEY."
    );
  }

  const res = await fetch(`${TALLY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Errore API Tally (${res.status}): ${errText || res.statusText}`);
  }

  return (await res.json()) as T;
}

/**
 * Lists all forms available in the Tally workspace.
 */
export async function fetchTallyForms(): Promise<TallyApiFormSummary[]> {
  const results: TallyApiFormSummary[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 10) {
    const data = await tallyFetch<{
      items?: Record<string, unknown>[];
      forms?: Record<string, unknown>[];
      hasMore?: boolean;
    }>(`/forms?page=${page}&limit=50`);

    const items = data.items || data.forms || [];
    for (const f of items) {
      if (!f?.id) continue;
      results.push({
        id: String(f.id),
        name: String(f.name || f.title || `Modulo ${f.id}`),
        status: f.status ? String(f.status) : undefined,
        numberOfSubmissions:
          typeof f.numberOfSubmissions === "number" ? f.numberOfSubmissions : undefined,
        updatedAt: f.updatedAt ? String(f.updatedAt) : undefined
      });
    }

    hasMore = Boolean(data.hasMore) && items.length > 0;
    page += 1;
  }

  return results;
}

/**
 * Lists questions/fields of a specific Tally form so Admin can configure allowedFields.
 */
export async function fetchTallyFormQuestions(formId: string): Promise<TallyApiQuestion[]> {
  const cleanId = sanitizeFormId(formId);
  if (!cleanId) throw new Error("ID modulo Tally non valido.");

  const data = await tallyFetch<{
    questions?: Record<string, unknown>[];
    items?: Record<string, unknown>[];
  }>(`/forms/${cleanId}/questions`);

  const rawQuestions = data.questions || data.items || [];
  const questions: TallyApiQuestion[] = [];

  for (const q of rawQuestions) {
    if (!q?.id) continue;
    const type = String(q.type || "UNKNOWN");
    // Skip non-input layout blocks if present
    if (
      type === "TITLE" ||
      type === "TEXT" ||
      type === "HEADING_1" ||
      type === "HEADING_2" ||
      type === "HEADING_3" ||
      type === "DIVIDER" ||
      type === "PAGE_BREAK" ||
      type === "IMAGE" ||
      type === "VIDEO"
    ) {
      continue;
    }
    questions.push({
      id: String(q.id),
      title: String(q.title || q.label || `Campo ${q.id}`).trim(),
      type
    });
  }

  return questions;
}

function formatTallyAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) return "";
  if (typeof answer === "string") return answer.trim();
  if (typeof answer === "number") return String(answer);
  if (typeof answer === "boolean") return answer ? "Sì" : "No";

  if (Array.isArray(answer)) {
    return answer
      .map((item) => formatTallyAnswer(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof answer === "object") {
    const obj = answer as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text.trim();
    if (typeof obj.label === "string") return obj.label.trim();
    if (typeof obj.value === "string" || typeof obj.value === "number") {
      return String(obj.value).trim();
    }
    if (typeof obj.name === "string") return obj.name.trim();
    if (typeof obj.url === "string") return obj.url.trim();
    try {
      return JSON.stringify(obj);
    } catch {
      return "";
    }
  }

  return String(answer).trim();
}

function parseParticipantsCount(rawValue: string | undefined): number {
  if (!rawValue) return 1;
  const match = rawValue.match(/\d+/);
  if (!match) return 1;
  const parsed = parseInt(match[0], 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

/**
 * Syncs completed submissions from Tally API to Vercel Blob (or local fallback),
 * strictly filtering responses to ONLY the configured allowedFields (privacy).
 */
export async function syncTallyFormToBlob(formConfig: TallyFormConfig): Promise<{
  syncedSubmissions: number;
  totalParticipants: number;
  syncedAt: string;
  storage: "vercel-blob" | "local-file";
}> {
  const cleanId = sanitizeFormId(formConfig.id);
  if (!cleanId) throw new Error("ID modulo Tally non valido.");

  const allowedIds = new Set((formConfig.allowedFields || []).map((f) => f.questionId));
  const fieldLabels: Record<string, string> = {};
  for (const f of formConfig.allowedFields || []) {
    fieldLabels[f.questionId] = f.label || f.questionId;
  }

  const participantsMode = formConfig.participantsMode || "one_per_submission";
  const participantsFieldId = formConfig.participantsFieldId;

  const collected: StoredTallySubmission[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 50) {
    const data = await tallyFetch<{
      submissions?: Array<{
        id?: string;
        respondentId?: string;
        isCompleted?: boolean;
        submittedAt?: string;
        createdAt?: string;
        responses?: Array<{ questionId?: string; answer?: unknown }>;
      }>;
      hasMore?: boolean;
    }>(`/forms/${cleanId}/submissions?page=${page}&limit=100`);

    const batch = data.submissions || [];
    for (const sub of batch) {
      if (!sub?.id) continue;
      // Only include completed submissions
      if (sub.isCompleted === false) continue;

      const responses = Array.isArray(sub.responses) ? sub.responses : [];
      const extractedFields: Record<string, string> = {};
      let rawParticipantsVal: string | undefined;

      for (const resp of responses) {
        const qId = String(resp?.questionId || "");
        if (!qId) continue;

        if (participantsMode === "from_field" && participantsFieldId && qId === participantsFieldId) {
          rawParticipantsVal = formatTallyAnswer(resp.answer);
        }

        if (allowedIds.has(qId)) {
          const formatted = formatTallyAnswer(resp.answer);
          if (formatted) {
            extractedFields[qId] = formatted;
          }
        }
      }

      const participantsCount =
        participantsMode === "from_field" ? parseParticipantsCount(rawParticipantsVal) : 1;

      collected.push({
        submissionId: String(sub.id),
        respondentId: sub.respondentId ? String(sub.respondentId) : undefined,
        submittedAt: String(sub.submittedAt || sub.createdAt || new Date().toISOString()),
        participantsCount,
        fields: extractedFields
      });
    }

    hasMore = Boolean(data.hasMore) && batch.length > 0;
    page += 1;
  }

  // Sort newest first
  collected.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const totalParticipants = collected.reduce((sum, s) => sum + (s.participantsCount || 1), 0);
  const syncedAt = new Date().toISOString();

  const filePayload: StoredTallySubmissionsFile = {
    formId: cleanId,
    syncedAt,
    totalSubmissions: collected.length,
    totalParticipants,
    fieldLabels,
    submissions: collected
  };

  const storage = await writeJsonFile(cleanId, "submissions.json", filePayload);
  invalidateTallyCache(cleanId);

  return {
    syncedSubmissions: collected.length,
    totalParticipants,
    syncedAt,
    storage
  };
}

/**
 * Reads submissions.json + checkins.json (using short in-memory cache unless bypassed)
 * and returns merged data ready for the Area Riservata Check-in UI.
 */
export async function getMergedTallySubmissions(
  formId: string,
  bypassCache = false
): Promise<TallySubmissionsResponse> {
  const cleanId = sanitizeFormId(formId);
  if (!cleanId) throw new Error("ID modulo Tally non valido.");

  if (!bypassCache) {
    const cached = submissionsCache.get(cleanId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const [subRes, chkRes] = await Promise.all([
    readJsonFile<StoredTallySubmissionsFile>(cleanId, "submissions.json"),
    readJsonFile<StoredCheckinsFile>(cleanId, "checkins.json")
  ]);

  const submissionsFile = subRes.data;
  const checkinsMap: Record<string, CheckinRecord> = chkRes.data?.checkins || {};

  const rawSubs = submissionsFile?.submissions || [];
  let checkedInSubmissions = 0;
  let checkedInParticipants = 0;

  const merged: MergedTallySubmission[] = rawSubs.map((sub) => {
    const chk = checkinsMap[sub.submissionId];
    const isCheckedIn = Boolean(chk?.checkedIn);
    if (isCheckedIn) {
      checkedInSubmissions += 1;
      checkedInParticipants += sub.participantsCount || 1;
    }
    return {
      ...sub,
      checkedIn: isCheckedIn,
      checkedInAt: isCheckedIn ? chk?.updatedAt : undefined,
      checkedInBy: isCheckedIn ? chk?.checkedInBy : undefined
    };
  });

  const totalParticipants =
    submissionsFile?.totalParticipants ??
    rawSubs.reduce((sum, s) => sum + (s.participantsCount || 1), 0);

  const response: TallySubmissionsResponse = {
    formId: cleanId,
    syncedAt: submissionsFile?.syncedAt || null,
    totalSubmissions: rawSubs.length,
    totalParticipants,
    checkedInSubmissions,
    checkedInParticipants,
    fieldLabels: submissionsFile?.fieldLabels || {},
    submissions: merged,
    storage: subRes.storage
  };

  submissionsCache.set(cleanId, { data: response, timestamp: Date.now() });
  return response;
}

/**
 * Applies a batch of check-in changes in a single read+write operation,
 * using per-submissionId timestamp comparison (Last-Write-Wins) for multi-user safety.
 */
export async function applyCheckinBatch(
  formId: string,
  changes: CheckinBatchItem[]
): Promise<{
  appliedCount: number;
  updatedAt: string;
  storage: "vercel-blob" | "local-file";
}> {
  const cleanId = sanitizeFormId(formId);
  if (!cleanId) throw new Error("ID modulo Tally non valido.");

  const { data: existingFile } = await readJsonFile<StoredCheckinsFile>(cleanId, "checkins.json");
  const checkins: Record<string, CheckinRecord> = { ...(existingFile?.checkins || {}) };

  let appliedCount = 0;
  for (const item of changes) {
    if (!item?.submissionId) continue;
    const incomingTime = item.updatedAt || new Date().toISOString();
    const current = checkins[item.submissionId];

    // Multi-user Last-Write-Wins per submissionId
    if (!current || incomingTime >= current.updatedAt) {
      if (item.checkedIn) {
        checkins[item.submissionId] = {
          checkedIn: true,
          updatedAt: incomingTime,
          checkedInBy: item.checkedInBy || undefined
        };
      } else {
        // Keep the unchecked record with timestamp so older stale flushes don't re-enable it
        checkins[item.submissionId] = {
          checkedIn: false,
          updatedAt: incomingTime,
          checkedInBy: item.checkedInBy || undefined
        };
      }
      appliedCount += 1;
    }
  }

  const updatedAt = new Date().toISOString();
  const nextFile: StoredCheckinsFile = {
    formId: cleanId,
    updatedAt,
    checkins
  };

  const storage = await writeJsonFile(cleanId, "checkins.json", nextFile);
  invalidateTallyCache(cleanId);

  return { appliedCount, updatedAt, storage };
}

