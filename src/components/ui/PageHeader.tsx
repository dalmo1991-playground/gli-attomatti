"use client";

import React from "react";
import { Section } from "./Section";
import { RichText } from "./RichText";
import { BackLink } from "./BackLink";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPageHeroTitleSizeClass } from "@/lib/typography";

import { FormattedText } from "./FormattedText";

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  backLink,
  children,
  className,
  compact = false
}: PageHeaderProps) {
  return (
    <Section className={cn("bg-muted/30 relative overflow-hidden", compact ? "py-16 sm:py-20" : "py-20 sm:py-24", className)}>
      {/* Ambient theatrical background glows */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -ml-24 -mt-24 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -mr-20 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-secondary/15 rounded-full blur-3xl -mb-32 pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {backLink && (
          <div className="mb-8">
            <BackLink href={backLink.href} label={backLink.label} />
          </div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            getPageHeroTitleSizeClass(title),
            "font-black mb-8 uppercase tracking-tighter text-balance break-words [overflow-wrap:anywhere]"
          )}
        >
          <FormattedText text={title} />
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-1 bg-primary mx-auto mb-8 shadow-sm"
        />

        {description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-medium"
          >
            {typeof description === "string" ? (
              <RichText content={description} />
            ) : (
              description
            )}
          </motion.div>
        )}

        {children}
      </div>
    </Section>
  );
}
