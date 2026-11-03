"use client";

import React, { useMemo, useState } from "react";
import { AbsenceRecord } from "@/types/absence";
import { Calendar, Clock, User, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface AbsenceListAgendaProps {
  year: number;
  month: number;
  members: string[];
  activeMember: string;
  absences: AbsenceRecord[];
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
  onAddForDate,
  onDeleteAbsence
}: AbsenceListAgendaProps) {
  const [onlyDaysWithAbsences, setOnlyDaysWithAbsences] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        absences: dayAbsences
      });
    }

    return result;
  }, [year, month, absences]);

  const filteredDays = useMemo(() => {
    if (onlyDaysWithAbsences) {
      return daysList.filter((d) => d.absences.length > 0);
    }
    return daysList;
  }, [daysList, onlyDaysWithAbsences]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={onlyDaysWithAbsences}
            onChange={(e) => setOnlyDaysWithAbsences(e.target.checked)}
            className="w-4 h-4 rounded border-muted bg-background text-primary focus:ring-primary accent-primary"
          />
          <span>Mostra solo i giorni con assenze</span>
        </label>
        <span className="text-xs text-muted-foreground">
          {filteredDays.length} {filteredDays.length === 1 ? "giorno trovato" : "giorni trovati"}
        </span>
      </div>

      {filteredDays.length === 0 ? (
        <div className="p-8 text-center bg-muted/30 border border-muted rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-foreground">Tutti Presenti!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Nessuna assenza registrata per {MONTH_NAMES[month]} {year}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDays.map((d) => (
            <div
              key={d.dateStr}
              className={`border rounded-2xl p-4 transition-all ${
                d.isToday
                  ? "bg-accent/5 border-accent/40 shadow-md ring-1 ring-accent/30"
                  : d.isWeekend
                  ? "bg-muted/30 border-muted"
                  : "bg-background/60 border-muted/70"
              }`}
            >
              <div className="flex items-center justify-between mb-3 border-b border-muted/50 pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${
                      d.isToday
                        ? "bg-accent text-accent-foreground"
                        : d.isWeekend
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <span>{d.dayNumber}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <span>{d.dayName}</span>
                      {d.isToday && (
                        <span className="text-[10px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded-full uppercase">
                          Oggi
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {d.dayNumber} {MONTH_NAMES[month]} {year}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {d.absences.length > 0 ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {d.absences.length} {d.absences.length === 1 ? "assente" : "assenti"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Presenti</span>
                  )}
                  <button
                    onClick={() => onAddForDate(d.dateStr)}
                    title="Aggiungi assenza per questa data"
                    className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {d.absences.length > 0 ? (
                <div className="space-y-2">
                  {d.absences.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background/80 border border-muted"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            rec.status === "maybe" ? "bg-secondary" : "bg-primary"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                              {rec.memberName}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                rec.status === "maybe"
                                  ? "bg-secondary/20 text-secondary border border-secondary/30"
                                  : "bg-primary/20 text-primary border border-primary/30"
                              }`}
                            >
                              {rec.status === "maybe" ? "Forse" : "Certa"}
                            </span>
                          </div>
                          {rec.note && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-accent shrink-0" />
                              <span className="truncate">{rec.note}</span>
                            </p>
                          )}
                          {rec.startDate !== rec.endDate && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                              Periodo: {rec.startDate} - {rec.endDate}
                            </p>
                          )}
                        </div>
                      </div>

                      {rec.memberName.trim().toLowerCase() === activeMember.trim().toLowerCase() ? (
                        <button
                          onClick={() => handleDelete(rec)}
                          disabled={deletingId === rec.id}
                          title="Elimina la tua assenza"
                          className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors shrink-0 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic shrink-0 px-1">
                          Solo lettura
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
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

