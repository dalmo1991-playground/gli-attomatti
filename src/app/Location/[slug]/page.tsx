import { getContent } from "@/lib/data";
import { redirect } from "next/navigation";
import LocationClient from "./LocationClient";
import type { Metadata } from "next";
import { LocationItem } from "@/lib/locationTypes";
import { SITE_URL, GLOBAL_OG_IMAGE, GLOBAL_OG_IMAGE_JPG } from "@/lib/seo";

export const dynamicParams = false;

export async function generateStaticParams() {
  const content = await getContent();
  const locations: LocationItem[] = content?.locations || [];
  return locations
    .filter((l) => l && l.slug && l.active !== false)
    .map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const locations: LocationItem[] = content?.locations || [];
  const location = locations.find((l) => l.slug === slug);

  const ui = content?.pages?.locations || {};

  if (!location || location.active === false) {
    return {
      title: ui.detail_meta_fallback_title || "",
      robots: { index: false, follow: false },
    };
  }

  const titleSuffix = ui.detail_meta_title_suffix || "";
  const title = `${location.venue_name || location.title} ${titleSuffix}`.trim();
  const descTemplate = ui.detail_meta_description_template || "";
  const description =
    location.description ||
    descTemplate
      .replace("{title}", location.title || "")
      .replace("{address}", location.address || "");

  return {
    title,
    description,
    robots: {
      index: false, // Unlisted / hidden from public search engines
      follow: false,
    },
    alternates: {
      canonical: `/Location/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/Location/${slug}`,
      type: "website",
      images: [
        {
          url: `${SITE_URL}${GLOBAL_OG_IMAGE}`,
          secureUrl: `${SITE_URL}${GLOBAL_OG_IMAGE}`,
          type: "image/webp",
          width: 1200,
          height: 630,
          alt: `${title} — Gli Attomatti`
        },
        {
          url: `${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`,
          secureUrl: `${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`,
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
      description,
      images: [`${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`, `${SITE_URL}${GLOBAL_OG_IMAGE}`]
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const locations: LocationItem[] = content?.locations || [];
  const location = locations.find((l) => l.slug === slug);

  return <LocationClient location={location || null} slug={slug} content={content} />;
}
