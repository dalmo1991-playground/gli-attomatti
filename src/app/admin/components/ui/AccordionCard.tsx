"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AccordionCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "primary" | "secondary" | "accent" | "muted" | "rose" | "indigo" | "amber" | string;
  thumbnail?: string;
  index: number;
  total: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionCard({
  title,
  subtitle,
  badge,
  badgeColor = "primary",
  thumbnail,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
  defaultOpen = false
}: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const badgeColorClass =
    ({
      primary: "bg-primary/10 text-primary border-primary/20",
      secondary: "bg-secondary/10 text-secondary border-secondary/20",
      accent: "bg-accent/10 text-accent border-accent/20",
      muted: "bg-muted text-foreground/60 border-foreground/10",
      rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    } as Record<string, string>)[badgeColor] || "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="bg-background/80 border border-foreground/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-foreground/20">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-muted/10 select-none">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center font-mono font-bold text-xs text-foreground/40 shrink-0">
            {index + 1}
          </div>

          {thumbnail && (
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-foreground/10 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail}
                alt={title || ""}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                {title || "Senza titolo"}
              </h4>
              {badge && (
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                    badgeColorClass
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-foreground/40 truncate font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              title="Sposta su"
              className="p-1.5 hover:bg-muted rounded-lg text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            >
              <ArrowUp size={14} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              title="Sposta giù"
              className="p-1.5 hover:bg-muted rounded-lg text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            >
              <ArrowDown size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Sei sicuro di voler rimuovere "${title}"?`)) {
                onDelete();
              }
            }}
            title="Elimina elemento"
            className="p-1.5 hover:bg-red-500/10 text-foreground/40 hover:text-red-400 rounded-lg transition-colors ml-1"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-muted text-foreground/60 rounded-lg transition-colors ml-1"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 border-t border-foreground/5 space-y-6 bg-muted/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
