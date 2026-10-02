"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import { DetailHero } from "@/components/ui/DetailHero";
import { BentoGallery } from "@/components/ui/BentoGallery";
import { DetailSidebar } from "@/components/ui/DetailSidebar";
import { trackInitiateCheckout, trackViewContent } from "@/lib/tracking";

export default function SpettacoloDettaglioClient({ content, slug }: { content: any, slug: string }) {
  const show = (content?.pages?.spettacoli?.archive_sections || []).find((s: any) => s?.slug === slug);

  useEffect(() => {
    if (show?.title) {
      trackViewContent(show.title, "Spettacolo");
    }
  }, [show?.title]);

  const [lightbox, setLightbox] = useState<{ isOpen: boolean; index: number; images: LightboxImage[] }>({
    isOpen: false,
    index: 0,
    images: []
  });

  if (!show) {
    return (
      <div className="pt-32 text-center">
        <h1 className="text-4xl font-bold">Spettacolo non trovato</h1>
        <Link href="/Spettacoli" className="text-primary mt-4 inline-block">Torna all'archivio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <DetailHero
        title={show.title}
        heroImage={show.hero_image}
        backLink={{ href: "/Spettacoli", label: "Torna all'Archivio" }}
        subtitle={`Stagione ${show.year}`}
      />

      {/* Description & Dates Section */}
      <Section className="py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">
          {/* Main Content */}
          <div className="lg:col-span-7 xl:col-span-8">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Lo Spettacolo</h2>
            <div className="prose prose-xl prose-invert max-w-none">
              <RichText
                content={show.text}
                className="text-xl text-foreground/80 leading-relaxed"
              />
            </div>

            {/* Gallery with dynamic bento layout */}
            <BentoGallery
              images={show.images}
              title={show.title}
              onImageClick={(idx) => setLightbox({ isOpen: true, index: idx, images: show.images })}
            />
          </div>

          {/* Sidebar: Dates & Details */}
          <div className="lg:col-span-5 xl:col-span-4">
            <DetailSidebar
              datesTitle="Date e Biglietti"
              dates={show.dates}
              detailsTitle="Info Spettacolo"
              details={show.details}
              emptyDatesMessage="Nessuna data futura programmata per questo spettacolo."
              onTicketClick={(href) => trackInitiateCheckout(show.title, href)}
            />
          </div>
        </div>
      </Section>

      <Lightbox 
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
