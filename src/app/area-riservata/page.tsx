import { Metadata } from "next";
import { getContent } from "@/lib/data";
import { DEFAULT_MEMBERS, SpecialDate } from "@/types/absence";
import AreaRiservataHomeClient from "@/components/area-riservata/AreaRiservataHomeClient";

export const metadata: Metadata = {
  title: "Area Riservata — Gli Attomatti",
  description: "Hub di compagnia per la gestione di disponibilità, appuntamenti e risorse interne.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AreaRiservataPage() {
  const content = await getContent();
  const configuredMembers: string[] =
    content?.pages?.attori?.assenze_members && content.pages.attori.assenze_members.length > 0
      ? content.pages.attori.assenze_members
      : DEFAULT_MEMBERS;

  const specialDates: SpecialDate[] = content?.pages?.attori?.special_dates || [];

  return (
    <AreaRiservataHomeClient
      configuredMembers={configuredMembers}
      specialDates={specialDates}
    />
  );
}

