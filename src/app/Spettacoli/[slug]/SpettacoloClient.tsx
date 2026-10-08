"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DetailViewLayout } from "@/components/ui/DetailViewLayout";
import { trackInitiateCheckout, trackViewContent } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function SpettacoloDettaglioClient({
  content: initialContent,
  slug
}: {
  content: any;
  slug: string;
}) {
  const content = useLiveContent(initialContent);
  const spettacoli = content?.pages?.spettacoli || {};
  const show = (spettacoli?.archive_sections || []).find((s: any) => s?.slug === slug);

  useEffect(() => {
    if (show?.title) {
      trackViewContent(show.title, "Spettacolo");
    }
  }, [show?.title]);

  if (!show) {
    const notFoundTitle = defaultText(spettacoli.not_found_title, "Spettacolo non trovato");
    const backLabel = defaultText(spettacoli.back_to_archive_label, "Torna all'archivio");

    return (
      <div className="pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        {notFoundTitle && <h1 className="text-4xl font-bold">{notFoundTitle}</h1>}
        {backLabel && (
          <Link href={spettacoli.archive_href || "/Spettacoli"} className="text-primary mt-4 inline-block font-bold hover:underline">
            {backLabel}
          </Link>
        )}
      </div>
    );
  }

  const seasonPrefix = defaultText(spettacoli.season_prefix, "Stagione");
  const subtitle = show.year
    ? (seasonPrefix ? `${seasonPrefix} ${show.year}` : `${show.year}`)
    : null;

  return (
    <DetailViewLayout
      title={defaultText(show.title)}
      subtitle={subtitle}
      heroImage={show.hero_image}
      imageAlign={show.hero_image_align || show.image_align}
      backLink={{
        href: spettacoli.archive_href || "/Spettacoli",
        label: defaultText(spettacoli.back_to_archive_label, "Torna all'Archivio")
      }}
      mainHeading={defaultText(spettacoli.detail_main_heading, "Lo Spettacolo")}
      text={defaultText(show.text)}
      galleryImages={show.images}
      datesTitle={defaultText(show.dates_title, spettacoli.detail_dates_title, "Date e Biglietti")}
      dates={show.dates}
      detailsTitle={defaultText(spettacoli.detail_info_title, "Info Spettacolo")}
      details={show.details}
      emptyDatesMessage={defaultText(spettacoli.detail_empty_dates_message, "Nessuna data futura programmata per questo spettacolo.")}
      photoGuideBadgeLabel={defaultText(content?.pages?.locations?.photo_guide_badge_label)}
      onTicketClick={(href) => trackInitiateCheckout(show.title, href)}
      lightboxUi={content?.ui?.lightbox}
      mobileCtaLabel={defaultText(
        show.detail_cta_tickets_label,
        show.cta_tickets_label,
        spettacoli.detail_cta_tickets_label
      )}
      mobileFloatingCtaLabel={defaultText(
        show.detail_floating_cta_label,
        show.floating_cta_label,
        spettacoli.detail_floating_cta_label
      )}
    />
  );
}
