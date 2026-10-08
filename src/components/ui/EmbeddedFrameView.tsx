"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Lock, Info } from "lucide-react";
import { cn, defaultText } from "@/lib/utils";
import { FormattedText } from "./FormattedText";

export interface TrustBadgeItem {
  icon?: React.ElementType;
  text?: string | null;
}

export interface EmbeddedFrameViewProps {
  title?: string | null;
  category?: string | null;
  categoryIcon?: React.ElementType;
  description?: string | null;
  embedUrl: string;
  directUrl?: string;
  backHref?: string | null;
  backLabel?: string | null;
  legalHref?: string | null;
  legalLabel?: string | null;
  showNavigation?: boolean;
  iframeTitle?: string | null;
  minHeightClass?: string;
  frameContainerClassName?: string;
  iframeClassName?: string;
  sandbox?: string;
  allow?: string;
  dataTallySrc?: string;
  notConfiguredTitle?: string | null;
  notConfiguredDescription?: string | null;
  fallbackNotice?: string | null;
  fallbackButtonLabel?: string | null;
  trustBadges?: TrustBadgeItem[];
  onDirectClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EmbeddedFrameView({
  title,
  category,
  categoryIcon: CategoryIcon,
  description,
  embedUrl,
  directUrl,
  backHref = "/",
  backLabel = "Torna al sito",
  legalHref = "/Termini",
  legalLabel = "Termini & Condizioni",
  showNavigation = true,
  iframeTitle = "Modulo interattivo",
  minHeightClass = "min-h-[680px] sm:min-h-[760px]",
  frameContainerClassName = "bg-white",
  iframeClassName,
  sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation",
  allow = "payment; camera; microphone; autoplay; encrypted-media; fullscreen",
  dataTallySrc,
  notConfiguredTitle = "Servizio non ancora configurato",
  notConfiguredDescription = "La pagina non è al momento collegata a un servizio attivo.",
  fallbackNotice = "Problemi di visualizzazione con il modulo integrato?",
  fallbackButtonLabel = "Apri in una nuova scheda",
  trustBadges,
  onDirectClick,
  className,
  children
}: EmbeddedFrameViewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const targetDirectUrl = directUrl || embedUrl;

  return (
    <div className={cn("min-h-screen py-8 sm:py-10 px-4 sm:px-6", className)}>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation Bar */}
        {showNavigation && ((backHref && backLabel) || (legalHref && legalLabel)) ? (
          <div className="flex items-center justify-between">
            {backHref && backLabel ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} />
                <span>{backLabel}</span>
              </Link>
            ) : (
              <div />
            )}

            {legalHref && legalLabel ? (
              <Link
                href={legalHref}
                className="text-xs text-foreground/40 hover:text-foreground font-medium underline transition-colors"
              >
                {legalLabel}
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Page Summary Header Card */}
        {(category || title || description) && (
          <div className="p-6 sm:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-3 glass">
            {category && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                {CategoryIcon && <CategoryIcon size={12} />}
                <span>{category}</span>
              </div>
            )}

            {title && (
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground text-balance break-words">
                {title}
              </h1>
            )}

            {description && (
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-2xl font-medium pt-1">
                <FormattedText text={description} />
              </p>
            )}
          </div>
        )}

        {children}

        {/* Main Embed Frame Container */}
        {embedUrl ? (
          <div className={cn("relative rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl", frameContainerClassName)}>
            {/* Loading Indicator */}
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 z-10 space-y-3 p-6 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs text-foreground/60 font-semibold uppercase tracking-wider">
                  Caricamento in corso...
                </p>
              </div>
            )}

            <iframe
              src={embedUrl}
              data-tally-src={dataTallySrc}
              title={iframeTitle || undefined}
              width="100%"
              className={cn("w-full border-0 block", minHeightClass, iframeClassName)}
              onLoad={() => setIframeLoaded(true)}
              allow={allow}
              sandbox={sandbox}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <Info size={32} className="mx-auto text-accent" />
            <h2 className="text-xl font-bold text-foreground">
              {notConfiguredTitle}
            </h2>
            <p className="text-foreground/70 font-medium max-w-md mx-auto">
              {notConfiguredDescription}
            </p>
            <div className="pt-2">
              <Link
                href={backHref || "/"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
              >
                {backLabel}
              </Link>
            </div>
          </div>
        )}

        {/* Direct Link Fallback Card */}
        {targetDirectUrl && (fallbackNotice || fallbackButtonLabel) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/10 border border-foreground/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            {fallbackNotice && (
              <span className="text-xs sm:text-sm text-foreground/60">
                {fallbackNotice}
              </span>
            )}
            {fallbackButtonLabel && (
              <Link
                href={targetDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onDirectClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-bold uppercase tracking-wider border border-foreground/10 transition-colors shrink-0"
              >
                <span>{fallbackButtonLabel}</span>
                <ExternalLink size={13} />
              </Link>
            )}
          </div>
        )}

        {/* Trust & Compliance Badges */}
        {trustBadges && trustBadges.filter((b) => b && defaultText(b.text)).length > 0 && (
          <div className="pt-4 border-t border-foreground/5 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-foreground/50 text-center">
            {trustBadges.filter((b) => b && defaultText(b.text)).map((badge, idx) => {
              const BadgeIcon = badge.icon || ShieldCheck;
              return (
                <div key={idx} className="flex items-center gap-2 font-medium">
                  <BadgeIcon size={14} className="text-primary/70 shrink-0" />
                  <span>{defaultText(badge.text)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
