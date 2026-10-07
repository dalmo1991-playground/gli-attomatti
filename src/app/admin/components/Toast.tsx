"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, ExternalLink, X } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export function Toast() {
  const { publishStatus, setPublishStatus } = useAdmin();

  if (!publishStatus) return null;

  const isSuccess = publishStatus.type === "success";
  const isDeploying = publishStatus.type === "deploying" || publishStatus.isDeploying;

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
            {isDeploying ? (
              <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 size={24} className="text-emerald-400" />
            ) : (
              <AlertCircle size={24} className="text-rose-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h5 className="font-bold text-sm text-foreground">
              {isDeploying
                ? "Distribuzione Vercel in Corso..."
                : isSuccess
                ? "Pubblicazione Riuscita!"
                : "Attenzione"}
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

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {isSuccess && (
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  <span>Apri Sito Aggiornato</span>
                  <ExternalLink size={11} />
                </a>
              )}

              {publishStatus.commitUrl && (
                <a
                  href={publishStatus.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-primary transition-colors"
                >
                  <span>Commit ({publishStatus.shortSha || "dettagli"})</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
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
