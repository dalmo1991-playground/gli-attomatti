"use client";

import React, { useRef, useState, useMemo } from "react";
import { Link as LinkIcon, Check, X, Tag as TagIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./RichTextEditor";

export type AutocompleteTagItem =
  | string
  | {
      key: string;
      source?: "subcase" | "json" | "standard" | "mapping" | string;
      label?: string;
      example?: string;
    };

interface FormFieldProps {
  label?: string;
  value: any;
  onChange: (value: any) => void;
  type?: "text" | "textarea" | "richtext" | "number" | "switch" | "select" | "email" | "url" | "tel" | "password" | "date" | "time" | string;
  placeholder?: string;
  helpText?: string;
  className?: string;
  rows?: number;
  options?: { label: string; value: string }[];
  required?: boolean;
  disabled?: boolean;
  autocompleteTags?: AutocompleteTagItem[];
}

export function FormField({
  label = "",
  value,
  onChange,
  type = "text",
  placeholder = "",
  helpText,
  className,
  rows = 4,
  options = [],
  required,
  disabled,
  autocompleteTags = []
}: FormFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [savedSelection, setSavedSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  // Autocomplete state
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteMatchStart, setAutocompleteMatchStart] = useState(-1);
  const [highlightedTagIndex, setHighlightedTagIndex] = useState(0);

  const isTextOrTextarea = (type === "text" || type === "textarea") && !disabled;
  const hasAutocomplete = Boolean(autocompleteTags && autocompleteTags.length > 0 && isTextOrTextarea);

  // Normalize tags
  const normalizedTags = useMemo(() => {
    if (!autocompleteTags) return [];
    return autocompleteTags.map((t) => (typeof t === "string" ? { key: t } : t));
  }, [autocompleteTags]);

  // Filter tags based on user input
  const filteredTags = useMemo(() => {
    if (!isAutocompleteOpen && !isTagPickerOpen) return [];
    const q = autocompleteQuery.trim().toLowerCase();
    if (!q) return normalizedTags;
    return normalizedTags.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        (t.label && t.label.toLowerCase().includes(q)) ||
        (t.example && t.example.toLowerCase().includes(q))
    );
  }, [normalizedTags, autocompleteQuery, isAutocompleteOpen, isTagPickerOpen]);

  const checkAutocompleteTrigger = (text: string, cursorPos: number) => {
    if (!hasAutocomplete) return;
    const textBefore = text.substring(0, cursorPos);
    const match = textBefore.match(/\{\{([a-zA-Z0-9_.-]*)$/);
    if (match) {
      const query = match[1];
      const matchStart = cursorPos - match[0].length;
      setAutocompleteQuery(query);
      setAutocompleteMatchStart(matchStart);
      setHighlightedTagIndex(0);
      setIsAutocompleteOpen(true);
      setIsTagPickerOpen(false);
    } else {
      setIsAutocompleteOpen(false);
    }
  };

  const handleInsertTag = (tagKey: string) => {
    const el = type === "textarea" ? textareaRef.current : inputRef.current;
    const currentVal = String(value ?? "");
    const tagToInsert = `{{${tagKey}}}`;

    let start = 0;
    let end = 0;

    if (isAutocompleteOpen && autocompleteMatchStart >= 0) {
      start = autocompleteMatchStart;
      const cursorPos = el?.selectionStart ?? currentVal.length;
      end = cursorPos;
      // If closing }} already exists right after cursor, replace it too
      const after = currentVal.substring(end);
      if (after.startsWith("}}")) {
        end += 2;
      } else if (after.startsWith("}")) {
        end += 1;
      }
    } else if (el && typeof el.selectionStart === "number") {
      start = el.selectionStart;
      end = el.selectionEnd ?? start;
    } else {
      start = currentVal.length;
      end = currentVal.length;
    }

    const newVal = currentVal.substring(0, start) + tagToInsert + currentVal.substring(end);
    onChange(newVal);
    setIsAutocompleteOpen(false);
    setIsTagPickerOpen(false);

    setTimeout(() => {
      if (el) {
        el.focus();
        const newPos = start + tagToInsert.length;
        el.setSelectionRange(newPos, newPos);
      }
    }, 30);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((isAutocompleteOpen || isTagPickerOpen) && filteredTags.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedTagIndex((prev) => (prev + 1) % filteredTags.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedTagIndex((prev) => (prev - 1 + filteredTags.length) % filteredTags.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selectedTag = filteredTags[highlightedTagIndex];
        if (selectedTag) {
          handleInsertTag(selectedTag.key);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsAutocompleteOpen(false);
        setIsTagPickerOpen(false);
        return;
      }
    }
  };

  const handleOpenLinkDialog = () => {
    const el = type === "textarea" ? textareaRef.current : inputRef.current;
    let selected = "";
    let start = 0;
    let end = 0;

    if (el && typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
      start = el.selectionStart;
      end = el.selectionEnd;
      selected = el.value.substring(start, end);
    } else {
      const currentVal = String(value ?? "");
      start = currentVal.length;
      end = currentVal.length;
    }

    setSavedSelection({ start, end });
    setLinkText(selected);
    setLinkUrl("");
    setIsLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      setIsLinkDialogOpen(false);
      return;
    }

    const currentVal = String(value ?? "");
    const finalLabel = linkText.trim() || linkUrl.trim();
    let finalUrl = linkUrl.trim();

    // If not starting with /, #, http, https, mailto, tel -> default to https://
    if (
      !finalUrl.startsWith("/") &&
      !finalUrl.startsWith("#") &&
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://") &&
      !finalUrl.startsWith("mailto:") &&
      !finalUrl.startsWith("tel:")
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    const markdownLink = `[${finalLabel}](${finalUrl})`;
    const newVal =
      currentVal.substring(0, savedSelection.start) +
      markdownLink +
      currentVal.substring(savedSelection.end);

    onChange(newVal);
    setIsLinkDialogOpen(false);

    // Focus back after insert
    setTimeout(() => {
      const el = type === "textarea" ? textareaRef.current : inputRef.current;
      if (el) {
        el.focus();
        const cursor = savedSelection.start + markdownLink.length;
        el.setSelectionRange(cursor, cursor);
      }
    }, 50);
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {(label || hasAutocomplete || isTextOrTextarea || type === "switch") && (
        <div className="flex justify-between items-center">
          {label ? (
            <label className="text-xs font-black uppercase tracking-wider text-foreground/50">
              {label}
            </label>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
          {hasAutocomplete && (
            <button
              type="button"
              onClick={() => {
                setIsTagPickerOpen(!isTagPickerOpen);
                setAutocompleteQuery("");
                setHighlightedTagIndex(0);
                setIsAutocompleteOpen(false);
              }}
              title="Visualizza e inserisci tag dinamico {{...}}"
              className="text-[11px] text-accent/80 hover:text-accent font-bold flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-accent/10 hover:bg-accent/20 cursor-pointer"
            >
              <TagIcon size={11} />
              <span>Tag {"{...}"}</span>
            </button>
          )}
          {isTextOrTextarea && (
            <button
              type="button"
              onClick={handleOpenLinkDialog}
              title="Inserisci link nel testo: [testo](url)"
              className="text-[11px] text-primary/80 hover:text-primary font-bold flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 cursor-pointer"
            >
              <LinkIcon size={12} />
              <span>Link</span>
            </button>
          )}
          {type === "switch" && (
            <button
              type="button"
              onClick={() => onChange(!value)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5",
                value ? "bg-primary" : "bg-muted border border-foreground/10"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                  value ? "translate-x-6" : "translate-x-0"
                )}
              />
            </button>
          )}
        </div>
      </div>
    )}

      {/* Inline Link Modal Dialog */}
      {isLinkDialogOpen && (
        <div className="p-3.5 rounded-2xl bg-muted/90 border border-primary/30 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              <LinkIcon size={13} /> Inserisci Link nel Testo
            </span>
            <button
              type="button"
              onClick={() => setIsLinkDialogOpen(false)}
              className="text-foreground/40 hover:text-foreground cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Testo visibile del link (es. Scopri di più)"
              className="p-2 rounded-xl bg-background border border-foreground/10 text-foreground outline-none focus:border-primary font-medium"
            />
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyLink();
                }
              }}
              placeholder="URL (es. /Spettacoli o https://...)"
              className="p-2 rounded-xl bg-background border border-foreground/10 text-foreground outline-none focus:border-primary font-medium"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-foreground/50 pt-1">
            <span>
              Genera: <code className="text-primary font-mono font-bold">[{linkText || "testo"}]({linkUrl || "url"})</code>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsLinkDialogOpen(false)}
                className="px-2.5 py-1 rounded-lg border border-foreground/10 hover:bg-background text-foreground/60 font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                disabled={!linkUrl.trim()}
                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <Check size={12} /> Inserisci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Field Control with Floating Autocomplete */}
      <div className="relative w-full">
        {type === "richtext" ? (
          <RichTextEditor
            value={typeof value === "string" ? value : String(value ?? "")}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
          />
        ) : type === "textarea" ? (
          <textarea
            ref={textareaRef}
            value={value ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val);
              checkAutocompleteTrigger(val, e.target.selectionStart ?? val.length);
            }}
            onKeyUp={(e) => {
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") {
                const el = e.currentTarget;
                checkAutocompleteTrigger(el.value, el.selectionStart ?? el.value.length);
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                setIsAutocompleteOpen(false);
                setIsTagPickerOpen(false);
              }, 180);
            }}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className="w-full p-3.5 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground placeholder:text-foreground/20 disabled:opacity-50 resize-y"
          />
        ) : type === "select" ? (
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full p-3.5 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground cursor-pointer disabled:opacity-50"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === "switch" ? null : (
          <input
            ref={inputRef}
            type={type}
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(type === "number" ? (raw === "" ? "" : Number(raw)) : raw);
              checkAutocompleteTrigger(raw, e.target.selectionStart ?? raw.length);
            }}
            onKeyUp={(e) => {
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") {
                const el = e.currentTarget;
                checkAutocompleteTrigger(el.value, el.selectionStart ?? el.value.length);
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                setIsAutocompleteOpen(false);
                setIsTagPickerOpen(false);
              }, 180);
            }}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full p-3.5 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground placeholder:text-foreground/20 disabled:opacity-50"
          />
        )}

        {/* Floating Custom Tag Autocomplete Menu */}
        {(isAutocompleteOpen || isTagPickerOpen) && filteredTags.length > 0 && (
          <div
            className="absolute z-50 left-0 right-0 top-full mt-1.5 p-1.5 rounded-2xl bg-slate-900/95 border border-primary/30 shadow-2xl backdrop-blur-md max-h-56 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary/80 border-b border-foreground/5 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-primary" /> Tag Personalizzati ({filteredTags.length})
              </span>
              <span className="text-foreground/40 font-mono text-[9px] lowercase">
                ↑↓ seleziona • invio inserisce
              </span>
            </div>
            {filteredTags.map((tag, idx) => {
              const isSelected = idx === highlightedTagIndex;
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => handleInsertTag(tag.key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer",
                    isSelected ? "bg-primary/20 text-white border border-primary/30" : "hover:bg-foreground/5 text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-primary font-mono font-bold shrink-0">
                      {"{{" + tag.key + "}}"}
                    </code>
                    {tag.example && (
                      <span className="text-[11px] text-foreground/50 truncate italic">
                        ({tag.example})
                      </span>
                    )}
                  </div>
                  {tag.source && (
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0",
                        tag.source === "subcase"
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : tag.source === "json"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : tag.source === "mapping"
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                          : "bg-foreground/10 text-foreground/60"
                      )}
                    >
                      {tag.source}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-[11px] text-foreground/40 font-medium">
          {helpText}
        </p>
      )}
    </div>
  );
}
