"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, X, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isNewsletterActive, NEWSLETTER_PATH } from "@/lib/newsletter";

const COOKIE_NAME = "attomatti_newsletter_popup";
const SESSION_TIMER_KEY = "attomatti_nl_timer_start";
const TARGET_SECONDS = 10;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days?: number) {
  if (typeof document === "undefined") return;
  let expires = "";
  if (typeof days === "number") {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

interface NewsletterPopupProps {
  content: any;
}

export function NewsletterPopup({ content }: NewsletterPopupProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Only run if newsletter path is defined and active
    if (!isNewsletterActive(content)) {
      setIsOpen(false);
      return;
    }

    // 2. Do not show popup on admin or on the newsletter registration page itself
    if (pathname?.startsWith("/admin") || pathname === NEWSLETTER_PATH) {
      setIsOpen(false);
      return;
    }

    // 3. Check cookie status
    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal) {
      if (cookieVal === "never") {
        // User already clicked through to registration, never show again
        return;
      }
      const dismissedTimestamp = parseInt(cookieVal, 10);
      if (!isNaN(dismissedTimestamp)) {
        if (Date.now() - dismissedTimestamp < SEVEN_DAYS_MS) {
          // Still within the 7 days dismissal window
          return;
        }
      }
    }

    // 4. Multi-page continuous navigation timer (10 seconds total across page changes)
    let startTime = parseInt(sessionStorage.getItem(SESSION_TIMER_KEY) || "", 10);
    const now = Date.now();

    if (isNaN(startTime) || startTime <= 0) {
      startTime = now;
      sessionStorage.setItem(SESSION_TIMER_KEY, String(startTime));
    }

    const elapsedSeconds = Math.max(0, (now - startTime) / 1000);
    const remainingMs = Math.max(0, (TARGET_SECONDS - elapsedSeconds) * 1000);

    if (remainingMs === 0) {
      setIsOpen(true);
      return;
    }

    timerRef.current = setTimeout(() => {
      // Re-verify cookie before opening
      const currentCookie = getCookie(COOKIE_NAME);
      if (currentCookie === "never") return;
      if (currentCookie && Date.now() - parseInt(currentCookie, 10) < SEVEN_DAYS_MS) return;
      if (window.location.pathname === NEWSLETTER_PATH || window.location.pathname.startsWith("/admin")) return;

      setIsOpen(true);
    }, remainingMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pathname, content]);

  const handleCtaClick = () => {
    // User clicked to go to the registration form: do NOT show again ever (10 years)
    setCookie(COOKIE_NAME, "never", 3650);
    setIsOpen(false);
  };

  const handleDismiss = () => {
    // User closed popup: show only if they return after 7 days
    setCookie(COOKIE_NAME, String(Date.now()), 7);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="newsletter-popup-title"
          className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-3rem)] pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-background/95 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden group"
          >
            {/* Theatrical background glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-accent/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Chiudi avviso newsletter"
              className="absolute top-4 right-4 p-2 rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Mail size={22} />
              </div>

              <div className="space-y-2 pr-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                  <Sparkles size={11} />
                  <span>Newsletter</span>
                </div>
                <h3
                  id="newsletter-popup-title"
                  className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug"
                >
                  Resta aggiornato sul teatro a Zurigo
                </h3>
                <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">
                  Nuovi spettacoli, laboratori e anteprime degli spettacoli Gli Attomatti direttamente nella tua casella di posta.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-foreground/5">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-bold text-foreground/60 hover:text-foreground transition-colors text-center"
              >
                Ricordamelo più tardi
              </button>
              <Link
                href={NEWSLETTER_PATH}
                prefetch={false}
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md group/btn"
              >
                <span>Iscriviti subito</span>
                <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
