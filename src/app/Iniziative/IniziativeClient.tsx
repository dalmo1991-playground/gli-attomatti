"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { Calendar } from "lucide-react";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function IniziativeClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const iniziative = content?.pages?.iniziative || {};

  const sections: any[] = Array.isArray(iniziative.archive_sections) ? iniziative.archive_sections : [];
  const visibleSections = sections.filter((s) => s.visible !== false);
  const emptyTitle = defaultText(iniziative.empty_title);
  const emptyDesc = defaultText(iniziative.empty_description);

  return (
    <div>
      {/* Hero Section */}
      <PageHeader
        title={defaultText(iniziative.title, "Iniziative")}
        description={defaultText(iniziative.description)}
      />

      {/* Initiatives Archive Sections */}
      {visibleSections.length > 0 ? (
        visibleSections.map((section: any, idx: number) => (
          <ArchiveTimelineSection
            key={section.slug || idx}
            title={defaultText(section.title)}
            badge={defaultText(section.year)}
            badgePrefix={defaultText(iniziative.year_prefix)}
            href={section.slug ? `/Iniziative/${section.slug}` : undefined}
            ctaLabel={defaultText(section.discover_cta, iniziative.discover_cta)}
            text={defaultText(section.short_description, section.text, "") || ""}
            isAlternate={idx % 2 !== 0}
          />
        ))
      ) : (
        (emptyTitle || emptyDesc) && (
          <Section className="py-24 text-center">
            <Calendar className="mx-auto text-primary/40 mb-4" size={48} />
            {emptyTitle && (
              <h3 className="text-2xl font-bold mb-2">
                {emptyTitle}
              </h3>
            )}
            {emptyDesc && (
              <p className="text-foreground/60 max-w-md mx-auto">
                {emptyDesc}
              </p>
            )}
          </Section>
        )
      )}
    </div>
  );
}
