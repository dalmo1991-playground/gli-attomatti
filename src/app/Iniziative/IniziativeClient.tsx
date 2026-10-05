"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { Calendar } from "lucide-react";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function IniziativeClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const iniziative = content?.pages?.iniziative || {
    title: "Le Nostre Iniziative",
    description: "Corsi, laboratori ed eventi teatrali.",
    archive_sections: []
  };

  const sections: any[] = Array.isArray(iniziative.archive_sections) ? iniziative.archive_sections : [];
  const visibleSections = sections.filter((s) => s.visible !== false);

  return (
    <div>
      {/* Hero Section */}
      <PageHeader
        title={iniziative.title}
        description={iniziative.description}
      />

      {/* Initiatives Archive Sections */}
      {visibleSections.length > 0 ? (
        visibleSections.map((section: any, idx: number) => (
          <ArchiveTimelineSection
            key={section.slug || idx}
            title={section.title}
            badge={section.year}
            badgePrefix={iniziative.year_prefix || "Anno "}
            href={section.slug ? `/Iniziative/${section.slug}` : undefined}
            ctaLabel={section.discover_cta || iniziative.discover_cta || "Scopri l'iniziativa"}
            text={section.short_description || section.text || ""}
            isAlternate={idx % 2 !== 0}
          />
        ))
      ) : (
        <Section className="py-24 text-center">
          <Calendar className="mx-auto text-primary/40 mb-4" size={48} />
          <h3 className="text-2xl font-bold mb-2">
            {iniziative.empty_title || "Nuove iniziative in arrivo"}
          </h3>
          <p className="text-foreground/60 max-w-md mx-auto">
            {iniziative.empty_description || "Stiamo preparando i prossimi laboratori ed eventi teatrali. Torna a trovarci presto!"}
          </p>
        </Section>
      )}
    </div>
  );
}
