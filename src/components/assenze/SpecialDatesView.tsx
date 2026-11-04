"use client";

import React, { useMemo } from "react";
import { SpecialDate, AbsenceRecord } from "@/types/absence";
import { Calendar, Clock, AlertCircle, CheckCircle2, Theater, Sparkles, MapPin } from "lucide-react";
import AddToCalendarButton from "./AddToCalendarButton";

interface SpecialDatesViewProps {
  specialDates: SpecialDate[];
  members: string[];
  absences: AbsenceRecord[];
  onSelectDate?: (dateStr: string) => void;
}

export default function SpecialDatesView({
  specialDates = [],
  members = [],
  absences = [],
  onSelectDate
}: SpecialDatesViewProps) {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Compute absence status for each special date
  const enrichedDates = useMemo(() => {
    return (specialDates || []).map((spec) => {
      const dateStr = spec.date;

      const certainAbsents: { member: string; record: AbsenceRecord }[] = [];
      const maybeAbsents: { member: string; record: AbsenceRecord }[] = [];

      for (const rec of absences || []) {
        if (rec.startDate <= dateStr && dateStr <= rec.endDate) {
          if (rec.status === "maybe") {
            maybeAbsents.push({ member: rec.memberName, record: rec });
          } else {
            certainAbsents.push({ member: rec.memberName, record: rec });
          }
        }
      }

      const totalMembers = members.length;
      const totalUnavailable = certainAbsents.length + maybeAbsents.length;
      const presentCount = Math.max(0, totalMembers - totalUnavailable);

      return {
        ...spec,
        isPast: spec.date < todayStr,
        isToday: spec.date === todayStr,
        certainAbsents,
        maybeAbsents,
        presentCount,
        totalMembers
      };
    });
  }, [specialDates, absences, members, todayStr]);

  const { upcoming, past } = useMemo(() => {
    const up = enrichedDates.filter((d) => !d.isPast).sort((a, b) => a.date.localeCompare(b.date));
    const pa = enrichedDates.filter((d) => d.isPast).sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming: up, past: pa };
  }, [enrichedDates]);

  if (specialDates.length === 0) {
    return (
      <div className="p-12 text-center bg-muted/20 border border-muted rounded-3xl max-w-xl mx-auto space-y-3">
        <Theater className="w-12 h-12 text-secondary mx-auto opacity-75" />
        <h3 className="text-lg font-bold text-foreground">Nessuna Data Speciale Configurata</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          L&apos;amministrazione può inserire spettacoli, prove generali e date importanti direttamente dal pannello Admin (sezione <em>Cast & Staff &rarr; Date Speciali</em>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-muted pb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Appuntamenti</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Panoramica delle presenze e indisponibilità per ciascuna data chiave.
          </p>
        </div>
        <span className="text-xs text-muted-foreground self-start sm:self-auto">
          {upcoming.length} date future
        </span>
      </div>

      {/* Upcoming events */}
      <div className="space-y-4">
        {upcoming.length === 0 ? (
          <div className="p-8 text-center bg-muted/15 border border-muted rounded-2xl text-muted-foreground text-sm">
            Nessun evento futuro in programma. Tutte le date speciali salvate sono passate.
          </div>
        ) : (
          upcoming.map((spec) => (
            <div
              key={spec.id}
              className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                spec.isToday
                  ? "bg-accent/10 border-accent/40 shadow-lg ring-1 ring-accent/30"
                  : spec.type === "show"
                  ? "bg-background/80 border-primary/40 shadow-md"
                  : "bg-background/60 border-muted/80 shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-muted/60 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-inner ${
                      spec.type === "show"
                        ? "bg-primary text-primary-foreground"
                        : spec.type === "rehearsal"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    <span>{spec.date.split("-")[2]}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {spec.date.split("-")[1]}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-foreground">{spec.title}</h3>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          spec.type === "show"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : spec.type === "rehearsal"
                            ? "bg-secondary/20 text-secondary border border-secondary/30"
                            : "bg-accent/20 text-accent border border-accent/30"
                        }`}
                      >
                        {spec.type === "show"
                          ? "Spettacolo"
                          : spec.type === "rehearsal"
                          ? "Prova"
                          : "Evento"}
                      </span>
                      {spec.isToday && (
                        <span className="text-[10px] font-bold uppercase bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                          Oggi!
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">{spec.date}</span>

                      {spec.startTime ? (
                        <span className="flex items-center gap-1 text-foreground/90 font-medium">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span>
                            Ore {spec.startTime}
                            {spec.endTime ? ` - ${spec.endTime}` : ""}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-accent/70" />
                          <span>Giorno intero</span>
                        </span>
                      )}

                      {spec.location && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-secondary" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{spec.location}</span>
                        </span>
                      )}

                      {spec.note && (
                        <span className="italic text-foreground/75 truncate max-w-[200px] sm:max-w-xs">
                          {spec.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Counters summary & Add to calendar button */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-muted/60 border border-muted text-xs">
                      <span className="font-bold text-foreground">{spec.presentCount}</span>
                      <span className="text-muted-foreground">presenti</span>
                    </div>

                    {spec.certainAbsents.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-xs text-primary font-bold">
                        <span>{spec.certainAbsents.length}</span>
                        <span>assenti</span>
                      </div>
                    )}

                    {spec.maybeAbsents.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-secondary/15 border border-secondary/30 text-xs text-secondary font-bold">
                        <span>{spec.maybeAbsents.length}</span>
                        <span>in dubbio</span>
                      </div>
                    )}
                  </div>

                  <AddToCalendarButton event={spec} />
                </div>
              </div>

              {/* Members breakdown */}
              <div className="space-y-2.5">
                {spec.certainAbsents.length === 0 && spec.maybeAbsents.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 py-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">Nessun membro assente! Tutti disponibili.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Certain absents */}
                    {spec.certainAbsents.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                        <div>
                          <span className="font-bold text-primary mr-1.5">Assenti Certi:</span>
                          <span className="text-foreground">
                            {spec.certainAbsents.map((a, i) => (
                              <span key={a.member} className="inline-block mr-2">
                                <strong>{a.member}</strong>
                                {a.record.note && (
                                  <span className="text-muted-foreground ml-1">({a.record.note})</span>
                                )}
                                {i < spec.certainAbsents.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Maybe absents */}
                    {spec.maybeAbsents.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0 mt-1" />
                        <div>
                          <span className="font-bold text-secondary mr-1.5">In Dubbio / Forse:</span>
                          <span className="text-foreground">
                            {spec.maybeAbsents.map((a, i) => (
                              <span key={a.member} className="inline-block mr-2">
                                <strong>{a.member}</strong>
                                {a.record.note && (
                                  <span className="text-muted-foreground ml-1">({a.record.note})</span>
                                )}
                                {i < spec.maybeAbsents.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Past events archive */}
      {past.length > 0 && (
        <div className="pt-6 border-t border-muted/60 space-y-3 opacity-75">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Date Speciali Passate ({past.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {past.map((spec) => (
              <div
                key={spec.id}
                className="p-3 bg-muted/20 border border-muted/50 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="truncate">
                  <span className="font-bold text-foreground/80 mr-1.5">{spec.date}</span>
                  <span className="text-foreground truncate">{spec.title}</span>
                </div>
                <span className="text-muted-foreground text-[11px] shrink-0">
                  {spec.certainAbsents.length} assenti
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

