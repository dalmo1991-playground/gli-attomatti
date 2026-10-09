import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getTheaterEventJsonLd, getBreadcrumbJsonLd } from "@/lib/seo";
import { getMediaDisplayUrl } from "@/lib/youtube";
import { JsonLd } from "@/components/seo/JsonLd";
import SpettacoloDettaglioClient from "./SpettacoloClient";
export async function generateStaticParams() {
  const content = await getContent();
  const shows = content?.pages?.spettacoli?.archive_sections || [];
  return shows
    .filter((s: any) => s && s.slug)
    .map((s: any) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const show = (content?.pages?.spettacoli?.archive_sections || []).find((s: any) => s?.slug === slug);

  if (!show) {
    return {
      title: "Spettacolo non trovato",
      robots: { index: false, follow: true }
    };
  }

  const cleanDescription = typeof show.text === "string"
    ? show.text.replace(/<[^>]*>?/gm, "").slice(0, 160).trim()
    : undefined;

  return createPageMetadata({
    title: `${show.title} — Spettacolo Teatrale a Zurigo`,
    description: cleanDescription || `Spettacolo teatrale "${show.title}" (Stagione ${show.year}) della compagnia Gli Attomatti a Zurigo.`,
    path: `/Spettacoli/${slug}`,
    image: getMediaDisplayUrl(show.hero_image?.trim() || show.images?.[0]?.url),
    keywords: [show.title.toLowerCase(), `spettacolo ${show.title.toLowerCase()}`, "teatro zurigo", "commedia"]
  });
}

export default async function SpettacoloDettaglioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent();
  const show = (content?.pages?.spettacoli?.archive_sections || []).find((s: any) => s?.slug === slug);

  const eventJsonLd = show ? getTheaterEventJsonLd(show, slug) : null;
  const breadcrumbJsonLd = show ? getBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Spettacoli", path: "/Spettacoli" },
    { name: show.title, path: `/Spettacoli/${slug}` }
  ]) : null;

  return (
    <>
      {eventJsonLd && <JsonLd data={eventJsonLd} />}
      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
      <SpettacoloDettaglioClient content={content} slug={slug} />
    </>
  );
}
