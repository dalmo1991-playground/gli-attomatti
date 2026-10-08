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

