"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import Image from "next/image";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { getSafeImageProps } from "@/lib/youtube";
import { defaultText } from "@/lib/utils";
import { trackViewContent } from "@/lib/tracking";

export default function AttoriClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const attori = content?.pages?.attori || {};
  const list: any[] = Array.isArray(attori.list) ? attori.list : [];
  const join_us = attori.join_us || {};

  const [lightbox, setLightbox] = useState({ isOpen: false, index: 0 });
  const [selectedActor, setSelectedActor] = useState<any | null>(null);

  const galleryImages = useMemo(() => {
    return list.map((person: any) => ({
      url: person?.image?.trim() || "/images/1782553290530-TheaterCurtain.webp",
      alt: person?.name || attori.fallback_actor_alt || ""
    }));
  }, [list, attori.fallback_actor_alt]);

  const emptyMsg = defaultText(attori.empty_message);
  const joinTitle = defaultText(join_us.title);
  const joinText = defaultText(join_us.text);
  const joinCta = defaultText(join_us.cta_label);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={defaultText(attori.title, "Attori")}
        description={defaultText(attori.description)}
        backLink={{ href: attori.back_href || "/Chi_Siamo", label: defaultText(attori.back_label, "Torna a Chi Siamo") }}
        compact
      />

      {/* Actors Grid */}
      <Section className="py-12 sm:py-16 md:py-24">
        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 md:gap-16">
            {list.filter((p) => p.visible !== false).map((person: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover="hover"
                onClick={() => {
                  setSelectedActor(person);
                  if (person?.name) {
                    trackViewContent(person.name, "Attore");
                  }
                }}
                className="group text-center cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto mb-6 sm:mb-8">
                  {/* Decorative Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 scale-110 group-hover:scale-125 group-hover:border-amber-400/50 transition-all duration-700 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-none" />
                  
                  {/* Profile Pic Container */}
                  <div 
                    className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 sm:ring-8 ring-background group-hover:ring-amber-500/30 transition-all duration-700 pointer-events-none"
                  >
                    {(() => {
                      const { src: actorSrc, unoptimized: isActorUnoptimized } = getSafeImageProps(person.image);
                      return (
                        <Image 
                          src={actorSrc} 
                          alt={person.name || attori.fallback_actor_alt || ""} 
                          fill
                          unoptimized={isActorUnoptimized}
                          sizes="(max-width: 640px) 192px, 256px"
                          className="object-cover transition-all duration-700 scale-100 group-hover:scale-105"
                        />
                      );
                    })()}
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  {person.name && (
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight group-hover:text-primary transition-colors min-h-[3rem] sm:min-h-[4rem] flex items-center justify-center text-balance break-words">
                      {person.name}
                    </h3>
                  )}
                  {person.role && (
                    <div className="inline-block px-3.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                      {person.role}
                    </div>
                  )}
                  {person.bio && (
                    <p className="text-foreground/60 leading-relaxed max-w-sm mx-auto pt-3 sm:pt-4 border-t border-foreground/5 whitespace-pre-wrap text-sm sm:text-base text-pretty">
                      {person.bio}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          emptyMsg && (
            <div className="text-center py-12 text-foreground/40 font-medium">
              {emptyMsg}
            </div>
          )
        )}
      </Section>

      {/* Join Us Call to Action */}
      {(joinTitle || joinText || joinCta) && (
        <Section className="bg-muted/10 py-12 sm:py-16 md:py-24 text-center border-t border-foreground/5">
          <div className="max-w-2xl mx-auto">
            {joinTitle && (
              <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 uppercase tracking-tight">
                {joinTitle}
              </h2>
            )}
            {joinText && (
              <p className="text-base sm:text-lg text-foreground/60 mb-8 sm:mb-10 text-pretty">
                {joinText}
              </p>
            )}
            {joinCta && (
              join_us.cta_href ? (
                <Link 
                  href={join_us.cta_href}
                  prefetch={false}
                  className="px-8 sm:px-10 py-4 sm:py-5 bg-primary text-primary-foreground rounded-full font-black text-base sm:text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 inline-block"
                >
                  {joinCta}
                </Link>
              ) : (
                <div className="px-8 sm:px-10 py-4 sm:py-5 bg-primary/20 text-primary rounded-full font-black text-base sm:text-lg inline-block">
                  {joinCta}
                </div>
              )
            )}
          </div>
        </Section>
      )}

      <Lightbox 
        images={galleryImages}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        uiContent={content?.ui?.lightbox}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />

      <AnimatePresence>
        {selectedActor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-4xl bg-background border border-foreground/10 rounded-3xl shadow-2xl z-10 p-5 sm:p-8 md:p-10 max-h-[88vh] overflow-y-auto overscroll-contain custom-scrollbar"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedActor(null)}
                aria-label={attori.modal_close_aria}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all active:scale-95 cursor-pointer z-30"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* Pop-up Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-center md:items-start w-full pt-4 md:pt-0">
                {/* Profile Pic Column */}
                <div className="md:col-span-5 flex justify-center md:sticky md:top-0">
                  <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-72 md:h-72 rounded-full overflow-hidden shadow-xl ring-4 sm:ring-8 ring-muted border border-foreground/5 shrink-0">
                    {(() => {
                      const { src: modalSrc, unoptimized: isModalUnoptimized } = getSafeImageProps(selectedActor.image);
                      return (
                        <Image
                          src={modalSrc}
                          alt={selectedActor.name}
                          fill
                          unoptimized={isModalUnoptimized}
                          sizes="(max-width: 640px) 140px, (max-width: 768px) 180px, 320px"
                          className="object-cover"
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Info Column */}
                <div className="md:col-span-7 space-y-4 sm:space-y-6 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight mb-2 sm:mb-3">
                      {selectedActor.name}
                    </h2>
                    <div className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6">
                      {selectedActor.role}
                    </div>
                    {selectedActor.description && (
                      <RichText
                        content={selectedActor.description}
                        className="text-foreground/75 leading-relaxed text-base sm:text-lg border-t border-foreground/5 pt-4 sm:pt-6 text-pretty"
                      />
                    )}
                    {selectedActor.shows && selectedActor.shows.length > 0 && (
                      <div className="border-t border-foreground/5 pt-5 sm:pt-6 mt-5 sm:mt-6 space-y-3 sm:space-y-4">
                        {attori.shows_heading && (
                          <h4 className="text-xs font-black uppercase tracking-widest text-foreground/45">
                            {attori.shows_heading}
                          </h4>
                        )}
                        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center md:justify-start">
                          {selectedActor.shows.map((show: any, sIdx: number) => {
                            const badgeContent = (
                              <span className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-foreground/[0.04] text-foreground hover:bg-primary/10 hover:text-primary rounded-xl text-xs sm:text-sm font-semibold transition-all border border-foreground/5 cursor-pointer active:scale-95">
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
                                prefetch={false}
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
