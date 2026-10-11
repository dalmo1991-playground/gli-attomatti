import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips HTML tags and decodes common entities into clean, single-line or normalized text.
 */
export function stripHtml(input: any): string {
  if (input === null || input === undefined) return "";
  if (typeof input !== "string") return String(input);
  return input
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>\s*<p[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/**
 * Strips HTML tags while converting block breaks (<p>, <div>, <br>) into natural newlines (\n).
 */
export function stripHtmlPreservingBreaks(input: any): string {
  if (input === null || input === undefined) return "";
  if (typeof input !== "string") return String(input);
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/div>\s*<div[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/**
 * Resolves text with support for explicit suppression via `null`.
 * - If any candidate in the chain is explicitly `null`, returns `null` immediately.
 *   This signals that the corresponding graphical element should NOT be displayed,
 *   rather than falling back to a hardcoded default string.
 * - If a candidate is a non-empty defined value, returns it as a string.
 * - If a candidate is `undefined` (or empty string ""), continues to the next fallback candidate.
 * - If all candidates are exhausted, returns `null`.
 */
export function defaultText(...candidates: any[]): string | null {
  for (let i = 0; i < candidates.length; i++) {
    const val = candidates[i];
    if (val === null) return null;
    if (val !== undefined && val !== "") return String(val);
  }
  return null;
}

/**
 * Extracts a numeric timestamp (milliseconds) from an article for sorting.
 * Supports ISO date strings, timestamp numbers/strings, or parses Italian month-year text (e.g. "Maggio 2026").
 */
export function getArticleTimestamp(article: any): number {
  if (!article) return 0;

  // 1. Explicit timestamp (number or numeric string)
  if (article.timestamp !== undefined && article.timestamp !== null && article.timestamp !== "") {
    const num = Number(article.timestamp);
    if (!isNaN(num) && num > 0) {
      // If in seconds (e.g. 10 digits Unix), convert to ms
      return num < 10000000000 ? num * 1000 : num;
    }
    const parsed = Date.parse(String(article.timestamp));
    if (!isNaN(parsed)) return parsed;
  }

  // 2. Parse from date field (e.g. "2026-05-15", "Maggio 2026", "24 Ottobre 2026")
  const dateStr = typeof article.date === "string" ? article.date.trim() : "";
  if (dateStr) {
    const directParse = Date.parse(dateStr);
    if (!isNaN(directParse)) return directParse;

    // Italian months mapping
    const italianMonths: Record<string, number> = {
      gennaio: 0,
      febbraio: 1,
      marzo: 2,
      aprile: 3,
      maggio: 4,
      giugno: 5,
      luglio: 6,
      agosto: 7,
      settembre: 8,
      ottobre: 9,
      novembre: 10,
      dicembre: 11
    };

    const lower = dateStr.toLowerCase();
    for (const [mName, mIdx] of Object.entries(italianMonths)) {
      if (lower.includes(mName)) {
        // Extract year if present
        const yearMatch = lower.match(/\b(20\d{2}|19\d{2})\b/);
        const y = yearMatch ? parseInt(yearMatch[1], 10) : (article.year ? parseInt(article.year, 10) : 2025);
        // Extract day if present (e.g. "24 Ottobre 2026")
        const dayMatch = lower.match(/\b(\d{1,2})\b/);
        const d = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        return new Date(y, mIdx, Math.min(Math.max(d, 1), 28)).getTime();
      }
    }
  }

  // 3. Fallback to year
  if (article.year) {
    const y = parseInt(String(article.year), 10);
    if (!isNaN(y)) return new Date(y, 0, 1).getTime();
  }

  return 0;
}

/**
 * Sorts blog articles in reverse chronological order (newest first).
 */
export function sortBlogArticles<T = any>(articles: T[]): T[] {
  if (!Array.isArray(articles)) return [];
  return [...articles].sort((a: any, b: any) => {
    const timeA = getArticleTimestamp(a);
    const timeB = getArticleTimestamp(b);
    return timeB - timeA;
  });
}

