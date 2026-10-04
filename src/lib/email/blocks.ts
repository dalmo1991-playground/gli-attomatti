import { LandingThemeColors, DEFAULT_THEME_PRESET } from "@/lib/landingThemes";
import { getRelativeLuminance, hexToRgb } from "@/lib/devTheme";
import { getValueByJsonPath } from "./jsonPath";
import {
  parseEventDate,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateOffice365CalendarUrl,
  generateIcsCalendarContent,
  generateIcsDownloadUrl
} from "./calendar";

export type EmailBlockType =
  | "header"
  | "badge"
  | "heading"
  | "text"
  | "button"
  | "info_box"
  | "calendar"
  | "image"
  | "two_column"
  | "divider"
  | "social_links"
  | "footer";

export interface BaseEmailBlock {
  id: string;
  type: EmailBlockType;
  enabled?: boolean;
}

export interface HeaderBlock extends BaseEmailBlock {
  type: "header";
  brand_name?: string;
  tagline?: string;
  logo_url?: string;
  align?: "left" | "center";
}

export interface BadgeBlock extends BaseEmailBlock {
  type: "badge";
  text: string;
  align?: "left" | "center";
  color_override?: string;
}

export interface HeadingBlock extends BaseEmailBlock {
  type: "heading";
  text: string;
  level?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  color_override?: string;
}

export interface TextBlock extends BaseEmailBlock {
  type: "text";
  content: string; // Markdown supported (bold, links, newlines)
  align?: "left" | "center" | "right";
}

export interface ButtonBlock extends BaseEmailBlock {
  type: "button";
  label: string;
  url: string;
  align?: "left" | "center" | "full";
  style?: "pill" | "rounded" | "square";
  bg_color?: string;
  text_color?: string;
}

export interface InfoItem {
  label: string;
  value: string;
}

export interface InfoBoxBlock extends BaseEmailBlock {
  type: "info_box";
  title?: string;
  items: InfoItem[];
}

export interface CalendarBlock extends BaseEmailBlock {
  type: "calendar";
  header_label?: string;
  title: string;
  start_date: string;
  end_date?: string;
  location?: string;
  description?: string;
  button_label?: string;
  show_direct_links?: boolean;
  align?: "left" | "center";
}

export interface ImageBlock extends BaseEmailBlock {
  type: "image";
  image_url: string;
  alt?: string;
  caption?: string;
  link_url?: string;
  align?: "left" | "center" | "right" | "full";
  full_width?: boolean;
}

export interface TwoColumnBlock extends BaseEmailBlock {
  type: "two_column";
  col1_title?: string;
  col1_text?: string;
  col2_title?: string;
  col2_text?: string;
}

export interface DividerBlock extends BaseEmailBlock {
  type: "divider";
  style?: "gradient" | "solid" | "dots" | "spacer";
  spacing?: "sm" | "md" | "lg";
}

export interface SocialBlock extends BaseEmailBlock {
  type: "social_links";
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
  email?: string;
  align?: "left" | "center";
}

export interface FooterBlock extends BaseEmailBlock {
  type: "footer";
  legal_text?: string;
  privacy_note?: string;
  show_privacy_link?: boolean;
}

export type EmailBlock =
  | HeaderBlock
  | BadgeBlock
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | InfoBoxBlock
  | CalendarBlock
  | ImageBlock
  | TwoColumnBlock
  | DividerBlock
  | SocialBlock
  | FooterBlock;

/**
 * Replaces {{key}} in text with variables or dynamic JSONPath expressions evaluated on rawJsonObj.
 */
export function replaceVars(
  text: string = "",
  vars: Record<string, string> = {},
  rawJsonObj?: any
): string {
  if (!text) return "";
  return text.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, rawKey) => {
    const key = rawKey.trim();

    // 1. Direct variable map lookup
    if (vars[key] !== undefined) {
      const v = vars[key];
      return v === null || v === undefined ? "" : String(v);
    }

    // 2. Direct JSONPath resolution against raw JSON payload if available
    if (rawJsonObj && typeof rawJsonObj === "object") {
      const val = getValueByJsonPath(rawJsonObj, key);
      if (val !== undefined) {
        if (val === null) return "";
        if (typeof val !== "object") return String(val);
      }
    }

    // 3. Try normalized bracket syntax in vars (e.g. data['name'] -> data.name)
    const normalizedKey = key.replace(/\[['"]?([^'"\]]+)['"]?\]/g, ".$1");
    if (vars[normalizedKey] !== undefined) {
      const v = vars[normalizedKey];
      return v === null || v === undefined ? "" : String(v);
    }

    // 4. If variable/field was not provided or is empty, it must remain empty (no raw {{...}} and no fake prefill)
    return "";
  });
}

