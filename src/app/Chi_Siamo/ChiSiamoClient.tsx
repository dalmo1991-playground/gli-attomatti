"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import Image from "next/image";

const MotionImage = motion.create(Image);

function SectionPhotoCarousel({
  images,
  onImageClick
}: {
  images: Array<{ url: string; alt?: string }>;
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
          className="object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
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

export default function ChiSiamoClient({ content }: { content: any }) {
  const { chi_siamo } = content.pages;

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
    <div className="pt-20">
      {/* Hero Section */}
      <Section className="bg-muted/30 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tighter"
          >
            {chi_siamo.title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-1 bg-primary mx-auto mb-8"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-medium"
          >
            {chi_siamo.description}
          </motion.p>
        </div>
      </Section>

      {/* Content Sections */}
      {chi_siamo.content_sections.map((section: any, idx: number) => (
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
                <p className="text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap mb-12">
                  {section.text}
                </p>

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
      <Section className="py-24 bg-muted/10 border-t border-foreground/5">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {chi_siamo.navigation_links.map((link: any, idx: number) => {
              const Icon = iconMap[link.icon] || ArrowRight;
              return (
                <Link
                  key={idx}
                  href={link.href}
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
              );
            })}
          </div>
        </div>
      </Section>

      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
