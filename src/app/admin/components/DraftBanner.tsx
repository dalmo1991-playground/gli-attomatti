"use client";

import React from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export function DraftBanner() {
  const { recoverableDraft, restoreDraft, dismissDraft } = useAdmin();

  if (!recoverableDraft) return null;

  return (
    <div className="mb-6 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0 mt-0.5 sm:mt-0">
          <History size={18} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <span>Bozza non salvata recuperata</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              {recoverableDraft.diffCount} modifiche
            </span>
          </h4>
          <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">
            È stata rilevata una sessione precedente salvata in locale alle{" "}
            <span className="font-semibold text-amber-400">{recoverableDraft.dateStr}</span>.
            Vuoi ripristinare i tuoi progressi o continuare con la versione online?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={dismissDraft}
          className="px-3 py-1.5 bg-muted/40 hover:bg-muted/60 text-foreground/60 hover:text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <Trash2 size={13} /> Ignora ed Elimina
        </button>
        <button
          type="button"
          onClick={restoreDraft}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
        >
          <RotateCcw size={13} /> Ripristina Bozza
        </button>
      </div>
    </div>
  );
}
