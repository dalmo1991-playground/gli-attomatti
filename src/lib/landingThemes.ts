import {
  getAutoContrastColor,
  getRelativeLuminance,
  hexToRgb
} from "@/lib/devTheme";

export interface LandingThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground?: string;
  secondary: string;
  secondaryForeground?: string;
  accent: string;
  accentForeground?: string;
  muted: string;
}

export interface LandingThemePreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  isDark: boolean;
  colors: LandingThemeColors;
}

export const LANDING_THEME_PRESETS: LandingThemePreset[] = [
  {
    id: "default",
    name: "Attomatti Original",
    tagline: "Tema Ufficiale del Sito",
    description: "Sfondo ardesia scuro con rosa caldo, indaco teatrale e accenti ambra.",
    isDark: true,
    colors: {
      background: "#0f172a", // Slate 900
      foreground: "#f8fafc", // Slate 50
      primary: "#fb7185",    // Rose 400
      primaryForeground: "#0f172a", // High-contrast text on Rose 400
      secondary: "#818cf8",  // Indigo 400
      secondaryForeground: "#0f172a",
      accent: "#fbbf24",     // Amber 400
      accentForeground: "#0f172a",
      muted: "#1e293b"       // Slate 800
    }
  },
  {
    id: "gold",
    name: "Gran Galà Oro",
    tagline: "Lusso & Prime Teatrali",
    description: "Nero ossidiana profondo con finiture in oro champagne caldo e velluto cremisi.",
    isDark: true,
    colors: {
      background: "#09090b", // Deep Obsidian Zinc
      foreground: "#fafaf9", // Warm Silk White
      primary: "#d97706",    // Champagne Gold / Amber 600
      primaryForeground: "#ffffff",
      secondary: "#e11d48",  // Royal Crimson
      secondaryForeground: "#ffffff",
      accent: "#fde047",     // Radiant Gold
      accentForeground: "#09090b",
      muted: "#18181b"       // Zinc 900
    }
  },
  {
    id: "theatre_red",
    name: "Rosso Sipario",
    tagline: "Dramma & Passione",
    description: "Profondo velluto bordeaux, rosso scarlatto e riflettori dorati di grande impatto scenico.",
    isDark: true,
    colors: {
      background: "#18060c", // Deep Velvet Bordeaux
      foreground: "#fff1f2", // Rose White
      primary: "#e11d48",    // Velvet Crimson
      primaryForeground: "#ffffff",
      secondary: "#c084fc",  // Spotlight Violet
      secondaryForeground: "#09090b",
      accent: "#fbbf24",     // Warm Stage Gold
      accentForeground: "#09090b",
      muted: "#2a0c16"       // Dark Wine Muted
    }
  },
  {
    id: "cyber_neon",
    name: "Cyber Comedy",
    tagline: "Elettrico & Stand-up",
    description: "Notturno blu elettrico con ciano vivace e fucsia neon per show moderni e dinamici.",
    isDark: true,
    colors: {
      background: "#070b19", // Electric Midnight
      foreground: "#f0fdfa", // Clean Cyan White
      primary: "#06b6d4",    // Electric Cyan
      primaryForeground: "#09090b",
      secondary: "#ec4899",  // Hot Pink
      secondaryForeground: "#ffffff",
      accent: "#a855f7",     // Neon Violet
      accentForeground: "#ffffff",
      muted: "#0f1d36"       // Deep Navy Muted
    }
  },
  {
    id: "emerald",
    name: "Smeraldo Notturno",
    tagline: "Mistero & Noir Elegante",
    description: "Verde pino abissale, smeraldo brillante e accenti ottone vintage.",
    isDark: true,
    colors: {
      background: "#061612", // Dark Forest Abyss
      foreground: "#f0fdf4", // Mint White
      primary: "#10b981",    // Bright Emerald
      primaryForeground: "#09090b",
      secondary: "#38bdf8",  // Sky Aquamarine
      secondaryForeground: "#09090b",
      accent: "#f59e0b",     // Vintage Brass
      accentForeground: "#09090b",
      muted: "#0d2620"       // Forest Muted
    }
  },
  {
    id: "light_chic",
    name: "Luce & Mattinée",
    tagline: "Luminoso & Workshop",
    description: "Tema chiaro e fresco ad altissima leggibilità per corsi, rassegne estive o eventi all'aperto.",
    isDark: false,
    colors: {
      background: "#f8fafc", // Clean Crisp Light
      foreground: "#0f172a", // Charcoal Slate
      primary: "#e11d48",    // Vibrant Ruby
      primaryForeground: "#ffffff",
      secondary: "#4f46e5",  // Royal Indigo
      secondaryForeground: "#ffffff",
      accent: "#d97706",     // Warm Amber
      accentForeground: "#ffffff",
      muted: "#e2e8f0"       // Light Slate Muted
    }
  }
];

