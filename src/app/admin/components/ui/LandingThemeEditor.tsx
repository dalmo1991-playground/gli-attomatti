"use client";

import React, { useState } from "react";
import {
  Palette,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Layers,
  Eye,
  Star,
  Ticket,
  ClipboardPaste,
  SlidersHorizontal,
  Info
} from "lucide-react";
import {
  LANDING_THEME_PRESETS,
  LandingThemePreset,
  getLandingTheme,
  LandingThemeColors
} from "@/lib/landingThemes";
import { getAutoContrastColor, getRelativeLuminance } from "@/lib/devTheme";
import { cn } from "@/lib/utils";

interface LandingThemeEditorProps {
  landing: any;
  onChange: (updatedTheme: LandingThemeColors & { preset: string }) => void;
}

type ColorKey = "background" | "foreground" | "primary" | "secondary" | "accent" | "muted";
type FgKey = "primaryForeground" | "secondaryForeground" | "accentForeground";

interface ColorItemConfig {
  key: ColorKey;
  label: string;
  desc: string;
  roleHint: string;
  fgKey?: FgKey;
  fgLabel?: string;
}

const COLOR_FIELDS: ColorItemConfig[] = [
  {
    key: "background",
    label: "Sfondo Pagina",
    desc: "Colore di sfondo principale della landing",
    roleHint: "Body, sezioni hero e navbar"
  },
  {
    key: "foreground",
    label: "Testo Principale",
    desc: "Colore per titoli, sottotitoli e testi",
    roleHint: "Tipografia e icone generiche"
  },
  {
    key: "primary",
    label: "Colore Primario",
    desc: "Pulsanti di acquisto biglietti e badge hero",
    roleHint: "CTA principali e callout",
    fgKey: "primaryForeground",
    fgLabel: "Testo su Primario"
  },
  {
    key: "secondary",
    label: "Colore Secondario",
    desc: "Sfondi secondari e tag informativi",
    roleHint: "Tag date, orari e dettagli",
    fgKey: "secondaryForeground",
    fgLabel: "Testo su Secondario"
  },
  {
    key: "accent",
    label: "Colore Accento",
    desc: "Stelle recensioni, citazioni e riflettori",
    roleHint: "Elementi decorativi e rating",
    fgKey: "accentForeground",
    fgLabel: "Testo su Accento"
  },
  {
    key: "muted",
    label: "Sfondo Card & Box",
    desc: "Colore per le card evento, faq e sezioni alternate",
    roleHint: "Riquadri e pannelli neutri"
  }
];

