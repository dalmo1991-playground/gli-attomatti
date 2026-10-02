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
  const spettacoli = content?.pages?.spettacoli || {
    title: "I Nostri Spettacoli",
    description: "Tutte le produzioni teatrali della compagnia.",
    archive_sections: []
  };

  const archive: any[] = Array.isArray(spettacoli.archive_sections) ? spettacoli.archive_sections : [];

  return (
    <div>
      {/* Hero Section */}
      <PageHeader
        title={spettacoli.title || "I Nostri Spettacoli"}
        description={spettacoli.description || "Tutte le produzioni teatrali della compagnia."}
      />

      {/* Archive Sections */}
      {archive.length > 0 ? (
        archive.filter((s) => s.visible !== false).map((section: any, idx: number) => (
          <Section key={section.slug || idx} className={cn("py-24", idx % 2 !== 0 && "bg-muted/10")}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
              <div className="md:col-span-4 sticky top-32">
                {section.year && (
                  <div className="inline-flex items-center px-4 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                    <Calendar size={14} className="mr-2" />
                    Anno {section.year}
                  </div>
                )}
                {section.slug ? (
                  <Link href={`/Spettacoli/${section.slug}`} className="block group">
                    <h2 className={cn(
                      getCardTitleSizeClass(section.title),
                      "font-black uppercase tracking-tight mb-6 leading-tight group-hover:text-primary transition-colors text-balance break-words [overflow-wrap:anywhere]"
                    )}>
                      {section.title}
                    </h2>
                  </Link>
                ) : (
                  <h2 className={cn(
                    getCardTitleSizeClass(section.title),
                    "font-black uppercase tracking-tight mb-6 leading-tight text-balance break-words [overflow-wrap:anywhere]"
                  )}>
                    {section.title}
                  </h2>
                )}
                <div className="w-12 h-1 bg-primary mb-8" />
                
                {section.slug && (
                  <Link 
                    href={`/Spettacoli/${section.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:border-secondary font-bold text-sm transition-all group shadow-xs hover:-translate-y-0.5"
                  >
                    <span>Scopri lo spettacolo</span>
                    <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
              
              <div className="md:col-span-8">
                <div className="prose prose-xl prose-invert max-w-none">
                  <RichText
                    content={section.short_description || section.text || ""}
                    className="text-xl text-foreground/80 leading-relaxed mb-8"
                  />
                </div>
              </div>
            </div>
          </Section>
        ))
      ) : (
        <Section className="py-24 text-center">
          <div className="max-w-md mx-auto text-foreground/40 font-medium">
            Nessuno spettacolo in archivio al momento.
          </div>
        </Section>
      )}
    </div>
  );
}
