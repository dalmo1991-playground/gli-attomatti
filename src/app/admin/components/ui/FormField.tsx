"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: "text" | "textarea" | "number" | "switch" | "select";
  placeholder?: string;
  helpText?: string;
  className?: string;
  rows?: number;
  options?: { label: string; value: string }[];
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
  options = []
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

      {type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-4 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground resize-y leading-relaxed placeholder:text-foreground/20"
        />
      ) : type === "select" ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3.5 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground cursor-pointer"
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
          className="w-full p-3.5 rounded-2xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-foreground placeholder:text-foreground/20"
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
