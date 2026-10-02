import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import AttoriClient from "./AttoriClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.attori;

  return createPageMetadata({
    title: page?.title ? `${page.title} — Attori & Registi` : "Gli Attori & Il Cast — Gli Attomatti",
    description:
      "Scopri gli attori, i registi e il cast della compagnia teatrale Gli Attomatti a Zurigo: le persone che danno vita agli spettacoli.",
    path: "/Chi_Siamo/Attori",
    keywords: ["attori teatro zurigo", "cast teatrale", "registi teatro zurigo", "recitazione italiana zurigo"]
  });
}

export default async function AttoriPage() {
  const content = await getContent();
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Chi Siamo", path: "/Chi_Siamo" },
    { name: "Le Persone", path: "/Chi_Siamo/Attori" }
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <AttoriClient content={content} />
    </>
  );
}
