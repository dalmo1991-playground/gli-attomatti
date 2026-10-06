"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Ticket,
  ChevronDown,
  Star,
  ExternalLink,
  Maximize2,
  ClipboardList,
  Play
} from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
import { FormattedText } from "./FormattedText";
import { CarouselBlock } from "./CarouselBlock";
import { ArchiveTimelineSection } from "./ArchiveTimelineSection";
import { CatalogCard, CatalogGrid } from "./CatalogCard";
import { EmbeddedFrameView } from "./EmbeddedFrameView";
import { getBlockAnchor } from "@/lib/landingAnchors";
import { getImagePositionClass, getImageObjectPositionStyle } from "@/lib/imageAlign";
import { getPageHeroTitleSizeClass, getTaglineSizeClass } from "@/lib/typography";
import { trackInitiateCheckout } from "@/lib/tracking";
import { PageBlock } from "@/lib/pageBlocks";
import { isYouTubeUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

export interface PageBlockRendererProps {
  blocks: PageBlock[];
  pageTitle?: string;
  defaults?: any;
  onAnchorClick?: (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => void;
  onImageClick?: (index: number, images: any[]) => void;
  className?: string;
}

export function PageBlockRenderer({
  blocks,
  pageTitle = "Gli Attomatti",
  defaults = {},
  onAnchorClick,
  onImageClick,
  className
}: PageBlockRendererProps) {
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });

  const toggleFaq = (idx: number) => {
    setFaqOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAnchorClickInternal = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (onAnchorClick) {
      onAnchorClick(e, href);
      return;
    }
    if (href && href.startsWith("#")) {
      const targetId = href.replace(/^#/, "");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth" });
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", href);
        }
      }
    }
  };

  const activeBlocks = (blocks || []).filter((b) => b && b.enabled !== false);

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {activeBlocks.map((block: any, bIdx: number) => {
        switch (block.type) {
          /* ================= 1. HERO BLOCK ================= */
          case "hero": {
            const anchor = getBlockAnchor(block, "hero");
            const isHeroVideo = isYouTubeUrl(block.hero_image);
            const heroDisplaySrc = isHeroVideo
              ? getYouTubeThumbnailUrl(block.hero_image, "max")
              : block.hero_image?.trim() || "/images/1782553290530-TheaterCurtain.webp";

            return (
              <section
                key={block.id || bIdx}
                id={anchor}
                className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-4 sm:px-6"
              >
                {/* Background image & gradient overlay */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={heroDisplaySrc}
                    alt={block.title || defaults.hero_image_alt || "Hero"}
                    fill
                    sizes="100vw"
                    className={cn(
                      "object-cover opacity-35 scale-105 transition-transform duration-1000",
                      getImagePositionClass(block.hero_image_align)
                    )}
                    style={{ objectPosition: getImageObjectPositionStyle(block.hero_image_align) }}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background z-10" />
                  <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none z-10" />
                  <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none z-10" />
                </div>

                <div className="relative z-20 text-center max-w-4xl mx-auto space-y-8 pt-8">
                  {block.badge && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/10">
                      <span>{stripHtml(block.badge)}</span>
                    </div>
                  )}

                  <h1
                    className={cn(
                      getPageHeroTitleSizeClass(block.title),
                      "font-black uppercase tracking-tight text-foreground text-balance drop-shadow-md"
                    )}
                  >
                    {stripHtml(block.title)}
                  </h1>

                  {block.tagline && (
                    <p
                      className={cn(
                        getTaglineSizeClass(block.tagline),
                        "text-foreground/80 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-xs"
                      )}
                    >
                      <FormattedText text={block.tagline} />
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    {block.primary_cta_label && (
                      <Link
                        href={block.primary_cta_href || "#"}
                        onClick={(e) => handleAnchorClickInternal(e, block.primary_cta_href)}
                        target={block.primary_cta_href?.startsWith("http") ? "_blank" : undefined}
                        rel={block.primary_cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Ticket size={18} />
                        <span>{block.primary_cta_label}</span>
                      </Link>
                    )}

                    {block.secondary_cta_label && (
                      <Link
                        href={block.secondary_cta_href || "#"}
                        onClick={(e) => handleAnchorClickInternal(e, block.secondary_cta_href)}
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/15 font-bold text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <span>{block.secondary_cta_label}</span>
                        <ChevronDown size={16} className="text-foreground/60" />
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 2. EVENT DETAILS BLOCK ================= */
          case "event_details": {
            const anchor = getBlockAnchor(block, "event_details");
            return (
              <section key={block.id || bIdx} id={anchor} className="py-16 px-4 sm:px-6 scroll-mt-24 relative">
                <div className="max-w-4xl mx-auto">
                  <div className="p-8 sm:p-12 rounded-[2.5rem] bg-muted/20 border border-foreground/10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="space-y-6 flex-1">
                        {block.info_badge && (
                          <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            {stripHtml(block.info_badge)}
                          </span>
                        )}

                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                          {stripHtml(block.title || defaults.event_details_title || "Data e Informazioni")}
                        </h2>

                        <div className="space-y-4">
                          {block.date && (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <Calendar size={18} />
                              </div>
                              <div>
                                <div className="text-xs uppercase font-bold text-foreground/40 tracking-wider">
                                  {defaults.date_time_label || "Data & Ora"}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-foreground">
                                  {stripHtml(block.date)}
                                </div>
                              </div>
                            </div>
                          )}

                          {block.location && (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <MapPin size={18} />
                              </div>
                              <div>
                                <div className="text-xs uppercase font-bold text-foreground/40 tracking-wider">
                                  {defaults.location_label || "Luogo"}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-foreground">
                                  {stripHtml(block.location)}
                                </div>
                                {block.location_href && (
                                  <Link
                                    href={block.location_href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-primary mt-1 font-bold transition-colors"
                                  >
                                    <span>{defaults.google_maps_label || "Apri su Google Maps"}</span>
                                    <ExternalLink size={12} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price & CTA Column */}
                      <div className="flex flex-col items-center sm:items-end justify-center gap-4 border-t md:border-t-0 md:border-l border-foreground/10 pt-6 md:pt-0 md:pl-8 shrink-0">
                        {block.price && (
                          <div className="text-center sm:text-right">
                            <span className="text-xs text-foreground/40 uppercase tracking-widest font-bold block">
                              {defaults.ticket_label || "Biglietto"}
                            </span>
                            <span className="text-3xl sm:text-4xl font-black text-foreground drop-shadow-xs">
                              {stripHtml(block.price)}
                            </span>
                          </div>
                        )}

                        {block.cta_label && (
                          <Link
                            href={block.cta_href || "#"}
                            onClick={(e) => handleAnchorClickInternal(e, block.cta_href)}
                            target={block.cta_href?.startsWith("http") ? "_blank" : undefined}
                            rel={block.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:scale-105 flex items-center gap-2"
                          >
                            <Ticket size={16} />
                            <span>{block.cta_label}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 3. CAROUSEL BLOCK ================= */
          case "carousel": {
            const carouselImages = block.images || [];
            if (carouselImages.length === 0) return null;
            const anchor = getBlockAnchor(block, "carousel");

            return (
              <section key={block.id || bIdx} id={anchor} className="py-16 px-4 sm:px-6 scroll-mt-24">
                <div className="max-w-4xl mx-auto space-y-6">
                  {block.title && (
                    <div className="text-center">
                      <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
                        {block.title}
                      </h2>
                      <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                    </div>
                  )}

                  <CarouselBlock
                    images={carouselImages}
                    fallbackAlt={block.title || pageTitle}
                    aspectRatioClass={block.aspect_ratio || "aspect-video md:aspect-[16/10]"}
                    autoplayIntervalMs={block.autoplay_interval_ms || 4000}
                    onImageClick={(imgIdx) => {
                      if (onImageClick) {
                        onImageClick(imgIdx, carouselImages);
                      }
                    }}
                  />
                </div>
              </section>
            );
          }

          /* ================= 4. TIMELINE / ARCHIVE SECTION BLOCK ================= */
          case "timeline_section": {
            const anchor = getBlockAnchor(block, "timeline_section");
            return (
              <div key={block.id || bIdx} id={anchor} className="scroll-mt-24">
                <ArchiveTimelineSection
                  title={block.title}
                  badge={block.badge}
                  badgePrefix={block.badge_prefix}
                  text={block.text}
                  href={block.cta_href}
                  ctaLabel={block.cta_label}
                  isAlternate={block.is_alternate}
                >
                  {block.images && block.images.length > 0 && (
                    <CarouselBlock
                      images={block.images}
                      fallbackAlt={block.title}
                      onImageClick={(imgIdx) => {
                        if (onImageClick) {
                          onImageClick(imgIdx, block.images);
                        }
                      }}
                    />
                  )}
                </ArchiveTimelineSection>
              </div>
            );
          }

          /* ================= 5. CATALOG GRID BLOCK ================= */
          case "catalog_grid": {
            const items = block.items || [];
            if (items.length === 0) return null;
            const anchor = getBlockAnchor(block, "catalog_grid");

            return (
              <section key={block.id || bIdx} id={anchor} className="py-16 px-4 sm:px-6 scroll-mt-24">
                <div className="max-w-6xl mx-auto space-y-8">
                  {block.title && (
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                      <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
                        {block.title}
                      </h2>
                      {block.description && (
                        <p className="text-foreground/70 text-base sm:text-lg">
                          <FormattedText text={block.description} />
                        </p>
                      )}
                    </div>
                  )}

                  <CatalogGrid>
                    {items.map((item: any, iIdx: number) => (
                      <CatalogCard
                        key={item.id || item.slug || iIdx}
                        index={iIdx}
                        item={{
                          id: item.id || `catalog-${iIdx}`,
                          title: item.title,
                          category: item.category,
                          date: item.date,
                          location: item.location,
                          image: item.image,
                          description: item.description,
                          primaryHref: item.action_url || item.primary_href || "#",
                          primaryLabel: item.action_label || item.primary_label || "Scopri",
                          secondaryHref: item.detail_url || item.secondary_href,
                          secondaryLabel: item.detail_label || item.secondary_label
                        }}
                      />
                    ))}
                  </CatalogGrid>
                </div>
              </section>
            );
          }

          /* ================= 6. EVENTFROG EMBED BLOCK ================= */
          case "eventfrog": {
            const rawUrl = block.eventfrog_url?.trim() || "";
            let embedUrl = rawUrl;
            if (rawUrl) {
              try {
                const u = new URL(rawUrl);
                u.protocol = "https:";
                embedUrl = u.toString();
              } catch {
                embedUrl = rawUrl;
              }
            }

            const anchor = getBlockAnchor(block, "eventfrog");
            return (
              <div key={block.id || bIdx} id={anchor} className="scroll-mt-24">
                <EmbeddedFrameView
                  title={block.title || defaults.eventfrog_title || "Acquista Biglietti"}
                  category={defaults.eventfrog_badge || "Biglietteria Ufficiale"}
                  categoryIcon={Ticket}
                  description={block.subtitle}
                  embedUrl={embedUrl}
                  directUrl={rawUrl}
                  backHref="/"
                  backLabel={defaults.back_to_site || "Torna al sito"}
                  legalHref="/Termini"
                  legalLabel={defaults.eventfrog_terms_link || "Termini di Biglietteria"}
                  iframeTitle={block.title || "Biglietti Eventfrog"}
                  fallbackButtonLabel={block.fallback_label || defaults.eventfrog_fallback_button || "Apri su Eventfrog"}
                  onDirectClick={() => trackInitiateCheckout(pageTitle, embedUrl)}
                />
              </div>
            );
          }

          /* ================= 7. TALLY EMBED BLOCK ================= */
          case "tally": {
            const rawUrl = block.tally_url?.trim() || "";
            let embedUrl = rawUrl;
            if (rawUrl) {
              try {
                const match = rawUrl.match(/tally\.so\/(?:r|embed)\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                  embedUrl = `https://tally.so/embed/${match[1]}?alignLeft=1&transparentBackground=0`;
                } else {
                  const u = new URL(rawUrl);
                  u.protocol = "https:";
                  embedUrl = u.toString();
                }
              } catch {
                embedUrl = rawUrl;
              }
            }

            const anchor = getBlockAnchor(block, "tally");
            return (
              <div key={block.id || bIdx} id={anchor} className="scroll-mt-24">
                <EmbeddedFrameView
                  title={block.title || defaults.tally_title || "Modulo di Iscrizione"}
                  category={defaults.tally_badge || "Iscrizione Online"}
                  categoryIcon={ClipboardList}
                  description={block.subtitle}
                  embedUrl={embedUrl}
                  directUrl={rawUrl}
                  backHref="/"
                  backLabel={defaults.back_to_site || "Torna al sito"}
                  legalHref="/Privacy"
                  legalLabel={defaults.tally_privacy_link || "Informativa Privacy"}
                  iframeTitle={block.title || "Modulo Tally"}
                  fallbackButtonLabel={block.fallback_label || defaults.tally_fallback_button || "Apri su Tally"}
                  dataTallySrc={embedUrl}
                />
              </div>
            );
          }

          /* ================= 8. SYNOPSIS BLOCK ================= */
          case "synopsis": {
            const anchor = getBlockAnchor(block, "synopsis");
            return (
              <section key={block.id || bIdx} id={anchor} className="py-20 px-4 sm:px-6 scroll-mt-24 relative">
                <div className="max-w-4xl mx-auto space-y-12">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
                      {block.title || defaults.synopsis_title || "La Trama"}
                    </h2>
                    <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className={cn("space-y-6", block.image ? "md:col-span-7" : "md:col-span-12")}>
                      <div className="text-lg sm:text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                        <FormattedText text={block.text} />
                      </div>

                      {block.quote && (
                        <div className="p-6 sm:p-8 rounded-3xl bg-muted/20 border-l-4 border-primary/60 space-y-3">
                          <p className="italic text-base sm:text-lg text-foreground/90 font-serif leading-relaxed">
                            &ldquo;<FormattedText text={block.quote} />&rdquo;
                          </p>
                          {block.quote_author && (
                            <p className="text-xs uppercase font-black tracking-wider text-foreground/60">
                              — <FormattedText text={block.quote_author} />
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {block.image && (
                      <div className="md:col-span-5">
                        <div
                          onClick={() => {
                            if (isYouTubeUrl(block.image) && onImageClick) {
                              onImageClick(0, [{ url: block.image, alt: block.title }]);
                            }
                          }}
                          className={cn(
                            "relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 group hover:border-foreground/20 transition-colors",
                            isYouTubeUrl(block.image) && "cursor-pointer"
                          )}
                        >
                          <Image
                            src={
                              isYouTubeUrl(block.image)
                                ? getYouTubeThumbnailUrl(block.image, "hq")
                                : block.image
                            }
                            alt={block.title || defaults.synopsis_image_alt || "Foto spettacolo"}
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          {isYouTubeUrl(block.image) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                              <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Play size={24} className="fill-white ml-0.5" />
                              </div>
                              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider border border-white/10">
                                <Play size={10} className="fill-white" /> Guarda Video
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 9. GALLERY BLOCK ================= */
          case "gallery": {
            const galleryImages = block.images || [];
            if (galleryImages.length === 0) return null;
            const anchor = getBlockAnchor(block, "gallery");

            return (
              <section key={block.id || bIdx} id={anchor} className="py-20 px-4 sm:px-6 bg-muted/10 scroll-mt-24 relative">
                <div className="max-w-5xl mx-auto space-y-12">
                  {block.title && (
                    <div className="text-center">
                      <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
                        {block.title}
                      </h2>
                      <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
                    {galleryImages.map((img: any, gIdx: number) => {
                      const isVideo = isYouTubeUrl(img.url);
                      const displaySrc = isVideo
                        ? getYouTubeThumbnailUrl(img.url)
                        : img.url?.trim() || "/images/1782553290530-TheaterCurtain.webp";
                      const total = galleryImages.length;
                      const layoutClasses =
                        total === 1
                          ? "sm:col-span-12 aspect-[16/10]"
                          : total === 2
                          ? gIdx === 0
                            ? "sm:col-span-7 h-[280px] sm:h-[360px]"
                            : "sm:col-span-5 h-[280px] sm:h-[360px]"
                          : gIdx === 0
                          ? "sm:col-span-12 aspect-[16/9]"
                          : gIdx % 2 === 0
                          ? "sm:col-span-7 h-[280px] sm:h-[340px]"
                          : "sm:col-span-5 h-[280px] sm:h-[340px]";

                      return (
                        <div
                          key={gIdx}
                          onClick={() => {
                            if (onImageClick) {
                              onImageClick(gIdx, galleryImages);
                            }
                          }}
                          className={cn(
                            "relative w-full rounded-3xl overflow-hidden bg-muted shadow-xl border border-foreground/5 cursor-pointer group hover:border-foreground/20 transition-all",
                            layoutClasses
                          )}
                        >
                          <Image
                            src={displaySrc}
                            alt={img.alt || defaults.gallery_image_alt || "Scena"}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className={`transition-transform duration-700 ${img.no_crop ? "object-contain" : "object-cover group-hover:scale-105"}`}
                          />
                          {isVideo ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Play size={20} className="fill-white ml-0.5" />
                              </div>
                              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider border border-white/10">
                                <Play size={9} className="fill-white" /> Video
                              </div>
                            </div>
                          ) : (
                            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg pointer-events-none">
                              <Maximize2 size={14} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 10. REVIEWS BLOCK ================= */
          case "reviews": {
            const reviews = block.items || [];
            if (reviews.length === 0) return null;
            const anchor = getBlockAnchor(block, "reviews");

            return (
              <section key={block.id || bIdx} id={anchor} className="py-20 px-4 sm:px-6 scroll-mt-24 relative">
                <div className="max-w-4xl mx-auto space-y-12">
                  <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
                      {block.title || defaults.reviews_title || "Dicono di Noi"}
                    </h2>
                    <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((rev: any, rIdx: number) => (
                      <div
                        key={rIdx}
                        className="p-8 rounded-[2rem] bg-muted/15 border border-foreground/5 space-y-4 flex flex-col justify-between hover:border-foreground/15 transition-colors glass"
                      >
                        <div className="flex gap-1 text-accent mb-2">
                          {[...Array(rev.rating || 5)].map((_, s) => (
                            <Star key={s} size={16} fill="currentColor" />
                          ))}
                        </div>

                        <p className="italic font-serif text-lg text-foreground/85 leading-snug">
                          &ldquo;<FormattedText text={rev.quote} />&rdquo;
                        </p>

                        <div className="text-xs uppercase font-black tracking-wider text-foreground/60 pt-2 border-t border-foreground/5 flex items-center gap-1.5">
                          {stripHtml(rev.author)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 11. FAQ BLOCK ================= */
          case "faq": {
            const faqs = block.items || [];
            if (faqs.length === 0) return null;
            const anchor = getBlockAnchor(block, "faq");

            return (
              <section key={block.id || bIdx} id={anchor} className="py-20 px-4 sm:px-6 bg-muted/10 scroll-mt-24 relative">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
                      {block.title || defaults.faq_title || "Domande Frequenti"}
                    </h2>
                    <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                  </div>

                  <div className="space-y-4">
                    {faqs.map((f: any, fIdx: number) => {
                      const isOpen = faqOpen[fIdx];
                      return (
                        <div
                          key={fIdx}
                          className={cn(
                            "rounded-2xl border bg-background/80 overflow-hidden transition-colors",
                            isOpen ? "border-foreground/20 bg-muted/20" : "border-foreground/10"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(fIdx)}
                            className="w-full p-5 text-left font-bold text-base flex justify-between items-center gap-4 hover:text-foreground transition-colors cursor-pointer"
                          >
                            <span className="text-foreground">{stripHtml(f.question)}</span>
                            <ChevronDown
                              size={18}
                              className={cn(
                                "shrink-0 transition-transform duration-300 text-foreground/40",
                                isOpen && "rotate-180 text-foreground"
                              )}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-5 pb-5 text-foreground/70 text-sm leading-relaxed border-t border-foreground/5 pt-4 whitespace-pre-wrap">
                                  <FormattedText text={f.answer} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 12. CLOSING CTA BLOCK ================= */
          case "closing_cta": {
            const anchor = getBlockAnchor(block, "closing_cta");
            return (
              <section key={block.id || bIdx} id={anchor} className="py-24 px-4 sm:px-6 relative overflow-hidden scroll-mt-24">
                <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
                  <div className="p-10 sm:p-16 rounded-[3rem] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="space-y-6 max-w-2xl mx-auto">
                      <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
                        {block.title || defaults.closing_cta_title || "Unisciti a Noi"}
                      </h2>
                      {block.text && (
                        <p className="text-base sm:text-xl text-foreground/80 leading-relaxed font-medium">
                          <FormattedText text={block.text} />
                        </p>
                      )}
                      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {block.cta_label && (
                          <Link
                            href={block.cta_href || "#"}
                            onClick={(e) => handleAnchorClickInternal(e, block.cta_href)}
                            target={block.cta_href?.startsWith("http") ? "_blank" : undefined}
                            rel={block.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="w-full sm:w-auto px-10 py-5 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Ticket size={18} />
                            <span>{block.cta_label}</span>
                          </Link>
                        )}
                        {block.secondary_cta_label && (
                          <Link
                            href={block.secondary_cta_href || "#"}
                            onClick={(e) => handleAnchorClickInternal(e, block.secondary_cta_href)}
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/15 font-bold text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <span>{block.secondary_cta_label}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          /* ================= 13. RICH TEXT BLOCK ================= */
          case "rich_text": {
            const anchor = getBlockAnchor(block, "rich_text");
            return (
              <section key={block.id || bIdx} id={anchor} className="py-16 px-4 sm:px-6 scroll-mt-24">
                <div className="max-w-3xl mx-auto space-y-6">
                  {block.title && (
                    <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
                      {block.title}
                    </h2>
                  )}
                  <div className="text-foreground/80 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    <FormattedText text={block.content || ""} />
                  </div>
                </div>
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
