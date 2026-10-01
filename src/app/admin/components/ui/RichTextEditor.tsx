"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  Code,
  Eye,
  Check,
  X
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

/**
 * Ensures text has proper HTML structure:
 * Converts plain text newlines (\n\n -> <p>, \n -> <br>) if no HTML tags exist.
 */
function plainTextToHtml(text: string): string {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  // If it already contains HTML block or inline tags, keep it as HTML
  if (/<(?:p|div|ul|ol|li|br|strong|b|em|i|a|h[1-6])\b[^>]*>/i.test(trimmed)) {
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
    link: false
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

  // Sync external changes (e.g. discard changes, reset, or draft switch) when not focused
  useEffect(() => {
    if (!editorRef.current || isInitialMount.current) return;
    if (isSourceMode) {
      // In source mode, keep sourceText in sync if value changed externally
      if (value !== sourceText) {
        setSourceText(value || "");
      }
    } else {
      // In visual mode, update innerHTML if not actively focused
      const currentHtml = editorRef.current.innerHTML;
      const normalizedValue = plainTextToHtml(value || "");
      if (document.activeElement !== editorRef.current && currentHtml !== normalizedValue) {
        editorRef.current.innerHTML = normalizedValue;
      }
    }
  }, [value, isSourceMode]);

  // Update active formatting states based on cursor position
  const updateActiveFormats = useCallback(() => {
    if (!document || isSourceMode) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        link: !!document.queryCommandValue("createLink") || checkAncestorTag("A")
      });
    } catch {
      // ignore
    }
  }, [isSourceMode]);

  const checkAncestorTag = (tagName: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === tagName) return true;
      node = node.parentNode;
    }
    return false;
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

  // Execute standard formatting commands
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled || isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
    updateActiveFormats();
  };

  // Save current selection for link dialog
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelectionRef.current) {
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
    const html = editorRef.current.innerHTML;
    if (html === "<p><br></p>" || html === "<br>" || html.trim() === "") {
      onChange("");
    } else {
      onChange(html);
    }
    updateActiveFormats();
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
    setSourceText(next);
    onChange(next);
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

          <div className="w-[1px] h-4 bg-foreground/10 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
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
            onKeyDown={handleKeyDown}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            style={{ minHeight: "120px" }}
            data-placeholder={placeholder}
            className="w-full h-full outline-none text-sm text-foreground leading-relaxed font-medium empty:before:content-[attr(data-placeholder)] empty:before:text-foreground/20 empty:before:pointer-events-none [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-bold [&_strong]:text-foreground [&_em]:italic [&_a]:text-primary [&_a]:underline [&_a]:font-bold"
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
