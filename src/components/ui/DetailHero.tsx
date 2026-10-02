"use client";

import React from "react";
import Image from "next/image";
import { Section } from "./Section";
import { BackLink } from "./BackLink";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPageHeroTitleSizeClass } from "@/lib/typography";

interface DetailHeroProps {
  title: string;
  heroImage?: string;
  backLink: {
    href: string;
    label: string;
  };
  subtitle?: string;
  className?: string;
}

export function DetailHero({
  title,
  heroImage,
  backLink,
  subtitle,
  className
}: DetailHeroProps) {
  const hasImage = Boolean(heroImage?.trim());

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
            src={heroImage!.trim()}
            alt={title || "Hero"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Cinematic dark gradients to guarantee text legibility */}
          <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
        </div>
      ) : (
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      )}

      <div className="max-w-4xl mx-auto text-center relative z-10 w-full px-4">
        <div className="mb-10 sm:mb-12">
          <BackLink href={backLink.href} label={backLink.label} />
        </div>

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

        {subtitle && (
          <p className="text-xl sm:text-2xl text-foreground/60 font-bold uppercase tracking-[0.3em]">
            {subtitle}
          </p>
        )}
      </div>
    </Section>
  );
}
