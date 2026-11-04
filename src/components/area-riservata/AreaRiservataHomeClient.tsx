"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Theater,
  Sparkles,
  Lock,
  User as UserIcon,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  ChevronRight
} from "lucide-react";
import { SpecialDate, DEFAULT_MEMBERS } from "@/types/absence";
import { logoutAreaRiservata } from "@/app/actions/areaRiservataAuth";
import AddToCalendarButton from "@/components/assenze/AddToCalendarButton";

interface AreaRiservataHomeClientProps {
  configuredMembers: string[];
  specialDates: SpecialDate[];
}

export default function AreaRiservataHomeClient({
  configuredMembers = [],
  specialDates = []
}: AreaRiservataHomeClientProps) {
  const members = useMemo(() => {
    return (configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS)
      .slice()
      .sort((a, b) => a.localeCompare(b, "it"));
  }, [configuredMembers]);

  const [activeMember, setActiveMember] = useState<string>("");
  const [isChangingMember, setIsChangingMember] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("attomatti_active_member");
      if (saved && members.includes(saved)) {
        setActiveMember(saved);
      }
    } catch {}
  }, [members]);

  const handleSelectMember = (name: string) => {
    setActiveMember(name);
    try {
      localStorage.setItem("attomatti_active_member", name);
    } catch {}
    setIsChangingMember(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAreaRiservata();
      window.location.reload();
    } catch {
      setIsLoggingOut(false);
    }
  };

  // Find next upcoming special date
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const nextEvent = useMemo(() => {
    const upcoming = (specialDates || [])
      .filter((d) => d.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  }, [specialDates, todayStr]);

  const daysUntilNext = useMemo(() => {
    if (!nextEvent) return null;
    const [y, m, d] = nextEvent.date.split("-").map(Number);
    const eventDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = eventDate.getTime() - todayZero.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }, [nextEvent]);

  const formatEventDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Top Bar: Profile & Logout */}
      <div className="flex items-center justify-between gap-3 border-b border-muted pb-4">
        <div className="flex items-center gap-2">
          {activeMember ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Profilo:</span>
              <button
                type="button"
                onClick={() => setIsChangingMember(true)}
                className="inline-flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
                title="Clicca per cambiare persona"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{activeMember}</span>
                <span className="text-[10px] text-muted-foreground font-normal">(cambia)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsChangingMember(true)}
              className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted text-foreground border border-muted px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 text-primary" />
              <span>Seleziona il tuo nome</span>
            </button>
          )}
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Esci dall'Area Riservata"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted border border-muted/70 transition-all active:scale-95 disabled:opacity-50"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? "Uscita..." : "Esci / Blocca"}</span>
        </button>
      </div>

      {/* Member Selection Modal */}
      {isChangingMember && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-muted/90 border border-muted rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Chi sta usando questo dispositivo?</h3>
              <button
                onClick={() => setIsChangingMember(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
              >
                Chiudi
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Seleziona il tuo nome per accedere rapidamente alle tue disponibilità personali.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {members.map((mem) => (
                <button
                  key={mem}
                  type="button"
                  onClick={() => handleSelectMember(mem)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    activeMember === mem
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background/80 hover:bg-background text-foreground border-muted"
                  }`}
                >
                  <span className="truncate">{mem}</span>
                  {activeMember === mem && <Sparkles className="w-3 h-3 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Area Riservata — Backstage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          {activeMember ? `Ciao ${activeMember}, bentornato!` : "Hub di Compagnia"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-medium">
          Accedi alle miniapp interne degli Attomatti per gestire disponibilità, consultare spettacoli e coordinare le prove.
        </p>
      </div>

      {/* Highlight Widget: Next Upcoming Event */}
      {nextEvent && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full">
                  Prossimo Appuntamento
                </span>
                {daysUntilNext !== null && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {daysUntilNext === 0
                      ? "Oggi!"
                      : daysUntilNext === 1
                      ? "Domani"
                      : `Tra ${daysUntilNext} giorni`}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {nextEvent.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 capitalize font-medium text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {formatEventDate(nextEvent.date)}
                </span>
                {nextEvent.note && (
                  <span className="text-muted-foreground/80 italic">
                    {nextEvent.note}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <AddToCalendarButton event={nextEvent} />
              <Link
                href="/area-riservata/appuntamenti"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-primary/90 active:scale-95 transition-all text-xs sm:text-sm shrink-0"
              >
                <span>Vedi Appuntamenti</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Miniapps Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Miniapp Disponibili</h2>
          <p className="text-xs text-muted-foreground">
            Scegli lo strumento a cui desideri accedere.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Miniapp 1: Assenze */}
          <Link
            href="/area-riservata/assenze"
            className="group relative bg-muted/40 hover:bg-muted/70 border border-muted hover:border-primary/40 rounded-3xl p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  Disponibilità & Presenze
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                Calendario Assenze
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Registra le tue indisponibilità personali, consulta la matrice mensile con le presenze di tutti i membri e sincronizza con Google Calendar.
              </p>
            </div>

            <div className="pt-6 mt-2 border-t border-muted/60 flex items-center justify-between text-xs font-bold text-primary">
              <span>Apri Calendario Assenze</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Miniapp 2: Appuntamenti */}
          <Link
            href="/area-riservata/appuntamenti"
            className="group relative bg-muted/40 hover:bg-muted/70 border border-muted hover:border-secondary/40 rounded-3xl p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary border border-secondary/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Theater className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 rounded-full">
                  Spettacoli & Prove
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-secondary transition-colors">
                Appuntamenti & Date Chiave
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Shortlink rapido e diretto a spettacoli, prove generali e date importanti: visualizza il conteggio delle presenze e chi è disponibile senza passare per le assenze.
              </p>
            </div>

            <div className="pt-6 mt-2 border-t border-muted/60 flex items-center justify-between text-xs font-bold text-secondary">
              <span>Consulta Appuntamenti</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

