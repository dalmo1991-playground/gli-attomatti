"use client";

import React, { useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Search,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function RegistrationsTab() {
  const { content, updateContent } = useAdmin();
  const pages: any[] = content?.registration_pages || [];
  const [search, setSearch] = useState("");

  const addPage = () => {
    const newId = `reg-${Date.now()}`;
    const newPage = {
      id: newId,
      title: "Nuova Registrazione",
      slug: `modulo-${Date.now()}`,
      category: "Corso Teatrale",
      description: "",
      tally_url: "",
      back_link_label: "Torna indietro",
      back_link_href: "/",
      active: true,
    };
    updateContent("registration_pages", [...pages, newPage]);
  };

  const removePage = (idx: number) => {
    updateContent(
      "registration_pages",
      pages.filter((_, i) => i !== idx)
    );
  };

  const movePage = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const next = [...pages];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("registration_pages", next);
  };

  const updatePage = (idx: number, field: string, value: any) => {
    const next = [...pages];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("registration_pages", next);
  };

  const filteredPages = pages
    .map((page, idx) => ({ page, idx }))
    .filter(({ page }) => {
      const q = search.toLowerCase();
      return (
        page.title?.toLowerCase().includes(q) ||
        page.slug?.toLowerCase().includes(q) ||
        page.category?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminSection
        title="Registrazioni & Moduli Tally"
        description="Gestisci le pagine interne di iscrizione (/Registrazioni/[slug]) per incorporare moduli Tally.so dedicati a corsi, laboratori, richieste o eventi gratuiti."
        icon={ClipboardList}
      >
        <div className="space-y-6">
          {/* Explanation Box */}
          <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/80 space-y-3 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Info size={16} className="text-accent shrink-0" />
              <span>Moduli Tally personalizzati con URL integrato nel sito</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-foreground/70">
              <li>
                <strong>Come funziona:</strong> Crea un form su <a href="https://tally.so" target="_blank" rel="noopener noreferrer" className="underline text-accent">Tally.so</a>, copia il link pubblico (es. <code>https://tally.so/r/LZaPOz</code>) e incollalo qui sotto con lo slug che preferisci (es. <code>/Registrazioni/workshop-improvvisazione</code>).
              </li>
              <li>
                <strong>Nessun codice backend richiesto:</strong> Tally gestisce notifiche email, limiti di risposte automatici e foglio Google Sheets/Notion a costo zero, proteggendo la privacy (server UE, nLPD & GDPR).
              </li>
              <li>
                <strong>Libero di linkare ovunque:</strong> Puoi usare l&apos;URL interno <code>/Registrazioni/[slug]</code> come pulsante nei corsi, nelle iniziative, sui social o su volantini fisici.
              </li>
            </ul>
          </div>

          {/* Hub Configuration Card */}
          <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/5">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardList size={16} className="text-accent" />
                  <span>Pagina Hub Pubblica (/Registrazioni)</span>
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Visualizza l&apos;elenco di tutte le iscrizioni a corsi e laboratori su un&apos;unica pagina pubblica. Gli slug disattivati o inesistenti rimandano automaticamente qui.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                  {content.registration_hub?.active !== false ? "Attiva" : "Disattivata"}
                </span>
                <FormField
                  label=""
                  type="switch"
                  value={content.registration_hub?.active !== false}
                  onChange={(val) => updateContent("registration_hub.active", val)}
                  className="w-auto"
                />
              </div>
            </div>

            {content.registration_hub?.active !== false && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <FormField
                  label="Titolo Pagina Hub"
                  value={content.registration_hub?.title || ""}
                  placeholder="Iscrizioni & Corsi"
                  onChange={(val) => updateContent("registration_hub.title", val)}
                  helpText="Titolo visibile nell'intestazione di /Registrazioni"
                />
                <FormField
                  label="Descrizione Introduttiva"
                  value={content.registration_hub?.description || ""}
                  placeholder="Iscriviti ai laboratori teatrali, workshop..."
                  onChange={(val) => updateContent("registration_hub.description", val)}
                  helpText="Breve testo illustrativo mostrato sotto al titolo"
                />
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca registrazione o slug..."
                className="w-full pl-9 pr-3 py-2 bg-foreground/5 border border-foreground/10 rounded-xl text-xs text-foreground focus:outline-hidden focus:border-accent/50"
              />
            </div>

            <button
              type="button"
              onClick={addPage}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-accent/20 shrink-0"
            >
              <Plus size={14} /> Nuova Registrazione
            </button>
          </div>

          {/* Pages List */}
          {pages.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-foreground/5 border border-foreground/5 text-foreground/40 text-xs">
              Nessuna pagina di registrazione configurata. Clicca su &quot;Nuova Registrazione&quot; per crearne una.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPages.map(({ page, idx }) => (
                <AccordionCard
                  key={page.id || idx}
                  title={page.title || "Senza Titolo"}
                  subtitle={`/Registrazioni/${page.slug || ""} • ${page.category || "Iscrizione"}`}
                  badge={page.active ? "Attiva" : "Disattivata (404)"}
                  badgeColor={page.active ? "emerald" : "zinc"}
                  index={idx}
                  total={pages.length}
                  onMoveUp={() => movePage(idx, -1)}
                  onMoveDown={() => movePage(idx, 1)}
                  onDelete={() => removePage(idx)}
                >
                  <div className="space-y-6 pt-2">
                    {/* Active Toggle & Preview */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background/50 border border-foreground/5">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(page.active)}
                          onChange={(e) => updatePage(idx, "active", e.target.checked)}
                          className="w-5 h-5 rounded accent-accent cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-sm text-foreground block">
                            Modulo Online Attivo
                          </span>
                          <span className="text-xs text-foreground/50">
                            {page.active
                              ? "Raggiungibile pubblicamente all'indirizzo /Registrazioni/" + (page.slug || "slug")
                              : "Disattivato (restituisce 404)"}
                          </span>
                        </div>
                      </label>

                      {page.active && page.slug && (
                        <a
                          href={`/Registrazioni/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs shadow-md shadow-accent/20 shrink-0 self-start sm:self-auto hover:opacity-90 transition-opacity"
                        >
                          <ClipboardList size={13} />
                          <span>Apri /Registrazioni/{page.slug}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    {/* Basic Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Titolo (es. nome evento, corso o richiesta)"
                        value={page.title || ""}
                        onChange={(v) => updatePage(idx, "title", v)}
                        required
                        placeholder="es. Workshop di Recitazione oppure Affitto Sala"
                      />
                      <FormField
                        label="Categoria / Tipo (mostrata nel badge)"
                        value={page.category || ""}
                        onChange={(v) => updatePage(idx, "category", v)}
                        placeholder="es. Laboratorio, Corso, Richiesta..."
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <FormField
                        label="Slug URL (/Registrazioni/[slug])"
                        value={page.slug || ""}
                        onChange={(v) =>
                          updatePage(idx, "slug", v.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))
                        }
                        helpText="Indirizzo web pubblico del modulo. Es: corso-base diventa /Registrazioni/corso-base"
                        required
                      />
                    </div>

                    {/* Tally URL */}
                    <div className="space-y-2">
                      <FormField
                        label="URL Modulo Tally.so"
                        value={page.tally_url || ""}
                        onChange={(v) => updatePage(idx, "tally_url", v.trim())}
                        placeholder="https://tally.so/r/LZaPOz"
                        helpText="Incolla l'URL pubblico o di condivisione del form Tally. Verrà incorporato fluidamente nella pagina."
                        required
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      label="Breve Testo Introduttivo (Opzionale)"
                      value={page.description || ""}
                      onChange={(v) => updatePage(idx, "description", v)}
                      type="textarea"
                      rows={2}
                      placeholder="es. Compila i campi sottostanti per confermare la tua partecipazione al laboratorio."
                    />

                    {/* Back Link Configuration */}
                    <div className="p-4 bg-muted/10 rounded-2xl border border-foreground/5 space-y-3">
                      <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider block">
                        Pulsante di Ritorno (in cima alla pagina)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          label="Testo del Link"
                          value={page.back_link_label || ""}
                          onChange={(v) => updatePage(idx, "back_link_label", v)}
                          placeholder="es. Torna alle Iniziative"
                        />
                        <FormField
                          label="Destinazione (URL relativo o assoluto)"
                          value={page.back_link_href || ""}
                          onChange={(v) => updatePage(idx, "back_link_href", v)}
                          placeholder="es. /Iniziative oppure /"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionCard>
              ))}
            </div>
          )}
        </div>
      </AdminSection>
    </div>
  );
}
