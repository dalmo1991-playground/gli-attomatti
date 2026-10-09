"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FormattedTextProps {
  text?: string | null;
  className?: string;
  as?: React.ElementType;
  linkClassName?: string;
  preserveBreaks?: boolean;
}

interface TextToken {
  type: "text" | "link" | "bold" | "italic" | "br";
  text?: string;
  href?: string;
  value?: string;
}

/**
 * Tokenizes a string detecting markdown links, HTML links, raw URLs, bold, italic, and line breaks.
 */
export function parseFormattedTokens(text: string): TextToken[] {
  if (!text || typeof text !== "string") return [];

  // Match:
  // 1. Markdown link: [text](url)
  // 2. HTML link: <a ... href="..." ...>text</a>
  // 3. Bold: **text** or <b>text</b> or <strong>text</strong>
  // 4. Italic: *text* or <i>text</i> or <em>text</em>
  // 5. Raw URL: https://... or http://...
  // 6. Line breaks: <br> or \n
  const tokenRegex = /(?:\[([^\]]+)\]\(([^)]+)\))|(?:<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>)|(?:\*\*([^*]+)\*\*|<strong>(.*?)<\/strong>|<b>(.*?)<\/b>)|(?:\*([^*]+)\*|<em>(.*?)<\/em>|<i>(.*?)<\/i>)|(https?:\/\/[^\s<)\]]+)|(?:<br\s*\/?>|\n)/gi;

  const tokens: TextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.substring(lastIndex, match.index) });
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      // Markdown link: [label](url)
      tokens.push({ type: "link", text: match[1], href: match[2].trim() });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // HTML link: <a href="url">label</a>
      tokens.push({ type: "link", text: match[4], href: match[3].trim() });
    } else if (match[5] !== undefined || match[6] !== undefined || match[7] !== undefined) {
      // Bold
      const boldText = match[5] || match[6] || match[7] || "";
      tokens.push({ type: "bold", text: boldText });
    } else if (match[8] !== undefined || match[9] !== undefined || match[10] !== undefined) {
      // Italic
      const italicText = match[8] || match[9] || match[10] || "";
      tokens.push({ type: "italic", text: italicText });
    } else if (match[11] !== undefined) {
      // Raw URL
      const rawUrl = match[11];
      const cleanHref = rawUrl.replace(/[.,;:!?]+$/, "");
      const trailingPunct = rawUrl.slice(cleanHref.length);
      tokens.push({ type: "link", text: cleanHref, href: cleanHref });
      if (trailingPunct) {
        tokens.push({ type: "text", value: trailingPunct });
      }
    } else if (match[0].toLowerCase().startsWith("<br") || match[0] === "\n") {
      tokens.push({ type: "br" });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.substring(lastIndex) });
  }

  return tokens;
}

/**
 * Renders tokens into safe React nodes with Next.js <Link> or <a> for external targets.
 */
export function renderFormattedContent(
  text: string | null | undefined,
  linkClassName?: string,
  preserveBreaks: boolean = true
): React.ReactNode {
  if (!text || typeof text !== "string") return null;

  // Fast path if text contains no special formatting
  if (!/[\[<*]|\n|https?:\/\//i.test(text)) {
    return text;
  }

  const tokens = parseFormattedTokens(text);
  const defaultLinkClass = "text-primary underline hover:text-primary/80 font-bold transition-colors";

  return tokens.map((token, idx) => {
    if (token.type === "text") {
      return token.value;
    }

    if (token.type === "link") {
      const href = token.href || "#";
      const label = token.text || href;

      // Security check: block javascript:
      if (href.toLowerCase().startsWith("javascript:")) {
        return label;
      }

      // Internal link: use Next.js <Link>
      if ((href.startsWith("/") || href.startsWith("#")) && !href.startsWith("//")) {
        return (
          <Link
            key={idx}
            href={href}
            prefetch={false}
            className={cn(defaultLinkClass, linkClassName)}
          >
            {label}
          </Link>
        );
      }

      // External link or protocol: use <a>
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      return (
        <a
          key={idx}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={cn(defaultLinkClass, linkClassName)}
        >
          {label}
        </a>
      );
    }

    if (token.type === "bold") {
      return (
        <strong key={idx} className="font-bold">
          {token.text}
        </strong>
      );
    }

    if (token.type === "italic") {
      return (
        <em key={idx} className="italic">
          {token.text}
        </em>
      );
    }

    if (token.type === "br") {
      return preserveBreaks ? <br key={idx} /> : " ";
    }

    return null;
  });
}

/**
 * Universal text component that renders any text string with support for:
 * - Markdown links [Testo](url)
 * - HTML links <a href="url">Testo</a>
 * - Raw URLs https://...
 * - Bold **testo** or <b>/<strong>
 * - Italic *testo* or <i>/<em>
 * - Line breaks \n or <br>
 */
export function FormattedText({
  text,
  className,
  as: Component,
  linkClassName,
  preserveBreaks = true
}: FormattedTextProps) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const content = renderFormattedContent(text, linkClassName, preserveBreaks);

  if (Component) {
    return <Component className={className}>{content}</Component>;
  }

  if (className) {
    return <span className={className}>{content}</span>;
  }

  return <>{content}</>;
}
