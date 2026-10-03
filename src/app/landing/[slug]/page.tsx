import { getContent } from "@/lib/data";
import LandingClient from "./LandingClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const landing = (content?.landings || []).find((l: any) => l?.slug === slug);

  if (!landing) {
    return {
      title: "Pagina Promozionale"
    };
  }

  const heroBlock = landing.blocks?.find((b: any) => b.type === "hero");

  return {
    title: landing.title || "Gli Attomatti",
    description: heroBlock?.tagline || "Spettacolo teatrale della compagnia Gli Attomatti a Zurigo.",
    alternates: {
      canonical: `/landing/${slug}`
    },
    openGraph: {
      title: landing.title,
      description: heroBlock?.tagline,
      url: `https://gliattomatti.ch/landing/${slug}`,
      type: "website",
      images: heroBlock?.hero_image ? [heroBlock.hero_image] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: landing.title,
      description: heroBlock?.tagline,
      images: heroBlock?.hero_image ? [heroBlock.hero_image] : undefined
    }
  };
}

export default async function LandingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const landing = (content?.landings || []).find((l: any) => l?.slug === slug);

  return <LandingClient landing={landing} site={content?.site} slug={slug} />;
}