/**
 * Converts markdown bold and links to safe inline email HTML.
 */
export function formatMarkdown(text: string = "", linkColor: string = "#fb7185"): string {
  if (!text) return "";
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map((p) => {
      let html = p.trim();
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: inherit; font-weight: 700;">$1</strong>');
      html = html.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        `<a href="$2" target="_blank" rel="noopener noreferrer" style="color: ${linkColor}; text-decoration: underline; font-weight: 600;">$1</a>`
      );
      html = html.replace(/\n/g, "<br />");
      return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: inherit;">${html}</p>`;
    })
    .join("");
}

export function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * If a template is in legacy format (single heading, body, etc.), convert it to blocks.
 */
export function convertLegacyToBlocks(template: any): EmailBlock[] {
  if (Array.isArray(template?.blocks) && template.blocks.length > 0) {
    return template.blocks;
  }

  const blocks: EmailBlock[] = [];

  // 1. Header
  blocks.push({
    id: "block-header",
    type: "header",
    brand_name: "GLI ATTOMATTI",
    tagline: template?.tagline || "",
    align: "center"
  });

  // 2. Badge
  if (template?.badge) {
    blocks.push({
      id: "block-badge",
      type: "badge",
      text: template.badge,
      align: "center"
    });
  }

  // 3. Heading
  if (template?.heading) {
    blocks.push({
      id: "block-heading",
      type: "heading",
      text: template.heading,
      level: "h1",
      align: "left"
    });
  }

  // 4. Text Body
  if (template?.body) {
    blocks.push({
      id: "block-body",
      type: "text",
      content: template.body,
      align: "left"
    });
  }

  // 5. Info Box (Event Date / Location)
  if (template?.event_date || template?.event_location) {
    const items: InfoItem[] = [];
    if (template.event_date) {
      items.push({ label: "Data & Ora", value: template.event_date });
    }
    if (template.event_location) {
      items.push({ label: "Luogo", value: template.event_location });
    }
    blocks.push({
      id: "block-info",
      type: "info_box",
      title: "Riepilogo Evento",
      items
    });
  }

  // 6. CTA Button
  if (template?.cta_label && template?.cta_url) {
    blocks.push({
      id: "block-button",
      type: "button",
      label: template.cta_label,
      url: template.cta_url,
      align: "center",
      style: "pill"
    });
  }

  // 7. Divider
  blocks.push({
    id: "block-divider",
    type: "divider",
    style: "gradient",
    spacing: "md"
  });

  // 8. Social Links
  blocks.push({
    id: "block-social",
    type: "social_links",
    instagram_url: "https://instagram.com/gliattomatti",
    website_url: "https://gliattomatti.ch",
    align: "center"
  });

  // 9. Footer
  blocks.push({
    id: "block-footer",
    type: "footer",
    legal_text: "Compagnia Teatrale Amatoriale Gli Attomatti • Zurigo, Svizzera",
    privacy_note: "Ricevi questa email in seguito a una registrazione o richiesta sul sito gliattomatti.ch",
    show_privacy_link: true
  });

  return blocks;
}

/**
 * Ensures any relative URL (e.g. /images/... or /Iniziative/...) is converted to an absolute URL
 * for email clients (Gmail, Apple Mail, Outlook) which cannot resolve relative paths.
 */
export function toAbsoluteEmailUrl(url?: string, customBaseUrl?: string): string {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }
  const defaultBase =
    customBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://gliattomatti.ch";

  const cleanBase = defaultBase.replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Renders all blocks into a unified, responsive table-based email HTML string.
 */
