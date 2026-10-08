import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import AttoriClient from "./AttoriClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.attori;
  const site = content?.site;

  return createPageMetadata({
    title: page?.meta_title || page?.title || site?.name || "",
    description: page?.meta_description || page?.description || site?.description || "",
    path: "/Chi_Siamo/Attori",
    keywords: Array.isArray(page?.keywords) ? page.keywords : []
  });
}

export default async function AttoriPage() {
  const content = await getContent();
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: content?.site?.name || "", path: "/" },
    { name: content?.pages?.chi_siamo?.title || "", path: "/Chi_Siamo" },
    { name: content?.pages?.attori?.title || "", path: "/Chi_Siamo/Attori" }
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <AttoriClient content={content} />
    </>
  );
}
