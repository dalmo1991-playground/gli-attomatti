import type { Metadata } from "next";

export const SITE_URL = process.env.SITE_URL || "https://gliattomatti.ch";

export const DEFAULT_SEO = {
  siteName: "Gli Attomatti",
  titleTemplate: "%s | Gli Attomatti",
  defaultTitle: "Gli Attomatti — Compagnia Teatrale Italiana a Zurigo",
  defaultDescription:
    "Gli Attomatti: compagnia teatrale amatoriale di lingua italiana a Zurigo. Commedie, spettacoli dal vivo, rassegne ed eventi teatrali in Svizzera.",
  defaultImage: "/images/1782553290530-TheaterCurtain.webp",
  locale: "it_CH",
  keywords: [
    "compagnia teatrale zurigo",
    "teatro italiano zurigo",
    "spettacoli zurigo",
    "teatro amatoriale svizzera",
    "gli attomatti",
    "commedia teatrale zurigo",
    "cultura italiana zurigo",
    "eventi italiani zurigo",
    "biglietti teatro zurigo"
  ],
  socials: [
    "https://www.instagram.com/gliattomatti/",
    "https://www.facebook.com/p/Gli-Attomatti-61572328015344/"
  ]
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
  const resolvedImage = image?.trim() || DEFAULT_SEO.defaultImage;
  const imageUrl = resolvedImage.startsWith("http")
    ? resolvedImage
    : `${SITE_URL}${resolvedImage.startsWith("/") ? resolvedImage : `/${resolvedImage}`}`;

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
          url: imageUrl,
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
      images: [imageUrl]
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
    name: "Gli Attomatti",
    alternateName: "Compagnia Teatrale Gli Attomatti",
    url: SITE_URL,
    logo: `${SITE_URL}/logo_attomatti.svg`,
    image: `${SITE_URL}${DEFAULT_SEO.defaultImage}`,
    description:
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
      name: d.ticket_label || "Biglietto Spettacolo",
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
      name: "Gli Attomatti",
      url: SITE_URL
    },
    organizer: {
      "@type": "TheaterGroup",
      name: "Gli Attomatti",
      url: SITE_URL
    },
    location: {
      "@type": "Place",
      name: (show.dates && show.dates[0]?.location) || "Zurigo, Svizzera",
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
