"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Lock, ArrowRight, AlertCircle, Theater, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface DevAccessGateProps {
  children: React.ReactNode;
  isDev?: boolean;
  initialHasAccess?: boolean;
}

export function DevAccessGate({
  children,
  isDev = false,
  initialHasAccess = true,
}: DevAccessGateProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(initialHasAccess);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Hard client-side immunity: NEVER block live production domains
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      if (
        hostname === "gliattomatti.ch" ||
        hostname === "www.gliattomatti.ch" ||
        hostname.endsWith(".gliattomatti.ch")
      ) {
        setHasAccess(true);
        return;
      }

      // Check cookie directly on client
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("attomatti_dev_access="));
      if (match && match.split("=")[1] === "1") {
        setHasAccess(true);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === "attomatti") {
      setError(false);
      setIsSubmitting(true);
      // Salva nei cookies per 1 anno (31536000 secondi)
      document.cookie = "attomatti_dev_access=1; path=/; max-age=31536000; SameSite=Lax";
      setHasAccess(true);
      setIsSubmitting(false);
      router.refresh();
    } else {
      setError(true);
    }
  };

  // Se siamo in produzione o se l'utente possiede già il cookie di accesso, renderizza normalmente
  if (!isDev || hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background text-foreground relative overflow-hidden select-none">
      {/* Dynamic ambient theatrical background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      {/* Main Gate Card */}
      <div className="max-w-md w-full glass rounded-[2.5rem] p-6 sm:p-10 border border-foreground/10 shadow-2xl relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <ShieldCheck size={14} className="text-accent" />
            <span>Ambiente di Sviluppo</span>
          </div>

          {/* Logo / Heading */}
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground mb-3 leading-tight">
            Gli Attomatti
          </h1>
          <p className="text-foreground/75 text-sm sm:text-base leading-relaxed mb-6">
            Questo è il nostro <strong>sito di sviluppo e collaudo</strong>. Se stavi cercando il nostro sito ufficiale per spettacoli, date e biglietti:
          </p>

          {/* Main CTA to Live Site */}
          <a
            href="https://gliattomatti.ch"
            className="inline-flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/25 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 transition-all mb-8 group"
          >
            <span>Vai al sito vero (gliattomatti.ch)</span>
            <ExternalLink size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-8">
            <div className="border-t border-foreground/10 w-full" />
            <span className="bg-background/90 px-3.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold text-foreground/50 border border-foreground/10 absolute">
              Accesso Team & Anteprima
            </span>
          </div>

          {/* Password Section */}
          <div className="text-left mb-2">
            <p className="text-xs text-foreground/60 mb-3 text-center">
              Se fai parte del team o desideri visionare l'anteprima, inserisci la password:
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/40">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Inserisci password..."
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-2xl text-sm font-medium text-foreground placeholder:text-foreground/40 focus:outline-hidden transition-all",
                    error
                      ? "border-rose-500/80 focus:ring-2 focus:ring-rose-500/30"
                      : "border-foreground/15 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  )}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-400 text-xs px-3 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Password errata. Riprova.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="w-full py-3.5 px-5 rounded-2xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all border border-foreground/10 hover:border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Sblocca e prosegui</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <p className="text-[11px] text-foreground/40 mt-6 leading-normal">
            L'accesso verrà memorizzato in un cookie per non richiedere nuovamente la password su questo browser.
          </p>
        </div>
      </div>
    </div>
  );
}
