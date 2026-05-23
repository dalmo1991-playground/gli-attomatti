"use client";

import { Section } from "@/components/ui/Section";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import Image from "next/image";


export default function AttoriClient({ content }: { content: any }) {
  const { attori } = content.pages;
  const { join_us } = attori;

  const [lightbox, setLightbox] = useState({ isOpen: false, index: 0 });
  const [selectedActor, setSelectedActor] = useState<any | null>(null);

  const galleryImages = useMemo(() => {
    return attori.list.map((person: any) => ({
      url: person.image,
      alt: person.name
    }));
  }, [attori.list]);

  return (
    <div className="pt-20">
      {/* Header */}
      <Section className="bg-muted/30 py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link 
            href="/Chi_Siamo" 
            className="inline-flex items-center text-primary font-bold mb-8 hover:gap-2 transition-all group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Torna a Chi Siamo
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter"
          >
            {attori.title}
          </motion.h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          <p className="text-xl text-foreground/70 font-medium">
            Le persone che rendono possibile la magia del teatro Attomatti.
          </p>
        </div>
      </Section>

      {/* Actors Grid */}
      <Section className="py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          {attori.list.map((person: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover="hover"
              onClick={() => setSelectedActor(person)}
              className="group text-center cursor-pointer"
            >
              <div className="relative w-64 h-64 mx-auto mb-8">
                {/* Decorative Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 scale-110 group-hover:scale-125 group-hover:border-amber-400/50 transition-all duration-700 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-none" />
                
                {/* Profile Pic Container */}
                <motion.div 
                  className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-8 ring-background group-hover:ring-amber-500/20 transition-all duration-700 pointer-events-none"
                >
                  {/* Background (Stage Standby): Grayscale, Dimmed Image */}
                  <div className="absolute inset-0 bg-black">
                    <Image 
                      src={person.image} 
                      alt={person.name} 
                      fill
                      className="object-cover opacity-80 filter grayscale brightness-95 contrast-110 transition-all duration-700 scale-100 group-hover:scale-105"
                    />
                  </div>

                  {/* Spotlight Foreground (Color and Brightness) */}
                  <motion.div
                    className="absolute inset-0 z-10 pointer-events-none"
                    initial={{ clipPath: "circle(0% at 50% 50%)" }}
                    variants={{
                      hover: { 
                        clipPath: "circle(100% at 50% 50%)" 
                      }
                    }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
                  >
                    <Image 
                      src={person.image} 
                      alt={person.name} 
                      fill
                      className="object-cover filter brightness-110 contrast-100 scale-105"
                    />
                  </motion.div>
                </motion.div>


              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black uppercase tracking-tight group-hover:text-primary transition-colors min-h-[4.5rem]">
                  {person.name}
                </h3>
                <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                  {person.role}
                </div>
                <p className="text-foreground/60 leading-relaxed max-w-sm mx-auto pt-4 border-t border-foreground/5 whitespace-pre-wrap">
                  {person.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Join Us Call to Action */}
      {join_us && (
        <Section className="bg-muted/10 py-24 text-center border-t border-foreground/5">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">
              {join_us.title}
            </h2>
            <p className="text-lg text-foreground/60 mb-10">
              {join_us.text}
            </p>
            <Link 
              href={join_us.cta_href}
              className="px-10 py-5 bg-primary text-white rounded-full font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 inline-block"
            >
              {join_us.cta_label}
            </Link>
          </div>
        </Section>
      )}

      <Lightbox 
        images={galleryImages}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />

      <AnimatePresence>
        {selectedActor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActor(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-4xl bg-background border border-foreground/10 rounded-3xl overflow-hidden shadow-2xl z-10 p-6 md:p-10 max-h-[90vh] md:max-h-none flex flex-col justify-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedActor(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/75 hover:text-foreground transition-colors cursor-pointer z-20"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>

              {/* Pop-up Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center md:items-start overflow-y-auto md:overflow-visible max-h-[70vh] md:max-h-none pr-1 md:pr-0 custom-scrollbar w-full pt-8 md:pt-0">
                {/* Profile Pic Column */}
                <div className="md:col-span-5 flex justify-center md:sticky md:top-0">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl ring-8 ring-muted border border-foreground/5 shrink-0">
                    <Image
                      src={selectedActor.image}
                      alt={selectedActor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Info Column */}
                <div className="md:col-span-7 space-y-6 text-center md:text-left md:overflow-y-auto md:max-h-[520px] md:pr-4 custom-scrollbar">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">
                      {selectedActor.name}
                    </h2>
                    <div className="inline-block px-5 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-wider mb-6">
                      {selectedActor.role}
                    </div>
                    {selectedActor.description && (
                      <p className="text-foreground/75 leading-relaxed text-lg whitespace-pre-wrap border-t border-foreground/5 pt-6">
                        {selectedActor.description}
                      </p>
                    )}
                    {selectedActor.shows && selectedActor.shows.length > 0 && (
                      <div className="border-t border-foreground/5 pt-6 mt-6 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-foreground/45">
                          Spettacoli e Ruoli
                        </h4>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          {selectedActor.shows.map((show: any, sIdx: number) => {
                            const badgeContent = (
                              <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground/[0.03] text-foreground hover:bg-primary/10 hover:text-primary rounded-xl text-sm font-semibold transition-all border border-foreground/5 cursor-pointer">
                                <span>{show.title}</span>
                                {show.role && (
                                  <>
                                    <span className="opacity-30 font-normal">|</span>
                                    <span className="text-xs uppercase tracking-wider opacity-75 font-normal">{show.role}</span>
                                  </>
                                )}
                              </span>
                            );

                            return show.slug ? (
                              <Link 
                                key={sIdx} 
                                href={`/Spettacoli/${show.slug}`}
                                onClick={() => setSelectedActor(null)}
                              >
                                {badgeContent}
                              </Link>
                            ) : (
                              <span key={sIdx}>
                                {badgeContent}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
