import { getContent } from "@/lib/data";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const pages: any[] = content?.ticketing_pages || [];
  const page = pages.find((p) => p.slug === slug);

  if (!page || page.active === false) {
    return {
      title: "Biglietti — Gli Attomatti",
    };
  }

  return {
    title: `${page.title} — Biglietti & Prevendita — Gli Attomatti`,
    description:
      page.description ||
      `Acquisto biglietti per ${page.title} della compagnia teatrale Gli Attomatti a Zurigo.`,
  };
}

export default async function BigliettiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const pages: any[] = content?.ticketing_pages || [];
  const page = pages.find((p) => p.slug === slug);

  // If the page does not exist, is deactivated, or has no Eventfrog URL, 404
  if (!page || page.active === false || !page.eventfrog_url?.trim()) {
    notFound();
  }

  return (
    <CheckoutClient
      page={page}
      site={content.site}
      integrations={content.integrations}
    />
  );
}
