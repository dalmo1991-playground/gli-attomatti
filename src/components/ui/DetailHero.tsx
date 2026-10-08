"use client";

import React from "react";
import Image from "next/image";
import { Section } from "./Section";
import { BackLink } from "./BackLink";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPageHeroTitleSizeClass } from "@/lib/typography";
import { getImagePositionClass, getImageObjectPositionStyle, ImageAlign } from "@/lib/imageAlign";
import { getSafeImageProps } from "@/lib/youtube";

import { Ticket, ArrowDown } from "lucide-react";

interface DetailHeroProps {
  title?: string | null;
  heroImage?: string;
  imageAlign?: ImageAlign;
  backLink?: {
    href: string;
    label?: string | null;
  } | null;
  subtitle?: string | null;
  className?: string;
  mobileCtaLabel?: string | null;
  onMobileCtaClick?: () => void;
}

export function DetailHero({
  title,
  heroImage,
  imageAlign = "center",
  backLink,
  subtitle,
  className,
  mobileCtaLabel,
  onMobileCtaClick
}: DetailHeroProps) {
  const hasImage = Boolean(heroImage?.trim());
  const { src: displayHeroSrc, unoptimized: isHeroUnoptimized } = getSafeImageProps(heroImage);

  return (
    <Section
      className={cn(
        "bg-muted/30 py-20 sm:py-28 relative overflow-hidden flex items-center justify-center min-h-[360px] sm:min-h-[420px]",
        className
      )}
    >
      {hasImage ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={displayHeroSrc}
            alt={title || "Hero"}
            fill
            priority
            unoptimized={isHeroUnoptimized}
            sizes="100vw"
            className={cn("object-cover", getImagePositionClass(imageAlign))}
            style={{ objectPosition: getImageObjectPositionStyle(imageAlign) }}
          />
          {/* Theatrical cross-spotlights (warm gold accent & cool indigo secondary) */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
          {/* Cinematic dark gradients to guarantee text legibility */}
          <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -ml-20 -mb-20" />
        </div>
      )}

      <div className="max-w-4xl mx-auto text-center relative z-10 w-full px-4">
        {backLink && backLink.label && backLink.href && (
          <div className="mb-10 sm:mb-12">
            <BackLink href={backLink.href} label={backLink.label} />
          </div>
        )}

        {title && (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                getPageHeroTitleSizeClass(title),
                "font-black uppercase tracking-tighter mb-4 text-white drop-shadow-sm text-balance break-words [overflow-wrap:anywhere]"
              )}
            >
              {title}
            </motion.h1>

            <div className="w-20 h-1 bg-primary mx-auto mb-6 sm:mb-8 shadow-sm" />
          </>
        )}

        {subtitle && (
          <p className="text-xl sm:text-2xl text-foreground/60 font-bold uppercase tracking-[0.3em]">
            {subtitle}
          </p>
        )}

        {mobileCtaLabel && onMobileCtaClick && (
          <div className="mt-8 lg:hidden">
            <button
              type="button"
              onClick={onMobileCtaClick}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
            >
              <Ticket size={16} className="shrink-0 text-accent" />
              <span>{mobileCtaLabel}</span>
              <ArrowDown size={14} className="shrink-0 animate-bounce" />
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
