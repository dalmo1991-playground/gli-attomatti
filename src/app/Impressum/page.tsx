import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, Users, Mail, Globe, ShieldAlert, Scale, Server, ExternalLink } from "lucide-react";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";
import { LegalDocLayout, LegalDocCard } from "@/components/ui/LegalDocLayout";
import { getActiveLegalProviders } from "@/lib/legalProviders";
import { IMPRESSUM_CONTENT } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: IMPRESSUM_CONTENT.meta.title,
  description: IMPRESSUM_CONTENT.meta.description,
  alternates: {
    canonical: "/Impressum",
  },
};

export default async function ImpressumPage() {
  const content = await getContent();
  const imp = IMPRESSUM_CONTENT;
  const org = imp.organization;
  const contacts = imp.contacts;
  const providersSection = imp.providers_section;
  const providers = getActiveLegalProviders(content);
  const liability = imp.liability;
  const copyright = imp.copyright;

  return (
    <LegalDocLayout
      badge={imp.badge}
      title={imp.title}
      description={imp.description}
      lastUpdated={imp.last_updated}
      backHref="/"
      backLabel={imp.back_link}
    >
      {/* Organizzazione & Indirizzo */}
      <LegalDocCard>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {org.section_title}
            </h2>
            <p className="text-2xl font-bold text-foreground">{org.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-foreground/5 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Scale size={14} />
              {org.legal_form_label}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.legal_form}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <MapPin size={14} />
              {org.address_label}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.address}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Users size={14} />
              {org.represented_by_label}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.represented_by}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Users size={14} />
              {org.treasurer_label}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.treasurer}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Users size={14} />
              {org.editorial_responsible_label}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.editorial_responsible}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <ShieldAlert size={14} />
              {org.registry_label}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.registry}
            </p>
          </div>
        </div>
      </LegalDocCard>

      {/* Contatti & Web */}
      <LegalDocCard title={contacts.section_title}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Mail size={14} />
              {contacts.email_label}
            </div>
            <p className="text-foreground/80 font-medium break-all">
              {contacts.email}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Globe size={14} />
              {contacts.website_label}
            </div>
            <Link
              href={contacts.website_url}
              className="text-primary hover:underline font-medium inline-block"
            >
              {contacts.website_url}
            </Link>
          </div>
        </div>
      </LegalDocCard>

      {/* Fornitori di servizi e infrastruttura digitale */}
      <LegalDocCard
        title={providersSection.section_title}
        icon={Server}
        iconColorClass="bg-accent/10 text-accent"
      >
        <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
          <p>
            <FormattedText text={providersSection.intro} />
          </p>
          <ul className="space-y-3">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className="p-3.5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">
                    {provider.name}{" "}
                    <span className="text-xs font-medium text-foreground/50">
                      ({provider.location})
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70">{provider.role}</p>
                </div>
                {provider.privacyUrl && (
                  <Link
                    href={provider.privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0 font-semibold"
                  >
                    Privacy <ExternalLink size={12} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </LegalDocCard>

      {/* Esclusione di responsabilità per contenuti e servizi incorporati */}
      <LegalDocCard
        title={liability.section_title}
        icon={ShieldAlert}
        iconColorClass="bg-secondary/10 text-secondary"
      >
        <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
          <p>
            <strong>{liability.contents_title}</strong>{" "}
            <FormattedText text={liability.contents_text} />
          </p>
          <p>
            <strong>{liability.links_title}</strong>{" "}
            <FormattedText text={liability.links_text_1} />
          </p>
          <p>
            <FormattedText text={liability.links_text_2} />
          </p>
        </div>
      </LegalDocCard>

      {/* Copyright */}
      <LegalDocCard
        title={copyright.section_title}
        icon={ShieldAlert}
        iconColorClass="bg-accent/10 text-accent"
      >
        <p className="text-foreground/80 leading-relaxed font-medium text-sm">
          <FormattedText text={copyright.text} />
        </p>
      </LegalDocCard>
    </LegalDocLayout>
  );
}
