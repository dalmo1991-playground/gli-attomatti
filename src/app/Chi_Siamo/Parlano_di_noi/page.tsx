import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import ParlanoDiNoiClient from "./ParlanoDiNoiClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.parlano_di_noi;

  return createPageMetadata({
    title: page?.title ? `${page.title} — Rassegna Stampa & Recensioni` : "Dicono di Noi — Recensioni & Rassegna Stampa",
    description:
      page?.description ||
      "Articoli, recensioni, opinioni del pubblico e rassegna stampa sugli spettacoli teatrali della compagnia Gli Attomatti a Zurigo.",
    path: "/Chi_Siamo/Parlano_di_noi",
    keywords: ["recensioni teatro zurigo", "rassegna stampa teatro", "parlano di noi attomatti"]
  });
}

export default async function ParlanoDiNoiPage() {
  const content = await getContent();
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Chi Siamo", path: "/Chi_Siamo" },
    { name: "Dicono di Noi", path: "/Chi_Siamo/Parlano_di_noi" }
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <ParlanoDiNoiClient content={content} />
    </>
  );
}
