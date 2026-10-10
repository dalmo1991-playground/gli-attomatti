"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users, MessageSquare, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { CarouselBlock } from "@/components/ui/CarouselBlock";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function ChiSiamoClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const chi_siamo = content?.pages?.chi_siamo || {};

  const sections: any[] = Array.isArray(chi_siamo.content_sections) ? chi_siamo.content_sections : [];
  const rawNavLinks: any[] = Array.isArray(chi_siamo.navigation_links) ? chi_siamo.navigation_links : [];
  const navLinks = rawNavLinks.filter((l) => l && l.label !== null);

  const iconMap: Record<string, any> = {
    users: Users,
    "message-square": MessageSquare,
    newspaper: Newspaper
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
        title={defaultText(chi_siamo.title, "Chi Siamo")}
        description={defaultText(chi_siamo.description)}
      />

      {/* Content Sections */}
      {sections.filter((s) => s.visible !== false).map((section: any, idx: number) => {
        // Modular blocks normalization: if section.blocks is provided, use it.
        // Otherwise, fall back to legacy format: [text block, images block]
        let blocks: Array<{ type: "text" | "gallery"; text?: string; images?: any[] }> = [];
        if (Array.isArray(section.blocks) && section.blocks.length > 0) {
          blocks = section.blocks;
        } else {
          if (section.text) {
            blocks.push({ type: "text", text: section.text });
          }
          if (Array.isArray(section.images) && section.images.length > 0) {
            blocks.push({ type: "gallery", images: section.images });
          }
        }

        return (
          <ArchiveTimelineSection
            key={section.slug || idx}
            title={defaultText(section.title)}
            badge={defaultText(section.year)}
            badgePrefix={defaultText(chi_siamo.year_prefix)}
            text={null}
            isAlternate={idx % 2 !== 0}
          >
            <div className="space-y-8 md:space-y-12">
              {blocks.map((block, bIdx) => {
                if (block.type === "text" && block.text) {
                  return (
                    <RichText
                      key={bIdx}
                      content={block.text}
                      className="text-xl text-foreground/80 leading-relaxed font-normal"
                    />
                  );
                }

                if (block.type === "gallery" && Array.isArray(block.images) && block.images.length > 0) {
                  return (
                    <div key={bIdx} className="my-6 sm:my-8 first:mt-0 last:mb-0">
                      <CarouselBlock
                        images={block.images}
                        fallbackAlt={chi_siamo.fallback_photo_alt}
                        ariaPrefix={chi_siamo.photo_aria_prefix}
                        onImageClick={(imgIdx) =>
                          setLightbox({
                            isOpen: true,
                            index: imgIdx,
                            images: block.images || []
                          })
                        }
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </ArchiveTimelineSection>
        );
      })}

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
                    prefetch={false}
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
