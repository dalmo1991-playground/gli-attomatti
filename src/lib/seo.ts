import type { Metadata } from "next";

import localContent from "@/data/content.json";

export const SITE_URL = process.env.SITE_URL || "https://gliattomatti.ch";

// Default global OpenGraph image for all crawlers (WhatsApp, Facebook, Instagram, Twitter/X, Telegram, LinkedIn)
export const GLOBAL_OG_IMAGE = "/images/og-image.webp";
export const GLOBAL_OG_IMAGE_JPG = "/images/og-image.jpg";

const siteSeo = (localContent as any)?.site?.seo || {};
const siteName = (localContent as any)?.site?.name || "Gli Attomatti";

export const DEFAULT_SEO = {
  siteName: siteName,
  titleTemplate: siteSeo.title_template || `%s | ${siteName}`,
  defaultTitle: siteSeo.default_title || `${siteName} — Compagnia Teatrale Italiana a Zurigo`,
  defaultDescription:
    siteSeo.default_description ||
    (localContent as any)?.site?.description ||
    "Gli Attomatti: compagnia teatrale amatoriale di lingua italiana a Zurigo. Commedie, spettacoli dal vivo, rassegne ed eventi teatrali in Svizzera.",
  defaultImage: GLOBAL_OG_IMAGE,
  locale: siteSeo.locale || "it_CH",
  keywords: Array.isArray(siteSeo.keywords) ? siteSeo.keywords : [],
  socials: Array.isArray(siteSeo.socials) ? siteSeo.socials : []
};

interface CreateMetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Creates standardized, comprehensive metadata for any page.
 */
export function createPageMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  keywords = [],
  noIndex = false
}: CreateMetadataOptions): Metadata {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const resolvedDescription = description?.trim() || DEFAULT_SEO.defaultDescription;

  // Per directive utente: l'immagine OpenGraph ovunque è il logo ufficiale Gli Attomatti su sfondo blu
  const primaryImageUrl = `${SITE_URL}${GLOBAL_OG_IMAGE}`;
  const fallbackJpgUrl = `${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`;

  return {
    title,
    description: resolvedDescription,
    keywords: [...DEFAULT_SEO.keywords, ...keywords],
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url,
      siteName: DEFAULT_SEO.siteName,
      locale: DEFAULT_SEO.locale,
      type,
      images: [
        {
          url: primaryImageUrl,
          secureUrl: primaryImageUrl,
          type: "image/webp",
          width: 1200,
          height: 630,
          alt: `${title} — Gli Attomatti`
        },
        {
          url: fallbackJpgUrl,
          secureUrl: fallbackJpgUrl,
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: `${title} — Gli Attomatti`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resolvedDescription,
      images: [fallbackJpgUrl, primaryImageUrl]
    },
    robots: noIndex
      ? {
        index: false,
        follow: false
      }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1
        }
      }
  };
}

/**
 * Generates Schema.org TheaterGroup / Organization structured data.
 */
export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["TheaterGroup", "PerformingGroup"],
    "@id": `${SITE_URL}/#organization`,
    name: siteName,
    alternateName: siteSeo.organization_alternate_name || "Compagnia Teatrale Gli Attomatti",
    url: SITE_URL,
    logo: `${SITE_URL}/logo_attomatti.svg`,
    image: `${SITE_URL}${DEFAULT_SEO.defaultImage}`,
    description:
      siteSeo.organization_description ||
      "Compagnia teatrale amatoriale di lingua italiana fondata a Zurigo, Svizzera. Produzione di commedie, spettacoli dal vivo e iniziative culturali.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Zurich",
      addressCountry: "CH"
    },
    sameAs: DEFAULT_SEO.socials,
    knowsLanguage: ["it", "de"]
  };
}

/**
 * Generates Schema.org TheaterEvent structured data for a theatrical show.
 */
export function getTheaterEventJsonLd(show: any, slug: string) {
  if (!show) return null;

  const url = `${SITE_URL}/Spettacoli/${slug}`;
  const imageUrl = show.hero_image?.trim()
    ? (show.hero_image.startsWith("http") ? show.hero_image : `${SITE_URL}${show.hero_image}`)
    : `${SITE_URL}${DEFAULT_SEO.defaultImage}`;

  const offers = (show.dates || [])
    .filter((d: any) => d?.ticket_href?.trim())
    .map((d: any) => ({
      "@type": "Offer",
      url: d.ticket_href.trim(),
      name: d.ticket_label || siteSeo.default_ticket_offer_name || "Biglietto Spettacolo",
      availability: "https://schema.org/InStock",
      priceCurrency: "CHF",
      validFrom: new Date().toISOString().split("T")[0]
    }));

  return {
    "@context": "https://schema.org",
    "@type": "TheaterEvent",
    name: show.title,
    description: typeof show.text === "string" ? show.text.replace(/<[^>]*>?/gm, "").slice(0, 300) : show.title,
    url,
    image: imageUrl,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    performer: {
      "@type": "TheaterGroup",
      name: siteName,
      url: SITE_URL
    },
    organizer: {
      "@type": "TheaterGroup",
      name: siteName,
      url: SITE_URL
    },
    location: {
      "@type": "Place",
      name: (show.dates && show.dates[0]?.location) || siteSeo.default_location_name || "Zurigo, Svizzera",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Zurich",
        addressCountry: "CH"
      }
    },
    offers: offers.length > 0 ? offers : undefined
  };
}

/**
 * Generates Schema.org BreadcrumbList structured data.
 */
export function getBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`
    }))
  };
}
