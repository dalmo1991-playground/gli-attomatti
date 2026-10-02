import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Users, Mail, Globe, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum — Gli Attomatti",
  description: "Note legali e informazioni editoriali della compagnia teatrale Gli Attomatti.",
  alternates: {
    canonical: "/Impressum",
  },
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Torna alla home
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
            Note Legali
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground">
            Impressum
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl font-medium">
            Informazioni obbligatorie ai sensi della legislazione svizzera sui media e sui servizi telematici.
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
                  Organizzazione
                </h2>
                <p className="text-2xl font-bold text-foreground">Gli Attomatti</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-foreground/5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                  <MapPin size={14} />
                  Indirizzo
                </div>
                <p className="text-foreground/80 leading-relaxed font-medium">
                  Alte Landstrasse 4, 8802 Kilchberg, Svizzera
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                  <Users size={14} />
                  Rappresentato da
                </div>
                <p className="text-foreground/80 leading-relaxed font-medium">
                  Domenico Scotti di Carlo
                </p>
              </div>
            </div>
          </div>

          {/* Contatti & Web */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              Contatti telematici
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                  <Mail size={14} />
                  Email
                </div>
                <p className="text-foreground/80 font-medium break-all">
                  compagniateatralegliattomatti@gmail.com
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                  <Globe size={14} />
                  Sito web
                </div>
                <Link
                  href="https://gliattomatti.ch"
                  className="text-primary hover:underline font-medium inline-block"
                >
                  https://gliattomatti.ch
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
                Esclusione di responsabilità (Haftungsausschluss)
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
              <p>
                <strong>Contenuti del sito:</strong> I contenuti delle nostre pagine sono stati redatti con la massima diligenza. Tuttavia, non possiamo garantire la piena esattezza, completezza e tempestività delle informazioni fornite in ogni momento.
              </p>
              <p>
                <strong>Collegamenti esterni e servizi incorporati (iframe embed):</strong> Il nostro sito include collegamenti telematici a siti terzi nonché <strong>servizi digitali incorporati direttamente nelle pagine</strong>, in particolare la piattaforma svizzera di biglietteria <strong>Eventfrog AG</strong> (Neuhardstrasse 38, 4600 Olten) e i moduli interattivi di iscrizione di <strong>Tally BV</strong> (Muinklaan 23, 9000 Gand, Belgio).
              </p>
              <p>
                L&apos;accesso, la compilazione e l&apos;utilizzo di tali servizi terzi avvengono a esclusivo rischio dell&apos;utente. Gli Attomatti non esercitano alcun controllo sulla conformazione tecnica, sulle politiche di sicurezza, sulla disponibilità dei server o sui contenuti erogati da tali provider indipendenti. La responsabilità per i dati e per le transazioni effettuate tramite tali piattaforme ricade interamente sui rispettivi gestori.
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
                Diritto d&apos;autore (Copyright)
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              I contenuti e le opere pubblicate su questo sito sono disciplinati dalle leggi svizzere sul diritto d&apos;autore. Qualsiasi riproduzione, elaborazione, distribuzione o qualsiasi altra forma di utilizzo al di fuori dei limiti del diritto d&apos;autore richiede il previo consenso scritto dell&apos;autore o degli autori in questione.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
