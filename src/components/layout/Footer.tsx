"use client";

import Link from "next/link";
import { Camera, Globe, Mail, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function Footer({ content }: { content: any }) {
  const { contatti } = content.pages;

  const socialIcons: Record<string, any> = {
    "Instagram": Camera,
    "Facebook": Globe
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
              <img 
                src="/logo_attomatti.svg" 
                alt={content.site.name} 
                className="h-12 w-auto group-hover:scale-110 transition-transform duration-500"
              />
              <span className="text-2xl font-black tracking-tighter uppercase text-primary">
                {content.site.name}
              </span>
            </Link>
            <p className="text-xl text-foreground/60 leading-relaxed max-w-sm font-medium">
              Portiamo la passione del teatro italiano nel cuore di Zurigo. Ogni palco è una nuova storia.
            </p>
            <div className="flex gap-4">
              {contatti.socials.map((social: any, idx: number) => {
                const Icon = socialIcons[social.platform] || ArrowUpRight;
                return (
                  <Link 
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                  >
                    <Icon size={20} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Sito</h4>
            <ul className="space-y-4">
              {content.navigation.map((link: any) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-lg font-bold text-foreground/70 hover:text-primary transition-colors flex items-center group"
                  >
                    {link.label}
                    <ArrowUpRight size={14} className="ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Chi Siamo</h4>
            <ul className="space-y-4">
              {content.navigation.find((n: any) => n.label === "Chi Siamo")?.sublinks?.map((sub: any) => (
                <li key={sub.href}>
                  <Link 
                    href={sub.href}
                    className="text-lg font-bold text-foreground/70 hover:text-primary transition-colors"
                  >
                    {sub.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact CTA Column */}
          <div className="lg:col-span-3 space-y-8">
            <div className="p-8 border-2 border-primary/10 rounded-[2.5rem] space-y-6 bg-primary/5">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Contattaci</h4>
              <Link 
                href={`mailto:${contatti.email}`}
                className="block text-xl font-black hover:text-primary transition-colors break-all"
              >
                {contatti.email}
              </Link>
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
            © {new Date().getFullYear()} {content.site.name}. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-foreground/30">
            <span className="hover:text-primary cursor-default transition-colors">Zurigo, Svizzera</span>
            <span className="hover:text-primary cursor-default transition-colors">Teatro Italiano</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
