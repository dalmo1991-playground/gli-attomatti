"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Radio,
  Sliders,
  Copy,
  Check
} from "lucide-react";
import {
  DevTrackingEvent,
  DEV_TRACKING_EVENT_NAME,
  DEV_TRACKING_TOGGLE_EVENT_NAME,
  isDevTrackingOverlayEnabled,
  setDevTrackingOverlayEnabled,
} from "@/lib/devTracking";
import { isDevSite } from "@/lib/devTheme";
import { cn } from "@/lib/utils";

export function DevTrackingOverlay() {
  const [mounted, setMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [events, setEvents] = useState<DevTrackingEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Initialize dev and toggle check
  useEffect(() => {
    setMounted(true);
    const dev = isDevSite();
    setIsDev(dev);
    if (dev) {
      setIsEnabled(isDevTrackingOverlayEnabled());
    }
  }, []);

  // Listen for toggle changes from DevThemeCustomizer or elsewhere
  useEffect(() => {
    if (!isDev) return;

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail) {
        setIsEnabled(customEvent.detail.enabled);
      }
    };

    window.addEventListener(DEV_TRACKING_TOGGLE_EVENT_NAME, handleToggle);
    return () => {
      window.removeEventListener(DEV_TRACKING_TOGGLE_EVENT_NAME, handleToggle);
    };
  }, [isDev]);

  // Listen for incoming tracking events & intercept window.dataLayer for Google automated events
  useEffect(() => {
    if (!isDev) return;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DevTrackingEvent>;
      if (!customEvent.detail) return;

      setEvents((prev) => {
        // Keep up to 80 most recent events
        const updated = [customEvent.detail, ...prev];
        return updated.slice(0, 80);
      });
    };

    window.addEventListener(DEV_TRACKING_EVENT_NAME, handleEvent);

    // Intercept window.dataLayer for automated Google events (scroll, user_engagement, click, etc.)
    let originalPush: ((...args: any[]) => any) | null = null;
    const dl = (window.dataLayer = window.dataLayer || []);

    try {
      originalPush = dl.push;
      dl.push = function (...args: any[]) {
        try {
          for (const item of args) {
            // Case A: Arguments-like object or array: gtag('event', eventName, params)
            if (item && (item[0] === "event" || (typeof item === "object" && item.event))) {
              const eventName = item[0] === "event" ? item[1] : item.event;
              const eventParams = item[0] === "event" ? item[2] || {} : item;

              // Filter out internal system setups and events we already emit manually
              const ignored = [
                "consent",
                "js",
                "config",
                "view_item",
                "begin_checkout",
                "generate_lead",
                "social_interaction",
              ];

              if (eventName && !ignored.includes(eventName)) {
                // Determine if this is an automated Google event like scroll, click, etc.
                const isGaAuto = [
                  "scroll",
                  "click",
                  "file_download",
                  "video_start",
                  "video_progress",
                  "video_complete",
                  "user_engagement",
                  "first_visit",
                  "session_start",
                ].includes(eventName);

                const now = new Date();
                const timeString =
                  now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

                const detectedEvent: DevTrackingEvent = {
                  id: `ga-auto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  timestamp: Date.now(),
                  timeString,
                  source: isGaAuto ? "ga4-auto" : "ga4",
                  action: isGaAuto ? `[GA4 Auto] ${eventName}` : eventName,
                  category: isGaAuto ? "Google Enhanced" : "Google Analytics",
                  payload: typeof eventParams === "object" ? eventParams : { raw: eventParams },
                  dispatchedTo: {
                    ga4: true,
                    meta: false,
                  },
                };

                setEvents((prev) => {
                  // Prevent immediate duplicate if any
                  if (prev.length > 0 && prev[0].action === detectedEvent.action && Date.now() - prev[0].timestamp < 300) {
                    return prev;
                  }
                  return [detectedEvent, ...prev.slice(0, 79)];
                });
              }
            }
          }
        } catch {
          // ignore inspection errors
        }

        return originalPush ? originalPush.apply(dl, args) : Array.prototype.push.apply(dl, args);
      };
    } catch {
      // ignore interceptor errors
    }

    return () => {
      window.removeEventListener(DEV_TRACKING_EVENT_NAME, handleEvent);
      if (originalPush && dl) {
        dl.push = originalPush;
      }
    };
  }, [isDev]);

  if (!mounted || !isDev || !isEnabled) {
    return null;
  }

  const filteredEvents = events.filter((ev) => {
    if (filterAction === "all") return true;
    if (filterAction === "conversion") return Boolean(ev.isConversion);
    if (filterAction === "[GA4 Auto]") return ev.source === "ga4-auto" || ev.action.includes("[GA4 Auto]");
    return ev.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  const clearEvents = () => {
    setEvents([]);
    setSelectedEventId(null);
  };

  const handleCopyJson = (ev: DevTrackingEvent) => {
    navigator.clipboard.writeText(JSON.stringify(ev, null, 2));
    setCopiedId(ev.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getActionBadgeColor = (action: string, isConversion?: boolean) => {
    if (isConversion) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30";
    if (action.includes("[GA4 Auto]")) return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    if (action.includes("page_view")) return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    if (action.includes("checkout")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (action.includes("lead")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    if (action.includes("contact")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (action.includes("social")) return "bg-pink-500/15 text-pink-400 border-pink-500/30";
    if (action.includes("consent")) return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
    return "bg-foreground/10 text-foreground/80 border-foreground/20";
  };

  return (
    <aside
      aria-label="Pannello Dev Eventi di Tracciamento"
      className={cn(
        "fixed bottom-6 right-6 z-[60] flex flex-col font-sans transition-all duration-300 pointer-events-auto",
        isMinimized ? "w-72" : "w-[94vw] sm:w-[460px] max-h-[75vh]"
      )}
    >
      <div className="glass backdrop-blur-2xl bg-slate-950/90 text-slate-100 border border-slate-700/60 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-full">
        {/* Header Bar */}
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-primary/20 text-primary border border-primary/40 shrink-0">
              <Activity size={15} className="animate-pulse" />
              {events.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 truncate">
                  Tracking Live
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                  DEV ONLY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {events.length} eventi registrati
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {events.length > 0 && !isMinimized && (
              <button
                type="button"
                onClick={clearEvents}
                title="Pulisci log eventi"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Espandi overlay" : "Minimizza overlay"}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              type="button"
              onClick={() => setDevTrackingOverlayEnabled(false)}
              title="Disattiva e chiudi overlay tracking"
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Body (when not minimized) */}
        {!isMinimized && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filter Pills */}
            <div className="p-2 border-b border-slate-800/80 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[10px]">
              {[
                { id: "all", label: "Tutti" },
                { id: "conversion", label: "★ Conversioni" },
                { id: "[GA4 Auto]", label: "Google Auto (Scroll/Click)" },
                { id: "page_view", label: "Pageview" },
                { id: "view_content", label: "Contenuti" },
                { id: "checkout", label: "Biglietti" },
                { id: "contact", label: "Contatti" },
                { id: "lead", label: "Lead/Form" },
                { id: "social", label: "Social" },
              ].map((f) => {
                const isActive = filterAction === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterAction(f.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all",
                      isActive
                        ? f.id === "conversion"
                          ? "bg-emerald-500 text-slate-950 shadow-xs font-black"
                          : f.id === "[GA4 Auto]"
                          ? "bg-cyan-500 text-slate-950 shadow-xs font-black"
                          : "bg-primary text-primary-foreground shadow-xs"
                        : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Event List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5 max-h-[48vh] custom-scrollbar">
              {filteredEvents.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-500 text-xs">
                  <Activity size={24} className="mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="font-bold">In attesa di eventi...</p>
                  <p className="text-[11px] mt-1 text-slate-600">
                    Naviga tra le pagine, scrolla oltre il 90% o interagisci con bottoni e link.
                  </p>
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const isExpanded = selectedEventId === ev.id;
                  const hasGa = ev.dispatchedTo.ga4;
                  const hasMeta = ev.dispatchedTo.meta;

                  return (
                    <div
                      key={ev.id}
                      className={cn(
                        "rounded-2xl border transition-all duration-200 text-xs overflow-hidden",
                        isExpanded
                          ? "bg-slate-900 border-slate-700 shadow-md"
                          : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(isExpanded ? null : ev.id)}
                        className="w-full p-2.5 text-left flex items-start justify-between gap-2 select-none"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                                getActionBadgeColor(ev.action, ev.isConversion)
                              )}
                            >
                              {ev.action}
                            </span>
                            {ev.isConversion && (
                              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider">
                                ★ CONVERSIONE
                              </span>
                            )}
                            {ev.source === "ga4-auto" && (
                              <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold uppercase tracking-wider">
                                GOOGLE AUTO
                              </span>
                            )}
                            {ev.category && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {ev.category}
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-[11px] text-slate-300 truncate">
                            {ev.payload.page_title ||
                              ev.payload.title ||
                              ev.payload.showTitle ||
                              ev.payload.formName ||
                              ev.payload.channel ||
                              ev.payload.platform ||
                              JSON.stringify(ev.payload)}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                          <span className="text-[9px] font-mono text-slate-500">
                            {ev.timeString}
                          </span>
                          <div className="flex items-center gap-1 text-[9px] font-bold">
                            <span
                              className={cn(
                                "px-1 rounded",
                                hasGa
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-slate-800 text-slate-500 line-through"
                              )}
                              title={hasGa ? "Inviato a GA4" : "GA4 non attivo/bloccato"}
                            >
                              GA4
                            </span>
                            <span
                              className={cn(
                                "px-1 rounded",
                                hasMeta
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-slate-800 text-slate-500 line-through"
                              )}
                              title={hasMeta ? "Inviato a Meta Pixel" : "Meta Pixel non attivo/bloccato"}
                            >
                              META
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="p-3 pt-1 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5">
                          {/* Consent State Banner */}
                          {ev.consentState && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px]">
                              <span className="text-slate-400 font-bold uppercase tracking-wider">
                                Stato Consenso al momento del trigger:
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "flex items-center gap-1 font-bold",
                                    ev.consentState.analytics ? "text-emerald-400" : "text-amber-400"
                                  )}
                                >
                                  {ev.consentState.analytics ? (
                                    <ShieldCheck size={11} />
                                  ) : (
                                    <ShieldAlert size={11} />
                                  )}
                                  Analytics: {ev.consentState.analytics ? "SI" : "NO"}
                                </span>
                                <span
                                  className={cn(
                                    "flex items-center gap-1 font-bold",
                                    ev.consentState.marketing ? "text-emerald-400" : "text-amber-400"
                                  )}
                                >
                                  {ev.consentState.marketing ? (
                                    <ShieldCheck size={11} />
                                  ) : (
                                    <ShieldAlert size={11} />
                                  )}
                                  Marketing: {ev.consentState.marketing ? "SI" : "NO"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Payload Viewer */}
                          <div>
                            <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400 font-mono">
                              <span>Payload Evento (JSON):</span>
                              <button
                                type="button"
                                onClick={() => handleCopyJson(ev)}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                {copiedId === ev.id ? (
                                  <>
                                    <Check size={10} /> Copiato!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={10} /> Copia JSON
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400/90 overflow-x-auto custom-scrollbar max-h-40">
                              {JSON.stringify(ev.payload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={listEndRef} />
            </div>

            {/* Bottom Info Bar */}
            <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Traccia GA4 (view_item, begin_checkout, page_view) e Meta Pixel</span>
              <button
                type="button"
                onClick={() => setDevTrackingOverlayEnabled(false)}
                className="text-primary hover:underline font-bold"
              >
                Nascondi
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
