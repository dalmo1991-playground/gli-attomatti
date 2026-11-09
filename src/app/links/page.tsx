import { getContent } from "@/lib/data";
import LinktreeClient from "./LinktreeClient";
import type { Metadata } from "next";
import { SITE_URL, GLOBAL_OG_IMAGE, GLOBAL_OG_IMAGE_JPG } from "@/lib/seo";

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
      images: [
        {
          url: `${SITE_URL}${GLOBAL_OG_IMAGE}`,
          secureUrl: `${SITE_URL}${GLOBAL_OG_IMAGE}`,
          type: "image/webp",
          width: 1200,
          height: 630,
          alt: `${title} — Gli Attomatti`
        },
        {
          url: `${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`,
          secureUrl: `${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`,
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: `${title} — Gli Attomatti`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}${GLOBAL_OG_IMAGE_JPG}`, `${SITE_URL}${GLOBAL_OG_IMAGE}`]
    },
  };
}

export default async function LinksPage() {
  const content = await getContent();
  const linktree = content?.linktree;

  return <LinktreeClient initialData={linktree} fullContent={content} />;
}

