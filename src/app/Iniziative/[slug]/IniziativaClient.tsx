"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DetailViewLayout } from "@/components/ui/DetailViewLayout";
import { trackViewContent } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function IniziativaDettaglioClient({
  content: initialContent,
  slug
}: {
  content: any;
  slug: string;
}) {
  const content = useLiveContent(initialContent);
  const iniziative = content?.pages?.iniziative || {};
  const initiative = (iniziative?.archive_sections || []).find((s: any) => s?.slug === slug);

  useEffect(() => {
    if (initiative?.title) {
      trackViewContent(initiative.title, "Iniziativa");
    }
  }, [initiative?.title]);

  const detail = iniziative.detail || {};

  if (!initiative) {
    return (
      <div className="pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">
          {detail.not_found_title || iniziative.not_found_title || "Iniziativa non trovata"}
        </h1>
        <Link href={iniziative.archive_href || "/Iniziative"} className="text-primary font-bold hover:underline">
          {detail.not_found_cta || iniziative.back_to_list_label || "Torna all'elenco iniziative"}
        </Link>
      </div>
    );
  }

  return (
    <DetailViewLayout
      title={initiative.title}
      subtitle={`${detail.edition_prefix || iniziative.edition_prefix || "Edizione"} ${initiative.year}`}
      heroImage={initiative.hero_image}
      imageAlign={initiative.hero_image_align || initiative.image_align}
      backLink={{
        href: iniziative.archive_href || "/Iniziative",
        label: detail.back_link_label || iniziative.back_to_list_label || "Torna alle Iniziative"
      }}
      mainHeading={detail.initiative_heading || iniziative.detail_main_heading || "L'Iniziativa"}
      text={initiative.text}
      galleryImages={initiative.images}
      datesTitle={detail.dates_title || iniziative.detail_dates_title || "Date e Iscrizioni"}
      dates={initiative.dates}
      detailsTitle={detail.details_title || iniziative.detail_info_title || "Info Iniziativa"}
      details={initiative.details}
      emptyDatesMessage={detail.empty_dates || iniziative.detail_empty_dates_message || "Nessun calendario al momento programmato."}
      photoGuideBadgeLabel={content?.pages?.locations?.photo_guide_badge_label}
      lightboxUi={content?.ui?.lightbox}
    />
  );
}
