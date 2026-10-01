"use client";

import { Section } from "@/components/ui/Section";
import { RichText } from "@/components/ui/RichText";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function IniziativeClient({ content }: { content: any }) {
  const iniziative = content?.pages?.iniziative || {
    title: "Le Nostre Iniziative",
    description: "Corsi, laboratori ed eventi teatrali.",
    archive_sections: []
  };

  const sections = iniziative.archive_sections || [];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <Section className="bg-muted/30 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mt-32" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -mr-48 -mb-48" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tighter"
          >
            {iniziative.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-1 bg-primary mx-auto mb-8"
          />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-medium"
          >
            <RichText content={iniziative.description} />
          </motion.div>
        </div>
      </Section>

      {/* Initiatives Archive Sections */}
      {sections.length > 0 ? (
        sections.map((section: any, idx: number) => (
          <Section key={section.slug || idx} className={cn("py-24", idx % 2 !== 0 && "bg-muted/10")}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
              <div className="md:col-span-4 sticky top-32">
                <div className="inline-flex items-center px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                  <Calendar size={14} className="mr-2" />
                  Anno {section.year}
                </div>
                {section.slug ? (
                  <Link href={`/Iniziative/${section.slug}`} className="block group">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6 leading-tight group-hover:text-primary transition-colors">
                      {section.title}
                    </h2>
                  </Link>
                ) : (
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6 leading-tight">
                    {section.title}
                  </h2>
                )}
                <div className="w-12 h-1 bg-primary mb-8" />
                
                {section.slug && (
                  <Link 
                    href={`/Iniziative/${section.slug}`}
                    className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all group"
                  >
                    Scopri l'iniziativa
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
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
        ))
      ) : (
        <Section className="py-24 text-center">
          <Calendar className="mx-auto text-primary/40 mb-4" size={48} />
          <h3 className="text-2xl font-bold mb-2">Nuove iniziative in arrivo</h3>
          <p className="text-foreground/60 max-w-md mx-auto">
            Stiamo preparando i prossimi laboratori ed eventi teatrali. Torna a trovarci presto!
          </p>
        </Section>
      )}
    </div>
  );
}
