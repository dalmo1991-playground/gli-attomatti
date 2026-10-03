"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { RichText } from "@/components/ui/RichText";
import Image from "next/image";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

const MotionImage = motion.create(Image);

function SectionPhotoCarousel({
  images,
  onImageClick
}: {
  images: Array<{ url: string; alt?: string; no_crop?: boolean }>;
  onImageClick: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative aspect-video md:aspect-[16/10] overflow-hidden rounded-3xl shadow-2xl bg-muted/20">
      {/* Ambient background glow matching home page */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="popLayout">
        <MotionImage
          key={currentIndex}
          src={images[currentIndex]?.url?.trim() || "/images/1782553290530-TheaterCurtain.webp"}
          alt={images[currentIndex]?.alt || "Foto"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`cursor-pointer transition-transform duration-700 ${images[currentIndex]?.no_crop ? "object-contain" : "object-cover hover:scale-105"}`}
          onClick={() => onImageClick(currentIndex)}
        />
      </AnimatePresence>

      {/* Carousel Indicators (Dots) if multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === currentIndex
                  ? "bg-primary w-6 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                  : "bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
        <Section key={idx} className={cn("py-24", idx % 2 !== 0 && "bg-muted/10")}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
            <div className="md:col-span-4 sticky top-32">
              <h2 className="text-3xl font-black uppercase tracking-tight mb-6">
                {section.title}
              </h2>
              <div className="w-12 h-1 bg-primary" />
            </div>

            <div className="md:col-span-8">
              <div className="prose prose-xl prose-invert max-w-none">
                <RichText
                  content={section.text}
                  className="text-xl text-foreground/80 leading-relaxed mb-12"
                />

                {section.images && section.images.length > 0 && (
                  <SectionPhotoCarousel
                    images={section.images}
                    onImageClick={(imgIdx) =>
                      setLightbox({
                        isOpen: true,
                        index: imgIdx,
                        images: section.images
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </Section>
      ))}

      {/* Navigation Links Section */}
      {navLinks.length > 0 && (
        <Section className="py-24 bg-muted/10 border-t border-foreground/5">
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
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
