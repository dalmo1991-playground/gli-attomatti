"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Check,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { AbsenceRecord } from "@/types/absence";
import {
  requestGoogleCalendarToken,
  fetchUserCalendars,
  fetchCalendarEvents,
  GoogleCalendarItem,
  ParsedGCalEvent
} from "@/lib/googleCalendar";

interface GoogleCalendarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMember: string;
  existingAbsences?: AbsenceRecord[];
  onDeleteAbsence?: (id: string, memberName: string) => Promise<void> | void;
  onSuccess: (newRecords: AbsenceRecord[]) => void;
}

interface SelectedEventState {
  included: boolean;
  status: "certain" | "maybe";
  customNote: string;
}

/**
 * Checks whether two inclusive date ranges (YYYY-MM-DD) overlap.
 */
function isDateOverlap(
  startA?: string,
  endA?: string,
  startB?: string,
  endB?: string
): boolean {
  if (!startA || !startB) return false;
  const sA = startA;
  const eA = endA || startA;
  const sB = startB;
  const eB = endB || startB;
  return sA <= eB && eA >= sB;
}

export default function GoogleCalendarImportModal({
  isOpen,
  onClose,
  activeMember,
  existingAbsences = [],
  onDeleteAbsence,
  onSuccess
}: GoogleCalendarImportModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 2: Events list & selections
  const [events, setEvents] = useState<ParsedGCalEvent[]>([]);
  const [eventStates, setEventStates] = useState<Record<string, SelectedEventState>>({});

  // Local state for deleted absences & inspecting already marked
  const [deletedAbsenceIds, setDeletedAbsenceIds] = useState<Set<string>>(new Set());
  const [isDeletingAbsenceId, setIsDeletingAbsenceId] = useState<string | null>(null);
  const [showAlreadyMarked, setShowAlreadyMarked] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg("");
      setDeletedAbsenceIds(new Set());
      setIsDeletingAbsenceId(null);
      setShowAlreadyMarked(false);

      const today = new Date();
      const inTwoMonths = new Date();
      inTwoMonths.setDate(today.getDate() + 60);

      const sy = today.getFullYear();
      const sm = String(today.getMonth() + 1).padStart(2, "0");
      const sd = String(today.getDate()).padStart(2, "0");
      setStartDate(`${sy}-${sm}-${sd}`);

      const ey = inTwoMonths.getFullYear();
      const em = String(inTwoMonths.getMonth() + 1).padStart(2, "0");
      const ed = String(inTwoMonths.getDate()).padStart(2, "0");
      setEndDate(`${ey}-${em}-${ed}`);
    }
  }, [isOpen]);

  // Active absences list excluding those deleted during this session
  const activeExistingAbsences = useMemo(() => {
    return (existingAbsences || []).filter((a) => !deletedAbsenceIds.has(a.id));
  }, [existingAbsences, deletedAbsenceIds]);

  // Comparison 1: Events in gCal already recorded as absence (to hide from proposals)
  const alreadyMarkedEvents = useMemo(() => {
    return (events || []).filter((ev) =>
      activeExistingAbsences.some((abs) =>
        isDateOverlap(ev.startDate, ev.endDate, abs.startDate, abs.endDate)
      )
    );
  }, [events, activeExistingAbsences]);

  // Comparison 2: Events in gCal NOT in absences (propose to add)
  const proposedEvents = useMemo(() => {
    return (events || []).filter(
      (ev) =>
        !activeExistingAbsences.some((abs) =>
          isDateOverlap(ev.startDate, ev.endDate, abs.startDate, abs.endDate)
        )
    );
  }, [events, activeExistingAbsences]);

  // Comparison 3: Incongruences (Absences in system in this range with NO event in gCal)
  const incongruentAbsences = useMemo(() => {
    if (!startDate || !endDate) return [];
    return activeExistingAbsences.filter((abs) => {
      // Must fall within or intersect the queried date range
      const inRange = isDateOverlap(abs.startDate, abs.endDate, startDate, endDate);
      if (!inRange) return false;

      // Has NO matching event in fetched gCal events
      const hasGCalEvent = (events || []).some((ev) =>
        isDateOverlap(ev.startDate, ev.endDate, abs.startDate, abs.endDate)
      );
      return !hasGCalEvent;
    });
  }, [activeExistingAbsences, startDate, endDate, events]);

  // Step 1: Connect to Google and fetch calendars
  const handleConnectAndFetchCalendars = async () => {
    setErrorMsg("");
    if (!clientId) {
      setErrorMsg(
        "Configurazione mancante: la variabile d'ambiente NEXT_PUBLIC_GOOGLE_CLIENT_ID non è stata configurata. Segui le istruzioni per crearla gratuitamente su Google Cloud Console."
      );
      return;
    }

    setIsLoading(true);
    try {
      const token = await requestGoogleCalendarToken(clientId);
      setAccessToken(token);

      const cals = await fetchUserCalendars(token);
      setCalendars(cals);
      if (cals.length > 0) {
        setSelectedCalendarId(cals[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Impossibile autenticarsi con Google. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Search events between dates and perform comparison
  const handleSearchEvents = async () => {
    if (!accessToken || !selectedCalendarId) {
      setErrorMsg("Seleziona un calendario per continuare.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Seleziona una data di inizio e una di fine.");
      return;
    }
    if (endDate < startDate) {
      setErrorMsg("La data di fine non può precedere la data di inizio.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const evs = await fetchCalendarEvents(accessToken, selectedCalendarId, startDate, endDate);
      setEvents(evs);

      // Initialize only new events (not yet in absences) with "certain" status and time slot note
      const states: Record<string, SelectedEventState> = {};
      for (const ev of evs) {
        const isAlreadyMarked = activeExistingAbsences.some((abs) =>
          isDateOverlap(ev.startDate, ev.endDate, abs.startDate, abs.endDate)
        );
        if (!isAlreadyMarked) {
          states[ev.id] = {
            included: true,
            status: "certain",
            customNote: ev.timeSlotNote || ""
          };
        }
      }
      setEventStates(states);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore durante il recupero degli appuntamenti.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 bulk actions for proposed events
  const selectedCount = useMemo(() => {
    return proposedEvents.filter((ev) => eventStates[ev.id]?.included).length;
  }, [proposedEvents, eventStates]);

  const toggleSelectAll = (select: boolean) => {
    setEventStates((prev) => {
      const updated = { ...prev };
      for (const ev of proposedEvents) {
        if (updated[ev.id]) {
          updated[ev.id] = { ...updated[ev.id], included: select };
        } else {
          updated[ev.id] = {
            included: select,
            status: "certain",
            customNote: ev.timeSlotNote || ""
          };
        }
      }
      return updated;
    });
  };

  const setAllStatus = (status: "certain" | "maybe") => {
    setEventStates((prev) => {
      const updated = { ...prev };
      for (const ev of proposedEvents) {
        if (updated[ev.id]) {
          updated[ev.id] = { ...updated[ev.id], status };
        }
      }
      return updated;
    });
  };

  // Delete an incongruent absence directly from the modal
  const handleDeleteIncongruence = async (abs: AbsenceRecord) => {
    if (!onDeleteAbsence) return;

    const dateLabel =
      abs.startDate === abs.endDate
        ? abs.startDate.split("-").reverse().join("/")
        : `dal ${abs.startDate.split("-").reverse().join("/")} al ${abs.endDate.split("-").reverse().join("/")}`;

    if (!confirm(`Vuoi rimuovere questa assenza (${dateLabel}) dal calendario assenze?`)) {
      return;
    }

    setIsDeletingAbsenceId(abs.id);
    try {
      await onDeleteAbsence(abs.id, abs.memberName);
      setDeletedAbsenceIds((prev) => new Set(prev).add(abs.id));
    } catch (err: any) {
      setErrorMsg("Errore durante la cancellazione dell'assenza: " + (err?.message || "Imprevisto"));
    } finally {
      setIsDeletingAbsenceId(null);
    }
  };

  // Final confirmation: convert selected proposed events into AbsenceRecord objects
  const handleCreateAbsences = () => {
    const newRecords: AbsenceRecord[] = [];

    for (const ev of proposedEvents) {
      const state = eventStates[ev.id];
      if (!state || !state.included) continue;

      // Privacy: use ONLY the customNote (defaults to time slot), NEVER the private title!
      const finalNote = state.customNote?.trim() || undefined;

      const rec: AbsenceRecord = {
        id: `abs_gcal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        memberName: activeMember.trim(),
        startDate: ev.startDate,
        endDate: ev.endDate,
        status: state.status,
        note: finalNote,
        createdAt: new Date().toISOString()
      };

      newRecords.push(rec);
    }

    if (newRecords.length === 0) {
      setErrorMsg("Nessun appuntamento selezionato da importare.");
      return;
    }

    onSuccess(newRecords);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-muted border border-muted-foreground/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-muted-foreground/20 pb-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <span>Sincronizzazione Google Calendar</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 bg-primary/10 border border-primary/30 rounded-xl text-primary text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Missing Client ID Guidance (if not configured yet) */}
        {!clientId && (
          <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-secondary text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Configurazione Google Cloud Richiesta (Gratuita)</span>
            </div>
            <p className="text-muted-foreground">
              Per consentire a Google di aprire il popup sicuro di autorizzazione sul tuo browser, è necessario impostare la variabile d&apos;ambiente <code className="bg-background px-1 py-0.5 rounded font-mono text-foreground">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
            </p>
            <p className="text-muted-foreground">
              La procedura richiede circa 3 minuti su <strong className="text-foreground">Google Cloud Console</strong> ed è garantita <strong className="text-foreground">100% gratuita per sempre</strong> (fino a 1.000.000 richieste al giorno, nessuna carta di credito richiesta).
            </p>
          </div>
        )}

        {/* STEP 1: AUTHENTICATION, CALENDAR PICKER & DATE RANGE */}
        {step === 1 && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px]">
                1
              </span>
              <span>Scegli il Calendario e l&apos;Intervallo di Date da confrontare</span>
            </div>

            {/* Google Authentication Trigger */}
            {!accessToken ? (
              <div className="p-5 bg-background/60 border border-muted rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-foreground">
                    Carica i tuoi impegni personali
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md mx-auto">
                    Confronta automaticamente gli appuntamenti di Google Calendar con il calendario assenze di <strong>{activeMember}</strong> per identificare nuovi impegni, impegni già presenti e incongruenze.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConnectAndFetchCalendars}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-3 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all inline-flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connessione a Google in corso...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Accedi con Google</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-secondary/15 border border-secondary/30 rounded-xl flex items-center justify-between text-xs text-secondary">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Accesso Google autorizzato con successo</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectAndFetchCalendars}
                    className="underline text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Cambia account
                  </button>
                </div>

                {/* Calendar Selector (supports multiple calendars: personal, work, etc.) */}
                <div>
                  <label
                    htmlFor="gcal-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Quale calendario vuoi confrontare?
                  </label>
                  <select
                    id="gcal-select"
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full bg-background border border-muted rounded-xl px-3 py-2.5 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary} {c.primary ? "(Principale)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date range pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="gcal-start-date"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Dalla data
                    </label>
                    <input
                      id="gcal-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (endDate < e.target.value) setEndDate(e.target.value);
                      }}
                      className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gcal-end-date"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Alla data (compresa)
                    </label>
                    <input
                      id="gcal-end-date"
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleSearchEvents}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Confronto in corso...</span>
                      </>
                    ) : (
                      <>
                        <span>Confronta Calendario Google e Assenze</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: COMPARISON REVIEW & SELECTION */}
        {step === 2 && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {/* Header step 2 */}
            <div className="flex items-center justify-between gap-2 text-xs border-b border-muted/50 pb-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <span>
                  Esito confronto per <strong>{activeMember}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary hover:underline font-semibold"
              >
                &larr; Cambia date
              </button>
            </div>

            {/* Comparison Overview Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-background border border-muted">
                <div className="text-base sm:text-lg font-bold text-foreground">
                  {proposedEvents.length}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Nuovi da aggiungere
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background border border-muted">
                <div className="text-base sm:text-lg font-bold text-muted-foreground">
                  {alreadyMarkedEvents.length}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Già segnati
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-colors ${
                  incongruentAbsences.length > 0
                    ? "bg-accent/10 border-accent/40 text-accent font-semibold"
                    : "bg-background border-muted text-muted-foreground"
                }`}
              >
                <div className="text-base sm:text-lg font-bold">
                  {incongruentAbsences.length}
                </div>
                <div className="text-[11px] font-medium">
                  Incongruenze
                </div>
              </div>
            </div>

            {/* SECTION 1: INCONGRUENCES (In assenze ma NON in gCal) */}
            {incongruentAbsences.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-accent/10 border border-accent/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-accent font-bold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Incongruenze Rilevate ({incongruentAbsences.length})</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Le seguenti assenze sono segnate nel calendario della compagnia per <strong>{activeMember}</strong>, ma <strong>nessun appuntamento corrispondente è presente in Google Calendar</strong> in questo periodo. Potresti aver rimosso o spostato l&apos;evento su Google:
                </p>

                <div className="space-y-2">
                  {incongruentAbsences.map((abs) => (
                    <div
                      key={abs.id}
                      className="flex items-center justify-between gap-3 p-2.5 bg-background border border-muted rounded-xl text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">
                            {abs.startDate === abs.endDate
                              ? abs.startDate.split("-").reverse().join("/")
                              : `Dal ${abs.startDate.split("-").reverse().join("/")} al ${abs.endDate.split("-").reverse().join("/")}`}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              abs.status === "maybe"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-primary/20 text-primary"
                            }`}
                          >
                            {abs.status === "maybe" ? "Forse" : "Certa"}
                          </span>
                        </div>
                        {abs.note && (
                          <p className="text-[11px] text-muted-foreground italic truncate">
                            Nota condivisa: {abs.note}
                          </p>
                        )}
                      </div>

                      {onDeleteAbsence && (
                        <button
                          type="button"
                          disabled={isDeletingAbsenceId === abs.id}
                          onClick={() => handleDeleteIncongruence(abs)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-[11px] transition-colors shrink-0 disabled:opacity-50"
                          title="Rimuovi questa assenza incongruente"
                        >
                          {isDeletingAbsenceId === abs.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Rimuovi assenza</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: ALREADY MARKED (In gCal ed in assenze -> NON MOSTRARE nella selezione) */}
            {alreadyMarkedEvents.length > 0 && (
              <div className="p-3 bg-muted/40 border border-muted rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>
                      <strong className="text-foreground">{alreadyMarkedEvents.length}</strong>{" "}
                      {alreadyMarkedEvents.length === 1
                        ? "appuntamento è già segnato come assenza (escluso)"
                        : "appuntamenti sono già segnati come assenze (esclusi)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAlreadyMarked((prev) => !prev)}
                    className="text-[11px] text-secondary hover:underline font-semibold flex items-center gap-1"
                  >
                    {showAlreadyMarked ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Nascondi</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Mostra</span>
                      </>
                    )}
                  </button>
                </div>

                {showAlreadyMarked && (
                  <div className="pt-2 border-t border-muted/50 space-y-1.5 max-h-36 overflow-y-auto">
                    {alreadyMarkedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between gap-2 p-2 bg-background/50 rounded-lg text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-foreground shrink-0">
                            {ev.startDate === ev.endDate
                              ? ev.startDate.split("-").reverse().join("/")
                              : `${ev.startDate.split("-").reverse().join("/")} - ${ev.endDate.split("-").reverse().join("/")}`}
                          </span>
                          <span className="text-muted-foreground italic truncate">
                            {ev.privateTitle}
                          </span>
                        </div>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0">
                          Già segnata
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: PROPOSED EVENTS (In gCal ma NON in assenze -> Proponi di aggiungere) */}
            {proposedEvents.length === 0 ? (
              <div className="p-6 text-center bg-muted/20 border border-muted rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-sm text-foreground">
                  Nessun nuovo appuntamento da aggiungere
                </h5>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {events.length === 0
                    ? "Nessun impegno trovato in questo periodo nel calendario selezionato."
                    : "Tutti gli appuntamenti trovati su Google Calendar per questo intervallo risultano già registrati nel calendario assenze."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Privacy Protection Banner */}
                <div className="p-3 bg-background/80 border border-muted rounded-xl flex items-start gap-2.5 text-xs">
                  <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Privacy garantita:</strong> i titoli dei tuoi impegni privati sono mostrati qui solo a te per aiutarti nella scelta. Nel calendario condiviso con la compagnia verrà salvata <strong className="text-foreground">soltanto la data e la fascia oraria</strong>.
                  </div>
                </div>

                {/* Quick Bulk Action Tools */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-xl border border-muted text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(true)}
                      className="text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Seleziona tutti ({proposedEvents.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(false)}
                      className="text-muted-foreground hover:text-foreground underline flex items-center gap-1"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Deseleziona tutti</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Tutti come:</span>
                    <button
                      type="button"
                      onClick={() => setAllStatus("certain")}
                      className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold text-[11px] hover:bg-primary/30"
                    >
                      Certa
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllStatus("maybe")}
                      className="px-2 py-0.5 rounded bg-secondary/20 text-secondary font-bold text-[11px] hover:bg-secondary/30"
                    >
                      Forse
                    </button>
                  </div>
                </div>

                {/* Proposed Events List */}
                <div className="space-y-2">
                  {proposedEvents.map((ev) => {
                    const state = eventStates[ev.id] || {
                      included: true,
                      status: "certain",
                      customNote: ev.timeSlotNote || ""
                    };

                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          state.included
                            ? "bg-background border-muted shadow-sm"
                            : "bg-muted/15 border-muted/40 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Checkbox & Details */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={state.included}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setEventStates((prev) => ({
                                  ...prev,
                                  [ev.id]: { ...state, included: checked }
                                }));
                              }}
                              className="w-4 h-4 rounded border-muted bg-background text-primary focus:ring-primary accent-primary mt-1 shrink-0 cursor-pointer"
                            />

                            <div className="space-y-1 min-w-0 flex-1">
                              {/* Date & Time slot */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground text-xs sm:text-sm">
                                  {ev.startDate === ev.endDate
                                    ? ev.startDate.split("-").reverse().join("/")
                                    : `Dal ${ev.startDate.split("-").reverse().join("/")} al ${ev.endDate.split("-").reverse().join("/")}`}
                                </span>

                                {ev.timeSlotNote ? (
                                  <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{ev.timeSlotNote}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                    Intera giornata
                                  </span>
                                )}
                              </div>

                              {/* Private title (Shown only here in mask, with lock indicator) */}
                              <div className="flex items-center gap-1.5 text-xs text-foreground/80 truncate">
                                <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                <span className="truncate italic font-medium">
                                  {ev.privateTitle}
                                </span>
                              </div>

                              {/* Editable absence note input (prefilled with timeSlotNote only) */}
                              <div className="pt-1">
                                <input
                                  type="text"
                                  value={state.customNote}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEventStates((prev) => ({
                                      ...prev,
                                      [ev.id]: { ...state, customNote: val }
                                    }));
                                  }}
                                  placeholder="Nota condivisa (opzionale, es. Dalle 20:30)"
                                  className="w-full bg-muted/40 border border-muted/80 rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Status Toggle (Certa vs Forse) */}
                          <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEventStates((prev) => ({
                                  ...prev,
                                  [ev.id]: { ...state, status: "certain", included: true }
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                state.status === "certain"
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <X className="w-3 h-3" />
                              <span>Certa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEventStates((prev) => ({
                                  ...prev,
                                  [ev.id]: { ...state, status: "maybe", included: true }
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                state.status === "maybe"
                                  ? "bg-secondary text-secondary-foreground shadow-sm"
                                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <HelpCircle className="w-3 h-3" />
                              <span>Forse</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-muted">
              {proposedEvents.length > 0 ? (
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={handleCreateAbsences}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedCount === 0
                      ? "Seleziona almeno un appuntamento da importare"
                      : `Crea ${selectedCount} ${selectedCount === 1 ? "Assenza" : "Assenze"} in Bozza`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 px-4 rounded-xl border border-muted transition-colors text-xs sm:text-sm"
                >
                  Chiudi
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
