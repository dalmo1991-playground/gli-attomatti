"use client";

import React, { useMemo, useState } from "react";
import { AbsenceRecord } from "@/types/absence";
import { User, Calendar, Clock, Trash2, Plus, Sparkles } from "lucide-react";

interface MyAbsencesTabProps {
  members: string[];
  absences: AbsenceRecord[];
  activeMember: string;
  onSelectMember: (member: string) => void;
  onOpenAddModal: (prefillMember?: string) => void;
  onDeleteAbsence: (id: string, memberName: string) => Promise<void>;
}

export default function MyAbsencesTab({
  members,
  absences,
  activeMember,
  onSelectMember,
  onOpenAddModal,
  onDeleteAbsence
}: MyAbsencesTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const memberAbsences = useMemo(() => {
    if (!activeMember) return [];
    return (absences || [])
      .filter((a) => a.memberName.trim().toLowerCase() === activeMember.trim().toLowerCase())
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [absences, activeMember]);

  const { upcoming, past } = useMemo(() => {
    const up: AbsenceRecord[] = [];
    const pa: AbsenceRecord[] = [];
    for (const item of memberAbsences) {
      if (item.endDate >= todayStr) {
        up.push(item);
      } else {
        pa.push(item);
      }
    }
    // Sort upcoming chronological
    up.sort((a, b) => a.startDate.localeCompare(b.startDate));
    return { upcoming: up, past: pa };
  }, [memberAbsences, todayStr]);

  const handleDelete = async (rec: AbsenceRecord) => {
    if (!confirm(`Vuoi cancellare questa assenza (${rec.startDate}${rec.startDate !== rec.endDate ? ` - ${rec.endDate}` : ""})?`)) {
      return;
    }
    try {
      setDeletingId(rec.id);
      await onDeleteAbsence(rec.id, rec.memberName);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Member header card */}
      <div className="bg-muted/40 border border-muted rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Profilo Attivo (Solo tue assenze)
          </span>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mt-0.5">
            <User className="w-5 h-5 text-primary" />
            <span>{activeMember}</span>
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddModal(activeMember)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuova Assenza</span>
        </button>
      </div>

      <div className="space-y-6">
          {/* Upcoming absences */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Prossime Assenze ({upcoming.length})</span>
            </h3>

            {upcoming.length === 0 ? (
              <div className="p-5 text-center bg-muted/20 border border-muted/50 rounded-xl text-muted-foreground text-xs sm:text-sm">
                Non hai assenze future registrate. Sei disponibile per tutte le prossime date!
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-3 p-3.5 bg-background/80 border border-muted rounded-xl shadow-sm hover:border-muted-foreground/30 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">
                          {rec.startDate === rec.endDate
                            ? rec.startDate
                            : `Dal ${rec.startDate} al ${rec.endDate}`}
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
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past absences */}
          {past.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Storico Assenze Passate ({past.length})
              </h3>
              <div className="space-y-2 opacity-75">
                {past.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-3 p-3 bg-muted/20 border border-muted/50 rounded-xl text-xs text-muted-foreground"
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
        </div>
    </div>
  );
}

