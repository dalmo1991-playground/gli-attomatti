"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronDown, Download, ExternalLink, Mail, Briefcase } from "lucide-react";
import { SpecialDate } from "@/types/absence";
import {
  createZurichDate,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateOffice365CalendarUrl
} from "@/lib/email/calendar";

interface AddToCalendarButtonProps {
  event: SpecialDate;
  compact?: boolean;
  className?: string;
}

export default function AddToCalendarButton({
  event,
  compact = false,
  className = ""
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const { googleUrl, outlookUrl, office365Url, icsUrl } = useMemo(() => {
    const [y, m, d] = (event.date || "").split("-").map(Number);
    const year = y || new Date().getFullYear();
    const month = (m || 1) - 1;
    const day = d || 1;

    const isAllDay = event.isAllDay ?? (!event.startTime && !event.endTime);

    let startDate: Date;
    let endDate: Date;

    if (!isAllDay && event.startTime) {
      const [sh, sm] = event.startTime.split(":").map(Number);
      startDate = createZurichDate(year, month, day, sh || 0, sm || 0, 0);

      if (event.endTime) {
        const [eh, em] = event.endTime.split(":").map(Number);
        endDate = createZurichDate(year, month, day, eh || 0, em || 0, 0);
      } else {
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }
    } else {
      // All day event: default Zurich daytime slot
      startDate = createZurichDate(year, month, day, 9, 0, 0);
      endDate = createZurichDate(year, month, day, 18, 0, 0);
    }

    const typeLabel =
      event.type === "show"
        ? "Spettacolo"
        : event.type === "rehearsal"
        ? "Prova"
        : "Evento";

    const descLines: string[] = [];
    descLines.push(`Tipo: ${typeLabel}`);
    if (isAllDay) {
      descLines.push("Orario: Giorno intero");
    } else if (event.startTime) {
      descLines.push(`Orario: dalle ${event.startTime}${event.endTime ? ` alle ${event.endTime}` : ""}`);
    }
    if (event.location) {
      descLines.push(`Luogo: ${event.location}`);
    }
    if (event.note) {
      descLines.push(`Note: ${event.note}`);
    }
    descLines.push("Compagnia Teatrale Gli Attomatti");
    const description = descLines.join("\n");
    const location = event.location || "Zurigo, Svizzera";

    const google = generateGoogleCalendarUrl({
      title: event.title,
      description,
      location,
      startDate,
      endDate
    });

    const outlook = generateOutlookCalendarUrl({
      title: event.title,
      description,
      location,
      startDate,
      endDate
    });

    const office = generateOffice365CalendarUrl({
      title: event.title,
      description,
      location,
      startDate,
      endDate
    });

    const icsParams = new URLSearchParams({
      title: event.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location,
      description
    });
    const ics = `/api/email/calendar.ics?${icsParams.toString()}`;

    return { googleUrl: google, outlookUrl: outlook, office365Url: office, icsUrl: ics };
  }, [event]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-muted hover:border-primary/50 text-foreground text-xs font-semibold transition-all shadow-sm active:scale-95"
        title="Aggiungi questo evento al tuo calendario personale"
      >
        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>{compact ? "Aggiungi" : "Aggiungi al calendario"}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 bg-muted/95 border border-muted-foreground/20 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md z-50 space-y-1 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-muted-foreground/10 mb-1">
            Scegli il tuo calendario
          </div>

          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background/80 transition-colors"
          >
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="flex-1 font-semibold">Google Calendar</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <a
            href={icsUrl}
            download={`${(event.title || "evento").toLowerCase().replace(/[^a-z0-9_-]/g, "_")}.ics`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background/80 transition-colors"
          >
            <Download className="w-4 h-4 text-secondary shrink-0" />
            <span className="flex-1 font-semibold">Apple Calendar / iCal</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background/80 transition-colors"
          >
            <Mail className="w-4 h-4 text-accent shrink-0" />
            <span className="flex-1 font-semibold">Outlook</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <a
            href={office365Url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background/80 transition-colors"
          >
            <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="flex-1 font-semibold">Office 365</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      )}
    </div>
  );
}

