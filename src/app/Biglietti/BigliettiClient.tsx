"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Ticket, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { trackInitiateCheckout } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

interface TicketItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  image?: string;
  date?: string;
  location?: string;
  checkoutHref: string;
  detailsHref?: string;
}

export default function BigliettiClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const hub = content?.ticketing_hub || {
    title: "Biglietteria & Prevendite",
    description: "Acquista i biglietti ufficiali per le produzioni teatrali della compagnia Gli Attomatti a Zurigo."
  };

  const ticketingPages: any[] = Array.isArray(content?.ticketing_pages)
    ? content.ticketing_pages.filter((p: any) => p && p.active === true && p.slug?.trim() && p.eventfrog_url?.trim())
    : [];

  const archiveShows: any[] = Array.isArray(content?.pages?.spettacoli?.archive_sections)
    ? content.pages.spettacoli.archive_sections
    : [];

  // Show only active ticketing page slugs
  const items: TicketItem[] = ticketingPages.map((page: any) => {
    const slug = page.slug.trim();
    const matchingShow = archiveShows.find(
      (s: any) => s.slug === slug || page.back_link_href?.includes(s.slug)
    );

    return {
      id: page.id || `ticket-${slug}`,
      title: page.title || matchingShow?.title || "Spettacolo",
      category: page.category || "Spettacolo Teatrale",
      description: page.description || matchingShow?.short_description || "Biglietteria ufficiale online con cassa Eventfrog.",
      image: page.image?.trim() || matchingShow?.hero_image || matchingShow?.images?.[0]?.url || "/images/1782553290530-TheaterCurtain.webp",
      date: matchingShow?.date,
      location: matchingShow?.location,
      checkoutHref: `/Biglietti/${slug}`,
      detailsHref: page.back_link_href || (matchingShow?.slug ? `/Spettacoli/${matchingShow.slug}` : undefined)
    };
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        title={hub.title || "Biglietteria & Prevendite"}
        description={hub.description || "Acquista i biglietti ufficiali per le produzioni teatrali della compagnia Gli Attomatti a Zurigo."}
      />

      <Section className="py-20 lg:py-24">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col bg-muted/20 border border-foreground/10 rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Poster / Hero Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
                  <Image
                    src={item.image || "/images/1782553290530-TheaterCurtain.webp"}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                  {item.category && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
                      <Ticket size={12} />
                      <span>{item.category}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black uppercase tracking-tight group-hover:text-primary transition-colors text-balance break-words">
                      {item.title}
                    </h2>

                    {item.description && (
                      <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {(item.date || item.location) && (
                      <div className="pt-3 flex flex-col gap-2 text-xs text-foreground/80 font-medium">
                        {item.date && (
                          <div className="flex items-center gap-2 text-accent">
                            <Calendar size={14} className="shrink-0" />
                            <span>{item.date}</span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-2 text-foreground/60">
                            <MapPin size={14} className="shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-foreground/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <Link
                      href={item.checkoutHref}
                      onClick={() => trackInitiateCheckout(item.title, item.checkoutHref)}
                      className="flex-1 py-3 px-5 rounded-full bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                    >
                      <span>Acquista Biglietto</span>
                      <ArrowRight size={14} />
                    </Link>

                    {item.detailsHref && (
                      <Link
                        href={item.detailsHref}
                        className="py-3 px-4 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center"
                      >
                        Dettagli
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-muted/20 border border-foreground/5 rounded-3xl">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
              <Ticket size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">
              Nessuna prevendita aperta
            </h2>
            <p className="text-foreground/60 text-sm leading-relaxed mb-8">
              Al momento non ci sono biglietti in vendita diretta. Scopri il nostro cartellone e i prossimi spettacoli in arrivo!
            </p>
            <Link
              href="/Spettacoli"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <span>Vedi Spettacoli</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </Section>
    </div>
  );
}
