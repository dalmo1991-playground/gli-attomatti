"use client";

import React from "react";
import { 
  BarChart3, 
  Target, 
  Ticket, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Activity,
  Eye,
  ShoppingCart,
  Mail,
  HelpCircle,
  ExternalLink,
  ClipboardList,
  Send,
  Share2
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";

export function IntegrationsTab() {
  const { content, updateContent } = useAdmin();
  const integrations = content?.integrations || {
    google_analytics: { enabled: false, measurement_id: "" },
    meta_pixel: { enabled: false, pixel_id: "" },
    eventfrog: { enabled: false },
    cookie_consent: { version: 1 },
    events: {
      view_content: true,
      initiate_checkout: true,
      contact: true,
      lead: true,
      social_click: true,
    }
  };

  const ga = integrations.google_analytics || { enabled: false, measurement_id: "" };
  const meta = integrations.meta_pixel || { enabled: false, pixel_id: "" };
  const eventfrog = integrations.eventfrog || { enabled: false };
  const consent = integrations.cookie_consent || { version: 1 };
  const events = integrations.events || {
    view_content: true,
    initiate_checkout: true,
    contact: true,
    lead: true,
    social_click: true,
  };

  const isTrackerActive = Boolean((ga.enabled && ga.measurement_id?.trim()) || (meta.enabled && meta.pixel_id?.trim()));

  const handleIncrementVersion = () => {
    const nextVer = (Number(consent.version) || 1) + 1;
    updateContent("integrations.cookie_consent.version", nextVer);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Overview Status Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isTrackerActive
          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      }`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-foreground/5 shrink-0">
            {isTrackerActive ? <AlertCircle size={24} className="text-amber-400" /> : <CheckCircle2 size={24} className="text-emerald-400" />}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-base">
              {isTrackerActive
                ? "Cookie Banner: ATTIVO (Tracciamento Abilitato)"
                : "Cookie Banner: DISATTIVATO (Sito 100% Cookie-Free)"}
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed font-medium">
              {isTrackerActive
                ? "Avendo almeno uno strumento di tracciamento abilitato (GA4 o Meta), il banner di consenso Opt-in compare automaticamente a tutti i visitatori prima di rilasciare qualsiasi cookie."
                : "Nessun servizio di analisi o marketing esterno è attualmente attivo. Il sito non rilascia cookie di profilazione e non mostra alcun banner invasivo."}
            </p>
          </div>
        </div>
      </div>

      {/* Google Analytics 4 */}
      <AdminSection
        title="Google Analytics 4 (GA4)"
        description="Monitoraggio del traffico e delle visualizzazioni degli spettacoli conforme alla Google Consent Mode v2."
        icon={BarChart3}
      >
        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(ga.enabled)}
              onChange={(e) => updateContent("integrations.google_analytics.enabled", e.target.checked)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
            <span className="font-bold text-sm text-foreground">
              Abilita Google Analytics 4
            </span>
          </label>

          {ga.enabled && (
            <div className="space-y-4 pt-4 border-t border-foreground/5">
              <FormField
                label="Measurement ID (ID di Misurazione)"
                value={ga.measurement_id || ""}
                onChange={(v) => updateContent("integrations.google_analytics.measurement_id", v)}
                placeholder="es. G-XXXXXXXXXX"
                helpText="Trovi il Measurement ID nelle impostazioni del flusso di dati su Google Analytics."
              />
            </div>
          )}
        </div>
      </AdminSection>

      {/* Meta Pixel */}
      <AdminSection
        title="Meta Pixel (Campagne Instagram & Facebook)"
        description="Tracciamento delle conversioni per le inserzioni sponsorizzate e la vendita dei biglietti teatrali."
        icon={Target}
      >
        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(meta.enabled)}
              onChange={(e) => updateContent("integrations.meta_pixel.enabled", e.target.checked)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
            <span className="font-bold text-sm text-foreground">
              Abilita Meta Pixel
            </span>
          </label>

          {meta.enabled && (
            <div className="space-y-4 pt-4 border-t border-foreground/5">
              <FormField
                label="ID Pixel Meta"
                value={meta.pixel_id || ""}
                onChange={(v) => updateContent("integrations.meta_pixel.pixel_id", v)}
                placeholder="es. 123456789012345"
                helpText="ID numerico ricavabile da Gestione Eventi (Meta Business Suite)."
              />
            </div>
          )}
        </div>
      </AdminSection>

      {/* Tracked Milestones & Behaviors Registry */}
      <AdminSection
        title="Registro e Controllo Eventi Tracciati (Milestone)"
        description="Mappa completa di tutti i comportamenti monitorati nel sito web. Puoi attivare o disattivare ogni singolo evento parametricamente."
        icon={Activity}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/75 leading-relaxed">
            <p>
              Tutti gli eventi inviati rispettano la massima riservatezza: <strong>non contengono dati personali sensibili</strong> (PII) e vengono trasmessi solo se l'utente ha prestato il consenso per la rispettiva categoria. Se disattivi un evento qui sotto, il codice frontend salterà la relativa chiamata anche quando GA4 o Meta Pixel sono attivi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* 1. PageView */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-foreground/10 text-foreground">
                    <Activity size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Visualizzazione Pagine (PageView)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-foreground/10 text-foreground/70">
                    Sempre Attivo
                  </span>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Ogni cambio di pagina o caricamento iniziale dell'utente.<br />
                  <strong>Piattaforme:</strong> GA4 (<code>page_view</code>) · Meta (<code>PageView</code>)<br />
                  <strong>Parametri:</strong> Percorso URL (indirizzo IP anonimizzato).
                </p>
              </div>
              <div className="pl-8 md:pl-0 shrink-0">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  Attivo (Standard)
                </span>
              </div>
            </div>

            {/* 2. view_content */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Eye size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Dettaglio Spettacolo & Iniziativa (ViewContent)
                  </h4>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Apertura della pagina di dettaglio di uno spettacolo (<code>/Spettacoli/[slug]</code>) o corso/laboratorio (<code>/Iniziative/[slug]</code>).<br />
                  <strong>Piattaforme:</strong> GA4 (<code>view_item</code>) · Meta (<code>ViewContent</code>)<br />
                  <strong>Parametri:</strong> Titolo dell'evento (<code>item_name</code>), Categoria (<code>item_category</code>: "Spettacolo" o "Iniziativa").
                </p>
              </div>
              <div className="pl-8 md:pl-0 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={events.view_content !== false}
                    onChange={(e) => updateContent("integrations.events.view_content", e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {events.view_content !== false ? "Abilitato" : "Disattivato"}
                  </span>
                </label>
              </div>
            </div>

            {/* 3. initiate_checkout */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-secondary/10 text-secondary">
                    <ShoppingCart size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Intento Acquisto Biglietto (InitiateCheckout)
                  </h4>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Clic sul pulsante &quot;Biglietti&quot; in uno spettacolo o apertura della pagina di cassa dedicata (<code>/Biglietti/[slug]</code>).<br />
                  <strong>Piattaforme:</strong> GA4 (<code>begin_checkout</code>) · Meta (<code>InitiateCheckout</code>)<br />
                  <strong>Parametri:</strong> Titolo dello spettacolo, destinazione biglietto (cassa integrata o link esterno).
                </p>
              </div>
              <div className="pl-8 md:pl-0 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={events.initiate_checkout !== false}
                    onChange={(e) => updateContent("integrations.events.initiate_checkout", e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {events.initiate_checkout !== false ? "Abilitato" : "Disattivato"}
                  </span>
                </label>
              </div>
            </div>

            {/* 4. contact */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-accent/10 text-accent">
                    <Mail size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Interazione Contatti & Lead (Contact)
                  </h4>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Clic sui link email o sui pulsanti di contatto nel Footer e nella pagina <code>/Contatti</code>.<br />
                  <strong>Piattaforme:</strong> GA4 (<code>generate_lead</code>) · Meta (<code>Contact</code>)<br />
                  <strong>Parametri:</strong> Canale di contatto (<code>email</code>), destinazione.
                </p>
              </div>
              <div className="pl-8 md:pl-0 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={events.contact !== false}
                    onChange={(e) => updateContent("integrations.events.contact", e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {events.contact !== false ? "Abilitato" : "Disattivato"}
                  </span>
                </label>
              </div>
            </div>

            {/* 5. lead (Tally) */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Send size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Invio Moduli e Iscrizioni (Lead)
                  </h4>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Invio completato con successo di un modulo Tally incorporato (intercettazione evento ufficiale <code>Tally.FormSubmitted</code>) o apertura moduli esterni.<br />
                  <strong>Piattaforme:</strong> GA4 (<code>generate_lead</code>) · Meta (<code>Lead</code>)<br />
                  <strong>Parametri:</strong> Titolo del modulo (<code>form_name</code>), ID form, percorso pagina.
                </p>
              </div>
              <div className="pl-8 md:pl-0 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={events.lead !== false}
                    onChange={(e) => updateContent("integrations.events.lead", e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {events.lead !== false ? "Abilitato" : "Disattivato"}
                  </span>
                </label>
              </div>
            </div>

            {/* 6. social_click (Instagram / Facebook) */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <Share2 size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Click e Canali Social (SocialClick / Instagram)
                  </h4>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Click verso il profilo Instagram ufficiale, singoli post/reel nel feed, o pagina Facebook (da Home, Contatti e Footer).<br />
                  <strong>Piattaforme:</strong> GA4 (<code>social_interaction</code>) · Meta (<code>SocialClick</code> / <code>Contact</code>)<br />
                  <strong>Parametri:</strong> Piattaforma social (<code>Instagram</code>, <code>Facebook</code>), URL di destinazione.
                </p>
              </div>
              <div className="pl-8 md:pl-0 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={events.social_click !== false}
                    onChange={(e) => updateContent("integrations.events.social_click", e.target.checked)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {events.social_click !== false ? "Abilitato" : "Disattivato"}
                  </span>
                </label>
              </div>
            </div>

            {/* 7. purchase (Eventfrog) */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={16} />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    Acquisto Biglietto Confermato (Purchase)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Cockpit Eventfrog
                  </span>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed pl-8">
                  <strong>Trigger:</strong> Transazione completata con successo nella cassa sicura Eventfrog.<br />
                  <strong>Piattaforme:</strong> GA4 (<code>purchase</code>) · Meta (<code>Purchase</code>)<br />
                  <strong>Parametri:</strong> Valore d'acquisto (CHF), numero di biglietti, ID transazione.<br />
                  <strong>Configurazione:</strong> Per motivi di sicurezza bancaria (PCI-DSS), i pagamenti avvengono nel circuito protetto Eventfrog. Per ricevere la conversione <em>Purchase</em> in Meta e GA4, incolla semplicemente lo stesso ID GA4 e ID Pixel nel <strong>Cockpit di Eventfrog</strong> sotto <em>Integrazioni &gt; Web Analytics / Tracking Pixel</em>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminSection>

      {/* Eventfrog Ticketing */}
      <AdminSection
        title="Integrazione Eventfrog & Casse Online"
        description="Informazioni sull'incorporamento di Eventfrog e gestione casse dedicate."
        icon={Ticket}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Info size={14} className="text-primary" />
              <span>Pagine di Cassa Dedicate e Link Esterni:</span>
            </div>
            <p className="leading-relaxed">
              Puoi creare e gestire liberamente le tue pagine di cassa interne dal menu laterale <strong>Biglietti &amp; Casse</strong>. Ogni pagina creata (es. <code>/Biglietti/4-gatti</code> o <code>/Biglietti/corso-base</code>) incorpora il modulo d&apos;acquisto ufficiale di Eventfrog.
            </p>
            <p className="leading-relaxed text-foreground/60">
              Se invece preferisci indirizzare il pubblico direttamente al portale esterno di Eventfrog (o a un festival), sei libero di incollare l&apos;URL esterno direttamente nel campo link dello spettacolo o dell&apos;iniziativa.
            </p>
          </div>
        </div>
      </AdminSection>

      {/* Tally Forms */}
      <AdminSection
        title="Moduli Tally & Registrazioni"
        description="Informazioni sull'incorporamento di Tally.so e pagine di iscrizione dedicate."
        icon={ClipboardList}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Info size={14} className="text-accent" />
              <span>Pagine di Iscrizione Dedicate e Privacy UE:</span>
            </div>
            <p className="leading-relaxed">
              Puoi creare e gestire liberamente le tue pagine di registrazione interne dal menu laterale <strong>Registrazioni &amp; Moduli</strong>. Ogni pagina creata (es. <code>/Registrazioni/workshop</code> o <code>/Registrazioni/saalvermietung</code>) incorpora il form Tally.so in modo fluido e trasparente.
            </p>
            <p className="leading-relaxed text-foreground/60">
              Tally.so rispetta pienamente la nLPD svizzera e il GDPR (server situati nell&apos;Unione Europea). Non traccia cookie invasivi e consente notifiche email e gestione capienza posti automatica a costo zero.
            </p>
          </div>
        </div>
      </AdminSection>

      {/* Cookie Consent Versioning */}
      <AdminSection
        title="Gestione Versione Consenso Cookie"
        description="Controlla quando richiedere un nuovo Opt-in ai visitatori che hanno già salvato le preferenze."
        icon={ShieldCheck}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/40 block">
                Versione Politica Attuale
              </span>
              <span className="text-2xl font-black text-primary">
                v{consent.version || 1}
              </span>
            </div>

            <button
              type="button"
              onClick={handleIncrementVersion}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold text-xs uppercase tracking-wider transition-all"
            >
              <RefreshCw size={14} />
              <span>Richiedi nuovo consenso a tutti (v{(Number(consent.version) || 1) + 1})</span>
            </button>
          </div>

          <p className="text-xs text-foreground/50 leading-relaxed font-medium">
            <strong>Nota automatica:</strong> Se attivi un nuovo strumento di tracciamento (ad esempio se attivi Meta Pixel dopo che gli utenti avevano già acconsentito solo a GA4), il banner riapparirà automaticamente a quegli utenti al loro prossimo accesso, senza bisogno di incrementare manualmente la versione.
          </p>
        </div>
      </AdminSection>
    </div>
  );
}
