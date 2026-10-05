import { getContent } from "@/lib/data";
import { redirect } from "next/navigation";
import LocationClient from "./LocationClient";
import type { Metadata } from "next";
import { LocationItem } from "@/lib/locationTypes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const locations: LocationItem[] = content?.locations || [];
  const location = locations.find((l) => l.slug === slug);

  if (!location || location.active === false) {
    return {
      title: "Come Raggiungerci — Location & Indicazioni",
      robots: { index: false, follow: false },
    };
  }

  const title = `${location.venue_name || location.title} — Come Raggiungerci`;
  const description =
    location.description ||
    `Guida fotografica e indicazioni per raggiungere ${location.title} (${location.address}) con mezzi pubblici e a piedi.`;

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
      url: `https://gliattomatti.ch/Location/${slug}`,
      type: "website",
      images: location.hero_image ? [{ url: location.hero_image }] : undefined,
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
