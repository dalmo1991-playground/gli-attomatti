"use client";

import React, { useState } from "react";
import { Lock, KeyRound, AlertCircle, Sparkles } from "lucide-react";
import { verifyAreaRiservataPin } from "@/app/actions/areaRiservataAuth";

export default function AreaRiservataGate() {
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await verifyAreaRiservataPin(pinInput);
      if (res.success) {
        // Refresh the page so the server layout re-evaluates the newly set session cookie
        window.location.reload();
      } else {
        setErrorMsg(res.error || "PIN non corretto. Riprova.");
      }
    } catch {
      setErrorMsg("Errore di connessione durante la verifica del PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-muted/60 border border-muted rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="w-14 h-14 bg-primary/15 text-primary border border-primary/25 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-center text-foreground mb-2 tracking-tight">
          Area Riservata Compagnia
        </h1>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Inserisci il PIN di compagnia per accedere all&apos;hub e alle miniapp riservate degli Attomatti.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="pin-input"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              PIN di Compagnia
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
                placeholder="Inserisci PIN..."
                className="w-full bg-background border border-muted rounded-xl px-4 py-3 pl-10 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <span>{isSubmitting ? "Verifica in corso..." : "Accedi all'Area Riservata"}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground/70 mt-6">
          La sessione è temporanea e sicura: scade automaticamente alla chiusura del browser.
        </p>
      </div>
    </div>
  );
}

