"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AbsenceRecord, SpecialDate, memberNameToSlug } from "@/types/absence";
import AbsenceMatrixGrid from "./AbsenceMatrixGrid";
import AbsenceListAgenda from "./AbsenceListAgenda";
import SpecialDatesView from "./SpecialDatesView";
import MyAbsencesTab from "./MyAbsencesTab";
import AbsenceFormModal from "./AbsenceFormModal";
import { useAbsenceAuth } from "./AbsencePinGate";
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  List as ListIcon,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Save,
  RotateCcw,
  CheckCircle2,
  Users,
  Theater,
  Lock
} from "lucide-react";

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

type ViewMode = "matrix" | "agenda" | "special-dates" | "my-absences";

interface AbsenceCalendarProps {
  configuredMembers: string[];
  specialDates?: SpecialDate[];
}

export default function AbsenceCalendar({
  configuredMembers = [],
  specialDates = []
}: AbsenceCalendarProps) {
  const { logout } = useAbsenceAuth();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // "Le mie assenze" is the primary default view
  const [viewMode, setViewMode] = useState<ViewMode>("my-absences");

  // Members list (from content.json, fallback to default)
  const members = useMemo(() => {
    return (configuredMembers || []).slice().sort((a, b) => a.localeCompare(b, "it"));
  }, [configuredMembers]);

  // Selected active member
  const [activeMember, setActiveMember] = useState<string>("");
  const [isChangingMember, setIsChangingMember] = useState(false);

  // Cloud/all absences
  const [cloudAbsences, setCloudAbsences] = useState<AbsenceRecord[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Local draft state for activeMember
  const [draftAbsences, setDraftAbsences] = useState<AbsenceRecord[]>([]);
  const [syncedAbsences, setSyncedAbsences] = useState<AbsenceRecord[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefillMember, setModalPrefillMember] = useState("");
  const [modalPrefillDate, setModalPrefillDate] = useState("");
  const [modalPrefillEndDate, setModalPrefillEndDate] = useState("");

  // Storage keys for active member
  const activeSlug = useMemo(() => (activeMember ? memberNameToSlug(activeMember) : ""), [activeMember]);
  const draftStorageKey = useMemo(() => `attomatti_draft_${activeSlug}`, [activeSlug]);
  const syncedStorageKey = useMemo(() => `attomatti_synced_${activeSlug}`, [activeSlug]);

  // 1. Initial active member resolution from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("attomatti_active_member");
      if (saved && members.includes(saved)) {
        setActiveMember(saved);
      }
    } catch {}
  }, [members]);

  // 2. Fetch full absences from API (for overall grid)
  const loadCloudData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    setErrorMsg("");

    try {
      const fetchUrl = showSpinner ? `/api/assenze?t=${Date.now()}` : "/api/assenze";
      const res = await fetch(fetchUrl, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Impossibile recuperare i dati delle assenze.");
      }

      const allRecords: AbsenceRecord[] = json.absences || [];
      setCloudAbsences(allRecords);
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore di connessione.");
    } finally {
      setIsLoadingAll(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCloudData();
  }, [loadCloudData]);

  // 3. When activeMember or cloudAbsences change: initialize local draft and synced snapshot
  useEffect(() => {
    if (!activeMember || !activeSlug) return;

    try {
      // Find what the cloud has for this member
      const memberCloudRecords = cloudAbsences.filter(
        (a) => a.memberName.trim().toLowerCase() === activeMember.trim().toLowerCase()
      );

      // Check if there is an uncommitted local draft in localStorage
      const storedDraftRaw = localStorage.getItem(draftStorageKey);
      if (storedDraftRaw) {
        try {
          const parsed = JSON.parse(storedDraftRaw);
          if (Array.isArray(parsed)) {
            setDraftAbsences(parsed);
          } else {
            setDraftAbsences(memberCloudRecords);
          }
        } catch {
          setDraftAbsences(memberCloudRecords);
        }
      } else {
        setDraftAbsences(memberCloudRecords);
      }

      setSyncedAbsences(memberCloudRecords);
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, [activeMember, activeSlug, cloudAbsences, draftStorageKey]);

  // 4. Compute whether there are unsaved local modifications
  const hasUnsavedChanges = useMemo(() => {
    if (!activeMember) return false;
    // Compare stringified representations
    const sortFn = (a: AbsenceRecord, b: AbsenceRecord) => (a.startDate + a.id).localeCompare(b.startDate + b.id);
    const dSorted = [...draftAbsences].sort(sortFn);
    const sSorted = [...syncedAbsences].sort(sortFn);
    return JSON.stringify(dSorted) !== JSON.stringify(sSorted);
  }, [activeMember, draftAbsences, syncedAbsences]);

  // 5. Update local draft (writes ONLY to localStorage, zero network cost!)
  const updateDraft = useCallback(
    (newDraft: AbsenceRecord[]) => {
      setDraftAbsences(newDraft);
      if (draftStorageKey) {
        try {
          localStorage.setItem(draftStorageKey, JSON.stringify(newDraft));
        } catch (e) {
          console.error("Failed to update localStorage draft:", e);
        }
      }
    },
    [draftStorageKey]
  );

  // 6. Save staged draft to Cloud (Single PUT operation to Blob)
  const handleSaveToCloud = async () => {
    if (!activeMember) return;
    setIsSavingDraft(true);
    setErrorMsg("");
    setSaveSuccessMsg("");

    try {
      const res = await fetch("/api/assenze", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberName: activeMember,
          absences: draftAbsences
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Errore durante il salvataggio.");
      }

      // Mark as synced locally
      setSyncedAbsences(draftAbsences);
      try {
        localStorage.setItem(syncedStorageKey, JSON.stringify(draftAbsences));
      } catch {}

      // Update cloudAbsences in memory
      setCloudAbsences((prev) => [
        ...prev.filter((a) => a.memberName.trim().toLowerCase() !== activeMember.trim().toLowerCase()),
        ...draftAbsences
      ]);

      setSaveSuccessMsg("Modifiche salvate con successo!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore durante il salvataggio.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 7. Discard local draft and revert to Cloud snapshot
  const handleDiscardChanges = () => {
    if (!confirm("Vuoi annullare tutte le modifiche non ancora salvate?")) {
      return;
    }
    setDraftAbsences(syncedAbsences);
    if (draftStorageKey) {
      try {
        localStorage.setItem(draftStorageKey, JSON.stringify(syncedAbsences));
      } catch {}
    }
  };

  // 8. Add an absence to the local draft
  const handleAddDraftAbsence = (newRecord: AbsenceRecord) => {
    const updated = [
      ...draftAbsences.filter(
        (a) =>
          !(
            a.startDate === newRecord.startDate &&
            a.endDate === newRecord.endDate &&
            a.note === newRecord.note
          )
      ),
      newRecord
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));

    updateDraft(updated);
  };

  // 8b. Add multiple absences to the local draft (from Google Calendar import)
  const handleBatchAddDraftAbsences = (newRecords: AbsenceRecord[]) => {
    if (!newRecords || newRecords.length === 0) return;
    const updated = [...draftAbsences, ...newRecords].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
    updateDraft(updated);
    setSaveSuccessMsg(
      `${newRecords.length} ${newRecords.length === 1 ? "assenza creata" : "assenze create"} in bozza! Premi 'Salva modifiche' per confermare.`
    );
    setTimeout(() => setSaveSuccessMsg(""), 5000);
  };

  // 9. Delete an absence from the local draft
  const handleDeleteDraftAbsence = async (id: string, memberName: string) => {
    // If it's the active member, delete from local draft
    if (memberName.trim().toLowerCase() === activeMember.trim().toLowerCase()) {
      const updated = draftAbsences.filter((a) => a.id !== id);
      updateDraft(updated);
      return;
    }

    // If another member's cell was clicked from the grid, send direct DELETE
    const res = await fetch(
      `/api/assenze?id=${encodeURIComponent(id)}&memberName=${encodeURIComponent(memberName)}`,
      { method: "DELETE" }
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      alert("Errore durante l'eliminazione: " + (json.error || "Imprevisto"));
      return;
    }
    setCloudAbsences((prev) => prev.filter((a) => a.id !== id));
  };

  // 10. Unified absences list for display:
  // Merges cloud absences for all other members with local draft for the active member!
  const displayAbsences = useMemo(() => {
    if (!activeMember) return cloudAbsences;
    const others = cloudAbsences.filter(
      (a) => a.memberName.trim().toLowerCase() !== activeMember.trim().toLowerCase()
    );
    return [...others, ...draftAbsences];
  }, [cloudAbsences, activeMember, draftAbsences]);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Step 1: Member selector screen if no active member selected or changing
  if (!activeMember || isChangingMember) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-muted/70 border border-muted-foreground/30 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md space-y-5 sm:space-y-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/20 text-primary border border-primary/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="text-center space-y-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-primary">
              Passo 1 di 2 — Identificazione
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">Chi sei?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Seleziona il tuo nome per accedere al tuo calendario assenze e registrare disponibilità.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <select
                id="initial-member-select"
                defaultValue={activeMember || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setActiveMember(val);
                    setIsChangingMember(false);
                    try {
                      localStorage.setItem("attomatti_active_member", val);
                    } catch {}
                  }
                }}
                className="w-full bg-background border border-muted rounded-2xl px-4 py-3.5 pl-12 text-foreground font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer shadow-inner"
              >
                <option value="">-- Seleziona il tuo nome dalla lista --</option>
                {members.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <UserIcon className="w-5 h-5 text-muted-foreground absolute left-4 top-4 pointer-events-none" />
            </div>

            <p className="text-[11px] text-muted-foreground/80 text-center">
              L&apos;elenco dei membri è gestito direttamente dall&apos;amministrazione del sito.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2 sm:py-6 space-y-2.5 sm:space-y-6 pb-24">
      {/* MOBILE HEADER (Under 640px): Single clean native bar */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between gap-1.5 bg-muted/40 border border-muted/80 p-2 rounded-2xl">
          {/* Month Stepper */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg bg-background hover:bg-background/80 text-foreground flex items-center justify-center border border-muted active:scale-95 transition-transform"
              title="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-xs capitalize text-foreground px-1 text-center min-w-[95px] truncate">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg bg-background hover:bg-background/80 text-foreground flex items-center justify-center border border-muted active:scale-95 transition-transform"
              title="Mese successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => loadCloudData(true)}
              title="Aggiorna calendario"
              className="w-8 h-8 rounded-lg bg-background text-muted-foreground hover:text-foreground flex items-center justify-center border border-muted active:scale-95 transition-transform"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setModalPrefillMember(activeMember);
                setModalPrefillDate("");
                setModalPrefillEndDate("");
                setIsModalOpen(true);
              }}
              className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assenza</span>
            </button>

            <button
              onClick={logout}
              title="Esci dal calendario"
              className="w-8 h-8 rounded-lg bg-background text-muted-foreground hover:text-foreground flex items-center justify-center border border-muted active:scale-95 transition-transform"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Member indicator & Today shortcut */}
        <div className="flex items-center justify-between px-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px]">Tu:</span>
            <button
              type="button"
              onClick={() => setIsChangingMember(true)}
              className="font-bold text-primary inline-flex items-center gap-1 bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full text-xs active:scale-95 transition-transform"
            >
              <UserIcon className="w-3 h-3" />
              <span>{activeMember}</span>
              <span className="text-[10px] text-muted-foreground font-normal">(cambia)</span>
            </button>
          </div>

          <button
            onClick={handleToday}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline"
          >
            Oggi
          </button>
        </div>
      </div>

      {/* DESKTOP HEADER (640px and up): Spacious & refined */}
      <div className="hidden sm:flex sm:flex-row sm:items-center justify-between gap-3 border-b border-muted/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Gli Attomatti
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Calendario Assenze
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Accesso:</span>
            <button
              type="button"
              onClick={() => setIsChangingMember(true)}
              className="inline-flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
              title="Clicca per cambiare persona"
            >
              <UserIcon className="w-3 h-3" />
              <span>{activeMember}</span>
              <span className="text-[10px] text-muted-foreground font-normal">(cambia)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCloudData(true)}
            disabled={isRefreshing}
            title="Aggiorna calendario"
            className="h-10 px-3 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-muted transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Aggiorna</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalPrefillMember(activeMember);
              setModalPrefillDate("");
              setModalPrefillEndDate("");
              setIsModalOpen(true);
            }}
            className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nuova Assenza</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3 sm:p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 sm:p-4 bg-primary/10 border border-primary/30 rounded-2xl text-primary text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-xs sm:text-sm">Errore</p>
            <p className="text-[11px] sm:text-xs text-primary/80">{errorMsg}</p>
          </div>
          <button
            onClick={() => loadCloudData(true)}
            className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded-lg text-xs"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Month Navigation (Desktop) & View Mode Selector (Mobile + Desktop) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-muted/30 border border-muted p-1.5 sm:p-3 rounded-2xl">
        {/* Desktop Month Selector */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-background hover:bg-muted text-foreground border border-muted shadow-sm transition-all active:scale-95 shrink-0"
            title="Mese precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center min-w-[150px]">
            <span className="block font-black text-base md:text-lg text-foreground tracking-wide capitalize">
              {MONTH_NAMES[month]} {year}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-background hover:bg-muted text-foreground border border-muted shadow-sm transition-all active:scale-95 shrink-0"
            title="Mese successivo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground border border-muted transition-colors ml-1"
          >
            Oggi
          </button>
        </div>

        {/* View Mode Toggle - 4 clean tabs in requested order: Le mie, Appuntamenti, Griglia, Agenda */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-muted">
          <button
            onClick={() => setViewMode("my-absences")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
              viewMode === "my-absences"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Le mie</span>
            {hasUnsavedChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setViewMode("special-dates")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
              viewMode === "special-dates"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Theater className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Appuntamenti</span>
          </button>

          <button
            onClick={() => setViewMode("matrix")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
              viewMode === "matrix"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Griglia</span>
          </button>

          <button
            onClick={() => setViewMode("agenda")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
              viewMode === "agenda"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Agenda</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingAll ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-12 bg-muted/20 border border-muted rounded-2xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Caricamento calendario assenze in corso...</p>
        </div>
      ) : (
        <div>
          {viewMode === "matrix" && (
            <AbsenceMatrixGrid
              year={year}
              month={month}
              members={members}
              activeMember={activeMember}
              absences={displayAbsences}
              specialDates={specialDates}
              onAddForRange={(mem, startDate, endDate) => {
                setModalPrefillMember(mem);
                setModalPrefillDate(startDate);
                setModalPrefillEndDate(endDate);
                setIsModalOpen(true);
              }}
              onAddForCell={(mem, dateStr) => {
                setModalPrefillMember(mem);
                setModalPrefillDate(dateStr);
                setModalPrefillEndDate(dateStr);
                setIsModalOpen(true);
              }}
              onDeleteAbsence={handleDeleteDraftAbsence}
            />
          )}

          {viewMode === "agenda" && (
            <AbsenceListAgenda
              year={year}
              month={month}
              members={members}
              activeMember={activeMember}
              absences={displayAbsences}
              specialDates={specialDates}
              onAddForDate={(dateStr) => {
                setModalPrefillMember(activeMember);
                setModalPrefillDate(dateStr);
                setModalPrefillEndDate(dateStr);
                setIsModalOpen(true);
              }}
              onDeleteAbsence={handleDeleteDraftAbsence}
            />
          )}

          {viewMode === "special-dates" && (
            <SpecialDatesView
              specialDates={specialDates}
              members={members}
              absences={displayAbsences}
              onSelectDate={(dateStr) => {
                const parts = dateStr.split("-");
                if (parts.length === 3) {
                  setCurrentDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                  setViewMode("matrix");
                }
              }}
            />
          )}

          {viewMode === "my-absences" && (
            <MyAbsencesTab
              year={year}
              month={month}
              members={members}
              absences={displayAbsences}
              specialDates={specialDates}
              activeMember={activeMember}
              onSelectMember={(mem) => {
                setActiveMember(mem);
                try {
                  localStorage.setItem("attomatti_active_member", mem);
                } catch {}
              }}
              onOpenAddModal={(prefillMember, prefillDate) => {
                setModalPrefillMember(prefillMember || activeMember);
                setModalPrefillDate(prefillDate || "");
                setModalPrefillEndDate(prefillDate || "");
                setIsModalOpen(true);
              }}
              onBatchAddAbsences={handleBatchAddDraftAbsences}
              onDeleteAbsence={handleDeleteDraftAbsence}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
            />
          )}
        </div>
      )}

      {/* Persistent Floating Bottom Bar for Unsaved Changes (LocalStorage -> Cloud Batch Save) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-background/95 border-2 border-accent rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 text-foreground">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                  Modifiche non salvate
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Attore: <strong className="text-foreground">{activeMember}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isSavingDraft}
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-muted transition-colors disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSavingDraft}
                className="text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-3.5 py-2 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDraft ? "Salvataggio..." : "Salva modifiche"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground/60 border-t border-muted/50 pt-4 gap-2">
        <span>Gli Attomatti — Calendario Prove & Assenze</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Sincronizzato</span>
        </span>
      </div>

      {/* Add Absence Modal */}
      <AbsenceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeMember={activeMember}
        initialDate={modalPrefillDate}
        initialEndDate={modalPrefillEndDate}
        onSuccess={(newRecord) => {
          handleAddDraftAbsence(newRecord);
        }}
      />
    </div>
  );
}
