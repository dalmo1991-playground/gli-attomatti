"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Highlighter,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  Code,
  Eye,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

function cleanDirtyHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:source-footnote|sources-carousel-inline|citation-tag)[^>]*>/gi, "")
    .replace(/\s*data-path-to-node="[^"]*"/gi, "")
    .replace(/\s*_ng(?:host|content)[^=]*="[^"]*"/gi, "")
    .replace(/\s*ng-[^=]*="[^"]*"/gi, "");
}

/**
 * Ensures text has proper HTML structure:
 * Converts plain text newlines (\n\n -> <p>, \n -> <br>) if no HTML tags exist.
 */
function plainTextToHtml(text: string): string {
  if (!text || typeof text !== "string") return "";
  const cleaned = cleanDirtyHtml(text);
  const trimmed = cleaned.trim();
  if (!trimmed) return "";
  // If it already contains HTML block or inline tags, keep it as HTML
  if (/<(?:p|div|ul|ol|li|br|strong|b|em|i|a|h[1-6]|small|span|mark)\b[^>]*>/i.test(trimmed)) {
    return trimmed;
  }
  // Otherwise wrap plain paragraphs
  return trimmed
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Formats HTML with clean line breaks so it is easily readable in source code mode
 */
function formatHtmlForSource(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<\/p>/gi, "</p>\n")
    .replace(/<\/li>/gi, "</li>\n")
    .replace(/<ul>/gi, "<ul>\n")
    .replace(/<\/ul>/gi, "</ul>\n")
    .replace(/<ol>/gi, "<ol>\n")
    .replace(/<\/ol>/gi, "</ol>\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const INLINE_TAGS = new Set(["MARK", "SMALL", "SPAN", "B", "STRONG", "I", "EM", "U", "A"]);
const BLOCK_TAGS = new Set(["P", "DIV", "LI", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"]);

/**
 * Robust DOM-level normalizer:
 * 1. Pulls any block element (<p>, <div>, etc.) out from inside inline tags (e.g. <mark><p>...</p></mark> -> <p><mark>...</mark></p>)
 * 2. Unwraps redundant nested identical tags (e.g. <mark><mark>...</mark></mark>)
 * 3. Removes empty inline elements (e.g. <i></i>, <b></b>, <mark></mark>)
 * 4. Removes empty paragraphs (<p></p>, <p><br></p>)
 */
function normalizeEditorDom(root: HTMLElement): void {
  // Pass 1: Fix inverted block elements nested inside inline tags
  let hasInverted = true;
  let safety = 0;
  while (hasInverted && safety++ < 30) {
    hasInverted = false;
    const inlineElements = Array.from(root.querySelectorAll("mark, small, span, b, strong, i, em, u, a"));
    for (const inlineEl of inlineElements) {
      if (!inlineEl.parentNode) continue;
      const childBlock = inlineEl.querySelector("p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote");
      if (childBlock) {
        hasInverted = true;
        // Move children of inlineEl out so block elements are never inside an inline element
        const parent = inlineEl.parentNode;
        while (inlineEl.firstChild) {
          const child = inlineEl.firstChild;
          if (child.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((child as HTMLElement).tagName)) {
            // Re-apply the inline formatting inside this block child
            const blockEl = child as HTMLElement;
            const innerWrapper = document.createElement(inlineEl.tagName.toLowerCase());
            if (inlineEl.className) innerWrapper.className = inlineEl.className;
            while (blockEl.firstChild) {
              innerWrapper.appendChild(blockEl.firstChild);
            }
            blockEl.appendChild(innerWrapper);
            parent.insertBefore(blockEl, inlineEl);
          } else {
            const inlineWrapper = document.createElement(inlineEl.tagName.toLowerCase());
            if (inlineEl.className) inlineWrapper.className = inlineEl.className;
            inlineWrapper.appendChild(child);
            parent.insertBefore(inlineWrapper, inlineEl);
          }
        }
        parent.removeChild(inlineEl);
        break;
      }
    }
  }

  // Pass 2: Collapse duplicate identical parent-child inline tags (<mark><mark>...</mark></mark>)
  const tagsToCheck = ["MARK", "SMALL", "B", "STRONG", "I", "EM", "U"];
  for (const tag of tagsToCheck) {
    const nested = Array.from(root.querySelectorAll(`${tag.toLowerCase()} > ${tag.toLowerCase()}`));
    for (const inner of nested) {
      const parent = inner.parentNode;
      if (parent) {
        while (inner.firstChild) {
          parent.insertBefore(inner.firstChild, inner);
        }
        parent.removeChild(inner);
      }
    }
  }

  // Pass 3: Remove empty inline formatting elements
  const allInlines = Array.from(root.querySelectorAll("mark, small, span, b, strong, i, em, u"));
  for (const el of allInlines) {
    const text = el.textContent?.replace(/\u00a0/g, "").trim() || "";
    if (!text && el.children.length === 0) {
      el.parentNode?.removeChild(el);
    }
  }

  // Pass 4: Remove empty paragraphs (<p></p> or <p><br></p>) if not the only element
  const allPs = Array.from(root.querySelectorAll("p"));
  if (allPs.length > 1) {
    for (const p of allPs) {
      const text = p.textContent?.replace(/\u00a0/g, "").trim() || "";
      const hasContent = text.length > 0 || p.querySelector("img, iframe, a");
      if (!hasContent) {
        p.parentNode?.removeChild(p);
      }
    }
  }
}

/**
 * Text-based normalizer used for initial inputs or raw strings
 */
function cleanEditorHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  let s = html.trim();
  if (s === "<p><br></p>" || s === "<br>" || s === "<p></p>" || !s) return "";

  // Remove comments
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // Remove empty inline formatting tags repeatedly
  let prev = "";
  let guard = 0;
  while (prev !== s && guard++ < 10) {
    prev = s;
    s = s.replace(/<(?:b|strong|i|em|mark|small|u)\b[^>]*>\s*(?:&nbsp;)?\s*<\/(?:b|strong|i|em|mark|small|u)>/gi, "");
    s = s.replace(/<span\b[^>]*>\s*(?:&nbsp;)?\s*<\/span>/gi, "");
  }

  // Collapse duplicate identical wrappers: <mark><mark> -> <mark>
  for (const tag of ["mark", "b", "strong", "i", "em", "small"]) {
    const dupRegex = new RegExp(`<${tag}\\b[^>]*>\\s*<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>\\s*<\\/${tag}>`, "gi");
    guard = 0;
    while (dupRegex.test(s) && guard++ < 5) {
      s = s.replace(dupRegex, `<${tag}>$1</${tag}>`);
    }
  }

  // Remove empty paragraphs
  s = s.replace(/<p\b[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, "");
  s = s.replace(/<p\b[^>]*>\s*$/gi, "");
  s = s.replace(/^\s*<\/p>/gi, "");

  return s.trim();
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Scrivi testo formattato...",
  className,
  minHeight = "160px",
  disabled = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const isInitialMount = useRef(true);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    unorderedList: false,
    orderedList: false,
    link: false,
    highlight: false,
    small: false,
    big: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false
  });

  // Link dialog state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);
  const savedSelectionRef = useRef<Range | null>(null);

  // Initial population of visual content
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      isInitialMount.current = false;
      const initialHtml = plainTextToHtml(value || "");
      editorRef.current.innerHTML = initialHtml;
      setSourceText(formatHtmlForSource(initialHtml));
    }
  }, []);

  const checkAncestorTag = useCallback((tagName: string, classNameFilter?: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === tagName) {
        if (!classNameFilter) return true;
        if (node instanceof HTMLElement && node.classList.contains(classNameFilter)) return true;
      }
      node = node.parentNode;
    }
    return false;
  }, []);

  const getBlockAlignment = useCallback((): "left" | "center" | "right" | null => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && /^(P|DIV|H[1-6]|BLOCKQUOTE)$/i.test(node.nodeName)) {
        const alignAttr = node.getAttribute("align");
        if (alignAttr) return alignAttr.toLowerCase() as "left" | "center" | "right";
        const textAlign = node.style.textAlign;
        if (textAlign) return textAlign.toLowerCase() as "left" | "center" | "right";
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  // Update active formatting states based on cursor position
  const updateActiveFormats = useCallback(() => {
    if (typeof document === "undefined" || isSourceMode) return;
    try {
      const blockAlign = getBlockAlignment();
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        link: !!document.queryCommandValue("createLink") || checkAncestorTag("A"),
        highlight: checkAncestorTag("MARK"),
        small: checkAncestorTag("SMALL"),
        big: checkAncestorTag("SPAN", "text-lg"),
        alignLeft: blockAlign === "left" || document.queryCommandState("justifyLeft"),
        alignCenter: blockAlign === "center" || document.queryCommandState("justifyCenter"),
        alignRight: blockAlign === "right" || document.queryCommandState("justifyRight")
      });
    } catch {
      // ignore
    }
  }, [isSourceMode, checkAncestorTag, getBlockAlignment]);

  // Sync external changes (e.g. discard changes, reset, or draft switch) when editor does not have focus
  useEffect(() => {
    if (!editorRef.current || isInitialMount.current) return;
    if (!isSourceMode) {
      // In visual mode, update innerHTML only if not actively focused or selection is outside editor
      const isFocused =
        document.activeElement === editorRef.current ||
        editorRef.current.contains(document.activeElement);
      const currentHtml = editorRef.current.innerHTML;
      const normalizedValue = plainTextToHtml(value || "");
      if (!isFocused && currentHtml !== normalizedValue) {
        editorRef.current.innerHTML = normalizedValue;
      }
    }
  }, [value, isSourceMode]);

  // Execute standard formatting commands without losing editor selection
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled || isSourceMode) return;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    handleInput();
    updateActiveFormats();
  };

  // Toggle between Visual WYSIWYG and HTML Source mode
  const handleToggleMode = () => {
    if (!isSourceMode) {
      // Switching: Visual -> HTML Source
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : (value || "");
      const formatted = formatHtmlForSource(currentHtml);
      setSourceText(formatted);
      setIsSourceMode(true);
    } else {
      // Switching: HTML Source -> Visual
      const htmlToRender = plainTextToHtml(sourceText || "");
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlToRender;
      }
      onChange(htmlToRender);
      setIsSourceMode(false);

      // Re-focus and update formats after transition
      setTimeout(() => {
        editorRef.current?.focus();
        updateActiveFormats();
      }, 50);
    }
  };

  // Apply or remove an inline wrapper element (e.g. <mark>, <small>, <span class="text-lg">)
  // Ensures inline elements NEVER encapsulate block elements (<p>, <div>, etc.)
  const toggleInlineFormat = (tagName: "MARK" | "SMALL" | "SPAN", className?: string) => {
    if (disabled || isSourceMode) return;
    editorRef.current?.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    // Check if the current selection is within an existing matching inline element
    let existingNode: HTMLElement | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === tagName) {
        if (!className || (node instanceof HTMLElement && node.classList.contains(className))) {
          existingNode = node as HTMLElement;
          break;
        }
      }
      node = node.parentNode;
    }

    if (existingNode) {
      // UNWRAP: Remove existing wrapper
      const parent = existingNode.parentNode;
      if (parent) {
        while (existingNode.firstChild) {
          parent.insertBefore(existingNode.firstChild, existingNode);
        }
        parent.removeChild(existingNode);
      }
    } else if (!range.collapsed) {
      // WRAP: Apply formatting strictly to inline content / text nodes
      // Collect all text nodes intersected by the range
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (n) => {
            if (!range.intersectsNode(n)) return NodeFilter.FILTER_REJECT;
            if (!n.textContent || !n.textContent.trim()) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        textNodes.push(range.commonAncestorContainer as Text);
      } else {
        let currentNode = walker.nextNode();
        while (currentNode) {
          textNodes.push(currentNode as Text);
          currentNode = walker.nextNode();
        }
      }

      if (textNodes.length > 0) {
        for (const tNode of textNodes) {
          const nodeRange = document.createRange();
          const start = tNode === range.startContainer ? range.startOffset : 0;
          const end = tNode === range.endContainer ? range.endOffset : (tNode.textContent?.length || 0);

          if (start < end) {
            nodeRange.setStart(tNode, start);
            nodeRange.setEnd(tNode, end);

            const wrapper = document.createElement(tagName.toLowerCase());
            if (className) wrapper.className = className;

            try {
              nodeRange.surroundContents(wrapper);
            } catch {
              const frag = nodeRange.extractContents();
              wrapper.appendChild(frag);
              nodeRange.insertNode(wrapper);
            }
          }
        }
      } else {
        // Fallback for single inline container
        try {
          const wrapper = document.createElement(tagName.toLowerCase());
          if (className) wrapper.className = className;
          range.surroundContents(wrapper);
        } catch {
          // ignore if surround fails
        }
      }
    }

    if (editorRef.current) {
      normalizeEditorDom(editorRef.current);
    }

    saveSelection();
    handleInput();
    updateActiveFormats();
  };

  // Toggle inline tag wrapper (<small>)
  const handleToggleTag = (tagName: "SMALL") => {
    toggleInlineFormat(tagName);
  };

  // Toggle big text using <span class="text-lg"> (modern, standard alternative to deprecated <big>)
  const handleToggleBig = () => {
    toggleInlineFormat("SPAN", "text-lg");
  };

  // Toggle highlight with <mark> tag
  const handleToggleHighlight = () => {
    toggleInlineFormat("MARK");
  };

  // Set block alignment (left, center, right)
  const handleSetAlignment = (align: "left" | "center" | "right") => {
    if (disabled || isSourceMode) return;
    editorRef.current?.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Find the enclosing block element
    let blockNode: HTMLElement | null = null;
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && /^(P|DIV|H[1-6]|BLOCKQUOTE|LI)$/i.test(node.nodeName)) {
        blockNode = node;
        break;
      }
      node = node.parentNode;
    }

    if (blockNode) {
      const currentAlign = blockNode.style.textAlign || blockNode.getAttribute("align") || "";
      if (currentAlign.toLowerCase() === align) {
        blockNode.style.textAlign = "";
        blockNode.removeAttribute("align");
      } else {
        blockNode.style.textAlign = align;
        blockNode.removeAttribute("align");
      }
    } else {
      // Fallback: use execCommand
      if (align === "left") document.execCommand("justifyLeft", false);
      else if (align === "center") document.execCommand("justifyCenter", false);
      else if (align === "right") document.execCommand("justifyRight", false);
    }

    if (editorRef.current) {
      normalizeEditorDom(editorRef.current);
    }

    saveSelection();
    handleInput();
    updateActiveFormats();
  };

  // Save current selection
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      // Only save if selection is inside this editor
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelectionRef.current && editorRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Open Link dialog
  const handleOpenLinkDialog = () => {
    saveSelection();
    const sel = window.getSelection();
    let existingUrl = "";
    if (sel && sel.rangeCount) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeName === "A") {
          existingUrl = (node as HTMLAnchorElement).getAttribute("href") || "";
          break;
        }
        node = node.parentNode;
      }
    }
    setLinkUrl(existingUrl);
    setLinkTargetBlank(true);
    setIsLinkDialogOpen(true);
  };

  // Apply Link
  const handleApplyLink = () => {
    restoreSelection();
    if (!linkUrl.trim()) {
      executeCommand("unlink");
    } else {
      let finalUrl = linkUrl.trim();
      if (
        !finalUrl.startsWith("http://") &&
        !finalUrl.startsWith("https://") &&
        !finalUrl.startsWith("/") &&
        !finalUrl.startsWith("mailto:") &&
        !finalUrl.startsWith("tel:")
      ) {
        finalUrl = `https://${finalUrl}`;
      }
      executeCommand("createLink", finalUrl);

      if (editorRef.current) {
        const anchors = editorRef.current.querySelectorAll(`a[href="${finalUrl}"]`);
        anchors.forEach((a) => {
          if (linkTargetBlank) {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
          } else {
            a.removeAttribute("target");
            a.removeAttribute("rel");
          }
          a.classList.add("text-primary", "underline", "font-bold");
        });
        handleInput();
      }
    }
    setIsLinkDialogOpen(false);
  };

  // Visual input change
  const handleInput = () => {
    if (!editorRef.current) return;
    normalizeEditorDom(editorRef.current);
    const html = editorRef.current.innerHTML;
    const cleaned = cleanEditorHtml(html);
    if (cleaned === "<p><br></p>" || cleaned === "<br>" || cleaned === "<p></p>" || !cleaned.trim()) {
      onChange("");
    } else {
      onChange(cleaned);
    }
    updateActiveFormats();
  };

  // Handle paste: strip all external HTML styles and paste as clean plain text
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    if (document.queryCommandSupported && document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, text);
    } else {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      selection.deleteFromDocument();
      const textNode = document.createTextNode(text);
      selection.getRangeAt(0).insertNode(textNode);
      selection.collapse(textNode, text.length);
    }
    handleInput();
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        executeCommand("bold");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        executeCommand("italic");
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        handleOpenLinkDialog();
      }
    }
  };

  // Source textarea change
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    const cleaned = cleanEditorHtml(next);
    setSourceText(next);
    onChange(cleaned);
  };

  // Word count & char count
  const rawContent = isSourceMode ? sourceText : (value || "");
  const plainText = rawContent.replace(/<[^>]+>/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = plainText.length;

  return (
    <div
      className={cn(
        "w-full rounded-2xl bg-background border border-foreground/10 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden flex flex-col",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-muted/20 border-b border-foreground/10 select-none">
        <div className="flex flex-wrap items-center gap-1">
          {/* Bold */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("bold")}
            disabled={isSourceMode}
            title="Grassetto (Ctrl/Cmd + B)"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.bold
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Bold size={15} strokeWidth={2.5} />
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("italic")}
            disabled={isSourceMode}
            title="Corsivo (Ctrl/Cmd + I)"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.italic
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Italic size={15} strokeWidth={2.5} />
          </button>

          {/* Highlight / Colore Primario */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleHighlight}
            disabled={isSourceMode}
            title="Frase in risalto / Citazione (Colore primario)"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.highlight
                ? "bg-primary text-white shadow-sm"
                : "text-primary/80 hover:bg-primary/10 hover:text-primary"
            )}
          >
            <Highlighter size={15} strokeWidth={2.5} />
          </button>

          <div className="w-[1px] h-4 bg-foreground/10 mx-1" />

          {/* Small text (<small>) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleToggleTag("SMALL")}
            disabled={isSourceMode}
            title="Testo piccolo (<small>)"
            className={cn(
              "px-2 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.small
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="text-[10px] uppercase font-bold tracking-tight">Small</span>
          </button>

          {/* Big text (<span class="text-lg"> - standard alternative to deprecated <big>) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleBig}
            disabled={isSourceMode}
            title="Testo grande (alternativa moderna standard a <big>)"
            className={cn(
              "px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.big
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Type size={13} strokeWidth={2.5} />
            <span className="text-[11px] font-bold">Big</span>
          </button>

          <div className="w-[1px] h-4 bg-foreground/10 mx-1" />

          {/* Align Left */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSetAlignment("left")}
            disabled={isSourceMode}
            title="Allinea a sinistra"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.alignLeft
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <AlignLeft size={15} strokeWidth={2.2} />
          </button>

          {/* Align Center */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSetAlignment("center")}
            disabled={isSourceMode}
            title="Centra testo"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.alignCenter
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <AlignCenter size={15} strokeWidth={2.2} />
          </button>

          {/* Align Right */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSetAlignment("right")}
            disabled={isSourceMode}
            title="Allinea a destra"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.alignRight
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <AlignRight size={15} strokeWidth={2.2} />
          </button>

          <div className="w-[1px] h-4 bg-foreground/10 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("insertUnorderedList")}
            disabled={isSourceMode}
            title="Elenco puntato"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.unorderedList
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <List size={15} strokeWidth={2.5} />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("insertOrderedList")}
            disabled={isSourceMode}
            title="Elenco numerato"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.orderedList
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <ListOrdered size={15} strokeWidth={2.5} />
          </button>

          <div className="w-[1px] h-4 bg-foreground/10 mx-1" />

          {/* Link */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleOpenLinkDialog}
            disabled={isSourceMode}
            title="Inserisci Link (Ctrl/Cmd + K)"
            className={cn(
              "p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none",
              activeFormats.link
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <LinkIcon size={15} strokeWidth={2.2} />
          </button>

          {/* Unlink */}
          {activeFormats.link && !isSourceMode && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("unlink")}
              title="Rimuovi Link"
              className="p-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center"
            >
              <Unlink size={15} />
            </button>
          )}

          {/* Remove Format */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("removeFormat")}
            disabled={isSourceMode}
            title="Pulisci formattazione"
            className="p-2 rounded-xl text-xs font-bold text-foreground/50 hover:bg-muted/50 hover:text-foreground transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
          >
            <RemoveFormatting size={15} />
          </button>
        </div>

        {/* Source Mode Toggle */}
        <div className="flex items-center gap-1.5">
          {isSourceMode && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-mono font-bold">
              Codice HTML
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleMode}
            title={isSourceMode ? "Torna alla modalità visuale" : "Modifica codice HTML sorgente"}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
              isSourceMode
                ? "bg-secondary text-white hover:bg-secondary/90 ring-2 ring-secondary/20"
                : "text-foreground/60 hover:bg-muted/50 hover:text-foreground border border-foreground/10"
            )}
          >
            {isSourceMode ? <Eye size={14} /> : <Code size={14} />}
            <span>{isSourceMode ? "Torna a Visuale" : "Modifica HTML"}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area: Both elements remain mounted in DOM to guarantee zero data loss */}
      <div className="relative flex-1">
        {/* Visual WYSIWYG View */}
        <div
          className={cn("w-full h-full p-4 outline-none", isSourceMode && "hidden")}
          style={{ minHeight }}
        >
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onKeyUp={() => {
              saveSelection();
              updateActiveFormats();
            }}
            onMouseUp={() => {
              saveSelection();
              updateActiveFormats();
            }}
            style={{ minHeight: "120px" }}
            data-placeholder={placeholder}
            className="w-full h-full outline-none text-sm text-foreground leading-relaxed font-medium empty:before:content-[attr(data-placeholder)] empty:before:text-foreground/20 empty:before:pointer-events-none [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-bold [&_strong]:text-foreground [&_b]:font-bold [&_b]:text-foreground [&_mark_strong]:text-inherit [&_mark_b]:text-inherit [&_em]:font-serif [&_em]:italic [&_em]:font-normal [&_em]:text-foreground/95 [&_i]:font-serif [&_i]:italic [&_i]:font-normal [&_i]:text-foreground/95 [&_mark_em]:text-inherit [&_mark_i]:text-inherit [&_mark]:bg-transparent [&_mark]:text-primary [&_mark]:font-inherit [&_mark_*]:text-inherit [&_em_mark]:font-serif [&_em_mark]:italic [&_em_mark]:text-primary [&_i_mark]:font-serif [&_i_mark]:italic [&_i_mark]:text-primary [&_mark_em]:font-serif [&_mark_em]:italic [&_mark_em]:text-primary [&_mark_i]:font-serif [&_mark_i]:italic [&_mark_i]:text-primary [&_strong_mark]:font-bold [&_mark_strong]:font-bold [&_mark_strong]:text-primary [&_b_mark]:font-bold [&_mark_b]:font-bold [&_mark_b]:text-primary [&_mark_b_i]:text-primary [&_mark_i_b]:text-primary [&_i_mark_b]:text-primary [&_b_mark_i]:text-primary [&_small]:text-[0.85em] [&_small]:opacity-80 [&_small]:leading-normal [&_.text-lg]:text-[1.18em] [&_.text-lg]:leading-snug [&_a]:text-primary [&_a]:underline [&_a]:font-bold"
          />
        </div>

        {/* HTML Source Code View */}
        <div
          className={cn("w-full h-full p-3 bg-muted/10", !isSourceMode && "hidden")}
          style={{ minHeight }}
        >
          <textarea
            value={sourceText}
            onChange={handleSourceChange}
            style={{ minHeight: "140px" }}
            className="w-full h-full p-3 bg-background/50 border border-foreground/10 rounded-xl text-foreground font-mono text-xs outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 resize-y leading-relaxed custom-scrollbar placeholder:text-foreground/20"
            placeholder="<p>Inserisci codice HTML o testo semplice...</p>"
          />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="px-4 py-2 bg-muted/10 border-t border-foreground/5 flex items-center justify-between text-[11px] text-foreground/40 font-medium">
        <div className="flex items-center gap-2">
          <span>{wordCount} parole</span>
          <span>•</span>
          <span>{charCount} caratteri</span>
        </div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-foreground/30">
          {isSourceMode ? "HTML Raw View" : "WYSIWYG Visual"}
        </div>
      </div>

      {/* Inline Link Modal Dialog */}
      {isLinkDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsLinkDialogOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#131b2e] border border-foreground/15 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon size={16} className="text-primary" />
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Inserisci Collegamento (Link)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkDialogOpen(false)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
                  URL Destinazione
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... oppure /Spettacoli"
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl bg-background border border-foreground/10 focus:border-primary focus:outline-none text-xs font-mono text-foreground placeholder:text-foreground/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyLink();
                    }
                  }}
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-foreground/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkTargetBlank}
                  onChange={(e) => setLinkTargetBlank(e.target.checked)}
                  className="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary/20 accent-primary"
                />
                <span>Apri link in una nuova scheda (_blank)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setIsLinkDialogOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-foreground/60 hover:bg-muted/40 rounded-xl transition-all"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={2.5} /> Applica Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
