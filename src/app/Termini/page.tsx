import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Ticket, ShieldCheck, Clock, Ban, Scale, ClipboardList, Laptop } from "lucide-react";

export const metadata: Metadata = {
  title: "Termini di Biglietteria e Iscrizioni — Gli Attomatti",
  description: "Condizioni generali per l'acquisto dei biglietti, l'iscrizione agli eventi e l'accesso agli spettacoli teatrali della compagnia Gli Attomatti a Zurigo.",
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
            Regolamento Spettacoli & Eventi
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
            Termini e Condizioni
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl font-medium">
            Condizioni generali per l&apos;acquisto dei biglietti, l&apos;iscrizione a corsi ed eventi teatrali, e regolamento di sala della compagnia teatrale Gli Attomatti.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Ambito e Canali */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                1. Ambito di applicazione e canali di fruizione
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                Le presenti Condizioni Generali disciplinano il rapporto tra l&apos;utente e l&apos;organizzatore <strong>Gli Attomatti</strong> (Zurigo, Svizzera) in merito alla partecipazione agli spettacoli teatrali, corsi, laboratori ed eventi culturali promossi.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Biglietti per spettacoli a pagamento:</strong> l&apos;acquisto può essere completato direttamente sul portale di ticketing o mediante le <em>casse incorporate (iframe embed)</em> integrate nelle nostre pagine <code>/Biglietti/[slug]</code>. L&apos;elaborazione tecnica della transazione e l&apos;emissione del titolo d&apos;accesso con QR code sono gestiti dalla piattaforma partner svizzera <strong>Eventfrog AG</strong> (Neuhardstrasse 38, 4600 Olten, Svizzera), alle cui condizioni contrattuali per gli acquirenti si rimanda per gli aspetti transazionali.
                </li>
                <li>
                  <strong>Iscrizioni a eventi gratuiti, workshop o audizioni:</strong> la prenotazione avviene tramite moduli interattivi (anche incorporati via iframe) forniti dalla piattaforma <strong>Tally BV</strong> (Gand, Belgio) raggiungibili alle pagine <code>/Registrazioni/[slug]</code> o link associati.
                </li>
                <li>
                  <strong>Richieste per affitto sala (Saalvermietung) o contatti speciali:</strong> i moduli compilabili sul sito hanno valore di richiesta informativa preliminare e non costituiscono di per sé un contratto di locazione perfezionato, il quale richiede espressa conferma scritta e stipula tra le parti.
                </li>
              </ul>
            </div>
          </div>

          {/* 2. Prezzi e Pagamenti */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Ticket size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                2. Prezzi, acquisto e perfezionamento delle registrazioni
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                Tutti i prezzi dei biglietti per gli spettacoli sono espressi in Franchi Svizzeri (CHF). L&apos;acquisto si perfeziona con il buon fine del pagamento su Eventfrog e l&apos;invio telematico del biglietto elettronico recante codice QR univoco.
              </p>
              <p>
                Per gli eventi gestiti tramite registrazione via form (Tally), la partecipazione è confermata unicamente a seguito del completamento del modulo e della ricezione della notifica/email di conferma da parte degli organizzatori.
              </p>
            </div>
          </div>

          {/* 3. Rimborsi e Rinuncia */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                3. Rimborsi, rinuncia e politica di presenza responsabile (No-Show)
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                Di norma, i biglietti acquistati per gli spettacoli <strong>non sono rimborsabili</strong> da parte dell&apos;organizzatore in caso di mancata partecipazione o rinuncia per motivi personali dell&apos;acquirente. I biglietti possono essere liberamente ceduti a terzi.
              </p>
              <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 space-y-2">
                <p className="font-bold text-foreground text-sm">
                  Copertura assicurativa facoltativa Eventfrog
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  In fase di acquisto sulla cassa Eventfrog, l&apos;acquirente può facoltativamente sottoscrivere l&apos;assicurazione di annullamento e rimborso offerta direttamente da Eventfrog o da compagnie partner. In tal caso, il diritto al rimborso è disciplinato esclusivamente dalla polizza sottoscritta ed è gestito direttamente con Eventfrog.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <ClipboardList size={16} className="text-primary" />
                  Presenza responsabile per eventi gratuiti su registrazione (Tally)
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Per i corsi, workshop o spettacoli gratuiti a posti limitati, l&apos;iscrizione impegna il partecipante a presenziare. Qualora sopraggiungesse un impedimento, è richiesto di comunicare la disdetta con tempestività (scrivendo a <a href="mailto:compagniateatralegliattomatti@gmail.com" className="text-primary underline">compagniateatralegliattomatti@gmail.com</a>) al fine di consentire lo scorrimento della lista d&apos;attesa ad altre persone interessate.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Annullamento o Rinvio */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              4. Annullamento o rinvio dell&apos;evento
            </h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                In caso di <strong>annullamento definitivo</strong> di una recita o evento per cause di forza maggiore, disposizioni di pubblica sicurezza o impedimenti organizzativi insormontabili, l&apos;importo nominale dei biglietti acquistati sarà rimborsato all&apos;acquirente secondo le modalità operative della piattaforma Eventfrog.
              </p>
              <p>
                In caso di <strong>rinvio a data alternativa</strong>, il biglietto o l&apos;iscrizione rimane valido per la nuova data comunicata. Qualora l&apos;utente non possa partecipare nella nuova data, avrà facoltà di richiedere il rimborso o cancellare l&apos;iscrizione secondo le tempistiche indicate tempestivamente dall&apos;organizzatore.
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
                5. Accesso in sala, orari e puntualità
              </h2>
            </div>
            <div className="space-y-3 text-foreground/80 leading-relaxed font-medium">
              <p>
                Gli orari esatti di apertura delle porte, del botteghino e di inizio della rappresentazione sono <strong>indicati caso per caso</strong> nelle informazioni specifiche di ciascuno spettacolo sul sito web e sul biglietto emesso.
              </p>
              <p>
                Si raccomanda di presentarsi con congruo anticipo. Per tutelare il lavoro degli interpreti e la concentrazione del pubblico, <strong>a spettacolo iniziato l&apos;ingresso in sala potrebbe non essere consentito</strong> fino all&apos;eventuale primo intervallo utile, a discrezione del personale di sala.
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
                6. Norme di sala, riprese e divieti
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Durante la rappresentazione è severamente vietato effettuare riprese audio/video integrali o utilizzare il flash fotografico. I telefoni cellulari e altri dispositivi elettronici devono essere silenziati prima dell&apos;inizio dello spettacolo. L&apos;organizzatore si riserva il diritto di allontanare dalla sala chiunque turbi il regolare svolgimento della recita.
            </p>
          </div>

          {/* 7. Servizi Tecnici Incorporati */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Laptop size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                7. Servizi terzi incorporati e limitazione di responsabilità tecnica
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              L&apos;incorporamento dei moduli e delle casse digitali (iframe di <strong>Eventfrog AG</strong> e <strong>Tally BV</strong>) avviene nel rispetto dei migliori standard di sicurezza web. Tuttavia, Gli Attomatti non possono essere ritenuti responsabili per temporanee interruzioni di rete, indisponibilità dei server terzi, malfunzionamenti dei gateway bancari o ritardi nella consegna delle notifiche telematiche imputabili ai rispettivi fornitori esterni indipendenti.
            </p>
          </div>

          {/* 8. Legge applicabile */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Scale size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                8. Diritto applicabile e foro competente
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
