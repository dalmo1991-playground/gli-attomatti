export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  colors: ThemeColors;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  background: "#0f172a", // Slate 900
  foreground: "#f8fafc", // Slate 50
  primary: "#fb7185",    // Rose 400
  secondary: "#818cf8",  // Indigo 400
  accent: "#fbbf24",     // Amber 400
  muted: "#1e293b",      // Slate 800
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "Attomatti Original",
    tagline: "Ardesia, rosa caldo e indaco (Default)",
    colors: { ...DEFAULT_THEME_COLORS }
  },
  {
    id: "gold",
    name: "Gran Galà Oro",
    tagline: "Ossidiana, oro champagne e cremisi",
    colors: {
      background: "#09090b",
      foreground: "#fafaf9",
      primary: "#d97706",
      secondary: "#e11d48",
      accent: "#fde047",
      muted: "#18181b"
    }
  },
  {
    id: "theatre_red",
    name: "Rosso Sipario",
    tagline: "Velluto bordeaux e scarlatto teatrale",
    colors: {
      background: "#18060c",
      foreground: "#fff1f2",
      primary: "#e11d48",
      secondary: "#c084fc",
      accent: "#fbbf24",
      muted: "#2a0c16"
    }
  },
  {
    id: "cyber_neon",
    name: "Cyber Comedy",
    tagline: "Blu elettrico, ciano e fucsia stand-up",
    colors: {
      background: "#070b19",
      foreground: "#f0fdfa",
      primary: "#06b6d4",
      secondary: "#ec4899",
      accent: "#a855f7",
      muted: "#0f1d36"
    }
  },
  {
    id: "emerald",
    name: "Smeraldo Notturno",
    tagline: "Foresta profonda, smeraldo e ottone vintage",
    colors: {
      background: "#061612",
      foreground: "#f0fdf4",
      primary: "#10b981",
      secondary: "#38bdf8",
      accent: "#f59e0b",
      muted: "#0d2620"
    }
  },
  {
    id: "light_chic",
    name: "Luce & Mattinée",
    tagline: "Tema chiaro e fresco ad alta leggibilità",
    colors: {
      background: "#f8fafc",
      foreground: "#0f172a",
      primary: "#e11d48",
      secondary: "#4f46e5",
      accent: "#d97706",
      muted: "#e2e8f0"
    }
  }
];

export const STORAGE_KEY = "attomatti_dev_custom_theme";

/**
 * Converts a 3 or 6 digit hex color string to RGB comma-separated values (e.g. "251, 113, 133").
 */
export function hexToRgb(hex: string): string | null {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return `${r}, ${g}, ${b}`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return `${r}, ${g}, ${b}`;
  }
  return null;
}

/**
 * Checks if the current environment is a dev site (localhost, preview deployment, or ?dev_theme=1).
 * Strictly returns false on live production domain (gliattomatti.ch).
 */
export function isDevSite(): boolean {
  // If executed on server side
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_IS_DEV_SITE === "true" || process.env.NODE_ENV !== "production";
  }

  const host = window.location.hostname;

  // 1. ABSOLUTE HARD BLOCK: Never under any circumstance run on the production domains
  if (
    host === "gliattomatti.ch" ||
    host === "www.gliattomatti.ch" ||
    host.endsWith(".gliattomatti.ch")
  ) {
    return false;
  }

  // 2. Build-time flag check (evaluated at build/deploy time on Vercel)
  if (process.env.NEXT_PUBLIC_IS_DEV_SITE === "false") {
    return false;
  }

  // 3. Localhost & development runtime
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_IS_DEV_SITE === "true"
  ) {
    return true;
  }

  // 4. Vercel preview environments (dev branch or PR previews)
  if (
    host.endsWith(".vercel.app") &&
    (host.includes("-dev") || host.includes("git-dev") || !host.includes("production"))
  ) {
    return true;
  }

  return false;
}

/**
 * Applies the given theme colors to the document root element CSS custom properties.
 */
export function applyTheme(colors: ThemeColors): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--muted", colors.muted);

  const primaryRgb = hexToRgb(colors.primary);
  if (primaryRgb) {
    root.style.setProperty("--primary-rgb", primaryRgb);
  }
}

/**
 * Saves custom theme colors to localStorage and applies them live.
 */
export function saveDevTheme(colors: ThemeColors): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error("Failed to save dev theme to localStorage", e);
  }
  applyTheme(colors);
}

/**
 * Retrieves saved custom theme colors from localStorage, or null if none saved.
 */
export function getSavedDevTheme(): ThemeColors | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.background === "string" &&
      typeof parsed.foreground === "string" &&
      typeof parsed.primary === "string" &&
      typeof parsed.secondary === "string" &&
      typeof parsed.accent === "string" &&
      typeof parsed.muted === "string"
    ) {
      return parsed as ThemeColors;
    }
  } catch (e) {
    console.error("Failed to parse dev theme from localStorage", e);
  }
  return null;
}

/**
 * Removes custom theme colors from localStorage and resets document styles to default.
 */
export function resetDevTheme(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear dev theme from localStorage", e);
  }
  applyTheme(DEFAULT_THEME_COLORS);
}
