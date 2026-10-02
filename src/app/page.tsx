import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const heroTitle = content?.pages?.home?.hero?.title || "Gli Attomatti";
  const heroSubtitle = content?.pages?.home?.hero?.subtitle || "Compagnia teatrale amatoriale di lingua italiana a Zurigo";

  return createPageMetadata({
    title: "Gli Attomatti — Compagnia Teatrale Italiana a Zurigo",
    description: `${heroTitle}. ${heroSubtitle}. Scopri i nostri spettacoli, le commedie in scena a Zurigo e acquista i biglietti.`,
    path: "/"
  });
}

export default async function Home() {
  const content = await getContent();
  return <HomeClient content={content} />;
}
