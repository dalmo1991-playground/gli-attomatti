import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { createPageMetadata, getBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import BlogClient from "./BlogClient";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.blog;
  const site = content?.site;

  return createPageMetadata({
    title: page?.meta_title || page?.title || site?.name || "",
    description: page?.meta_description || page?.description || site?.description || "",
    path: "/Chi_Siamo/Blog",
    keywords: Array.isArray(page?.keywords) ? page.keywords : []
  });
}

export default async function BlogPage() {
  const content = await getContent();
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: content?.site?.name || "Home", path: "/" },
    { name: content?.pages?.chi_siamo?.title || "Chi Siamo", path: "/Chi_Siamo" },
    { name: content?.pages?.blog?.title || "Blog", path: "/Chi_Siamo/Blog" }
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <BlogClient content={content} />
    </>
  );
}
