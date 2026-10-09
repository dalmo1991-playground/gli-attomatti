import { getContent } from "@/lib/data";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";
import type { Metadata } from "next";
export async function generateStaticParams() {
  const content = await getContent();
  const pages: any[] = content?.ticketing_pages || [];
  return pages
    .filter((p: any) => p && p.slug && p.active !== false)
    .map((p: any) => ({ slug: p.slug }));
}

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
      title: "Biglietti",
    };
  }

  return {
    title: `${page.title} — Biglietti & Prevendita`,
    description:
      page.description ||
      `Acquisto biglietti per ${page.title} della compagnia teatrale Gli Attomatti a Zurigo.`,
    alternates: {
      canonical: `/Biglietti/${slug}`,
    },
    openGraph: {
      title: `${page.title} — Biglietti & Prevendita`,
      description: page.description || `Acquisto biglietti per ${page.title} a Zurigo.`,
      url: `https://gliattomatti.ch/Biglietti/${slug}`,
      type: "website",
    },
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

  // If the page does not exist, is deactivated, or has no Eventfrog URL, redirect to main hub
  if (!page || page.active === false || !page.eventfrog_url?.trim()) {
    redirect("/Biglietti");
  }

  return (
    <CheckoutClient
      page={page}
      site={content.site}
      integrations={content.integrations}
    />
  );
}
