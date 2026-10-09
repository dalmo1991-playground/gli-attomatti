"use client";

import React from "react";
import Link from "next/link";
import { Ticket, ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogCard, CatalogGrid } from "@/components/ui/CatalogCard";
import { trackInitiateCheckout } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

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
  const items = ticketingPages.map((page: any) => {
    const slug = page.slug.trim();
    const matchingShow = archiveShows.find(
      (s: any) => s.slug === slug || page.back_link_href?.includes(s.slug)
    );

    return {
      id: page.id || `ticket-${slug}`,
      title: defaultText(page.title, matchingShow?.title, "Spettacolo"),
      category: defaultText(page.category, "Spettacolo Teatrale"),
      categoryIcon: Ticket,
      description: defaultText(page.description, matchingShow?.short_description, "Biglietteria ufficiale online con cassa Eventfrog."),
      image: page.image?.trim() || matchingShow?.hero_image || matchingShow?.images?.[0]?.url || "/images/1782553290530-TheaterCurtain.webp",
      date: matchingShow?.date,
      location: matchingShow?.location,
      primaryHref: `/Biglietti/${slug}`,
      primaryLabel: defaultText(hub.buy_ticket_cta, "Acquista Biglietto"),
      secondaryHref: page.back_link_href || (matchingShow?.slug ? `/Spettacoli/${matchingShow.slug}` : undefined),
      secondaryLabel: defaultText(hub.details_cta, "Dettagli"),
      onPrimaryClick: () => trackInitiateCheckout(page.title || matchingShow?.title || "Spettacolo", `/Biglietti/${slug}`)
    };
  });

  const emptyTitle = defaultText(hub.empty_title, "Nessuna prevendita aperta");
  const emptyDesc = defaultText(hub.empty_description, "Al momento non ci sono biglietti in vendita diretta. Scopri il nostro cartellone e i prossimi spettacoli in arrivo!");
  const viewShowsCta = defaultText(hub.view_shows_cta, "Vedi Spettacoli");

  return (
    <div className="min-h-screen">
      <PageHeader
        title={defaultText(hub.title, "Biglietteria & Prevendite")}
        description={defaultText(hub.description, "Acquista i biglietti ufficiali per le produzioni teatrali della compagnia Gli Attomatti a Zurigo.")}
      />

      <Section className="py-20 lg:py-24">
        {items.length > 0 ? (
          <CatalogGrid>
            {items.map((item, idx) => (
              <CatalogCard key={item.id} item={item} index={idx} />
            ))}
          </CatalogGrid>
        ) : (
          (emptyTitle || emptyDesc || viewShowsCta) && (
            <div className="max-w-md mx-auto text-center py-16 px-6 bg-muted/20 border border-foreground/5 rounded-3xl">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                <Ticket size={32} />
              </div>
              {emptyTitle && (
                <h2 className="text-2xl font-black uppercase tracking-tight mb-3">
                  {emptyTitle}
                </h2>
              )}
              {emptyDesc && (
                <p className="text-foreground/60 text-sm leading-relaxed mb-8">
                  {emptyDesc}
                </p>
              )}
              {viewShowsCta && (
                <Link
                  href="/Spettacoli"
                  prefetch={false}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  <span>{viewShowsCta}</span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )
        )}
      </Section>
    </div>
  );
}
