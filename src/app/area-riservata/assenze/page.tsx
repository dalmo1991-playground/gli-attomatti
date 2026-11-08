import { Metadata } from "next";
import { getContent } from "@/lib/data";
import { DEFAULT_MEMBERS, SpecialDate } from "@/types/absence";
import AbsenceCalendar from "@/components/assenze/AbsenceCalendar";

export const metadata: Metadata = {
  title: "Calendario Assenze — Area Riservata — Gli Attomatti",
  description: "Gestione delle assenze e delle disponibilità dei membri della compagnia Gli Attomatti.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AreaRiservataAssenzePage() {
  const content = await getContent();
  const configuredMembers: string[] =
    content?.pages?.attori?.assenze_members && content.pages.attori.assenze_members.length > 0
      ? content.pages.attori.assenze_members
      : DEFAULT_MEMBERS;

  const specialDates: SpecialDate[] = content?.pages?.attori?.special_dates || [];

  return (
    <AbsenceCalendar
      configuredMembers={configuredMembers}
      specialDates={specialDates}
    />
  );
}

