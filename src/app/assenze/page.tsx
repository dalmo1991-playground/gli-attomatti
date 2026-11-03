import { Metadata } from "next";
import { cookies } from "next/headers";
import { getContent } from "@/lib/data";
import { DEFAULT_MEMBERS, SpecialDate } from "@/types/absence";
import AbsencePinGate from "@/components/assenze/AbsencePinGate";
import AbsenceCalendar from "@/components/assenze/AbsenceCalendar";

export const metadata: Metadata = {
  title: "Calendario Assenze — Gli Attomatti",
  description: "Area riservata per la gestione delle assenze e delle disponibilità dei membri della compagnia Gli Attomatti.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AssenzePage() {
  const content = await getContent();
  const configuredMembers: string[] =
    content?.pages?.attori?.assenze_members && content.pages.attori.assenze_members.length > 0
      ? content.pages.attori.assenze_members
      : DEFAULT_MEMBERS;

  const specialDates: SpecialDate[] = content?.pages?.attori?.special_dates || [];

  const cookieStore = await cookies();
  const initialIsUnlocked = cookieStore.get("attomatti_assenze_auth")?.value === "1";

  return (
    <main className="min-h-screen bg-background text-foreground pb-16 pt-6">
      <AbsencePinGate initialIsUnlocked={initialIsUnlocked}>
        <AbsenceCalendar configuredMembers={configuredMembers} specialDates={specialDates} />
      </AbsencePinGate>
    </main>
  );
}

