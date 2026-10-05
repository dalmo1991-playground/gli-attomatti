"use client";

import React, { useState } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  Search,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function TicketingTab() {
  const { content, updateContent } = useAdmin();
  const pages: any[] = content?.ticketing_pages || [];
  const [search, setSearch] = useState("");

  const addPage = () => {
    const newId = `cassa-${Date.now()}`;
    const newPage = {
      id: newId,
      title: "Nuova Cassa",
      slug: `cassa-${Date.now()}`,
      category: "Spettacolo Teatrale",
      description: "",
      eventfrog_url: "",
      back_link_label: "Torna indietro",
      back_link_href: "/",
      active: true,
    };
    updateContent("ticketing_pages", [...pages, newPage]);
  };

  const removePage = (idx: number) => {
    updateContent(
      "ticketing_pages",
      pages.filter((_, i) => i !== idx)
    );
  };

  const movePage = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const next = [...pages];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("ticketing_pages", next);
  };

  const updatePage = (idx: number, field: string, value: any) => {
    const next = [...pages];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("ticketing_pages", next);
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
        title="Biglietti & Casse Integrate"
        description="Gestisci le pagine interne di cassa (/Biglietti/[slug]) per incorporare Eventfrog quando desideri, senza alcun vincolo con gli spettacoli."
        icon={Ticket}
      >
        <div className="space-y-6">
          {/* Explanation Box */}
          <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/80 space-y-3 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Info size={16} className="text-primary shrink-0" />
              <span>Massima flessibilità: incorporamento opzionale e disaccoppiato</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-foreground/70">
              <li>
                <strong>Crea una cassa solo se e quando vuoi:</strong> Se vuoi che l&apos;utente compri direttamente sul sito, crea una pagina qui sotto (es. <code>/Biglietti/4-gatti</code> o <code>/Biglietti/corso-base</code>) e incolla l&apos;URL di Eventfrog.
              </li>
              <li>
                <strong>Libero di linkare direttamente fuori:</strong> Negli spettacoli, nelle iniziative o altrove, puoi incollare direttamente l&apos;URL di Eventfrog (o di qualsiasi altro circuito/festival). Il sito non forzerà alcun redirect e aprirà direttamente il tuo link esterno.
              </li>
              <li>
                <strong>Vendi qualsiasi cosa:</strong> Queste pagine non sono legate solo agli spettacoli. Puoi creare una cassa per un laboratorio, un workshop, biglietti per feste o tesseramenti.
              </li>
            </ul>
          </div>

          {/* Hub Configuration Card */}
          <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/5">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Ticket size={16} className="text-primary" />
                  <span>Pagina Hub Pubblica (/Biglietti)</span>
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Visualizza l&apos;elenco di tutte le prevendite e casse attive su un&apos;unica pagina pubblica. Gli slug disattivati o inesistenti rimandano automaticamente qui.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                  {content.ticketing_hub?.active !== false ? "Attiva" : "Disattivata"}
                </span>
                <FormField
                  label=""
                  type="switch"
                  value={content.ticketing_hub?.active !== false}
                  onChange={(val) => updateContent("ticketing_hub.active", val)}
                  className="w-auto"
                />
              </div>
            </div>

            {content.ticketing_hub?.active !== false && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <FormField
                  label="Titolo Pagina Hub"
                  value={content.ticketing_hub?.title || ""}
                  placeholder="Biglietteria & Prevendite"
                  onChange={(val) => updateContent("ticketing_hub.title", val)}
                  helpText="Titolo visibile nell'intestazione di /Biglietti"
                />
                <FormField
                  label="Descrizione Introduttiva"
                  value={content.ticketing_hub?.description || ""}
                  placeholder="Acquista i biglietti ufficiali per le produzioni teatrali..."
                  onChange={(val) => updateContent("ticketing_hub.description", val)}
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
                placeholder="Cerca cassa o slug..."
                className="w-full pl-9 pr-3 py-2 bg-foreground/5 border border-foreground/10 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <button
              type="button"
              onClick={addPage}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 shrink-0"
            >
              <Plus size={14} /> Nuova Cassa / Biglietti
            </button>
          </div>

          {/* Pages List */}
          {pages.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-foreground/5 border border-foreground/5 text-foreground/40 text-xs">
              Nessuna pagina cassa configurata. Clicca su &quot;Nuova Cassa&quot; se desideri crearne una.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPages.map(({ page, idx }) => (
                <AccordionCard
                  key={page.id || idx}
                  title={page.title || "Senza Titolo"}
                  subtitle={`/Biglietti/${page.slug || ""} • ${page.category || "Cassa"}`}
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
                          className="w-5 h-5 rounded accent-primary cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-sm text-foreground block">
                            Cassa Online Attiva
                          </span>
                          <span className="text-xs text-foreground/50">
                            {page.active
                              ? "Raggiungibile pubblicamente all'indirizzo /Biglietti/" + (page.slug || "slug")
                              : "Disattivata (restituisce 404)"}
                          </span>
                        </div>
                      </label>

                      {page.active && page.slug && (
                        <a
                          href={`/Biglietti/${page.slug}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 shrink-0 self-start sm:self-auto"
                        >
                          <Ticket size={13} />
                          <span>Apri Cassa /Biglietti/{page.slug}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    {/* Basic Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Titolo (es. nome spettacolo, corso o evento)"
                        value={page.title || ""}
                        onChange={(v) => updatePage(idx, "title", v)}
                        required
                        placeholder="es. 4 Gatti oppure Laboratorio Teatrale"
                      />
                      <FormField
                        label="Categoria / Tipo (mostrata nel badge)"
                        value={page.category || ""}
                        onChange={(v) => updatePage(idx, "category", v)}
                        placeholder="es. Spettacolo Teatrale, Corso, Evento..."
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <FormField
                        label="Slug URL (/Biglietti/[slug])"
                        value={page.slug || ""}
                        onChange={(v) =>
                          updatePage(idx, "slug", v.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))
                        }
                        helpText="Indirizzo web pubblico della cassa. Es: 4-gatti diventa /Biglietti/4-gatti"
                        required
                      />
                    </div>

                    {/* Eventfrog URL */}
                    <div className="space-y-2">
                      <FormField
                        label="URL Evento o Prevendita Eventfrog"
                        value={page.eventfrog_url || ""}
                        onChange={(v) => updatePage(idx, "eventfrog_url", v)}
                        placeholder="https://eventfrog.ch/it/p/teatro-arte-cultura/teatro/..."
                        helpText="Incolla l'URL pubblico di Eventfrog dell'evento. Verrà incorporato nell'iframe della pagina."
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
                      placeholder="es. Acquisto biglietti ufficiali online per la replica di domenica."
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
                          placeholder="es. Torna allo Spettacolo"
                        />
                        <FormField
                          label="Destinazione (URL relativo o assoluto)"
                          value={page.back_link_href || ""}
                          onChange={(v) => updatePage(idx, "back_link_href", v)}
                          placeholder="es. /Spettacoli/4-gatti oppure /"
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
