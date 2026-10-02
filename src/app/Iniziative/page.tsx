import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import IniziativeClient from "./IniziativeClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.iniziative;

  return createPageMetadata({
    title: page?.title ? `${page.title} — Corsi & Laboratori` : "Iniziative, Corsi & Progetti Teatrali",
    description:
      page?.description ||
      "Scopri i corsi di teatro, i laboratori e le rassegne culturali della compagnia teatrale Gli Attomatti a Zurigo.",
    path: "/Iniziative",
    keywords: ["corsi teatro zurigo", "laboratori teatrali zurigo", "iniziative teatrali", "workshop teatro svizzera"]
  });
}

export default async function IniziativePage() {
  const content = await getContent();
  return <IniziativeClient content={content} />;
}
