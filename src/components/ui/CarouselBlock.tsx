"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSafeImageProps } from "@/lib/youtube";

const MotionImage = motion.create(Image);

export interface CarouselImageItem {
  url: string;
  alt?: string;
  no_crop?: boolean;
}

export interface CarouselUiContent {
  fallback_alt?: string;
  aria_prefix?: string;
  prev_aria_label?: string;
  next_aria_label?: string;
}

export interface CarouselBlockProps {
  images: CarouselImageItem[];
  onImageClick?: (index: number) => void;
  fallbackAlt?: string;
  ariaPrefix?: string;
  uiContent?: CarouselUiContent;
  autoplayIntervalMs?: number;
  showArrows?: boolean;
  aspectRatioClass?: string;
  className?: string;
}

export function CarouselBlock({
  images = [],
  onImageClick,
  fallbackAlt,
  ariaPrefix,
  uiContent,
  autoplayIntervalMs = 4000,
  showArrows = false,
  aspectRatioClass = "aspect-video md:aspect-[16/10]",
  className
}: CarouselBlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const resolvedFallbackAlt = fallbackAlt || uiContent?.fallback_alt || "";
  const resolvedAriaPrefix = ariaPrefix || uiContent?.aria_prefix || "";

  const validImages = images.filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0);
  const count = validImages.length;

  const nextSlide = useCallback(() => {
    if (count > 1) {
      setCurrentIndex((prev) => (prev + 1) % count);
    }
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count > 1) {
      setCurrentIndex((prev) => (prev - 1 + count) % count);
    }
  }, [count]);

  useEffect(() => {
    if (count <= 1 || isPaused || autoplayIntervalMs <= 0) return;
    const timer = setInterval(nextSlide, autoplayIntervalMs);
    return () => clearInterval(timer);
  }, [count, isPaused, autoplayIntervalMs, nextSlide]);

  if (count === 0) return null;

  const currentImage = validImages[currentIndex];
  const { src: safeSrc, unoptimized: isCarouselUnoptimized, isVideo } = getSafeImageProps(currentImage?.url);
  const safeAlt = currentImage?.alt || (resolvedFallbackAlt ? `${resolvedFallbackAlt} ${currentIndex + 1}` : "");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl shadow-2xl bg-muted/20 select-none group",
        aspectRatioClass,
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient theatrical background glow */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute -top-4 -left-4 w-28 h-28 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-4 -right-4 w-36 h-36 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Image Transition */}
      <AnimatePresence mode="popLayout">
        <MotionImage
          key={`${safeSrc}-${currentIndex}`}
          src={safeSrc}
          alt={safeAlt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          fill
          unoptimized={isCarouselUnoptimized}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className={cn(
            "transition-transform duration-700",
            onImageClick && "cursor-pointer",
            currentImage?.no_crop ? "object-contain bg-background/50" : "object-cover group-hover:scale-105"
          )}
          onClick={() => onImageClick?.(currentIndex)}
        />
      </AnimatePresence>

      {/* Video Indicator Overlay */}
      {isVideo && (
        <div
          onClick={() => onImageClick?.(currentIndex)}
          className={cn(
            "absolute inset-0 z-15 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors",
            onImageClick && "cursor-pointer"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
            <Play size={24} className="fill-white ml-0.5" />
          </div>
          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider border border-white/10">
            <Play size={10} className="fill-white" /> Video YouTube
          </div>
        </div>
      )}

      {/* Optional Left / Right Arrow Controls */}
      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label={uiContent?.prev_aria_label}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/60 hover:bg-background/90 text-foreground backdrop-blur-md border border-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label={uiContent?.next_aria_label}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/60 hover:bg-background/90 text-foreground backdrop-blur-md border border-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-lg"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Carousel Pill Indicators */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-20 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-md border border-foreground/10">
          {validImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className="p-1 flex items-center justify-center"
              aria-label={`${resolvedAriaPrefix || ""} ${i + 1}`.trim()}
            >
              <span
                className={cn(
                  "rounded-full transition-all duration-300 block",
                  i === currentIndex
                    ? "bg-primary w-6 h-2 shadow-[0_0_8px_rgba(251,113,133,0.6)]"
                    : "bg-white/40 hover:bg-white/70 w-2 h-2"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
