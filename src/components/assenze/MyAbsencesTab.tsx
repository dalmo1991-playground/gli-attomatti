"use client";

import React, { useMemo, useState } from "react";
import { AbsenceRecord, SpecialDate } from "@/types/absence";
import GoogleCalendarImportModal from "./GoogleCalendarImportModal";
import {
  User,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Theater,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";

interface MyAbsencesTabProps {
  year: number;
  month: number;
  members: string[];
  absences: AbsenceRecord[];
  specialDates?: SpecialDate[];
  activeMember: string;
  onSelectMember: (member: string) => void;
  onOpenAddModal: (prefillMember?: string, prefillDate?: string) => void;
  onBatchAddAbsences?: (records: AbsenceRecord[]) => void;
  onDeleteAbsence: (id: string, memberName: string) => Promise<void>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onToday?: () => void;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export default function MyAbsencesTab({
  year,
  month,
  absences,
  specialDates = [],
  activeMember,
  onOpenAddModal,
  onBatchAddAbsences,
  onDeleteAbsence,
  onPrevMonth,
  onNextMonth,
  onToday
}: MyAbsencesTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Filter absences belonging exclusively to the active member
  const myAbsences = useMemo(() => {
    if (!activeMember) return [];
    return (absences || []).filter(
      (a) => a.memberName.trim().toLowerCase() === activeMember.trim().toLowerCase()
    );
  }, [absences, activeMember]);

  // Map special dates (shows and rehearsals)
  const specialDatesMap = useMemo(() => {
    const map = new Map<string, SpecialDate>();
    for (const spec of specialDates || []) {
      map.set(spec.date, spec);
    }
    return map;
  }, [specialDates]);

  // Generate 7 * num_weeks calendar cells
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // 0 = Monday, 6 = Sunday
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // 1. Previous month trailing days
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, "0");
      const d = String(dayNum).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      cells.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isWeekend: (prevDate.getDay() + 6) % 7 >= 5
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const curDate = new Date(year, month, day);
      const m = String(month + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const dateStr = `${year}-${m}-${d}`;
      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isWeekend: (curDate.getDay() + 6) % 7 >= 5
      });
    }

    // 3. Next month leading days to complete full 7 * num_weeks
    const totalWeeks = Math.ceil(cells.length / 7);
    const totalCells = totalWeeks * 7;
    const trailingCount = totalCells - cells.length;
    for (let day = 1; day <= trailingCount; day++) {
      const nextDate = new Date(year, month + 1, day);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isWeekend: (nextDate.getDay() + 6) % 7 >= 5
      });
    }

    return cells;
  }, [year, month]);

  // Separate upcoming and past absences for list
  const { upcoming, past } = useMemo(() => {
    const up: AbsenceRecord[] = [];
    const pa: AbsenceRecord[] = [];
    const sorted = [...myAbsences].sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (const item of sorted) {
      if (item.endDate >= todayStr) {
        up.push(item);
      } else {
        pa.push(item);
      }
    }
    return { upcoming: up, past: pa };
  }, [myAbsences, todayStr]);

  const handleDelete = async (rec: AbsenceRecord) => {
    if (!confirm(`Vuoi cancellare questa assenza (${rec.startDate}${rec.startDate !== rec.endDate ? ` - ${rec.endDate}` : ""})?`)) {
      return;
    }
    try {
      setDeletingId(rec.id);
      await onDeleteAbsence(rec.id, rec.memberName);
      if (selectedDate && rec.startDate <= selectedDate && selectedDate <= rec.endDate) {
        setSelectedDate(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Currently selected date info
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const absence = myAbsences.find(
      (a) => a.startDate <= selectedDate && selectedDate <= a.endDate
    );
    const specialEvent = specialDatesMap.get(selectedDate);
    return {
      dateStr: selectedDate,
      absence,
      specialEvent
    };
  }, [selectedDate, myAbsences, specialDatesMap]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Action Buttons: 2-column grid that mathematically never overflows on mobile */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenAddModal(activeMember)}
          className="h-10 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all truncate"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="truncate">Nuova Assenza</span>
        </button>

        <button
          type="button"
          onClick={() => setIsGCalModalOpen(true)}
          className="h-10 sm:h-11 bg-muted hover:bg-muted-foreground/20 text-foreground font-semibold text-xs sm:text-sm px-3 rounded-xl flex items-center justify-center gap-1.5 border border-muted shadow-sm active:scale-95 transition-all truncate"
          title="Importa impegni da Google Calendar"
        >
          <Download className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">Importa da GCal</span>
        </button>
      </div>

      {/* Month Navigation Header (Desktop / Tablet view) */}
      <div className="bg-muted/30 border border-muted/80 rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onPrevMonth && (
            <button
              type="button"
              onClick={onPrevMonth}
              className="w-8 h-8 rounded-xl bg-background hover:bg-muted text-foreground flex items-center justify-center border border-muted active:scale-95 transition-all"
              title="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="leading-tight px-1">
            <h3 className="font-extrabold text-sm sm:text-base capitalize text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary shrink-0 hidden sm:inline" />
              <span>{MONTH_NAMES[month]} {year}</span>
            </h3>
          </div>

          {onNextMonth && (
            <button
              type="button"
              onClick={onNextMonth}
              className="w-8 h-8 rounded-xl bg-background hover:bg-muted text-foreground flex items-center justify-center border border-muted active:scale-95 transition-all"
              title="Mese successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onToday && (
            <button
              type="button"
              onClick={onToday}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-muted transition-colors active:scale-95"
            >
              Oggi
            </button>
          )}
          <span className="text-[11px] text-muted-foreground hidden md:inline">
            Tocca un giorno per segnare la tua assenza
          </span>
        </div>
      </div>

      {/* SQUARE MONTH CALENDAR (7 * num_settimane) */}
      <div className="bg-background/80 border border-muted rounded-2xl p-2.5 sm:p-4 shadow-sm space-y-2">
        {/* Weekday column headers (Lun - Dom) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={`py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                idx >= 5 ? "text-secondary font-black" : "text-muted-foreground"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 7 * N Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarCells.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const absence = cell.isCurrentMonth
              ? myAbsences.find((a) => a.startDate <= cell.dateStr && cell.dateStr <= a.endDate)
              : null;
            const isAbsent = Boolean(absence);
            const isMaybe = absence?.status === "maybe";
            const specialEvent = cell.isCurrentMonth ? specialDatesMap.get(cell.dateStr) : null;
            const isSelected = selectedDate === cell.dateStr;

            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={cell.dateStr}
                  className="aspect-square rounded-xl p-1 flex flex-col items-center justify-start opacity-25 bg-muted/10 border border-muted/20 select-none pointer-events-none"
                >
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
                    {cell.dayNumber}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(cell.dateStr);
                  if (!isAbsent) {
                    onOpenAddModal(activeMember, cell.dateStr);
                  }
                }}
                className={`aspect-square rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-between transition-all relative border active:scale-95 text-left select-none ${
                  isAbsent
                    ? isMaybe
                      ? "bg-secondary/20 border-secondary text-secondary-foreground shadow-sm ring-1 ring-secondary"
                      : "bg-primary/20 border-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                    : specialEvent
                    ? specialEvent.type === "show"
                      ? "bg-primary/10 border-primary/50 text-foreground"
                      : "bg-secondary/10 border-secondary/50 text-foreground"
                    : isToday
                    ? "bg-accent/15 border-accent text-foreground ring-2 ring-accent"
                    : cell.isWeekend
                    ? "bg-muted/25 border-muted/60 text-foreground hover:bg-muted/50"
                    : "bg-background/80 border-muted/70 text-foreground hover:bg-muted/40"
                } ${isSelected ? "ring-2 ring-foreground" : ""}`}
                title={`${cell.dateStr}${isAbsent ? ` - Assente (${absence?.status})` : ""}${specialEvent ? ` - ${specialEvent.title}` : ""}`}
              >
                {/* Top Row: Day Number + Today indicator */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-[11px] sm:text-xs font-bold leading-none ${
                      isToday
                        ? "text-accent font-black"
                        : isAbsent
                        ? isMaybe
                          ? "text-secondary font-black"
                          : "text-primary font-black"
                        : "text-foreground"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  )}

                  {specialEvent && (
                    <span
                      className="leading-none shrink-0"
                      title={specialEvent.title}
                    >
                      <Theater
                        className={`w-3 h-3 ${
                          specialEvent.type === "show"
                            ? "text-primary"
                            : "text-secondary"
                        }`}
                      />
                    </span>
                  )}
                </div>

                {/* Center / Bottom: Absence badge */}
                <div className="w-full flex items-center justify-center">
                  {isAbsent ? (
                    <div
                      className={`px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-tight truncate max-w-full flex items-center gap-0.5 ${
                        isMaybe
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <span>{isMaybe ? "?" : "✕"}</span>
                      <span className="hidden xs:inline">
                        {isMaybe ? "Forse" : "Assente"}
                      </span>
                      {absence?.note && (
                        <span className="w-1 h-1 rounded-full bg-accent inline-block ml-0.5 shrink-0" />
                      )}
                    </div>
                  ) : specialEvent ? (
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold truncate hidden xs:inline">
                      {specialEvent.title}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100">
                      +
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-muted/50 text-[11px] text-muted-foreground px-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-primary text-primary-foreground font-black text-[9px] flex items-center justify-center">
                ✕
              </span>
              <span>Tua assenza</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-secondary text-secondary-foreground font-black text-[9px] flex items-center justify-center">
                ?
              </span>
              <span>Forse assente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Theater className="w-3.5 h-3.5 text-foreground/80" />
              <span>Appuntamenti</span>
            </div>
          </div>

          <span className="text-[10px] text-muted-foreground/80 hidden sm:inline">
            Tocca una data libera per segnare assenza
          </span>
        </div>
      </div>

      {/* Selected Day Quick Management Card */}
      {selectedDayInfo && (
        <div className="p-3.5 sm:p-4 bg-muted/40 border-2 border-primary/30 rounded-2xl animate-in fade-in space-y-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2 border-b border-muted/60 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-foreground text-sm">
                Data Selezionata: {selectedDayInfo.dateStr.split("-").reverse().join("/")}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Chiudi
            </button>
          </div>

          {selectedDayInfo.specialEvent && (
            <div className="flex items-center gap-2 text-xs font-semibold p-2 rounded-xl bg-background/80 border border-muted text-foreground">
              <Theater className="w-4 h-4 text-secondary shrink-0" />
              <span>
                {selectedDayInfo.specialEvent.type === "show" ? "Spettacolo: " : "Prova: "}
                {selectedDayInfo.specialEvent.title}
                {selectedDayInfo.specialEvent.note ? ` (${selectedDayInfo.specialEvent.note})` : ""}
              </span>
            </div>
          )}

          {selectedDayInfo.absence ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-background rounded-xl border border-primary/30">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Sei registrato come:
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedDayInfo.absence.status === "maybe"
                        ? "bg-secondary/20 text-secondary"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {selectedDayInfo.absence.status === "maybe" ? "Forse Assente" : "Assenza Certa"}
                  </span>
                </div>
                {selectedDayInfo.absence.note && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-accent shrink-0" />
                    <span>{selectedDayInfo.absence.note}</span>
                  </p>
                )}
                {selectedDayInfo.absence.startDate !== selectedDayInfo.absence.endDate && (
                  <p className="text-[11px] text-muted-foreground">
                    Periodo: dal {selectedDayInfo.absence.startDate} al {selectedDayInfo.absence.endDate}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={deletingId === selectedDayInfo.absence.id}
                onClick={() => selectedDayInfo.absence && handleDelete(selectedDayInfo.absence)}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancella</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-background rounded-xl border border-muted">
              <span className="text-xs text-muted-foreground">
                Nessuna tua assenza registrata per questa data.
              </span>
              <button
                type="button"
                onClick={() => onOpenAddModal(activeMember, selectedDayInfo.dateStr)}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Segna Assenza</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* UPCOMING ABSENCES LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-muted pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Tutte le Tue Prossime Assenze ({upcoming.length})</span>
          </h3>

          <button
            type="button"
            onClick={() => onOpenAddModal(activeMember)}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi</span>
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-6 text-center bg-muted/20 border border-muted/50 rounded-2xl text-muted-foreground text-xs sm:text-sm space-y-1">
            <CheckCircle2 className="w-8 h-8 text-secondary mx-auto opacity-80 mb-2" />
            <p className="font-semibold text-foreground">Disponibile per tutte le date future!</p>
            <p className="text-xs text-muted-foreground">
              Non hai assenze registrate. Se hai un impegno, tocca un giorno sul calendario qui sopra o premi il pulsante Nuova Assenza.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-background border border-muted rounded-2xl shadow-sm hover:border-muted-foreground/30 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-xs sm:text-sm">
                      {rec.startDate === rec.endDate
                        ? rec.startDate.split("-").reverse().join("/")
                        : `Dal ${rec.startDate.split("-").reverse().join("/")} al ${rec.endDate.split("-").reverse().join("/")}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.status === "maybe"
                          ? "bg-secondary/20 text-secondary border border-secondary/30"
                          : "bg-primary/20 text-primary border border-primary/30"
                      }`}
                    >
                      {rec.status === "maybe" ? "Forse Assente" : "Assenza Certa"}
                    </span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {rec.startDate === rec.endDate ? "1 giorno" : "Periodo"}
                    </span>
                  </div>
                  {rec.note && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{rec.note}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={deletingId === rec.id}
                  onClick={() => handleDelete(rec)}
                  title="Elimina assenza"
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl active:scale-95 transition-all disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAST ABSENCES ARCHIVE */}
      {past.length > 0 && (
        <div className="pt-4 border-t border-muted/50 space-y-2 opacity-75">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Storico Assenze Passate ({past.length})
          </h4>
          <div className="space-y-1.5">
            {past.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between gap-2 p-2.5 bg-muted/15 border border-muted/40 rounded-xl text-xs text-muted-foreground"
              >
                <div className="truncate">
                  <span className="font-medium text-foreground/80">
                    {rec.startDate === rec.endDate ? rec.startDate : `${rec.startDate} - ${rec.endDate}`}
                  </span>
                  {rec.note && <span className="ml-2 italic truncate">({rec.note})</span>}
                </div>
                <button
                  type="button"
                  disabled={deletingId === rec.id}
                  onClick={() => handleDelete(rec)}
                  title="Rimuovi dallo storico"
                  className="hover:text-primary p-1 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Google Calendar Import Modal */}
      <GoogleCalendarImportModal
        isOpen={isGCalModalOpen}
        onClose={() => setIsGCalModalOpen(false)}
        activeMember={activeMember}
        existingAbsences={myAbsences}
        onDeleteAbsence={onDeleteAbsence}
        onSuccess={(records) => {
          if (onBatchAddAbsences) {
            onBatchAddAbsences(records);
          }
        }}
      />
    </div>
  );
}
