"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { cn, defaultText } from "@/lib/utils";

import { FormattedText } from "./FormattedText";
import { ShareButton } from "./ShareButton";

export interface DetailDate {
  date: string;
  location?: string;
  location_href?: string;
  directions_badge_label?: string | null;
  ticket_label?: string;
  ticket_href?: string;
}

export interface DetailInfoItem {
  label: string;
  value: string;
}

interface DetailSidebarProps {
  datesTitle?: string | null;
  dates?: DetailDate[];
  detailsTitle?: string | null;
  details?: DetailInfoItem[];
  emptyDatesMessage?: string | null;
  photoGuideBadgeLabel?: string | null;
  directionsBadgeLabel?: string | null;
  onTicketClick?: (href: string) => void;
  className?: string;
  shareTitle?: string | null;
  shareItemTitle?: string;
  shareItemDescription?: string;
  shareUiContent?: Record<string, unknown>;
}

export function DetailSidebar({
  datesTitle,
  dates = [],
  detailsTitle,
  details = [],
  emptyDatesMessage,
  photoGuideBadgeLabel = "📷 Guida fotografica & come raggiungerci",
  directionsBadgeLabel = "Indicazioni",
  onTicketClick,
  className,
  shareTitle,
  shareItemTitle,
  shareItemDescription,
  shareUiContent
}: DetailSidebarProps) {
  const hasDates = Boolean(dates && dates.length > 0);
  const showDatesCard = Boolean(datesTitle || hasDates || emptyDatesMessage);
  const validDetails = (details || []).filter(
    (d) => d && d.label !== null && d.value !== null
  );

  return (
    <div className={cn("lg:sticky lg:top-32 space-y-6 sm:space-y-8", className)}>
      {/* Dates & Tickets Card */}
      {showDatesCard && (
        <div className="p-6 sm:p-8 bg-muted/20 rounded-[2.5rem] border border-foreground/5 shadow-sm">
          {datesTitle && (
            <h3 className="text-xl font-black uppercase tracking-tight mb-6 sm:mb-8 flex items-center">
              <Calendar className="mr-3 text-accent shrink-0" size={24} />
              <span>{datesTitle}</span>
            </h3>
          )}

          <div className="space-y-6">
            {hasDates ? (
              dates.map((d, idx) => (
                <div key={idx} className="pb-6 border-b border-foreground/5 last:border-0 last:pb-0">
                  <div className="font-bold text-lg mb-1 text-accent">{d.date}</div>
                  {d.location && (
                    d.location_href?.trim() ? (() => {
                      const href = d.location_href.trim();
                      const isLocationPage =
                        href.startsWith("/Location") ||
                        href.startsWith("/location") ||
                        href.includes("/Location/") ||
                        href.includes("/location/");
                      const effectiveDirectionsBadge = defaultText(d.directions_badge_label, directionsBadgeLabel);

                      return (
                        <div className="space-y-1.5 mb-4">
                          <Link
                            href={href}
                            prefetch={false}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground/75 text-sm hover:text-accent transition-colors group"
                          >
                            <span className="inline-flex items-start">
                              <MapPin size={16} className="mr-1.5 mt-0.5 text-accent/70 shrink-0 group-hover:text-accent transition-colors" />
                              <span className="underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">
                                {d.location}
                              </span>
                            </span>

                            {isLocationPage && effectiveDirectionsBadge && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent/15 text-accent border border-accent/30 shadow-2xs group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                                {effectiveDirectionsBadge}
                              </span>
                            )}
                          </Link>
                        </div>
                      );
                    })() : (
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
                        prefetch={false}
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
            ) : emptyDatesMessage ? (
              <p className="text-foreground/40 italic">{emptyDatesMessage}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Info Details Card */}
      {validDetails.length > 0 && (
        <div className="p-6 sm:p-8 border border-foreground/10 rounded-[2.5rem] bg-muted/10">
          {detailsTitle && (
            <h4 className="font-black mb-6 uppercase tracking-[0.2em] text-xs text-foreground/50">
              {detailsTitle}
            </h4>
          )}
          <div className="space-y-4">
            {validDetails.map((detail, dIdx) => (
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

      {/* Share Card */}
      {shareTitle !== null && (
        <ShareButton
          variant="card"
          label={shareTitle || "Condividi questo evento"}
          title={shareItemTitle}
          description={shareItemDescription}
          uiContent={shareUiContent}
        />
      )}
    </div>
  );
}
