"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, X, ArrowLeft } from "lucide-react";

export function PreviewBanner({ content }: { content?: any }) {
  const [show, setShow] = useState(false);
  const ui = content || {};

  useEffect(() => {
    if (typeof window === "undefined") return;

    // NEVER show inside an iframe
    let isFramed = false;
    try {
      isFramed = window.self !== window.top;
    } catch {
      isFramed = true;
    }
    if (isFramed) return;

    // Check if ?preview=1 is in URL or was stored for this tab session
    const urlParams = new URLSearchParams(window.location.search);
    const hasPreviewParam = urlParams.get("preview") === "1";

    if (hasPreviewParam) {
      try {
        sessionStorage.setItem("attomatti_preview_mode", "1");
      } catch {}
      setShow(true);
      document.documentElement.classList.add("has-preview-banner");
    } else {
      try {
        if (sessionStorage.getItem("attomatti_preview_mode") === "1") {
          setShow(true);
          document.documentElement.classList.add("has-preview-banner");
        }
      } catch {}
    }

    return () => {
      document.documentElement.classList.remove("has-preview-banner");
    };
  }, []);

  const handleExit = () => {
    try {
      sessionStorage.removeItem("attomatti_preview_mode");
    } catch {}
    document.documentElement.classList.remove("has-preview-banner");
    setShow(false);

    // Remove ?preview=1 from URL and reload cleanly
    const url = new URL(window.location.href);
    url.searchParams.delete("preview");
    window.location.href = url.pathname + (url.search ? url.search : "") + url.hash;
  };

  if (!show) return null;

  return (
    <aside
      aria-label={ui.aria_label || "Modalità Anteprima Bozza"}
      className="fixed top-0 left-0 right-0 z-[60] h-10 sm:h-11 bg-amber-500/95 hover:bg-amber-500 text-slate-950 shadow-lg backdrop-blur-md transition-all flex items-center justify-between px-3 sm:px-6 text-xs select-none border-b border-amber-600/30"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950" />
        </span>

        <div className="flex items-center gap-1.5 shrink-0 uppercase tracking-wider font-black text-[10px] sm:text-xs bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full shadow-sm">
          <Eye size={12} />
          <span>{ui.badge || "Anteprima Live"}</span>
        </div>

        <span className="hidden md:inline truncate text-[11px] text-slate-900 font-semibold">
          {ui.message || "Stai visualizzando il sito con le modifiche non pubblicate sincronizzate in tempo reale dal CMS."}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 transition-colors text-[11px] font-bold"
          title={ui.admin_title || "Torna al pannello di amministrazione"}
        >
          <ArrowLeft size={12} />
          <span>{ui.admin_button || "Pannello CMS"}</span>
        </Link>

        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950 text-white hover:bg-slate-900 transition-colors text-[11px] font-bold shadow-sm"
          title={ui.exit_title || "Esci dalla modalità anteprima e torna alla versione pubblica"}
        >
          <X size={12} />
          <span>{ui.exit_button || "Esci dall'anteprima"}</span>
        </button>
      </div>
    </aside>
  );
}
