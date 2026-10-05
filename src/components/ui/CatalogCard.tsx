"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormattedText } from "./FormattedText";

export interface CatalogCardItem {
  id: string;
  title: string;
  category?: string;
  categoryIcon?: React.ElementType;
  description?: string;
  image?: string;
  date?: string;
  location?: string;
  primaryHref: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
}

export interface CatalogCardProps {
  item: CatalogCardItem;
  index?: number;
  className?: string;
}

export function CatalogCard({ item, index = 0, className }: CatalogCardProps) {
  const CategoryIcon = item.categoryIcon;
  const safeImage = item.image?.trim() || "/images/1782553290530-TheaterCurtain.webp";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={cn(
        "group flex flex-col bg-muted/20 border border-foreground/10 rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
        className
      )}
    >
      {/* Poster / Hero Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
        <Image
          src={safeImage}
          alt={item.title || "Locandina"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />

        {item.category && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 shadow-sm pointer-events-none">
            {CategoryIcon && <CategoryIcon size={12} />}
            <span>{item.category}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
        <div className="space-y-3">
          <Link href={item.primaryHref} className="block group-hover:text-primary transition-colors">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground transition-colors line-clamp-2 text-balance break-words">
              {item.title}
            </h3>
          </Link>

          {item.description && (
            <p className="text-sm text-foreground/70 leading-relaxed font-medium line-clamp-3">
              <FormattedText text={item.description} />
            </p>
          )}

          {/* Metadata: Date & Location */}
          {(item.date || item.location) && (
            <div className="pt-2 space-y-1.5 border-t border-foreground/5">
              {item.date && (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                  <Calendar size={13} className="text-accent shrink-0" />
                  <span className="truncate">{item.date}</span>
                </div>
              )}
              {item.location && (
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
                  <MapPin size={13} className="text-accent/80 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {item.primaryHref ? (
            <Link
              href={item.primaryHref}
              onClick={item.onPrimaryClick}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{item.primaryLabel || "Accedi"}</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-foreground/10 text-foreground/40 font-bold text-sm uppercase">
              <span>{item.primaryLabel || "Non disponibile"}</span>
            </div>
          )}

          {item.secondaryHref && (
            <div className="text-center">
              <Link
                href={item.secondaryHref}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-foreground/50 hover:text-foreground transition-colors pt-1"
              >
                <span>{item.secondaryLabel || "Maggiori dettagli"}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export interface CatalogGridProps {
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  hasItems?: boolean;
}

export function CatalogGrid({
  children,
  className,
  emptyMessage = "Nessun elemento disponibile al momento.",
  hasItems = true
}: CatalogGridProps) {
  if (!hasItems) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <p className="text-foreground/50 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto", className)}>
      {children}
    </div>
  );
}
