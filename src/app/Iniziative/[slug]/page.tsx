import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import IniziativaDettaglioClient from "./IniziativaClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const initiative = (content?.pages?.iniziative?.archive_sections || []).find((s: any) => s?.slug === slug);

  if (!initiative) {
    return {
      title: "Iniziativa non trovata — Gli Attomatti",
      robots: { index: false, follow: true }
    };
  }

  const cleanDescription = typeof initiative.text === "string"
    ? initiative.text.replace(/<[^>]*>?/gm, "").slice(0, 160).trim()
    : undefined;

  return createPageMetadata({
    title: `${initiative.title} — Iniziativa Teatrale a Zurigo`,
    description: cleanDescription || `Iniziativa "${initiative.title}" organizzata dalla compagnia teatrale Gli Attomatti a Zurigo.`,
    path: `/Iniziative/${slug}`,
    image: initiative.hero_image?.trim() || initiative.images?.[0]?.url,
    keywords: [initiative.title.toLowerCase(), "laboratorio teatro", "corsi teatro zurigo"]
  });
}

export default async function IniziativaDettaglioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent();
  const initiative = (content?.pages?.iniziative?.archive_sections || []).find((s: any) => s?.slug === slug);

  const breadcrumbJsonLd = initiative ? getBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Iniziative", path: "/Iniziative" },
    { name: initiative.title, path: `/Iniziative/${slug}` }
  ]) : null;

  return (
    <>
      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
      <IniziativaDettaglioClient content={content} slug={slug} />
    </>
  );
}