export function renderEmailBlocksHtml({
  blocks,
  variables = {},
  rawJsonObj,
  themeColors,
  subject = "Notifica da Gli Attomatti",
  preheader = "",
  baseUrl
}: {
  blocks: EmailBlock[];
  variables?: Record<string, string>;
  rawJsonObj?: any;
  themeColors?: LandingThemeColors;
  subject?: string;
  preheader?: string;
  baseUrl?: string;
}): string {
  const colors = themeColors || DEFAULT_THEME_PRESET.colors;
  const r = (txt?: string) => replaceVars(txt || "", variables, rawJsonObj);

  const resolvedSubject = r(subject);
  const resolvedPreheader = r(preheader);

  const bgColor = colors.background || "#0f172a";
  const cardBg = colors.muted ? colors.muted : "#1e293b";
  const textColor = colors.foreground || "#f8fafc";
  const primaryColor = colors.primary || "#fb7185";
  const primaryText = colors.primaryForeground || "#0f172a";
  const accentColor = colors.accent || "#fbbf24";

  let isDarkCard = true;
  let isDarkCanvas = true;
  try {
    isDarkCard = getRelativeLuminance(cardBg) < 0.5;
  } catch {
    isDarkCard = true;
  }
  try {
    isDarkCanvas = getRelativeLuminance(bgColor) < 0.5;
  } catch {
    isDarkCanvas = true;
  }

  // Dynamic bubble container styles (info_box, two_column) that adapt to both dark and light card themes
  const bubbleRgb = isDarkCard ? "255, 255, 255" : (hexToRgb(textColor) || "15, 23, 42");
  const bubbleBg = `rgba(${bubbleRgb}, ${isDarkCard ? "0.04" : "0.035"})`;
  const bubbleBorder = `1px solid rgba(${bubbleRgb}, ${isDarkCard ? "0.08" : "0.1"})`;
  const dividerColor = `rgba(${bubbleRgb}, ${isDarkCard ? "0.1" : "0.12"})`;

  // Dynamic card container border & shadow
  const cardBorderRgb = isDarkCanvas ? "255, 255, 255" : "15, 23, 42";
  const cardBorder = `1px solid rgba(${cardBorderRgb}, ${isDarkCanvas ? "0.1" : "0.08"})`;
  const cardShadow = isDarkCanvas
    ? "0 20px 40px -15px rgba(0, 0, 0, 0.5)"
    : "0 10px 30px -10px rgba(0, 0, 0, 0.08)";

  // Render individual block to HTML table row
  const enabledBlocks = blocks.filter((b) => b.enabled !== false);

  // Render individual block to HTML table row
  const renderedBlocksHtml = enabledBlocks
    .map((block, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === enabledBlocks.length - 1;

      switch (block.type) {
        case "header": {
          const brand = r(block.brand_name?.trim() ? block.brand_name : "GLI ATTOMATTI");
          const tag = r(block.tagline?.trim() || "");
          const align = block.align || "center";
          const logoUrl = block.logo_url ? toAbsoluteEmailUrl(r(block.logo_url), baseUrl) : "";
          const pt = isFirst ? "36px" : "16px";
          const pb = isLast ? "36px" : "24px";
          return `
            <tr>
              <td align="${align}" style="padding: ${pt} 32px ${pb} 32px;">
                ${logoUrl ? `
                  <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand)}" style="max-height: 48px; width: auto; margin-bottom: 8px; border: 0;" />
                ` : `
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: ${primaryColor};">
                    ${escapeHtml(brand)}
                  </span>
                `}
                ${tag ? `
                  <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: ${textColor}; opacity: 0.65; margin-top: 4px;">
                    ${escapeHtml(tag)}
                  </span>
                ` : ""}
              </td>
            </tr>
          `;
        }

        case "badge": {
          const text = r(block.text);
          if (!text) return "";
          const badgeColor = block.color_override || primaryColor;
          const align = block.align || "center";
          const pt = isFirst ? "36px" : "0px";
          const pb = isLast ? "36px" : "16px";
          return `
            <tr>
              <td align="${align}" style="padding: ${pt} 32px ${pb} 32px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background-color: rgba(251, 113, 133, 0.15); border: 1px solid rgba(251, 113, 133, 0.3); border-radius: 9999px; padding: 4px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: ${badgeColor};">
                      ${escapeHtml(text)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "heading": {
          const text = r(block.text);
          if (!text) return "";
          const align = block.align || "left";
          const color = block.color_override || textColor;
          const fontSize = block.level === "h2" ? "20px" : block.level === "h3" ? "17px" : "24px";
          const pt = isFirst ? "36px" : "0px";
          const pb = isLast ? "36px" : "18px";
          return `
            <tr>
              <td align="${align}" style="padding: ${pt} 32px ${pb} 32px;">
                <h1 style="margin: 0; font-size: ${fontSize}; font-weight: 800; line-height: 1.25; color: ${color}; letter-spacing: -0.02em;">
                  ${escapeHtml(text)}
                </h1>
              </td>
            </tr>
          `;
        }

        case "text": {
          const content = r(block.content);
          if (!content) return "";
          const align = block.align || "left";
          const bodyHtml = formatMarkdown(content, primaryColor);
          const pt = isFirst ? "36px" : "0px";
          const pb = isLast ? "36px" : "8px";
          return `
            <tr>
              <td align="${align}" style="padding: ${pt} 32px ${pb} 32px; font-size: 15px; line-height: 1.6; color: ${textColor}; opacity: 0.95;">
                ${bodyHtml}
              </td>
            </tr>
          `;
        }

        case "button": {
          const label = r(block.label);
          const rawUrl = r(block.url);
          if (!label || !rawUrl) return "";
          const url = toAbsoluteEmailUrl(rawUrl, baseUrl);
          const align = block.align || "center";
          const radius = block.style === "square" ? "4px" : block.style === "rounded" ? "12px" : "9999px";
          const btnBg = block.bg_color || primaryColor;
          const btnText = block.text_color || primaryText;
          const pb = isLast ? "36px" : "24px";

          return `
            <tr>
              <td align="${align}" style="padding: 16px 32px ${pb} 32px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" ${block.align === "full" ? 'width="100%"' : ""}>
                  <tr>
                    <td align="center" style="border-radius: ${radius}; background-color: ${btnBg};">
                      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${btnText}; text-decoration: none; border-radius: ${radius}; ${block.align === "full" ? "width: 100%; box-sizing: border-box;" : ""}">
                        ${escapeHtml(label)} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "info_box": {
          const rawItems = Array.isArray(block.items) ? block.items : [];
          const evaluatedItems = rawItems
            .map((item) => ({
              label: r(item.label),
              value: r(item.value)
            }))
            .filter((item) => item.value && item.value.trim());

          if (evaluatedItems.length === 0) return "";
          const title = r(block.title);
          const pb = isLast ? "36px" : "20px";

          return `
            <tr>
              <td style="padding: 8px 32px ${pb} 32px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bubbleBg}; border: ${bubbleBorder}; border-radius: 14px;">
                  ${title ? `
                    <tr>
                      <td style="padding: 12px 18px 0 18px;">
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${accentColor};">
                          ${escapeHtml(title)}
                        </span>
                      </td>
                    </tr>
                  ` : ""}
                  <tr>
                    <td style="padding: 14px 18px;">
                      ${evaluatedItems
                        .map((item, idx) => `
                          <div style="font-size: 13px; margin-bottom: ${idx < evaluatedItems.length - 1 ? "10px" : "0"};">
                            <span style="display: inline-block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${accentColor}; font-size: 11px;">${escapeHtml(item.label)}:</span>
                            <div style="font-size: 15px; font-weight: 600; color: ${textColor}; margin-top: 2px;">${escapeHtml(item.value)}</div>
                          </div>
                        `)
                        .join("")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "calendar": {
          const rawHeader = block.header_label !== undefined ? r(block.header_label) : "Promemoria Evento in Agenda";
          const headerLabel = rawHeader.trim();
          const rawTitle = r(block.title);
          const rawStart = r(block.start_date);
          const rawEnd = r(block.end_date);
          const rawLoc = r(block.location);
          const rawDesc = r(block.description);
          const align = block.align || "center";
          const pb = isLast ? "36px" : "20px";

          // Parse start and end date
          const parsedStart = parseEventDate(rawStart) || new Date(Date.now() + 24 * 60 * 60 * 1000);
          const parsedEnd = parseEventDate(rawEnd) || new Date(parsedStart.getTime() + 2 * 60 * 60 * 1000);

          const eventTitle = rawTitle || "Appuntamento Teatrale Gli Attomatti";
          const eventLocation = rawLoc || "Zurigo, Svizzera";
          const eventDesc = rawDesc || "";

          // Formatted human date & time
          const monthShortNames = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];
          const monthLongNames = [
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
          ];
          const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
          
          const monthShort = monthShortNames[parsedStart.getMonth()] || "EVENTO";
          const dayNum = String(parsedStart.getDate()).padStart(2, "0");
          const dayName = dayNames[parsedStart.getDay()] || "";
          const monthLong = monthLongNames[parsedStart.getMonth()] || "";
          const year = parsedStart.getFullYear();
          const startHours = String(parsedStart.getHours()).padStart(2, "0");
          const startMins = String(parsedStart.getMinutes()).padStart(2, "0");
          const endHours = String(parsedEnd.getHours()).padStart(2, "0");
          const endMins = String(parsedEnd.getMinutes()).padStart(2, "0");

          const formattedDateLine = `${dayName}, ${dayNum} ${monthLong} ${year}`;
          const formattedTimeLine = `${startHours}:${startMins} - ${endHours}:${endMins}`;

          // Deep Links
          const googleUrl = generateGoogleCalendarUrl({
            title: eventTitle,
            description: eventDesc,
            location: eventLocation,
            startDate: parsedStart,
            endDate: parsedEnd
          });

          const outlookUrl = generateOutlookCalendarUrl({
            title: eventTitle,
            description: eventDesc,
            location: eventLocation,
            startDate: parsedStart,
            endDate: parsedEnd
          });

          const icsDownloadUrl = generateIcsDownloadUrl({
            title: eventTitle,
            description: eventDesc,
            location: eventLocation,
            startDate: rawStart || parsedStart.toISOString(),
            endDate: rawEnd || parsedEnd.toISOString(),
            baseUrl
          });

          return `
            <tr>
              <td align="${align}" style="padding: 10px 32px ${pb} 32px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bubbleBg}; border: ${bubbleBorder}; border-radius: 16px; overflow: hidden;">
                  
                  ${headerLabel ? `
                  <!-- Top Badge Line -->
                  <tr>
                    <td style="padding: 14px 20px 0 20px;">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="background-color: ${primaryColor}; width: 6px; height: 6px; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td>
                          <td style="padding-left: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: ${accentColor};">
                            ${escapeHtml(headerLabel)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ""}

                  <!-- Main Content: Date Tile + Event Info -->
                  <tr>
                    <td style="padding: 14px 20px 18px 20px;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <!-- Date Tile -->
                          <td width="64" valign="top" style="padding-right: 16px;">
                            <table role="presentation" width="64" border="0" cellspacing="0" cellpadding="0" style="background-color: ${isDarkCard ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.05)"}; border: ${bubbleBorder}; border-radius: 12px; overflow: hidden; text-align: center;">
                              <tr>
                                <td style="background-color: ${primaryColor}; color: ${primaryText}; font-size: 11px; font-weight: 900; letter-spacing: 0.1em; padding: 4px 0; text-transform: uppercase;">
                                  ${monthShort}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0 8px 0; font-size: 22px; font-weight: 900; line-height: 1; color: ${textColor};">
                                  ${dayNum}
                                </td>
                              </tr>
                            </table>
                          </td>

                          <!-- Event Info -->
                          <td valign="top" style="font-size: 14px; line-height: 1.4;">
                            <div style="font-size: 16px; font-weight: 800; color: ${textColor}; margin-bottom: 4px; letter-spacing: -0.01em;">
                              ${escapeHtml(eventTitle)}
                            </div>
                            <div style="font-size: 13px; font-weight: 600; color: ${textColor}; opacity: 0.9; margin-bottom: 4px;">
                              📅 ${escapeHtml(formattedDateLine)} • ${escapeHtml(formattedTimeLine)}
                            </div>
                            ${eventLocation ? `
                              <div style="font-size: 12px; font-weight: 500; color: ${textColor}; opacity: 0.75;">
                                📍 ${escapeHtml(eventLocation)}
                              </div>
                            ` : ""}
                            ${eventDesc ? `
                              <div style="font-size: 12px; color: ${textColor}; opacity: 0.65; margin-top: 6px; line-height: 1.4;">
                                ${escapeHtml(eventDesc)}
                              </div>
                            ` : ""}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- 3 Direct Action Buttons: Google Calendar, Apple / iCal, Outlook -->
                  <tr>
                    <td style="padding: 0 20px 18px 20px;">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="font-size: 0; line-height: 0;">
                            <!-- Google Calendar -->
                            <div style="display: inline-block; vertical-align: top; margin-right: 8px; margin-bottom: 8px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td align="center" style="background-color: ${primaryColor}; border-radius: 9999px;">
                                    <a href="${escapeHtml(googleUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 16px; font-size: 12px; font-weight: 800; letter-spacing: 0.02em; color: ${primaryText}; text-decoration: none; border-radius: 9999px; white-space: nowrap;">
                                      Google Calendar
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </div>

                            <!-- Apple / iCal (.ics) -->
                            <div style="display: inline-block; vertical-align: top; margin-right: 8px; margin-bottom: 8px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td align="center" style="background-color: ${isDarkCard ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.08)"}; border: ${bubbleBorder}; border-radius: 9999px;">
                                    <a href="${escapeHtml(icsDownloadUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 16px; font-size: 12px; font-weight: 800; letter-spacing: 0.02em; color: ${textColor}; text-decoration: none; border-radius: 9999px; white-space: nowrap;">
                                      Apple / iCal (.ics)
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </div>

                            <!-- Outlook -->
                            <div style="display: inline-block; vertical-align: top; margin-bottom: 8px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td align="center" style="background-color: ${isDarkCard ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.08)"}; border: ${bubbleBorder}; border-radius: 9999px;">
                                    <a href="${escapeHtml(outlookUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 16px; font-size: 12px; font-weight: 800; letter-spacing: 0.02em; color: ${textColor}; text-decoration: none; border-radius: 9999px; white-space: nowrap;">
                                      Outlook
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          `;
        }

        case "image": {
          const rawImgUrl = r(block.image_url);
          if (!rawImgUrl) return "";
          const imgUrl = toAbsoluteEmailUrl(rawImgUrl, baseUrl);
          const alt = r(block.alt || "Immagine");
          const caption = r(block.caption);
          const rawLink = r(block.link_url);
          const link = rawLink ? toAbsoluteEmailUrl(rawLink, baseUrl) : "";
          const isFullWidth = Boolean(block.full_width || block.align === "full");

          if (isFullWidth) {
            const pt = isFirst ? "0px" : "8px";
            const pb = isLast ? (caption ? "16px" : "0px") : "16px";
            const imgTag = `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(alt)}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />`;

            return `
              <tr>
                <td align="center" style="padding: ${pt} 0 ${pb} 0;">
                  ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none;">${imgTag}</a>` : imgTag}
                  ${caption ? `
                    <div style="font-size: 12px; color: ${textColor}; opacity: 0.6; padding: 8px 32px 0 32px; text-align: center;">
                      ${escapeHtml(caption)}
                    </div>
                  ` : ""}
                </td>
              </tr>
            `;
          }

          const pt = isFirst ? "36px" : "8px";
          const pb = isLast ? "36px" : "20px";
          const align = block.align === "right" ? "right" : block.align === "left" ? "left" : "center";
          const imgTag = `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(alt)}" style="display: block; max-width: 100%; height: auto; border-radius: 12px; border: 0;" />`;

          return `
            <tr>
              <td align="${align}" style="padding: ${pt} 32px ${pb} 32px;">
                ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${imgTag}</a>` : imgTag}
                ${caption ? `
                  <div style="font-size: 12px; color: ${textColor}; opacity: 0.6; margin-top: 6px; text-align: ${align};">
                    ${escapeHtml(caption)}
                  </div>
                ` : ""}
              </td>
            </tr>
          `;
        }

        case "two_column": {
          const c1Title = r(block.col1_title);
          const c1Text = r(block.col1_text);
          const c2Title = r(block.col2_title);
          const c2Text = r(block.col2_text);
          const pb = isLast ? "36px" : "20px";

          return `
            <tr>
              <td style="padding: 8px 32px ${pb} 32px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="48%" valign="top" style="background-color: ${bubbleBg}; border: ${bubbleBorder}; border-radius: 12px; padding: 14px 16px;">
                      ${c1Title ? `<div style="font-size: 13px; font-weight: 700; color: ${accentColor}; margin-bottom: 4px;">${escapeHtml(c1Title)}</div>` : ""}
                      <div style="font-size: 13px; line-height: 1.5; color: ${textColor}; opacity: 0.9;">${escapeHtml(c1Text)}</div>
                    </td>
                    <td width="4%">&nbsp;</td>
                    <td width="48%" valign="top" style="background-color: ${bubbleBg}; border: ${bubbleBorder}; border-radius: 12px; padding: 14px 16px;">
                      ${c2Title ? `<div style="font-size: 13px; font-weight: 700; color: ${accentColor}; margin-bottom: 4px;">${escapeHtml(c2Title)}</div>` : ""}
                      <div style="font-size: 13px; line-height: 1.5; color: ${textColor}; opacity: 0.9;">${escapeHtml(c2Text)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "divider": {
          const spacingPx = block.spacing === "lg" ? "32px" : block.spacing === "sm" ? "12px" : "20px";
          if (block.style === "spacer") {
            return `<tr><td height="${spacingPx}" style="font-size: 0; line-height: 0; padding: 0;">&nbsp;</td></tr>`;
          }
          if (block.style === "gradient") {
            return `
              <tr>
                <td style="padding: ${spacingPx} 32px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td height="2" style="background: linear-gradient(90deg, transparent, ${primaryColor}, ${accentColor}, transparent);"></td>
                    </tr>
                  </table>
                </td>
              </tr>
            `;
          }
          return `
            <tr>
              <td style="padding: ${spacingPx} 32px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td height="1" style="background-color: ${dividerColor};"></td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "social_links": {
          const align = block.align || "center";
          const websiteUrl = block.website_url ? toAbsoluteEmailUrl(r(block.website_url), baseUrl) : "";
          const instagramUrl = block.instagram_url ? toAbsoluteEmailUrl(r(block.instagram_url), baseUrl) : "";
          const facebookUrl = block.facebook_url ? toAbsoluteEmailUrl(r(block.facebook_url), baseUrl) : "";
          const pb = isLast ? "36px" : "16px";
          return `
            <tr>
              <td align="${align}" style="padding: 12px 32px ${pb} 32px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    ${websiteUrl ? `
                      <td style="padding: 0 8px;">
                        <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 700; color: ${textColor}; text-decoration: none; opacity: 0.75;">
                          Sito Web
                        </a>
                      </td>
                    ` : ""}
                    ${instagramUrl ? `
                      <td style="padding: 0 8px;">
                        <a href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 700; color: ${primaryColor}; text-decoration: none;">
                          Instagram
                        </a>
                      </td>
                    ` : ""}
                    ${facebookUrl ? `
                      <td style="padding: 0 8px;">
                        <a href="${escapeHtml(facebookUrl)}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 700; color: ${textColor}; text-decoration: none; opacity: 0.75;">
                          Facebook
                        </a>
                      </td>
                    ` : ""}
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "footer": {
          const legal = r(block.legal_text || "Compagnia Teatrale Amatoriale Gli Attomatti • Zurigo, Svizzera");
          const privacy = r(block.privacy_note || "Ricevi questa email in seguito a una registrazione sul nostro sito.");
          const siteUrl = toAbsoluteEmailUrl("/", baseUrl);
          const privacyUrl = toAbsoluteEmailUrl("/Privacy", baseUrl);

          return `
            <tr>
              <td align="center" style="padding: 24px 32px 36px 32px; font-size: 12px; line-height: 1.6; color: ${textColor}; opacity: 0.55;">
                <p style="margin: 0 0 6px 0; font-weight: 600;">${escapeHtml(legal)}</p>
                <p style="margin: 0 0 10px 0;">${escapeHtml(privacy)}</p>
                ${block.show_privacy_link !== false ? `
                  <p style="margin: 0;">
                    <a href="${escapeHtml(siteUrl)}" target="_blank" style="color: inherit; text-decoration: underline;">gliattomatti.ch</a> • 
                    <a href="${escapeHtml(privacyUrl)}" target="_blank" style="color: inherit; text-decoration: underline;">Informativa sulla Privacy</a>
                  </p>
                ` : ""}
              </td>
            </tr>
          `;
        }

        default:
          return "";
      }
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(resolvedSubject)}</title>
  ${resolvedPreheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(resolvedPreheader)}</div>` : ""}
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; color: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 32px 16px 48px 16px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Card Container -->
          <tr>
            <td>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${cardBg}; border: ${cardBorder}; border-radius: 20px; overflow: hidden; box-shadow: ${cardShadow};">
                
                <!-- Glowing Top Accent Line -->
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, ${primaryColor}, ${accentColor}); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- Content Table -->
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      ${renderedBlocksHtml}
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates clean plain text from all blocks.
 */
export function renderEmailBlocksText({
  blocks,
  variables = {},
  rawJsonObj,
  baseUrl
}: {
  blocks: EmailBlock[];
  variables?: Record<string, string>;
  rawJsonObj?: any;
  baseUrl?: string;
}): string {
  let out = "";
  const r = (txt?: string) => replaceVars(txt || "", variables, rawJsonObj);

  blocks
    .filter((b) => b.enabled !== false)
    .forEach((block) => {
      switch (block.type) {
        case "header": {
          const brand = r(block.brand_name || "GLI ATTOMATTI");
          const tag = r(block.tagline);
          out += `${brand.toUpperCase()}\n${tag ? `${tag}\n` : ""}\n`;
          break;
        }
        case "badge": {
          out += `[${r(block.text).toUpperCase()}]\n\n`;
          break;
        }
        case "heading": {
          const h = r(block.text);
          out += `${h.toUpperCase()}\n${"=".repeat(Math.min(h.length, 40))}\n\n`;
          break;
        }
        case "text": {
          out += `${r(block.content)}\n\n`;
          break;
        }
        case "button": {
          const label = r(block.label);
          const rawUrl = r(block.url);
          if (label && rawUrl) {
            out += `>> ${label}: ${toAbsoluteEmailUrl(rawUrl, baseUrl)}\n\n`;
          }
          break;
        }
        case "image": {
          const imgUrl = r(block.image_url);
          if (imgUrl) {
            const alt = r(block.alt || "Immagine");
            out += `[${alt}: ${toAbsoluteEmailUrl(imgUrl, baseUrl)}]\n\n`;
          }
          break;
        }
        case "info_box": {
          const filledItems = (block.items || [])
            .map((item) => ({ label: r(item.label), value: r(item.value) }))
            .filter((item) => item.value && item.value.trim());

          if (filledItems.length > 0) {
            if (block.title) out += `--- ${r(block.title)} ---\n`;
            filledItems.forEach((item) => {
              out += `${item.label}: ${item.value}\n`;
            });
            out += `\n`;
          }
          break;
        }
        case "calendar": {
          const rawHeader = block.header_label !== undefined ? r(block.header_label) : "APPUNTAMENTO IN AGENDA";
          const headerLabel = rawHeader.trim();
          const rawTitle = r(block.title || "Evento Teatrale");
          const rawStart = r(block.start_date);
          const rawEnd = r(block.end_date);
          const rawLoc = r(block.location);
          const rawDesc = r(block.description);

          const parsedStart = parseEventDate(rawStart) || new Date();
          const parsedEnd = parseEventDate(rawEnd) || new Date(parsedStart.getTime() + 2 * 60 * 60 * 1000);

          const googleUrl = generateGoogleCalendarUrl({
            title: rawTitle,
            description: rawDesc,
            location: rawLoc,
            startDate: parsedStart,
            endDate: parsedEnd
          });

          const outlookUrl = generateOutlookCalendarUrl({
            title: rawTitle,
            description: rawDesc,
            location: rawLoc,
            startDate: parsedStart,
            endDate: parsedEnd
          });

          const icsDownloadUrl = generateIcsDownloadUrl({
            title: rawTitle,
            description: rawDesc,
            location: rawLoc,
            startDate: rawStart || parsedStart.toISOString(),
            endDate: rawEnd || parsedEnd.toISOString(),
            baseUrl
          });

          if (headerLabel) {
            out += `=== ${headerLabel.toUpperCase()} ===\n`;
          }
          out += `${rawTitle}\n`;
          if (rawStart) out += `Data e Ora: ${rawStart}\n`;
          if (rawLoc) out += `Luogo: ${rawLoc}\n`;
          out += `Aggiungi al Calendario:\n`;
          out += `• Google Calendar: ${googleUrl}\n`;
          out += `• Apple / iCal (.ics): ${icsDownloadUrl}\n`;
          out += `• Outlook: ${outlookUrl}\n\n`;
          break;
        }
        case "two_column": {
          if (block.col1_title) out += `${r(block.col1_title)}: `;
          out += `${r(block.col1_text)}\n`;
          if (block.col2_title) out += `${r(block.col2_title)}: `;
          out += `${r(block.col2_text)}\n\n`;
          break;
        }
        case "footer": {
          out += `---\n${r(block.legal_text)}\n${toAbsoluteEmailUrl("/", baseUrl)}\n`;
          break;
        }
      }
    });

  return out.trim();
}
