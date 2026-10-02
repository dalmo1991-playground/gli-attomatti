import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import ContattiClient from "./ContattiClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.contatti;

  return createPageMetadata({
    title: page?.title ? `${page.title} — Informazioni & Collaborazioni` : "Contatti & Collaborazioni — Gli Attomatti",
    description:
      page?.description ||
      "Contatta la compagnia teatrale Gli Attomatti a Zurigo: per informazioni sugli spettacoli, acquisto biglietti, audizioni o collaborazioni.",
    path: "/Contatti",
    keywords: ["contatti teatro zurigo", "scrivere gli attomatti", "email teatro zurigo"]
  });
}

export default async function ContattiPage() {
  const content = await getContent();
  return <ContattiClient content={content} />;
}
