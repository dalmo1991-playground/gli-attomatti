"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Check,
  Copy,
  RotateCcw,
  X,
  Sparkles,
  ClipboardPaste,
  SlidersHorizontal,
  ChevronDown,
  Info
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
  resetDevTheme
} from "@/lib/devTheme";
import { cn } from "@/lib/utils";

const COLOR_KEYS: Array<{
  key: keyof ThemeColors & string;
  label: string;
  desc: string;
}> = [
  { key: "background", label: "Sfondo", desc: "Canvas principale del sito" },
  { key: "foreground", label: "Testo", desc: "Tipografia e contrasto primario" },
  { key: "primary", label: "Primario", desc: "Pulsanti CTA, bordi e highlight" },
  { key: "secondary", label: "Secondario", desc: "Tag, sfumature e bagliori" },
  { key: "accent", label: "Accento", desc: "Dettagli scenici, stelle e callout" },
  { key: "muted", label: "Superfici", desc: "Sfondo schede e container" },
];

export function DevThemeCustomizer() {
  const [mounted, setMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME_COLORS);
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const dev = isDevSite();
    setIsDev(dev);

    if (dev) {
      const saved = getSavedDevTheme();
      if (saved) {
        setColors(saved);
        applyTheme(saved);
      }
    }
  }, []);

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

  const isCustomized = JSON.stringify(colors) !== JSON.stringify(DEFAULT_THEME_COLORS);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const updated = { ...colors, [key]: value };
    setColors(updated);
    saveDevTheme(updated);
  };

  const handleApplyPreset = (presetColors: ThemeColors) => {
    setColors(presetColors);
    saveDevTheme(presetColors);
  };

  const handleReset = () => {
    setColors(DEFAULT_THEME_COLORS);
    resetDevTheme();
  };

  const handleCopy = async () => {
    try {
      const payload = JSON.stringify(colors, null, 2);
      await navigator.clipboard.writeText(payload);
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
          secondary: parsed.secondary.trim(),
          accent: parsed.accent.trim(),
          muted: parsed.muted.trim(),
        };
        setColors(validated);
        saveDevTheme(validated);
        setShowImport(false);
        setImportJson("");
      } else {
        setImportError("Formato JSON non valido. Mancano uno o più colori.");
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
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-primary text-white rounded-full shadow-md">
            DEV
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Palette size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base uppercase tracking-tight">Tavolozza Dev</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent uppercase tracking-wider">
                      Live Preview
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60">
                    Cambia i colori del sito in tempo reale
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground"
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
                    <Sparkles size={14} className="text-accent" />
                    Temi Scenici Rapidi
                  </span>
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      Default
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
                            ? "border-primary bg-primary/10 shadow-sm"
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
                    CSS Variables
                  </span>
                </div>

                <div className="space-y-2.5">
                  {COLOR_KEYS.map(({ key, label, desc }) => {
                    const currentColor = colors[key] || "#000000";
                    return (
                      <div
                        key={key}
                        className="p-2.5 rounded-2xl bg-muted/20 border border-foreground/10 flex items-center justify-between gap-3 hover:border-foreground/20 transition-colors"
                      >
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
                    className="px-3 py-1.5 rounded-full text-xs font-black shadow-md"
                    style={{
                      backgroundColor: colors.primary,
                      color: "#ffffff"
                    }}
                  >
                    Bottone Primario
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: colors.secondary,
                      color: "#ffffff"
                    }}
                  >
                    Badge Secondario
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: colors.accent }}
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
                    className="w-full py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 transition-all"
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
                      : "bg-primary text-white hover:bg-primary/90"
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
                      Copia Configurazione
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
                  title="Ripristina tema predefinito"
                  aria-label="Ripristina default"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-foreground/40 font-medium">
                <Info size={12} />
                <span>Salvataggio automatico locale • Solo visibile in Dev</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
