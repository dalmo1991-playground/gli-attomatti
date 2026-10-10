import { EmailBlock } from "./blocks";
import { EmailTemplateConfig, renderEmailHtml } from "./template";
import { DEFAULT_THEME_PRESET } from "@/lib/landingThemes";

/**
 * Converts a blog article object into an array of modular EmailBlocks.
 */
export function convertArticleToEmailBlocks(article: any, siteBaseUrl: string = "https://gliattomatti.ch"): EmailBlock[] {
  const blocks: EmailBlock[] = [];
  const uid = () => Math.random().toString(36).substring(2, 9);

  // 1. Header with Logo & Brand
  blocks.push({
    id: `hdr-${uid()}`,
    type: "header",
    enabled: true,
    brand_name: "GLI ATTOMATTI",
    tagline: "Compagnia Teatrale Italiana a Zurigo",
    align: "center"
  } as EmailBlock);

  // 2. Badge (Date or Category)
  const badgeText = article.date || article.year || "Novità & Racconti";
  blocks.push({
    id: `bdg-${uid()}`,
    type: "badge",
    enabled: true,
    text: badgeText,
    align: "center"
  } as EmailBlock);

  // 3. Main Title
  blocks.push({
    id: `hdg-${uid()}`,
    type: "heading",
    enabled: true,
    text: article.title || "Nuovo Articolo dal Blog",
    level: "h1",
    align: "center"
  } as EmailBlock);

  // 4. Short Description / Excerpt
  if (article.short_description) {
    blocks.push({
      id: `desc-${uid()}`,
      type: "text",
      enabled: true,
      content: `**${article.short_description}**`,
      align: "center"
    } as EmailBlock);
  }

  // Divider
  blocks.push({
    id: `div-${uid()}`,
    type: "divider",
    enabled: true
  } as EmailBlock);

  // 5. Convert each chapter / section
  const sections = Array.isArray(article.content_sections) ? article.content_sections : [];
  sections.forEach((sec: any) => {
    if (sec.title) {
      blocks.push({
        id: `sec-title-${uid()}`,
        type: "heading",
        enabled: true,
        text: sec.title,
        level: "h2",
        align: "left"
      } as EmailBlock);
    }

    // Determine blocks
    let secBlocks: any[] = [];
    if (Array.isArray(sec.blocks) && sec.blocks.length > 0) {
      secBlocks = sec.blocks;
    } else {
      if (sec.text) secBlocks.push({ type: "text", text: sec.text });
      if (Array.isArray(sec.images) && sec.images.length > 0) {
        secBlocks.push({ type: "gallery", images: sec.images });
      }
    }

    secBlocks.forEach((sb: any) => {
      if (sb.type === "text" && sb.text) {
        // Strip surrounding paragraph tags to avoid nested <p> in email blocks
        const cleanContent = sb.text
          .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
          .replace(/<p[^>]*>/gi, "")
          .replace(/<\/p>/gi, "")
          .trim();

        blocks.push({
          id: `txt-${uid()}`,
          type: "text",
          enabled: true,
          content: cleanContent,
          align: "left"
        } as EmailBlock);
      }

      if (sb.type === "gallery" && Array.isArray(sb.images)) {
        sb.images.forEach((img: any) => {
          if (img?.url) {
            const fullUrl = img.url.startsWith("http")
              ? img.url
              : `${siteBaseUrl}${img.url.startsWith("/") ? "" : "/"}${img.url}`;

            blocks.push({
              id: `img-${uid()}`,
              type: "image",
              enabled: true,
              image_url: fullUrl,
              alt: img.alt || article.title,
              caption: img.alt || undefined
            } as EmailBlock);
          }
        });
      }
    });
  });

  // 6. Call To Action Button (Read full article on website)
  const articleUrl = article.slug ? `${siteBaseUrl}/Chi_Siamo/Blog/${article.slug}` : `${siteBaseUrl}/Chi_Siamo/Blog`;
  blocks.push({
    id: `btn-${uid()}`,
    type: "button",
    enabled: true,
    label: "Leggi l'articolo completo sul sito",
    url: articleUrl,
    align: "center",
    style: "pill"
  } as EmailBlock);

  // 7. Divider before social and footer
  blocks.push({
    id: `div-foot-${uid()}`,
    type: "divider",
    enabled: true
  } as EmailBlock);

  // 8. Social Links
  blocks.push({
    id: `soc-${uid()}`,
    type: "social_links",
    enabled: true,
    show_instagram: true,
    instagram_url: "https://www.instagram.com/gliattomatti/",
    show_website: true,
    website_url: siteBaseUrl
  } as EmailBlock);

  // 9. Footer with newsletter notice
  blocks.push({
    id: `ftr-${uid()}`,
    type: "footer",
    enabled: true,
    custom_text: "Ricevi questa email perché ti sei registrato agli eventi o alle novità de Gli Attomatti. Per non ricevere più queste comunicazioni, invia semplicemente una mail a info@gliattomatti.ch."
  } as EmailBlock);

  return blocks;
}

/**
 * Builds a complete standalone HTML document from a blog article.
 */
export function buildArticleEmailHtml(
  article: any,
  options: {
    siteBaseUrl?: string;
    settings?: any;
    themeColors?: any;
  } = {}
): string {
  const baseUrl = options.siteBaseUrl || "https://gliattomatti.ch";
  const blocks = convertArticleToEmailBlocks(article, baseUrl);

  const templateConfig: EmailTemplateConfig = {
    id: `blog-${article.slug || "article"}`,
    name: `Newsletter: ${article.title || "Articolo Blog"}`,
    subject: article.title || "Nuovo articolo da Gli Attomatti",
    preheader: article.short_description || "Leggi la nostra ultima storia dal palcoscenico.",
    blocks,
    theme: "default"
  };

  return renderEmailHtml({
    template: templateConfig,
    variables: {},
    themeColors: options.themeColors || DEFAULT_THEME_PRESET.colors,
    settings: options.settings || {
      from_name: "Gli Attomatti",
      from_email: "info@gliattomatti.ch",
      footer_text: "Gli Attomatti — Compagnia Teatrale Italiana a Zurigo",
      privacy_note: "Per disiscriverti rispondi o scrivi a info@gliattomatti.ch."
    },
    baseUrl
  });
}
