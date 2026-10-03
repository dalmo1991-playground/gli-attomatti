"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Check,
  Copy,
  RotateCcw,
  X,
  ClipboardPaste,
  SlidersHorizontal,
  Info,
  Lock,
  Layers
} from "lucide-react";
import {
  ThemeColors,
  ThemePreset,
  DEFAULT_THEME_COLORS,
  THEME_PRESETS,
  isDevSite,
  applyTheme,
  saveDevTheme,
  getSavedDevTheme,
  resetDevTheme,
  getAutoContrastColor,
  getRelativeLuminance
} from "@/lib/devTheme";
import { cn } from "@/lib/utils";

type ColorKey = "background" | "foreground" | "primary" | "secondary" | "accent" | "muted";
type FgKey = "primaryForeground" | "secondaryForeground" | "accentForeground";

interface ColorItemConfig {
  key: ColorKey;
  label: string;
  desc: string;
  fgKey?: FgKey;
  fgLabel?: string;
}

const COLOR_KEYS: ColorItemConfig[] = [
  { key: "background", label: "Sfondo", desc: "Canvas principale della pagina" },
  { key: "foreground", label: "Testo", desc: "Tipografia e contrasto primario" },
  {
    key: "primary",
    label: "Primario",
    desc: "Pulsanti CTA, bordi e highlight",
    fgKey: "primaryForeground",
    fgLabel: "Testo su Primario"
  },
  {
    key: "secondary",
    label: "Secondario",
    desc: "Badge, riflettori freddi e azioni secondarie",
    fgKey: "secondaryForeground",
    fgLabel: "Testo su Secondario"
  },
  {
    key: "accent",
    label: "Accento",
    desc: "Date spettacoli, riflettori caldi e dettagli",
    fgKey: "accentForeground",
    fgLabel: "Testo su Accento"
  },
  { key: "muted", label: "Superfici", desc: "Sfondo schede e container" },
];

/**
 * Applies landing theme colors directly to #landing-root element and notifies listeners.
 */
function applyLandingThemeLive(slug: string, colors: ThemeColors) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`attomatti_landing_theme_${slug}`, JSON.stringify(colors));
  } catch (e) {
    console.error("Failed to save isolated landing theme to localStorage", e);
  }

  // Dispatch custom event for LandingClient state
  window.dispatchEvent(
    new CustomEvent("attomatti_landing_theme_change", {
      detail: { slug, colors }
    })
  );

  // Directly update CSS properties on the landing root container for zero-latency response
  const el = document.getElementById("landing-root");
  if (el) {
    const primaryFg = colors.primaryForeground || getAutoContrastColor(colors.primary);
    const secondaryFg = colors.secondaryForeground || getAutoContrastColor(colors.secondary);
    const accentFg = colors.accentForeground || getAutoContrastColor(colors.accent);

    el.style.setProperty("--background", colors.background);
    el.style.setProperty("--foreground", colors.foreground);
    el.style.setProperty("--primary", colors.primary);
    el.style.setProperty("--primary-foreground", primaryFg);
    el.style.setProperty("--secondary", colors.secondary);
    el.style.setProperty("--secondary-foreground", secondaryFg);
    el.style.setProperty("--accent", colors.accent);
    el.style.setProperty("--accent-foreground", accentFg);
    el.style.setProperty("--muted", colors.muted);
    el.style.backgroundColor = colors.background;
    el.style.color = colors.foreground;
  }
}

