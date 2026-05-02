"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import content from "@/data/content.json";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 px-6 py-4",
        scrolled 
          ? "bg-background/40 backdrop-blur-xl border-b border-foreground/5 shadow-sm py-3" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <img 
            src="/logo_attomatti.svg" 
            alt={content.site.name} 
            className="h-10 w-auto group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-xl font-black tracking-tighter uppercase text-primary">
            {content.site.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8 items-center">
          {content.navigation.map((link) => (
            <div 
              key={link.href}
              className="relative py-2"
              onMouseEnter={() => setHoveredLink(link.label)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <Link
                href={link.href}
                className={cn(
                  "text-sm font-bold transition-colors hover:text-primary flex items-center gap-1 uppercase tracking-wider",
                  pathname === link.href || pathname.startsWith(link.href + "/") ? "text-primary" : "text-foreground/80"
                )}
              >
                {link.label}
                {link.sublinks && (
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
                {link.sublinks && hoveredLink === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-background/90 backdrop-blur-2xl border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                  >
                    {link.sublinks.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "block px-5 py-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                          pathname === sub.href ? "text-primary bg-primary/5" : "text-foreground/70"
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
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
            className="md:hidden bg-background/95 backdrop-blur-xl border-t border-foreground/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {content.navigation.map((link) => (
                <div key={link.href} className="space-y-2">
                  <Link
                    href={link.href}
                    onClick={() => !link.sublinks && setIsOpen(false)}
                    className={cn(
                      "text-xl font-black uppercase tracking-tight flex items-center justify-between",
                      pathname === link.href ? "text-primary" : "text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                  {link.sublinks && (
                    <div className="pl-4 space-y-2 border-l border-foreground/10 ml-1">
                      {link.sublinks.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block text-lg font-medium",
                            pathname === sub.href ? "text-primary" : "text-foreground/60"
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
