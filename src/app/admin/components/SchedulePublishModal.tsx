"use client";

import React, { useState } from "react";
import { CalendarClock, X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

interface SchedulePublishModalProps {
  onClose: () => void;
}

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SchedulePublishModal({ onClose }: SchedulePublishModalProps) {
  const {
    activeBranch,
    scheduledPublish,
    isScheduling,
    schedulePublish,
    cancelScheduledPublish
  } = useAdmin();

  const [dateTimeValue, setDateTimeValue] = useState(() =>
    scheduledPublish?.publishAt
      ? toLocalDateTimeInputValue(new Date(scheduledPublish.publishAt))
      : toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000))
  );
  const [commitMessage, setCommitMessage] = useState(() => scheduledPublish?.commitMessage || "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [bounds] = useState(() => {
    const now = Date.now();
    return {
      min: toLocalDateTimeInputValue(new Date(now + 2 * 60 * 1000)),
      max: toLocalDateTimeInputValue(new Date(now + 7 * 24 * 60 * 60 * 1000 - 60 * 1000))
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!dateTimeValue) {
      setLocalError("Seleziona una data e un'ora.");
      return;
    }

    const parsed = new Date(dateTimeValue);
    if (Number.isNaN(parsed.getTime())) {
      setLocalError("Formato data non valido.");
      return;
    }

    const ok = await schedulePublish(parsed.toISOString(), commitMessage);
    if (ok) {
      onClose();
    }
  };

  const handleCancelExisting = async () => {
    await cancelScheduledPublish();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-background border border-foreground/10 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 id="schedule-modal-title" className="text-base font-black text-foreground">
                Programma pubblicazione
              </h3>
              <p className="text-xs text-foreground/50">
                Branch di destinazione: <span className="font-mono font-bold text-foreground/80">{activeBranch}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {scheduledPublish && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-amber-400">Pubblicazione già programmata</span>
              <button
                type="button"
                onClick={handleCancelExisting}
                disabled={isScheduling}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 font-bold transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} />
                Annulla
              </button>
            </div>
            <p className="text-foreground/70">
              Prevista per il{" "}
              <span className="font-semibold text-foreground">
                {new Date(scheduledPublish.publishAt).toLocaleString("it-IT", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </span>
              . Salvando un nuovo orario, quello precedente verrà sostituito.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="schedule-datetime" className="block text-xs font-bold text-foreground/80">
              Data e ora di pubblicazione (fino a 7 giorni)
            </label>
            <input
              id="schedule-datetime"
              type="datetime-local"
              value={dateTimeValue}
              min={bounds.min}
              max={bounds.max}
              onChange={(e) => setDateTimeValue(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-foreground/10 focus:border-primary text-sm text-foreground outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="schedule-commit-msg" className="block text-xs font-bold text-foreground/80">
              Nota commit (opzionale)
            </label>
            <input
              id="schedule-commit-msg"
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              maxLength={200}
              placeholder="Es. Apertura biglietteria nuovo spettacolo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-foreground/10 focus:border-primary text-sm text-foreground outline-none"
            />
          </div>

          <div className="flex items-start gap-2 text-[11px] text-foreground/50 bg-muted/30 p-3 rounded-xl border border-foreground/5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
            <span>
              Verrà salvata l&apos;istantanea attuale dei contenuti. Eventuali modifiche pubblicate manualmente prima dell&apos;orario programmato verranno sovrascritte.
            </span>
          </div>

          {localError && (
            <p className="text-xs font-semibold text-rose-400">{localError}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            >
              Chiudi
            </button>
            <button
              type="submit"
              disabled={isScheduling}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isScheduling ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <CalendarClock size={14} />
                  <span>Programma</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
