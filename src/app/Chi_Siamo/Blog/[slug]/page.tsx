import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import ArticoloClient from "./ArticoloClient";

export async function generateStaticParams() {
  const content = await getContent();
  const articles = content?.pages?.blog?.articles || [];
  return articles
    .filter((a: any) => a && a.slug)
    .map((a: any) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const article = (content?.pages?.blog?.articles || []).find((a: any) => a?.slug === slug);

  if (!article) {
    return {
      title: "Articolo non trovato — Gli Attomatti",
      robots: { index: false, follow: true }
    };
  }

  const cleanDescription = article.short_description ||
    (typeof article.text === "string"
      ? article.text.replace(/<[^>]*>?/gm, "").slice(0, 160).trim()
      : undefined);

  return createPageMetadata({
    title: `${article.title} — Blog Gli Attomatti`,
    description: cleanDescription || `Leggi l'articolo "${article.title}" sul blog della compagnia Gli Attomatti a Zurigo.`,
    path: `/Chi_Siamo/Blog/${slug}`,
    keywords: [article.title.toLowerCase(), "blog teatro zurigo", "gli attomatti"]
  });
}

export default async function ArticoloDettaglioPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const article = (content?.pages?.blog?.articles || []).find((a: any) => a?.slug === slug);

  const breadcrumbJsonLd = article
    ? getBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Chi Siamo", path: "/Chi_Siamo" },
        { name: "Blog", path: "/Chi_Siamo/Blog" },
        { name: article.title, path: `/Chi_Siamo/Blog/${slug}` }
      ])
    : null;

  return (
    <>
      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
      <ArticoloClient content={content} slug={slug} />
    </>
  );
}
