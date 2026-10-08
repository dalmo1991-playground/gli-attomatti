import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, Users, Mail, Globe, ShieldAlert } from "lucide-react";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";
import { LegalDocLayout, LegalDocCard } from "@/components/ui/LegalDocLayout";
import { defaultText } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const imp = content?.pages?.impressum || {};
  return {
    title: defaultText(imp.meta?.title, "Note Legali & Impressum") || undefined,
    description: defaultText(imp.meta?.description, "Note legali e informazioni editoriali della compagnia teatrale Gli Attomatti.") || undefined,
    alternates: {
      canonical: "/Impressum",
    },
  };
}

export default async function ImpressumPage() {
  const content = await getContent();
  const imp = content?.pages?.impressum || {};
  const org = imp.organization || {};
  const contacts = imp.contacts || {};
  const liability = imp.liability || {};
  const copyright = imp.copyright || {};

  return (
    <LegalDocLayout
      badge={defaultText(imp.badge, "Note Legali")}
      title={defaultText(imp.title, "Impressum")}
      description={defaultText(imp.description, "Informazioni obbligatorie ai sensi della legislazione svizzera sui media e sui servizi telematici.")}
      backHref="/"
      backLabel={defaultText(imp.back_link, "Torna alla home")}
    >
      {/* Organizzazione & Indirizzo */}
      <LegalDocCard>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div className="space-y-1">
            {defaultText(org.section_title, "Organizzazione") && (
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {defaultText(org.section_title, "Organizzazione")}
              </h2>
            )}
            {defaultText(org.name, "Gli Attomatti") && (
              <p className="text-2xl font-bold text-foreground">{defaultText(org.name, "Gli Attomatti")}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-foreground/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <MapPin size={14} />
              {org.address_label || "Indirizzo"}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.address || "Alte Landstrasse 4, 8802 Kilchberg, Svizzera"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Users size={14} />
              {org.represented_by_label || "Rappresentato da"}
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              {org.represented_by || "Domenico Scotti di Carlo"}
            </p>
          </div>
        </div>
      </LegalDocCard>

      {/* Contatti & Web */}
      <LegalDocCard title={defaultText(contacts.section_title, "Contatti telematici")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Mail size={14} />
              {defaultText(contacts.email_label, "Email")}
            </div>
            <p className="text-foreground/80 font-medium break-all">
              {contacts.email || "compagniateatralegliattomatti@gmail.com"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <Globe size={14} />
              {defaultText(contacts.website_label, "Sito web")}
            </div>
            <Link
              href={contacts.website_url || "https://gliattomatti.ch"}
              className="text-primary hover:underline font-medium inline-block"
            >
              {contacts.website_url || "https://gliattomatti.ch"}
            </Link>
          </div>
        </div>
      </LegalDocCard>

      {/* Esclusione di responsabilità per contenuti e servizi incorporati */}
      <LegalDocCard
        title={defaultText(liability.section_title, "Esclusione di responsabilità (Haftungsausschluss)")}
        icon={ShieldAlert}
        iconColorClass="bg-secondary/10 text-secondary"
      >
        <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
          <p>
            <strong>{defaultText(liability.contents_title, "Contenuti del sito:")}</strong>{" "}
            <FormattedText text={liability.contents_text || "I contenuti delle nostre pagine sono stati redatti con la massima diligenza. Tuttavia, non possiamo garantire la piena esattezza, completezza e tempestività delle informazioni fornite in ogni momento."} />
          </p>
          <p>
            <strong>{defaultText(liability.links_title, "Collegamenti esterni e servizi incorporati (iframe embed):")}</strong>{" "}
            <FormattedText text={liability.links_text_1 || "Il nostro sito include collegamenti telematici a siti terzi nonché servizi digitali incorporati direttamente nelle pagine, in particolare la piattaforma svizzera di biglietteria Eventfrog AG (Neuhardstrasse 38, 4600 Olten) e i moduli interattivi di iscrizione di Tally BV (Muinklaan 23, 9000 Gand, Belgio)."} />
          </p>
          <p>
            <FormattedText text={liability.links_text_2 || "L'accesso, la compilazione e l'utilizzo di tali servizi terzi avvengono a esclusivo rischio dell'utente. Gli Attomatti non esercitano alcun controllo sulla conformazione tecnica, sulle politiche di sicurezza, sulla disponibilità dei server o sui contenuti erogati da tali provider indipendenti. La responsabilità per i dati e per le transazioni effettuate tramite tali piattaforme ricade interamente sui rispettivi gestori."} />
          </p>
        </div>
      </LegalDocCard>

      {/* Copyright */}
      <LegalDocCard
        title={defaultText(copyright.section_title, "Diritto d'autore (Copyright)")}
        icon={ShieldAlert}
        iconColorClass="bg-accent/10 text-accent"
      >
        <p className="text-foreground/80 leading-relaxed font-medium">
          <FormattedText text={copyright.text || "I contenuti e le opere pubblicate su questo sito sono disciplinati dalle leggi svizzere sul diritto d'autore. Qualsiasi riproduzione, elaborazione, distribuzione o qualsiasi altra forma di utilizzo al di fuori dei limiti del diritto d'autore richiede il previo consenso scritto dell'autore o degli autori in questione."} />
        </p>
      </LegalDocCard>
    </LegalDocLayout>
  );
}
