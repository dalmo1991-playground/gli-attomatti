"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, ChevronDown, ChevronUp, Check, X, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface StoredConsent {
  version: number;
  analytics: boolean;
  marketing: boolean;
  consented_providers: string[];
  timestamp: string;
}

interface CookieBannerProps {
  integrations?: any;
  onConsentChange: (consent: { analytics: boolean; marketing: boolean }) => void;
}

export function CookieBanner({ integrations, onConsentChange }: CookieBannerProps) {
  const ga = integrations?.google_analytics;
  const meta = integrations?.meta_pixel;

  const isGaActive = Boolean(ga?.enabled && ga?.measurement_id?.trim());
  const isMetaActive = Boolean(meta?.enabled && meta?.pixel_id?.trim());
  const isAnyTrackerActive = isGaActive || isMetaActive;

  const currentVersion = Number(integrations?.cookie_consent?.version) || 1;

  // Compute the list of active tracking keys
  const currentActiveProviders: string[] = [];
  if (isGaActive) currentActiveProviders.push("google_analytics");
  if (isMetaActive) currentActiveProviders.push("meta_pixel");

  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [hasNewTrackingNotice, setHasNewTrackingNotice] = useState(false);

  // Check stored consent on mount
  useEffect(() => {
    // If no tracking providers are enabled by the admin, no banner is needed!
    if (!isAnyTrackerActive) {
      setIsOpen(false);
      onConsentChange({ analytics: false, marketing: false });
      return;
    }

    try {
      const storedRaw = localStorage.getItem("attomatti_cookie_consent");
      if (!storedRaw) {
        // First-time visitor: open banner for opt-in
        setIsOpen(true);
        return;
      }

      const stored: StoredConsent = JSON.parse(storedRaw);

      // Check if consent version increased
      const isVersionOutdated = (stored.version || 0) < currentVersion;

      // Check if new tracking providers were activated that weren't consented to
      const hasUnconsentedTracker = currentActiveProviders.some(
        (provider) => !stored.consented_providers?.includes(provider)
      );

      if (isVersionOutdated || hasUnconsentedTracker) {
        // Visitor previously consented, but now there is NEW tracking to approve!
        setHasNewTrackingNotice(hasUnconsentedTracker);
        setIsOpen(true);
        // Pre-fill checkboxes with their previous choices where applicable
        setAnalyticsChecked(stored.analytics);
        setMarketingChecked(false); // Force explicit opt-in for new marketing
      } else {
        // Fully up to date
        setIsOpen(false);
        onConsentChange({
          analytics: stored.analytics,
          marketing: stored.marketing,
        });
      }
    } catch {
      setIsOpen(true);
    }
  }, [isAnyTrackerActive, currentVersion, isGaActive, isMetaActive]);

  // Listener to allow reopening banner from /Privacy page
  useEffect(() => {
    const handleReopen = () => {
      setIsOpen(true);
      setShowDetails(true);
    };

    window.addEventListener("open-cookie-banner", handleReopen);
    return () => window.removeEventListener("open-cookie-banner", handleReopen);
  }, []);

  const saveConsent = (analytics: boolean, marketing: boolean) => {
    const consentedProviders: string[] = [];
    if (analytics && isGaActive) consentedProviders.push("google_analytics");
    if (marketing && isMetaActive) consentedProviders.push("meta_pixel");

    const newConsent: StoredConsent = {
      version: currentVersion,
      analytics,
      marketing,
      consented_providers: consentedProviders,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem("attomatti_cookie_consent", JSON.stringify(newConsent));
    } catch {
      // ignore
    }

    onConsentChange({ analytics, marketing });
    setIsOpen(false);
    setHasNewTrackingNotice(false);
  };

  const handleAcceptAll = () => {
    saveConsent(isGaActive, isMetaActive);
  };

  const handleRejectAll = () => {
    saveConsent(false, false);
  };

  const handleSaveCustom = () => {
    saveConsent(analyticsChecked && isGaActive, marketingChecked && isMetaActive);
  };

  if (!isAnyTrackerActive || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto bg-slate-900/95 border border-foreground/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl pointer-events-auto text-foreground space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                  Preferenze sui Cookie & Privacy
                </h3>
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">
                  Approccio Trasparente (Opt-in)
                </span>
              </div>
            </div>

            {hasNewTrackingNotice && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                Nuovi strumenti attivati: richiesto consenso
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            Questo sito utilizza cookie tecnici strettamente necessari al funzionamento. Previo tuo consenso esplicito, possiamo utilizzare strumenti di analisi ({isGaActive && "Google Analytics"}) e marketing ({isMetaActive && "Meta Pixel"}) per comprendere il nostro pubblico e promuovere gli spettacoli teatrali.
          </p>

          {/* Expandable Customization Details */}
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pt-4 border-t border-foreground/10 text-xs"
            >
              {/* Necessari */}
              <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-foreground block text-sm">Cookie Tecnici Necessari</span>
                  <span className="text-foreground/60 leading-relaxed">
                    Indispensabili per la navigazione sicura, la memorizzazione delle scelte di privacy e il funzionamento tecnico dei moduli e casse incorporate (Tally ed Eventfrog). Sempre attivi.
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider shrink-0">
                  Sempre Attivi
                </span>
              </div>

              {/* Analitici (GA4) */}
              {isGaActive && (
                <label className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 flex items-center justify-between gap-4 cursor-pointer hover:bg-foreground/10 transition-colors">
                  <div>
                    <span className="font-bold text-foreground block text-sm">Statistici e Analisi (Google Analytics 4)</span>
                    <span className="text-foreground/60 leading-relaxed">
                      Raccolgono dati anonimizzati sull'utilizzo del sito per aiutarci a capire quali spettacoli e pagine sono più apprezzati.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsChecked}
                    onChange={(e) => setAnalyticsChecked(e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer shrink-0"
                  />
                </label>
              )}

              {/* Marketing (Meta Pixel) */}
              {isMetaActive && (
                <label className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 flex items-center justify-between gap-4 cursor-pointer hover:bg-foreground/10 transition-colors">
                  <div>
                    <span className="font-bold text-foreground block text-sm">Marketing e Social (Meta Pixel / Instagram)</span>
                    <span className="text-foreground/60 leading-relaxed">
                      Consentono di misurare l'efficacia delle inserzioni per la vendita dei biglietti su Instagram e Facebook.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingChecked}
                    onChange={(e) => setMarketingChecked(e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer shrink-0"
                  />
                </label>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 text-xs text-foreground/50">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="hover:text-primary transition-colors inline-flex items-center gap-1 font-bold underline"
              >
                <Sliders size={13} />
                <span>{showDetails ? "Chiudi personalizzazione" : "Personalizza scelte"}</span>
              </button>

              <Link href="/Privacy" className="hover:text-primary transition-colors underline">
                Informativa Privacy
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/70 hover:text-foreground text-xs font-bold uppercase tracking-wider transition-all"
              >
                Rifiuta non necessari
              </button>

              {showDetails ? (
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
                >
                  Salva preferenze
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
                >
                  Accetta tutti
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
