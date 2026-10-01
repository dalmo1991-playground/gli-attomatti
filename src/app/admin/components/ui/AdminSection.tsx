"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdminSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  icon?: any;
}

export function AdminSection({
  title,
  description,
  children,
  action,
  className,
  icon: Icon
}: AdminSectionProps) {
  return (
    <div
      className={cn(
        "relative p-8 md:p-10 bg-muted/20 border border-foreground/5 rounded-3xl shadow-sm hover:border-foreground/10 transition-all duration-300 overflow-hidden",
        className
      )}
    >
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

      {Icon && (
        <Icon
          size={110}
          className="absolute -bottom-6 -right-6 text-foreground/[0.02] pointer-events-none"
        />
      )}

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/5 pb-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
              {title}
            </h3>
            <div className="w-12 h-1 bg-primary mt-2 mb-2" />
            {description && (
              <p className="text-sm text-foreground/50 font-medium">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
