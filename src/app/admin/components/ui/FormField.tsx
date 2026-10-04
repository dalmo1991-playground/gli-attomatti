"use client";

import React, { useRef, useState } from "react";
import { Link as LinkIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./RichTextEditor";

interface FormFieldProps {
  label: string;
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
}

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  helpText,
  className,
  rows = 4,
  options = [],
  required,
  disabled
}: FormFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [savedSelection, setSavedSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  const isTextOrTextarea = (type === "text" || type === "textarea") && !disabled;

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
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-wider text-foreground/50">
          {label}
        </label>
        <div className="flex items-center gap-2">
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
          onChange={(e) => onChange(e.target.value)}
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
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full p-3.5 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground placeholder:text-foreground/20 disabled:opacity-50"
        />
      )}

      {helpText && (
        <p className="text-[11px] text-foreground/40 font-medium">
          {helpText}
        </p>
      )}
    </div>
  );
}
