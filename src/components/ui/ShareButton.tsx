"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";
import { trackShare } from "@/lib/tracking";

export interface ShareButtonProps {
  title?: string;
  url?: string;
  description?: string;
  variant?: "icon" | "button" | "card";
  label?: string;
  className?: string;
  uiContent?: Record<string, unknown>;
}

export function ShareButton({
  title,
  url,
  description,
  variant = "icon",
  label = "Condividi",
  className = "",
  uiContent
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getShareData = () => {
    const effectiveTitle = title || (typeof document !== "undefined" ? document.title : "Gli Attomatti");
    const effectiveUrl = url || (typeof window !== "undefined" ? window.location.href : "https://attomatti.ch");
    const effectiveText = description || "Gli Attomatti — Compagnia di improvvisazione e teatro a Zurigo.";
    return { title: effectiveTitle, url: effectiveUrl, text: effectiveText };
  };

  const handleShareClick = async () => {
    const data = getShareData();

    // Check if navigator.share is supported
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });
        trackShare("native", data.url, data.title);
        return;
      } catch (err: unknown) {
        // If user cancelled, don't fallback to modal unless it was an AbortError due to not allowed
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // If error or unsupported payload, fallback to modal
      }
    }

    // Fallback to desktop modal
    setIsModalOpen(true);
  };

  const shareData = getShareData();

  return (
    <>
      {variant === "icon" && (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label={typeof uiContent?.share_aria_label === "string" ? uiContent.share_aria_label : label}
          title={label}
          className={`w-10 h-10 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95 cursor-pointer ${className}`}
        >
          <Share2 size={18} />
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={handleShareClick}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-foreground/10 bg-muted/20 text-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95 shadow-2xs cursor-pointer ${className}`}
        >
          <Share2 size={16} className="shrink-0" />
          <span>{label}</span>
        </button>
      )}

      {variant === "card" && (
        <button
          type="button"
          onClick={handleShareClick}
          className={`w-full flex items-center justify-between gap-4 p-5 rounded-[2rem] border border-foreground/10 bg-muted/10 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 active:scale-[0.99] group text-left cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 size={18} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-foreground">
                {label}
              </div>
              <div className="text-[11px] text-foreground/50 font-medium">
                Invita amici allo spettacolo
              </div>
            </div>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-primary group-hover:translate-x-1 transition-transform">
            Invia →
          </span>
        </button>
      )}

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={shareData.title}
        url={shareData.url}
        description={shareData.text}
        uiContent={uiContent}
      />
    </>
  );
}
