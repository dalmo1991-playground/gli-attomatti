import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import ChiSiamoClient from "./ChiSiamoClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.chi_siamo;
  const site = content?.site;

  return createPageMetadata({
    title: page?.meta_title || page?.title || site?.name || "",
    description: page?.meta_description || page?.description || site?.description || "",
    path: "/Chi_Siamo",
    keywords: Array.isArray(page?.keywords) ? page.keywords : []
  });
}

export default async function ChiSiamoPage() {
  const content = await getContent();
  return <ChiSiamoClient content={content} />;
}
