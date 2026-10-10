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
  return /<(?:p|strong|b|em|i|u|a|ul|ol|li|br|span|div|mark|q|blockquote)\b[^>]*>/i.test(str);
}

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li",
  "span", "div", "h2", "h3", "h4", "blockquote", "mark", "q", "small", "s", "del", "sub", "sup"
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

  const sanitized = dirtyHtml
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

  // Clean up stray/redundant <br> before or after block elements and remove empty paragraphs
  return sanitized
    .replace(/<p>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, "")
    .replace(/<br\s*\/?>\s*(<\/?(?:ul|ol|li|p|h[1-6]|blockquote)>)/gi, "$1")
    .replace(/(<\/?(?:ul|ol|li|p|h[1-6]|blockquote)>)\s*<br\s*\/?>/gi, "$1")
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, "</p><p>");
}

export function RichText({
  content = "",
  className = "",
  as: Component = "div"
}: RichTextProps) {
  // Hooks must run before any early return (Rules of Hooks)
  const safeContent = typeof content === "string" ? content : "";

  // Pre-process markdown links [text](url) -> <a href="url">text</a> and highlights ==text== -> <mark>text</mark>
  const processedContent = useMemo(() => {
    return safeContent
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/==([^=]+)==/g, '<mark>$1</mark>');
  }, [safeContent]);

  const hasHtml = useMemo(() => isHtml(processedContent), [processedContent]);

  // Fallback for plain text: split on double newlines to render unified <p> elements
  const plainParagraphs = useMemo(() => {
    if (hasHtml || !safeContent.trim()) return [];
    return safeContent
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [hasHtml, safeContent]);

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
          "[&_p]:mb-4 sm:[&_p]:mb-4.5 [&_p:last-child]:mb-0 [&_p:empty]:hidden",
          "[&_strong]:font-bold [&_strong]:text-foreground",
          "[&_b]:font-bold [&_b]:text-foreground",
          "[&_em]:italic [&_em]:font-semibold [&_em]:text-foreground [&_em]:tracking-wide",
          "[&_i]:italic [&_i]:font-semibold [&_i]:text-foreground [&_i]:tracking-wide",
          "[&_mark]:bg-transparent [&_mark]:text-primary [&_mark]:font-bold",
          "[&_q]:italic [&_q]:font-medium [&_q]:text-foreground",
          "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 [&_a]:font-bold [&_a]:transition-colors",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-4 sm:[&_ul]:my-4.5 [&_ul]:space-y-1.5 [&_ul:last-child]:mb-0",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-4 sm:[&_ol]:my-4.5 [&_ol]:space-y-1.5 [&_ol:last-child]:mb-0",
          "[&_li]:leading-relaxed",
          "[&_blockquote]:my-4 sm:[&_blockquote]:my-4.5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/90 [&_blockquote]:font-medium [&_blockquote]:bg-primary/5 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote:last-child]:mb-0",
          className
        )}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Fallback for plain text: support markdown links, raw URLs, bold, and line breaks
  // Each paragraph is rendered as <p className="mb-4 sm:mb-4.5 last:mb-0"> to share the EXACT same visual spacing as HTML
  const isInline = Component === "span";
  const OuterComponent = Component === "p" ? "div" : Component;
  const ParagraphComponent = isInline ? "span" : "p";

  return (
    <OuterComponent className={cn("leading-relaxed", className)}>
      {plainParagraphs.map((para, idx) => (
        <ParagraphComponent
          key={idx}
          className={cn(isInline && "block", "mb-4 sm:mb-4.5 last:mb-0")}
        >
          <FormattedText text={para} />
        </ParagraphComponent>
      ))}
    </OuterComponent>
  );
}
