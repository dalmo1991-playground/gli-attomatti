import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Ticket, ShieldCheck, Clock, Ban, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Termini e Condizioni di Biglietteria — Gli Attomatti",
  description: "Condizioni generali per l'acquisto dei biglietti e l'accesso agli spettacoli teatrali della compagnia Gli Attomatti.",
  alternates: {
    canonical: "/Termini",
  },
};

export default function TerminiPage() {
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
            Regolamento Spettacoli
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
            Termini e Condizioni
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl font-medium">
            Condizioni generali di vendita dei biglietti e regolamento di sala per le produzioni della compagnia teatrale Gli Attomatti.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Ambito e Parti */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                1. Ambito di applicazione e parti
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Le presenti Condizioni Generali disciplinano il contratto di spettacolo tra l'acquirente del biglietto e l'organizzatore <strong>Gli Attomatti</strong> (Zurigo, Svizzera).
            </p>
            <p className="text-foreground/80 leading-relaxed font-medium">
              L'elaborazione tecnica della vendita, il pagamento e l'emissione dei biglietti sono gestiti dalla piattaforma partner <strong>Eventfrog AG</strong> (Neuhardstrasse 38, 4600 Olten, Svizzera), alle cui condizioni contrattuali per gli acquirenti si rimanda per gli aspetti transazionali.
            </p>
          </div>

          {/* 2. Prezzi e Pagamenti */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Ticket size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                2. Prezzi e acquisto
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Tutti i prezzi dei biglietti sono espressi in Franchi Svizzeri (CHF). L'acquisto si perfeziona con la conferma della transazione e l'invio del biglietto elettronico con codice QR da parte di Eventfrog.
            </p>
          </div>

          {/* 3. Rimborsi e Rinuncia */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                3. Rimborsi, rinuncia e assicurazione
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                Di norma, i biglietti acquistati <strong>non sono rimborsabili</strong> da parte dell'organizzatore in caso di mancata partecipazione o rinuncia per motivi personali dell'acquirente. I biglietti possono comunque essere liberamente ceduti a terzi.
              </p>
              <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 space-y-2">
                <p className="font-bold text-foreground text-sm">
                  Copertura assicurativa opzionale Eventfrog
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  In fase di acquisto sulla piattaforma Eventfrog, l'acquirente può facoltativamente sottoscrivere l'assicurazione di annullamento/rimborso offerta direttamente da Eventfrog o da compagnie assicurative partner. In tal caso, il diritto al rimborso è regolato esclusivamente dalla polizza scelta e gestito direttamente tramite Eventfrog.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Annullamento o Rinvio */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              4. Annullamento o rinvio della recita
            </h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                In caso di <strong>annullamento definitivo</strong> dello spettacolo per cause di forza maggiore, disposizioni delle autorità o impedimenti tecnici/organizzativi, l'importo nominale del biglietto sarà rimborsato all'acquirente secondo le modalità operative di Eventfrog.
              </p>
              <p>
                In caso di <strong>rinvio dello spettacolo</strong> a una data alternativa, il biglietto acquistato rimane automaticamente valido per la nuova data comunicata. Qualora l'acquirente non possa partecipare alla data sostitutiva, ha diritto di richiedere il rimborso entro i termini che verranno resi noti tempestivamente.
              </p>
            </div>
          </div>

          {/* 5. Accesso in Sala */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                5. Accesso in sala e orari
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                Gli orari esatti di apertura delle porte, del botteghino e di inizio della recita sono <strong>indicati caso per caso</strong> nelle informazioni specifiche di ciascuno spettacolo sul sito web e sul biglietto emesso.
              </p>
              <p>
                Si raccomanda di presentarsi con congruo anticipo. Per tutelare il lavoro degli attori e l'esperienza del pubblico, <strong>a spettacolo iniziato l'ingresso in sala potrebbe non essere consentito</strong> fino all'eventuale primo intervallo utile, a discrezione del personale di sala.
              </p>
            </div>
          </div>

          {/* 6. Norme di Sala e Registrazioni */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <Ban size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                6. Registrazioni e comportamento
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Durante la rappresentazione è severamente vietato effettuare riprese audio/video integrali o utilizzare il flash fotografico. I telefoni cellulari e altri dispositivi elettronici devono essere silenziati prima dell'inizio dello spettacolo. L'organizzatore si riserva il diritto di allontanare dalla sala chiunque turbi il regolare svolgimento dello spettacolo.
            </p>
          </div>

          {/* 7. Legge applicabile */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Scale size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                7. Diritto applicabile e foro competente
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Il rapporto contrattuale è disciplinato esclusivamente dal diritto materiale svizzero. Per qualsiasi controversia il foro competente esclusivo è quello di Zurigo, Svizzera.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
