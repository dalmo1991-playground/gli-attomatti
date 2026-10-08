"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "./Section";
import { RichText } from "./RichText";
import { getCardTitleSizeClass } from "@/lib/typography";

export interface ArchiveTimelineSectionProps {
  title: string;
  badge?: string;
  badgePrefix?: string;
  badgeIcon?: React.ElementType;
  text?: string;
  href?: string;
  ctaLabel?: string;
  isAlternate?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ArchiveTimelineSection({
  title,
  badge,
  badgePrefix,
  badgeIcon: BadgeIcon = Calendar,
  text,
  href,
  ctaLabel,
  isAlternate = false,
  className,
  children
}: ArchiveTimelineSectionProps) {
  const fullBadge = badge ? `${badgePrefix || ""}${badge}` : null;

  return (
    <Section className={cn("py-12 sm:py-16 md:py-24", isAlternate && "bg-muted/10", className)}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
        {/* Left Column: Sticky Title, Year & CTA */}
        <div className="md:col-span-4 md:sticky md:top-32">
          {fullBadge && (
            <div className="inline-flex items-center px-4 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
              <BadgeIcon size={14} className="mr-2 shrink-0" />
              <span>{fullBadge}</span>
            </div>
          )}

          {href ? (
            <Link href={href} className="block group">
              <h2
                className={cn(
                  getCardTitleSizeClass(title),
                  "font-black uppercase tracking-tight mb-6 leading-tight group-hover:text-primary transition-colors text-balance break-words [overflow-wrap:anywhere]"
                )}
              >
                {title}
              </h2>
            </Link>
          ) : (
            <h2
              className={cn(
                getCardTitleSizeClass(title),
                "font-black uppercase tracking-tight mb-6 leading-tight text-balance break-words [overflow-wrap:anywhere]"
              )}
            >
              {title}
            </h2>
          )}

          <div className="w-12 h-1 bg-primary mb-8" />

          {href && ctaLabel && (
            <Link
              href={href}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary font-bold text-sm transition-all group shadow-xs hover:-translate-y-0.5"
            >
              <span>{ctaLabel}</span>
              <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Right Column: Text & Optional Media Content */}
        <div className="md:col-span-8">
          <div className="prose prose-xl prose-invert max-w-none">
            {text && (
              <RichText
                content={text}
                className="text-xl text-foreground/80 leading-relaxed mb-8 md:mb-12"
              />
            )}
            {children}
          </div>
        </div>
      </div>
    </Section>
  );
}
