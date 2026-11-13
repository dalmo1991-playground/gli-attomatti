import { Metadata } from "next";
import { getContent } from "@/lib/data";
import { DEFAULT_MEMBERS } from "@/types/absence";
import { TallyFormConfig } from "@/types/tally";
import TallyCheckinClient from "@/components/area-riservata/TallyCheckinClient";

export const metadata: Metadata = {
  title: "Iscrizioni & Check-in — Area Riservata",
  description: "Consultazione iscrizioni Tally, conteggio partecipanti e check-in in sala.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AreaRiservataCheckinPage() {
  const content = await getContent();
  const forms: TallyFormConfig[] = (content?.tally_checkin_forms || []).filter(
    (f: TallyFormConfig) => f && f.enabled !== false && f.id
  );
  const configuredMembers: string[] =
    content?.pages?.attori?.assenze_members && content.pages.attori.assenze_members.length > 0
      ? content.pages.attori.assenze_members
      : DEFAULT_MEMBERS;

  return <TallyCheckinClient forms={forms} configuredMembers={configuredMembers} />;
}

