"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Undo2, ArrowRight } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiffModal({ isOpen, onClose }: DiffModalProps) {
  const { diffList, discardChanges, handlePublish, isPublishing } = useAdmin();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-background border border-foreground/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-foreground/5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                Riepilogo Modifiche
              </h3>
              <p className="text-xs text-foreground/40 font-medium">
                {diffList.length} {diffList.length === 1 ? "campo modificato" : "campi modificati"} rispetto alla versione pubblicata
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-foreground/40 hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* List of Diffs */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {diffList.length === 0 ? (
              <div className="text-center py-12 text-foreground/40 font-medium text-sm">
                Nessuna modifica rilevata. Tutto è sincronizzato!
              </div>
            ) : (
              diffList.map((diff, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-muted/20 border border-foreground/5 rounded-2xl space-y-2 text-xs"
                >
                  <div className="font-mono font-bold text-primary text-[11px] truncate">
                    {diff.path}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block mb-1">
                        Precedente
                      </span>
                      <pre className="font-mono text-[11px] text-foreground/60 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                        {typeof diff.oldVal === "object"
                          ? JSON.stringify(diff.oldVal, null, 2)
                          : String(diff.oldVal ?? "(vuoto)")}
                      </pre>
                    </div>

                    <div className="p-2.5 rounded-xl bg-green-500/5 border border-green-500/10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-400 block mb-1">
                        Nuovo
                      </span>
                      <pre className="font-mono text-[11px] text-foreground/90 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                        {typeof diff.newVal === "object"
                          ? JSON.stringify(diff.newVal, null, 2)
                          : String(diff.newVal ?? "(vuoto)")}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-foreground/5 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                discardChanges();
                onClose();
              }}
              disabled={diffList.length === 0}
              className="text-xs font-bold text-foreground/40 hover:text-red-400 flex items-center gap-1.5 transition-colors disabled:opacity-30"
            >
              <Undo2 size={14} /> Annulla tutte le modifiche
            </button>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-foreground/10 text-xs font-bold hover:bg-muted transition-colors"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handlePublish();
                }}
                disabled={isPublishing || diffList.length === 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isPublishing ? "Pubblicazione..." : "Pubblica su GitHub"}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
