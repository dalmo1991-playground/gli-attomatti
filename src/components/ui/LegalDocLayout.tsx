import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormattedText } from "./FormattedText";

export interface LegalDocLayoutProps {
  badge?: string | null;
  title?: string | null;
  description?: string | null;
  backHref?: string | null;
  backLabel?: string | null;
  className?: string;
  children: React.ReactNode;
}

export function LegalDocLayout({
  badge,
  title,
  description,
  backHref = "/",
  backLabel = "Torna alla home",
  className,
  children
}: LegalDocLayoutProps) {
  return (
    <div className={cn("min-h-screen py-12 sm:py-16 px-4 sm:px-6", className)}>
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
        {/* Back Link */}
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </Link>
        )}

        {/* Document Header */}
        {(badge || title || description) && (
          <div className="space-y-4">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest shadow-xs">
                {badge}
              </div>
            )}

            {title && (
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-foreground leading-[1.05] text-balance break-words">
                {title}
              </h1>
            )}

            {description && (
              <p className="text-base sm:text-lg text-foreground/70 max-w-2xl font-medium leading-relaxed">
                <FormattedText text={description} />
              </p>
            )}
          </div>
        )}

        {/* Content Body / Cards */}
        <div className="space-y-6 sm:space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export interface LegalDocCardProps {
  title?: string | null;
  icon?: React.ElementType;
  iconColorClass?: string;
  badge?: string | null;
  headerClassName?: string;
  headerTitleClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export function LegalDocCard({
  title,
  icon: Icon,
  iconColorClass = "bg-primary/10 text-primary",
  badge,
  headerClassName,
  headerTitleClassName,
  className,
  children
}: LegalDocCardProps) {
  return (
    <div className={cn("p-6 sm:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 sm:space-y-6 glass", className)}>
      {(title || Icon || badge) && (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-foreground/5 pb-4", headerClassName)}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColorClass)}>
                <Icon size={20} />
              </div>
            )}
            {title && (
              <h2 className={cn("text-xs font-black uppercase tracking-widest text-foreground/40", headerTitleClassName)}>
                {title}
              </h2>
            )}
          </div>
          {badge && (
            <span className="px-3 py-1 rounded-full bg-foreground/5 text-foreground/60 text-xs font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="space-y-4 text-foreground/80 leading-relaxed text-sm sm:text-base font-normal">
        {children}
      </div>
    </div>
  );
}
