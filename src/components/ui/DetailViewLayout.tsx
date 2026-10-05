"use client";

import React, { useState } from "react";
import { Section } from "./Section";
import { DetailHero } from "./DetailHero";
import { BentoGallery } from "./BentoGallery";
import { DetailSidebar, DetailDate, DetailInfoItem } from "./DetailSidebar";
import { Lightbox, LightboxImage } from "./Lightbox";
import { RichText } from "./RichText";
import { ImageAlign } from "@/lib/imageAlign";

export interface DetailViewLayoutProps {
  title: string;
  subtitle?: string;
  heroImage?: string;
  imageAlign?: ImageAlign;
  backLink: {
    href: string;
    label: string;
  };
  mainHeading?: string;
  text?: string;
  galleryImages?: Array<{ url: string; alt?: string; caption?: string }>;
  datesTitle?: string;
  dates?: DetailDate[];
  detailsTitle?: string;
  details?: DetailInfoItem[];
  emptyDatesMessage?: string;
  onTicketClick?: (href: string) => void;
  lightboxUi?: any;
  children?: React.ReactNode;
}

export function DetailViewLayout({
  title,
  subtitle,
  heroImage,
  imageAlign = "center",
  backLink,
  mainHeading = "Descrizione",
  text,
  galleryImages = [],
  datesTitle = "Date e Biglietti",
  dates = [],
  detailsTitle = "Informazioni",
  details = [],
  emptyDatesMessage = "Nessuna data programmata al momento.",
  onTicketClick,
  lightboxUi,
  children
}: DetailViewLayoutProps) {
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: LightboxImage[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  const validImages: LightboxImage[] = (galleryImages || []).filter(
    (img) => img && typeof img.url === "string" && img.url.trim().length > 0
  );

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <DetailHero
        title={title}
        heroImage={heroImage}
        imageAlign={imageAlign}
        backLink={backLink}
        subtitle={subtitle}
      />

      {/* Description, Gallery & Sidebar */}
      <Section className="py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">
          {/* Main Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {mainHeading && (
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">
                {mainHeading}
              </h2>
            )}

            {text && (
              <div className="prose prose-xl prose-invert max-w-none">
                <RichText
                  content={text}
                  className="text-xl text-foreground/80 leading-relaxed"
                />
              </div>
            )}

            {children}

            {validImages.length > 0 && (
              <BentoGallery
                images={validImages}
                title={title}
                onImageClick={(idx) =>
                  setLightbox({
                    isOpen: true,
                    index: idx,
                    images: validImages
                  })
                }
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <DetailSidebar
              datesTitle={datesTitle}
              dates={dates}
              detailsTitle={detailsTitle}
              details={details}
              emptyDatesMessage={emptyDatesMessage}
              onTicketClick={onTicketClick}
            />
          </div>
        </div>
      </Section>

      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        uiContent={lightboxUi}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
