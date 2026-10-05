"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DetailViewLayout } from "@/components/ui/DetailViewLayout";
import { trackInitiateCheckout, trackViewContent } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

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
    return (
      <div className="pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">{spettacoli.not_found_title || "Spettacolo non trovato"}</h1>
        <Link href={spettacoli.archive_href || "/Spettacoli"} className="text-primary mt-4 inline-block font-bold hover:underline">
          {spettacoli.back_to_archive_label || "Torna all'archivio"}
        </Link>
      </div>
    );
  }

  return (
    <DetailViewLayout
      title={show.title}
      subtitle={`${spettacoli.season_prefix || "Stagione"} ${show.year}`}
      heroImage={show.hero_image}
      imageAlign={show.hero_image_align || show.image_align}
      backLink={{
        href: spettacoli.archive_href || "/Spettacoli",
        label: spettacoli.back_to_archive_label || "Torna all'Archivio"
      }}
      mainHeading={spettacoli.detail_main_heading || "Lo Spettacolo"}
      text={show.text}
      galleryImages={show.images}
      datesTitle={spettacoli.detail_dates_title || "Date e Biglietti"}
      dates={show.dates}
      detailsTitle={spettacoli.detail_info_title || "Info Spettacolo"}
      details={show.details}
      emptyDatesMessage={spettacoli.detail_empty_dates_message || "Nessuna data futura programmata per questo spettacolo."}
      onTicketClick={(href) => trackInitiateCheckout(show.title, href)}
      lightboxUi={content?.ui?.lightbox}
    />
  );
}
