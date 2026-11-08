import { getContent } from "@/lib/data";
import LinktreeClient from "./LinktreeClient";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const linktree = content?.linktree;

  const title = linktree?.meta_title || "Gli Attomatti — Tutti i Link Ufficiali";
  const description =
    linktree?.meta_description ||
    "Tutti i link ufficiali della compagnia teatrale Gli Attomatti di Zurigo: spettacoli, corsi, prenotazioni e social.";
  const avatar = linktree?.profile?.avatar;

  return {
    title,
    description,
    alternates: {
      canonical: "/links",
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/links`,
      type: "website",
      images: avatar ? [{ url: `${SITE_URL}${avatar}`, width: 800, height: 800, alt: title }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: avatar ? [`${SITE_URL}${avatar}`] : undefined,
    },
  };
}

export default async function LinksPage() {
  const content = await getContent();
  const linktree = content?.linktree;

  return <LinktreeClient initialData={linktree} fullContent={content} />;
}

