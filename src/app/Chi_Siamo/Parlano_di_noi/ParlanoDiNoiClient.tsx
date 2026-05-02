"use client";

import { Section } from "@/components/ui/Section";
import { motion } from "framer-motion";
import { ChevronLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ParlanoDiNoiClient({ content }: { content: any }) {
  const { parlano_di_noi } = content.pages;
  const { press_contact } = parlano_di_noi;

  return (
    <div className="pt-20">
      {/* Header */}
      <Section className="bg-muted/30 py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link 
            href="/Chi_Siamo" 
            className="inline-flex items-center text-primary font-bold mb-8 hover:gap-2 transition-all group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Torna a Chi Siamo
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter"
          >
            {parlano_di_noi.title}
          </motion.h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          <p className="text-xl text-foreground/70 font-medium">
            {parlano_di_noi.description}
          </p>
        </div>
      </Section>

      {/* Press Quotes */}
      <Section className="py-24">
        <div className="max-w-5xl mx-auto space-y-12">
          {parlano_di_noi.press.map((item: any, idx: number) => {
            const CardContent = (
              <div className="relative z-10">
                <blockquote className="text-3xl md:text-4xl font-serif italic text-foreground/80 leading-snug mb-10 whitespace-pre-wrap">
                  {item.quote}
                </blockquote>
                
                <div className="flex flex-wrap items-center justify-between gap-6 border-t border-foreground/10 pt-8">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <ExternalLink size={20} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div className="text-xl font-bold flex items-center">
                        {item.source}
                        {item.source_href && <ExternalLink size={16} className="ml-2 opacity-40 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-foreground/40 text-sm font-bold uppercase tracking-widest mt-1">
                        Anno {item.date}
                      </p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="px-6 py-2 border border-foreground/10 rounded-full text-xs font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:border-primary/40 transition-all">
                      {item.badge_label}
                    </div>
                  </div>
                </div>
              </div>
            );

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-[3rem] overflow-hidden border border-foreground/5 transition-all group shadow-sm hover:shadow-xl"
              >
                {item.source_href ? (
                  <Link 
                    href={item.source_href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-12 bg-muted/20 hover:bg-background transition-colors h-full"
                  >
                    {CardContent}
                  </Link>
                ) : (
                  <div className="p-12 bg-muted/20">
                    {CardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Press Area CTA - Styled like Join Us */}
      {press_contact && (
        <Section className="bg-muted/10 py-24 text-center border-t border-foreground/5">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">
              {press_contact.title}
            </h2>
            <p className="text-lg text-foreground/60 mb-10">
              {press_contact.text}
            </p>
            <Link 
              href={press_contact.cta_href}
              className="px-10 py-5 bg-primary text-white rounded-full font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 inline-block"
            >
              {press_contact.cta_label}
            </Link>
          </div>
        </Section>
      )}
    </div>
  );
}
