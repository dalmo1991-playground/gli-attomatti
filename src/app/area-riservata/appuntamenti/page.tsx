import { Metadata } from "next";
import { getContent } from "@/lib/data";
import { DEFAULT_MEMBERS, SpecialDate } from "@/types/absence";
import AppointmentsClient from "@/components/area-riservata/AppointmentsClient";

export const metadata: Metadata = {
  title: "Appuntamenti & Date Chiave — Area Riservata — Gli Attomatti",
  description: "Riepilogo spettacoli, prove generali e date chiave della compagnia Gli Attomatti con quadro presenze in tempo reale.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AreaRiservataAppuntamentiPage() {
  const content = await getContent();
  const configuredMembers: string[] =
    content?.pages?.attori?.assenze_members && content.pages.attori.assenze_members.length > 0
      ? content.pages.attori.assenze_members
      : DEFAULT_MEMBERS;

  const specialDates: SpecialDate[] = content?.pages?.attori?.special_dates || [];

  return (
    <AppointmentsClient
      configuredMembers={configuredMembers}
      specialDates={specialDates}
    />
  );
}

