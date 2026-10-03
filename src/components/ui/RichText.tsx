"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

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

/**
 * Basic safe sanitizer: strips dangerous tags like script, iframe, object, embed, style,
 * and removes on* attributes (onclick, onerror, etc.) and javascript: URLs.
 */
function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return "";
  let clean = dirtyHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<\/?(?:source-footnote|sources-carousel-inline|citation-tag)[^>]*>/gi, "")
    .replace(/\s*data-path-to-node="[^"]*"/gi, "")
    .replace(/\s*_ng(?:host|content)[^=]*="[^"]*"/gi, "")
    .replace(/\s*ng-[^=]*="[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  return clean;
}

export function RichText({
  content = "",
  className = "",
  as: Component = "div"
}: RichTextProps) {
  if (!content || typeof content !== "string" || !content.trim()) {
    return null;
  }

  const hasHtml = useMemo(() => isHtml(content), [content]);

  // If HTML is present, render with safe markup and refined typography
  if (hasHtml) {
    const cleanHtml = sanitizeHtml(content);
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

  // Fallback for legacy plain text: preserve natural paragraph breaks and line breaks
  return (
    <Component className={cn("whitespace-pre-line leading-relaxed", className)}>
      {content}
    </Component>
  );
}
