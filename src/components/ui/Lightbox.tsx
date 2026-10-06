"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { isYouTubeUrl, getYouTubeEmbedUrl } from "@/lib/youtube";

export interface LightboxImage {
  url?: string;
  src?: string;
  alt?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  isOpen?: boolean;
  onClose: () => void;
  uiContent?: {
    close_aria_label?: string;
    prev_aria_label?: string;
    next_aria_label?: string;
    default_alt?: string;
  };
}

export function Lightbox({ images, initialIndex, isOpen = true, onClose, uiContent }: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const ui = uiContent || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  if (!mounted) return null;

  const currentItem = images[currentIndex];
  const currentMediaUrl = currentItem?.url || currentItem?.src || "";
  const isCurrentVideo = isYouTubeUrl(currentMediaUrl);

  return createPortal(
    <AnimatePresence>
      {isOpen && images.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm touch-pan-y"
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button with safe-area support */}
          <button
            onClick={onClose}
            aria-label={ui.close_aria_label || "Chiudi galleria"}
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all active:scale-90"
          >
            <X size={26} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                aria-label={ui.prev_aria_label || "Foto precedente"}
                className="hidden sm:flex absolute left-4 md:left-8 z-50 p-2 md:p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 rounded-full transition-all hover:scale-110 hover:-translate-x-1"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                aria-label={ui.next_aria_label || "Foto successiva"}
                className="hidden sm:flex absolute right-4 md:right-8 z-50 p-2 md:p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 rounded-full transition-all hover:scale-110 hover:translate-x-1"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <div 
            className="relative w-full max-w-7xl max-h-[85vh] px-3 sm:px-12 md:px-16 flex flex-col items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {isCurrentVideo ? (
                <motion.div
                  key={`video-${currentIndex}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black"
                >
                  <iframe
                    src={getYouTubeEmbedUrl(currentMediaUrl, { autoplay: true })}
                    title={currentItem?.alt || "Video YouTube"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </motion.div>
              ) : (
                <motion.img
                  key={`img-${currentIndex}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.2 }}
                  src={currentMediaUrl}
                  alt={currentItem?.alt || `${ui.default_alt || "Foto"} ${currentIndex + 1}`}
                  className="max-w-full max-h-[75vh] sm:max-h-[82vh] object-contain rounded-xl shadow-2xl pointer-events-none"
                />
              )}
            </AnimatePresence>
            
            {images.length > 1 && (
              <div className="mt-4 flex items-center gap-2">
                {isCurrentVideo && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Play size={10} className="fill-red-400" /> Video
                  </span>
                )}
                <div className="text-white/60 font-mono tracking-widest text-xs sm:text-sm bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
