"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/ui/RichText";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { FormattedText } from "@/components/ui/FormattedText";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function ParlanoDiNoiClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const parlano_di_noi = content?.pages?.parlano_di_noi || {};
  const press: any[] = Array.isArray(parlano_di_noi.press) ? parlano_di_noi.press : [];
  const press_contact = parlano_di_noi.press_contact || {};

  const pressTitle = defaultText(press_contact.title);
  const pressText = defaultText(press_contact.text);
  const pressCta = defaultText(press_contact.cta_label);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={defaultText(parlano_di_noi.title, "Dicono di noi")}
        description={defaultText(parlano_di_noi.description)}
        backLink={{ href: parlano_di_noi.back_href || "/Chi_Siamo", label: defaultText(parlano_di_noi.back_label, "Torna a Chi Siamo") }}
        compact
      />

      {/* Press Quotes */}
      <Section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10 md:space-y-12">
          {press.filter((item: any) => item && item.visible !== false).map((item: any, idx: number) => {
            const quote = defaultText(item.quote);
            const source = defaultText(item.source);
            const date = defaultText(item.date);
            const badgeLabel = defaultText(item.badge_label);

            const CardContent = (
              <div className="relative z-10">
                {quote && (
                  <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif italic text-foreground/80 leading-relaxed mb-6 sm:mb-8 whitespace-pre-wrap text-pretty">
                    <FormattedText text={quote} />
                  </blockquote>
                )}
                
                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 border-t border-foreground/10 pt-6 sm:pt-8">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/15 text-secondary rounded-full flex items-center justify-center mr-3 sm:mr-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-500 shrink-0">
                      <ExternalLink size={18} className="text-secondary group-hover:text-secondary-foreground transition-colors" />
                    </div>
                    <div>
                      {source && (
                        <div className="text-lg sm:text-xl font-bold flex items-center">
                          {source}
                          {item.source_href && <ExternalLink size={14} className="ml-2 opacity-40 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      )}
                      {date && (
                        <p className="text-accent text-xs sm:text-sm font-bold uppercase tracking-widest mt-0.5">
                          {parlano_di_noi.year_prefix}{date}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {badgeLabel && (
                    <div className="inline-block">
                      <div className="px-4 py-1 sm:px-5 sm:py-1.5 bg-accent/10 text-accent border border-accent/30 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-xs">
                        {badgeLabel}
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
      {(pressTitle || pressText || pressCta) && (
        <Section className="bg-muted/10 py-12 sm:py-16 md:py-24 text-center border-t border-foreground/5">
          <div className="max-w-2xl mx-auto">
            {pressTitle && (
              <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">
                {pressTitle}
              </h2>
            )}
            {pressText && (
              <p className="text-lg text-foreground/60 mb-10">
                <FormattedText text={pressText} />
              </p>
            )}
            {pressCta && (
              press_contact.cta_href ? (
                <Link 
                  href={press_contact.cta_href}
                  className="px-10 py-5 bg-primary text-primary-foreground rounded-full font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 inline-block"
                >
                  {pressCta}
                </Link>
              ) : (
                <div className="px-10 py-5 bg-primary/20 text-primary rounded-full font-black text-lg inline-block">
                  {pressCta}
                </div>
              )
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
