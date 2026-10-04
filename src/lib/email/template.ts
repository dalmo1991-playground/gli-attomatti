import {
  LANDING_THEME_PRESETS,
  DEFAULT_THEME_PRESET,
  getLandingTheme,
  LandingThemeColors
} from "@/lib/landingThemes";
import {
  EmailBlock,
  convertLegacyToBlocks,
  renderEmailBlocksHtml,
  renderEmailBlocksText,
  replaceVars
} from "./blocks";

export interface EmailFieldMapping {
  recipient_email_path?: string; // e.g. "pippo" or "customer.email"
  recipient_name_path?: string;  // e.g. "customer.first_name"
  variables_mapping?: Record<string, string>; // e.g. { "event_title": "ticket.title" }
  sample_payload_json?: string; // Raw sample JSON payload pasted by the user
}

export interface EmailSenderProfile {
  from_name?: string;
  from_email?: string;
  reply_to?: string;
}

export interface EmailSubcaseConfig {
  id: string; // e.g. "cineforum-1"
  name: string; // e.g. "Serata 1 - Monsieur Hulot"
  custom_fields?: Record<string, string>; // e.g. { "event_title": "...", "event_date": "..." }
  sender_profile?: EmailSenderProfile;
}

export interface EmailTemplateConfig {
  id?: string;
  name?: string;
  enabled?: boolean;
  subject?: string;
  preheader?: string;
  theme?: string; // preset id like 'default', 'gold', or landing slug
  customColors?: Partial<LandingThemeColors>;
  blocks?: EmailBlock[];
  field_mapping?: EmailFieldMapping;
  subcases?: EmailSubcaseConfig[];
  sender_profile?: EmailSenderProfile;

  // Legacy fields preserved for backward compatibility
  badge?: string;
  heading?: string;
  body?: string;
  cta_label?: string;
  cta_url?: string;
  event_date?: string;
  event_location?: string;
}

export interface EmailSettingsConfig {
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  footer_text?: string;
  privacy_note?: string;
}

/**
 * Replaces {{key}} variables with values from the variables record.
 */
export function replaceVariables(text: string = "", vars: Record<string, string> = {}): string {
  return replaceVars(text, vars);
}

/**
 * Resolves theme colors for the email based on the configured theme name/landing slug,
 * merged with any custom color overrides specified in template.customColors.
 */
export function resolveEmailTheme(
  themeIdOrSlug: string = "default",
  landings: any[] = [],
  customOverrides?: Partial<LandingThemeColors>
): LandingThemeColors {
  let baseColors: LandingThemeColors = DEFAULT_THEME_PRESET.colors;

  // 1. Check if theme matches a landing slug or id
  if (Array.isArray(landings) && landings.length > 0) {
    const matchedLanding = landings.find((l) => l.slug === themeIdOrSlug || l.id === themeIdOrSlug);
    if (matchedLanding) {
      baseColors = getLandingTheme(matchedLanding);
    }
  }

  // 2. Check if theme matches a preset ID
  if (baseColors === DEFAULT_THEME_PRESET.colors) {
    const matchedPreset = LANDING_THEME_PRESETS.find((p) => p.id === themeIdOrSlug);
    if (matchedPreset) {
      baseColors = matchedPreset.colors;
    }
  }

  // 3. Merge custom color overrides if specified
  if (customOverrides && typeof customOverrides === "object") {
    return {
      background: customOverrides.background?.trim() || baseColors.background,
      foreground: customOverrides.foreground?.trim() || baseColors.foreground,
      primary: customOverrides.primary?.trim() || baseColors.primary,
      primaryForeground: customOverrides.primaryForeground?.trim() || baseColors.primaryForeground,
      secondary: customOverrides.secondary?.trim() || baseColors.secondary,
      secondaryForeground: customOverrides.secondaryForeground?.trim() || baseColors.secondaryForeground,
      accent: customOverrides.accent?.trim() || baseColors.accent,
      accentForeground: customOverrides.accentForeground?.trim() || baseColors.accentForeground,
      muted: customOverrides.muted?.trim() || baseColors.muted
    };
  }

  return baseColors;
}

/**
 * Renders a complete, bulletproof HTML email using component blocks.
 */
export function renderEmailHtml({
  template,
  variables = {},
  rawJsonObj,
  themeColors,
  settings
}: {
  template: EmailTemplateConfig;
  variables?: Record<string, string>;
  rawJsonObj?: any;
  themeColors?: LandingThemeColors;
  settings?: EmailSettingsConfig;
}): string {
  const blocks = convertLegacyToBlocks(template);

  // If settings provide footer text and block doesn't override, update footer
  const blocksWithSettings = blocks.map((b) => {
    if (b.type === "footer") {
      return {
        ...b,
        legal_text: b.legal_text || settings?.footer_text,
        privacy_note: b.privacy_note || settings?.privacy_note
      };
    }
    return b;
  });

  return renderEmailBlocksHtml({
    blocks: blocksWithSettings,
    variables,
    rawJsonObj,
    themeColors,
    subject: template.subject || "Notifica da Gli Attomatti",
    preheader: template.preheader || ""
  });
}

/**
 * Renders a plain-text alternative of the email from the blocks.
 */
export function renderEmailText({
  template,
  variables = {},
  rawJsonObj,
  settings
}: {
  template: EmailTemplateConfig;
  variables?: Record<string, string>;
  rawJsonObj?: any;
  settings?: EmailSettingsConfig;
}): string {
  const blocks = convertLegacyToBlocks(template);
  return renderEmailBlocksText({
    blocks,
    variables,
    rawJsonObj
  });
}
