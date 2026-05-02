"use client";

import content from "@/data/content.json";
import { Section } from "@/components/ui/Section";
import { AnimatedCarousel } from "@/components/ui/AnimatedCarousel";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Theater, ChevronLeft, ChevronRight, Info, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const { hero, upcoming_shows, introduction, featured_images } = content.pages.home;
  
  // Filter active shows
  const activeShows = upcoming_shows.filter(show => show.active);
  const showMode = activeShows.length > 0;
  
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);

  // For Introduction Carousel
  const [introIndex, setIntroIndex] = useState(0);

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
    const timer = setInterval(() => {
      setIntroIndex((prev) => (prev + 1) % introduction.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [introduction.images.length]);

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
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
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
                <img
                  src={activeShows[currentShowIndex].image}
                  alt={activeShows[currentShowIndex].title}
                  className="w-full h-full object-cover opacity-40"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background z-10" />
          </div>
        ) : (
          /* Mode 2: Generic Background */
          <div className="absolute inset-0 z-0">
            <img
              src="/images/show1.png"
              alt="Hero Background"
              className="w-full h-full object-cover opacity-30 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />
          </div>
        )}

        <div className="relative z-20 text-center px-6 max-w-5xl w-full">
          {showMode ? (
            /* Mode 1: Upcoming Show Content */
            <div className="relative w-full flex flex-col items-center justify-center min-h-[500px] overflow-hidden">
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
                  className="space-y-8 w-full"
                >
                  <div className="flex flex-col items-center">
                    <p className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 opacity-80">
                      {activeShows[currentShowIndex].presenter}
                    </p>
                    <div className="h-[200px] flex flex-col items-center justify-center">
                      <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none text-center">
                        {activeShows[currentShowIndex].title}
                      </h1>
                      {activeShows[currentShowIndex].tagline && (
                        <p className="mt-4 text-xl md:text-2xl font-medium text-primary/80 tracking-tight italic">
                          {activeShows[currentShowIndex].tagline}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-lg font-medium text-foreground/80 mb-10 h-8">
                      <div className="flex items-center">
                        <Calendar size={20} className="mr-2 text-primary" />
                        {activeShows[currentShowIndex].date}
                      </div>
                      <Link
                        href={activeShows[currentShowIndex].location_href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center transition-colors"
                      >
                        <MapPin size={20} className="mr-2 text-primary" />
                        <span>
                          {activeShows[currentShowIndex].location}
                        </span>
                      </Link>
                    </div>
                    
                    {/* Buttons / Tags Area */}
                    <div className={cn(
                      "flex gap-6 justify-center items-center w-full",
                      (!!activeShows[currentShowIndex].cta_href === !!activeShows[currentShowIndex].details_href) 
                        ? "flex-col sm:flex-row" // Same type (both buttons or both tags) -> side-by-side
                        : "flex-col" // Different type -> stacked
                    )}>
                      {/* Button 1 */}
                      {activeShows[currentShowIndex].cta && (
                        activeShows[currentShowIndex].cta_href ? (
                          <Link
                            href={activeShows[currentShowIndex].cta_href}
                            className="px-10 py-5 bg-primary text-white rounded-full font-black text-lg hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 hover:-translate-y-1 flex items-center justify-center min-w-[280px]"
                          >
                            {activeShows[currentShowIndex].cta}
                            <ArrowRight size={20} className="ml-2" />
                          </Link>
                        ) : (
                          <div className="px-8 py-3 bg-primary/20 border-2 border-primary/30 text-primary rounded-xl font-black text-lg flex items-center justify-center backdrop-blur-md shadow-lg shadow-primary/10">
                            <Info size={18} className="mr-3 opacity-80" />
                            {activeShows[currentShowIndex].cta}
                          </div>
                        )
                      )}
                      
                      {/* Button 2 */}
                      {activeShows[currentShowIndex].details_label && (
                        activeShows[currentShowIndex].details_href ? (
                          <Link
                            href={activeShows[currentShowIndex].details_href}
                            className="px-10 py-5 border-2 border-foreground/20 text-foreground rounded-full font-bold text-lg hover:border-primary hover:text-primary transition-all flex items-center justify-center min-w-[280px]"
                          >
                            {activeShows[currentShowIndex].details_label}
                          </Link>
                        ) : (
                          <div className="px-8 py-3 glass border-2 border-foreground/20 text-foreground rounded-xl font-black text-lg flex items-center justify-center shadow-xl">
                            <Info size={18} className="mr-3 text-primary opacity-80" />
                            {activeShows[currentShowIndex].details_label}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            /* Mode 2: Generic Content */
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <motion.img 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src="/logo_attomatti.svg" 
                  alt={content.site.name} 
                  className="h-32 md:h-48 w-auto mb-12 animate-float"
                />
                <p className="text-xl md:text-2xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                  {hero.subtitle}
                </p>
                <div className={cn(
                  "flex gap-6 justify-center items-center w-full",
                  (!!hero.primary_cta_href === !!hero.secondary_cta_href)
                    ? "flex-col sm:flex-row"
                    : "flex-col"
                )}>
                  {hero.primary_cta_label && (
                    hero.primary_cta_href ? (
                      <Link
                        href={hero.primary_cta_href}
                        className="px-8 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-1 flex items-center justify-center min-w-[240px]"
                      >
                        {hero.primary_cta_label}
                        <ArrowRight size={18} className="ml-2" />
                      </Link>
                    ) : (
                      <div className="px-6 py-2 bg-primary/20 border-2 border-primary/30 text-primary rounded-lg font-bold text-base flex items-center justify-center">
                        <Info size={16} className="mr-2 opacity-80" />
                        {hero.primary_cta_label}
                      </div>
                    )
                  )}
                  {hero.secondary_cta_label && (
                    hero.secondary_cta_href ? (
                      <Link
                        href={hero.secondary_cta_href}
                        className="px-8 py-4 border-2 border-foreground/20 text-foreground rounded-full font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center min-w-[240px]"
                      >
                        {hero.secondary_cta_label}
                      </Link>
                    ) : (
                      <div className="px-6 py-2 glass border-2 border-foreground/20 text-foreground rounded-lg font-bold text-base flex items-center justify-center">
                        <Info size={16} className="mr-2 text-primary opacity-80" />
                        {hero.secondary_cta_label}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Carousel Indicators (Dots) moved to the very bottom */}
        {showMode && activeShows.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
            {activeShows.map((_, idx) => (
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
      <Section className="bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">{introduction.title}</h2>
            <p className="text-lg text-foreground/70 leading-relaxed mb-8">
              {introduction.text}
            </p>
            <Link
              href="/Chi_Siamo"
              className="text-primary font-bold inline-flex items-center group"
            >
              La nostra storia
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="relative aspect-square md:aspect-auto md:h-[500px] overflow-hidden rounded-3xl shadow-2xl">
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
            </div>
            
            {/* Concurrent transition for fluidity */}
            <AnimatePresence mode="popLayout">
              <motion.img
                key={introIndex}
                src={introduction.images[introIndex].url}
                alt={introduction.images[introIndex].alt}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </Section>
    </div>
  );
}
