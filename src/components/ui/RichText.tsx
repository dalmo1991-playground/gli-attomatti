"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

import { FormattedText } from "./FormattedText";

interface RichTextProps {
  content?: string;
  className?: string;
  as?: React.ElementType;
}

/**
 * Checks whether a string contains HTML formatting tags
 */
function isHtml(str: string): boolean {
  return /<(?:p|strong|b|em|i|u|a|ul|ol|li|br|span|div)\b[^>]*>/i.test(str);
}

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li",
  "span", "div", "h2", "h3", "h4", "blockquote", "small", "s", "del", "sub", "sup"
]);

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

/**
 * Allow-list HTML sanitizer.
 * - Drops dangerous elements together with their content (script, style, iframe, svg...).
 * - Keeps only a small set of formatting tags.
 * - Strips EVERY attribute except a safe `href` on <a> (http/https/mailto/tel/relative/#),
 *   and forces target/rel on links.
 */
function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return "";

  return dirtyHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form|textarea|select)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, rawTag: string, attrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";

      if (match.startsWith("</")) return `</${tag}>`;

      if (tag === "a") {
        const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "").trim();
        if (!href || !SAFE_HREF.test(href)) return "<a>";
        const external = /^https?:\/\//i.test(href);
        const safeHref = href.replace(/"/g, "&quot;").replace(/</g, "&lt;");
        return external
          ? `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`
          : `<a href="${safeHref}">`;
      }

      return tag === "br" ? "<br>" : `<${tag}>`;
    });
}

export function RichText({
  content = "",
  className = "",
  as: Component = "div"
}: RichTextProps) {
  // Hooks must run before any early return (Rules of Hooks)
  const safeContent = typeof content === "string" ? content : "";

  // Pre-process markdown links [text](url) -> <a href="url">text</a>
  const processedContent = useMemo(() => {
    return safeContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }, [safeContent]);

  const hasHtml = useMemo(() => isHtml(processedContent), [processedContent]);

  if (!safeContent.trim()) {
    return null;
  }

  // If HTML is present, render with safe markup and refined typography
  if (hasHtml) {
    const cleanHtml = sanitizeHtml(processedContent);
    return (
      <Component
        className={cn(
          "leading-relaxed",
          "[&_p]:mb-3 [&_p:last-child]:mb-0",
          "[&_strong]:font-bold [&_strong]:text-foreground",
          "[&_em]:italic",
          "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 [&_a]:font-bold [&_a]:transition-colors",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1.5",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1.5",
          "[&_li]:leading-relaxed",
          className
        )}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Fallback for plain text: support markdown links, raw URLs, bold, and line breaks
  return (
    <Component className={cn("whitespace-pre-line leading-relaxed", className)}>
      <FormattedText text={content} />
    </Component>
  );
}
