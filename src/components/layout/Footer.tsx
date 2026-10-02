"use client";

import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { trackContact } from "@/lib/tracking";


export function Footer({ content }: { content: any }) {
  const contatti = content?.pages?.contatti || { email: "", socials: [] };
  const socials: any[] = Array.isArray(contatti.socials) ? contatti.socials : [];
  const navigation: any[] = Array.isArray(content?.navigation) ? content.navigation : [];
  const site = content?.site || { name: "Gli Attomatti", description: "" };

  const getSafeHref = (href?: string) => {
    if (!href) return "/";
    if (href.startsWith("/") || href.startsWith("http")) return href;
    return `/${href}`;
  };

  const SocialIcon = ({ platform }: { platform: string }) => {
    if (platform === "Facebook") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    }
    if (platform === "Instagram") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    }
    return <ArrowUpRight size={20} />;
  };

  return (
    <footer className="relative bg-background pt-24 pb-12 overflow-hidden border-t border-foreground/5">
      {/* Subtle Background Elements */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mb-48" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] -ml-32 -mt-32" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">

          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo_attomatti.svg"
                alt={site.name || "Gli Attomatti"}
                width={48}
                height={48}
                className="h-12 w-auto group-hover:scale-110 transition-transform duration-500"
              />
              <span className="text-2xl font-black tracking-tighter uppercase text-primary">
                {site.name || "Gli Attomatti"}
              </span>
            </Link>

            {site.description && (
              <p className="text-xl text-foreground/60 leading-relaxed max-w-sm font-medium">
                {site.description}
              </p>
            )}
            {socials.length > 0 && (
              <div className="flex gap-4">
                {socials.filter((s: any) => s && s.visible !== false).map((social: any, idx: number) => {
                  return social.href ? (
                    <Link
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                    >
                      <SocialIcon platform={social.platform} />
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Sito</h4>
            <ul className="space-y-4">
              {navigation.map((link: any, idx: number) => {
                const safeHref = getSafeHref(link.href);
                return (
                  <li key={link.href || idx}>
                    <Link
                      href={safeHref}
                      className="text-lg font-bold text-foreground/70 hover:text-primary transition-colors flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight size={14} className="ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact CTA Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 border-2 border-primary/10 rounded-[2.5rem] space-y-6 bg-primary/5">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Contattaci</h4>
              {contatti.email && (
                <Link
                  href={`mailto:${contatti.email}`}
                  onClick={() => trackContact("email", contatti.email)}
                  className="block text-xl font-black hover:text-primary transition-colors break-all"
                >
                  {contatti.email}
                </Link>
              )}
              <Link
                href="/Contatti"
                className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary group"
              >
                Scrivici ora
                <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-foreground/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-foreground/40 font-medium">
            © {new Date().getFullYear()} {site.name || "Gli Attomatti"}. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6 text-sm text-foreground/50 font-medium">
            <Link href="/Termini" className="hover:text-primary transition-colors">
              Termini
            </Link>
            <Link href="/Impressum" className="hover:text-primary transition-colors">
              Impressum
            </Link>
            <Link href="/Privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
