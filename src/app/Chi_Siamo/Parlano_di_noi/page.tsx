import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import ParlanoDiNoiClient from "./ParlanoDiNoiClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.parlano_di_noi;
  const site = content?.site;

  return createPageMetadata({
    title: page?.meta_title || page?.title || site?.name || "",
    description: page?.meta_description || page?.description || site?.description || "",
    path: "/Chi_Siamo/Parlano_di_noi",
    keywords: Array.isArray(page?.keywords) ? page.keywords : []
  });
}

export default async function ParlanoDiNoiPage() {
  const content = await getContent();
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: content?.site?.name || "", path: "/" },
    { name: content?.pages?.chi_siamo?.title || "", path: "/Chi_Siamo" },
    { name: content?.pages?.parlano_di_noi?.title || "", path: "/Chi_Siamo/Parlano_di_noi" }
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <ParlanoDiNoiClient content={content} />
    </>
  );
}
