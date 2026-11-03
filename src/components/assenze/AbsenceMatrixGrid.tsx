"use client";

import React, { useMemo, useState } from "react";
import { AbsenceRecord, SpecialDate } from "@/types/absence";
import {
  Info,
  X,
  Clock,
  User,
  Calendar as CalendarIcon,
  Trash2,
  Search,
  Sparkles,
  HelpCircle,
  Theater,
  Filter,
  CheckSquare,
  Square,
  ArrowRight
} from "lucide-react";

interface AbsenceMatrixGridProps {
  year: number;
  month: number; // 0-indexed (0 = Jan, 10 = Nov, 11 = Dec)
  members: string[];
  activeMember: string;
  absences: AbsenceRecord[];
  specialDates?: SpecialDate[];
  onAddForCell?: (memberName: string, dateStr: string) => void;
  onAddForRange?: (memberName: string, startDate: string, endDate: string) => void;
  onDeleteAbsence: (id: string, memberName: string) => Promise<void>;
}

// Italian day letters (Index 0 = Sun, 1 = Mon, ..., 6 = Sat)
const DAY_LETTERS = ["D", "L", "M", "M", "G", "V", "S"];

export default function AbsenceMatrixGrid({
  year,
  month,
  members,
  activeMember,
  absences,
  specialDates = [],
  onAddForCell,
  onAddForRange,
  onDeleteAbsence
}: AbsenceMatrixGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    member: string;
    dateStr: string;
    record?: AbsenceRecord;
  } | null>(null);
  const [selectedSpecialDate, setSelectedSpecialDate] = useState<SpecialDate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-person filter state: Set of selected members (empty = all)
  const [selectedFilterMembers, setSelectedFilterMembers] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState("");

  // 2-click date range selection state
  // rangeStart holds the first clicked date string YYYY-MM-DD
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeHover, setRangeHover] = useState<string | null>(null);

  // Map special dates by dateStr
  const specialDatesMap = useMemo(() => {
    const map = new Map<string, SpecialDate>();
    for (const spec of specialDates || []) {
      map.set(spec.date, spec);
    }
    return map;
  }, [specialDates]);

  // Calculate days in current month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day, 12, 0, 0);
      const dayOfWeek = d.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isWeekend = isSunday || isSaturday;
      const isToday = isCurrentYearMonth && day === todayDate;

      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      const specialEvent = specialDatesMap.get(dateStr);

      days.push({
        dayNumber: day,
        dayLetter: DAY_LETTERS[dayOfWeek],
        isWeekend,
        isSunday,
        isSaturday,
        isToday,
        dateStr,
        specialEvent
      });
    }
    return days;
  }, [year, month, specialDatesMap]);

  // Map absences by member and date string
  const absenceMap = useMemo(() => {
    const map = new Map<string, Map<string, AbsenceRecord>>();

    for (const record of absences || []) {
      const memKey = record.memberName.trim();
      if (!map.has(memKey)) {
        map.set(memKey, new Map());
      }
      const memberMap = map.get(memKey)!;

      const start = new Date(record.startDate + "T00:00:00");
      const end = new Date(record.endDate + "T00:00:00");

      for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        const curDateStr = `${y}-${m}-${d}`;
        memberMap.set(curDateStr, record);
      }
    }
    return map;
  }, [absences]);

  // Compute daily totals of absent members
  const dailyAbsenceStats = useMemo(() => {
    const stats = new Map<string, { total: number; certain: number; maybe: number }>();
    for (const day of daysInMonth) {
      let certain = 0;
      let maybe = 0;
      for (const member of members || []) {
        const rec = absenceMap.get(member)?.get(day.dateStr);
        if (rec) {
          if (rec.status === "maybe") {
            maybe++;
          } else {
            certain++;
          }
        }
      }
      stats.set(day.dateStr, { total: certain + maybe, certain, maybe });
    }
    return stats;
  }, [daysInMonth, members, absenceMap]);

  // Filtered members list based on multi-select
  const visibleMembers = useMemo(() => {
    if (selectedFilterMembers.length === 0) {
      return members || [];
    }
    return (members || []).filter((m) =>
      selectedFilterMembers.some((sel) => sel.toLowerCase() === m.toLowerCase())
    );
  }, [members, selectedFilterMembers]);

  // Toggle member in multi-select filter
  const toggleFilterMember = (member: string) => {
    setSelectedFilterMembers((prev) => {
      const exists = prev.some((m) => m.toLowerCase() === member.toLowerCase());
      if (exists) {
        return prev.filter((m) => m.toLowerCase() !== member.toLowerCase());
      } else {
        return [...prev, member];
      }
    });
  };

  // Helper for 2-click date range checking
  const isInSelectedRangePreview = (dateStr: string) => {
    if (!rangeStart) return false;
    const target = rangeHover || rangeStart;
    const minD = rangeStart <= target ? rangeStart : target;
    const maxD = rangeStart <= target ? target : rangeStart;
    return dateStr >= minD && dateStr <= maxD;
  };

  // Cell click handler with 2-click date range support
  const handleCellClick = (member: string, dateStr: string, isAbsent: boolean, record?: AbsenceRecord) => {
    const isMyRow = member.trim().toLowerCase() === activeMember.trim().toLowerCase();

    // If clicking an existing absence cell: show inspection popover
    if (isAbsent) {
      // If was selecting range, cancel it
      setRangeStart(null);
      setRangeHover(null);
      setSelectedCell({ member, dateStr, record });
      return;
    }

    // If not my row, prevent editing
    if (!isMyRow) {
      alert(`Sei identificato come "${activeMember}". Puoi registrare assenze solo per la tua riga.`);
      return;
    }

    // Click 1: No start date selected yet
    if (!rangeStart) {
      setRangeStart(dateStr);
      setRangeHover(dateStr);
      return;
    }

    // Click 2: Range completion!
    // Edge case: if clicked on the SAME date (dateStr === rangeStart), it's a 1-day absence!
    // If clicked on different date, it forms a range [min, max].
    const startDate = rangeStart <= dateStr ? rangeStart : dateStr;
    const endDate = rangeStart <= dateStr ? dateStr : rangeStart;

    // Trigger add callback
    if (onAddForRange) {
      onAddForRange(activeMember, startDate, endDate);
    } else if (onAddForCell) {
      onAddForCell(activeMember, startDate);
    }

    // Reset range selection state
    setRangeStart(null);
    setRangeHover(null);
  };

  const handleDelete = async (record: AbsenceRecord) => {
    if (!confirm(`Vuoi cancellare l'assenza di ${record.memberName} per il periodo selezionato?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await onDeleteAbsence(record.id, record.memberName);
      setSelectedCell(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative w-full space-y-2.5 sm:space-y-3">
      {/* Filter Bar with Multi-Select Persons & Presets */}
      <div className="flex items-center justify-between gap-2 bg-muted/30 p-2 sm:p-2.5 rounded-2xl border border-muted">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedFilterMembers([])}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
              selectedFilterMembers.length === 0
                ? "bg-primary text-primary-foreground shadow"
                : "bg-background/60 text-muted-foreground hover:text-foreground border border-muted"
            }`}
          >
            Tutti ({members.length})
          </button>

          {activeMember && (
            <button
              type="button"
              onClick={() => setSelectedFilterMembers([activeMember])}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
                selectedFilterMembers.length === 1 &&
                selectedFilterMembers[0].toLowerCase() === activeMember.toLowerCase()
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-background/60 text-muted-foreground hover:text-foreground border border-muted"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Solo tu</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
              selectedFilterMembers.length > 0 &&
              !(
                selectedFilterMembers.length === 1 &&
                selectedFilterMembers[0].toLowerCase() === activeMember.toLowerCase()
              )
                ? "bg-secondary text-secondary-foreground shadow"
                : "bg-background/80 text-foreground hover:bg-background border border-muted"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {selectedFilterMembers.length > 0 &&
              !(
                selectedFilterMembers.length === 1 &&
                selectedFilterMembers[0].toLowerCase() === activeMember.toLowerCase()
              )
                ? `Filtro (${selectedFilterMembers.length})`
                : "Filtra cast..."}
            </span>
          </button>
        </div>

        {selectedFilterMembers.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedFilterMembers([])}
            className="text-xs text-primary hover:underline font-semibold shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* Floating Guidance Banner during 2-Click Range Selection - Compact on mobile */}
      {rangeStart && (
        <div className="bg-primary/15 border border-primary/40 text-foreground p-2 sm:p-2.5 rounded-xl shadow-md flex items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0" />
            <div className="min-w-0 truncate">
              <span className="font-bold text-foreground">Inizio: {rangeStart.split("-").reverse().join("/")}</span>
              <span className="text-muted-foreground ml-1.5 hidden sm:inline">
                &bull; Tocca di nuovo il {rangeStart.split("-")[2]} per 1 giorno, oppure una data successiva per il periodo.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRangeStart(null);
              setRangeHover(null);
            }}
            className="px-2.5 py-1 bg-background/80 hover:bg-background text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg border border-muted transition-colors shrink-0"
          >
            Annulla
          </button>
        </div>
      )}

      {/* Mobile swipe prompt */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 sm:hidden">
        <span className="text-foreground/80 font-medium">👉 Scorri in orizzontale</span>
        <span>Tocca la cella per registrare</span>
      </div>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto rounded-xl border border-muted bg-background/50 shadow-inner custom-scrollbar pb-2 touch-pan-x">
        <table className="w-full border-collapse text-xs select-none">
          <thead>
            {/* Row 1: Day numbers & Special events */}
            <tr className="bg-muted/80 backdrop-blur sticky top-0 z-30">
              <th className="sticky left-0 z-40 bg-muted/95 border-b border-r border-muted/80 px-2 sm:px-3 py-1.5 sm:py-2 text-left font-bold text-foreground min-w-[86px] sm:min-w-[140px] max-w-[88px] sm:max-w-[160px] shadow-sm">
                <span className="hidden sm:inline">MEMBRI ({visibleMembers.length})</span>
                <span className="sm:hidden text-[10px]">MEMBRI</span>
              </th>
              {daysInMonth.map((d) => {
                const spec = d.specialEvent;

                let headerBg = "text-foreground";
                if (spec) {
                  headerBg =
                    spec.type === "show"
                      ? "bg-primary/25 text-primary border-b-2 border-b-primary cursor-pointer hover:bg-primary/35"
                      : spec.type === "rehearsal"
                      ? "bg-secondary/25 text-secondary border-b-2 border-b-secondary cursor-pointer hover:bg-secondary/35"
                      : "bg-accent/25 text-accent border-b-2 border-b-accent cursor-pointer hover:bg-accent/35";
                } else if (d.isToday) {
                  headerBg = "text-accent font-black bg-accent/20 ring-1 ring-inset ring-accent/40";
                } else if (d.isSunday) {
                  headerBg = "text-primary font-bold bg-primary/15";
                } else if (d.isSaturday) {
                  headerBg = "text-secondary font-bold bg-secondary/15";
                }

                return (
                  <th
                    key={`day-num-${d.dateStr}`}
                    onClick={() => {
                      if (spec) setSelectedSpecialDate(spec);
                    }}
                    className={`border-b border-r border-muted/60 px-0.5 py-1 text-center font-bold min-w-[32px] sm:min-w-[38px] w-[32px] sm:w-[38px] transition-all ${headerBg}`}
                    title={
                      spec
                        ? `${spec.title} (${spec.type === "show" ? "Spettacolo" : "Prova"}) — Clicca per dettagli`
                        : undefined
                    }
                  >
                    <span className="block text-xs sm:text-[13px]">{d.dayNumber}</span>
                    {spec && (
                      <span className="block text-[8px] sm:text-[9px] font-black uppercase tracking-tighter truncate max-w-[34px] sm:max-w-[38px] mx-auto animate-pulse">
                        {spec.type === "show" ? "🎭 Spett" : "🎬 Prova"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>

            {/* Row 2: Day of week letters (L, M, M, G, V, S, D) */}
            <tr className="bg-muted/70 sticky top-[30px] sm:top-[33px] z-20">
              <th className="sticky left-0 z-30 bg-muted/90 border-b border-r border-muted/80 px-2 sm:px-3 py-0.5 sm:py-1 text-left text-[10px] sm:text-[11px] font-medium text-muted-foreground min-w-[86px] sm:min-w-[140px] max-w-[88px] sm:max-w-[160px]">
                Giorno
              </th>
              {daysInMonth.map((d) => {
                let letterClass = "text-muted-foreground";
                if (d.specialEvent) {
                  letterClass =
                    d.specialEvent.type === "show"
                      ? "text-primary bg-primary/10"
                      : "text-secondary bg-secondary/10";
                } else if (d.isToday) {
                  letterClass = "text-accent font-black bg-accent/20 ring-1 ring-inset ring-accent/40";
                } else if (d.isSunday) {
                  letterClass = "text-primary font-bold bg-primary/15";
                } else if (d.isSaturday) {
                  letterClass = "text-secondary font-bold bg-secondary/15";
                }

                return (
                  <th
                    key={`day-letter-${d.dateStr}`}
                    className={`border-b border-r border-muted/60 px-0.5 py-0.5 text-center text-[9px] sm:text-[10px] font-semibold min-w-[32px] sm:min-w-[38px] ${letterClass}`}
                  >
                    {d.dayLetter}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {visibleMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={daysInMonth.length + 1}
                  className="p-8 text-center text-muted-foreground text-sm italic"
                >
                  Nessun membro corrisponde ai criteri di filtro impostati.
                </td>
              </tr>
            ) : (
              visibleMembers.map((member, rowIdx) => {
                const memberMap = absenceMap.get(member);
                const isMyRow = member.trim().toLowerCase() === activeMember.trim().toLowerCase();

                return (
                  <tr
                    key={member}
                    className={`hover:bg-muted/30 transition-colors ${
                      isMyRow
                        ? "bg-primary/5 ring-1 ring-inset ring-primary/30"
                        : rowIdx % 2 === 0
                        ? "bg-background/40"
                        : "bg-muted/15"
                    }`}
                  >
                    {/* Sticky Member Name Column - Compact & readable on mobile */}
                    <td
                      className={`sticky left-0 z-10 border-b border-r border-muted/80 px-2 sm:px-3 py-1.5 font-medium text-[11px] sm:text-xs truncate min-w-[86px] sm:min-w-[140px] max-w-[88px] sm:max-w-[160px] shadow-sm ${
                        isMyRow
                          ? "bg-primary/20 text-primary font-bold"
                          : "bg-background/95 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1 justify-between min-w-0">
                        <span className="truncate">{member}</span>
                        {isMyRow && (
                          <span className="text-[9px] bg-primary text-primary-foreground font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                            Tu
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {daysInMonth.map((d) => {
                      const record = memberMap?.get(d.dateStr);
                      const isAbsent = Boolean(record);
                      const isMaybe = record?.status === "maybe";
                      const isInRange = isMyRow && isInSelectedRangePreview(d.dateStr);
                      const isRangeAnchor = isMyRow && rangeStart === d.dateStr;

                      return (
                        <td
                          key={`${member}-${d.dateStr}`}
                          onMouseEnter={() => {
                            if (rangeStart && isMyRow) {
                              setRangeHover(d.dateStr);
                            }
                          }}
                          onClick={() => handleCellClick(member, d.dateStr, isAbsent, record)}
                          className={`border-b border-r border-muted/40 p-0 text-center transition-all cursor-pointer relative ${
                            isInRange && !isAbsent
                              ? "bg-primary/25 ring-2 ring-primary ring-inset"
                              : d.specialEvent
                              ? d.specialEvent.type === "show"
                                ? "bg-primary/5"
                                : "bg-secondary/5"
                              : d.isWeekend && !isAbsent
                              ? "bg-secondary/5"
                              : ""
                          } ${d.isToday && !isAbsent ? "ring-1 ring-inset ring-accent/30" : ""} ${
                            !isMyRow && !isAbsent ? "cursor-not-allowed opacity-80" : ""
                          }`}
                          title={
                            isAbsent
                              ? `${member} ${isMaybe ? "forse assente" : "assente"}: ${record?.note || "Tutto il giorno"}`
                              : isMyRow
                              ? rangeStart
                                ? rangeStart === d.dateStr
                                  ? "Clicca di nuovo per confermare 1 giorno singolo"
                                  : `Clicca per completare il periodo (${rangeStart} - ${d.dateStr})`
                                : `Clicca per impostare la data di inizio per ${member}`
                              : `Riga di ${member} (solo lettura per ${activeMember})`
                          }
                        >
                          {isAbsent ? (
                            <div
                              className={`w-full h-8 sm:h-9 flex items-center justify-center font-bold text-[11px] shadow-sm active:scale-95 transition-transform ${
                                isMaybe
                                  ? "bg-secondary text-secondary-foreground border border-secondary-foreground/20"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              {record?.note ? (
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title={record.note} />
                              ) : isMaybe ? (
                                <span title="Forse assente">?</span>
                              ) : (
                                <span title="Assenza certa">✕</span>
                              )}
                            </div>
                          ) : isMyRow ? (
                            <div className="w-full h-8 sm:h-9 hover:bg-muted/40 flex items-center justify-center text-muted-foreground text-[10px]">
                              {isRangeAnchor ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                              ) : isInRange ? (
                                <span className="text-primary font-bold text-xs">&rarr;</span>
                              ) : (
                                <span className="opacity-0 hover:opacity-100">+</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-8 sm:h-9" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}

            {/* Bottom Row: Totale Assenti per giorno */}
            <tr className="bg-muted/90 font-bold border-t-2 border-muted sticky bottom-0 z-20">
              <td className="sticky left-0 z-30 bg-muted border-r border-muted/80 px-2 sm:px-3 py-1.5 text-left text-[10px] sm:text-[11px] text-foreground uppercase tracking-wider min-w-[86px] sm:min-w-[140px] max-w-[88px] sm:max-w-[160px] shadow-sm">
                <span className="hidden sm:inline">Totale Assenti</span>
                <span className="sm:hidden font-bold">Totale</span>
              </td>
              {daysInMonth.map((d) => {
                const stat = dailyAbsenceStats.get(d.dateStr) || { total: 0, certain: 0, maybe: 0 };
                let badgeClass = "text-muted-foreground";

                if (stat.total >= 4) {
                  badgeClass = "text-primary font-black bg-primary/20";
                } else if (stat.total >= 2) {
                  badgeClass = "text-accent font-bold bg-accent/20";
                } else if (stat.total === 1) {
                  badgeClass = "text-foreground font-semibold";
                }

                return (
                  <td
                    key={`total-${d.dateStr}`}
                    className={`border-r border-muted/60 px-0.5 py-1.5 text-center text-[10px] sm:text-[11px] min-w-[32px] sm:min-w-[38px] w-[32px] sm:w-[38px] ${badgeClass}`}
                    title={
                      stat.total > 0
                        ? `Totale: ${stat.total} (${stat.certain} certi, ${stat.maybe} in dubbio)`
                        : "Tutti presenti"
                    }
                  >
                    <span>{stat.total}</span>
                    {stat.maybe > 0 && (
                      <span className="text-[8px] sm:text-[9px] text-secondary block font-normal leading-none mt-0.5">
                        +{stat.maybe}?
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend & quick helper - Compact Chips for Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground mt-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-muted/60">
            <span className="w-3 h-3 bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center rounded-sm">
              ✕
            </span>
            <span className="text-[11px]">Certa</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-muted/60">
            <span className="w-3 h-3 bg-secondary text-secondary-foreground font-bold text-[9px] flex items-center justify-center rounded-sm">
              ?
            </span>
            <span className="text-[11px]">Forse</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-muted/60">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            <span className="text-[11px]">Con nota</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-muted/60">
            <span className="text-[10px] font-bold text-primary">
              🎭 Spett / 🎬 Prova
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80 hidden sm:block">
          Registrazione rapida: <strong>clicca 2 volte</strong> sulla tua riga (stessa data = 1 giorno, oppure inizio e fine per periodo).
        </p>
      </div>

      {/* Multi-Person Filter Modal / Dialog */}
      {isFilterModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-muted border border-muted-foreground/30 rounded-3xl p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-muted pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Filtra Membri nella Griglia</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Seleziona solo le persone che vuoi confrontare (es. il cast di uno spettacolo specifico con 4 persone).
            </p>

            <div className="relative">
              <input
                type="text"
                value={filterSearchQuery}
                onChange={(e) => setFilterSearchQuery(e.target.value)}
                placeholder="Cerca membro..."
                className="w-full bg-background border border-muted rounded-xl px-3 py-2 pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {/* Quick buttons inside modal */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setSelectedFilterMembers([...members])}
                className="text-primary hover:underline font-semibold"
              >
                Seleziona tutti ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilterMembers([])}
                className="text-muted-foreground hover:text-foreground underline"
              >
                Deseleziona tutti
              </button>
            </div>

            {/* Checkbox list */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-64 custom-scrollbar">
              {(members || [])
                .filter((m) =>
                  filterSearchQuery.trim()
                    ? m.toLowerCase().includes(filterSearchQuery.trim().toLowerCase())
                    : true
                )
                .map((member) => {
                  const isChecked =
                    selectedFilterMembers.length === 0 ||
                    selectedFilterMembers.some((sel) => sel.toLowerCase() === member.toLowerCase());
                  const isMe = member.toLowerCase() === activeMember.toLowerCase();

                  return (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleFilterMember(member)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs text-left ${
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-foreground font-semibold"
                          : "bg-background/40 border-muted text-muted-foreground hover:bg-background/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span>{member}</span>
                        {isMe && (
                          <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.2 rounded uppercase">
                            Tu
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-muted flex gap-2">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                Applica Filtro ({selectedFilterMembers.length === 0 ? "Tutti" : selectedFilterMembers.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popover / Modal for cell details */}
      {selectedCell?.record && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedCell(null)}
        >
          <div
            className="w-full max-w-sm bg-muted border border-muted-foreground/30 rounded-2xl p-5 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-base flex items-center gap-1.5">
                <User className="w-5 h-5" />
                <span>{selectedCell.member}</span>
              </span>

              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  selectedCell.record.status === "maybe"
                    ? "bg-secondary/20 text-secondary border border-secondary/30"
                    : "bg-primary/20 text-primary border border-primary/30"
                }`}
              >
                {selectedCell.record.status === "maybe" ? "Forse Assente" : "Assenza Certa"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-foreground">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="w-4 h-4 shrink-0 text-secondary" />
                <span>
                  {selectedCell.record.startDate === selectedCell.record.endDate
                    ? `Data: ${selectedCell.record.startDate}`
                    : `Dal ${selectedCell.record.startDate} al ${selectedCell.record.endDate}`}
                </span>
              </div>

              {selectedCell.record.note && (
                <div className="flex items-start gap-2 bg-background/60 p-3 rounded-xl border border-muted">
                  <Clock className="w-4 h-4 shrink-0 text-accent mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-muted-foreground">
                      Dettaglio / Nota:
                    </span>
                    <p className="text-foreground text-sm mt-0.5">{selectedCell.record.note}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {selectedCell.member.trim().toLowerCase() === activeMember.trim().toLowerCase() ? (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDelete(selectedCell.record!)}
                  className="w-full bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 font-semibold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? "Eliminazione..." : "Elimina questa assenza"}</span>
                </button>
              ) : (
                <div className="p-3 bg-background/50 border border-muted rounded-xl text-center text-xs text-muted-foreground italic">
                  Registrata da {selectedCell.member}. Solo {selectedCell.member} può modificare o eliminare questa assenza.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popover for Special Date Details */}
      {selectedSpecialDate && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedSpecialDate(null)}
        >
          <div
            className="w-full max-w-sm bg-muted border border-muted-foreground/30 rounded-2xl p-5 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSpecialDate(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Theater className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">{selectedSpecialDate.title}</h3>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Data:</strong> {selectedSpecialDate.date}
              </p>
              <p>
                <strong className="text-foreground">Tipologia:</strong>{" "}
                {selectedSpecialDate.type === "show"
                  ? "Spettacolo"
                  : selectedSpecialDate.type === "rehearsal"
                  ? "Prova Generale"
                  : "Evento"}
              </p>
              {selectedSpecialDate.note && (
                <div className="p-2.5 bg-background/60 rounded-xl border border-muted text-foreground">
                  {selectedSpecialDate.note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
