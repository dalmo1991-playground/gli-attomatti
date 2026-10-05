"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { CarouselBlock } from "@/components/ui/CarouselBlock";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function ChiSiamoClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const chi_siamo = content?.pages?.chi_siamo || {
    title: "Chi Siamo",
    description: "La compagnia teatrale Gli Attomatti di Zurigo.",
    content_sections: [],
    navigation_links: []
  };

  const sections: any[] = Array.isArray(chi_siamo.content_sections) ? chi_siamo.content_sections : [];
  const navLinks: any[] = Array.isArray(chi_siamo.navigation_links) ? chi_siamo.navigation_links : [];

  const iconMap: Record<string, any> = {
    users: Users,
    "message-square": MessageSquare
  };

  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: LightboxImage[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  return (
    <div>
      {/* Hero Section */}
      <PageHeader
        title={chi_siamo.title || "Chi Siamo"}
        description={chi_siamo.description || "La compagnia teatrale Gli Attomatti di Zurigo."}
      />

      {/* Content Sections */}
      {sections.filter((s) => s.visible !== false).map((section: any, idx: number) => (
        <ArchiveTimelineSection
          key={section.slug || idx}
          title={section.title}
          badge={section.year}
          badgePrefix={chi_siamo.year_prefix || "Anno "}
          text={section.text}
          isAlternate={idx % 2 !== 0}
        >
          {section.images && section.images.length > 0 && (
            <CarouselBlock
              images={section.images}
              fallbackAlt={chi_siamo.fallback_photo_alt}
              ariaPrefix={chi_siamo.photo_aria_prefix}
              onImageClick={(imgIdx) =>
                setLightbox({
                  isOpen: true,
                  index: imgIdx,
                  images: section.images
                })
              }
            />
          )}
        </ArchiveTimelineSection>
      ))}

      {/* Navigation Links Section */}
      {navLinks.length > 0 && (
        <Section className="py-12 sm:py-16 md:py-24 bg-muted/10 border-t border-foreground/5">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {navLinks.filter((l) => l.visible !== false).map((link: any, idx: number) => {
                const Icon = iconMap[link.icon] || ArrowRight;
                const safeHref = link.href?.startsWith("/") || link.href?.startsWith("http")
                  ? link.href
                  : `/${link.href || ""}`;
                return safeHref ? (
                  <Link
                    key={idx}
                    href={safeHref}
                    className="flex items-center justify-between p-8 bg-background border border-foreground/5 rounded-2xl hover:border-primary/30 transition-all hover:-translate-y-1 group shadow-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-6 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon size={24} />
                      </div>
                      <span className="text-xl font-bold">{link.label}</span>
                    </div>
                    <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                  </Link>
                ) : (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-8 bg-background border border-foreground/5 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-6">
                        <Icon size={24} />
                      </div>
                      <span className="text-xl font-bold">{link.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        uiContent={content?.ui?.lightbox}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
