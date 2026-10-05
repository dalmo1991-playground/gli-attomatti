"use client";

import React from "react";
import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogCard, CatalogGrid } from "@/components/ui/CatalogCard";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function RegistrazioniClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const hub = content?.registration_hub || {
    title: "Iscrizioni & Corsi",
    description: "Iscriviti ai laboratori teatrali, workshop e alle attività formative della compagnia Gli Attomatti."
  };

  const registrationPages: any[] = Array.isArray(content?.registration_pages)
    ? content.registration_pages.filter(
        (p: any) => p && p.active === true && p.slug?.trim() && p.tally_url?.trim()
      )
    : [];

  const initiatives: any[] = Array.isArray(content?.pages?.iniziative?.archive_sections)
    ? content.pages.iniziative.archive_sections
    : [];

  // Show only active registration page slugs
  const items = registrationPages.map((page: any) => {
    const slug = page.slug.trim();
    const matchingInit = initiatives.find(
      (i: any) => i.slug === slug || page.back_link_href?.includes(i.slug)
    );

    return {
      id: page.id || `reg-${slug}`,
      title: page.title?.trim() || matchingInit?.title || "Iniziativa Teatrale",
      category: page.category || "Laboratorio & Workshop",
      categoryIcon: ClipboardList,
      description:
        page.description?.trim() ||
        matchingInit?.short_description ||
        "Modulo di registrazione ufficiale online.",
      image:
        page.image?.trim() ||
        matchingInit?.hero_image ||
        matchingInit?.images?.[0]?.url ||
        "/images/1782553290530-TheaterCurtain.webp",
      date: matchingInit?.year ? `Edizione ${matchingInit.year}` : undefined,
      primaryHref: `/Registrazioni/${slug}`,
      primaryLabel: hub.register_online_cta || "Iscriviti Online",
      secondaryHref:
        page.back_link_href ||
        (matchingInit?.slug ? `/Iniziative/${matchingInit.slug}` : undefined),
      secondaryLabel: hub.info_cta || "Info"
    };
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        title={hub.title || "Iscrizioni & Corsi"}
        description={hub.description || "Iscriviti ai laboratori teatrali, workshop e alle attività formative della compagnia Gli Attomatti."}
      />

      <Section className="py-20 lg:py-24">
        {items.length > 0 ? (
          <CatalogGrid>
            {items.map((item, idx) => (
              <CatalogCard key={item.id} item={item} index={idx} />
            ))}
          </CatalogGrid>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-muted/20 border border-foreground/5 rounded-3xl">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
              <ClipboardList size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">
              {hub.empty_title || "Nessuna iscrizione aperta"}
            </h2>
            <p className="text-foreground/60 text-sm leading-relaxed mb-8">
              {hub.empty_description || "Al momento le registrazioni per corsi e workshop sono chiuse. Consulta le nostre iniziative in programma!"}
            </p>
            <Link
              href="/Iniziative"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <span>{hub.view_initiatives_cta || "Vedi Iniziative"}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </Section>
    </div>
  );
}
