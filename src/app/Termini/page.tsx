import type { Metadata } from "next";
import { FileText, Ticket, ShieldCheck, Clock, Ban, Scale, ClipboardList, Laptop, Camera } from "lucide-react";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";
import { LegalDocLayout, LegalDocCard } from "@/components/ui/LegalDocLayout";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const meta = content?.pages?.termini?.meta;
  return {
    title: meta?.title || "Termini di Biglietteria e Iscrizioni",
    description: meta?.description || "",
    alternates: {
      canonical: "/Termini",
    },
  };
}

const sectionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  scope: { icon: FileText, color: "bg-primary/10 text-primary" },
  pricing: { icon: Ticket, color: "bg-secondary/10 text-secondary" },
  refunds: { icon: ShieldCheck, color: "bg-accent/10 text-accent" },
  hall_access: { icon: Clock, color: "bg-primary/10 text-primary" },
  rules: { icon: Ban, color: "bg-rose-500/10 text-rose-400" },
  photo_policy: { icon: Camera, color: "bg-amber-500/10 text-amber-400" },
  third_party: { icon: Laptop, color: "bg-secondary/10 text-secondary" },
  jurisdiction: { icon: Scale, color: "bg-emerald-500/10 text-emerald-400" },
};

export default async function TerminiPage() {
  const content = await getContent();
  const t = content?.pages?.termini;
  const sections = t?.sections || [];

  return (
    <LegalDocLayout
      badge={t?.badge}
      title={t?.title || "Termini e Condizioni"}
      description={t?.description}
      backHref="/"
      backLabel={t?.back_link || "Torna alla home"}
    >
      {sections.map((section: any) => {
        const iconConfig = sectionIcons[section.id];
        const Icon = iconConfig?.icon;

        return (
          <LegalDocCard
            key={section.id || section.title}
            title={section.title}
            icon={Icon}
            iconColorClass={iconConfig?.color}
          >
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              {section.intro && <p><FormattedText text={section.intro} /></p>}
              {section.text && <p><FormattedText text={section.text} /></p>}

              {section.items && (
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {section.items.map((item: any, idx: number) => (
                    <li key={idx}>
                      {item.label && <strong>{item.label} </strong>}
                      <FormattedText text={item.text} />
                    </li>
                  ))}
                </ul>
              )}

              {section.paragraphs &&
                section.paragraphs.map((para: string, idx: number) => (
                  <p key={idx}><FormattedText text={para} /></p>
                ))}

              {section.cards && (
                <div className="space-y-4 pt-2">
                  {section.cards.map((card: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 space-y-2"
                    >
                      <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                        {idx === 1 && (
                          <ClipboardList size={16} className="text-primary" />
                        )}
                        {card.title}
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        <FormattedText text={card.text} />
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {section.notice_box && (
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-foreground/90 space-y-2">
                  {section.notice_box.title && (
                    <p className="font-bold text-amber-300 text-sm">
                      {section.notice_box.title}
                    </p>
                  )}
                  {section.notice_box.paragraphs?.map((p: string, idx: number) => (
                    <p key={idx} className="text-sm">
                      <FormattedText text={p} />
                    </p>
                  ))}
                </div>
              )}
            </div>
          </LegalDocCard>
        );
      })}
    </LegalDocLayout>
  );
}
