import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/data";
import { ArrowLeft, ShieldCheck, Server, EyeOff, ExternalLink, Scale, BarChart3, Target, Ticket, Cookie, Sliders, ClipboardList } from "lucide-react";
import PrivacyConsentButton from "./PrivacyConsentButton";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy — Gli Attomatti",
  description: "Informativa sul trattamento dei dati personali (Datenschutzerklärung) ai sensi della nLPD svizzera.",
  alternates: {
    canonical: "/Privacy",
  },
};

export default async function PrivacyPage() {
  const content = await getContent();
  const integrations = content?.integrations || {};

  const isGaActive = Boolean(integrations?.google_analytics?.enabled && integrations?.google_analytics?.measurement_id);
  const isMetaActive = Boolean(integrations?.meta_pixel?.enabled && integrations?.meta_pixel?.pixel_id);
  const isEventfrogActive = Boolean(
    integrations?.eventfrog?.enabled ||
    (content?.ticketing_pages && content.ticketing_pages.length > 0) ||
    content?.shows?.some((s: any) => Boolean(s.eventfrog_url || s.eventfrog_id)) ||
    (content?.landing_pages && content.landing_pages.some((lp: any) => lp.blocks?.some((b: any) => b.type === "biglietti" || b.eventfrog_url)))
  );
  const isTallyActive = Boolean(
    integrations?.tally?.enabled ||
    (content?.registration_pages && content.registration_pages.length > 0) ||
    (content?.landing_pages && content.landing_pages.some((lp: any) => lp.blocks?.some((b: any) => b.type === "registrazione" || b.tally_url)))
  );
  const isAnyTrackerActive = isGaActive || isMetaActive;

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
            Trattamento dei dati personali conforme alla nuova Legge federale svizzera sulla protezione dei dati (nLPD) e al principio di trasparenza (Opt-in).
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
              Trattiamo i dati personali solo ed esclusivamente nella misura necessaria per fornire un sito web funzionante e per offrire i nostri servizi teatrali, prevendite, registrazioni a eventi e comunicazioni informative.
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

          {/* Cookie, Local Storage e Servizi Incorporati (Dinamico) */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Cookie size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Cookie, sessioni e servizi incorporati (Opt-in)
              </h2>
            </div>

            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              <p>
                Questo sito adotta una <strong>politica rigorosa di consenso preventivo (Opt-in)</strong>: nessun cookie o tracker analitico o di marketing viene attivato prima che tu abbia espresso il tuo consenso esplicito tramite il banner delle preferenze.
              </p>
              <p>
                Per garantire il corretto funzionamento dell&apos;interfaccia, della biglietteria e dei moduli di registrazione, vengono impiegati elementi tecnici strettamente necessari (cookie propri o sessioni di terze parti integrate tramite iframe). Tali elementi tecnici non profilano l&apos;utente e non richiedono consenso preventivo ai sensi della nLPD e del GDPR, ma sono elencati di seguito per assoluta trasparenza:
              </p>

              {/* Tabella Cookie Attivi */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-foreground mb-3">Tabella dei cookie e componenti attivi:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-foreground/10 text-foreground/50 uppercase tracking-wider">
                        <th className="py-2.5 pr-4">Nome / Origine</th>
                        <th className="py-2.5 pr-4">Fornitore</th>
                        <th className="py-2.5 pr-4">Durata</th>
                        <th className="py-2.5">Finalità</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      <tr>
                        <td className="py-2.5 pr-4 font-mono font-bold text-foreground">attomatti_cookie_consent</td>
                        <td className="py-2.5 pr-4">Sito proprio (Locale)</td>
                        <td className="py-2.5 pr-4">1 anno</td>
                        <td className="py-2.5 text-foreground/70">Tecnico essenziale: memorizza le scelte di consenso privacy espresse nel banner.</td>
                      </tr>
                      {isEventfrogActive && (
                        <tr>
                          <td className="py-2.5 pr-4 font-mono font-bold text-foreground">eventfrog.ch (iframe)</td>
                          <td className="py-2.5 pr-4">Eventfrog AG (Svizzera)</td>
                          <td className="py-2.5 pr-4">Sessione di acquisto</td>
                          <td className="py-2.5 text-foreground/70">Tecnico essenziale: gestione del carrello, sicurezza della transazione e avanzamento del checkout nei widget di cassa incorporati.</td>
                        </tr>
                      )}
                      {isTallyActive && (
                        <tr>
                          <td className="py-2.5 pr-4 font-mono font-bold text-foreground">tally.so (iframe)</td>
                          <td className="py-2.5 pr-4">Tally BV (Belgio / UE)</td>
                          <td className="py-2.5 pr-4">Sessione modulo</td>
                          <td className="py-2.5 text-foreground/70">Tecnico essenziale: token di sicurezza anti-CSRF e conservazione temporanea dello stato di compilazione del form. Nessuna profilazione pubblicitaria sui rispondenti.</td>
                        </tr>
                      )}
                      {isGaActive && (
                        <tr>
                          <td className="py-2.5 pr-4 font-mono font-bold text-foreground">_ga, _ga_*</td>
                          <td className="py-2.5 pr-4">Google LLC (USA)</td>
                          <td className="py-2.5 pr-4">2 anni</td>
                          <td className="py-2.5 text-foreground/70">Analitico (previo consenso): statistiche aggregate e anonimizzate sulle visite.</td>
                        </tr>
                      )}
                      {isMetaActive && (
                        <tr>
                          <td className="py-2.5 pr-4 font-mono font-bold text-foreground">_fbp</td>
                          <td className="py-2.5 pr-4">Meta Platforms Ireland Ltd.</td>
                          <td className="py-2.5 pr-4">90 giorni</td>
                          <td className="py-2.5 text-foreground/70">Marketing (previo consenso): misurazione dell&apos;efficacia delle campagne Instagram/Facebook.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {isAnyTrackerActive && (
                <div className="pt-3">
                  <PrivacyConsentButton />
                </div>
              )}
            </div>
          </div>

          {/* Google Analytics 4 (Parametrico) */}
          {isGaActive && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BarChart3 size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Google Analytics 4 (Google LLC)
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                <p>
                  Sul sito è integrato lo strumento di analisi web Google Analytics 4, gestito da Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA).
                </p>
                <p>
                  In conformità alla <strong>Google Consent Mode v2</strong>, Google Analytics è configurato per rimanere completamente bloccato finché non viene prestato il consenso analitico. L&apos;indirizzo IP del visitatore viene anonimizzato prima della registrazione.
                </p>
                <p>
                  I dati raccolti possono essere elaborati su server situati negli Stati Uniti sulla base del <em>Swiss-US Data Privacy Framework</em>. Puoi revocare il consenso in qualsiasi momento tramite il nostro gestore delle preferenze.
                </p>
              </div>
            </div>
          )}

          {/* Meta Pixel (Parametrico) */}
          {isMetaActive && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Meta Pixel (Meta Platforms Ireland Limited)
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                <p>
                  Utilizziamo il Meta Pixel per monitorare l&apos;efficacia delle inserzioni pubblicitarie su Instagram e Facebook e per promuovere la vendita dei biglietti per i nostri spettacoli. Il servizio è fornito da Meta Platforms Ireland Limited (Merrion Road, Dublin 4, D04 X2K5, Irlanda).
                </p>
                <p>
                  Il Pixel entra in funzione <strong>esclusivamente dopo il tuo esplicito opt-in</strong> per la categoria marketing. Il pixel consente a Meta di identificare i visitatori del nostro sito come gruppo target per la visualizzazione di annunci. Maggiori informazioni nella privacy policy di Meta:{" "}
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
          )}

          {/* Biglietteria Eventfrog (Parametrico o Incorporato) */}
          {isEventfrogActive && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Ticket size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Biglietteria Online e Casse Incorporate (Eventfrog AG)
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                <p>
                  Per la vendita, prevendita ed emissione dei biglietti teatrali ci avvaliamo della piattaforma svizzera specializzata <strong>Eventfrog AG</strong> (Neuhardstrasse 38, 4600 Olten, Svizzera).
                </p>
                <p>
                  I servizi di cassa possono essere raggiunti tramite link esterni o <strong>incorporati direttamente (embedded) tramite iframe</strong> all&apos;interno delle pagine del nostro sito (in particolare nelle sezioni <code>/Biglietti/[slug]</code> e nelle schede dedicate agli spettacoli).
                </p>
                <p>
                  Quando acquisti un biglietto (tramite la cassa incorporata o sul sito Eventfrog), la transazione avviene tramite connessione cifrata diretta con i server di Eventfrog AG. I dati anagrafici, di recapito e di pagamento necessari al perfezionamento dell&apos;ordine vengono trattati direttamente da Eventfrog AG in qualità di titolare indipendente e fornitore del servizio, in piena conformità alla Nuova Legge Federale Svizzera sulla Protezione dei Dati (nLPD).
                </p>
                <p>
                  La compagnia Gli Attomatti riceve unicamente i dati necessari per la gestione degli ingressi in sala (nominativo, tipologia di biglietto, codice QR) e <strong>non ha accesso né archivia dati di carte di credito o coordinate bancarie</strong>. Per l&apos;informativa completa di Eventfrog AG consultare:{" "}
                  <Link
                    href="https://eventfrog.ch/it/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    eventfrog.ch/it/privacy.html <ExternalLink size={12} />
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Moduli di Iscrizione e Prenotazione Tally (Parametrico o Incorporato) */}
          {isTallyActive && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Moduli di Registrazione, Iscrizione e Contatto Incorporati (Tally.so)
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                <p>
                  Per la gestione delle registrazioni a eventi ad accesso controllato o gratuiti (workshop, audizioni, laboratori teatrali, serate per soci) e per richieste telematiche strutturate (ad esempio la verifica disponibilità e richiesta affitto sala su <code>/Saalvermietung</code>), utilizziamo la piattaforma di moduli interattivi fornita da <strong>Tally BV</strong> (Muinklaan 23, 9000 Gand, Belgio).
                </p>
                <p>
                  I moduli possono essere compilati tramite <strong>incorporamento diretto (iframe embed)</strong> all&apos;interno delle nostre pagine dedicate (<code>/Registrazioni/[slug]</code>, landing page promozionali o finestre modali) oppure tramite reindirizzamento al link ufficiale su Tally.
                </p>
                <p>
                  Quando compili un modulo, i dati personali liberamente conferiti (es. nome, cognome, indirizzo email, recapito telefonico, fascia oraria richiesta o preferenze) vengono acquisiti ed elaborati da Tally BV in qualità di responsabile del trattamento (Data Processor). I server e i database di Tally sono ospitati su infrastrutture cloud sicure (AWS / Google Cloud) situate all&apos;interno dell&apos;Unione Europea (Belgio e Germania), nel pieno rispetto del Regolamento Generale sulla Protezione dei Dati (GDPR) e della Nuova Legge Federale Svizzera sulla Protezione dei Dati (nLPD).
                </p>
                <p>
                  La compagnia teatrale Gli Attomatti utilizza le risposte raccolte unicamente per dare seguito alla specifica finalità per cui sono state fornite (es. invio istruzioni per l&apos;evento, organizzazione della lista presenze, preventivo per l&apos;affitto della sala). I dati non vengono ceduti a terzi né utilizzati per scopi promozionali non autorizzati. I moduli Tally integrati <strong>non utilizzano cookie o pixel pubblicitari di profilazione</strong> sui rispondenti.
                </p>
                <p>
                  Per maggiori informazioni sull&apos;infrastruttura di sicurezza e la gestione privacy di Tally BV consultare:{" "}
                  <Link
                    href="https://tally.so/help/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline inline-flex items-center gap-0.5"
                  >
                    tally.so/help/privacy-policy <ExternalLink size={12} />
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Risorse e Font */}
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ExternalLink size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Risorse tipografiche e social
              </h2>
            </div>

            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-foreground">Font tipografici (Google Fonts)</h3>
                <p>
                  Per garantire una resa grafica uniforme, questo sito utilizza font forniti da Google. Il caricamento tecnico di tali risorse può comportare la trasmissione dell'indirizzo IP del visitatore ai server di Google LLC.
                </p>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-foreground/5">
                <h3 className="text-sm font-bold text-foreground">Contenuti social Instagram (Soluzione 2-Click)</h3>
                <p>
                  I post incorporati di Instagram nella home page sono protetti da un meccanismo a due clic (2-Click): all'apertura del sito nessun dato viene trasmesso a Meta. Solo cliccando attivamente su &quot;Carica questo post&quot; viene stabilita una connessione diretta con i server di Instagram.
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
              Ai sensi della nuova Legge federale sulla protezione dei dati (nLPD), hai il diritto di richiedere in qualsiasi momento informazioni riguardo ai dati personali che trattiamo sul tuo conto, nonché la correzione, il blocco o la cancellazione di tali dati contattandoci all'indirizzo email: <a href="mailto:compagniateatralegliattomatti@gmail.com" className="text-primary hover:underline">compagniateatralegliattomatti@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
