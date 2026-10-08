"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTicketsBubbleProps {
  targetId?: string;
  label?: string;
  className?: string;
}

export function MobileTicketsBubble({
  targetId = "biglietti",
  label,
  className
}: MobileTicketsBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !label) return;

    let isPastThreshold = window.scrollY > 280;
    let isTargetInViewOrPassed = false;

    const checkVisibility = () => {
      const el = document.getElementById(targetId);
      if (!el) {
        setIsVisible(false);
        return;
      }

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      // If the top of the element is visible in the viewport or already passed above it
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        // Element is currently visible in viewport
        isTargetInViewOrPassed = true;
      } else if (rect.top < 0) {
        // User has scrolled PAST the target element
        isTargetInViewOrPassed = true;
      } else {
        // Target element is still below the viewport
        isTargetInViewOrPassed = false;
      }

      setIsVisible(isPastThreshold && !isTargetInViewOrPassed);
    };

    const handleScroll = () => {
      isPastThreshold = window.scrollY > 280;
      checkVisibility();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    checkVisibility();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkVisibility);
    };
  }, [targetId, label]);

  const handleScrollToTarget = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!label) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.85 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className={cn(
            "fixed bottom-6 right-5 z-40 lg:hidden pb-[max(0.25rem,env(safe-area-inset-bottom))] pointer-events-auto",
            className
          )}
        >
          <button
            type="button"
            onClick={handleScrollToTarget}
            aria-label={label}
            className="group relative flex items-center gap-2.5 px-4.5 py-3 rounded-full bg-primary/95 hover:bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-2xl shadow-primary/40 border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          >
            <Ticket size={16} className="shrink-0 text-accent group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[180px] drop-shadow-sm">{label}</span>
            <ArrowDown size={14} className="shrink-0 animate-bounce" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
