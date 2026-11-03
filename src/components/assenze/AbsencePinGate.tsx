"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { Lock, KeyRound, AlertCircle, Sparkles } from "lucide-react";
import { verifyAbsencePin, logoutAbsencePin } from "@/app/actions/absenceAuth";

export const AbsenceAuthContext = createContext<{ logout: () => void }>({ logout: () => {} });
export const useAbsenceAuth = () => useContext(AbsenceAuthContext);

const STORAGE_KEY = "attomatti_assenze_auth";

interface AbsencePinGateProps {
  children: React.ReactNode;
  initialIsUnlocked?: boolean;
}

export default function AbsencePinGate({
  children,
  initialIsUnlocked = false
}: AbsencePinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialIsUnlocked);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If not unlocked via server cookie on SSR, check localStorage backup
    if (!initialIsUnlocked) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "1") {
          setIsUnlocked(true);
        }
      } catch {}
    }
  }, [initialIsUnlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await verifyAbsencePin(pinInput);
      if (res.success) {
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {}
        setIsUnlocked(true);
      } else {
        setErrorMsg(res.error || "PIN non corretto. Riprova.");
      }
    } catch {
      setErrorMsg("Errore di connessione durante la verifica del PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLock = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    try {
      await logoutAbsencePin();
    } catch {}
    setIsUnlocked(false);
    setPinInput("");
  };

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
                  placeholder="Inserisci PIN di compagnia..."
                  className="w-full bg-background/80 border border-muted rounded-xl px-4 py-3 pl-10 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
              <span>{isSubmitting ? "Verifica in corso..." : "Accedi al Calendario"}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground/70 mt-6">
            L&apos;accesso rimane memorizzato su questo dispositivo per le prossime visite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AbsenceAuthContext.Provider value={{ logout: handleLock }}>
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 hidden sm:flex justify-end">
          <button
            onClick={handleLock}
            title="Esci e richiedi nuovamente il PIN"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted border border-muted/60 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Esci / Blocca</span>
          </button>
        </div>
        {children}
      </div>
    </AbsenceAuthContext.Provider>
  );
}
