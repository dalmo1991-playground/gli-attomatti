import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import ChiSiamoClient from "./ChiSiamoClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.chi_siamo;

  return createPageMetadata({
    title: page?.title ? `${page.title} — La Compagnia Teatrale` : "Chi Siamo — La Compagnia Teatrale a Zurigo",
    description:
      page?.description ||
      "La storia, la missione e la passione di Gli Attomatti: teatro amatoriale italiano dal vivo a Zurigo, Svizzera.",
    path: "/Chi_Siamo",
    keywords: ["chi siamo teatro zurigo", "compagnia teatrale italiana zurigo", "teatro amatoriale zurigo"]
  });
}

export default async function ChiSiamoPage() {
  const content = await getContent();
  return <ChiSiamoClient content={content} />;
}
