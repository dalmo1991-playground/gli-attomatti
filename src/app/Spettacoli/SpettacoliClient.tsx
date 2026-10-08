"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function SpettacoliClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const spettacoli = content?.pages?.spettacoli || {};

  const archive: any[] = Array.isArray(spettacoli.archive_sections) ? spettacoli.archive_sections : [];
  const visibleArchive = archive.filter((s) => s.visible !== false);
  const emptyMsg = defaultText(spettacoli.empty_message);

  return (
    <div>
      {/* Hero Section */}
      <PageHeader
        title={defaultText(spettacoli.title, "Spettacoli")}
        description={defaultText(spettacoli.description)}
      />

      {/* Archive Sections */}
      {visibleArchive.length > 0 ? (
        visibleArchive.map((section: any, idx: number) => (
          <ArchiveTimelineSection
            key={section.slug || idx}
            title={defaultText(section.title)}
            badge={defaultText(section.year)}
            badgePrefix={defaultText(spettacoli.year_prefix)}
            href={section.slug ? `/Spettacoli/${section.slug}` : undefined}
            ctaLabel={defaultText(section.discover_cta, spettacoli.discover_cta)}
            text={defaultText(section.short_description, section.text, "") || ""}
            isAlternate={idx % 2 !== 0}
          />
        ))
      ) : (
        emptyMsg && (
          <Section className="py-24 text-center">
            <div className="max-w-md mx-auto text-foreground/40 font-medium">
              {emptyMsg}
            </div>
          </Section>
        )
      )}
    </div>
  );
}
