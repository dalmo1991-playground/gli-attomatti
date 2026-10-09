"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, defaultText } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { trackInitiateCheckout, trackContact } from "@/lib/tracking";


export function Navbar({ content }: { content: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const rawNavigation: any[] = Array.isArray(content?.navigation) ? content.navigation : [];
  const navigation = rawNavigation.filter((link: any) => link && link.label !== null);
  const siteName = defaultText(content?.site?.name, "Gli Attomatti");
  const uiNavbar = content?.ui?.navbar || {};

  const buyTicketsLabel = defaultText(uiNavbar.buy_tickets_label, "Acquista Biglietti");
  const contactUsLabel = defaultText(uiNavbar.contact_us_label, "Contattaci / Scrivici");
  const mainNavAria = defaultText(uiNavbar.main_nav_aria_label, "Navigazione principale");
  const mobileNavAria = defaultText(uiNavbar.mobile_nav_aria_label, "Navigazione mobile");
  const closeMenuAria = defaultText(uiNavbar.close_menu_aria_label, "Chiudi menu");
  const openMenuAria = defaultText(uiNavbar.open_menu_aria_label, "Apri menu");

  const getSafeHref = (href?: string) => {
    if (!href) return "/";
    if (href.startsWith("/") || href.startsWith("http")) return href;
    return `/${href}`;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close mobile menu when route/pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu or desktop dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isOpen) setIsOpen(false);
        if (hoveredLink) setHoveredLink(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hoveredLink]);

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 transition-colors duration-300",
          isOpen
            ? "bg-background/95 backdrop-blur-xl border-b border-foreground/10"
            : scrolled 
              ? "bg-background/40 backdrop-blur-xl border-b border-foreground/5 shadow-sm" 
              : "bg-transparent"
        )}
      >
        <div
          className={cn(
            "max-w-7xl mx-auto flex justify-between items-center px-6 transition-all duration-300",
            scrolled ? "py-3" : "py-4"
          )}
        >
        <Link
          href="/"
          prefetch={false}
          className="flex items-center gap-3 group"
          onClick={() => setIsOpen(false)}
        >
          <Image 
            src="/logo_attomatti.svg" 
            alt={siteName || "Logo"} 
            width={40}
            height={40}
            className="h-10 w-auto group-hover:scale-110 transition-transform duration-300"
            priority
            unoptimized
          />

          {siteName && (
            <span className="text-xl font-black tracking-tighter uppercase text-primary">
              {siteName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 items-center" aria-label={mainNavAria || undefined}>
          {navigation.map((link: any, idx: number) => {
            const safeHref = getSafeHref(link.href);
            const sublinks = Array.isArray(link.sublinks) ? link.sublinks.filter((s: any) => s && s.label !== null) : [];
            const hasSublinks = sublinks.length > 0;
            const isActive = pathname === safeHref || (safeHref !== "/" && pathname.startsWith(safeHref + "/"));

            return (
              <div 
                key={link.href || idx}
                className="relative py-2"
                onMouseEnter={() => setHoveredLink(link.label)}
                onMouseLeave={() => setHoveredLink(null)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setHoveredLink(null);
                  }
                }}
              >
                <Link
                  href={safeHref}
                  prefetch={false}
                  onClick={() => setHoveredLink(null)}
                  aria-haspopup={hasSublinks ? "true" : undefined}
                  aria-expanded={hasSublinks ? hoveredLink === link.label : undefined}
                  className={cn(
                    "text-sm font-bold transition-colors hover:text-primary flex items-center gap-1 uppercase tracking-wider",
                    isActive ? "text-primary" : "text-foreground/80"
                  )}
                >
                  {link.label}
                  {hasSublinks && (
                    <ChevronDown 
                      size={14} 
                      className={cn(
                        "transition-transform duration-300",
                        hoveredLink === link.label ? "rotate-180" : ""
                      )} 
                    />
                  )}
                </Link>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {hasSublinks && hoveredLink === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-background border border-foreground/5 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      {sublinks.map((sub: any, sIdx: number) => {
                        const subHref = getSafeHref(sub.href);
                        const isSubActive = pathname === subHref;

                        return (
                          <Link
                            key={sub.href || sIdx}
                            href={subHref}
                            prefetch={false}
                            onClick={() => setHoveredLink(null)}
                            className={cn(
                              "block px-5 py-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                              isSubActive ? "text-primary bg-primary/5" : "text-foreground/70"
                            )}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Mobile Toggle with 44px min touch target */}
        <button
          className="md:hidden text-foreground min-w-[44px] min-h-[44px] p-2 -mr-2 rounded-xl flex items-center justify-center hover:bg-foreground/5 transition-all active:scale-95"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? (closeMenuAria || undefined) : (openMenuAria || undefined)}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden w-full max-h-[calc(100dvh-4.5rem)] bg-background/95 backdrop-blur-xl border-t border-foreground/10 flex flex-col"
          >
            <div className="w-full overflow-y-auto overscroll-contain custom-scrollbar touch-pan-y flex-1 min-h-0">
              <nav className="flex flex-col gap-6 px-6 pt-6 pb-[max(5rem,calc(env(safe-area-inset-bottom)+3rem))]" aria-label={mobileNavAria || undefined}>
                {navigation.map((link: any, idx: number) => {
                  const safeHref = getSafeHref(link.href);
                  const sublinks = Array.isArray(link.sublinks) ? link.sublinks.filter((s: any) => s && s.label !== null) : [];
                  const hasSublinks = sublinks.length > 0;
                  const isActive = pathname === safeHref || (safeHref !== "/" && pathname.startsWith(safeHref + "/"));

                  return (
                    <div key={link.href || idx} className="space-y-3">
                      <Link
                        href={safeHref}
                        prefetch={false}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "text-xl font-black uppercase tracking-tight flex items-center justify-between py-1 transition-colors active:scale-[0.99]",
                          isActive ? "text-primary" : "text-foreground hover:text-primary"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {isActive && <span className="w-1.5 h-5 rounded-full bg-primary inline-block" />}
                          {link.label}
                        </span>
                      </Link>
                      {hasSublinks && (
                        <div className="flex flex-col gap-3 pl-6 border-l-2 border-foreground/10 ml-1">
                          {sublinks.map((sub: any, sIdx: number) => {
                            const subHref = getSafeHref(sub.href);
                            const isSubActive = pathname === subHref;

                            return (
                              <Link
                                key={sub.href || sIdx}
                                href={subHref}
                                prefetch={false}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  "text-base font-semibold py-1 transition-colors active:scale-[0.99]",
                                  isSubActive ? "text-primary" : "text-foreground/60 hover:text-foreground"
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mobile Fast-Actions (Biglietti & Contatti) */}
                {(buyTicketsLabel || contactUsLabel) && (
                  <div className="pt-6 border-t border-foreground/10 space-y-3 mt-2">
                    {buyTicketsLabel && (
                      <Link
                        href="/Biglietti"
                        prefetch={false}
                        onClick={() => {
                          setIsOpen(false);
                          trackInitiateCheckout("Navigazione Biglietti", "/Biglietti", "mobile_nav");
                        }}
                        className="w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                      >
                        <Ticket size={16} />
                        <span>{buyTicketsLabel}</span>
                      </Link>
                    )}

                    {contactUsLabel && (
                      <Link
                        href="/Contatti"
                        prefetch={false}
                        onClick={() => {
                          setIsOpen(false);
                          trackContact("mobile_nav_cta", "/Contatti");
                        }}
                        className="w-full py-3 px-6 rounded-2xl bg-muted/40 hover:bg-muted/70 text-foreground/80 font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-[0.98] border border-foreground/5"
                      >
                        <span>{contactUsLabel}</span>
                      </Link>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}
