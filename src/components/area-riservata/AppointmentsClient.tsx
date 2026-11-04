"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Theater,
  ArrowLeft,
  CalendarDays,
  Sparkles,
  RefreshCw,
  User as UserIcon,
  Lock
} from "lucide-react";
import { SpecialDate, AbsenceRecord, DEFAULT_MEMBERS } from "@/types/absence";
import SpecialDatesView from "@/components/assenze/SpecialDatesView";
import { logoutAreaRiservata } from "@/app/actions/areaRiservataAuth";

interface AppointmentsClientProps {
  configuredMembers: string[];
  specialDates: SpecialDate[];
}

export default function AppointmentsClient({
  configuredMembers = [],
  specialDates = []
}: AppointmentsClientProps) {
  const members = useMemo(() => {
    return (configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS)
      .slice()
      .sort((a, b) => a.localeCompare(b, "it"));
  }, [configuredMembers]);

  const [activeMember, setActiveMember] = useState<string>("");
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("attomatti_active_member");
      if (saved && members.includes(saved)) {
        setActiveMember(saved);
      }
    } catch {}
  }, [members]);

  const fetchAbsences = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/assenze?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.absences)) {
          setAbsences(json.absences);
        }
      }
    } catch (err) {
      console.error("Errore recupero assenze per appuntamenti:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAbsences(false);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAreaRiservata();
      window.location.reload();
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Navigation & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-muted pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/area-riservata"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted border border-muted px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Area Riservata</span>
          </Link>

          <Link
            href="/area-riservata/assenze"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vai a</span>
            <span>Calendario Assenze</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {activeMember && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full border border-muted">
              <UserIcon className="w-3 h-3 text-primary" />
              <span>{activeMember}</span>
            </span>
          )}

          <button
            onClick={() => fetchAbsences(true)}
            disabled={isRefreshing}
            title="Aggiorna dati presenze"
            className="w-8 h-8 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center border border-muted transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            title="Esci dall'Area Riservata"
            className="w-8 h-8 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center border border-muted transition-all active:scale-95"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/25 px-2.5 py-0.5 rounded-full">
          <Theater className="w-3.5 h-3.5" />
          <span>Spettacoli & Prove Generali</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Appuntamenti di Compagnia
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Consulta in tempo reale le date chiave della compagnia con il quadro dettagliato delle presenze e indisponibilità confermate.
        </p>
      </div>

      {/* Main Content: SpecialDatesView */}
      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3 p-12 bg-muted/20 border border-muted rounded-3xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Caricamento appuntamenti in corso...</p>
        </div>
      ) : (
        <SpecialDatesView
          specialDates={specialDates}
          members={members}
          absences={absences}
        />
      )}
    </div>
  );
}

