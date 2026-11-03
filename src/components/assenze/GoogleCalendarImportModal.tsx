"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square
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
  onSuccess: (newRecords: AbsenceRecord[]) => void;
}

interface SelectedEventState {
  included: boolean;
  status: "certain" | "maybe";
  customNote: string;
}

export default function GoogleCalendarImportModal({
  isOpen,
  onClose,
  activeMember,
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

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg("");
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

  if (!isOpen) return null;

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

  // Step 1: Search events between dates
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

      // Initialize all events as included with "certain" status and their timeSlotNote (never private title)
      const states: Record<string, SelectedEventState> = {};
      for (const ev of evs) {
        states[ev.id] = {
          included: true,
          status: "certain",
          customNote: ev.timeSlotNote || ""
        };
      }
      setEventStates(states);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore durante il recupero degli appuntamenti.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 bulk actions
  const selectedCount = useMemo(() => {
    return Object.values(eventStates).filter((s) => s.included).length;
  }, [eventStates]);

  const toggleSelectAll = (select: boolean) => {
    setEventStates((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = { ...updated[key], included: select };
      }
      return updated;
    });
  };

  const setAllStatus = (status: "certain" | "maybe") => {
    setEventStates((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = { ...updated[key], status };
      }
      return updated;
    });
  };

  // Final confirmation: convert selected events into AbsenceRecord objects
  const handleCreateAbsences = () => {
    const newRecords: AbsenceRecord[] = [];

    for (const ev of events) {
      const state = eventStates[ev.id];
      if (!state || !state.included) continue;

      // Privacy: use ONLY the customNote (which defaults to time slot), NEVER the private title!
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

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-muted border border-muted-foreground/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto sm:hidden mb-0.5" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-muted-foreground/20 pb-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <span>Importa da Google Calendar</span>
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
              <span>Scegli il Calendario e l&apos;Intervallo di Date</span>
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
                    Autorizza l&apos;accesso in sola lettura temporanea per selezionare gli appuntamenti da segnare come assenza per <strong>{activeMember}</strong>.
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-xs text-emerald-400">
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
                    Quale calendario vuoi considerare?
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
                        <span>Ricerca appuntamenti in corso...</span>
                      </>
                    ) : (
                      <>
                        <span>Cerca Appuntamenti</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: REVIEW & SELECTION MASK */}
        {step === 2 && (
          <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {/* Header step 2 */}
            <div className="flex items-center justify-between gap-2 text-xs border-b border-muted/50 pb-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <span>Seleziona quali appuntamenti trasformare in assenze ({selectedCount} di {events.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary hover:underline font-semibold"
              >
                &larr; Cambia date
              </button>
            </div>

            {/* Privacy Protection Banner */}
            <div className="p-3 bg-background/80 border border-muted rounded-xl flex items-start gap-2.5 text-xs">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Privacy garantita:</strong> i titoli dei tuoi impegni privati sono mostrati qui solo a te per aiutarti nella scelta. Nel calendario condiviso con la compagnia verrà salvata <strong className="text-foreground">soltanto la data e la fascia oraria</strong> (senza il titolo dell&apos;evento).
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
                  <span>Seleziona tutti ({events.length})</span>
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

            {/* Events List */}
            {events.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 border border-muted rounded-2xl text-muted-foreground text-xs sm:text-sm">
                Nessun appuntamento trovato in questo periodo nel calendario selezionato.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => {
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
                            <span>✕ Certa</span>
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
                            <span>? Forse</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 border-t border-muted">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleCreateAbsences}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {selectedCount === 0
                    ? "Seleziona almeno un appuntamento"
                    : `Crea ${selectedCount} ${selectedCount === 1 ? "Assenza" : "Assenze"} in Bozza`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

