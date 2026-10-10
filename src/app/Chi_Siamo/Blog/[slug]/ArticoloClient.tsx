"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { CarouselBlock } from "@/components/ui/CarouselBlock";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import { Section } from "@/components/ui/Section";
import { ShareModal } from "@/components/ui/ShareModal";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function ArticoloClient({
  content: initialContent,
  slug
}: {
  content: any;
  slug: string;
}) {
  const content = useLiveContent(initialContent);
  const blog = content?.pages?.blog || {};
  const article = (blog?.articles || []).find((a: any) => a?.slug === slug);

  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: LightboxImage[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!article) {
    const notFoundTitle = defaultText(blog.not_found_title, "Articolo non trovato");
    const backLabel = defaultText(blog.back_to_archive_label, "Torna al Blog");

    return (
      <div className="pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        {notFoundTitle && <h1 className="text-4xl font-bold">{notFoundTitle}</h1>}
        {backLabel && (
          <Link
            href={blog.archive_href || "/Chi_Siamo/Blog"}
            prefetch={false}
            className="text-primary mt-4 inline-block font-bold hover:underline"
          >
            {backLabel}
          </Link>
        )}
      </div>
    );
  }

  const sections: any[] = Array.isArray(article.content_sections) ? article.content_sections : [];
  const articleDate = defaultText(article.date, article.year);

  return (
    <div>
      {/* Article Header */}
      <PageHeader
        title={defaultText(article.title)}
        description={defaultText(article.short_description)}
        backLink={{
          href: blog.archive_href || "/Chi_Siamo/Blog",
          label: defaultText(blog.back_to_archive_label, "Torna al Blog")
        }}
        compact
      />

      {/* Modular Content Sections (Identical structure to Chi Siamo chapters) */}
      {sections.filter((s) => s.visible !== false).map((section: any, idx: number) => {
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
            badge={idx === 0 && articleDate ? articleDate : defaultText(section.year)}
            badgePrefix=""
            badgeIcon={Calendar}
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
                        fallbackAlt="Foto articolo"
                        ariaPrefix="Foto articolo"
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

      {/* Footer Navigation & Share Section */}
      <Section className="py-12 bg-muted/10 border-t border-foreground/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/Chi_Siamo/Blog"
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Tutti gli articoli del Blog</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm"
          >
            <Share2 size={16} />
            <span>Condividi questo articolo</span>
          </button>
        </div>
      </Section>

      {/* Image Lightbox */}
      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        uiContent={content?.ui?.lightbox}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={article.title}
        url={typeof window !== "undefined" ? window.location.href : ""}
        uiContent={content?.ui?.share_modal}
      />
    </div>
  );
}
