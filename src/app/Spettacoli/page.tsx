import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import SpettacoliClient from "./SpettacoliClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.spettacoli;

  return createPageMetadata({
    title: page?.title ? `${page.title} — Archivio & Produzioni` : "Spettacoli Teatrali & Archivio",
    description:
      page?.description ||
      "Scopri gli spettacoli teatrali, le commedie e le produzioni in scena della compagnia teatrale Gli Attomatti a Zurigo.",
    path: "/Spettacoli"
  });
}

export default async function SpettacoliPage() {
  const content = await getContent();
  return <SpettacoliClient content={content} />;
}
