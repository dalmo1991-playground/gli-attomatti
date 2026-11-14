import type { Metadata } from "next";
import { FileText, Ticket, ShieldCheck, Clock, Ban, Scale, ClipboardList, Laptop, Camera, CalendarX, Accessibility, ShieldAlert, MessageSquare } from "lucide-react";
import { FormattedText } from "@/components/ui/FormattedText";
import { LegalDocLayout, LegalDocCard } from "@/components/ui/LegalDocLayout";
import { TERMINI_CONTENT } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: TERMINI_CONTENT.meta.title,
  description: TERMINI_CONTENT.meta.description,
  alternates: {
    canonical: "/Termini",
  },
};

const sectionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  scope: { icon: FileText, color: "bg-primary/10 text-primary" },
  pricing: { icon: Ticket, color: "bg-secondary/10 text-secondary" },
  refunds: { icon: ShieldCheck, color: "bg-accent/10 text-accent" },
  cancellation: { icon: CalendarX, color: "bg-amber-500/10 text-amber-400" },
  hall_access: { icon: Clock, color: "bg-primary/10 text-primary" },
  rules: { icon: Ban, color: "bg-rose-500/10 text-rose-400" },
  photo_policy: { icon: Camera, color: "bg-amber-500/10 text-amber-400" },
  accessibility: { icon: Accessibility, color: "bg-primary/10 text-primary" },
  safety: { icon: ShieldAlert, color: "bg-rose-500/10 text-rose-400" },
  third_party: { icon: Laptop, color: "bg-secondary/10 text-secondary" },
  complaints: { icon: MessageSquare, color: "bg-accent/10 text-accent" },
  jurisdiction: { icon: Scale, color: "bg-emerald-500/10 text-emerald-400" },
};

export default function TerminiPage() {
  const t = TERMINI_CONTENT;

  return (
    <LegalDocLayout
      badge={t.badge}
      title={t.title}
      description={t.description}
      lastUpdated={t.last_updated}
      backHref="/"
      backLabel={t.back_link}
    >
      {t.sections.map((section) => {
        const iconConfig = sectionIcons[section.id];
        const Icon = iconConfig?.icon;

        return (
          <LegalDocCard
            key={section.id}
            title={section.title}
            icon={Icon}
            iconColorClass={iconConfig?.color}
          >
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {section.intro && (
                <p>
                  <FormattedText text={section.intro} />
                </p>
              )}
              {section.text && (
                <p>
                  <FormattedText text={section.text} />
                </p>
              )}

              {section.items && (
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {section.items.map((item, idx) => (
                    <li key={idx}>
                      {item.label && <strong>{item.label} </strong>}
                      <FormattedText text={item.text} />
                    </li>
                  ))}
                </ul>
              )}

              {section.paragraphs &&
                section.paragraphs.map((para, idx) => (
                  <p key={idx}>
                    <FormattedText text={para} />
                  </p>
                ))}

              {section.cards && (
                <div className="space-y-3 pt-2">
                  {section.cards.map((card, idx) => (
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
                      <p className="text-sm text-foreground/75 leading-relaxed">
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
                  {section.notice_box.paragraphs?.map((p, idx) => (
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
