"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  Globe,
  Code,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Sparkles,
  RefreshCw,
  Sliders,
  Download,
  Undo2,
  Calendar,
  MapPin,
  Ticket,
  Users,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  Lock,
  Eye,
  Database,
  Smartphone,
  ChevronDown,
  ChevronUp,
  History,
  Theater,
  Compass,
  Mail,
  Newspaper
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { cn } from "@/lib/utils";

interface GuidaTabProps {
  onNavigateTab?: (tab: string) => void;
}

export function GuidaTab({ onNavigateTab }: GuidaTabProps) {
  const { content, activeBranch, adminSecret, diffList } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>("panoramica");

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadBackup = () => {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attomatti-content-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sections = useMemo(
    () => [
      { id: "panoramica", label: "Come funziona il sito", icon: Globe },
      { id: "ui", label: "Modifiche visive (UI)", icon: Sliders },
      { id: "json", label: "Modifiche avanzate (JSON)", icon: Code },
      { id: "deployment", label: "Pubblicazione & Deploy", icon: Rocket },
      { id: "immagini", label: "Gestione Immagini & Foto", icon: ImageIcon },
      { id: "legale", label: "Norme Legali Svizzere", icon: ShieldCheck },
      { id: "faq", label: "Domande Frequenti (FAQ)", icon: HelpCircle },
      { id: "glossario", label: "Glossario dei Termini", icon: BookOpen }
    ],
    []
  );

  const faqs = [
    {
      q: "Ho fatto una modifica per sbaglio e non ho ancora pubblicato. Come posso tornare indietro?",
      a: "Se non hai ancora cliccato su 'Pubblica Modifiche', le modifiche risiedono solo nel tuo browser! Puoi cliccare sul pulsante 'Annulla' in cima alla pagina per azzerare tutte le modifiche e ricaricare i dati correntemente pubblicati online, oppure semplicemente ricaricare la pagina web e ignorare il ripristino della bozza."
    },
    {
      q: "Perché quando clicco su 'Pubblica' mi viene chiesto un codice o appare 'Password non autorizzata'?",
      a: "Per proteggere il sito da modifiche involontarie o non autorizzate, ogni operazione di pubblicazione o caricamento foto richiede la Password di Amministrazione. Clicca sull'icona della chiave in alto a destra, digita la password della compagnia e clicca su Salva. La chiave diventerà verde ('Autenticato') e potrai pubblicare."
    },
    {
      q: "Ho pubblicato le modifiche, ma sul mio computer o cellulare continuo a vedere i vecchi testi. Perché?",
      a: "È il tipico effetto della 'Cache del browser'! I telefoni e i browser salvano in memoria locale le pagine visitate per renderle più veloci. Basta fare un aggiornamento forzato: su Mac premi Cmd + Shift + R, su Windows premi Ctrl + F5, oppure apri il sito in modalità navigazione anonima o svuota la cronologia recente dello smartphone. I nuovi visitatori vedranno comunque subito la versione aggiornata."
    },
    {
      q: "Possiamo lavorare in due persone contemporaneamente sul pannello?",
      a: "È sconsigliato lavorare nello stesso istante da due computer diversi. Poiché il sito viene salvato interamente in un unico pacchetto dati (content.json), l'ultima persona che clicca su 'Pubblica' rischia di sovrascrivere le modifiche apportate dall'altra persona. È sempre buona norma avvisarsi a vicenda o alternarsi."
    },
    {
      q: "Nel sorgente JSON vedo una linea rossa e non riesco a salvare. Cosa è successo?",
      a: "L'editor JSON integrato possiede un controllo automatico di sicurezza che blocca il salvataggio se c'è un errore di sintassi (ad esempio una virgola mancante, una virgola di troppo prima di una parentesi, o delle virgolette aperte e non chiuse). L'editor ti indica il numero di riga con l'errore: premi Ctrl+Z (o Cmd+Z su Mac) per annullare l'ultima modifica fino a far scomparire la linea rossa."
    },
    {
      q: "Come faccio a nascondere del tutto una sezione senza cancellarne la configurazione?",
      a: "Usa la parola speciale 'null' nel JSON! Il sito riconosce il valore 'null' (tutto minuscolo, senza virgolette) come una soppressione esplicita e nasconderà completamente il blocco o il titolo, senza cadere nei testi di ripiego predefiniti."
    },
    {
      q: "Cosa succede se il sito dovesse mostrare un errore critico dopo una pubblicazione?",
      a: "Ogni singola pubblicazione genera uno storico immutabile su GitHub ('commit'). È sempre possibile ripristinare in pochi istanti la versione precedente ricaricando un file di backup scaricato o chiedendo al supporto tecnico di fare un 'rollback' al commit precedente."
    }
  ];

  const glossaryTerms = [
    {
      term: "Headless CMS",
      def: "Un sistema di gestione dei contenuti moderno e ultra-leggero, che non usa database lenti o plugin ingombranti ma un unico file ordinato (content.json)."
    },
    {
      term: "content.json",
      def: "La cassaforte del sito: un file di testo strutturato che contiene ogni singolo testo, titolo, data, prezzo, immagine e collegamento del sito degli Attomatti."
    },
    {
      term: "Deploy / Deployment",
      def: "Il processo automatico in cui i server di hosting (Vercel) prendono le nuove modifiche pubblicate, le compilano e le distribuiscono su internet in tutto il mondo."
    },
    {
      term: "Branch (main e dev)",
      def: "I due canali del sito: 'main' è il sito ufficiale aperto al pubblico (gliattomatti.ch), mentre 'dev' è l'ambiente di prova riservato per collaudare le novità."
    },
    {
      term: "Commit",
      def: "Una 'fotografia' salvata nel tempo del codice e dei contenuti su GitHub, con data, autore e codice identificativo univoco (SHA)."
    },
    {
      term: "Cache del browser",
      def: "La memoria temporanea del computer o dello smartphone che conserva copie dei siti per aprirli all'istante, ma che a volte ritarda la visualizzazione delle novità appena pubblicate."
    },
    {
      term: "WebP",
      def: "Il formato immagine di ultima generazione usato dal sito: comprime le foto fino all'80% in più rispetto ai vecchi JPEG/PNG mantenendo la massima nitidezza."
    },
    {
      term: "Slug",
      def: "La parte finale dell'indirizzo web di una pagina specifica (ad esempio in '/Spettacoli/la-cena-dei-cretini', lo slug è 'la-cena-dei-cretini')."
    },
    {
      term: "Diff / Registro modifiche",
      def: "Il confronto visivo tra la versione attualmente online e la bozza modificata nel tuo pannello, evidenziato in verde (aggiunte) e rosso (rimozioni)."
    },
    {
      term: "Soppressione Esplicita (null)",
      def: "Una regola speciale di questo sito: se imposti un testo o titolo su 'null' nel JSON, il sito nasconde completamente quel componente anziché mostrare il testo standard."
    }
  ];

  // Filtering based on search query
  const query = searchQuery.toLowerCase().trim();
  const isMatch = (text: string) => !query || text.toLowerCase().includes(query);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Hero Welcome Banner */}
      <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-primary/10 via-muted/30 to-background border border-primary/20 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <BookOpen
          size={140}
          className="absolute -bottom-8 -right-8 text-primary/[0.04] pointer-events-none"
        />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-primary text-white shadow-sm">
              Manuale Ufficiale
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-muted/60 text-foreground/70 border border-foreground/5">
              Guida per Nuovi Amministratori
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ambiente: {activeBranch}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
              Come Funziona il Sito de Gli Attomatti
            </h1>
            <p className="text-sm sm:text-base text-foreground/70 max-w-3xl leading-relaxed">
              Hai preso in mano la gestione del sito web e non hai competenze tecniche? 
              Nessun problema: questa guida ti spiega passo dopo passo l&apos;architettura del sito, 
              come inserire o modificare contenuti, come usare la grafica visiva o il JSON, come pubblicare online 
              e cosa fare se qualcosa non va come previsto.
            </p>
          </div>

          {/* Quick Jump Stats & Action Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-background/80 border border-foreground/5 space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Database size={16} />
                <span>Nessun Database</span>
              </div>
              <p className="text-xs text-foreground/60 leading-snug">
                Tutti i testi vivono in un unico file (<code className="text-primary font-mono font-bold">content.json</code>), 
                impossibile da corrompere da remoto.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-background/80 border border-foreground/5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Bozze Protette</span>
              </div>
              <p className="text-xs text-foreground/60 leading-snug">
                Il tuo lavoro viene memorizzato nel browser: se chiudi la finestra per sbaglio, non perdi nulla.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-background/80 border border-foreground/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Rocket size={16} />
                <span>Deploy Vercel</span>
              </div>
              <p className="text-xs text-foreground/60 leading-snug">
                Un clic su &quot;Pubblica&quot; invia le modifiche a GitHub e aggiorna il sito live in 60-90 secondi.
              </p>
            </div>
          </div>

          {/* Download Backup Button */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-foreground/10 hover:border-foreground/20 transition-all shadow-sm"
              title="Scarica una copia di sicurezza completa dei dati del sito sul tuo computer"
            >
              <Download size={15} className="text-primary" />
              <span>Scarica Backup Sicuro (content.json)</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("spettacoli")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Theater size={15} />
                <span>Inizia a Modificare gli Spettacoli</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Search & Filter Bar */}
      <div className="sticky top-20 z-20 bg-background/95 backdrop-blur-md p-4 rounded-2xl border border-foreground/10 shadow-sm space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca nella guida... (es. 'immagini', 'json', 'password', 'null', 'eventfrog', 'deploy', 'bozze')"
            className="w-full pl-10 pr-10 py-2.5 bg-muted/30 border border-foreground/10 focus:border-primary rounded-xl text-xs sm:text-sm text-foreground placeholder:text-foreground/40 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/40 hover:text-foreground p-1"
            >
              Cancella
            </button>
          )}
        </div>

        {/* Quick Topic Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-[11px] font-bold text-foreground/40 shrink-0 uppercase tracking-wider mr-1">
            Argomenti:
          </span>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSectionId === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={() => setActiveSectionId(sec.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0",
                  isActive
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-muted/30 text-foreground/70 hover:text-foreground border-foreground/5 hover:border-foreground/15"
                )}
              >
                <Icon size={13} />
                <span>{sec.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* SEZIONE 1: PANORAMICA & ARCHITETTURA */}
      {(isMatch("panoramica") || isMatch("architettura") || isMatch("database") || isMatch("content.json") || isMatch("branch") || isMatch("main") || isMatch("dev")) && (
        <div id="panoramica" className="scroll-mt-36">
          <AdminSection
            title="1. Come Funziona il Sito (Spiegato Semplice)"
            description="L'architettura moderna di Gli Attomatti spiegata senza gergo per chi deve gestire tutto con serenità."
            icon={Globe}
          >
            <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
              <div className="p-5 rounded-2xl bg-muted/30 border border-foreground/5 space-y-3">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  La Filosofia: Niente Database, Massima Velocità e Sicurezza
                </h4>
                <p>
                  I siti tradizionali (come WordPress) poggiano su database complessi (MySQL), decine di estensioni e server 
                  che necessitano di manutenzione continua e possono essere hackerati o rallentare.
                </p>
                <p>
                  Il sito de <strong className="text-foreground">Gli Attomatti</strong> segue invece l&apos;approccio 
                  moderno <strong>&quot;Jamstack / Headless CMS&quot;</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/70">
                  <li>
                    <strong className="text-foreground">Unica fonte di verità:</strong> tutti i testi, gli spettacoli, le date, i prezzi e le foto 
                    risiedono in un unico file pulito: <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-primary">src/data/content.json</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">Next.js e Turbopack:</strong> il motore del sito legge questo file e genera pagine web statiche 
                    velocissime, ottimizzate al millimetro per gli smartphone e per i motori di ricerca Google.
                  </li>
                  <li>
                    <strong className="text-foreground">Inviolabile dall&apos;esterno:</strong> non essendoci database SQL o porte aperte, 
                    il sito non può essere bucato o corrotto.
                  </li>
                </ul>
              </div>

              {/* The 5 Steps Journey */}
              <div className="space-y-3">
                <h4 className="font-bold text-base text-foreground">
                  Il Viaggio di una Modifica: Cosa Succede Quando Lavori nel Pannello
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h5 className="font-bold text-xs uppercase tracking-wide text-foreground">Modifica Visiva</h5>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Modifichi una data, aggiungi uno spettacolo o carichi una locandina dalle schede a sinistra.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <h5 className="font-bold text-xs uppercase tracking-wide text-foreground">Bozza Locale</h5>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Il browser salva istantaneamente una bozza protetta in memoria. Puoi vedere l&apos;Anteprima a fianco.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <h5 className="font-bold text-xs uppercase tracking-wide text-foreground">Password & Invio</h5>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Clicchi &quot;Pubblica Modifiche&quot; con la password admin inserita in alto a destra.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                      4
                    </div>
                    <h5 className="font-bold text-xs uppercase tracking-wide text-foreground">Salvataggio GitHub</h5>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Il sistema registra un commit crittografato su GitHub salvando la nuova versione nella storia.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                      5
                    </div>
                    <h5 className="font-bold text-xs uppercase tracking-wide text-foreground">Online su Vercel</h5>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      I server Vercel compilano il nuovo sito. In 60-90 secondi le novità sono visibili al pubblico.
                    </p>
                  </div>
                </div>
              </div>

              {/* Branch difference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Branch &quot;main&quot; — Produzione (Il Sito Ufficiale)
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    È la versione che il pubblico vede su <strong className="text-foreground">gliattomatti.ch</strong>. 
                    Quando pubblichi qui, il cambiamento va direttamente in scena per tutti gli spettatori.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Branch &quot;dev&quot; — Sviluppo (Palestra & Anteprime)
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    È un sito gemello privato usato per testare nuove pagine, spettacoli o grafiche prima di metterle 
                    ufficialmente online. Il badge in cima al pannello ti dice sempre dove ti trovi.
                  </p>
                </div>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 2: MODIFICHE DALLA UI VISIVA */}
      {(isMatch("ui") || isMatch("visive") || isMatch("spettacoli") || isMatch("corsi") || isMatch("location") || isMatch("biglietti") || isMatch("anteprima") || isMatch("diff")) && (
        <div id="ui" className="scroll-mt-36">
          <AdminSection
            title="2. Come Fare Modifiche tramite l'Interfaccia Visiva (UI)"
            description="La modalità consigliata per il 95% del lavoro quotidiano: testi, date, foto e biglietti."
            icon={Sliders}
          >
            <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
              <p>
                Non c&apos;è bisogno di toccare codice o file di testo: il menu a sinistra è organizzato in schede intuitive 
                che riflettono le aree del sito. Ecco cosa fa ciascuna scheda:
              </p>

              {/* Grid of tabs explained */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Theater size={18} className="text-primary" />
                      <span>Spettacoli</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("spettacoli")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Aggiungi o modifica gli spettacoli teatrali: titolo, compagnia, sinossi, date e orari (anche multiple repliche!), 
                    prezzi, locandina verticale e galleria fotografica di scena. Puoi riordinare gli spettacoli con le frecce Su/Giù.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Compass size={18} className="text-primary" />
                      <span>Iniziative & Corsi</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("iniziative")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Gestisci workshop di improvvisazione, corsi di teatro per ragazzi o adulti, cineforum e progetti speciali. 
                    Include moduli di contatto o iscrizione dedicati per raccogliere le adesioni.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <MapPin size={18} className="text-primary" />
                      <span>Teatri & Location</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("locations")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Le sale teatrali e gli spazi dove recitano Gli Attomatti. Imposta indirizzo, mappa interattiva Google Maps, 
                    indicazioni pratiche per il parcheggio e i trasporti pubblici, oltre alle foto degli spazi.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Ticket size={18} className="text-primary" />
                      <span>Biglietti & Casse</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("ticketing")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Configura la vendita dei biglietti: collega i pulsanti esterni (es. Eventfrog), inserisci prezzi ridotti, 
                    istruzioni per la cassa serale e la dicitura &quot;Sold Out&quot; per eventi al completo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Users size={18} className="text-primary" />
                      <span>Cast & Staff (Chi Siamo)</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("attori")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    I volti della compagnia! Carica ritratti, assegna ruoli (attore, regista, direttivo), scrivi una biografia 
                    teatrale e inserisci i collegamenti ai profili social dei componenti del gruppo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <ImageIcon size={18} className="text-primary" />
                      <span>Galleria Immagini</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("gallery")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    L&apos;archivio fotografico del teatro. Tutte le foto caricate sono elencate qui: puoi filtrarle per nome, 
                    vederne l&apos;anteprima e cliccare &quot;Copia link&quot; per incollare il percorso in qualunque altra pagina.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <BookOpen size={18} className="text-primary" />
                      <span>Blog & Racconti</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("blog")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Pubblica racconti, annunci e retroscena dal palcoscenico con capitoli modulari (testi e gallerie). Puoi inoltre confezionare ogni articolo in formato email per inviarlo ai tuoi iscritti tramite newsletter!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Mail size={18} className="text-primary" />
                      <span>Email & Notifiche</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("emails")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Personalizza l&apos;oggetto, i testi e i template delle comunicazioni email inviate a chi compila un modulo 
                    di prenotazione o si registra a una delle iniziative della compagnia.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Sliders size={18} className="text-primary" />
                      <span>Marketing & Privacy</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("integrations")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Apri scheda →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Attiva o disattiva con un semplice interruttore Google Analytics 4, Meta Pixel e il Cookie Banner conforme 
                    alla legge svizzera (se nessun tracciamento è attivo, il sito è 100% cookie-free!).
                  </p>
                </div>
              </div>

              {/* Special Tools: Anteprima, Diff, Bozze */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-4">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Lightbulb size={18} className="text-primary" />
                  I Tuoi Tre Alleati nel Pannello di Controllo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                      <Eye size={15} className="text-primary" />
                      <span>1. L&apos;Anteprima Affiancata</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      Clicca sul pulsante <strong>&quot;Anteprima&quot;</strong> in alto a destra. Si aprirà una colonna 
                      accanto che mostra il sito web reale che si aggiorna in tempo reale mentre digiti, senza pubblicare nulla online.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                      <History size={15} className="text-amber-400" />
                      <span>2. Il Registro Modifiche (Diff)</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      In alto vedrai un contatore numerico (es. <em>&quot;3 modifiche non pubblicate&quot;</em>). Cliccandolo, 
                      vedrai esattamente riga per riga cosa hai cambiato rispetto a quanto è online.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                      <Undo2 size={15} className="text-emerald-400" />
                      <span>3. Il Salvataggio Bozze</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      Ogni modifica viene memorizzata nel tuo browser ogni minuto. Se chiudi la pagina, riaprendola un banner 
                      ti permetterà di ripristinare il tuo lavoro con un solo clic.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guida Formattazione Testo: Grassetto, Corsivo ed Evidenziazione */}
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Stili di Testo nei Paragrafi (Grassetto, Corsivo e Frasi ad Effetto)
                </h4>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Nei campi di testo e nell&apos;editor visivo puoi dare risalto ai contenuti con una gerarchia visiva chiara:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-background border border-foreground/10 space-y-1">
                    <div className="text-xs font-bold text-foreground">
                      <strong>Grassetto</strong>
                    </div>
                    <p className="text-[11px] text-foreground/60">
                      Usa il pulsante <strong>B</strong> o <code className="text-primary font-mono font-bold">**testo**</code> / <code className="text-primary font-mono font-bold">&lt;b&gt;</code>. Bianco puro ad alto contrasto per titoli o concetti chiave.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-foreground/10 space-y-1">
                    <div className="text-xs font-semibold italic text-foreground tracking-wide">
                      <em>Corsivo</em>
                    </div>
                    <p className="text-[11px] text-foreground/60">
                      Usa il pulsante <em>I</em> o <code className="text-primary font-mono font-bold">*testo*</code> / <code className="text-primary font-mono font-bold">&lt;i&gt;</code>. Spessore medio e tracciamento arioso per titoli di opere o sfumature espressive.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-foreground/10 space-y-1">
                    <div className="text-xs font-bold text-primary">
                      Evidenziatore (Colore Primario)
                    </div>
                    <p className="text-[11px] text-foreground/60">
                      Usa l&apos;icona evidenziatore o <code className="text-primary font-mono font-bold">==testo==</code> / <code className="text-primary font-mono font-bold">&lt;mark&gt;</code>. Colora le parole nel colore primario per citazioni, battute o frasi a effetto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 3: MODIFICHE DAL JSON */}
      {(isMatch("json") || isMatch("codice") || isMatch("null") || isMatch("soppressione") || isMatch("backup") || isMatch("virgole") || isMatch("sintassi")) && (
        <div id="json" className="scroll-mt-36">
          <AdminSection
            title="3. Come Fare Modifiche Avanzate tramite il Sorgente JSON"
            description="Quando serve usare il JSON, perché la UI non ha tutti i campi e come usare la parola magica 'null'."
            icon={Code}
          >
            <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
              {/* Principi di semplicità admin */}
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Lightbulb size={18} className="text-primary" />
                  Perché la UI visiva non mostra ogni singolo campo? (Admin Restraint)
                </h4>
                <p>
                  Nel sito degli Attomatti vige il principio di <strong>semplicità operativa</strong>: 
                  la grafica della UI è stata disegnata per essere rapida, intuitiva e concentrata sulle attività frequenti 
                  (titoli, date, foto, descrizioni, link).
                </p>
                <p>
                  I campi secondari di rifinitura, come testi ausiliari, sottotitoli rari, o la soppressione di blocchi con <code className="text-primary font-mono font-bold">null</code>, 
                  si gestiscono direttamente nella scheda <strong className="text-foreground">Sorgente JSON</strong>.
                </p>
              </div>

              {/* The Rule of 3 Levels and null */}
              <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-foreground/10">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  La Risoluzione a 3 Livelli e la Magia di &quot;null&quot;
                </h4>
                <p>
                  Nelle pagine dinamiche (ad esempio le schede delle Location o degli Spettacoli), i testi vengono decisi 
                  secondo questa gerarchia precisa:
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-background border border-foreground/10 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold shrink-0">Livello 1</span>
                    <div>
                      <strong className="text-foreground font-sans">Valore Specifico della Pagina:</strong>
                      <p className="text-foreground/60 font-sans text-[12px] mt-0.5">
                        Quello che imposti nel singolo oggetto (es. <code>steps_heading: &quot;Come Arrivare in Teatro&quot;</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center text-foreground/40 font-sans font-bold text-xs">
                    ↓ se vuoto (&quot;&quot;) o non presente
                  </div>

                  <div className="p-3 rounded-xl bg-background border border-foreground/10 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground/70 font-bold shrink-0">Livello 2</span>
                    <div>
                      <strong className="text-foreground font-sans">Valore Predefinito di Sezione:</strong>
                      <p className="text-foreground/60 font-sans text-[12px] mt-0.5">
                        Il testo standard comune a tutte le schede (es. <code>content.pages.locations.steps_heading</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center text-foreground/40 font-sans font-bold text-xs">
                    ↓ se anche questo manca
                  </div>

                  <div className="p-3 rounded-xl bg-background border border-foreground/10 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground/50 font-bold shrink-0">Livello 3</span>
                    <div>
                      <strong className="text-foreground font-sans">Testo di Riserva nel Codice:</strong>
                      <p className="text-foreground/60 font-sans text-[12px] mt-0.5">
                        Una frase predefinita scritta nel codice sorgente (es. <em>&quot;Guida fotografica&quot;</em>).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2 mt-3">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-xs uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>Come Nascondere un Testo Senza Farlo Cadere nel Default?</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Se cancelli il testo lasciando le virgolette vuote (<code className="font-mono text-amber-300">&quot;&quot;</code>), 
                    il sito penserà che manca e mostrerà il testo del Livello 2 o 3!
                  </p>
                  <p className="text-xs leading-relaxed">
                    Per <strong className="text-amber-300">nascondere del tutto</strong> l&apos;elemento, imposta il valore su: 
                    <code className="mx-1 px-2 py-0.5 rounded bg-background font-mono font-bold text-amber-300">null</code> 
                    (tutto minuscolo, <em>senza virgolette</em>). Quando il sistema incontra <code className="font-mono text-amber-300">null</code>, 
                    la sezione sparisce completamente dallo schermo.
                  </p>
                </div>
              </div>

              {/* 4 Golden Rules for JSON editing */}
              <div className="space-y-3">
                <h4 className="font-bold text-base text-foreground">
                  Le 4 Regole d&apos;Oro per Modificare il JSON Senza Fare Errori
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <span>1. Scarica sempre un Backup</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      Prima di fare modifiche grosse nella scheda JSON, clicca su <strong>&quot;Scarica Backup&quot;</strong> in cima 
                      a questa guida o su <strong>&quot;Copia JSON&quot;</strong>. Se ti perdi, basterà incollare di nuovo il testo salvato.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <span>2. Attento alle Virgolette</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      Tutti i testi devono essere racchiusi tra doppie virgolette dritte: <code className="text-foreground font-mono">&quot;titolo&quot;: &quot;Amleto&quot;</code>. 
                      Mai usare virgolette curve o singoli apici. I numeri e i valori <code className="text-foreground font-mono">true</code>, <code className="text-foreground font-mono">false</code>, <code className="text-foreground font-mono">null</code> vanno senza virgolette.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <span>3. La Regola della Virgola</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      Ogni proprietà deve terminare con una virgola (<code className="text-foreground font-mono">,</code>) tranne 
                      <strong> l&apos;ultimo elemento</strong> prima di una parentesi di chiusura <code className="text-foreground font-mono">&#125;</code> o <code className="text-foreground font-mono">]</code>. 
                      Una virgola dimenticata o una virgola di troppo è l&apos;errore più comune!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <span>4. L&apos;Editor ti Protegge</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      L&apos;editor in &quot;Sorgente JSON&quot; include la verifica automatica in tempo reale. Se commetti un errore di sintassi, 
                      vedrai una linea rossa e il pulsante per applicare le modifiche resterà bloccato: il sito non potrà mai essere danneggiato.
                    </p>
                  </div>
                </div>
              </div>

              {onNavigateTab && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("json")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-foreground/10 hover:border-foreground/20 transition-all"
                  >
                    <Code size={15} className="text-primary" />
                    <span>Apri l&apos;Editor Sorgente JSON</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 4: PUBBLICAZIONE & DEPLOYMENT */}
      {(isMatch("deployment") || isMatch("pubblicazione") || isMatch("deploy") || isMatch("password") || isMatch("vercel") || isMatch("cache") || isMatch("github")) && (
        <div id="deployment" className="scroll-mt-36">
          <AdminSection
            title="4. Pubblicazione & Deployment Online"
            description="Cosa accade quando premi 'Pubblica', come funziona la password e come sconfiggere la cache."
            icon={Rocket}
          >
            <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
              {/* Password requirement */}
              <div className="p-5 rounded-2xl bg-background border border-foreground/10 space-y-3">
                <div className="flex items-center gap-2.5 text-foreground font-bold text-base">
                  <Lock size={18} className="text-primary" />
                  <span>La Password di Amministrazione (In alto a destra)</span>
                </div>
                <p>
                  In alto a destra sulla barra di navigazione trovi un pulsante con l&apos;icona di una chiave:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/70 text-xs sm:text-sm">
                  <li>
                    Se vedi scritto <span className="text-rose-400 font-bold">Inserisci Chiave</span> con un contorno rosso pulsante, 
                    significa che devi autenticarti: clicca sul pulsante, inserisci la password del teatro e clicca su Salva.
                  </li>
                  <li>
                    Quando la chiave diventa verde con la dicitura <span className="text-emerald-400 font-bold">Autenticato</span>, 
                    puoi pubblicare e caricare immagini.
                  </li>
                  <li>
                    <strong>Perché non viene ricordata per sempre?</strong> Per massima sicurezza: la password risiede 
                    solo nella memoria volatile della scheda. Se chiudi la finestra, nessuno potrà pubblicare dal tuo computer.
                  </li>
                </ul>
              </div>

              {/* The deployment process */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-4">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Rocket size={18} className="text-primary" />
                  Cosa Succede Passo per Passo Dopo il Clic su &quot;Pubblica&quot;
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-foreground">Invio e Verifica della Richiesta:</strong>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Il server verifica l&apos;impronta di sicurezza della tua password e controlla che il file di dati sia integro.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-foreground">Creazione del Commit su GitHub:</strong>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Viene creata una copia storica ufficiale su GitHub nel branch di destinazione (<code className="font-mono text-primary font-bold">{activeBranch}</code>), 
                        con tanto di codice identificativo SHA (es. <code className="font-mono text-foreground/80">#a1b2c3d</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-foreground">Compilazione Vercel in Cloud (45-90 secondi):</strong>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        I server Vercel avviano la costruzione delle pagine web. Nel pannello vedrai una barra azzurra con un&apos;animazione 
                        rotante che verifica in diretta quando la versione è pronta.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-foreground">Conferma Verde Online:</strong>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Un banner verde ti confermerà che il sito è aggiornato per tutti i visitatori.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* The Browser Cache Trick */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm uppercase tracking-wider">
                  <RefreshCw size={16} />
                  <span>Il &quot;Mistero&quot; della Cache del Browser (Perché non vedo le modifiche?)</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  Hai appena pubblicato, apri <code className="text-amber-300 font-bold">gliattomatti.ch</code> ma vedi ancora il vecchio spettacolo? 
                  <strong>Niente panico!</strong> I browser memorizzano le pagine per risparmiare traffico e caricarle in un istante. 
                  Ecco come forzare l&apos;aggiornamento immediato:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-background/60 border border-foreground/10 text-xs space-y-1">
                    <div className="font-bold text-foreground">Su Mac (Safari / Chrome)</div>
                    <p className="text-foreground/60 font-mono font-bold text-primary">Cmd + Shift + R</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/60 border border-foreground/10 text-xs space-y-1">
                    <div className="font-bold text-foreground">Su Windows / Linux</div>
                    <p className="text-foreground/60 font-mono font-bold text-primary">Ctrl + F5</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/60 border border-foreground/10 text-xs space-y-1">
                    <div className="font-bold text-foreground">Su iPhone o Android</div>
                    <p className="text-foreground/60">Apri una scheda anonima o ricarica tenendo premuto</p>
                  </div>
                </div>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 5: GESTIONE IMMAGINI & FOTO */}
      {(isMatch("immagini") || isMatch("foto") || isMatch("webp") || isMatch("upload") || isMatch("locandine") || isMatch("proporzioni")) && (
        <div id="immagini" className="scroll-mt-36">
          <AdminSection
            title="5. Gestione delle Immagini e Foto"
            description="Conversione automatica in WebP ad alte prestazioni, proporzioni consigliate e riutilizzo in galleria."
            icon={ImageIcon}
          >
            <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
              <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-3">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  La Conversione Automatica in WebP (Zero Pensieri!)
                </h4>
                <p>
                  Non hai bisogno di Photoshop o software di grafica per alleggerire le foto! 
                  Ogni volta che carichi un file immagine (JPEG, PNG, HEIC):
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/70 text-xs sm:text-sm">
                  <li>
                    Il server ridimensiona la foto (massimo 1920 pixel di larghezza) in modo ottimale per display Retina.
                  </li>
                  <li>
                    La converte istantaneamente nel formato <strong className="text-foreground">.webp</strong>, riducendo 
                    il peso fino al 90% senza perdita visibile di qualità.
                  </li>
                  <li>
                    La foto viene salvata nella cartella <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-primary">public/images/</code> ed è subito pronta all&apos;uso.
                  </li>
                </ul>
              </div>

              {/* Recommended Proportions */}
              <div className="space-y-3">
                <h4 className="font-bold text-base text-foreground">
                  Proporzioni Consigliate a Seconda dell&apos;Uso
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                      <Theater size={16} />
                      <span>Locandine Spettacoli</span>
                    </div>
                    <div className="h-24 rounded-xl bg-muted/40 border border-dashed border-foreground/20 flex flex-col items-center justify-center text-xs font-mono text-foreground/50">
                      <span>Verticale</span>
                      <span className="font-bold text-foreground">2:3 o 3:4</span>
                      <span className="text-[10px]">es. 1200 × 1600 px</span>
                    </div>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Ideale per le schede spettacolo e i poster di presentazione.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                      <ImageIcon size={16} />
                      <span>Foto di Scena / Copertine</span>
                    </div>
                    <div className="h-24 rounded-xl bg-muted/40 border border-dashed border-foreground/20 flex flex-col items-center justify-center text-xs font-mono text-foreground/50">
                      <span>Orizzontale</span>
                      <span className="font-bold text-foreground">16:9 panoramico</span>
                      <span className="text-[10px]">es. 1920 × 1080 px</span>
                    </div>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Ideale per i caroselli, la home page e la galleria dello spettacolo.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                      <Users size={16} />
                      <span>Ritratti Attori & Staff</span>
                    </div>
                    <div className="h-24 rounded-xl bg-muted/40 border border-dashed border-foreground/20 flex flex-col items-center justify-center text-xs font-mono text-foreground/50">
                      <span>Quadrato o Mezzo Busto</span>
                      <span className="font-bold text-foreground">1:1 o 4:5</span>
                      <span className="text-[10px]">es. 800 × 800 px</span>
                    </div>
                    <p className="text-[12px] text-foreground/60 leading-snug">
                      Ideale per le schede biografiche e il cast della compagnia.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gallery re-use tip */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-foreground/10 flex items-start gap-3">
                <Lightbulb size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Non Ricaricare la Stessa Foto Due Volte!
                  </h5>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Se una foto è già stata caricata sul sito (ad esempio nella scheda Spettacoli), puoi ritrovarla nella scheda 
                    <strong> &quot;Galleria Immagini&quot;</strong>, cliccare su <em>&quot;Copia percorso&quot;</em> e incollarlo 
                    nel campo di un altro elemento. Risparmierai spazio e manterrai il sito velocissimo.
                  </p>
                </div>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 6: CONFORMITÀ LEGALE SVIZZERA */}
      {(isMatch("legale") || isMatch("privacy") || isMatch("nlpd") || isMatch("cookie") || isMatch("eventfrog") || isMatch("tally") || isMatch("termini")) && (
        <div id="legale" className="scroll-mt-36">
          <AdminSection
            title="6. Conformità Legale Svizzera (nLPD / revFADP)"
            description="Cosa devi sapere su privacy, cookie, moduli di contatto e biglietterie esterne."
            icon={ShieldCheck}
          >
            <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
              <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-3">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  La Nuova Legge Federale sulla Protezione dei Dati
                </h4>
                <p>
                  Il sito web opera in Svizzera (dominio <code>.ch</code>) ed è conforme alla 
                  <strong> Nuova Legge Federale sulla Protezione dei Dati (nLPD / revFADP)</strong> entrata in vigore nel settembre 2023.
                </p>
                <p>
                  Ecco le tre regole pratiche da tenere a mente ogni volta che inserisci nuovi collegamenti o raccogli informazioni:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                    <Ticket size={16} />
                    <span>1. Biglietti Esterni (Eventfrog)</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Quando indirizzi gli spettatori verso Eventfrog o altre casse online, la transazione economica e il trattamento dei dati di pagamento 
                    sono gestiti da loro. La pagina <code className="text-primary font-mono font-bold">/Termini</code> del sito specifica già questo scarico di responsabilità.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                    <FileText size={16} />
                    <span>2. Moduli Iscrizione Corsi</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Se crei un modulo per iscriversi a un corso o richiedere informazioni, raccogli solo i dati strettamente necessari 
                    (nome, email, telefono). Non cedere mai questi elenchi a terzi ed elimina i dati a corso concluso.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                    <Sliders size={16} />
                    <span>3. Cookie e Banner di Consenso</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Nella scheda <strong>&quot;Marketing & Privacy&quot;</strong> puoi decidere se attivare Google Analytics o Meta Pixel. 
                    Se sono entrambi spenti, il sito è 100% senza cookie e non mostrerà alcun banner fastidioso ai visitatori!
                  </p>
                </div>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 7: DOMANDE FREQUENTI (FAQ) */}
      {(isMatch("faq") || isMatch("domande") || isMatch("errori") || isMatch("problemi") || isMatch("password") || isMatch("collaborazione")) && (
        <div id="faq" className="scroll-mt-36">
          <AdminSection
            title="7. Risoluzione Problemi & Domande Frequenti"
            description="Le risposte immediate ai dubbi più comuni di chi gestisce il sito per la prima volta."
            icon={HelpCircle}
          >
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                if (!isMatch(faq.q) && !isMatch(faq.a)) return null;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-foreground/10 bg-background/80 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-mono text-xs flex items-center justify-center shrink-0">
                          ?
                        </span>
                        <span>{faq.q}</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-foreground/50 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-foreground/50 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-foreground/70 border-t border-foreground/5 leading-relaxed bg-muted/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AdminSection>
        </div>
      )}

      {/* SEZIONE 8: GLOSSARIO DEI TERMINI */}
      {(isMatch("glossario") || isMatch("termini") || isMatch("dizionario") || isMatch("parole")) && (
        <div id="glossario" className="scroll-mt-36">
          <AdminSection
            title="8. Glossario dei Termini per Non-Tecnici"
            description="Un vocabolario tascabile per capire al volo le parole informatiche usate nel pannello."
            icon={BookOpen}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {glossaryTerms.map((g, idx) => {
                if (!isMatch(g.term) && !isMatch(g.def)) return null;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-1.5 hover:border-foreground/20 transition-colors"
                  >
                    <div className="font-bold text-xs uppercase tracking-wider text-primary font-mono">
                      {g.term}
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed font-medium">
                      {g.def}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminSection>
        </div>
      )}

      {/* Footer Support Card */}
      <div className="p-6 rounded-3xl bg-muted/30 border border-foreground/10 text-center space-y-3">
        <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
          Hai ancora dubbi o serve assistenza tecnica?
        </h4>
        <p className="text-xs text-foreground/60 max-w-xl mx-auto leading-relaxed">
          Questa console è stata creata per rendere la compagnia teatrale completamente autonoma. 
          In caso di anomalie di sistema non risolvibili dalla guida, contatta il referente tecnico 
          o verifica lo stato dei repository su GitHub.
        </p>
        <div className="text-[11px] font-mono font-bold text-primary">
          Gli Attomatti Dashboard © {new Date().getFullYear()} — Progettato per essere semplice e indistruttibile.
        </div>
      </div>
    </div>
  );
}
