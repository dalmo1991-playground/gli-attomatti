"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/ui/RichText";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { FormattedText } from "@/components/ui/FormattedText";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function ParlanoDiNoiClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const parlano_di_noi = content?.pages?.parlano_di_noi || {};
  const press: any[] = Array.isArray(parlano_di_noi.press) ? parlano_di_noi.press : [];
  const press_contact = parlano_di_noi.press_contact || {};

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={parlano_di_noi.title || ""}
        description={parlano_di_noi.description || ""}
        backLink={{ href: parlano_di_noi.back_href || "/Chi_Siamo", label: parlano_di_noi.back_label || "" }}
        compact
      />

      {/* Press Quotes */}
      <Section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10 md:space-y-12">
          {press.filter((item: any) => item && item.visible !== false).map((item: any, idx: number) => {
            const CardContent = (
              <div className="relative z-10">
                <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif italic text-foreground/80 leading-relaxed mb-6 sm:mb-8 whitespace-pre-wrap text-pretty">
                  <FormattedText text={item.quote} />
                </blockquote>
                
                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 border-t border-foreground/10 pt-6 sm:pt-8">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/15 text-secondary rounded-full flex items-center justify-center mr-3 sm:mr-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-500 shrink-0">
                      <ExternalLink size={18} className="text-secondary group-hover:text-secondary-foreground transition-colors" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold flex items-center">
                        {item.source}
                        {item.source_href && <ExternalLink size={14} className="ml-2 opacity-40 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-accent text-xs sm:text-sm font-bold uppercase tracking-widest mt-0.5">
                        {parlano_di_noi.year_prefix}{item.date}
                      </p>
                    </div>
                  </div>
                  
                  {item.badge_label && (
                    <div className="inline-block">
                      <div className="px-4 py-1 sm:px-5 sm:py-1.5 bg-accent/10 text-accent border border-accent/30 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-xs">
                        {item.badge_label}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-foreground/5 transition-all group shadow-sm hover:shadow-xl"
              >
                {item.source_href ? (
                  <Link 
                    href={item.source_href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 sm:p-8 md:p-12 bg-muted/20 hover:bg-background transition-colors h-full"
                  >
                    {CardContent}
                  </Link>
                ) : (
                  <div className="p-6 sm:p-8 md:p-12 bg-muted/20">
                    {CardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Press Area CTA - Styled like Join Us */}
      {press_contact && (press_contact.title || press_contact.text) && (
        <Section className="bg-muted/10 py-12 sm:py-16 md:py-24 text-center border-t border-foreground/5">
          <div className="max-w-2xl mx-auto">
            {press_contact.title && (
              <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">
                {press_contact.title}
              </h2>
            )}
            {press_contact.text && (
              <p className="text-lg text-foreground/60 mb-10">
                <FormattedText text={press_contact.text} />
              </p>
            )}
            {press_contact.cta_label && (
              press_contact.cta_href ? (
                <Link 
                  href={press_contact.cta_href}
                  className="px-10 py-5 bg-primary text-primary-foreground rounded-full font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 inline-block"
                >
                  {press_contact.cta_label}
                </Link>
              ) : (
                <div className="px-10 py-5 bg-primary/20 text-primary rounded-full font-black text-lg inline-block">
                  {press_contact.cta_label}
                </div>
              )
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
