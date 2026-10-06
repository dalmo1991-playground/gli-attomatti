"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

import { FormattedText } from "./FormattedText";

export interface DetailDate {
  date: string;
  location?: string;
  location_href?: string;
  ticket_label?: string;
  ticket_href?: string;
}

export interface DetailInfoItem {
  label: string;
  value: string;
}

interface DetailSidebarProps {
  datesTitle?: string;
  dates?: DetailDate[];
  detailsTitle?: string;
  details?: DetailInfoItem[];
  emptyDatesMessage?: string;
  photoGuideBadgeLabel?: string;
  onTicketClick?: (href: string) => void;
  className?: string;
}

export function DetailSidebar({
  datesTitle = "Date e Biglietti",
  dates = [],
  detailsTitle = "Dettagli",
  details = [],
  emptyDatesMessage = "Nessuna data programmata al momento.",
  photoGuideBadgeLabel = "📷 Guida fotografica & come raggiungerci",
  onTicketClick,
  className
}: DetailSidebarProps) {
  return (
    <div className={cn("lg:sticky lg:top-32 space-y-6 sm:space-y-8", className)}>
      {/* Dates & Tickets Card */}
      <div className="p-6 sm:p-8 bg-muted/20 rounded-[2.5rem] border border-foreground/5 shadow-sm">
        <h3 className="text-xl font-black uppercase tracking-tight mb-6 sm:mb-8 flex items-center">
          <Calendar className="mr-3 text-accent shrink-0" size={24} />
          <span>{datesTitle}</span>
        </h3>

        <div className="space-y-6">
          {dates && dates.length > 0 ? (
            dates.map((d, idx) => (
              <div key={idx} className="pb-6 border-b border-foreground/5 last:border-0 last:pb-0">
                <div className="font-bold text-lg mb-1 text-accent">{d.date}</div>
                {d.location && (
                  d.location_href?.trim() ? (
                    <div className="space-y-1 mb-4">
                      <Link
                        href={d.location_href.trim()}
                        target={d.location_href.trim().startsWith("http") ? "_blank" : undefined}
                        rel={d.location_href.trim().startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex items-start text-foreground/70 text-sm hover:text-accent transition-colors group"
                      >
                        <MapPin size={16} className="mr-2 mt-0.5 text-accent/70 shrink-0 group-hover:text-accent transition-colors" />
                        <span className="underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">
                          {d.location}
                        </span>
                      </Link>

                      {/* Special badge if it links to a photographic guide (/Location/...) */}
                      {d.location_href.trim().startsWith("/Location") && (
                        <div>
                          <Link
                            href={d.location_href.trim()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-bold border border-accent/20 transition-colors"
                          >
                            <span>{photoGuideBadgeLabel}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start text-foreground/60 text-sm mb-4">
                      <MapPin size={16} className="mr-2 mt-0.5 text-accent/70 shrink-0" />
                      <span>{d.location}</span>
                    </div>
                  )
                )}
                {d.ticket_label && (
                  d.ticket_href?.trim() ? (
                    <Link
                      href={d.ticket_href.trim()}
                      target={d.ticket_href.trim().startsWith("http") ? "_blank" : undefined}
                      rel={d.ticket_href.trim().startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={() => onTicketClick?.(d.ticket_href!)}
                      className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-black hover:opacity-90 transition-all w-full justify-center shadow-lg shadow-primary/25 hover:-translate-y-0.5"
                    >
                      <Ticket size={16} className="mr-2 shrink-0" />
                      <span>{d.ticket_label}</span>
                    </Link>
                  ) : (
                    <div className="px-6 py-3 bg-foreground/5 text-foreground/40 rounded-full text-sm font-bold text-center border border-foreground/5">
                      {d.ticket_label}
                    </div>
                  )
                )}
              </div>
            ))
          ) : (
            <p className="text-foreground/40 italic">{emptyDatesMessage}</p>
          )}
        </div>
      </div>

      {/* Info Details Card */}
      {details && details.length > 0 && (
        <div className="p-6 sm:p-8 border border-foreground/10 rounded-[2.5rem] bg-muted/10">
          <h4 className="font-black mb-6 uppercase tracking-[0.2em] text-xs text-foreground/50">
            {detailsTitle}
          </h4>
          <div className="space-y-4">
            {details.map((detail, dIdx) => (
              <div
                key={dIdx}
                className="flex items-start justify-between gap-4 text-sm border-b border-foreground/5 pb-3.5 last:border-0 last:pb-0"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/50 shrink-0 max-w-[45%] pt-0.5">
                  {detail.label}
                </span>
                <span className="font-black text-primary text-right leading-snug break-words">
                  <FormattedText text={detail.value} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
