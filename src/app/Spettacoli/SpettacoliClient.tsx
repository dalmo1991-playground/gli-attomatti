"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/ui/RichText";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getCardTitleSizeClass } from "@/lib/typography";
export default function SpettacoliClient({ content }: { content: any }) {
  const { spettacoli } = content.pages;

  return (
    <div>
      {/* Hero Section */}
      <PageHeader
        title={spettacoli.title}
        description={spettacoli.description}
      />

      {/* Archive Sections */}
      {spettacoli.archive_sections.map((section: any, idx: number) => (
        <Section key={idx} className={cn("py-24", idx % 2 !== 0 && "bg-muted/10")}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
            <div className="md:col-span-4 sticky top-32">
              <div className="inline-flex items-center px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <Calendar size={14} className="mr-2" />
                Anno {section.year}
              </div>
              <Link href={`/Spettacoli/${section.slug}`} className="block group">
                <h2 className={cn(
                  getCardTitleSizeClass(section.title),
                  "font-black uppercase tracking-tight mb-6 leading-tight group-hover:text-primary transition-colors text-balance break-words [overflow-wrap:anywhere]"
                )}>
                  {section.title}
                </h2>
              </Link>
              <div className="w-12 h-1 bg-primary mb-8" />
              
              <Link 
                href={`/Spettacoli/${section.slug}`}
                className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all group"
              >
                Scopri lo spettacolo
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="md:col-span-8">
              <div className="prose prose-xl prose-invert max-w-none">
                <RichText
                  content={section.short_description || section.text}
                  className="text-xl text-foreground/80 leading-relaxed mb-8"
                />
              </div>
            </div>
          </div>
        </Section>
      ))}
    </div>
  );
}
