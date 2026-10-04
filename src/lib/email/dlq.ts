/**
 * Dead Letter Queue (DLQ) & Failure Recovery System for Transactional Emails.
 * Captures failed email send requests (quota limits, rate limits, network timeouts, invalid responses)
 * and stores full payloads for on-demand retry via the Admin Console or API.
 *
 * Storage Strategy:
 * 1. In Production on Vercel: Uses Vercel Blob (@vercel/blob) when BLOB_READ_WRITE_TOKEN is configured.
 * 2. In Development or Fallback: Uses a local JSON file in `.data/email-dlq.json` (or memory fallback).
 */

import { put, list, del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { SendEmailAttachment } from "./resend";

export interface FailedEmailRecord {
  id: string;
  createdAt: string; // ISO String
  lastAttemptAt: string; // ISO String
  attempts: number;
  error: {
    message: string;
    statusCode?: number;
    name?: string;
  };
  recipient: {
    email: string;
    name?: string;
  };
  subject: string;
  templateId?: string;
  subcaseId?: string;
  // Compiled options ready to be re-sent directly
  compiledOptions: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: SendEmailAttachment[];
  };
  // Original incoming request info (for debugging/inspection)
  originalRequest?: {
    url?: string;
    body?: any;
    templateParam?: string;
    subcaseParam?: string;
  };
}

const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "email-dlq.json");

// In-memory fallback if file system is read-only (e.g. serverless without Blob token)
let memoryQueue: Map<string, FailedEmailRecord> = new Map();

/**
 * Checks if Vercel Blob storage is available.
 */
function isBlobStorageAvailable(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Reads local storage file.
 */
function readLocalQueue(): FailedEmailRecord[] {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const data = fs.readFileSync(LOCAL_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("[DLQ] Warning reading local queue file:", err);
  }
  return Array.from(memoryQueue.values());
}

/**
 * Writes local storage file.
 */
function writeLocalQueue(records: FailedEmailRecord[]): void {
  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch {
    // If local write fails (e.g. read-only serverless environment), keep in memory
    memoryQueue = new Map(records.map((r) => [r.id, r]));
  }
}

/**
 * Enqueues a failed email request for later retry.
 */
export async function enqueueFailedEmail(
  data: Omit<FailedEmailRecord, "id" | "createdAt" | "lastAttemptAt" | "attempts">
): Promise<FailedEmailRecord> {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const id = `dlq_${Date.now()}_${randomSuffix}`;

  const record: FailedEmailRecord = {
    ...data,
    id,
    createdAt: timestamp,
    lastAttemptAt: timestamp,
    attempts: 1
  };

  // Structured server log for observability in Vercel Runtime Logs
  console.error(
    `[EMAIL_DLQ] Enqueued failed email delivery:\n` +
      `  ID: ${id}\n` +
      `  A: ${Array.isArray(record.recipient.email) ? record.recipient.email.join(", ") : record.recipient.email}\n` +
      `  Oggetto: ${record.subject}\n` +
      `  Errore: ${record.error.message}`
  );

  if (isBlobStorageAvailable()) {
    try {
      await put(`email-dlq/${id}.json`, JSON.stringify(record, null, 2), {
        access: "public",
        addRandomSuffix: false
      });
      return record;
    } catch (blobErr) {
      console.error("[DLQ] Error saving to Vercel Blob, falling back to local/memory:", blobErr);
    }
  }

  // Local/memory fallback
  const records = readLocalQueue();
  records.unshift(record);
  writeLocalQueue(records);

  return record;
}

/**
 * Lists all failed emails in the queue, sorted newest first.
 */
export async function listFailedEmails(): Promise<FailedEmailRecord[]> {
  if (isBlobStorageAvailable()) {
    try {
      const { blobs } = await list({ prefix: "email-dlq/" });
      const records: FailedEmailRecord[] = [];

      // Fetch blob contents in parallel with small batching
      const fetchPromises = blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url, { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as FailedEmailRecord;
            return data;
          }
        } catch (fetchErr) {
          console.warn(`[DLQ] Failed to fetch blob ${blob.url}:`, fetchErr);
        }
        return null;
      });

      const results = await Promise.all(fetchPromises);
      for (const r of results) {
        if (r && r.id) records.push(r);
      }

      // Sort newest first
      return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error("[DLQ] Error listing from Vercel Blob, checking local queue:", err);
    }
  }

  return readLocalQueue().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Gets a single failed email record by ID.
 */
export async function getFailedEmail(id: string): Promise<FailedEmailRecord | null> {
  if (!id) return null;

  if (isBlobStorageAvailable()) {
    try {
      const { blobs } = await list({ prefix: `email-dlq/${id}.json` });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url, { cache: "no-store" });
        if (res.ok) {
          return (await res.json()) as FailedEmailRecord;
        }
      }
    } catch (err) {
      console.warn(`[DLQ] Error getting ${id} from Blob:`, err);
    }
  }

  const local = readLocalQueue();
  return local.find((r) => r.id === id) || null;
}

/**
 * Removes a failed email from the queue after successful retry or manual discard.
 */
export async function removeFailedEmail(id: string): Promise<boolean> {
  if (!id) return false;

  let removedFromBlob = false;
  if (isBlobStorageAvailable()) {
    try {
      const { blobs } = await list({ prefix: `email-dlq/${id}.json` });
      if (blobs.length > 0) {
        await del(blobs.map((b) => b.url));
        removedFromBlob = true;
      }
    } catch (err) {
      console.warn(`[DLQ] Error deleting ${id} from Blob:`, err);
    }
  }

  // Also remove from local / memory
  const local = readLocalQueue();
  const filtered = local.filter((r) => r.id !== id);
  if (filtered.length !== local.length) {
    writeLocalQueue(filtered);
    return true;
  }

  return removedFromBlob;
}

/**
 * Clears all failed emails from the queue.
 */
export async function clearAllFailedEmails(): Promise<number> {
  let count = 0;

  if (isBlobStorageAvailable()) {
    try {
      const { blobs } = await list({ prefix: "email-dlq/" });
      if (blobs.length > 0) {
        await del(blobs.map((b) => b.url));
        count += blobs.length;
      }
    } catch (err) {
      console.warn("[DLQ] Error clearing blobs:", err);
    }
  }

  const local = readLocalQueue();
  count += local.length;
  writeLocalQueue([]);
  memoryQueue.clear();

  return count;
}

/**
 * Updates a failed email record when a retry attempt fails again.
 */
export async function updateFailedEmailAttempt(
  id: string,
  newError: { message: string; statusCode?: number }
): Promise<FailedEmailRecord | null> {
  const existing = await getFailedEmail(id);
  if (!existing) return null;

  existing.attempts += 1;
  existing.lastAttemptAt = new Date().toISOString();
  existing.error = {
    message: newError.message || existing.error.message,
    statusCode: newError.statusCode ?? existing.error.statusCode
  };

  if (isBlobStorageAvailable()) {
    try {
      await put(`email-dlq/${id}.json`, JSON.stringify(existing, null, 2), {
        access: "public",
        addRandomSuffix: false
      });
      return existing;
    } catch (err) {
      console.warn(`[DLQ] Error updating ${id} in Blob:`, err);
    }
  }

  const local = readLocalQueue();
  const index = local.findIndex((r) => r.id === id);
  if (index >= 0) {
    local[index] = existing;
    writeLocalQueue(local);
  }

  return existing;
}
