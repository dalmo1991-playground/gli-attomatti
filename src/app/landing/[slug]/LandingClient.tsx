"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
  Maximize2,
  Info,
  ShieldCheck,
  ClipboardList,
  X,
  Sparkles,
  Clock,
  Lock,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { getPageHeroTitleSizeClass, getTaglineSizeClass } from "@/lib/typography";
import { getLandingTheme, getLandingThemeStyles } from "@/lib/landingThemes";
import { trackInitiateCheckout } from "@/lib/tracking";

interface LandingClientProps {
  landing: any;
  site: any;
}

export default function LandingClient({ landing, site }: LandingClientProps) {
  const blocks = landing.blocks || [];
  const header = landing.header || {};
  const stickyBar = landing.sticky_bar || {};

  const initialTheme = useMemo(() => getLandingTheme(landing), [landing]);
  const [theme, setTheme] = useState(initialTheme);
  const themeStyles = getLandingThemeStyles(theme);

  useEffect(() => {
    setTheme(getLandingTheme(landing));
  }, [landing]);

  // Listen to live dev theme modifications for this specific landing page
  useEffect(() => {
    if (typeof window === "undefined" || !landing?.slug) return;
    try {
      const saved = localStorage.getItem(`attomatti_landing_theme_${landing.slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.background === "string" && typeof parsed.primary === "string") {
          setTheme((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.error("Failed to load dev theme for landing", e);
    }

    const handleThemeChange = (e: any) => {
      if (e.detail?.slug === landing.slug && e.detail?.colors) {
        setTheme((prev) => ({ ...prev, ...e.detail.colors }));
      }
    };
    window.addEventListener("attomatti_landing_theme_change", handleThemeChange);
    return () => window.removeEventListener("attomatti_landing_theme_change", handleThemeChange);
  }, [landing?.slug]);

  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: LightboxImage[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  const toggleFaq = (idx: number) => {
    setFaqOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div
      id="landing-root"
      data-landing-slug={landing?.slug}
      data-landing-theme={JSON.stringify(initialTheme)}
      style={themeStyles}
      className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-300"
    >
      {/* 1. Standalone Minimal Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5 h-20 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            title="Torna alla Home"
          >
            <Image
              src={header.logo_image?.trim() || "/logo_attomatti.svg"}
              alt={header.logo_text || site?.name || "Gli Attomatti"}
              width={40}
              height={40}
              className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
              priority
            />
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider uppercase">
                {header.logo_text || site?.name || "Gli Attomatti"}
              </span>
              <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                Teatro a Zurigo
              </span>
            </div>
          </Link>

          {header.cta_label && (
            <Link
              href={header.cta_href || "#"}
              target={header.cta_href?.startsWith("http") ? "_blank" : undefined}
              rel={header.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
            >
              <Ticket size={14} />
              <span>{header.cta_label}</span>
            </Link>
          )}
        </div>
      </header>

      {/* 2. Dynamic Landing Blocks */}
      <main className="pt-20 pb-28">
        {blocks.map((block: any, bIdx: number) => {
          switch (block.type) {
            /* ================= HERO BLOCK ================= */
            case "hero": {
              return (
                <section
                  key={bIdx}
                  id={block.id || "hero"}
                  className="relative min-h-[80vh] flex items-center justify-center py-24 sm:py-32 px-4 sm:px-6 overflow-hidden scroll-mt-24"
                >
                  {/* Background Image / Ambient Glow */}
                  {block.hero_image ? (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={block.hero_image}
                        alt={block.title || "Hero"}
                        fill
                        sizes="100vw"
                        priority
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/70" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0 bg-muted/20 overflow-hidden">
                      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                  )}

                  <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                    {block.badge && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest shadow-xs"
                      >
                        <Sparkles size={12} className="text-primary" />
                        <span>{block.badge}</span>
                      </motion.div>
                    )}

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={cn(
                        getPageHeroTitleSizeClass(block.title),
                        "font-black uppercase tracking-tighter leading-[0.95] text-foreground drop-shadow-md text-balance break-words [overflow-wrap:anywhere]"
                      )}
                    >
                      {block.title}
                    </motion.h1>

                    {/* Clean Section Divider */}
                    <div className="w-16 h-1 mx-auto my-6 rounded-full bg-primary/80" />

                    {block.tagline && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={cn(
                          getTaglineSizeClass(block.tagline),
                          "text-foreground/80 font-medium max-w-2xl mx-auto leading-relaxed text-balance break-words"
                        )}
                      >
                        {block.tagline}
                      </motion.p>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                      {block.primary_cta_label && (
                        <Link
                          href={block.primary_cta_href || "#"}
                          target={block.primary_cta_href?.startsWith("http") ? "_blank" : undefined}
                          rel={block.primary_cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Ticket size={18} />
                          <span>{block.primary_cta_label}</span>
                        </Link>
                      )}

                      {block.secondary_cta_label && (
                        <Link
                          href={block.secondary_cta_href || "#"}
                          className="w-full sm:w-auto px-8 py-4 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/15 font-bold text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <span>{block.secondary_cta_label}</span>
                          <ChevronDown size={16} className="text-foreground/60" />
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </section>
              );
            }

            /* ================= EVENT DETAILS BLOCK ================= */
            case "event_details": {
              return (
                <section
                  key={bIdx}
                  id={block.id || "dettagli"}
                  className="py-16 px-4 sm:px-6 scroll-mt-24 relative"
                >
                  <div id="info" className="absolute -top-24" />
                  <div id="evento" className="absolute -top-24" />
                  <div className="max-w-4xl mx-auto">
                    <div className="p-8 sm:p-12 rounded-[2.5rem] bg-muted/20 border border-foreground/10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-6 flex-1">
                          {block.info_badge && (
                            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                              {block.info_badge}
                            </span>
                          )}

                          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                            {block.title || "Data e Informazioni"}
                          </h2>

                          <div className="space-y-4">
                            {block.date && (
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                  <Calendar size={18} />
                                </div>
                                <div>
                                  <div className="text-xs uppercase font-bold text-foreground/40 tracking-wider">
                                    Data & Ora
                                  </div>
                                  <div className="text-base sm:text-lg font-bold text-foreground">
                                    {block.date}
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
                                    Luogo
                                  </div>
                                  <div className="text-base sm:text-lg font-bold text-foreground">
                                    {block.location}
                                  </div>
                                  {block.location_href && (
                                    <Link
                                      href={block.location_href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-primary mt-1 font-bold transition-colors"
                                    >
                                      <span>Apri su Google Maps</span>
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
                                Biglietto
                              </span>
                              <span className="text-3xl sm:text-4xl font-black text-foreground drop-shadow-xs">
                                {block.price}
                              </span>
                            </div>
                          )}

                          {block.cta_label && (
                            <Link
                              href={block.cta_href || "#"}
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

            /* ================= SYNOPSIS / STORY BLOCK ================= */
            case "synopsis": {
              return (
                <section
                  key={bIdx}
                  id={block.id || "trama"}
                  className="py-20 px-4 sm:px-6 scroll-mt-24 relative"
                >
                  <div id="sinossi" className="absolute -top-24" />
                  <div id="storia" className="absolute -top-24" />
                  <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center max-w-2xl mx-auto">
                      <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
                        {block.title || "La Trama"}
                      </h2>
                      <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      <div className={cn("space-y-6", block.image ? "md:col-span-7" : "md:col-span-12")}>
                        <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                          {block.text}
                        </p>

                        {block.quote && (
                          <div className="p-6 sm:p-8 rounded-3xl bg-muted/20 border-l-4 border-primary/60 space-y-3">
                            <p className="italic text-base sm:text-lg text-foreground/90 font-serif leading-relaxed">
                              &ldquo;{block.quote}&rdquo;
                            </p>
                            {block.quote_author && (
                              <p className="text-xs uppercase font-black tracking-wider text-foreground/60">
                                — {block.quote_author}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {block.image && (
                        <div className="md:col-span-5">
                          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 group hover:border-foreground/20 transition-colors">
                            <Image
                              src={block.image}
                              alt={block.title || "Foto spettacolo"}
                              fill
                              sizes="(max-width: 768px) 100vw, 40vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            /* ================= GALLERY BLOCK ================= */
            case "gallery": {
              const galleryImages = block.images || [];
              if (galleryImages.length === 0) return null;

              return (
                <section
                  key={bIdx}
                  id={block.id || "galleria"}
                  className="py-20 px-4 sm:px-6 bg-muted/10 scroll-mt-24 relative"
                >
                  <div id="foto" className="absolute -top-24" />
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
                            onClick={() =>
                              setLightbox({
                                isOpen: true,
                                index: gIdx,
                                images: galleryImages
                              })
                            }
                            className={cn(
                              "relative w-full rounded-3xl overflow-hidden bg-muted shadow-xl border border-foreground/5 cursor-pointer group hover:border-foreground/20 transition-all",
                              layoutClasses
                            )}
                          >
                            <Image
                              src={img.url?.trim() || "/images/1782553290530-TheaterCurtain.webp"}
                              alt={img.alt || "Scena"}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className={`transition-transform duration-700 ${img.no_crop ? "object-contain" : "object-cover group-hover:scale-105"}`}
                            />
                            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg pointer-events-none">
                              <Maximize2 size={14} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            }

            /* ================= REVIEWS / SOCIAL PROOF BLOCK ================= */
            case "reviews": {
              const reviews = block.items || [];
              if (reviews.length === 0) return null;

              return (
                <section
                  key={bIdx}
                  id={block.id || "recensioni"}
                  className="py-20 px-4 sm:px-6 scroll-mt-24 relative"
                >
                  <div id="critica" className="absolute -top-24" />
                  <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center">
                      <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
                        {block.title || "Dicono di Noi"}
                      </h2>
                      <div className="w-16 h-1 rounded-full bg-primary/80 mx-auto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reviews.map((rev: any, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="p-8 rounded-[2rem] bg-muted/15 border border-foreground/5 space-y-4 flex flex-col justify-between hover:border-foreground/15 transition-colors"
                        >
                          <div className="flex gap-1 text-accent mb-2">
                            {[...Array(rev.rating || 5)].map((_, s) => (
                              <Star key={s} size={16} fill="currentColor" />
                            ))}
                          </div>

                          <p className="italic font-serif text-lg text-foreground/85 leading-snug">
                            &ldquo;{rev.quote}&rdquo;
                          </p>

                          <div className="text-xs uppercase font-black tracking-wider text-foreground/60 pt-2 border-t border-foreground/5 flex items-center gap-1.5">
                            {rev.author}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }

            /* ================= FAQ BLOCK ================= */
            case "faq": {
              const faqs = block.items || [];
              if (faqs.length === 0) return null;

              return (
                <section
                  key={bIdx}
                  id={block.id || "faq"}
                  className="py-20 px-4 sm:px-6 bg-muted/10 scroll-mt-24 relative"
                >
                  <div id="domande" className="absolute -top-24" />
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center mb-10">
                      <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
                        {block.title || "Domande Frequenti"}
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
                              className="w-full p-5 text-left font-bold text-base flex justify-between items-center gap-4 hover:text-foreground transition-colors"
                            >
                              <span className="text-foreground">{f.question}</span>
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
                                  <div className="px-5 pb-5 text-foreground/70 text-sm leading-relaxed border-t border-foreground/5 pt-4">
                                    {f.answer}
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

            /* ================= EVENTFROG TICKETING BLOCK ================= */
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

              return (
                <section
                  key={bIdx}
                  id={block.id || "biglietti"}
                  className="py-20 px-4 sm:px-6 relative overflow-hidden scroll-mt-24"
                >
                  <div id="cassa" className="absolute -top-24" />
                  <div id="ticket" className="absolute -top-24" />
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider">
                        <Ticket size={14} />
                        Biglietteria Ufficiale
                      </div>
                      <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
                        {block.title || "Acquista Biglietti"}
                      </h2>
                      {block.subtitle && (
                        <p className="text-base sm:text-lg text-foreground/70 font-medium leading-relaxed">
                          {block.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Embed Iframe Container */}
                    {embedUrl ? (
                      <div className="space-y-4">
                        <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 min-h-[680px] relative">
                          <iframe
                            src={embedUrl}
                            title={block.title || "Biglietti Eventfrog"}
                            className="w-full h-[720px] sm:h-[760px] border-0"
                            allow="payment"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>

                        {/* Fallback button */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/60">
                          <div className="flex items-center gap-2">
                            <Info size={16} className="text-primary shrink-0" />
                            <span>Problemi con il riquadro? Puoi completare l&apos;acquisto anche sul portale esterno:</span>
                          </div>
                          <a
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackInitiateCheckout(landing.title, embedUrl)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                          >
                            <span>{block.fallback_label || "Apri su Eventfrog"}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 rounded-3xl bg-muted/20 border border-foreground/5 text-center space-y-3 glass">
                        <Ticket size={36} className="mx-auto text-foreground/30" />
                        <p className="text-foreground/60 font-medium">
                          La prevendita online per questa pagina non è ancora configurata. Incolla il link Eventfrog nell&apos;Admin.
                        </p>
                      </div>
                    )}

                    {/* Safety note */}
                    {block.show_terms_note !== false && (
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/40 font-medium">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-400" />
                          <span>Transazione sicura gestita da Eventfrog AG (Olten, Svizzera)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Link href="/Termini" className="hover:text-foreground transition-colors underline">
                            Termini di Biglietteria
                          </Link>
                          <Link href="/Privacy" className="hover:text-foreground transition-colors underline">
                            Informativa Privacy
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            /* ================= TALLY REGISTRATION BLOCK ================= */
            case "tally": {
              const rawUrl = block.tally_url?.trim() || "";
              let embedUrl = rawUrl;
              if (rawUrl) {
                try {
                  const match = rawUrl.match(/tally\.so\/(?:r|embed)\/([a-zA-Z0-9_-]+)/);
                  if (match && match[1]) {
                    embedUrl = `https://tally.so/embed/${match[1]}?alignLeft=1&transparentBackground=0&dynamicHeight=1`;
                  } else {
                    const u = new URL(rawUrl);
                    u.protocol = "https:";
                    embedUrl = u.toString();
                  }
                } catch {
                  embedUrl = rawUrl;
                }
              }

              return (
                <section
                  key={bIdx}
                  id={block.id || "registrazione"}
                  className="py-20 px-4 sm:px-6 relative overflow-hidden scroll-mt-24"
                >
                  <div id="iscrizione" className="absolute -top-24" />
                  <div id="modulo" className="absolute -top-24" />
                  <div className="max-w-3xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
                        <ClipboardList size={14} />
                        Modulo di Iscrizione
                      </div>
                      <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
                        {block.title || "Iscriviti o Registrati"}
                      </h2>
                      {block.subtitle && (
                        <p className="text-base sm:text-lg text-foreground/70 font-medium leading-relaxed">
                          {block.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Embedded Tally Card with Solid White Background */}
                    {embedUrl ? (
                      <div className="space-y-4">
                        <div className="w-full rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200 relative p-4 sm:p-6 md:p-8">
                          <iframe
                            data-tally-src={embedUrl}
                            src={embedUrl}
                            title={block.title || "Modulo Tally"}
                            className="w-full h-[780px] sm:h-[840px] border-0 block bg-white"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>

                        {/* Fallback button */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/60">
                          <div className="flex items-center gap-2">
                            <Info size={16} className="text-foreground/50 shrink-0" />
                            <span>Problemi con il modulo? Puoi compilarlo a schermo intero:</span>
                          </div>
                          <a
                            href={rawUrl || embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                          >
                            <span>{block.fallback_label || "Apri su Tally"}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 rounded-3xl bg-muted/20 border border-foreground/5 text-center space-y-3 glass">
                        <ClipboardList size={36} className="mx-auto text-foreground/30" />
                        <p className="text-foreground/60 font-medium">
                          Il modulo di registrazione online per questa pagina non è ancora configurato. Incolla il link Tally nell&apos;Admin.
                        </p>
                      </div>
                    )}

                    {/* Safety note */}
                    {block.show_privacy_note !== false && (
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/40 font-medium">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-400" />
                          <span>Modulo sicuro conforme a GDPR e nLPD svizzera (Tally BV, server UE)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Link href="/Privacy" className="hover:text-foreground transition-colors underline">
                            Informativa Privacy
                          </Link>
                          <Link href="/Contatti" className="hover:text-foreground transition-colors underline">
                            Contattaci
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            /* ================= CLOSING CTA BLOCK ================= */
            case "closing_cta": {
              return (
                <section
                  key={bIdx}
                  id={block.id || "prenota"}
                  className="py-24 px-4 sm:px-6 relative overflow-hidden scroll-mt-24"
                >
                  <div id="cta" className="absolute -top-24" />
                  <div className="max-w-4xl mx-auto text-center relative z-10 p-12 sm:p-16 rounded-[3rem] bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 space-y-6 shadow-2xl overflow-hidden">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground relative z-10">
                      {block.title || "Non Perdere lo Spettacolo"}
                    </h2>
                    {block.text && (
                      <p className="text-lg text-foreground/80 max-w-xl mx-auto font-medium relative z-10">
                        {block.text}
                      </p>
                    )}
                    {block.cta_label && (
                      <div className="pt-4 relative z-10">
                        <Link
                          href={block.cta_href || "#"}
                          target={block.cta_href?.startsWith("http") ? "_blank" : undefined}
                          rel={block.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-primary-foreground font-black text-base uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-105"
                        >
                          <Ticket size={20} />
                          <span>{block.cta_label}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            default:
              return null;
          }
        })}
      </main>

      {/* 3. Standalone Minimal Footer */}
      <footer className="border-t border-foreground/10 py-12 px-4 sm:px-6 bg-muted/20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground hover:underline transition-colors"
          >
            <span>Visita il sito ufficiale Gli Attomatti</span>
            <ChevronRight size={14} />
          </Link>
          <p className="text-xs text-foreground/40 font-medium">
            © {new Date().getFullYear()} Gli Attomatti. Tutti i diritti riservati. Zurigo, Svizzera.
          </p>
        </div>
      </footer>

      {/* 4. Sticky Mobile Bottom CTA Bar */}
      {stickyBar.enabled && stickyBar.cta_label && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-foreground/10 p-3 sm:p-4 md:hidden shadow-2xl">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <div className="text-xs font-bold truncate text-foreground/90">
                {stickyBar.text || landing.title}
              </div>
            </div>
            <Link
              href={stickyBar.cta_href || "#"}
              target={stickyBar.cta_href?.startsWith("http") ? "_blank" : undefined}
              rel={stickyBar.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shrink-0 hover:bg-primary/90 transition-all shadow-md"
            >
              {stickyBar.cta_label}
            </Link>
          </div>
        </div>
      )}

      {/* 5. Lightbox for Gallery */}
      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
