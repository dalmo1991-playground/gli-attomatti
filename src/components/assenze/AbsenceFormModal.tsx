"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Check, AlertCircle, Plus } from "lucide-react";
import { AbsenceRecord } from "@/types/absence";

interface AbsenceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMember: string;
  initialDate?: string;
  initialEndDate?: string;
  onSuccess: (newRecord: AbsenceRecord) => void;
}

const NOTE_SUGGESTIONS = [
  "Dalle 20:30",
  "Prima delle 21:00",
  "Lavoro",
  "Vacanze / Viaggio",
  "Impegno personale"
];

export default function AbsenceFormModal({
  isOpen,
  onClose,
  activeMember,
  initialDate = "",
  initialEndDate = "",
  onSuccess
}: AbsenceFormModalProps) {
  const [isRange, setIsRange] = useState(false);
  const [status, setStatus] = useState<"certain" | "maybe">("certain");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      const start = initialDate || today;
      const end = initialEndDate || start;
      setStartDate(start);
      setEndDate(end);
      setIsRange(start !== end);
      setStatus("certain");
      setNote("");
      setErrorMsg("");
    }
  }, [isOpen, initialDate, initialEndDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!activeMember) {
      setErrorMsg("Nessun membro selezionato.");
      return;
    }

    if (!startDate) {
      setErrorMsg("Seleziona la data.");
      return;
    }

    const finalEndDate = isRange && endDate ? endDate : startDate;
    if (finalEndDate < startDate) {
      setErrorMsg("La data finale non può precedere la data iniziale.");
      return;
    }

    const newRecord: AbsenceRecord = {
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      memberName: activeMember.trim(),
      startDate,
      endDate: finalEndDate,
      status,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onSuccess(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-lg bg-muted border border-muted-foreground/30 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-muted-foreground/20 pb-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Registra Nuova Assenza</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member indicator (locked to activeMember) */}
        <div className="bg-background/60 border border-muted rounded-xl p-3 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Registrazione per:
            </span>
            <span className="font-bold text-foreground text-sm">{activeMember}</span>
          </div>
          <span className="text-[11px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-md">
            Solo tuo profilo
          </span>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-xl text-primary text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status certainty toggle */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Stato dell&apos;Assenza
            </span>
            <div className="grid grid-cols-2 gap-2 bg-background/50 p-1 rounded-xl border border-muted">
              <button
                type="button"
                onClick={() => setStatus("certain")}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  status === "certain"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-primary-foreground/90 shrink-0" />
                <span>Assenza Certa</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus("maybe")}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  status === "maybe"
                    ? "bg-secondary text-secondary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-secondary-foreground/90 shrink-0" />
                <span>Forse Assente</span>
              </button>
            </div>
          </div>

          {/* Range toggle */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Durata Assenza
            </span>
            <div className="grid grid-cols-2 gap-2 bg-background/50 p-1 rounded-xl border border-muted">
              <button
                type="button"
                onClick={() => setIsRange(false)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isRange
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Giorno Singolo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRange(true);
                  if (!endDate || endDate < startDate) setEndDate(startDate);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  isRange
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Periodo (più giorni)
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="absence-start-date"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                {isRange ? "Dal giorno" : "Data dell'assenza"}
              </label>
              <input
                id="absence-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full bg-background border border-muted rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {isRange && (
              <div>
                <label
                  htmlFor="absence-end-date"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                >
                  Al giorno (compreso)
                </label>
                <input
                  id="absence-end-date"
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background border border-muted rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Note & Suggestions */}
          <div>
            <label
              htmlFor="absence-note"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Fascia oraria / Nota (Opzionale)
            </label>
            <input
              id="absence-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. Dalle 20:30, Tutta la sera, Viaggio"
              className="w-full bg-background border border-muted rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NOTE_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setNote(sug)}
                  className="text-[11px] bg-background/60 hover:bg-background border border-muted rounded-lg px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Conferma e Registra Assenza</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

