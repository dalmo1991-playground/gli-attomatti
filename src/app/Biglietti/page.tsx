import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import BigliettiClient from "./BigliettiClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const hub = content?.ticketing_hub;

  return createPageMetadata({
    title: hub?.title ? `${hub.title} — Gli Attomatti Zurigo` : "Biglietteria & Prevendite — Gli Attomatti Zurigo",
    description: hub?.description || "Acquisto biglietti e prevendite online per gli spettacoli della compagnia teatrale Gli Attomatti a Zurigo.",
    path: "/Biglietti",
    keywords: ["biglietti teatro zurigo", "prevendita spettacoli zurigo", "eventfrog attomatti", "teatro italiano zurigo"]
  });
}

export default async function BigliettiHubPage() {
  const content = await getContent();
  const hub = content?.ticketing_hub;

  // If the hub is switched off in admin, redirect gracefully to /Spettacoli
  if (hub && hub.active === false) {
    redirect("/Spettacoli");
  }

  return <BigliettiClient content={content} />;
}
