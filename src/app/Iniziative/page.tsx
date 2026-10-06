import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import IniziativeClient from "./IniziativeClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.iniziative;
  const site = content?.site;

  return createPageMetadata({
    title: page?.meta_title || page?.title || site?.name || "",
    description: page?.meta_description || page?.description || site?.description || "",
    path: "/Iniziative",
    keywords: Array.isArray(page?.keywords) ? page.keywords : []
  });
}

export default async function IniziativePage() {
  const content = await getContent();
  return <IniziativeClient content={content} />;
}
