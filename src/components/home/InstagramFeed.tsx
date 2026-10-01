"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { motion } from "framer-motion";

export function InstagramIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function parseInstagramUrl(url: string) {
  if (!url) return null;
  // Matches canonical or username URLs:
  // instagram.com/p/CODE/
  // instagram.com/reel/CODE/
  // instagram.com/username/reel/CODE/
  // instagram.com/username/p/CODE/
  const match = url.match(/instagram\.com\/(?:[^\/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (!match) return null;
  const type = match[1].toLowerCase() === "reel" ? "reel" : "p";
  const shortcode = match[2];
  return {
    type,
    shortcode,
    canonicalUrl: `https://www.instagram.com/${type}/${shortcode}/`,
    embedUrl: `https://www.instagram.com/${type}/${shortcode}/embed/`
  };
}

interface InstagramPost {
  id?: string;
  url: string;
  title?: string;
}

interface InstagramFeedProps {
  data?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    handle?: string;
    profile_url?: string;
    cta_label?: string;
    posts?: InstagramPost[];
  };
}

function InstagramEmbedCard({
  post,
  index
}: {
  post: InstagramPost;
  index: number;
}) {
  const info = parseInstagramUrl(post.url);
  const [loaded, setLoaded] = useState(false);

  if (!info) return null;

  return (
    <div className="snap-start shrink-0 w-[326px] sm:w-[340px] md:w-[350px] h-[630px] rounded-none overflow-hidden bg-white shadow-2xl relative border-0">
      {/* Discreet loading spinner until iframe renders */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-100 z-0">
          <Loader2 className="w-7 h-7 animate-spin text-primary mb-2 opacity-60" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Caricamento post...
          </span>
        </div>
      )}

      {/* Unclipped squadrato iframe: full 100% height, zero border-radius, zero clipping */}
      <iframe
        src={info.embedUrl}
        className={`w-full h-full border-0 transition-opacity duration-300 relative z-10 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        scrolling="no"
        allow="encrypted-media"
        onLoad={() => setLoaded(true)}
        title={post.title || `Post Instagram ${index + 1}`}
      />
    </div>
  );
}

export function InstagramFeed({ data }: InstagramFeedProps) {
  const enabled = data?.enabled !== false;
  const title = data?.title || "Seguici su Instagram";
  const subtitle =
    data?.subtitle ||
    "Dietro le quinte, prove e momenti di scena della nostra compagnia";
  const handle = data?.handle || "@gliattomatti";
  const profileUrl = data?.profile_url || "https://www.instagram.com/gliattomatti/";
  const ctaLabel = data?.cta_label || `Segui ${handle} su Instagram`;
  const rawPosts = data?.posts || [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Filter valid instagram posts
  const validPosts = rawPosts.filter((p) => p?.url && parseInstagramUrl(p.url) !== null);

  // Handle cycle scroll navigation
  const handleScroll = (dir: 1 | -1) => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;

    if (dir === 1 && scrollLeft >= maxScroll - 30) {
      // Loop back to start
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && scrollLeft <= 30) {
      // Loop to end
      scrollRef.current.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      const step = 350;
      scrollRef.current.scrollBy({ left: dir * step, behavior: "smooth" });
    }
  };

  // Optional auto-cycle timer (loops every 5 seconds, pauses on hover)
  useEffect(() => {
    if (isPaused || validPosts.length <= 1) return;
    const timer = setInterval(() => {
      handleScroll(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, validPosts.length]);

  if (!enabled || validPosts.length === 0) return null;

  return (
    <Section className="py-20 md:py-28 relative overflow-hidden bg-muted/15 border-t border-foreground/5">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6">
        {/* Section Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 md:mb-12">
          <div className="text-center md:text-left max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4 shadow-sm"
            >
              <InstagramIcon size={14} className="animate-pulse" />
              <span>Social & Backstage</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground drop-shadow-sm mb-3"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="text-foreground/60 text-base sm:text-lg font-medium leading-relaxed"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Carousel Arrows */}
          {validPosts.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleScroll(-1)}
                className="w-12 h-12 rounded-full glass border border-foreground/15 text-foreground hover:bg-primary hover:border-primary hover:text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                aria-label="Precedente"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll(1)}
                className="w-12 h-12 rounded-full glass border border-foreground/15 text-foreground hover:bg-primary hover:border-primary hover:text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                aria-label="Successivo"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Track (Squadrato, Non tagliato, 3-4 visibili a ciclo) */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 pb-6 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {validPosts.map((post, index) => (
            <InstagramEmbedCard
              key={post.id || `${post.url}-${index}`}
              post={post}
              index={index}
            />
          ))}
        </div>

        {/* The ONLY Instagram link: Official follow button below */}
        <div className="mt-12 md:mt-16 text-center">
          <Link
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-primary text-white font-black text-sm uppercase tracking-wider hover:bg-primary/90 hover:scale-105 transition-all shadow-xl shadow-primary/25 group"
          >
            <InstagramIcon size={18} className="group-hover:rotate-12 transition-transform duration-300" />
            <span>{ctaLabel}</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
