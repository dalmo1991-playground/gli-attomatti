"use client";

import React from "react";
import { Sliders } from "lucide-react";
import { defaultText } from "@/lib/utils";

export default function PrivacyConsentButton({ label }: { label?: string | null }) {
  const effectiveLabel = defaultText(label, "Modifica preferenze sui cookie");

  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cookie-banner"));
    }
  };

  if (!effectiveLabel) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold text-xs uppercase tracking-wider transition-colors"
    >
      <Sliders size={14} className="text-primary" />
      <span>{effectiveLabel}</span>
    </button>
  );
}
