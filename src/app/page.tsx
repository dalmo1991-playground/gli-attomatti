import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const home = content?.pages?.home;
  const site = content?.site;

  return createPageMetadata({
    title: home?.meta_title || site?.name || "",
    description: home?.meta_description || site?.description || "",
    path: "/"
  });
}

export default async function Home() {
  const content = await getContent();
  return <HomeClient content={content} />;
}
