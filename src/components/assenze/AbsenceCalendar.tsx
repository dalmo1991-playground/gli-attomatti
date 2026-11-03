"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AbsenceRecord, SpecialDate, memberNameToSlug } from "@/types/absence";
import AbsenceMatrixGrid from "./AbsenceMatrixGrid";
import AbsenceListAgenda from "./AbsenceListAgenda";
import SpecialDatesView from "./SpecialDatesView";
import MyAbsencesTab from "./MyAbsencesTab";
import AbsenceFormModal from "./AbsenceFormModal";
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
  Theater
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
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");

  // Members list (from content.json, fallback to default)
  const members = useMemo(() => {
    return (configuredMembers || []).slice().sort((a, b) => a.localeCompare(b, "it"));
  }, [configuredMembers]);

  // Selected active member
  const [activeMember, setActiveMember] = useState<string>("");
  const [isChangingMember, setIsChangingMember] = useState(false);

  // Cloud/all absences
  const [cloudAbsences, setCloudAbsences] = useState<AbsenceRecord[]>([]);
  const [storageType, setStorageType] = useState<string>("live");
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
      setStorageType(json.storage || "live");
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
        throw new Error(json.error || "Errore durante il salvataggio su Cloud.");
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

      setSaveSuccessMsg("Modifiche salvate con successo sul Cloud!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore durante il salvataggio.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 7. Discard local draft and revert to Cloud snapshot
  const handleDiscardChanges = () => {
    if (!confirm("Vuoi annullare le modifiche locali non salvate e ripristinare i dati del Cloud?")) {
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
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-muted/70 border border-muted-foreground/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="w-14 h-14 bg-primary/20 text-primary border border-primary/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-7 h-7" />
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Passo 1 di 2 — Identificazione
            </span>
            <h2 className="text-2xl font-black text-foreground">Chi sei?</h2>
            <p className="text-sm text-muted-foreground">
              Seleziona il tuo nome dalla compagnia per visualizzare e modificare il tuo calendario assenze.
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
                className="w-full bg-background border border-muted rounded-2xl px-4 py-4 pl-12 text-foreground font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer shadow-inner"
              >
                <option value="">-- Seleziona il tuo nome dalla lista --</option>
                {members.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <UserIcon className="w-6 h-6 text-muted-foreground absolute left-4 top-4 pointer-events-none" />
            </div>

            <p className="text-xs text-muted-foreground/80 text-center">
              L&apos;elenco dei membri è gestito direttamente dall&apos;amministrazione del sito.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Top Header & Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gli Attomatti — Calendario Assenze Prove & Spettacoli</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Calendario Assenze Compagnia
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs sm:text-sm text-muted-foreground">Stai operando come:</span>
            <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <UserIcon className="w-3 h-3" />
              <span>{activeMember}</span>
            </span>
            <button
              onClick={() => setIsChangingMember(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors ml-1"
            >
              (Cambia persona)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCloudData(true)}
            disabled={isRefreshing}
            title="Aggiorna dati dal cloud"
            className="p-3 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-muted transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Aggiorna</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalPrefillMember(activeMember);
              setModalPrefillDate("");
              setModalPrefillEndDate("");
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-3 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Segna Assenza</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-2xl text-primary text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Errore</p>
            <p className="text-xs text-primary/80">{errorMsg}</p>
          </div>
          <button
            onClick={() => loadCloudData(true)}
            className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded-lg text-xs"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Month Navigation & View Mode Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-muted/40 border border-muted p-3 sm:p-4 rounded-2xl">
        {/* Month Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-background/80 hover:bg-background text-foreground border border-muted shadow-sm transition-all active:scale-95"
            title="Mese precedente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center sm:text-left min-w-[170px]">
            <span className="block font-black text-base sm:text-lg text-foreground tracking-wide">
              {MONTH_NAMES[month]} {year}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-background/80 hover:bg-background text-foreground border border-muted shadow-sm transition-all active:scale-95"
            title="Mese successivo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleToday}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground border border-muted transition-colors ml-1"
          >
            Oggi
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-background/60 p-1 rounded-xl border border-muted self-center sm:self-auto">
          <button
            onClick={() => setViewMode("matrix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "matrix"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Griglia Excel</span>
          </button>

          <button
            onClick={() => setViewMode("agenda")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "agenda"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Agenda Giorni</span>
          </button>

          <button
            onClick={() => setViewMode("special-dates")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "special-dates"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Theater className="w-3.5 h-3.5" />
            <span>Spettacoli & Prove</span>
            {specialDates.length > 0 && (
              <span className="text-[10px] bg-background/50 px-1.5 py-0.2 rounded-full font-bold">
                {specialDates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode("my-absences")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "my-absences"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Le mie assenze</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Modifiche non salvate" />
            )}
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
              members={members}
              absences={displayAbsences}
              activeMember={activeMember}
              onSelectMember={(mem) => {
                setActiveMember(mem);
                try {
                  localStorage.setItem("attomatti_active_member", mem);
                } catch {}
              }}
              onOpenAddModal={(prefill) => {
                setModalPrefillMember(prefill || activeMember);
                setModalPrefillDate("");
                setIsModalOpen(true);
              }}
              onDeleteAbsence={handleDeleteDraftAbsence}
            />
          )}
        </div>
      )}

      {/* Persistent Floating Bottom Bar for Unsaved Changes (LocalStorage -> Cloud Batch Save) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto animate-in slide-in-from-bottom duration-300">
          <div className="bg-muted border-2 border-accent rounded-2xl p-4 shadow-2xl backdrop-blur-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-foreground">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-accent animate-ping shrink-0" />
              <div>
                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>Modifiche locali non salvate</span>
                  <span className="text-xs font-normal text-muted-foreground">({activeMember})</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Le modifiche sono in LocalStorage. Clicca &quot;Salva&quot; per inviarle a Blob.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isSavingDraft}
                className="flex-1 sm:flex-initial text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl bg-background/50 hover:bg-background border border-muted transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Annulla</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSavingDraft}
                className="flex-1 sm:flex-initial text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDraft ? "Salvataggio..." : "Salva su Cloud"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground/60 border-t border-muted/50 pt-4 gap-2">
        <span>Gli Attomatti — Sistema Gestione Prove & Assenze</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Storage Live: {storageType === "vercel-blob" ? "Cloud Blob (1 batch write per save)" : "Locale"}</span>
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
