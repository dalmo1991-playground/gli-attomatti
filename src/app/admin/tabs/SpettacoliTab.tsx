"use client";

import React, { useState } from "react";
import { Plus, Theater, Search, Calendar, Tag, Trash2, ArrowUp, ArrowDown, Ticket, ExternalLink, Info, CheckCircle2 } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { GalleryField } from "../components/ui/GalleryField";
import { ImageUploadField } from "../components/ui/ImageUploadField";

export function SpettacoliTab() {
  const { content, updateContent } = useAdmin();
  const spet = content?.pages?.spettacoli || {
    title: "Spettacoli",
    description: "",
    archive_sections: []
  };

  const archive = spet.archive_sections || [];
  const [search, setSearch] = useState("");

  const addShow = () => {
    const currentYear = new Date().getFullYear().toString();
    updateContent("pages.spettacoli.archive_sections", [
      ...archive,
      {
        title: "Nuovo Spettacolo",
        slug: `spettacolo-${Date.now()}`,
        year: currentYear,
        short_description: "",
        text: "",
        hero_image: "",
        dates: [],
        details: [
          { label: "Regia", value: "" },
          { label: "Con", value: "" }
        ],
        images: []
      }
    ]);
  };

  const removeShow = (idx: number) => {
    updateContent(
      "pages.spettacoli.archive_sections",
      archive.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveShow = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= archive.length) return;
    const next = [...archive];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const updateShow = (idx: number, field: string, value: any) => {
    const next = [...archive];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("pages.spettacoli.archive_sections", next);
  };

  // Dates sub-list helpers
  const addShowDate = (sIdx: number) => {
    const next = [...archive];
    if (!next[sIdx].dates) next[sIdx].dates = [];
    next[sIdx].dates.push({
      date: "",
      location: "",
      location_href: "",
      ticket_label: "Prenota",
      ticket_href: ""
    });
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const removeShowDate = (sIdx: number, dIdx: number) => {
    const next = [...archive];
    next[sIdx].dates = next[sIdx].dates.filter((_: any, i: number) => i !== dIdx);
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const updateShowDate = (sIdx: number, dIdx: number, field: string, value: string) => {
    const next = [...archive];
    next[sIdx].dates[dIdx] = { ...next[sIdx].dates[dIdx], [field]: value };
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const moveShowDate = (sIdx: number, dIdx: number, dir: -1 | 1) => {
    const dates = [...(archive[sIdx]?.dates || [])];
    const targetIdx = dIdx + dir;
    if (targetIdx < 0 || targetIdx >= dates.length) return;
    [dates[dIdx], dates[targetIdx]] = [dates[targetIdx], dates[dIdx]];
    const next = [...archive];
    next[sIdx] = { ...next[sIdx], dates };
    updateContent("pages.spettacoli.archive_sections", next);
  };

  // Details sub-list helpers
  const addShowDetail = (sIdx: number) => {
    const next = [...archive];
    if (!next[sIdx].details) next[sIdx].details = [];
    next[sIdx].details.push({ label: "Dettaglio", value: "" });
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const removeShowDetail = (sIdx: number, detIdx: number) => {
    const next = [...archive];
    next[sIdx].details = next[sIdx].details.filter((_: any, i: number) => i !== detIdx);
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const updateShowDetail = (sIdx: number, detIdx: number, field: string, value: string) => {
    const next = [...archive];
    next[sIdx].details[detIdx] = { ...next[sIdx].details[detIdx], [field]: value };
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const moveShowDetail = (sIdx: number, detIdx: number, dir: -1 | 1) => {
    const details = [...(archive[sIdx]?.details || [])];
    const targetIdx = detIdx + dir;
    if (targetIdx < 0 || targetIdx >= details.length) return;
    [details[detIdx], details[targetIdx]] = [details[targetIdx], details[detIdx]];
    const next = [...archive];
    next[sIdx] = { ...next[sIdx], details };
    updateContent("pages.spettacoli.archive_sections", next);
  };

  const filteredArchive = archive.filter((s: any) =>
    (s.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.year || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Archivio Spettacoli"
        description="Gestisci il cartellone delle produzioni teatrali, le date delle repliche, i dettagli tecnici e la galleria fotografica."
        icon={Theater}
        action={
          <button
            type="button"
            onClick={addShow}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Spettacolo
          </button>
        }
      >
        <div className="space-y-4 pb-6 border-b border-foreground/5">
          <FormField
            label="Titolo Pagina Spettacoli"
            value={spet.title || ""}
            onChange={(v) => updateContent("pages.spettacoli.title", v)}
            placeholder="I Nostri Spettacoli"
          />
          <FormField
            label="Descrizione Pagina"
            value={spet.description || ""}
            onChange={(v) => updateContent("pages.spettacoli.description", v)}
            type="textarea"
            rows={2}
          />
        </div>

        {/* Filter bar */}
        <div className="flex justify-between items-center pt-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca per titolo o anno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/20 border border-foreground/10 rounded-xl text-xs text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none"
            />
          </div>
          <span className="text-xs text-foreground/40 font-bold">
            {filteredArchive.length} spettacoli
          </span>
        </div>

        {/* Shows Accordion List */}
        <div className="space-y-4">
          {filteredArchive.map((show: any) => {
            const actualIdx = archive.indexOf(show);
            const firstImg = show.images?.[0]?.url;

            return (
              <AccordionCard
                key={actualIdx}
                title={show.title || "Senza Titolo"}
                subtitle={`${show.year || "Anno n.d."} • /Spettacoli/${show.slug || ""}`}
                thumbnail={firstImg}
                badge={show.dates?.length ? `${show.dates.length} Date` : undefined}
                badgeColor="indigo"
                index={actualIdx}
                total={archive.length}
                onMoveUp={() => moveShow(actualIdx, -1)}
                onMoveDown={() => moveShow(actualIdx, 1)}
                onDelete={() => removeShow(actualIdx)}
              >
                <div className="space-y-8 pt-2">
                  {/* Basic Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        label="Titolo Spettacolo"
                        value={show.title || ""}
                        onChange={(v) => updateShow(actualIdx, "title", v)}
                        required
                      />
                    </div>
                    <div>
                      <FormField
                        label="Anno Produzione"
                        value={show.year || ""}
                        onChange={(v) => updateShow(actualIdx, "year", v)}
                        placeholder="2026"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormField
                      label="Slug URL (identificativo univoco dello spettacolo)"
                      value={show.slug || ""}
                      onChange={(v) => updateShow(actualIdx, "slug", v.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                      helpText="Usato negli indirizzi web del sito (es. l-eredita-di-zio-felice)"
                    />
                    {show.slug && (
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/70">
                        <span className="font-bold text-foreground/40 uppercase tracking-wider text-[10px]">Percorso scheda:</span>
                        <a
                          href={`/Spettacoli/${show.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground font-semibold transition-colors"
                        >
                          <span>/Spettacoli/{show.slug}</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>

                  <FormField
                    label="Breve Descrizione (anteprima card nell'elenco)"
                    value={show.short_description || ""}
                    onChange={(v) => updateShow(actualIdx, "short_description", v)}
                    type="textarea"
                    rows={2}
                  />

                  <FormField
                    label="Testo Descrittivo Completo (sinossi e trama)"
                    value={show.text || ""}
                    onChange={(v) => updateShow(actualIdx, "text", v)}
                    type="richtext"
                    rows={5}
                  />

                  {/* Hero Image (Optional) */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <ImageUploadField
                      label="Immagine Hero / Copertina di Testata (Opzionale)"
                      value={show.hero_image || ""}
                      onChange={(url) => updateShow(actualIdx, "hero_image", url)}
                      helpText="Se inserita, viene visualizzata a tutto schermo come sfondo della testata con un elegante filtro scuro e gradiente per garantire la leggibilità del titolo."
                    />
                  </div>

                  {/* Photo Gallery */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <GalleryField
                      label="Galleria Fotografica Spettacolo"
                      description="La prima immagine fungerà da copertina principale dello spettacolo."
                      images={show.images || []}
                      onChange={(newImgs) => updateShow(actualIdx, "images", newImgs)}
                    />
                  </div>

                  {/* Dates & Tickets */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                          <Calendar size={14} className="text-secondary" /> Date, Repliche & Biglietti
                        </h4>
                        <p className="text-[11px] text-foreground/50 mt-0.5">
                          Definisci le singole repliche e lo stato dei biglietti (in vendita, a breve o esauriti).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addShowDate(actualIdx)}
                        className="px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus size={13} /> Aggiungi Replica
                      </button>
                    </div>

                    {/* How tickets work helper box */}
                    <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/70 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Info size={14} className="text-primary shrink-0" />
                        <span>Gestione link e biglietti:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                        <li>
                          <strong>Link esterno (es. Eventfrog, festival, prevendita):</strong> Incolla l&apos;URL completo (es. <code>https://eventfrog.ch/...</code>). Il pulsante sul sito aprirà direttamente la pagina esterna.
                        </li>
                        <li>
                          <strong>Cassa interna del sito:</strong> Se hai creato una pagina dedicata nella sezione <em>Biglietti &amp; Casse</em>, puoi inserire qui il link interno (es. <code>/Biglietti/4-gatti</code>).
                        </li>
                        <li>
                          <strong>Prevendita a breve o Sold Out:</strong> Lascia vuoto il campo link. Sul sito apparirà un badge informativo non cliccabile con l&apos;etichetta che hai inserito.
                        </li>
                      </ul>
                    </div>

                    {(show.dates || []).length === 0 ? (
                      <p className="text-xs text-foreground/30 italic py-2">
                        Nessuna data attualmente configurata per questo spettacolo.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {show.dates.map((d: any, dIdx: number) => {
                          const hasLink = Boolean(d.ticket_href?.trim());
                          const isHttp = Boolean(hasLink && d.ticket_href.trim().startsWith("http"));
                          const isInternal = Boolean(hasLink && d.ticket_href.trim().startsWith("/"));

                          return (
                            <div
                              key={dIdx}
                              className="p-4 bg-background/50 border border-foreground/5 rounded-2xl space-y-3"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-foreground/5">
                                <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                                  Data #{dIdx + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveShowDate(actualIdx, dIdx, -1)}
                                    disabled={dIdx === 0}
                                    className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                    title="Sposta data in alto"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveShowDate(actualIdx, dIdx, 1)}
                                    disabled={dIdx === (show.dates || []).length - 1}
                                    className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                    title="Sposta data in basso"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeShowDate(actualIdx, dIdx)}
                                    className="p-1 ml-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Rimuovi Data"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField
                                  label="Data e Ora"
                                  value={d.date || ""}
                                  onChange={(v) => updateShowDate(actualIdx, dIdx, "date", v)}
                                  placeholder="es. 21 Giugno 2026, ore 18:30"
                                />
                                <FormField
                                  label="Luogo / Teatro"
                                  value={d.location || ""}
                                  onChange={(v) => updateShowDate(actualIdx, dIdx, "location", v)}
                                  placeholder="es. Missione Cattolica, Zurigo"
                                />
                              </div>

                              <FormField
                                label="Link Google Maps (opzionale)"
                                value={d.location_href || ""}
                                onChange={(v) => updateShowDate(actualIdx, dIdx, "location_href", v)}
                                placeholder="https://maps.app.goo.gl/... oppure https://maps.google.com/..."
                              />

                              {/* State Presets */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mr-1">
                                  Preset Rapidi:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateShowDate(actualIdx, dIdx, "ticket_label", "Acquista Biglietto");
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/20 transition-all"
                                >
                                  🎟️ In vendita
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateShowDate(actualIdx, dIdx, "ticket_label", "Prevendita a breve");
                                    updateShowDate(actualIdx, dIdx, "ticket_href", "");
                                  }}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/20 transition-all"
                                >
                                  ⏳ Prevendita a breve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateShowDate(actualIdx, dIdx, "ticket_label", "Sold Out");
                                    updateShowDate(actualIdx, dIdx, "ticket_href", "");
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/20 transition-all"
                                >
                                  🚫 Sold Out
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateShowDate(actualIdx, dIdx, "ticket_label", "Ingresso Libero");
                                    updateShowDate(actualIdx, dIdx, "ticket_href", "");
                                  }}
                                  className="px-2 py-1 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground/70 text-[11px] font-bold transition-all"
                                >
                                  🎪 Ingresso Libero
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <FormField
                                  label="Etichetta Bottone (testo visibile)"
                                  value={d.ticket_label || ""}
                                  onChange={(v) => updateShowDate(actualIdx, dIdx, "ticket_label", v)}
                                  placeholder="es. Acquista Biglietto"
                                />
                                <FormField
                                  label="Link Biglietti (Opzionale: URL esterno o link cassa interna)"
                                  value={d.ticket_href || ""}
                                  onChange={(v) => updateShowDate(actualIdx, dIdx, "ticket_href", v)}
                                  placeholder="https://eventfrog.ch/... oppure /Biglietti/nome-cassa"
                                />
                              </div>

                              {/* State Preview Indicator */}
                              <div className="pt-1 text-[11px]">
                                {isHttp && (
                                  <div className="text-indigo-400 font-semibold flex items-center gap-1.5">
                                    <ExternalLink size={12} />
                                    <span>Link diretto esterno: il pulsante apre l&apos;indirizzo in una nuova scheda</span>
                                  </div>
                                )}
                                {isInternal && (
                                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 size={12} />
                                    <span>Link interno al sito: naviga a <code>{d.ticket_href}</code></span>
                                  </div>
                                )}
                                {!hasLink && (
                                  <div className="text-foreground/40 font-medium">
                                    <span>Nessun link: sul sito viene mostrato solo il badge &quot;{d.ticket_label || 'A breve'}&quot; (non cliccabile)</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end pt-1 border-t border-foreground/5">
                                <button
                                  type="button"
                                  onClick={() => removeShowDate(actualIdx, dIdx)}
                                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                                >
                                  <Trash2 size={12} /> Rimuovi Data
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Technical details (Regia, Cast, etc) */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                          <Tag size={14} className="text-accent" /> Scheda Artistica & Tecnica
                        </h4>
                        <p className="text-[11px] text-foreground/40">
                          Regia, cast, scenografie, luci e crediti tecnici.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addShowDetail(actualIdx)}
                        className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus size={13} /> Aggiungi Dettaglio
                      </button>
                    </div>

                    {(show.details || []).length === 0 ? (
                      <p className="text-xs text-foreground/30 italic py-2">
                        Nessun dettaglio tecnico inserito.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {show.details.map((det: any, detIdx: number) => (
                          <div
                            key={detIdx}
                            className="p-3.5 bg-background/50 border border-foreground/5 rounded-2xl flex items-center gap-2"
                          >
                            <div className="w-1/3">
                              <input
                                type="text"
                                value={det.label || ""}
                                onChange={(e) =>
                                  updateShowDetail(actualIdx, detIdx, "label", e.target.value)
                                }
                                placeholder="es. Regia"
                                className="w-full px-2.5 py-1.5 bg-muted/30 border border-foreground/10 rounded-lg text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={det.value || ""}
                                onChange={(e) =>
                                  updateShowDetail(actualIdx, detIdx, "value", e.target.value)
                                }
                                placeholder="es. Nome Cognome"
                                className="w-full px-2.5 py-1.5 bg-muted/30 border border-foreground/10 rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveShowDetail(actualIdx, detIdx, -1)}
                                disabled={detIdx === 0}
                                className="p-1 rounded-md hover:bg-foreground/10 text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                title="Sposta prima"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveShowDetail(actualIdx, detIdx, 1)}
                                disabled={detIdx === (show.details || []).length - 1}
                                className="p-1 rounded-md hover:bg-foreground/10 text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                title="Sposta dopo"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeShowDetail(actualIdx, detIdx)}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1 rounded-md transition-all ml-0.5"
                                title="Rimuovi"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionCard>
            );
          })}
        </div>
      </AdminSection>
    </div>
  );
}
