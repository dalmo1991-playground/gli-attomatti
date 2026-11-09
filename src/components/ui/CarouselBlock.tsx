"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn, defaultText } from "@/lib/utils";
import { getSafeImageProps } from "@/lib/youtube";

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

  const resolvedFallbackAlt = defaultText(fallbackAlt, uiContent?.fallback_alt, "") || "";
  const resolvedAriaPrefix = defaultText(ariaPrefix, uiContent?.aria_prefix, "") || "";

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

  // Traccia eventuali tentativi di retry (cache-busting) e fallimenti definitivi per ogni slide
  const [retriedIndices, setRetriedIndices] = useState<Set<number>>(() => new Set());
  const [failedIndices, setFailedIndices] = useState<Set<number>>(() => new Set());

  const handleImageError = (idx: number) => {
    // Primo errore (es. 404 salvato in cache dal browser durante il build Vercel):
    // effettua 1 singolo retry con query param di cache-busting prima di mostrare il fallback
    if (!retriedIndices.has(idx)) {
      setRetriedIndices((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
      return;
    }

    setFailedIndices((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  const currentImage = validImages[currentIndex];
  const { isVideo } = getSafeImageProps(currentImage?.url);

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

      {/* Layered Image Stack:
        Tutte le slide del carosello vengono renderizzate sin dall'SSR così da ricevere
        lo stesso URL/deployment token ed evitare disallineamenti di cache tra la prima e le successive. */}
      {validImages.map((img, idx) => {
        const isActive = idx === currentIndex;
        const { src: itemSafeSrc, unoptimized: isItemUnoptimized } = getSafeImageProps(img?.url);
        const hasRetried = retriedIndices.has(idx);
        const resolvedSrc = hasRetried
          ? `${itemSafeSrc}${itemSafeSrc.includes("?") ? "&" : "?"}v=retry`
          : itemSafeSrc;
        const itemAlt = img?.alt || (resolvedFallbackAlt ? `${resolvedFallbackAlt} ${idx + 1}` : "");
        const isFailed = failedIndices.has(idx);

        return (
          <div
            key={`slide-${idx}-${itemSafeSrc}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              isActive ? "opacity-100 z-1" : "opacity-0 pointer-events-none z-0"
            )}
            onClick={isActive && onImageClick ? () => onImageClick(currentIndex) : undefined}
          >
            {isFailed ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/40 text-foreground/40 p-4 text-center select-none">
                <Image
                  src="/images/1782553290530-TheaterCurtain.webp"
                  alt="Gli Attomatti"
                  fill
                  className="object-cover opacity-25 filter grayscale"
                  unoptimized
                />
                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    {itemAlt || "Immagine non disponibile"}
                  </p>
                </div>
              </div>
            ) : (
              <Image
                src={resolvedSrc}
                alt={itemAlt}
                fill
                priority={idx === 0}
                loading={idx <= 1 ? "eager" : "lazy"}
                unoptimized={isItemUnoptimized}
                sizes="(max-width: 1024px) 100vw, 60vw"
                onError={() => handleImageError(idx)}
                className={cn(
                  "transition-transform duration-700",
                  isActive && onImageClick && "cursor-pointer",
                  img?.no_crop ? "object-contain bg-background/50" : "object-cover group-hover:scale-105"
                )}
              />
            )}
          </div>
        );
      })}

        {/* Video Indicator Overlay */}
        {isVideo && (
          <div
            onClick={() => onImageClick?.(currentIndex)}
            className={cn(
              "absolute inset-0 z-15 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors",
              onImageClick && "cursor-pointer"
            )}
          >
            <div className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Play size={24} className="fill-primary-foreground ml-0.5" />
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider border border-white/10">
              <Play size={10} className="fill-primary text-primary" /> Video YouTube
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
