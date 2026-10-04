"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import { DetailHero } from "@/components/ui/DetailHero";
import { BentoGallery } from "@/components/ui/BentoGallery";
import { DetailSidebar } from "@/components/ui/DetailSidebar";
import { trackViewContent } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function IniziativaDettaglioClient({ content: initialContent, slug }: { content: any, slug: string }) {
  const content = useLiveContent(initialContent);
  const iniziative = content?.pages?.iniziative || {};
  const initiative = (iniziative?.archive_sections || []).find((s: any) => s?.slug === slug);

  useEffect(() => {
    if (initiative?.title) {
      trackViewContent(initiative.title, "Iniziativa");
    }
  }, [initiative?.title]);

  const [lightbox, setLightbox] = useState<{ isOpen: boolean; index: number; images: LightboxImage[] }>({
    isOpen: false,
    index: 0,
    images: []
  });

  if (!initiative) {
    return (
      <div className="pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">
          {iniziative.not_found_title || "Iniziativa non trovata"}
        </h1>
        <Link href={iniziative.archive_href || "/Iniziative"} className="text-primary font-bold hover:underline">
          {iniziative.back_to_list_label || "Torna all'elenco iniziative"}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <DetailHero
        title={initiative.title}
        heroImage={initiative.hero_image}
        imageAlign={initiative.hero_image_align || initiative.image_align}
        backLink={{ href: iniziative.archive_href || "/Iniziative", label: iniziative.back_to_list_label || "Torna alle Iniziative" }}
        subtitle={`${iniziative.edition_prefix || "Edizione"} ${initiative.year}`}
      />

      {/* Description & Dates Section */}
      <Section className="py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">
          {/* Main Content */}
          <div className="lg:col-span-7 xl:col-span-8">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">
              {iniziative.detail_main_heading || "L'Iniziativa"}
            </h2>
            <div className="prose prose-xl prose-invert max-w-none">
              <RichText
                content={initiative.text}
                className="text-xl text-foreground/80 leading-relaxed"
              />
            </div>

            {/* Gallery with dynamic bento layout */}
            <BentoGallery
              images={initiative.images}
              title={initiative.title}
              onImageClick={(idx) => setLightbox({ isOpen: true, index: idx, images: initiative.images })}
            />
          </div>

          {/* Sidebar: Dates & Registration */}
          <div className="lg:col-span-5 xl:col-span-4">
            <DetailSidebar
              datesTitle={iniziative.detail_dates_title || "Date e Iscrizioni"}
              dates={initiative.dates}
              detailsTitle={iniziative.detail_info_title || "Info Iniziativa"}
              details={initiative.details}
              emptyDatesMessage={iniziative.detail_empty_dates_message || "Nessun calendario al momento programmato."}
            />
          </div>
        </div>
      </Section>

      <Lightbox 
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        uiContent={content?.ui?.lightbox}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
