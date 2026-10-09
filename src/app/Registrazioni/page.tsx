import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContent } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import RegistrazioniClient from "./RegistrazioniClient";


export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const hub = content?.registration_hub;

  return createPageMetadata({
    title: hub?.title ? `${hub.title} — Gli Attomatti Zurigo` : "Iscrizioni & Corsi — Gli Attomatti Zurigo",
    description: hub?.description || "Iscrizione online ai laboratori teatrali, corsi e workshop della compagnia Gli Attomatti a Zurigo.",
    path: "/Registrazioni",
    keywords: ["iscrizioni teatro zurigo", "corsi teatro zurigo", "laboratorio teatrale italiano zurigo"]
  });
}

export default async function RegistrazioniHubPage() {
  const content = await getContent();
  const hub = content?.registration_hub;

  // If the hub is switched off in admin, redirect gracefully to /Iniziative
  if (hub && hub.active === false) {
    redirect("/Iniziative");
  }

  return <RegistrazioniClient content={content} />;
}
