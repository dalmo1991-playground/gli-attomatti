"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { ChevronLeft, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import Image from "next/image";

export default function IniziativaDettaglioClient({ content, slug }: { content: any, slug: string }) {
  const initiative = (content?.pages?.iniziative?.archive_sections || []).find((s: any) => s?.slug === slug);

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
      <Section className="bg-muted/30 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
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
            className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4"
          >
            {initiative.title}
          </motion.h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          <p className="text-2xl text-foreground/40 font-bold uppercase tracking-[0.3em]">
            Edizione {initiative.year}
          </p>
        </div>
      </Section>

      {/* Description & Dates Section */}
      <Section className="py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">L'Iniziativa</h2>
            <div className="prose prose-xl prose-invert max-w-none">
              <p className="text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {initiative.text}
              </p>
            </div>

            {/* Gallery right under the text with fluid layout */}
            {initiative.images && initiative.images.length > 0 && (
              <div className="mt-16">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Galleria</h3>
                <div className={cn(
                  "grid gap-6 items-start",
                  initiative.images.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                )}>
                  {initiative.images.map((img: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => setLightbox({ isOpen: true, index: idx, images: initiative.images })}
                      className={cn(
                        "relative w-full rounded-3xl overflow-hidden bg-muted shadow-xl border border-foreground/5 transition-all duration-500 hover:shadow-2xl hover:border-primary/20 cursor-pointer group",
                        idx % 3 === 0 ? "aspect-video" : "aspect-[4/3]",
                        initiative.images.length > 1 && idx % 2 !== 0 && "sm:mt-12"
                      )}
                    >
                      <Image 
                        src={img.url?.trim() || "/images/1782553290530-TheaterCurtain.webp"} 
                        alt={img.alt || initiative.title || "Foto iniziativa"} 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Dates & Registration */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-foreground/5 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center">
                  <Calendar className="mr-3 text-primary" size={24} />
                  Date e Iscrizioni
                </h3>
                
                <div className="space-y-6">
                  {initiative.dates && initiative.dates.length > 0 ? (
                    initiative.dates.map((d: any, idx: number) => (
                      <div key={idx} className="pb-6 border-b border-foreground/5 last:border-0 last:pb-0">
                        <div className="font-bold text-lg mb-1">{d.date}</div>
                        <div className="flex items-start text-foreground/60 text-sm mb-4">
                          <MapPin size={16} className="mr-2 mt-0.5 text-primary/60" />
                          {d.location}
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
                <div className="p-8 border-2 border-foreground/10 rounded-[2.5rem] bg-transparent">
                  <h4 className="font-black mb-6 uppercase tracking-[0.2em] text-xs opacity-60">Info Iniziativa</h4>
                  <div className="space-y-4">
                    {initiative.details.map((detail: any, dIdx: number) => (
                      <div key={dIdx} className="flex justify-between items-center text-sm border-b border-foreground/5 pb-4 last:border-0 last:pb-0">
                        <span className="opacity-40 font-bold uppercase tracking-wider">{detail.label}</span>
                        <span className="font-black text-primary">{detail.value}</span>
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