export function DevThemeCustomizer() {
  const pathname = usePathname();
  const isLanding = pathname?.startsWith("/landing/");
  const landingSlug = isLanding ? pathname.replace("/landing/", "").split("/")[0] : null;

  const [mounted, setMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME_COLORS);
  const [landingOriginalTheme, setLandingOriginalTheme] = useState<ThemeColors | null>(null);
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const dev = isDevSite();
    setIsDev(dev);
  }, []);

  // Sync theme based on route context (Global site vs Isolated Landing Page)
  useEffect(() => {
    if (!isDev) return;

    if (isLanding && landingSlug) {
      // 1. ISOLATED LANDING PAGE MODE
      const storageKey = `attomatti_landing_theme_${landingSlug}`;
      let customOverride: ThemeColors | null = null;

      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.background === "string" && typeof parsed.primary === "string") {
            customOverride = parsed;
          }
        }
      } catch (e) {
        console.error("Failed to read landing theme from localStorage", e);
      }

      // Read original landing theme from dataset if available
      let baseTheme: ThemeColors = DEFAULT_THEME_COLORS;
      const rootEl = document.getElementById("landing-root");
      if (rootEl?.dataset?.landingTheme) {
        try {
          const parsed = JSON.parse(rootEl.dataset.landingTheme);
          baseTheme = {
            background: parsed.background,
            foreground: parsed.foreground,
            primary: parsed.primary,
            primaryForeground: parsed.primaryForeground || getAutoContrastColor(parsed.primary),
            secondary: parsed.secondary,
            secondaryForeground: parsed.secondaryForeground || getAutoContrastColor(parsed.secondary),
            accent: parsed.accent,
            accentForeground: parsed.accentForeground || getAutoContrastColor(parsed.accent),
            muted: parsed.muted
          };
          setLandingOriginalTheme(baseTheme);
        } catch (e) {
          console.error("Failed to parse dataset landingTheme", e);
        }
      }

      const activeTheme = customOverride || baseTheme;
      setColors(activeTheme);
      if (customOverride) {
        applyLandingThemeLive(landingSlug, customOverride);
      }
    } else {
      // 2. GLOBAL WEBSITE MODE
      setLandingOriginalTheme(null);
      const savedGlobal = getSavedDevTheme() || DEFAULT_THEME_COLORS;
      setColors(savedGlobal);
      applyTheme(savedGlobal);
    }
  }, [pathname, isLanding, landingSlug, isDev]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!mounted || !isDev) {
    return null;
  }

  // Check if current colors differ from base reference
  const isCustomized = isLanding
    ? landingOriginalTheme
      ? JSON.stringify(colors) !== JSON.stringify(landingOriginalTheme)
      : false
    : JSON.stringify(colors) !== JSON.stringify(DEFAULT_THEME_COLORS);

  const handleColorChange = (key: ColorKey, value: string) => {
    const updated = { ...colors, [key]: value };
    // Automatically recalculate high-contrast button text unless explicitly locked
    if (key === "primary") {
      updated.primaryForeground = getAutoContrastColor(value);
    } else if (key === "secondary") {
      updated.secondaryForeground = getAutoContrastColor(value);
    } else if (key === "accent") {
      updated.accentForeground = getAutoContrastColor(value);
    }
    setColors(updated);

    if (isLanding && landingSlug) {
      applyLandingThemeLive(landingSlug, updated);
    } else {
      saveDevTheme(updated);
    }
  };

  const handleForegroundChange = (fgKey: FgKey, value: string) => {
    const updated = { ...colors, [fgKey]: value };
    setColors(updated);

    if (isLanding && landingSlug) {
      applyLandingThemeLive(landingSlug, updated);
    } else {
      saveDevTheme(updated);
    }
  };

  const handleApplyPreset = (presetColors: ThemeColors) => {
    setColors(presetColors);

    if (isLanding && landingSlug) {
      applyLandingThemeLive(landingSlug, presetColors);
    } else {
      saveDevTheme(presetColors);
    }
  };

  const handleReset = () => {
    if (isLanding && landingSlug) {
      try {
        localStorage.removeItem(`attomatti_landing_theme_${landingSlug}`);
      } catch (e) {
        console.error("Failed to clear landing theme override", e);
      }
      const targetTheme = landingOriginalTheme || DEFAULT_THEME_COLORS;
      setColors(targetTheme);
      applyLandingThemeLive(landingSlug, targetTheme);
    } else {
      setColors(DEFAULT_THEME_COLORS);
      resetDevTheme();
    }
  };

  const handleCopy = async () => {
    try {
      const payload = {
        background: colors.background,
        foreground: colors.foreground,
        primary: colors.primary,
        primaryForeground: colors.primaryForeground || getAutoContrastColor(colors.primary),
        secondary: colors.secondary,
        secondaryForeground: colors.secondaryForeground || getAutoContrastColor(colors.secondary),
        accent: colors.accent,
        accentForeground: colors.accentForeground || getAutoContrastColor(colors.accent),
        muted: colors.muted
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handleImportSubmit = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJson.trim());
      if (
        typeof parsed.background === "string" &&
        typeof parsed.foreground === "string" &&
        typeof parsed.primary === "string" &&
        typeof parsed.secondary === "string" &&
        typeof parsed.accent === "string" &&
        typeof parsed.muted === "string"
      ) {
        const validated: ThemeColors = {
          background: parsed.background.trim(),
          foreground: parsed.foreground.trim(),
          primary: parsed.primary.trim(),
          primaryForeground: parsed.primaryForeground?.trim() || getAutoContrastColor(parsed.primary),
          secondary: parsed.secondary.trim(),
          secondaryForeground: parsed.secondaryForeground?.trim() || getAutoContrastColor(parsed.secondary),
          accent: parsed.accent.trim(),
          accentForeground: parsed.accentForeground?.trim() || getAutoContrastColor(parsed.accent),
          muted: parsed.muted.trim(),
        };
        setColors(validated);
        if (isLanding && landingSlug) {
          applyLandingThemeLive(landingSlug, validated);
        } else {
          saveDevTheme(validated);
        }
        setShowImport(false);
        setImportJson("");
      } else {
        setImportError("Formato JSON non valido. Mancano uno o più colori fondamentali.");
      }
    } catch {
      setImportError("JSON non valido. Assicurati che sia una sintassi JSON corretta.");
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom-Left) */}
      <div className="fixed bottom-6 left-6 z-50">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Apri personalizzazione colori (solo Dev)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
            "bg-muted/80 backdrop-blur-xl border border-foreground/20 text-foreground hover:border-primary/60 hover:text-primary",
            isOpen && "ring-2 ring-primary border-primary bg-muted text-primary"
          )}
        >
          <Palette size={24} className="transition-transform group-hover:rotate-12" />

          {/* Dev indicator tag */}
          <span
            className={cn(
              "absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md",
              isLanding ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
            )}
          >
            {isLanding ? "LANDING" : "DEV"}
          </span>

          {/* Active custom indicator dot */}
          {isCustomized && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background"
              style={{ backgroundColor: colors.primary }}
              title="Colori personalizzati attivi"
            />
          )}
        </motion.button>
      </div>

      {/* Floating Panel / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 left-6 z-50 w-[92vw] sm:w-[440px] max-h-[82vh] rounded-[2rem] glass backdrop-blur-2xl bg-background/95 border border-foreground/15 shadow-2xl flex flex-col overflow-hidden text-foreground"
          >
            {/* Header */}
            <div className="p-5 border-b border-foreground/10 flex items-center justify-between gap-3 shrink-0 bg-muted/40">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                    isLanding
                      ? "bg-accent/20 text-accent border-accent/30"
                      : "bg-primary/20 text-primary border-primary/30"
                  )}
                >
                  <Palette size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base uppercase tracking-tight truncate">
                      {isLanding ? "Tavolozza Landing" : "Tavolozza Dev"}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                        isLanding
                          ? "bg-accent/20 text-accent border border-accent/30 font-mono"
                          : "bg-primary/20 text-primary border border-primary/30"
                      )}
                    >
                      {isLanding ? `/${landingSlug}` : "Sito Globale"}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 truncate">
                    {isLanding
                      ? "Tavolozza scollegata dal sito • Modifica solo questa landing"
                      : "Cambia i colori del sito in tempo reale"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground shrink-0"
                aria-label="Chiudi pannello"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Presets Bar */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
                    <Palette size={14} className="text-accent" />
                    Temi Scenici Rapidi (6 Preset)
                  </span>
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      {isLanding ? "Ripristina Landing" : "Ripristina Default"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset: ThemePreset) => {
                    const isSelected =
                      JSON.stringify(colors) === JSON.stringify(preset.colors);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset.colors)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                            : "border-foreground/10 hover:border-foreground/25 bg-muted/30 hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-xs font-bold truncate pr-1">
                            {preset.name}
                          </span>
                          {isSelected && <Check size={14} className="text-primary shrink-0" />}
                        </div>
                        {/* Mini Color Dots */}
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.colors.background }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.colors.secondary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Color Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-primary" />
                    Colori Singoli ({COLOR_KEYS.length})
                  </span>
                  <span className="text-[11px] text-foreground/40 font-mono">
                    CSS Variables & Contrast
                  </span>
                </div>

                <div className="space-y-2.5">
                  {COLOR_KEYS.map(({ key, label, desc, fgKey, fgLabel }) => {
                    const currentColor = colors[key] || "#000000";
                    const currentFg = fgKey
                      ? colors[fgKey] || getAutoContrastColor(currentColor)
                      : null;
                    const isDarkBg = getRelativeLuminance(currentColor) <= 0.45;

                    return (
                      <div
                        key={key}
                        className="p-2.5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-2 hover:border-foreground/20 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Native color picker masked inside styled rounded swatch */}
                            <label
                              className="relative w-9 h-9 rounded-xl overflow-hidden cursor-pointer shadow-sm border border-foreground/20 shrink-0 block hover:scale-105 active:scale-95 transition-transform"
                              style={{ backgroundColor: currentColor }}
                              title={`Modifica colore ${label}`}
                            >
                              <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => handleColorChange(key, e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <div className="min-w-0">
                              <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                                <span>{label}</span>
                                <span className="text-[10px] text-foreground/40 font-mono">
                                  --{key}
                                </span>
                              </div>
                              <p className="text-[11px] text-foreground/50 truncate">
                                {desc}
                              </p>
                            </div>
                          </div>

                          {/* Hex Input */}
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={currentColor}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleColorChange(key, val);
                              }}
                              className="w-20 px-2 py-1 bg-background/80 border border-foreground/15 rounded-lg text-xs font-mono uppercase text-center focus:border-primary focus:outline-none"
                              placeholder="#000000"
                              maxLength={7}
                            />
                          </div>
                        </div>

                        {/* Foreground / Button Text Contrast Parameterization */}
                        {fgKey && currentFg && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-foreground/5 text-[11px] text-foreground/70">
                            <div className="flex items-center gap-2">
                              <label
                                className="relative w-5 h-5 rounded-md overflow-hidden cursor-pointer border border-foreground/25 block shadow-xs hover:scale-105 transition-transform"
                                style={{ backgroundColor: currentFg }}
                                title={`Modifica contrasto ${fgLabel}`}
                              >
                                <input
                                  type="color"
                                  value={currentFg}
                                  onChange={(e) => handleForegroundChange(fgKey, e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                              </label>
                              <span className="text-[10px] font-mono opacity-60">
                                {fgLabel}: {currentFg}
                              </span>
                            </div>

                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs transition-colors"
                              style={{
                                backgroundColor: currentColor,
                                color: currentFg
                              }}
                            >
                              Anteprima ({isDarkBg ? "Scuro" : "Chiaro"})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div
                className="p-4 rounded-2xl border text-center transition-colors duration-300"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.muted,
                  color: colors.foreground
                }}
              >
                <div className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-2">
                  Anteprima Live Elementi
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-black shadow-md transition-colors"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryForeground || getAutoContrastColor(colors.primary)
                    }}
                  >
                    Bottone Primario
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.secondaryForeground || getAutoContrastColor(colors.secondary)
                    }}
                  >
                    Badge Secondario
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors shadow-xs"
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.accentForeground || getAutoContrastColor(colors.accent)
                    }}
                  >
                    ★ Accento
                  </span>
                </div>
              </div>

              {/* Import / Paste section */}
              {showImport && (
                <div className="p-3 rounded-2xl bg-muted/40 border border-foreground/15 space-y-2">
                  <label className="text-xs font-bold flex items-center justify-between">
                    <span>Incolla JSON configurazione</span>
                    <button
                      type="button"
                      onClick={() => setShowImport(false)}
                      className="text-foreground/40 hover:text-foreground text-[10px]"
                    >
                      Annulla
                    </button>
                  </label>
                  <textarea
                    rows={4}
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='{"background": "#0f172a", "foreground": "#f8fafc", ...}'
                    className="w-full p-2 text-xs font-mono bg-background border border-foreground/20 rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                  {importError && (
                    <p className="text-xs text-rose-400 font-bold">{importError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleImportSubmit}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Carica ed Applica Colori
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-foreground/10 bg-muted/40 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md",
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copiato negli appunti!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      {isLanding ? "Copia JSON per Admin" : "Copia Configurazione"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowImport(!showImport)}
                  className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-colors text-foreground"
                  title="Incolla o importa configurazione JSON"
                  aria-label="Importa JSON"
                >
                  <ClipboardPaste size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-colors text-foreground"
                  title={isLanding ? "Ripristina tema originale della landing" : "Ripristina tema predefinito del sito"}
                  aria-label="Ripristina default"
                >
                  <RotateCcw size={18} />
                </button>

                {!isLanding && (
                  <button
                    type="button"
                    onClick={() => {
                      document.cookie = "attomatti_dev_access=; path=/; max-age=0; SameSite=Lax";
                      window.location.reload();
                    }}
                    className="p-3 rounded-2xl bg-foreground/5 hover:bg-rose-500/20 hover:text-rose-400 border border-foreground/10 transition-colors text-foreground"
                    title="Blocca di nuovo accesso sito dev (elimina cookie per testare il blocco)"
                    aria-label="Blocca sito dev"
                  >
                    <Lock size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-foreground/40 font-medium">
                <Info size={12} />
                <span>
                  {isLanding
                    ? "Tavolozza isolata per questa landing • Non modifica il tema del sito principale"
                    : "Salvataggio automatico locale • Solo visibile in Dev"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
