"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, ExternalLink, X } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export function Toast() {
  const { publishStatus, setPublishStatus } = useAdmin();

  if (!publishStatus) return null;

  const isSuccess = publishStatus.type === "success";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[130] max-w-md w-full p-4 rounded-3xl shadow-2xl backdrop-blur-xl border border-foreground/10 bg-background/95"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-2xl shrink-0 mt-0.5">
            {isSuccess ? (
              <CheckCircle2 size={24} className="text-emerald-400" />
            ) : (
              <AlertCircle size={24} className="text-rose-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h5 className="font-bold text-sm text-foreground">
              {isSuccess ? "Pubblicazione Riuscita!" : "Attenzione"}
            </h5>
            <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">
              {publishStatus.msg}
            </p>

            {publishStatus.branch && (
              <div className="mt-2 text-[11px] font-mono font-medium text-foreground/50 flex items-center gap-2">
                <span>Ramo:</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {publishStatus.branch}
                </span>
              </div>
            )}

            {publishStatus.commitUrl && (
              <div className="mt-2">
                <a
                  href={publishStatus.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                >
                  Vedi commit su GitHub ({publishStatus.shortSha || "dettagli"})
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          <button
            onClick={() => setPublishStatus(null)}
            className="p-1.5 text-foreground/40 hover:text-foreground rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
