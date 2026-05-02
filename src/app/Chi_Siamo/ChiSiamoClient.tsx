"use client";

import { Section } from "@/components/ui/Section";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChiSiamoClient({ content }: { content: any }) {
  const { chi_siamo } = content.pages;

  const iconMap: Record<string, any> = {
    "users": Users,
    "message-square": MessageSquare
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <Section className="bg-muted/30 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tighter"
          >
            {chi_siamo.title}
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
            {chi_siamo.description}
          </motion.p>
        </div>
      </Section>

      {/* Content Sections */}
      {chi_siamo.content_sections.map((section: any, idx: number) => (
        <Section key={idx} className={cn("py-24", idx % 2 !== 0 && "bg-muted/10")}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
            <div className="md:col-span-4 sticky top-32">
              <h2 className="text-3xl font-black uppercase tracking-tight mb-6">
                {section.title}
              </h2>
              <div className="w-12 h-1 bg-primary" />
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
                      <div 
                        key={imgIdx} 
                        className={cn(
                          "rounded-3xl overflow-hidden bg-muted shadow-lg",
                          section.images.length > 1 && imgIdx % 2 !== 0 && "mt-12"
                        )}
                      >
                        <img 
                          src={img.url} 
                          alt={img.alt} 
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
      ))}

      {/* Navigation Links Section */}
      <Section className="py-24 bg-muted/10 border-t border-foreground/5">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {chi_siamo.navigation_links.map((link: any, idx: number) => {
              const Icon = iconMap[link.icon] || ArrowRight;
              return (
                <Link 
                  key={idx} 
                  href={link.href}
                  className="flex items-center justify-between p-8 bg-background border border-foreground/5 rounded-2xl hover:border-primary/30 transition-all hover:-translate-y-1 group shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-6 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon size={24} />
                    </div>
                    <span className="text-xl font-bold">{link.label}</span>
                  </div>
                  <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </Section>
    </div>
  );
}
