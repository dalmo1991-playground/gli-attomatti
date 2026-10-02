import { getContent } from "@/lib/data";
import { notFound } from "next/navigation";
import RegistrationClient, { RegistrationPageData } from "./RegistrationClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent();
  const pages: RegistrationPageData[] = content?.registration_pages || [];
  const page = pages.find((p) => p.slug === slug);

  if (!page || page.active === false) {
    return {
      title: "Registrazioni",
    };
  }

  return {
    title: `${page.title} — Registrazione Online`,
    description:
      page.description ||
      `Modulo di registrazione e iscrizione per ${page.title} della compagnia teatrale Gli Attomatti a Zurigo.`,
    alternates: {
      canonical: `/Registrazioni/${slug}`,
    },
    openGraph: {
      title: `${page.title} — Registrazione Online`,
      description: page.description || `Modulo per ${page.title} a Zurigo.`,
      url: `https://gliattomatti.ch/Registrazioni/${slug}`,
      type: "website",
    },
  };
}

export default async function RegistrazioniPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const pages: RegistrationPageData[] = content?.registration_pages || [];
  const page = pages.find((p) => p.slug === slug);

  // If the page does not exist, is deactivated, or has no Tally URL, return 404
  if (!page || page.active === false || !page.tally_url?.trim()) {
    notFound();
  }

  return (
    <RegistrationClient
      page={page}
      site={content.site}
      integrations={content.integrations}
    />
  );
}
