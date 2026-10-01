"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { ChevronLeft, Calendar, MapPin, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import Image from "next/image";
import { trackViewContent } from "@/lib/tracking";

export default function IniziativaDettaglioClient({ content, slug }: { content: any, slug: string }) {
  const initiative = (content?.pages?.iniziative?.archive_sections || []).find((s: any) => s?.slug === slug);

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
        <h1 className="text-4xl font-bold mb-4">Iniziativa non trovata</h1>
        <Link href="/Iniziative" className="text-primary font-bold hover:underline">
          Torna all'elenco iniziative
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      {/* Header Section */}
      <Section className="bg-muted/30 py-24 sm:py-32 relative overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
        {initiative.hero_image?.trim() ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={initiative.hero_image.trim()}
              alt={initiative.title || "Hero Iniziativa"}
              fill
              priority
              className="object-cover object-center"
            />
            {/* Cinematic dark gradients to guarantee text legibility */}
            <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
          </div>
        ) : (
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        )}

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full px-4">
          <Link 
            href="/Iniziative" 
            className="inline-flex items-center text-primary font-bold mb-12 hover:gap-2 transition-all group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Torna alle Iniziative
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 text-white drop-shadow-sm"
          >
            {initiative.title}
          </motion.h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-8 shadow-sm" />
          <p className="text-2xl text-foreground/60 font-bold uppercase tracking-[0.3em]">
            Edizione {initiative.year}
          </p>
        </div>
      </Section>

      {/* Description & Dates Section */}
      <Section className="py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">
          {/* Main Content */}
          <div className="lg:col-span-7 xl:col-span-8">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">L'Iniziativa</h2>
            <div className="prose prose-xl prose-invert max-w-none">
              <RichText
                content={initiative.text}
                className="text-xl text-foreground/80 leading-relaxed"
              />
            </div>

            {/* Gallery with dynamic bento layout that fills the space seamlessly */}
            {initiative.images && initiative.images.length > 0 && (
              <div className="mt-12 sm:mt-16">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
                  {initiative.images.map((img: any, idx: number) => {
                    const total = initiative.images.length;
                    
                    // Determine column span and height to fill space with dynamic editorial movement
                    let layoutClasses = "";
                    if (total === 1) {
                      layoutClasses = "sm:col-span-12 aspect-[16/10]";
                    } else if (total === 2) {
                      layoutClasses = idx === 0 
                        ? "sm:col-span-7 h-[280px] sm:h-[380px]" 
                        : "sm:col-span-5 h-[280px] sm:h-[380px]";
                    } else if (idx === 0) {
                      layoutClasses = "sm:col-span-12 aspect-[16/9]";
                    } else {
                      const remIdx = idx - 1;
                      const isLastSingle = remIdx === total - 2 && remIdx % 2 === 0;
                      if (isLastSingle) {
                        layoutClasses = "sm:col-span-12 aspect-[16/9] sm:aspect-[21/9]";
                      } else {
                        const pairCycle = Math.floor(remIdx / 2) % 2;
                        const isFirstInPair = remIdx % 2 === 0;
                        if (pairCycle === 0) {
                          layoutClasses = isFirstInPair 
                            ? "sm:col-span-7 h-[280px] sm:h-[360px]" 
                            : "sm:col-span-5 h-[280px] sm:h-[360px]";
                        } else {
                          layoutClasses = isFirstInPair 
                            ? "sm:col-span-5 h-[280px] sm:h-[360px]" 
                            : "sm:col-span-7 h-[280px] sm:h-[360px]";
                        }
                      }
                    }

                    return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.08 }}
                        onClick={() => setLightbox({ isOpen: true, index: idx, images: initiative.images })}
                        className={cn(
                          "relative w-full rounded-3xl overflow-hidden bg-muted shadow-xl border border-foreground/5 transition-all duration-500 hover:shadow-2xl hover:border-primary/30 cursor-pointer group",
                          layoutClasses
                        )}
                      >
                        <Image 
                          src={img.url?.trim() || "/images/1782553290530-TheaterCurtain.webp"} 
                          alt={img.alt || initiative.title || "Foto iniziativa"} 
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className={`transition-all duration-700 ${img.no_crop ? "object-contain" : "object-cover group-hover:scale-105"}`}
                        />

                        {/* Glassmorphic expand icon badge */}
                        <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg pointer-events-none">
                          <Maximize2 size={14} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Dates & Registration */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-32 space-y-6 sm:space-y-8">
              <div className="p-6 sm:p-8 bg-muted/20 rounded-[2.5rem] border border-foreground/5 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 sm:mb-8 flex items-center">
                  <Calendar className="mr-3 text-primary" size={24} />
                  Date e Iscrizioni
                </h3>
                
                <div className="space-y-6">
                  {initiative.dates && initiative.dates.length > 0 ? (
                    initiative.dates.map((d: any, idx: number) => (
                      <div key={idx} className="pb-6 border-b border-foreground/5 last:border-0 last:pb-0">
                        <div className="font-bold text-lg mb-1">{d.date}</div>
                        <div className="flex items-start text-foreground/60 text-sm mb-4">
                          <MapPin size={16} className="mr-2 mt-0.5 text-primary/60 shrink-0" />
                          <span>{d.location}</span>
                        </div>
                        {d.ticket_label && (
                          d.ticket_href ? (
                            <Link 
                              href={d.ticket_href}
                              target={d.ticket_href.startsWith("http") ? "_blank" : undefined}
                              rel={d.ticket_href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full text-sm font-black hover:bg-primary/90 transition-all w-full justify-center shadow-lg shadow-primary/20"
                            >
                              {d.ticket_label}
                            </Link>
                          ) : (
                            <div className="px-6 py-3 bg-foreground/5 text-foreground/40 rounded-full text-sm font-bold text-center border border-foreground/5">
                              {d.ticket_label}
                            </div>
                          )
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-foreground/40 italic">Nessun calendario al momento programmato.</p>
                  )}
                </div>
              </div>
              
              {initiative.details && initiative.details.length > 0 && (
                <div className="p-6 sm:p-8 border border-foreground/10 rounded-[2.5rem] bg-muted/10">
                  <h4 className="font-black mb-6 uppercase tracking-[0.2em] text-xs text-foreground/50">
                    Info Iniziativa
                  </h4>
                  <div className="space-y-4">
                    {initiative.details.map((detail: any, dIdx: number) => (
                      <div 
                        key={dIdx} 
                        className="flex items-start justify-between gap-4 text-sm border-b border-foreground/5 pb-3.5 last:border-0 last:pb-0"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground/50 shrink-0 max-w-[45%] pt-0.5">
                          {detail.label}
                        </span>
                        <span className="font-black text-primary text-right leading-snug break-words">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
