import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Users, Mail, Globe, ShieldAlert } from "lucide-react";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const imp = content?.pages?.impressum || {};
  return {
    title: imp.meta?.title || "Note Legali & Impressum",
    description: imp.meta?.description || "Note legali e informazioni editoriali della compagnia teatrale Gli Attomatti.",
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
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {imp.back_link || "Torna alla home"}
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
            {imp.badge || "Note Legali"}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground">
            {imp.title || "Impressum"}
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl font-medium">
            <FormattedText text={imp.description || "Informazioni obbligatorie ai sensi della legislazione svizzera sui media e sui servizi telematici."} />
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {/* Organizzazione & Indirizzo */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {org.section_title || "Organizzazione"}
                </h2>
                <p className="text-2xl font-bold text-foreground">{org.name || "Gli Attomatti"}</p>
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
          </div>

          {/* Contatti & Web */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {contacts.section_title || "Contatti telematici"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                  <Mail size={14} />
                  {contacts.email_label || "Email"}
                </div>
                <p className="text-foreground/80 font-medium break-all">
                  {contacts.email || "compagniateatralegliattomatti@gmail.com"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                  <Globe size={14} />
                  {contacts.website_label || "Sito web"}
                </div>
                <Link
                  href={contacts.website_url || "https://gliattomatti.ch"}
                  className="text-primary hover:underline font-medium inline-block"
                >
                  {contacts.website_url || "https://gliattomatti.ch"}
                </Link>
              </div>
            </div>
          </div>

          {/* Esclusione di responsabilità per contenuti e servizi incorporati */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {liability.section_title || "Esclusione di responsabilità (Haftungsausschluss)"}
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
              <p>
                <strong>{liability.contents_title || "Contenuti del sito:"}</strong> <FormattedText text={liability.contents_text || "I contenuti delle nostre pagine sono stati redatti con la massima diligenza. Tuttavia, non possiamo garantire la piena esattezza, completezza e tempestività delle informazioni fornite in ogni momento."} />
              </p>
              <p>
                <strong>{liability.links_title || "Collegamenti esterni e servizi incorporati (iframe embed):"}</strong> <FormattedText text={liability.links_text_1 || "Il nostro sito include collegamenti telematici a siti terzi nonché servizi digitali incorporati direttamente nelle pagine, in particolare la piattaforma svizzera di biglietteria Eventfrog AG (Neuhardstrasse 38, 4600 Olten) e i moduli interattivi di iscrizione di Tally BV (Muinklaan 23, 9000 Gand, Belgio)."} />
              </p>
              <p>
                <FormattedText text={liability.links_text_2 || "L'accesso, la compilazione e l'utilizzo di tali servizi terzi avvengono a esclusivo rischio dell'utente. Gli Attomatti non esercitano alcun controllo sulla conformazione tecnica, sulle politiche di sicurezza, sulla disponibilità dei server o sui contenuti erogati da tali provider indipendenti. La responsabilità per i dati e per le transazioni effettuate tramite tali piattaforme ricade interamente sui rispettivi gestori."} />
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {copyright.section_title || "Diritto d'autore (Copyright)"}
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              <FormattedText text={copyright.text || "I contenuti e le opere pubblicate su questo sito sono disciplinati dalle leggi svizzere sul diritto d'autore. Qualsiasi riproduzione, elaborazione, distribuzione o qualsiasi altra forma di utilizzo al di fuori dei limiti del diritto d'autore richiede il previo consenso scritto dell'autore o degli autori in questione."} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
