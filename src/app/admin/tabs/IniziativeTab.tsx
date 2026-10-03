"use client";

import React, { useState } from "react";
import { Plus, Compass, Search, Calendar, Tag, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { GalleryField } from "../components/ui/GalleryField";
import { ImageUploadField } from "../components/ui/ImageUploadField";

export function IniziativeTab() {
  const { content, updateContent } = useAdmin();
  const iniz = content?.pages?.iniziative || {
    title: "Iniziative & Corsi",
    description: "",
    archive_sections: []
  };

  const archive = iniz.archive_sections || [];
  const [search, setSearch] = useState("");

  const addInitiative = () => {
    const currentYear = new Date().getFullYear().toString();
    updateContent("pages.iniziative.archive_sections", [
      ...archive,
      {
        title: "Nuova Iniziativa",
        slug: `iniziativa-${Date.now()}`,
        year: currentYear,
        short_description: "",
        text: "",
        hero_image: "",
        dates: [],
        details: [
          { label: "Livello", value: "Tutti i livelli" },
          { label: "Lingua", value: "Italiano" }
        ],
        images: []
      }
    ]);
  };

  const removeInitiative = (idx: number) => {
    updateContent(
      "pages.iniziative.archive_sections",
      archive.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveInitiative = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= archive.length) return;
    const next = [...archive];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("pages.iniziative.archive_sections", next);
  };

  const updateInitiative = (idx: number, field: string, value: any) => {
    const next = [...archive];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("pages.iniziative.archive_sections", next);
  };

  // Dates helpers
  const addDate = (sIdx: number) => {
    const next = [...archive];
    if (!next[sIdx].dates) next[sIdx].dates = [];
    next[sIdx].dates.push({
      date: "",
      location: "",
      location_href: "",
      ticket_label: "Iscriviti",
      ticket_href: ""
    });
    updateContent("pages.iniziative.archive_sections", next);
  };

  const removeDate = (sIdx: number, dIdx: number) => {
    const next = [...archive];
    next[sIdx].dates = next[sIdx].dates.filter((_: any, i: number) => i !== dIdx);
    updateContent("pages.iniziative.archive_sections", next);
  };

  const updateDate = (sIdx: number, dIdx: number, field: string, value: string) => {
    const next = [...archive];
    next[sIdx].dates[dIdx] = { ...next[sIdx].dates[dIdx], [field]: value };
    updateContent("pages.iniziative.archive_sections", next);
  };

  const moveDate = (sIdx: number, dIdx: number, dir: -1 | 1) => {
    const dates = [...(archive[sIdx]?.dates || [])];
    const targetIdx = dIdx + dir;
    if (targetIdx < 0 || targetIdx >= dates.length) return;
    [dates[dIdx], dates[targetIdx]] = [dates[targetIdx], dates[dIdx]];
    const next = [...archive];
    next[sIdx] = { ...next[sIdx], dates };
    updateContent("pages.iniziative.archive_sections", next);
  };

  // Details helpers
  const addDetail = (sIdx: number) => {
    const next = [...archive];
    if (!next[sIdx].details) next[sIdx].details = [];
    next[sIdx].details.push({ label: "Info", value: "" });
    updateContent("pages.iniziative.archive_sections", next);
  };

  const removeDetail = (sIdx: number, detIdx: number) => {
    const next = [...archive];
    next[sIdx].details = next[sIdx].details.filter((_: any, i: number) => i !== detIdx);
    updateContent("pages.iniziative.archive_sections", next);
  };

  const updateDetail = (sIdx: number, detIdx: number, field: string, value: string) => {
    const next = [...archive];
    next[sIdx].details[detIdx] = { ...next[sIdx].details[detIdx], [field]: value };
    updateContent("pages.iniziative.archive_sections", next);
  };

  const moveDetail = (sIdx: number, detIdx: number, dir: -1 | 1) => {
    const details = [...(archive[sIdx]?.details || [])];
    const targetIdx = detIdx + dir;
    if (targetIdx < 0 || targetIdx >= details.length) return;
    [details[detIdx], details[targetIdx]] = [details[targetIdx], details[detIdx]];
    const next = [...archive];
    next[sIdx] = { ...next[sIdx], details };
    updateContent("pages.iniziative.archive_sections", next);
  };

  const filteredArchive = archive.filter((s: any) =>
    (s.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.year || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Gestione Iniziative & Corsi"
        description="Gestisci i laboratori teatrali, i workshop, gli eventi speciali e i corsi aperti alla comunità."
        icon={Compass}
        action={
          <button
            type="button"
            onClick={addInitiative}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Nuova Iniziativa
          </button>
        }
      >
        <div className="space-y-4 pb-6 border-b border-foreground/5">
          <FormField
            label="Titolo Pagina Iniziative"
            value={iniz.title || ""}
            onChange={(v) => updateContent("pages.iniziative.title", v)}
            placeholder="Le Nostre Iniziative"
          />
          <FormField
            label="Descrizione Pagina"
            value={iniz.description || ""}
            onChange={(v) => updateContent("pages.iniziative.description", v)}
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
              placeholder="Cerca iniziativa o anno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/20 border border-foreground/10 rounded-xl text-xs text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none"
            />
          </div>
          <span className="text-xs text-foreground/40 font-bold">
            {filteredArchive.length} iniziative
          </span>
        </div>

        {/* Initiatives List */}
        <div className="space-y-4">
          {filteredArchive.map((item: any) => {
            const actualIdx = archive.indexOf(item);
            const firstImg = item.images?.[0]?.url;

            return (
              <AccordionCard
                key={actualIdx}
                title={item.title || "Senza Titolo"}
                subtitle={`${item.year || "Periodo n.d."} • /Iniziative/${item.slug || ""}`}
                thumbnail={firstImg}
                badge={item.dates?.length ? `${item.dates.length} Sessioni` : undefined}
                badgeColor="amber"
                index={actualIdx}
                total={archive.length}
                onMoveUp={() => moveInitiative(actualIdx, -1)}
                onMoveDown={() => moveInitiative(actualIdx, 1)}
                onDelete={() => removeInitiative(actualIdx)}
              >
                <div className="space-y-8 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        label="Titolo Iniziativa / Corso"
                        value={item.title || ""}
                        onChange={(v) => updateInitiative(actualIdx, "title", v)}
                        required
                      />
                    </div>
                    <div>
                      <FormField
                        label="Anno / Periodo"
                        value={item.year || ""}
                        onChange={(v) => updateInitiative(actualIdx, "year", v)}
                        placeholder="2025/2026"
                      />
                    </div>
                  </div>

                  <FormField
                    label="Slug URL (identificativo per il link)"
                    value={item.slug || ""}
                    onChange={(v) => updateInitiative(actualIdx, "slug", v)}
                    helpText="Verrà visualizzato come /Iniziative/{slug}"
                  />

                  <FormField
                    label="Breve Descrizione (anteprima card nell'elenco)"
                    value={item.short_description || ""}
                    onChange={(v) => updateInitiative(actualIdx, "short_description", v)}
                    type="textarea"
                    rows={2}
                  />

                  <FormField
                    label="Testo Descrittivo Completo"
                    value={item.text || ""}
                    onChange={(v) => updateInitiative(actualIdx, "text", v)}
                    type="richtext"
                    rows={5}
                  />

                  {/* Hero Image (Optional) */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <ImageUploadField
                      label="Immagine Hero / Copertina di Testata (Opzionale)"
                      value={item.hero_image || ""}
                      onChange={(url) => updateInitiative(actualIdx, "hero_image", url)}
                      helpText="Se inserita, viene visualizzata a tutto schermo come sfondo della testata con un elegante filtro scuro e gradiente per garantire la leggibilità del titolo."
                    />
                  </div>

                  {/* Photo Gallery */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <GalleryField
                      label="Galleria Fotografica Iniziativa"
                      description="La prima immagine sarà la copertina dell'iniziativa."
                      images={item.images || []}
                      onChange={(newImgs) => updateInitiative(actualIdx, "images", newImgs)}
                    />
                  </div>

                  {/* Dates & Registration */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                          <Calendar size={14} className="text-accent" /> Date & Iscrizioni
                        </h4>
                        <p className="text-[11px] text-foreground/40">
                          Calendario degli incontri e link al modulo di iscrizione o biglietto.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addDate(actualIdx)}
                        className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus size={13} /> Aggiungi Data / Sessione
                      </button>
                    </div>

                    {(item.dates || []).length === 0 ? (
                      <p className="text-xs text-foreground/30 italic py-2">
                        Nessuna data attualmente inserita.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {item.dates.map((d: any, dIdx: number) => (
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
                                  onClick={() => moveDate(actualIdx, dIdx, -1)}
                                  disabled={dIdx === 0}
                                  className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                  title="Sposta data in alto"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveDate(actualIdx, dIdx, 1)}
                                  disabled={dIdx === (item.dates || []).length - 1}
                                  className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                  title="Sposta data in basso"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeDate(actualIdx, dIdx)}
                                  className="p-1 ml-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Rimuovi Data"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <FormField
                                label="Data o Frequenza"
                                value={d.date || ""}
                                onChange={(v) => updateDate(actualIdx, dIdx, "date", v)}
                                placeholder="Ogni lunedì sera dalle 20:00"
                              />
                              <FormField
                                label="Luogo"
                                value={d.location || ""}
                                onChange={(v) => updateDate(actualIdx, dIdx, "location", v)}
                                placeholder="Zurigo Centro"
                              />
                            </div>
                            <FormField
                              label="Link Google Maps (opzionale)"
                              value={d.location_href || ""}
                              onChange={(v) => updateDate(actualIdx, dIdx, "location_href", v)}
                              placeholder="https://maps.app.goo.gl/... oppure https://maps.google.com/..."
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <FormField
                                label="Etichetta Bottone"
                                value={d.ticket_label || ""}
                                onChange={(v) => updateDate(actualIdx, dIdx, "ticket_label", v)}
                                placeholder="Iscriviti al corso"
                              />
                              <FormField
                                label="Link Bottone / Modulo"
                                value={d.ticket_href || ""}
                                onChange={(v) => updateDate(actualIdx, dIdx, "ticket_href", v)}
                                placeholder="https://forms.gle/..."
                              />
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => removeDate(actualIdx, dIdx)}
                                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Rimuovi Data
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info Iniziativa (Livello, Lingua, etc) */}
                  <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                          <Tag size={14} className="text-primary" /> Informazioni & Requisiti
                        </h4>
                        <p className="text-[11px] text-foreground/40">
                          Livello richiesto, lingua, materiale o docenti.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addDetail(actualIdx)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus size={13} /> Aggiungi Parametro
                      </button>
                    </div>

                    {(item.details || []).length === 0 ? (
                      <p className="text-xs text-foreground/30 italic py-2">
                        Nessun parametro inserito.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {item.details.map((det: any, detIdx: number) => (
                          <div
                            key={detIdx}
                            className="p-3.5 bg-background/50 border border-foreground/5 rounded-2xl flex items-center gap-2"
                          >
                            <div className="w-1/3">
                              <input
                                type="text"
                                value={det.label || ""}
                                onChange={(e) =>
                                  updateDetail(actualIdx, detIdx, "label", e.target.value)
                                }
                                placeholder="es. Livello"
                                className="w-full px-2.5 py-1.5 bg-muted/30 border border-foreground/10 rounded-lg text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={det.value || ""}
                                onChange={(e) =>
                                  updateDetail(actualIdx, detIdx, "value", e.target.value)
                                }
                                placeholder="es. Base / Aperto a tutti"
                                className="w-full px-2.5 py-1.5 bg-muted/30 border border-foreground/10 rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveDetail(actualIdx, detIdx, -1)}
                                disabled={detIdx === 0}
                                className="p-1 rounded-md hover:bg-foreground/10 text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                title="Sposta prima"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveDetail(actualIdx, detIdx, 1)}
                                disabled={detIdx === (item.details || []).length - 1}
                                className="p-1 rounded-md hover:bg-foreground/10 text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                                title="Sposta dopo"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDetail(actualIdx, detIdx)}
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
