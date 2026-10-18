"use client";

import React, { useState } from "react";
import { Section } from "./Section";
import { DetailHero } from "./DetailHero";
import { BentoGallery } from "./BentoGallery";
import { DetailSidebar, DetailDate, DetailInfoItem } from "./DetailSidebar";
import { MobileTicketsBubble } from "./MobileTicketsBubble";
import { Lightbox, LightboxImage } from "./Lightbox";
import { RichText } from "./RichText";
import { ImageAlign } from "@/lib/imageAlign";

export interface DetailViewLayoutProps {
  title?: string | null;
  subtitle?: string | null;
  heroImage?: string;
  imageAlign?: ImageAlign;
  backLink?: {
    href: string;
    label?: string | null;
  } | null;
  mainHeading?: string | null;
  text?: string | null;
  galleryImages?: Array<{ url: string; alt?: string; caption?: string }>;
  datesTitle?: string | null;
  dates?: DetailDate[];
  detailsTitle?: string | null;
  details?: DetailInfoItem[];
  emptyDatesMessage?: string | null;
  photoGuideBadgeLabel?: string | null;
  directionsBadgeLabel?: string | null;
  onTicketClick?: (href: string) => void;
  lightboxUi?: any;
  children?: React.ReactNode;
  mobileCtaLabel?: string | null;
  mobileFloatingCtaLabel?: string | null;
  shareTitle?: string | null;
  shareItemTitle?: string;
  shareItemDescription?: string;
  shareUiContent?: Record<string, unknown>;
}

export function DetailViewLayout({
  title,
  subtitle,
  heroImage,
  imageAlign = "center",
  backLink,
  mainHeading,
  text,
  galleryImages = [],
  datesTitle,
  dates = [],
  detailsTitle,
  details = [],
  emptyDatesMessage,
  photoGuideBadgeLabel,
  directionsBadgeLabel,
  onTicketClick,
  lightboxUi,
  children,
  mobileCtaLabel,
  mobileFloatingCtaLabel,
  shareTitle,
  shareItemTitle,
  shareItemDescription,
  shareUiContent
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

  const hasDates = Boolean(dates && dates.length > 0);
  const effectiveMobileCtaLabel = mobileCtaLabel !== undefined ? mobileCtaLabel : (hasDates ? datesTitle : undefined);
  const effectiveFloatingLabel = mobileFloatingCtaLabel !== undefined ? mobileFloatingCtaLabel : effectiveMobileCtaLabel;

  const handleScrollToTickets = () => {
    const el = document.getElementById("biglietti");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <DetailHero
        title={title}
        heroImage={heroImage}
        imageAlign={imageAlign}
        backLink={backLink}
        subtitle={subtitle}
        mobileCtaLabel={hasDates ? effectiveMobileCtaLabel : undefined}
        onMobileCtaClick={handleScrollToTickets}
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

            {/* Mobile Sidebar: positioned after text/children and before photo gallery */}
            <div id="biglietti" className="block lg:hidden pt-4 pb-2 scroll-mt-28">
              <DetailSidebar
                datesTitle={datesTitle}
                dates={dates}
                detailsTitle={detailsTitle}
                details={details}
                emptyDatesMessage={emptyDatesMessage}
                photoGuideBadgeLabel={photoGuideBadgeLabel}
                directionsBadgeLabel={directionsBadgeLabel}
                onTicketClick={onTicketClick}
                shareTitle={shareTitle}
                shareItemTitle={shareItemTitle || (title || undefined)}
                shareItemDescription={shareItemDescription || (subtitle || undefined)}
                shareUiContent={shareUiContent}
              />
            </div>

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

          {/* Desktop Sidebar: visible only on lg screens and up */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <DetailSidebar
              datesTitle={datesTitle}
              dates={dates}
              detailsTitle={detailsTitle}
              details={details}
              emptyDatesMessage={emptyDatesMessage}
              photoGuideBadgeLabel={photoGuideBadgeLabel}
              directionsBadgeLabel={directionsBadgeLabel}
              onTicketClick={onTicketClick}
              shareTitle={shareTitle}
              shareItemTitle={shareItemTitle || (title || undefined)}
              shareItemDescription={shareItemDescription || (subtitle || undefined)}
              shareUiContent={shareUiContent}
            />
          </div>
        </div>
      </Section>

      {/* Mobile Floating Bubble while scrolling */}
      {hasDates && effectiveFloatingLabel && (
        <MobileTicketsBubble
          targetId="biglietti"
          label={effectiveFloatingLabel}
        />
      )}

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

