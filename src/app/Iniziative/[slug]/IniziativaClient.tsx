"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DetailViewLayout } from "@/components/ui/DetailViewLayout";
import { trackViewContent, trackInitiateCheckout } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";
import { resolveSlugText } from "@/lib/contentResolver";

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
    const notFoundTitle = defaultText(detail.not_found_title, iniziative.not_found_title, "Iniziativa non trovata");
    const notFoundCta = defaultText(detail.not_found_cta, iniziative.back_to_list_label, "Torna all'elenco iniziative");

    return (
      <div className="pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        {notFoundTitle && (
          <h1 className="text-4xl font-bold mb-4">
            {notFoundTitle}
          </h1>
        )}
        {notFoundCta && (
          <Link href={iniziative.archive_href || "/Iniziative"} prefetch={false} className="text-primary font-bold hover:underline">
            {notFoundCta}
          </Link>
        )}
      </div>
    );
  }

  const editionPrefix = defaultText(detail.edition_prefix, iniziative.edition_prefix, "Edizione");
  const subtitle = initiative.year
    ? (editionPrefix ? `${editionPrefix} ${initiative.year}` : `${initiative.year}`)
    : null;

  return (
    <DetailViewLayout
      title={defaultText(initiative.title)}
      subtitle={subtitle}
      heroImage={initiative.hero_image}
      imageAlign={initiative.hero_image_align || initiative.image_align}
      backLink={{
        href: iniziative.archive_href || "/Iniziative",
        label: resolveSlugText(initiative.back_link_label, detail.back_link_label || iniziative.back_to_list_label, "Torna alle Iniziative")
      }}
      mainHeading={resolveSlugText(initiative.main_heading, detail.initiative_heading || iniziative.detail_main_heading, "L'Iniziativa")}
      text={defaultText(initiative.text)}
      galleryImages={initiative.images}
      datesTitle={resolveSlugText(initiative.dates_title, detail.dates_title || iniziative.detail_dates_title, "Date e Iscrizioni")}
      dates={initiative.dates}
      detailsTitle={resolveSlugText(initiative.details_title, detail.details_title || iniziative.detail_info_title, "Info Iniziativa")}
      details={initiative.details}
      emptyDatesMessage={resolveSlugText(initiative.empty_dates_message, detail.empty_dates || iniziative.detail_empty_dates_message, "Nessun calendario al momento programmato.")}
      photoGuideBadgeLabel={defaultText(content?.pages?.locations?.photo_guide_badge_label)}
      directionsBadgeLabel={defaultText(content?.pages?.locations?.directions_badge_label, "Indicazioni")}
      onTicketClick={(href) => trackInitiateCheckout(initiative.title, href, "iniziativa_sidebar")}
      lightboxUi={content?.ui?.lightbox}
      mobileCtaLabel={resolveSlugText(
        initiative.detail_cta_tickets_label || initiative.cta_tickets_label,
        detail.cta_tickets_label || iniziative.detail_cta_tickets_label
      )}
      mobileFloatingCtaLabel={resolveSlugText(
        initiative.detail_floating_cta_label || initiative.floating_cta_label,
        detail.floating_cta_label || iniziative.detail_floating_cta_label
      )}
    />
  );
}
