"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import Image from "next/image";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { getHeroTitleSizeClass, getTaglineSizeClass } from "@/lib/typography";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

const MotionImage = motion.create(Image);

export default function HomeClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const home = content?.pages?.home || {};
  const hero = home.hero || {};
  const upcoming_shows = Array.isArray(home.upcoming_shows) ? home.upcoming_shows : [];
  const introduction = home.introduction || { title: "", text: "", images: [] };
  const introImages: any[] = Array.isArray(introduction.images) ? introduction.images : [];

  // Filter active shows
  const activeShows = upcoming_shows.filter((show: any) => show && show.active);
  const showMode = activeShows.length > 0;

  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);

  // For Introduction Carousel
  const [introIndex, setIntroIndex] = useState(0);

  // Lightbox State
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; index: number; images: LightboxImage[] }>({
    isOpen: false,
    index: 0,
    images: []
  });

  useEffect(() => {
    if (showMode && activeShows.length > 1) {
      const timer = setInterval(() => {
        setHeroDirection(1);
        setCurrentShowIndex((prev) => (prev + 1) % activeShows.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [showMode, activeShows.length]);

  useEffect(() => {
    if (introImages.length > 1) {
      const timer = setInterval(() => {
        setIntroIndex((prev) => (prev + 1) % introImages.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [introImages.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0
    })
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100dvh-5rem)] py-8 sm:py-10 md:py-12 flex items-center justify-center overflow-hidden">
        {showMode ? (
          /* Mode 1: Upcoming Shows Slideshow */
          <div className="absolute inset-0 z-0">
            <AnimatePresence initial={false} custom={heroDirection}>
              <motion.div
                key={currentShowIndex}
                custom={heroDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.5 }
                }}
                className="absolute inset-0"
              >
                <Image
                  src={activeShows[currentShowIndex].image?.trim() || "/images/1782553290530-TheaterCurtain.webp"}
                  alt={activeShows[currentShowIndex].title || "Spettacolo"}
                  fill
                  sizes="100vw"
                  className="object-cover opacity-40"
                  priority
                />

              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background z-10" />
            {/* Theatrical cross-spotlights (warm gold accent & cool indigo secondary) */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none z-10" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none z-10" />
          </div>
        ) : (
          /* Mode 2: Generic Background */
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/1782553290530-TheaterCurtain.webp"
              alt="Sipario teatrale — Compagnia Gli Attomatti Zurigo"
              fill
              sizes="100vw"
              className="object-cover opacity-30 scale-105"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />
            {/* Theatrical cross-spotlights (warm gold accent & cool indigo secondary) */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
          </div>
        )}

        <div className="relative z-20 text-center px-6 max-w-5xl w-full">
          {showMode ? (
            /* Mode 1: Upcoming Show Content */
            <div className="relative w-full flex flex-col items-center justify-center">
              <AnimatePresence initial={false} custom={heroDirection} mode="popLayout">
                <motion.div
                  key={currentShowIndex}
                  custom={heroDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.5 }
                  }}
                  className="w-full flex flex-col items-center max-w-4xl mx-auto"
                >
                  {/* Presenter */}
                  {activeShows[currentShowIndex].presenter && (
                    <p className="text-primary font-bold tracking-[0.25em] uppercase text-xs md:text-sm mb-2 md:mb-3 opacity-90 drop-shadow-sm">
                      {activeShows[currentShowIndex].presenter}
                    </p>
                  )}

                  {/* Title */}
                  <h1 className={cn(
                    getHeroTitleSizeClass(activeShows[currentShowIndex].title),
                    "font-black tracking-tighter uppercase leading-[0.95] text-center drop-shadow-md text-balance break-words [overflow-wrap:anywhere]"
                  )}>
                    {activeShows[currentShowIndex].title}
                  </h1>

                  {/* Tagline */}
                  {activeShows[currentShowIndex].tagline && (
                    <p className={cn(
                      getTaglineSizeClass(activeShows[currentShowIndex].tagline),
                      "mt-3 md:mt-4 font-medium text-primary tracking-normal italic max-w-2xl text-center drop-shadow-sm text-balance break-words"
                    )}>
                      {activeShows[currentShowIndex].tagline}
                    </p>
                  )}

                  {/* Date & Location Badges */}
                  {(activeShows[currentShowIndex].date || activeShows[currentShowIndex].location) && (
                    <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3 text-xs sm:text-sm md:text-base font-medium text-foreground/90 mt-5 md:mt-6">
                      {activeShows[currentShowIndex].date && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.15)] font-bold">
                          <Calendar size={15} className="text-accent shrink-0" />
                          <span>{activeShows[currentShowIndex].date}</span>
                        </div>
                      )}
                      {activeShows[currentShowIndex].location && (
                        activeShows[currentShowIndex].location_href?.trim() ? (
                          <Link
                            href={activeShows[currentShowIndex].location_href.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/50 backdrop-blur-md border border-foreground/10 shadow-sm hover:border-primary/50 transition-colors group"
                          >
                            <MapPin size={16} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:text-primary transition-colors">
                              {activeShows[currentShowIndex].location}
                            </span>
                          </Link>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/50 backdrop-blur-md border border-foreground/10 shadow-sm">
                            <MapPin size={16} className="text-primary shrink-0" />
                            <span>{activeShows[currentShowIndex].location}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Buttons / Actions Area */}
                  <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full">
                    {/* Button 1 */}
                    {activeShows[currentShowIndex].cta && (
                      activeShows[currentShowIndex].cta_href ? (
                        <Link
                          href={activeShows[currentShowIndex].cta_href}
                          className="px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground rounded-full font-black text-base sm:text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 flex items-center justify-center min-w-[220px] sm:min-w-[240px]"
                        >
                          {activeShows[currentShowIndex].cta}
                          <ArrowRight size={18} className="ml-2" />
                        </Link>
                      ) : (
                        <div className="px-6 py-2.5 bg-primary/20 border-2 border-primary/30 text-primary rounded-xl font-black text-base flex items-center justify-center backdrop-blur-md shadow-lg shadow-primary/10">
                          <Info size={16} className="mr-2 opacity-80" />
                          {activeShows[currentShowIndex].cta}
                        </div>
                      )
                    )}

                    {/* Button 2 */}
                    {(activeShows[currentShowIndex].secondary_cta || activeShows[currentShowIndex].details_label) && (
                      (activeShows[currentShowIndex].secondary_cta_href || activeShows[currentShowIndex].details_href) ? (
                        <Link
                          href={activeShows[currentShowIndex].secondary_cta_href || activeShows[currentShowIndex].details_href}
                          className="px-8 py-3.5 sm:py-4 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary rounded-full font-bold text-base sm:text-lg transition-all flex items-center justify-center min-w-[220px] sm:min-w-[240px] shadow-xs hover:-translate-y-0.5"
                        >
                          {activeShows[currentShowIndex].secondary_cta || activeShows[currentShowIndex].details_label}
                        </Link>
                      ) : (
                        <div className="px-6 py-2.5 glass border-2 border-secondary/30 text-secondary rounded-xl font-black text-base flex items-center justify-center shadow-xl">
                          <Info size={16} className="mr-2 text-secondary opacity-80" />
                          {activeShows[currentShowIndex].secondary_cta || activeShows[currentShowIndex].details_label}
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            /* Mode 2: Generic Content */
            <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col items-center">
                <MotionImage
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src="/logo_attomatti.svg"
                  alt={content.site.name}
                  width={192}
                  height={192}
                  className="h-28 sm:h-36 md:h-44 w-auto mb-6 md:mb-8 animate-float"
                />

                <p className="text-lg sm:text-xl md:text-2xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                  {hero.subtitle}
                </p>
                <div className={cn(
                  "flex gap-4 sm:gap-6 justify-center items-center w-full",
                  (!!hero.primary_cta_href === !!hero.secondary_cta_href)
                    ? "flex-col sm:flex-row"
                    : "flex-col"
                )}>
                  {hero.primary_cta_label && (
                    hero.primary_cta_href ? (
                      <Link
                        href={hero.primary_cta_href}
                        className="px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-1 flex items-center justify-center min-w-[220px] sm:min-w-[240px]"
                      >
                        {hero.primary_cta_label}
                        <ArrowRight size={18} className="ml-2" />
                      </Link>
                    ) : (
                      <div className="px-6 py-2.5 bg-primary/20 border-2 border-primary/30 text-primary rounded-lg font-bold text-base flex items-center justify-center">
                        <Info size={16} className="mr-2 opacity-80" />
                        {hero.primary_cta_label}
                      </div>
                    )
                  )}
                  {hero.secondary_cta_label && (
                    hero.secondary_cta_href ? (
                      <Link
                        href={hero.secondary_cta_href}
                        className="px-8 py-3.5 sm:py-4 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary rounded-full font-bold transition-all flex items-center justify-center min-w-[220px] sm:min-w-[240px] shadow-xs hover:-translate-y-0.5"
                      >
                        {hero.secondary_cta_label}
                      </Link>
                    ) : (
                      <div className="px-6 py-2.5 glass border-2 border-secondary/30 text-secondary rounded-lg font-bold text-base flex items-center justify-center">
                        <Info size={16} className="mr-2 text-secondary opacity-80" />
                        {hero.secondary_cta_label}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Carousel Indicators (Dots) */}
        {showMode && activeShows.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
            {activeShows.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  setHeroDirection(idx > currentShowIndex ? 1 : -1);
                  setCurrentShowIndex(idx);
                }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  idx === currentShowIndex ? "bg-primary w-8 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" : "bg-primary/20 hover:bg-primary/40"
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Introduction Section */}
      {/* Stage Divider */}
      <div className="w-full max-w-6xl mx-auto px-6 py-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>

      <Section className="bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">{introduction.title}</h2>
            <p className="text-lg text-foreground/70 leading-relaxed mb-8 whitespace-pre-wrap">
              {introduction.text}
            </p>
            <Link
              href="/Chi_Siamo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary font-bold text-sm transition-all group shadow-xs hover:-translate-y-0.5"
            >
              <span>Scopri la nostra storia</span>
              <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="relative aspect-square md:aspect-auto md:h-[500px] overflow-hidden rounded-3xl shadow-2xl">
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            {introImages && introImages.length > 0 && (
              <AnimatePresence mode="popLayout">
                <MotionImage
                  key={introIndex}
                  src={introImages[introIndex]?.url?.trim() || "/images/1782553290530-TheaterCurtain.webp"}
                  alt={introImages[introIndex]?.alt || "Introduzione"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`cursor-pointer transition-transform duration-700 ${introImages[introIndex]?.no_crop ? "object-contain" : "object-cover hover:scale-105"}`}
                  onClick={() => setLightbox({ isOpen: true, index: introIndex, images: introImages })}
                />
              </AnimatePresence>
            )}
          </div>
        </div>
      </Section>

      {/* Stage Divider */}
      <div className="w-full max-w-6xl mx-auto px-6 py-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>

      {/* Instagram Feed Section (Modalità B - Embed) */}
      <InstagramFeed data={content.pages?.home?.instagram_feed} />

      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
