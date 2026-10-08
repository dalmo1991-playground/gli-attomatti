"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ticket, ChevronRight, X, Menu } from "lucide-react";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { getLandingTheme, getLandingThemeStyles } from "@/lib/landingThemes";
import { getRelativeLuminance } from "@/lib/devTheme";
import { notFound } from "next/navigation";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { PageBlockRenderer } from "@/components/ui/PageBlockRenderer";
import { defaultText } from "@/lib/utils";
import { trackViewContent, trackInitiateCheckout } from "@/lib/tracking";

interface LandingClientProps {
  landing: any;
  site: any;
  slug?: string;
  ui?: any;
}

export default function LandingClient({ landing: initialLanding, site, slug, ui }: LandingClientProps) {
  const liveContent = useLiveContent(null);
  const landingDefaults = liveContent?.ui?.landing_defaults || ui || {};
  const landing = useMemo(() => {
    if (liveContent?.landings) {
      const match = liveContent.landings.find(
        (l: any) => (slug && l.slug === slug) || (initialLanding?.slug && l.slug === initialLanding.slug) || (initialLanding?.id && l.id === initialLanding.id)
      );
      if (match) return match;
    }
    return initialLanding;
  }, [liveContent, initialLanding, slug]);

  const initialTheme = useMemo(() => getLandingTheme(landing), [landing]);
  const [theme, setTheme] = useState(initialTheme);
  const themeStyles = getLandingThemeStyles(theme);

  useEffect(() => {
    if (landing) {
      setTheme(getLandingTheme(landing));
      if (landing.title) {
        trackViewContent(landing.title, "Landing", { slug: landing.slug });
      }
    }
  }, [landing]);

  const blocks = landing?.blocks || [];
  const header = landing?.header || {};
  const stickyBar = landing?.sticky_bar || {};

  const isLightBg = useMemo(() => {
    if (!theme?.background) return false;
    try {
      return getRelativeLuminance(theme.background) > 0.45;
    } catch {
      return false;
    }
  }, [theme?.background]);

  const resolvedLogo = useMemo(() => {
    const custom = header.logo_image?.trim();
    if (!custom || custom === "/logo_attomatti.svg" || custom === "/logo_attomatti_dark.svg") {
      return isLightBg ? "/logo_attomatti_dark.svg" : "/logo_attomatti.svg";
    }
    return custom;
  }, [header.logo_image, isLightBg]);

  // Listen to live dev theme modifications for this specific landing page
  useEffect(() => {
    if (typeof window === "undefined" || !landing?.slug) return;
    try {
      const saved = localStorage.getItem(`attomatti_landing_theme_${landing.slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.background === "string" && typeof parsed.primary === "string") {
          setTheme((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.error("Failed to load dev theme for landing", e);
    }

    const handleThemeChange = (e: any) => {
      if (e.detail?.slug === landing.slug && e.detail?.colors) {
        setTheme((prev) => ({ ...prev, ...e.detail.colors }));
      }
    };
    window.addEventListener("attomatti_landing_theme_change", handleThemeChange);
    return () => window.removeEventListener("attomatti_landing_theme_change", handleThemeChange);
  }, [landing?.slug]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: LightboxImage[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (href && href.startsWith("#")) {
      const targetId = href.replace(/^#/, "");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth" });
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", href);
        }
        setMobileNavOpen(false);
      }
    }
  };

  if (!landing) {
    if (!mounted) {
      return (
        <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs uppercase tracking-widest text-white/50">
              {landingDefaults.preview_loading || "Caricamento anteprima..."}
            </span>
          </div>
        </div>
      );
    }
    notFound();
  }

  return (
    <div
      id="landing-root"
      data-landing-slug={landing?.slug}
      data-landing-theme={JSON.stringify(initialTheme)}
      style={themeStyles}
      className="min-h-screen bg-background text-foreground scroll-smooth selection:bg-primary/20 selection:text-primary transition-colors duration-300"
    >
      {/* 1. Standalone Minimal Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5 h-20 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {(() => {
            const logoText = defaultText(header.logo_text, site?.name, "Gli Attomatti");
            const headerSubtitle = defaultText(header.subtitle, landingDefaults.header_subtitle, "Teatro a Zurigo");
            const backHomeTitle = defaultText(landingDefaults.back_to_home, "Torna alla Home");

            return (
              <Link
                href="/"
                className="flex items-center gap-3 group shrink-0"
                title={backHomeTitle || undefined}
              >
                <Image
                  src={resolvedLogo}
                  alt={logoText || "Logo"}
                  width={40}
                  height={40}
                  className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
                  priority
                  unoptimized={resolvedLogo.endsWith(".svg")}
                />
                {(logoText || headerSubtitle) && (
                  <div className="flex flex-col">
                    {logoText && (
                      <span className="font-black text-sm tracking-wider uppercase text-foreground">
                        {logoText}
                      </span>
                    )}
                    {headerSubtitle && (
                      <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-widest">
                        {headerSubtitle}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Desktop Anchor Navigation Links */}
          {header.nav_links && Array.isArray(header.nav_links) && header.nav_links.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {header.nav_links.map((link: any, idx: number) => {
                const label = defaultText(link.label);
                if (!label || !link.href) return null;
                return (
                  <Link
                    key={idx}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-xs font-bold uppercase tracking-wider text-foreground/70 hover:text-primary transition-colors py-1"
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {defaultText(header.cta_label) && (
              <Link
                href={header.cta_href || "#"}
                onClick={(e) => handleAnchorClick(e, header.cta_href)}
                target={header.cta_href?.startsWith("http") ? "_blank" : undefined}
                rel={header.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
              >
                <Ticket size={14} />
                <span>{defaultText(header.cta_label)}</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            {header.nav_links && Array.isArray(header.nav_links) && header.nav_links.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="p-2 md:hidden rounded-xl bg-muted/40 text-foreground hover:bg-muted transition-colors border border-foreground/5"
                aria-label={landingDefaults.menu_aria_label || "Menu navigazione ancore"}
              >
                {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {header.nav_links && Array.isArray(header.nav_links) && header.nav_links.length > 0 && mobileNavOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-foreground/10 px-6 py-3 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {header.nav_links.map((link: any, idx: number) => {
              const label = defaultText(link.label);
              if (!label || !link.href) return null;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="block text-xs font-bold uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-2 border-b border-foreground/5 last:border-0"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* 2. Dynamic Landing Blocks via Unified PageBlockRenderer */}
      <main className="pt-20 pb-28">
        <PageBlockRenderer
          blocks={blocks}
          pageTitle={landing?.title}
          defaults={landingDefaults}
          onAnchorClick={handleAnchorClick}
          onImageClick={(idx, images) =>
            setLightbox({
              isOpen: true,
              index: idx,
              images
            })
          }
        />
      </main>

      {/* 3. Standalone Minimal Footer */}
      <footer className="border-t border-foreground/10 py-12 px-4 sm:px-6 bg-muted/20 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          {defaultText(landingDefaults.footer_home_link, "Visita il sito ufficiale Gli Attomatti") && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground hover:underline transition-colors"
            >
              <span>{defaultText(landingDefaults.footer_home_link, "Visita il sito ufficiale Gli Attomatti")}</span>
              <ChevronRight size={14} />
            </Link>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-foreground/50">
            <Link href="/Privacy" className="hover:text-foreground transition-colors underline">
              Informativa Privacy
            </Link>
            <span>•</span>
            <Link href="/Termini" className="hover:text-foreground transition-colors underline">
              Termini &amp; Condizioni
            </Link>
            <span>•</span>
            <Link href="/Impressum" className="hover:text-foreground transition-colors underline">
              Note Legali
            </Link>
          </div>
          <p className="text-xs text-foreground/40 font-medium">
            © {new Date().getFullYear()} {defaultText(site?.name, "Gli Attomatti")}{defaultText(landingDefaults.footer_copyright, "Tutti i diritti riservati. Zurigo, Svizzera.") ? `. ${defaultText(landingDefaults.footer_copyright, "Tutti i diritti riservati. Zurigo, Svizzera.")}` : ""}
          </p>
        </div>
      </footer>

      {/* 4. Sticky Mobile Bottom CTA Bar with Safe-Area Padding */}
      {stickyBar.enabled && defaultText(stickyBar.cta_label) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-foreground/10 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] md:hidden shadow-2xl">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <div className="text-xs font-bold truncate text-foreground/90">
                {defaultText(stickyBar.text, landing.title)}
              </div>
            </div>
            <Link
              href={stickyBar.cta_href || "#"}
              onClick={(e) => {
                handleAnchorClick(e, stickyBar.cta_href);
                trackInitiateCheckout(landing.title || "Landing", stickyBar.cta_href, "landing_sticky_bar");
              }}
              target={stickyBar.cta_href?.startsWith("http") ? "_blank" : undefined}
              rel={stickyBar.cta_href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shrink-0 hover:bg-primary/90 transition-all shadow-md"
            >
              {defaultText(stickyBar.cta_label)}
            </Link>
          </div>
        </div>
      )}

      {/* 5. Lightbox for Gallery */}
      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
