"use client";

import React, { useState, useEffect } from "react";
import { Lock, KeyRound, AlertCircle, Sparkles } from "lucide-react";

const STORAGE_KEY = "attomatti_assenze_pin_auth";
const REQUIRED_PIN = "attomatti";

interface AbsencePinGateProps {
  children: React.ReactNode;
}

export default function AbsencePinGate({ children }: AbsencePinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === REQUIRED_PIN) {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    } catch {
      setIsUnlocked(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const clean = pinInput.trim().toLowerCase();
    if (clean === REQUIRED_PIN) {
      try {
        localStorage.setItem(STORAGE_KEY, REQUIRED_PIN);
      } catch {}
      setIsUnlocked(true);
    } else {
      setErrorMsg("PIN non corretto. Riprova.");
    }
    setIsSubmitting(false);
  };

  const handleLock = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
    setPinInput("");
  };

  // Initial loading state to prevent flash
  if (isUnlocked === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-muted/60 border border-muted rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 bg-primary/20 text-primary border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            Area Riservata Compagnia
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Inserisci il PIN di compagnia per accedere al calendario assenze di prove e spettacoli.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="pin-input"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                PIN di Accesso
              </label>
              <div className="relative">
                <input
                  id="pin-input"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Es. attomatti"
                  className="w-full bg-background/80 border border-muted rounded-xl px-4 py-3 pl-10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <KeyRound className="w-5 h-5 text-muted-foreground/60 absolute left-3 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-xl text-primary text-sm animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !pinInput.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Accedi al Calendario</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground/70 mt-6">
            Il PIN viene memorizzato sul tuo smartphone: non dovrai reinserirlo alle prossime visite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex justify-end">
        <button
          onClick={handleLock}
          title="Blocca sessione e richiedi nuovamente il PIN"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted border border-muted/60 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Blocca Accesso</span>
        </button>
      </div>
      {children}
    </div>
  );
}

