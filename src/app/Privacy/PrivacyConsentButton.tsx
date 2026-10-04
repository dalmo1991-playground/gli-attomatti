"use client";

import React from "react";
import { Sliders } from "lucide-react";

export default function PrivacyConsentButton({ label }: { label?: string }) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cookie-banner"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold text-xs uppercase tracking-wider transition-colors"
    >
      <Sliders size={14} className="text-primary" />
      <span>{label || "Modifica preferenze sui cookie"}</span>
    </button>
  );
}