export function LandingThemeEditor({ landing, onChange }: LandingThemeEditorProps) {
  const currentTheme = getLandingTheme(landing);
  const matchedPreset =
    LANDING_THEME_PRESETS.find((p) => p.id === currentTheme.presetId) ||
    LANDING_THEME_PRESETS[0];

  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Check if any color has been customized compared to the matched preset
  const isCustomized = (Object.keys(matchedPreset.colors) as Array<keyof LandingThemeColors>).some(
    (key) => {
      const presetVal = matchedPreset.colors[key];
      const currentVal = currentTheme[key];
      if (!presetVal && !currentVal) return false;
      return (presetVal || "").toLowerCase() !== (currentVal || "").toLowerCase();
    }
  );

  const handleSelectPreset = (preset: LandingThemePreset) => {
    onChange({
      preset: preset.id,
      ...preset.colors
    });
  };

  const handleColorChange = (key: ColorKey, hex: string) => {
    const updated: LandingThemeColors & { preset: string } = {
      preset: currentTheme.presetId,
      background: currentTheme.background,
      foreground: currentTheme.foreground,
      primary: currentTheme.primary,
      primaryForeground: currentTheme.primaryForeground,
      secondary: currentTheme.secondary,
      secondaryForeground: currentTheme.secondaryForeground,
      accent: currentTheme.accent,
      accentForeground: currentTheme.accentForeground,
      muted: currentTheme.muted,
      [key]: hex
    };

    // Auto-recalculate button text contrast when primary/secondary/accent change
    if (key === "primary") {
      updated.primaryForeground = getAutoContrastColor(hex);
    } else if (key === "secondary") {
      updated.secondaryForeground = getAutoContrastColor(hex);
    } else if (key === "accent") {
      updated.accentForeground = getAutoContrastColor(hex);
    }

    onChange(updated);
  };

  const handleForegroundChange = (fgKey: FgKey, hex: string) => {
    onChange({
      preset: currentTheme.presetId,
      background: currentTheme.background,
      foreground: currentTheme.foreground,
      primary: currentTheme.primary,
      primaryForeground: currentTheme.primaryForeground,
      secondary: currentTheme.secondary,
      secondaryForeground: currentTheme.secondaryForeground,
      accent: currentTheme.accent,
      accentForeground: currentTheme.accentForeground,
      muted: currentTheme.muted,
      [fgKey]: hex
    });
  };

  const handleResetToPreset = () => {
    onChange({
      preset: matchedPreset.id,
      ...matchedPreset.colors
    });
  };

  const handleCopyJson = async () => {
    try {
      const payload = {
        background: currentTheme.background,
        foreground: currentTheme.foreground,
        primary: currentTheme.primary,
        primaryForeground: currentTheme.primaryForeground || getAutoContrastColor(currentTheme.primary),
        secondary: currentTheme.secondary,
        secondaryForeground: currentTheme.secondaryForeground || getAutoContrastColor(currentTheme.secondary),
        accent: currentTheme.accent,
        accentForeground: currentTheme.accentForeground || getAutoContrastColor(currentTheme.accent),
        muted: currentTheme.muted
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
        onChange({
          preset: parsed.preset || currentTheme.presetId,
          background: parsed.background.trim(),
          foreground: parsed.foreground.trim(),
          primary: parsed.primary.trim(),
          primaryForeground: parsed.primaryForeground?.trim() || getAutoContrastColor(parsed.primary),
          secondary: parsed.secondary.trim(),
          secondaryForeground: parsed.secondaryForeground?.trim() || getAutoContrastColor(parsed.secondary),
          accent: parsed.accent.trim(),
          accentForeground: parsed.accentForeground?.trim() || getAutoContrastColor(parsed.accent),
          muted: parsed.muted.trim()
        });
        setShowImport(false);
        setImportJson("");
      } else {
        setImportError("Formato JSON non valido. Mancano uno o più colori fondamentali (background, foreground, primary, secondary, accent, muted).");
      }
    } catch {
      setImportError("JSON non valido. Assicurati di incollare una sintassi JSON corretta (es. dalla Tavolozza Dev).");
    }
  };

  return (
    <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-foreground/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Palette size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Tema Grafico & Palette Colori
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] font-black uppercase tracking-wider">
                {matchedPreset.name} {isCustomized ? "(Personalizzato)" : ""}
              </span>
            </div>
            <p className="text-[11px] text-foreground/50 mt-0.5">
              Stessa tavolozza usata nell&apos;ambiente Dev: 6 temi teatrali, contrasto bottoni personalizzabile ed import/export JSON.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/80 hover:text-foreground text-xs font-bold transition-all border border-foreground/10"
            title="Copia configurazione JSON per usarla nella Tavolozza Dev o su un'altra landing"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? "Copiato!" : "Copia JSON"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/80 hover:text-foreground text-xs font-bold transition-all border border-foreground/10"
            title="Incolla configurazione JSON dalla Tavolozza Dev"
          >
            <ClipboardPaste size={13} />
            <span>Importa JSON</span>
          </button>

          {isCustomized && (
            <button
              type="button"
              onClick={handleResetToPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-foreground text-xs font-bold transition-all border border-foreground/10"
              title="Ripristina i colori originali di questo preset"
            >
              <RotateCcw size={13} />
              <span>Ripristina preset</span>
            </button>
          )}
        </div>
      </div>

      {/* JSON Import Section */}
      {showImport && (
        <div className="p-4 rounded-2xl bg-muted/30 border border-foreground/15 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ClipboardPaste size={14} className="text-primary" />
              Incolla JSON configurazione dalla Tavolozza Dev
            </span>
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="text-foreground/40 hover:text-foreground text-[10px]"
            >
              Chiudi
            </button>
          </div>
          <textarea
            rows={4}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='{"background": "#0f172a", "foreground": "#f8fafc", "primary": "#fb7185", "primaryForeground": "#0f172a", ...}'
            className="w-full p-2.5 text-xs font-mono bg-background border border-foreground/20 rounded-xl focus:border-primary focus:outline-none resize-none"
          />
          {importError && (
            <p className="text-xs text-rose-400 font-bold">{importError}</p>
          )}
          <button
            type="button"
            onClick={handleImportSubmit}
            className="w-full py-2 bg-primary text-primary-foreground font-black rounded-xl text-xs hover:bg-primary/90 transition-all shadow-sm"
          >
            Carica ed Applica Colori
          </button>
        </div>
      )}

      {/* 1. Theme Presets Carousel / Grid */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" />
          <span>Preset Grafici Disponibili (6 Temi)</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {LANDING_THEME_PRESETS.map((preset) => {
            const isSelected = currentTheme.presetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between group overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/30"
                    : "border-foreground/10 bg-background/50 hover:bg-background/80 hover:border-foreground/20"
                )}
              >
                {/* Background mini swatch glow */}
                <div
                  className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl opacity-30 pointer-events-none"
                  style={{ backgroundColor: preset.colors.primary }}
                />

                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground truncate block">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-foreground/50 line-clamp-1">
                    {preset.tagline}
                  </p>
                </div>

                {/* Swatch palette pills */}
                <div className="mt-3 pt-2.5 border-t border-foreground/5 flex items-center gap-1 relative z-10">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: preset.colors.background }}
                    title={`Sfondo: ${preset.colors.background}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: preset.colors.primary }}
                    title={`Primario: ${preset.colors.primary}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: preset.colors.secondary }}
                    title={`Secondario: ${preset.colors.secondary}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: preset.colors.accent }}
                    title={`Accento: ${preset.colors.accent}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: preset.colors.muted }}
                    title={`Muted: ${preset.colors.muted}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Live Theme Preview Box */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
          <Eye size={13} className="text-primary" />
          <span>Anteprima Visiva in Tempo Reale</span>
        </label>

        <div
          className="p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-inner"
          style={{
            backgroundColor: currentTheme.background,
            color: currentTheme.foreground,
            borderColor: `${currentTheme.foreground}20`
          }}
        >
          {/* Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: currentTheme.primary }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: `${currentTheme.primary}25`,
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}40`
                  }}
                >
                  Anteprima Live
                </span>
                <span
                  className="flex items-center gap-1 text-[11px] font-bold"
                  style={{ color: currentTheme.accent }}
                >
                  <Star size={12} fill="currentColor" />
                  <span>Spettacolo Teatrale</span>
                </span>
              </div>

              <h5
                className="text-base sm:text-lg font-black tracking-tight"
                style={{ color: currentTheme.foreground }}
              >
                {landing.title || "Titolo della Tua Landing Page"}
              </h5>

              <p
                className="text-xs opacity-70 line-clamp-2"
                style={{ color: currentTheme.foreground }}
              >
                Questo riquadro mostra esattamente come interagiranno lo sfondo, i testi, le card ed i pulsanti d&apos;azione della pagina.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
              <div
                className="px-3 py-2 rounded-xl text-xs font-bold border"
                style={{
                  backgroundColor: currentTheme.muted,
                  color: currentTheme.foreground,
                  borderColor: `${currentTheme.foreground}15`
                }}
              >
                <span
                  style={{
                    color: currentTheme.secondaryForeground || getAutoContrastColor(currentTheme.secondary),
                    backgroundColor: currentTheme.secondary,
                    padding: "2px 6px",
                    borderRadius: "6px"
                  }}
                >
                  CHF 25.-
                </span>{" "}
                • Sabato 20:00
              </div>

              <div
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: currentTheme.primary,
                  color: currentTheme.primaryForeground || getAutoContrastColor(currentTheme.primary)
                }}
              >
                <Ticket size={13} />
                <span>Acquista</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Individual Color Fine-Tuning */}
      <div className="space-y-3 pt-2 border-t border-foreground/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
            <SlidersHorizontal size={13} className="text-primary" />
            <span>Personalizzazione Singoli Colori ({COLOR_FIELDS.length})</span>
          </label>
          <span className="text-[11px] text-foreground/40 font-mono">
            CSS Variables & Contrast
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {COLOR_FIELDS.map((field) => {
            const currentColor = currentTheme[field.key] || "#000000";
            const currentFg = field.fgKey
              ? currentTheme[field.fgKey] || getAutoContrastColor(currentColor)
              : null;
            const isDarkBg = getRelativeLuminance(currentColor) <= 0.45;

            return (
              <div
                key={field.key}
                className="p-3.5 rounded-2xl border border-foreground/10 bg-background/40 hover:bg-background/70 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {field.label}
                    </span>
                    <span className="text-[10px] text-foreground/50 block">
                      {field.roleHint}
                    </span>
                  </div>

                  {/* Native Color Picker trigger */}
                  <label className="relative cursor-pointer shrink-0">
                    <input
                      type="color"
                      value={currentColor.startsWith("#") ? currentColor : "#000000"}
                      onChange={(e) => handleColorChange(field.key, e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className="w-8 h-8 rounded-xl border border-black/20 shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: currentColor }}
                      title="Clicca per aprire la tavolozza colori"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={currentColor}
                      onChange={(e) => handleColorChange(field.key, e.target.value)}
                      placeholder="#000000"
                      className="w-full px-3 py-1.5 rounded-lg bg-background border border-foreground/10 text-xs font-mono font-bold text-foreground focus:border-primary outline-none uppercase"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-foreground/40 shrink-0">
                    var(--{field.key})
                  </span>
                </div>

                {/* Button Contrast / Foreground Text Picker */}
                {field.fgKey && currentFg && (
                  <div className="flex items-center justify-between pt-2 border-t border-foreground/5 text-[11px] text-foreground/70">
                    <div className="flex items-center gap-2">
                      <label
                        className="relative w-5 h-5 rounded-md overflow-hidden cursor-pointer border border-foreground/25 block shadow-xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: currentFg }}
                        title={`Modifica contrasto ${field.fgLabel}`}
                      >
                        <input
                          type="color"
                          value={currentFg}
                          onChange={(e) => handleForegroundChange(field.fgKey!, e.target.value)}
                          className="sr-only"
                        />
                      </label>
                      <span className="text-[10px] font-mono opacity-60">
                        {field.fgLabel}
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
    </div>
  );
}
