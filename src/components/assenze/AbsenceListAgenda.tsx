"use client";

import React, { useMemo, useState } from "react";
import { AbsenceRecord, SpecialDate } from "@/types/absence";
import { Calendar, Clock, User, Plus, Trash2, CheckCircle2, Theater, Sparkles, Filter } from "lucide-react";

interface AbsenceListAgendaProps {
  year: number;
  month: number;
  members: string[];
  activeMember: string;
  absences: AbsenceRecord[];
  specialDates?: SpecialDate[];
  onAddForDate: (dateStr: string) => void;
  onDeleteAbsence: (id: string, memberName: string) => Promise<void>;
}

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const DAY_NAMES = [
  "Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"
];

export default function AbsenceListAgenda({
  year,
  month,
  activeMember,
  absences,
  specialDates = [],
  onAddForDate,
  onDeleteAbsence
}: AbsenceListAgendaProps) {
  const [filterMode, setFilterMode] = useState<"all" | "special" | "absences">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Map special dates
  const specialDatesMap = useMemo(() => {
    const map = new Map<string, SpecialDate>();
    for (const spec of specialDates || []) {
      map.set(spec.date, spec);
    }
    return map;
  }, [specialDates]);

  const daysList = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result = [];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = isCurrentMonth && day === todayDate;

      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;

      // Find all absences that include this date
      const dayAbsences: AbsenceRecord[] = [];
      for (const rec of absences || []) {
        if (rec.startDate <= dateStr && dateStr <= rec.endDate) {
          dayAbsences.push(rec);
        }
      }

      result.push({
        dayNumber: day,
        dayName: DAY_NAMES[dayOfWeek],
        dateStr,
        isWeekend,
        isToday,
        specialEvent: specialDatesMap.get(dateStr),
        absences: dayAbsences
      });
    }

    return result;
  }, [year, month, absences, specialDatesMap]);

  const filteredDays = useMemo(() => {
    if (filterMode === "special") {
      return daysList.filter((d) => !!d.specialEvent);
    }
    if (filterMode === "absences") {
      return daysList.filter((d) => d.absences.length > 0);
    }
    return daysList;
  }, [daysList, filterMode]);

  const specialDatesCount = useMemo(() => {
    return daysList.filter((d) => !!d.specialEvent).length;
  }, [daysList]);

  const absencesDaysCount = useMemo(() => {
    return daysList.filter((d) => d.absences.length > 0).length;
  }, [daysList]);

  const handleDelete = async (rec: AbsenceRecord) => {
    if (!confirm(`Vuoi cancellare l'assenza di ${rec.memberName}?`)) return;
    try {
      setDeletingId(rec.id);
      await onDeleteAbsence(rec.id, rec.memberName);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 ${
            filterMode === "all"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/50 text-muted-foreground hover:text-foreground border border-muted"
          }`}
        >
          Tutti i giorni ({daysList.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("special")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
            filterMode === "special"
              ? "bg-secondary text-secondary-foreground shadow"
              : "bg-muted/50 text-muted-foreground hover:text-foreground border border-muted"
          }`}
        >
          <Theater className="w-3.5 h-3.5" />
          <span>Appuntamenti ({specialDatesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("absences")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 ${
            filterMode === "absences"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/50 text-muted-foreground hover:text-foreground border border-muted"
          }`}
        >
          Con assenze ({absencesDaysCount})
        </button>
      </div>

      {filteredDays.length === 0 ? (
        <div className="p-8 text-center bg-muted/30 border border-muted rounded-2xl space-y-2">
          <CheckCircle2 className="w-10 h-10 text-secondary mx-auto opacity-80" />
          <h3 className="text-base font-semibold text-foreground">
            {filterMode === "special"
              ? "Nessun appuntamento questo mese"
              : "Tutti Presenti!"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {filterMode === "special"
              ? `Non ci sono appuntamenti in programma per ${MONTH_NAMES[month]} ${year}.`
              : `Nessuna assenza registrata per ${MONTH_NAMES[month]} ${year}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {filteredDays.map((d) => (
            <div
              key={d.dateStr}
              className={`border rounded-2xl p-3.5 sm:p-4 transition-all ${
                d.isToday
                  ? "bg-accent/10 border-accent/50 shadow-md ring-1 ring-accent/40"
                  : d.specialEvent
                  ? d.specialEvent.type === "show"
                    ? "bg-primary/5 border-primary/40 shadow-sm"
                    : "bg-secondary/5 border-secondary/40 shadow-sm"
                  : d.isWeekend
                  ? "bg-muted/20 border-muted"
                  : "bg-background/60 border-muted/70"
              }`}
            >
              {/* Card Header: Day + Date + Add Button */}
              <div className="flex items-center justify-between gap-2 mb-2.5 border-b border-muted/50 pb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                      d.isToday
                        ? "bg-accent text-accent-foreground"
                        : d.specialEvent
                        ? d.specialEvent.type === "show"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                        : d.isWeekend
                        ? "bg-secondary/80 text-secondary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <span>{d.dayNumber}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <span>{d.dayName}</span>
                      {d.isToday && (
                        <span className="text-[10px] bg-accent text-accent-foreground font-black px-1.5 py-0.2 rounded-full uppercase">
                          Oggi
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      {d.dayNumber} {MONTH_NAMES[month]} {year}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {d.absences.length > 0 ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {d.absences.length} {d.absences.length === 1 ? "assente" : "assenti"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium hidden xs:inline">
                      Presenti
                    </span>
                  )}
                  <button
                    onClick={() => onAddForDate(d.dateStr)}
                    title="Aggiungi assenza per questo giorno"
                    className="h-8 px-2.5 rounded-lg bg-muted hover:bg-muted-foreground/20 text-foreground active:scale-95 flex items-center gap-1 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px]">Segna</span>
                  </button>
                </div>
              </div>

              {/* Special Event Banner if rehearsal or show */}
              {d.specialEvent && (
                <div
                  className={`p-2 rounded-xl mb-2.5 flex items-center justify-between gap-2 text-xs font-semibold ${
                    d.specialEvent.type === "show"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary/20 text-secondary border border-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Theater className="w-4 h-4 shrink-0" />
                    <span className="truncate">{d.specialEvent.title}</span>
                  </div>
                  {d.specialEvent.note && (
                    <span className="text-[11px] font-normal opacity-90 shrink-0">
                      {d.specialEvent.note}
                    </span>
                  )}
                </div>
              )}

              {/* Absences List */}
              {d.absences.length > 0 ? (
                <div className="space-y-1.5">
                  {d.absences.map((rec) => {
                    const isMe = rec.memberName.trim().toLowerCase() === activeMember.trim().toLowerCase();
                    return (
                      <div
                        key={rec.id}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs ${
                          isMe
                            ? "bg-primary/10 border-primary/40 font-semibold"
                            : "bg-background/80 border-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              rec.status === "maybe" ? "bg-secondary" : "bg-primary"
                            }`}
                          />
                          <span className="truncate text-foreground font-medium">
                            {rec.memberName}
                            {isMe && <strong className="text-primary ml-1">(Tu)</strong>}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              rec.status === "maybe"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-primary/20 text-primary"
                            }`}
                          >
                            {rec.status === "maybe" ? "Forse" : "Certa"}
                          </span>
                          {rec.note && (
                            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                              &bull; {rec.note}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {rec.note && (
                            <span className="text-[10px] text-muted-foreground sm:hidden truncate max-w-[90px]">
                              {rec.note}
                            </span>
                          )}
                          {isMe ? (
                            <button
                              onClick={() => handleDelete(rec)}
                              disabled={deletingId === rec.id}
                              title="Elimina la tua assenza"
                              className="text-muted-foreground hover:text-primary w-7 h-7 rounded-lg hover:bg-primary/10 active:scale-95 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 italic px-1">
                              Solo lettura
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : d.specialEvent ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 py-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Tutti presenti! Nessuna assenza registrata.</span>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-0.5">
                  Nessun membro assente segnato.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
