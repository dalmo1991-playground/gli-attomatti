"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

export interface HeroCtaActionsProps {
  primaryLabel?: string | null;
  primaryHref?: string | null;
  onPrimaryClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  secondaryLabel?: string | null;
  secondaryHref?: string | null;
  onSecondaryClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Shared CTA / status-tag row for the Hero section (Home & Landing pages).
 * Renders a primary/secondary button when a link is provided, or an informational tag when no link is set.
 */
export function HeroCtaActions({
  primaryLabel,
  primaryHref,
  onPrimaryClick,
  secondaryLabel,
  secondaryHref,
  onSecondaryClick,
}: HeroCtaActionsProps) {
  if (!primaryLabel && !secondaryLabel) return null;

  const resolvedPrimaryHref = typeof primaryHref === "string" ? primaryHref.trim() : "";
  const resolvedSecondaryHref = typeof secondaryHref === "string" ? secondaryHref.trim() : "";

  return (
    <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full">
      {/* Button 1 / Tag 1 */}
      {primaryLabel &&
        (resolvedPrimaryHref ? (
          <Link
            href={resolvedPrimaryHref}
            prefetch={false}
            onClick={onPrimaryClick}
            target={resolvedPrimaryHref.startsWith("http") ? "_blank" : undefined}
            rel={resolvedPrimaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground rounded-full font-black text-base sm:text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 flex items-center justify-center min-w-[220px] sm:min-w-[240px]"
          >
            <span>{primaryLabel}</span>
            <ArrowRight size={18} className="ml-2" />
          </Link>
        ) : (
          <div className="px-6 py-2.5 bg-primary/20 border-2 border-primary/30 text-primary rounded-xl font-black text-base flex items-center justify-center backdrop-blur-md shadow-lg shadow-primary/10">
            <Info size={16} className="mr-2 opacity-80" />
            <span>{primaryLabel}</span>
          </div>
        ))}

      {/* Button 2 / Tag 2 */}
      {secondaryLabel &&
        (resolvedSecondaryHref ? (
          <Link
            href={resolvedSecondaryHref}
            prefetch={false}
            onClick={onSecondaryClick}
            target={resolvedSecondaryHref.startsWith("http") ? "_blank" : undefined}
            rel={resolvedSecondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="px-8 py-3.5 sm:py-4 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary rounded-full font-bold text-base sm:text-lg transition-all flex items-center justify-center min-w-[220px] sm:min-w-[240px] shadow-xs hover:-translate-y-0.5"
          >
            <span>{secondaryLabel}</span>
          </Link>
        ) : (
          <div className="px-6 py-2.5 glass border-2 border-secondary/30 text-secondary rounded-xl font-black text-base flex items-center justify-center shadow-xl">
            <Info size={16} className="mr-2 text-secondary opacity-80" />
            <span>{secondaryLabel}</span>
          </div>
        ))}
    </div>
  );
}