export const DEFAULT_THEME_PRESET = LANDING_THEME_PRESETS[0];

/**
 * Resolves the theme colors for a given landing page.
 * Merges presets with any custom user color overrides.
 */
export function getLandingTheme(landing?: any): LandingThemeColors & { presetId: string } {
  if (!landing) {
    return { ...DEFAULT_THEME_PRESET.colors, presetId: DEFAULT_THEME_PRESET.id };
  }

  const rawTheme = landing.theme || {};
  const presetId = rawTheme.preset || (landing.theme_color === "gold" ? "gold" : "default");
  const matchedPreset =
    LANDING_THEME_PRESETS.find((p) => p.id === presetId) || DEFAULT_THEME_PRESET;

  const primary = rawTheme.primary?.trim() || matchedPreset.colors.primary;
  const secondary = rawTheme.secondary?.trim() || matchedPreset.colors.secondary;
  const accent = rawTheme.accent?.trim() || matchedPreset.colors.accent;

  return {
    presetId: matchedPreset.id,
    background: rawTheme.background?.trim() || matchedPreset.colors.background,
    foreground: rawTheme.foreground?.trim() || matchedPreset.colors.foreground,
    primary,
    primaryForeground:
      rawTheme.primaryForeground?.trim() ||
      matchedPreset.colors.primaryForeground ||
      getAutoContrastColor(primary),
    secondary,
    secondaryForeground:
      rawTheme.secondaryForeground?.trim() ||
      matchedPreset.colors.secondaryForeground ||
      getAutoContrastColor(secondary),
    accent,
    accentForeground:
      rawTheme.accentForeground?.trim() ||
      matchedPreset.colors.accentForeground ||
      getAutoContrastColor(accent),
    muted: rawTheme.muted?.trim() || matchedPreset.colors.muted
  };
}

/**
 * Converts resolved landing theme colors into inline CSS variable styles.
 */
export function getLandingThemeStyles(theme: LandingThemeColors): React.CSSProperties {
  const primaryFg = theme.primaryForeground || getAutoContrastColor(theme.primary);
  const secondaryFg = theme.secondaryForeground || getAutoContrastColor(theme.secondary);
  const accentFg = theme.accentForeground || getAutoContrastColor(theme.accent);

  const styles: Record<string, string> = {
    "--background": theme.background,
    "--foreground": theme.foreground,
    "--primary": theme.primary,
    "--primary-foreground": primaryFg,
    "--secondary": theme.secondary,
    "--secondary-foreground": secondaryFg,
    "--accent": theme.accent,
    "--accent-foreground": accentFg,
    "--muted": theme.muted,
    backgroundColor: theme.background,
    color: theme.foreground
  };

  const primaryRgb = hexToRgb(theme.primary);
  if (primaryRgb) styles["--primary-rgb"] = primaryRgb;

  const secondaryRgb = hexToRgb(theme.secondary);
  if (secondaryRgb) styles["--secondary-rgb"] = secondaryRgb;

  const accentRgb = hexToRgb(theme.accent);
  if (accentRgb) styles["--accent-rgb"] = accentRgb;

  return styles as React.CSSProperties;
}
