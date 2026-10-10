"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { ArchiveTimelineSection } from "@/components/ui/ArchiveTimelineSection";
import { Newspaper } from "lucide-react";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { defaultText } from "@/lib/utils";

export default function BlogClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const blog = content?.pages?.blog || {};

  const articles: any[] = Array.isArray(blog.articles) ? blog.articles : [];
  const visibleArticles = articles.filter((a) => a && a.visible !== false);
  const emptyMsg = defaultText(blog.empty_message, "Nessun articolo pubblicato al momento.");

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={defaultText(blog.title, "Il Nostro Blog")}
        description={defaultText(blog.description, "Storie, annunci e retroscena dal palcoscenico.")}
        backLink={{
          href: "/Chi_Siamo",
          label: "Torna a Chi Siamo"
        }}
        compact
      />

      {/* Articles Archive Sections (Identical look & feel to Spettacoli / Iniziative) */}
      {visibleArticles.length > 0 ? (
        visibleArticles.map((article: any, idx: number) => {
          const badgeDate = defaultText(article.date, article.year);
          return (
            <ArchiveTimelineSection
              key={article.slug || idx}
              title={defaultText(article.title)}
              badge={badgeDate}
              badgePrefix={defaultText(blog.year_prefix)}
              badgeIcon={Newspaper}
              href={article.slug ? `/Chi_Siamo/Blog/${article.slug}` : undefined}
              ctaLabel={defaultText(article.discover_cta, blog.discover_cta, "Leggi l'articolo")}
              text={defaultText(article.short_description, article.text, "") || ""}
              isAlternate={idx % 2 !== 0}
            />
          );
        })
      ) : (
        <Section className="py-24 text-center">
          <Newspaper className="mx-auto text-primary/40 mb-4" size={48} />
          <div className="max-w-md mx-auto text-foreground/40 font-medium">
            {emptyMsg}
          </div>
        </Section>
      )}
    </div>
  );
}
