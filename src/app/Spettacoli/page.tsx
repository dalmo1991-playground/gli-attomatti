import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import SpettacoliClient from "./SpettacoliClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.spettacoli;
  const site = content?.site;

  return createPageMetadata({
    title: page?.meta_title || page?.title || site?.name || "",
    description: page?.meta_description || page?.description || site?.description || "",
    path: "/Spettacoli"
  });
}

export default async function SpettacoliPage() {
  const content = await getContent();
  return <SpettacoliClient content={content} />;
}
