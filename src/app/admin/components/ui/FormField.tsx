"use client";

import React from "react";
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
  return (
    <div className={cn("space-y-2 w-full", className)}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-wider text-foreground/50">
          {label}
        </label>
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

      {type === "textarea" || type === "richtext" ? (
        <RichTextEditor
          value={typeof value === "string" ? value : String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
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
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
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
