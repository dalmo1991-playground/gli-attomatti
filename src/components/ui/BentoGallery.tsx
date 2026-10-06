"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Maximize2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { isYouTubeUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

export interface BentoGalleryImage {
  url?: string;
  alt?: string;
  no_crop?: boolean;
}

interface BentoGalleryProps {
  images: BentoGalleryImage[];
  title?: string;
  onImageClick: (index: number) => void;
  className?: string;
}

export function BentoGallery({
  images,
  title = "Foto",
  onImageClick,
  className
}: BentoGalleryProps) {
  if (!images || images.length === 0) return null;

  const total = images.length;

  return (
    <div className={cn("mt-12 sm:mt-16", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
        {images.map((img, idx) => {
          const isVideo = isYouTubeUrl(img.url);
          const displaySrc = isVideo
            ? getYouTubeThumbnailUrl(img.url)
            : img.url?.trim() || "/images/1782553290530-TheaterCurtain.webp";

          // Determine column span and height dynamically for editorial rhythm
          let layoutClasses = "";
          if (total === 1) {
            layoutClasses = "sm:col-span-12 aspect-[16/10]";
          } else if (total === 2) {
            layoutClasses = idx === 0 
              ? "sm:col-span-7 h-[280px] sm:h-[380px]" 
              : "sm:col-span-5 h-[280px] sm:h-[380px]";
          } else if (idx === 0) {
            layoutClasses = "sm:col-span-12 aspect-[16/9]";
          } else {
            const remIdx = idx - 1;
            const isLastSingle = remIdx === total - 2 && remIdx % 2 === 0;
            if (isLastSingle) {
              layoutClasses = "sm:col-span-12 aspect-[16/9] sm:aspect-[21/9]";
            } else {
              const pairCycle = Math.floor(remIdx / 2) % 2;
              const isFirstInPair = remIdx % 2 === 0;
              if (pairCycle === 0) {
                layoutClasses = isFirstInPair 
                  ? "sm:col-span-7 h-[280px] sm:h-[360px]" 
                  : "sm:col-span-5 h-[280px] sm:h-[360px]";
              } else {
                layoutClasses = isFirstInPair 
                  ? "sm:col-span-5 h-[280px] sm:h-[360px]" 
                  : "sm:col-span-7 h-[280px] sm:h-[360px]";
              }
            }
          }

          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onClick={() => onImageClick(idx)}
              className={cn(
                "relative w-full rounded-3xl overflow-hidden bg-muted shadow-xl border border-foreground/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(var(--secondary-rgb),0.25)] hover:border-secondary/40 cursor-pointer group",
                layoutClasses
              )}
            >
              <Image 
                src={displaySrc} 
                alt={img.alt || title} 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`transition-all duration-700 ${img.no_crop ? "object-contain" : "object-cover group-hover:scale-105"}`}
              />

              {/* Video Play Overlay if it's a YouTube video */}
              {isVideo ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Play size={24} className="fill-white ml-0.5" />
                  </div>
                  <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider border border-white/10">
                    <Play size={10} className="fill-white" /> Guarda Video
                  </div>
                </div>
              ) : (
                /* Glassmorphic expand icon badge with golden accent for standard images */
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/70 backdrop-blur-md border border-accent/40 flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg pointer-events-none">
                  <Maximize2 size={14} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
