"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  CloudUpload,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  User as UserIcon,
  Users,
  X
} from "lucide-react";
import { DEFAULT_MEMBERS } from "@/types/absence";
import {
  CheckinBatchItem,
  MergedTallySubmission,
  TallyFormConfig,
  TallySubmissionsResponse
} from "@/types/tally";

interface TallyCheckinClientProps {
  forms: TallyFormConfig[];
  configuredMembers?: string[];
}

type FilterMode = "all" | "pending" | "checked_in";

interface LocalPendingEntry {
  checkedIn: boolean;
  updatedAt: string;
  checkedInBy?: string;
}

type LocalPendingMap = Record<string, LocalPendingEntry>;

function getDraftStorageKey(formId: string): string {
  return `attomatti_tally_checkin_draft_${formId}`;
}

function readLocalDraft(formId: string): LocalPendingMap {
  if (typeof window === "undefined" || !formId) return {};
  try {
    const raw = localStorage.getItem(getDraftStorageKey(formId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalDraft(formId: string, draft: LocalPendingMap) {
  if (typeof window === "undefined" || !formId) return;
  try {
    const keys = Object.keys(draft);
    if (keys.length === 0) {
      localStorage.removeItem(getDraftStorageKey(formId));
    } else {
      localStorage.setItem(getDraftStorageKey(formId), JSON.stringify(draft));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export default function TallyCheckinClient({
  forms,
  configuredMembers = []
}: TallyCheckinClientProps) {
  const members = useMemo(() => {
    return (configuredMembers && configuredMembers.length > 0 ? configuredMembers : DEFAULT_MEMBERS)
      .slice()
      .sort((a, b) => a.localeCompare(b, "it"));
  }, [configuredMembers]);

  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [activeMember, setActiveMember] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("attomatti_active_member") || "";
    } catch {
      return "";
    }
  });
  const [isSelectingMember, setIsSelectingMember] = useState<boolean>(false);
  const [pendingToggleSub, setPendingToggleSub] = useState<MergedTallySubmission | null>(null);

  const [data, setData] = useState<TallySubmissionsResponse | null>(null);
  const [pendingMap, setPendingMap] = useState<LocalPendingMap>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingTally, setIsSyncingTally] = useState<boolean>(false);
  const [isSyncingCheckins, setIsSyncingCheckins] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedForm = useMemo(
    () => forms.find((f) => f.id === selectedFormId) || null,
    [forms, selectedFormId]
  );

  const loadSubmissions = useCallback(async (formId: string, bypassCache = false) => {
    if (!formId) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const qs = new URLSearchParams({ formId });
      if (bypassCache) qs.set("refresh", "1");
      const res = await fetch(`/api/tally-submissions?${qs.toString()}`, {
        cache: "no-store"
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Errore durante il caricamento.");
      }
      setData(json as TallySubmissionsResponse);
      setPendingMap(readLocalDraft(formId));
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: (err as Error)?.message || "Impossibile caricare le sottomissioni."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedFormId) return;
    let cancelled = false;
    const qs = new URLSearchParams({ formId: selectedFormId });
    fetch(`/api/tally-submissions?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (!ok || !json.success) {
          throw new Error(json.error || "Errore durante il caricamento.");
        }
        setData(json as TallySubmissionsResponse);
        setPendingMap(readLocalDraft(selectedFormId));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatusMsg({
          type: "error",
          text: (err as Error)?.message || "Impossibile caricare le sottomissioni."
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFormId]);

  const handleSelectForm = (formId: string) => {
    setIsLoading(true);
    setData(null);
    setStatusMsg(null);
    setSearch("");
    setFilterMode("all");
    setExpandedIds({});
    setSelectedFormId(formId);
  };

  const handleBackToEvents = () => {
    setSelectedFormId("");
    setData(null);
    setStatusMsg(null);
    setSearch("");
    setExpandedIds({});
  };

  const handleSyncFromTally = async () => {
    if (!selectedFormId || isSyncingTally) return;
    setIsSyncingTally(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/tally-submissions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: selectedFormId })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Errore durante la sincronizzazione da Tally.");
      }
      setStatusMsg({
        type: "success",
        text: `Sincronizzate ${json.syncedSubmissions} iscrizioni (${json.totalParticipants} partecipanti) da Tally.`
      });
      await loadSubmissions(selectedFormId, true);
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: (err as Error)?.message || "Errore durante il sync da Tally."
      });
    } finally {
      setIsSyncingTally(false);
    }
  };

  const applyToggleCheckin = (sub: MergedTallySubmission, memberName: string) => {
    if (!selectedFormId) return;
    const currentChecked =
      pendingMap[sub.submissionId] !== undefined
        ? pendingMap[sub.submissionId].checkedIn
        : sub.checkedIn;
    const nextChecked = !currentChecked;

    const nextPending: LocalPendingMap = { ...pendingMap };
    // If toggling back to the exact server state, remove from pending draft
    if (nextChecked === sub.checkedIn) {
      delete nextPending[sub.submissionId];
    } else {
      nextPending[sub.submissionId] = {
        checkedIn: nextChecked,
        updatedAt: new Date().toISOString(),
        checkedInBy: memberName || undefined
      };
    }

    setPendingMap(nextPending);
    writeLocalDraft(selectedFormId, nextPending);
  };

  const handleToggleCheckin = (sub: MergedTallySubmission) => {
    if (!selectedFormId) return;
    if (!activeMember) {
      setPendingToggleSub(sub);
      setIsSelectingMember(true);
      return;
    }
    applyToggleCheckin(sub, activeMember);
  };

  const handleSelectMember = (name: string) => {
    setActiveMember(name);
    try {
      localStorage.setItem("attomatti_active_member", name);
    } catch {}
    setIsSelectingMember(false);
    if (pendingToggleSub) {
      const subToToggle = pendingToggleSub;
      setPendingToggleSub(null);
      applyToggleCheckin(subToToggle, name);
    }
  };

  const handleSyncCheckinsToBlob = async () => {
    if (!selectedFormId || isSyncingCheckins) return;
    const entries = Object.entries(pendingMap);
    if (entries.length === 0) return;

    setIsSyncingCheckins(true);
    setStatusMsg(null);
    try {
      const changes: CheckinBatchItem[] = entries.map(([submissionId, item]) => ({
        submissionId,
        checkedIn: item.checkedIn,
        updatedAt: item.updatedAt,
        checkedInBy: item.checkedInBy
      }));

      const res = await fetch("/api/tally-submissions/checkin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: selectedFormId, changes })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Errore durante il salvataggio dei check-in.");
      }

      // Clear localStorage draft only after confirmed Blob write
      writeLocalDraft(selectedFormId, {});
      setPendingMap({});
      setStatusMsg({
        type: "success",
        text: `Check-in sincronizzati su storage (${json.appliedCount} aggiornamenti salvati).`
      });
      await loadSubmissions(selectedFormId, true);
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: (err as Error)?.message || "Errore durante la sincronizzazione dei check-in."
      });
    } finally {
      setIsSyncingCheckins(false);
    }
  };

  // Merge server submissions with local pending state for instant UI
  const effectiveSubmissions = useMemo(() => {
    const raw = data?.submissions || [];
    return raw.map((sub) => {
      const pending = pendingMap[sub.submissionId];
      if (!pending) {
        return { ...sub, isPendingSync: false };
      }
      return {
        ...sub,
        checkedIn: pending.checkedIn,
        checkedInAt: pending.updatedAt,
        checkedInBy: pending.checkedInBy,
        isPendingSync: true
      };
    });
  }, [data, pendingMap]);

  const stats = useMemo(() => {
    let totalParticipants = 0;
    let checkedInParticipants = 0;
    let checkedInSubmissions = 0;

    for (const s of effectiveSubmissions) {
      const count = s.participantsCount || 1;
      totalParticipants += count;
      if (s.checkedIn) {
        checkedInSubmissions += 1;
        checkedInParticipants += count;
      }
    }

    return {
      totalSubmissions: effectiveSubmissions.length,
      checkedInSubmissions,
      totalParticipants,
      checkedInParticipants
    };
  }, [effectiveSubmissions]);

  const getPrimaryValue = useCallback(
    (sub: MergedTallySubmission): string => {
      const fieldEntries = Object.entries(sub.fields || {});
      return (
        (selectedForm?.primaryFieldId && sub.fields?.[selectedForm.primaryFieldId]) ||
        fieldEntries[0]?.[1] ||
        `Iscrizione #${sub.submissionId.slice(-6)}`
      );
    },
    [selectedForm]
  );

  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return effectiveSubmissions
      .filter((sub) => {
        if (filterMode === "pending" && sub.checkedIn) return false;
        if (filterMode === "checked_in" && !sub.checkedIn) return false;
        if (!q) return true;

        const allValues = Object.values(sub.fields || {})
          .join(" ")
          .toLowerCase();
        return allValues.includes(q);
      })
      .sort((a, b) =>
        getPrimaryValue(a).localeCompare(getPrimaryValue(b), "it", {
          sensitivity: "base"
        })
      );
  }, [effectiveSubmissions, filterMode, search, getPrimaryValue]);

  const pendingCount = Object.keys(pendingMap).length;

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Mai";
    try {
      return new Date(iso).toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };

  if (!forms || forms.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link
          href="/area-riservata"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna all&apos;Area Riservata</span>
        </Link>

        <div className="rounded-3xl border border-muted bg-muted/30 p-8 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-black text-foreground">Nessun modulo Tally configurato</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Chiedi a un amministratore di configurare e abilitare almeno un modulo Tally dalla sezione{" "}
            <strong>Iscrizioni & Check-in</strong> in Admin.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedFormId || !selectedForm) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-20 space-y-6">
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/area-riservata"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-muted/60 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Area Riservata</span>
          </Link>
        </div>

        <div className="space-y-1.5">
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
            Step 1 di 2
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Scegli l&apos;evento
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Seleziona il modulo Tally su cui vuoi consultare le iscrizioni o effettuare il check-in.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {forms.map((f) => {
            const draftCount = Object.keys(readLocalDraft(f.id)).length;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectForm(f.id)}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-muted hover:border-primary/40 transition-all active:scale-[0.99] flex items-center justify-between gap-4 group"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                      {f.name}
                    </h2>
                    {draftCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-accent/20 text-accent border border-accent/30">
                        {draftCount} da sincronizzare
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(f.allowedFields || []).length} campi configurati ·{" "}
                    {f.participantsMode === "from_field"
                      ? "Partecipanti da campo"
                      : "1 partecipante / iscrizione"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-24 space-y-4">
      {/* Top navigation & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleBackToEvents}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-muted/60 transition-all active:scale-95 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cambia evento</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadSubmissions(selectedFormId, true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground border border-muted transition-all active:scale-95 disabled:opacity-50 min-h-[40px]"
            title="Ricarica dati dal server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Aggiorna</span>
          </button>

          <button
            type="button"
            onClick={handleSyncFromTally}
            disabled={isSyncingTally || !selectedFormId}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 min-h-[40px] shadow-sm"
          >
            {isSyncingTally ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span>{isSyncingTally ? "Sync in corso..." : "Sync da Tally"}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
            Step 2 di 2 · Check-in
          </span>
          <button
            type="button"
            onClick={() => setIsSelectingMember(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-muted bg-muted/40 hover:bg-muted text-foreground transition-all active:scale-95"
          >
            <UserIcon className="w-3.5 h-3.5 text-primary" />
            <span>{activeMember ? `${activeMember} (cambia)` : "Seleziona il tuo nome"}</span>
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {selectedForm.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          Ultimo sync da Tally: <strong>{formatDate(data?.syncedAt)}</strong>
        </p>
      </div>

      {/* Member Identification Modal */}
      {isSelectingMember && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-muted/95 border border-muted rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Chi sta facendo il check-in?</h3>
              <button
                type="button"
                onClick={() => {
                  setIsSelectingMember(false);
                  setPendingToggleSub(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
              >
                Chiudi
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Seleziona il tuo nome prima di registrare le presenze in sala.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {members.map((mem) => (
                <button
                  key={mem}
                  type="button"
                  onClick={() => handleSelectMember(mem)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between min-h-[42px] ${
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

      {/* Status Message */}
      {statusMsg && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold border flex items-center justify-between gap-2 ${
            statusMsg.type === "success"
              ? "bg-primary/10 border-primary/30 text-foreground"
              : "bg-accent/15 border-accent/40 text-foreground"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Chiudi avviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clear Participant & Submission Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="rounded-2xl bg-muted/40 border border-muted p-3.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Partecipanti</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {stats.checkedInParticipants}
            </span>
            <span className="text-sm sm:text-base font-bold text-muted-foreground">
              / {stats.totalParticipants} presenti
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-muted/40 border border-muted p-3.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            <span>Iscrizioni</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.checkedInSubmissions}
            </span>
            <span className="text-sm sm:text-base font-bold text-muted-foreground">
              / {stats.totalSubmissions} totali
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Search + Filter + Explicit Sync Check-in Button */}
      <div className="sticky top-2 z-20 space-y-2.5 bg-background/95 backdrop-blur-md p-3 rounded-2xl border border-muted shadow-lg">
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={handleSyncCheckinsToBlob}
            disabled={isSyncingCheckins}
            className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {isSyncingCheckins ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            <span>
              {isSyncingCheckins
                ? "Salvataggio su storage..."
                : `Sincronizza Check-in (${pendingCount})`}
            </span>
          </button>
        )}

        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome, email o qualsiasi campo..."
            className="w-full min-h-[44px] pl-10 pr-10 rounded-xl bg-muted/50 border border-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Cancella ricerca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: `Tutti (${stats.totalSubmissions})` },
              {
                id: "pending",
                label: `Da fare (${stats.totalSubmissions - stats.checkedInSubmissions})`
              },
              { id: "checked_in", label: `Presenti (${stats.checkedInSubmissions})` }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                filterMode === tab.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {isLoading && !data ? (
        <div className="py-12 text-center space-y-2 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" />
          <p className="text-xs font-semibold">Caricamento iscrizioni...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="rounded-3xl border border-muted bg-muted/20 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-foreground">
            {effectiveSubmissions.length === 0
              ? "Nessuna sottomissione sincronizzata."
              : "Nessun risultato corrisponde alla ricerca."}
          </p>
          {effectiveSubmissions.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Premi <strong>&quot;Sync da Tally&quot;</strong> in alto per importare le iscrizioni nel Blob Storage.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSubmissions.map((sub) => {
            const fieldEntries = Object.entries(sub.fields || {});
            const primaryVal = getPrimaryValue(sub);
            const secondaryVal =
              (selectedForm?.secondaryFieldId && sub.fields?.[selectedForm.secondaryFieldId]) ||
              (fieldEntries[1]?.[0] !== selectedForm?.primaryFieldId ? fieldEntries[1]?.[1] : "");

            const isExpanded = Boolean(expandedIds[sub.submissionId]);
            const showParticipantsBadge =
              sub.participantsCount > 1 || selectedForm?.participantsMode === "from_field";

            return (
              <div
                key={sub.submissionId}
                className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
                  sub.checkedIn
                    ? "bg-primary/10 border-primary/35"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-base font-extrabold text-foreground leading-snug break-words">
                        {primaryVal}
                      </h3>
                      {showParticipantsBadge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-secondary/20 text-secondary border border-secondary/30">
                          <Users className="w-3 h-3" />
                          {sub.participantsCount}
                        </span>
                      )}
                      {sub.isPendingSync && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-accent/20 text-accent border border-accent/30">
                          Da sincronizzare
                        </span>
                      )}
                    </div>

                    {secondaryVal && (
                      <p className="text-xs text-muted-foreground font-medium break-all">
                        {secondaryVal}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/80">
                      <span>Inviato: {formatDate(sub.submittedAt)}</span>
                      {sub.checkedIn && sub.checkedInBy && (
                        <span className="text-primary font-semibold">
                          Check-in: {sub.checkedInBy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Large Touch-Friendly Check-in Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCheckin(sub)}
                    className={`shrink-0 min-h-[44px] min-w-[110px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      sub.checkedIn
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background hover:bg-muted text-foreground border border-muted"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{sub.checkedIn ? "Presente" : "Check-in"}</span>
                  </button>
                </div>

                {/* Expandable Details */}
                {fieldEntries.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-muted/50">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIds((prev) => ({
                          ...prev,
                          [sub.submissionId]: !prev[sub.submissionId]
                        }))
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Nascondi dettagli</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Mostra tutti i campi ({fieldEntries.length})</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {fieldEntries.map(([qId, val]) => (
                          <div
                            key={qId}
                            className="rounded-xl bg-background/60 border border-muted/60 p-2.5"
                          >
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {data?.fieldLabels?.[qId] || qId}
                            </dt>
                            <dd className="mt-0.5 text-foreground font-medium break-words">
                              {val}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

