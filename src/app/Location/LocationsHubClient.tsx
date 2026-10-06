"use client";

import React from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { LocationItem } from "@/lib/locationTypes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

interface LocationsHubClientProps {
  content: any;
}

export default function LocationsHubClient({ content: initialContent }: LocationsHubClientProps) {
  const content = useLiveContent(initialContent);
  const ui = content?.pages?.locations || {};
  const locations: LocationItem[] = (content?.locations || []).filter(
    (l: LocationItem) => l.active !== false
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        title={ui.hub_title || ""}
        description={ui.hub_description}
      />

      <Section className="py-20 lg:py-24">
        {locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {locations.map((loc) => (
              <div
                key={loc.id || loc.slug}
                className="p-8 rounded-[2.5rem] bg-muted/20 border border-foreground/10 hover:border-foreground/20 transition-all space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                      <MapPin size={12} />
                      <span>{loc.category_badge || loc.badge || ui.hub_badge_default || ""}</span>
                    </div>
                    {loc.top_badge && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-bold">
                        {loc.top_badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                      {loc.venue_name || loc.title}
                    </h2>
                    {loc.venue_name && loc.title !== loc.venue_name && (
                      <p className="text-sm text-primary font-bold mt-0.5">{loc.title}</p>
                    )}
                  </div>

                  <p className="text-sm text-foreground/70 font-medium">
                    {loc.address}
                  </p>

                  {loc.description && (
                    <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2">
                      {loc.description}
                    </p>
                  )}

                  {loc.tags && loc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {loc.tags.map((tag: string, tIdx: number) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-foreground/5 text-foreground/65 text-[11px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-foreground/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-accent">
                    {loc.steps?.length || 0} {ui.hub_steps_suffix}
                  </span>

                  <Link
                    href={`/Location/${loc.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20"
                  >
                    <span>{ui.hub_view_directions_label}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-muted/20 border border-foreground/5 rounded-3xl">
            <MapPin size={32} className="mx-auto text-primary mb-4" />
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">
              {ui.hub_empty_title}
            </h2>
            <p className="text-foreground/60 text-sm">
              {ui.hub_empty_description}
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}
