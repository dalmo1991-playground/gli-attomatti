import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Server, EyeOff, ExternalLink, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy — Gli Attomatti",
  description: "Informativa sul trattamento dei dati personali (Datenschutzerklärung) ai sensi della nLPD svizzera.",
};

export default function PrivacyPage() {
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
            Datenschutzerklärung
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
            Informativa sulla Privacy
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl font-medium">
            Trattamento dei dati personali conforme alla nuova Legge federale svizzera sulla protezione dei dati (nLPD).
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Titolare del trattamento */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Titolare del trattamento
              </h2>
            </div>
            <div className="space-y-2 text-foreground/80 font-medium">
              <p className="font-bold text-foreground text-lg">Gli Attomatti</p>
              <p>Alte Landstrasse 4, 8802 Kilchberg, Svizzera</p>
              <p>Contatto email: compagniateatralegliattomatti@gmail.com</p>
            </div>
          </div>

          {/* Trattamento generale dei dati */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              Trattamento generale dei dati
            </h2>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Trattiamo i dati personali solo ed esclusivamente nella misura necessaria per fornire un sito web funzionante.
            </p>
          </div>

          {/* File di log del server */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Server size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                File di log del server
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Il nostro fornitore di hosting, Vercel, raccoglie e memorizza automaticamente dati tecnici nei file di log del server che il tuo browser ci trasmette. Questi includono indirizzo IP, tipo e versione del browser, sistema operativo utilizzato, URL di riferimento e ora della richiesta al server. Questi dati sono necessari per il funzionamento sicuro del server e non vengono incrociati o uniti ad altre fonti di dati.
            </p>
          </div>

          {/* Cookie e tracciamento */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <EyeOff size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Cookie e tracciamento
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Questo sito web ha uno scopo puramente informativo. Non utilizziamo cookie, tracker di analisi o pixel pubblicitari.
            </p>
          </div>

          {/* Risorse di terze parti */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ExternalLink size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Risorse e contenuti di terze parti
              </h2>
            </div>

            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">Font tipografici (Google Fonts)</h3>
                <p>
                  Per garantire una resa grafica uniforme, questo sito utilizza font tipografici forniti da Google. Il caricamento di tali risorse tecniche può comportare la trasmissione dell'indirizzo IP del visitatore ai server di Google LLC.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-foreground/5">
                <h3 className="text-sm font-bold text-foreground">Contenuti incorporati di Instagram (Soluzione 2-Click)</h3>
                <p>
                  Nella home page sono integrati contenuti (post e reel) della piattaforma Instagram, gestita da Meta Platforms Ireland Limited (Merrion Road, Dublin 4, D04 X2K5, Irlanda).
                </p>
                <p>
                  Per proteggere la tua privacy, applichiamo una <strong>soluzione protettiva a due clic (2-Click)</strong>: all'apertura del sito, i contenuti esterni di Instagram sono bloccati per impostazione predefinita e nessun dato personale (né indirizzo IP né cookie) viene trasmesso a Meta.
                </p>
                <p>
                  Solo se decidi attivamente di visualizzare i post cliccando su &quot;Carica questo post&quot; o &quot;Mostra tutti i post&quot;, viene stabilita una connessione diretta con i server di Meta, consentendo il caricamento dell'incorporamento e la trasmissione del tuo indirizzo IP. Se hai effettuato l'accesso al tuo account Instagram nello stesso browser, Meta potrebbe associare la consultazione del post al tuo profilo.
                </p>
                <p>
                  Per ulteriori dettagli sul trattamento dei dati da parte di Meta, puoi consultare l'informativa sulla privacy di Instagram su{" "}
                  <Link
                    href="https://privacycenter.instagram.com/policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    privacycenter.instagram.com/policy <ExternalLink size={12} />
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* I tuoi diritti */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Scale size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                I tuoi diritti (nLPD)
              </h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">
              Ai sensi della nuova Legge federale sulla protezione dei dati (nLPD), hai il diritto di richiedere informazioni riguardo ai dati personali che trattiamo sul tuo conto. Hai inoltre il diritto di richiedere in qualsiasi momento la correzione, il blocco o la cancellazione di tali dati contattandoci all'indirizzo email fornito sopra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
