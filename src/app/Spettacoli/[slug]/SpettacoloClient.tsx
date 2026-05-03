"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { ChevronLeft, Calendar, MapPin, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";

export default function SpettacoloDettaglioClient({ content, slug }: { content: any, slug: string }) {
  const show = content.pages.spettacoli.archive_sections.find((s: any) => s.slug === slug);

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
    <div className="pt-20 min-h-screen">
      {/* Header Section */}
      <Section className="bg-muted/30 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link 
            href="/Spettacoli" 
            className="inline-flex items-center text-primary font-bold mb-12 hover:gap-2 transition-all group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Torna all'Archivio
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4"
          >
            {show.title}
          </motion.h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          <p className="text-2xl text-foreground/40 font-bold uppercase tracking-[0.3em]">
            Stagione {show.year}
          </p>
        </div>
      </Section>

      {/* Description & Dates Section */}
      <Section className="py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Lo Spettacolo</h2>
            <div className="prose prose-xl prose-invert max-w-none">
              <p className="text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {show.text}
              </p>
            </div>
            
            {/* Gallery */}
            {show.images && show.images.length > 0 && (
              <div className="mt-20">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Galleria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {show.images.map((img: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "rounded-3xl overflow-hidden bg-muted shadow-xl",
                        idx % 3 === 0 ? "md:col-span-2 aspect-video" : "aspect-square"
                      )}
                    >
                      <img 
                        src={img.url} 
                        alt={img.alt} 
                        onClick={() => setLightbox({ isOpen: true, index: idx, images: show.images })}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105 cursor-pointer" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Dates & Tickets */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-foreground/5 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center">
                  <Calendar className="mr-3 text-primary" size={24} />
                  Date e Biglietti
                </h3>
                
                <div className="space-y-6">
                  {show.dates && show.dates.length > 0 ? (
                    show.dates.map((d: any, idx: number) => (
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
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full text-sm font-black hover:bg-primary/90 transition-all w-full justify-center shadow-lg shadow-primary/20"
                            >
                              <Ticket size={16} className="mr-2" />
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
                    <p className="text-foreground/40 italic">Nessuna data futura programmata per questo spettacolo.</p>
                  )}
                </div>
              </div>
              
              {show.details && show.details.length > 0 && (
                <div className="p-8 border-2 border-foreground/10 rounded-[2.5rem] bg-transparent">
                  <h4 className="font-black mb-6 uppercase tracking-[0.2em] text-xs opacity-60">Info Spettacolo</h4>
                  <div className="space-y-4">
                    {show.details.map((detail: any, dIdx: number) => (
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
