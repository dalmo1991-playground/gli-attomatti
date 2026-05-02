"use client";

import { Section } from "@/components/ui/Section";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SpettacoliClient({ content }: { content: any }) {
  const { spettacoli } = content.pages;

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
            {spettacoli.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-1 bg-primary mx-auto mb-8"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-medium"
          >
            {spettacoli.description}
          </motion.p>
        </div>
      </Section>

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
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6 leading-tight group-hover:text-primary transition-colors">
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
                <p className="text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap mb-12">
                  {section.text}
                </p>
                
                {section.images && section.images.length > 0 && (
                  <div className={cn(
                    "grid gap-6",
                    section.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  )}>
                    {section.images.map((img: any, imgIdx: number) => (
                      <Link 
                        key={imgIdx} 
                        href={`/Spettacoli/${section.slug}`}
                        className={cn(
                          "rounded-3xl overflow-hidden bg-muted shadow-lg block",
                          section.images.length > 1 && imgIdx % 2 !== 0 && "mt-12"
                        )}
                      >
                        <img 
                          src={img.url} 
                          alt={img.alt} 
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
      ))}
    </div>
  );
}
