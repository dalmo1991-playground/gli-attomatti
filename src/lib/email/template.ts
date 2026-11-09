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

export interface EmailUtmConfig {
  enabled?: boolean;
  utm_source?: string;    // e.g. "newsletter" or "email"
  utm_medium?: string;    // e.g. "email"
  utm_campaign?: string;  // e.g. "la-regione-2026" or "{{template_id}}"
  utm_content?: string;   // e.g. "link" or "{{event_slug}}"
  utm_term?: string;      // e.g. "gli-attomatti"
  custom_params?: Record<string, string>; // any extra parameters e.g. { ref: "newsletter" }
  apply_to_external?: boolean; // false = only internal / gliattomatti.ch links (default)
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
  utm?: EmailUtmConfig;

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
  test_recipient?: string;
  dlq_alert_email?: string;
  dlq_alert_enabled?: boolean;
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
 * Injects configured UTM tracking parameters into an HTML string by wrapping <a> tags.
 * Preserves anchor fragments (#...), existing query parameters, and ignores mailto:, tel:, #.
 */
export function applyUtmTrackingToHtml({
  html,
  utm,
  variables = {},
  rawJsonObj,
  templateId = "",
  baseUrl = "https://gliattomatti.ch"
}: {
  html: string;
  utm?: EmailUtmConfig;
  variables?: Record<string, string>;
  rawJsonObj?: any;
  templateId?: string;
  baseUrl?: string;
}): string {
  if (!html || !utm || utm.enabled === false) {
    return html;
  }

  const r = (txt?: string) => {
    if (!txt) return "";
    const varsWithDefaults = {
      template_id: templateId,
      template: templateId,
      ...variables
    };
    return replaceVars(txt, varsWithDefaults, rawJsonObj).trim();
  };

  const paramsToAppend: [string, string][] = [];

  const source = r(utm.utm_source);
  if (source) paramsToAppend.push(["utm_source", source]);

  const medium = r(utm.utm_medium);
  if (medium) paramsToAppend.push(["utm_medium", medium]);

  const campaign = r(utm.utm_campaign);
  if (campaign) paramsToAppend.push(["utm_campaign", campaign]);

  const content = r(utm.utm_content);
  if (content) paramsToAppend.push(["utm_content", content]);

  const term = r(utm.utm_term);
  if (term) paramsToAppend.push(["utm_term", term]);

  if (utm.custom_params && typeof utm.custom_params === "object") {
    for (const [k, v] of Object.entries(utm.custom_params)) {
      const cleanKey = k.trim();
      const cleanVal = r(v);
      if (cleanKey && cleanVal) {
        paramsToAppend.push([cleanKey, cleanVal]);
      }
    }
  }

  if (paramsToAppend.length === 0) {
    return html;
  }

  // Determine site base host to distinguish internal links from third-party links
  let siteHost = "gliattomatti.ch";
  try {
    const parsedBase = new URL(baseUrl);
    siteHost = parsedBase.host.toLowerCase();
  } catch {
    siteHost = "gliattomatti.ch";
  }

  const applyToExternal = Boolean(utm.apply_to_external);

  // Helper to add query params to a single URL string
  const decorateUrl = (rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") || trimmed.startsWith("javascript:")) {
      return rawUrl;
    }

    // Ignore ics downloads or calendar intent links if not desired
    if (trimmed.includes(".ics") || trimmed.includes("calendar.google.com") || trimmed.includes("outlook.live.com")) {
      return rawUrl;
    }

    const isRelative = trimmed.startsWith("/");
    let isInternal = isRelative;

    if (!isRelative) {
      try {
        const u = new URL(trimmed);
        const host = u.host.toLowerCase();
        if (host === siteHost || host.endsWith(`.${siteHost}`)) {
          isInternal = true;
        }
      } catch {
        return rawUrl;
      }
    }

    if (!isInternal && !applyToExternal) {
      return rawUrl;
    }

    // Split URL and hash fragment
    const hashIndex = trimmed.indexOf("#");
    const beforeHash = hashIndex !== -1 ? trimmed.slice(0, hashIndex) : trimmed;
    const hash = hashIndex !== -1 ? trimmed.slice(hashIndex) : "";

    const separator = beforeHash.includes("?") ? "&" : "?";
    const queryString = paramsToAppend
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    return `${beforeHash}${separator}${queryString}${hash}`;
  };

  // Replace href attributes in HTML
  return html.replace(/\bhref\s*=\s*(["'])([^"']+)\1/gi, (match, quote, url) => {
    const decorated = decorateUrl(url);
    return `href=${quote}${decorated}${quote}`;
  });
}

/**
 * Injects configured UTM tracking parameters into plain text links.
 */
export function applyUtmTrackingToText({
  text,
  utm,
  variables = {},
  rawJsonObj,
  templateId = "",
  baseUrl = "https://gliattomatti.ch"
}: {
  text: string;
  utm?: EmailUtmConfig;
  variables?: Record<string, string>;
  rawJsonObj?: any;
  templateId?: string;
  baseUrl?: string;
}): string {
  if (!text || !utm || utm.enabled === false) {
    return text;
  }

  const r = (txt?: string) => {
    if (!txt) return "";
    const varsWithDefaults = {
      template_id: templateId,
      template: templateId,
      ...variables
    };
    return replaceVars(txt, varsWithDefaults, rawJsonObj).trim();
  };

  const paramsToAppend: [string, string][] = [];
  const source = r(utm.utm_source);
  if (source) paramsToAppend.push(["utm_source", source]);
  const medium = r(utm.utm_medium);
  if (medium) paramsToAppend.push(["utm_medium", medium]);
  const campaign = r(utm.utm_campaign);
  if (campaign) paramsToAppend.push(["utm_campaign", campaign]);
  const content = r(utm.utm_content);
  if (content) paramsToAppend.push(["utm_content", content]);
  const term = r(utm.utm_term);
  if (term) paramsToAppend.push(["utm_term", term]);

  if (paramsToAppend.length === 0) return text;

  let siteHost = "gliattomatti.ch";
  try {
    siteHost = new URL(baseUrl).host.toLowerCase();
  } catch {
    siteHost = "gliattomatti.ch";
  }

  const applyToExternal = Boolean(utm.apply_to_external);

  // Match URLs in plain text (http:// or https://)
  return text.replace(/https?:\/\/[^\s<>)"]+/g, (matchedUrl) => {
    try {
      const u = new URL(matchedUrl);
      const host = u.host.toLowerCase();
      const isInternal = host === siteHost || host.endsWith(`.${siteHost}`);
      if (!isInternal && !applyToExternal) return matchedUrl;

      const hashIndex = matchedUrl.indexOf("#");
      const beforeHash = hashIndex !== -1 ? matchedUrl.slice(0, hashIndex) : matchedUrl;
      const hash = hashIndex !== -1 ? matchedUrl.slice(hashIndex) : "";
      const separator = beforeHash.includes("?") ? "&" : "?";
      const queryString = paramsToAppend
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

      return `${beforeHash}${separator}${queryString}${hash}`;
    } catch {
      return matchedUrl;
    }
  });
}

/**
 * Renders a complete, bulletproof HTML email using component blocks.
 */
export function renderEmailHtml({
  template,
  variables = {},
  rawJsonObj,
  themeColors,
  settings,
  baseUrl
}: {
  template: EmailTemplateConfig;
  variables?: Record<string, string>;
  rawJsonObj?: any;
  themeColors?: LandingThemeColors;
  settings?: EmailSettingsConfig;
  baseUrl?: string;
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

    const baseHtml = renderEmailBlocksHtml({
      blocks: blocksWithSettings,
      variables,
      rawJsonObj,
      themeColors,
      subject: template.subject || "Notifica da Gli Attomatti",
      preheader: template.preheader || "",
      baseUrl
    });

    // Automatically wrap links with UTM tracking if configured
    return applyUtmTrackingToHtml({
      html: baseHtml,
      utm: template.utm,
      variables,
      rawJsonObj,
      templateId: template.id,
      baseUrl
    });
  }

/**
 * Renders a plain-text alternative of the email from the blocks.
 */
export function renderEmailText({
    template,
    variables = {},
    rawJsonObj,
    settings,
    baseUrl
  }: {
    template: EmailTemplateConfig;
    variables?: Record<string, string>;
    rawJsonObj?: any;
    settings?: EmailSettingsConfig;
    baseUrl?: string;
  }): string {
    const blocks = convertLegacyToBlocks(template);
      const baseText = renderEmailBlocksText({
        blocks,
        variables,
        rawJsonObj,
        baseUrl
      });

      return applyUtmTrackingToText({
        text: baseText,
        utm: template.utm,
        variables,
        rawJsonObj,
        templateId: template.id,
        baseUrl
      });
    }
