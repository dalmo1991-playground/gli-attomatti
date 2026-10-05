"use client";

import React, { useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Footprints,
  Bus,
  ArrowUp,
  ArrowDown,
  Navigation,
  Image as ImageIcon,
  Tag,
  TramFront,
  Train
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { LocationItem, LocationStep, LocationPublicTransport } from "@/lib/locationTypes";

export function LocationsTab() {
  const { content, updateContent } = useAdmin();
  const locations: LocationItem[] = content?.locations || [];
  const [search, setSearch] = useState("");

  const addLocation = () => {
    const newId = `loc-${Date.now()}`;
    const newLocation: LocationItem = {
      id: newId,
      slug: `teatro-${Date.now()}`,
      title: "Nuova Location",
      venue_name: "Nome Sala / Teatro",
      address: "Indirizzo completo, Zurigo",
      google_maps_url: "",
      active: true,
      hero_image: "/images/1782553290530-TheaterCurtain.webp",
      description: "Indicazioni pratiche per raggiungere il teatro a piedi o con i mezzi pubblici.",
      public_transport: [
        {
          type: "tram",
          stop: "Fermata Principale",
          lines: "Tram 8",
          walking_time: "3 min a piedi"
        }
      ],
      steps: [
        {
          id: `step-${Date.now()}-1`,
          title: "Dalla fermata del tram all'edificio",
          instruction: "Scendi alla fermata e procedi verso...",
          image: "/images/1782553290530-TheaterCurtain.webp",
          image_caption: "Punto di riferimento visivo"
        }
      ],
      parking_info: "",
      accessibility_info: "",
      notes: "",
      back_link_label: "Torna indietro",
      back_link_href: "/"
    };
    updateContent("locations", [...locations, newLocation]);
  };

  const removeLocation = (idx: number) => {
    updateContent(
      "locations",
      locations.filter((_, i) => i !== idx)
    );
  };

  const moveLocation = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= locations.length) return;
    const next = [...locations];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("locations", next);
  };

  const updateLocation = (idx: number, field: keyof LocationItem, value: any) => {
    const next = [...locations];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("locations", next);
  };

  // Step operations
  const addStep = (locIdx: number) => {
    const next = [...locations];
    const steps = [...(next[locIdx].steps || [])];
    steps.push({
      id: `step-${Date.now()}`,
      title: `Passo ${steps.length + 1}`,
      instruction: "Descrivi il passaggio e i punti di riferimento visivi da notare...",
      image: "",
      image_caption: ""
    });
    next[locIdx] = { ...next[locIdx], steps };
    updateContent("locations", next);
  };

  const updateStep = (locIdx: number, stepIdx: number, field: keyof LocationStep, value: any) => {
    const next = [...locations];
    const steps = [...(next[locIdx].steps || [])];
    steps[stepIdx] = { ...steps[stepIdx], [field]: value };
    next[locIdx] = { ...next[locIdx], steps };
    updateContent("locations", next);
  };

  const moveStep = (locIdx: number, stepIdx: number, dir: -1 | 1) => {
    const next = [...locations];
    const steps = [...(next[locIdx].steps || [])];
    const targetIdx = stepIdx + dir;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    [steps[stepIdx], steps[targetIdx]] = [steps[targetIdx], steps[stepIdx]];
    next[locIdx] = { ...next[locIdx], steps };
    updateContent("locations", next);
  };

  const removeStep = (locIdx: number, stepIdx: number) => {
    const next = [...locations];
    const steps = (next[locIdx].steps || []).filter((_, i) => i !== stepIdx);
    next[locIdx] = { ...next[locIdx], steps };
    updateContent("locations", next);
  };

  // Public transport operations
  const addTransport = (locIdx: number) => {
    const next = [...locations];
    const transport = [...(next[locIdx].public_transport || [])];
    transport.push({
      type: "tram",
      stop: "Nuova Fermata",
      lines: "Linee",
      walking_time: "5 min a piedi"
    });
    next[locIdx] = { ...next[locIdx], public_transport: transport };
    updateContent("locations", next);
  };

  const updateTransport = (locIdx: number, tIdx: number, field: keyof LocationPublicTransport, value: any) => {
    const next = [...locations];
    const transport = [...(next[locIdx].public_transport || [])];
    transport[tIdx] = { ...transport[tIdx], [field]: value };
    next[locIdx] = { ...next[locIdx], public_transport: transport };
    updateContent("locations", next);
  };

  const removeTransport = (locIdx: number, tIdx: number) => {
    const next = [...locations];
    const transport = (next[locIdx].public_transport || []).filter((_, i) => i !== tIdx);
    next[locIdx] = { ...next[locIdx], public_transport: transport };
    updateContent("locations", next);
  };

  // Line badge operations within a transport stop
  const addLineBadge = (locIdx: number, tIdx: number) => {
    const next = [...locations];
    const transport = [...(next[locIdx].public_transport || [])];
    const badges = [...(transport[tIdx].line_badges || [])];
    badges.push({
      number: "8",
      bg_color: "#16a34a",
      text_color: "#ffffff"
    });
    transport[tIdx] = { ...transport[tIdx], line_badges: badges };
    next[locIdx] = { ...next[locIdx], public_transport: transport };
    updateContent("locations", next);
  };

  const updateLineBadge = (
    locIdx: number,
    tIdx: number,
    bIdx: number,
    field: "number" | "bg_color" | "text_color",
    value: string
  ) => {
    const next = [...locations];
    const transport = [...(next[locIdx].public_transport || [])];
    const badges = [...(transport[tIdx].line_badges || [])];
    badges[bIdx] = { ...badges[bIdx], [field]: value };
    transport[tIdx] = { ...transport[tIdx], line_badges: badges };
    next[locIdx] = { ...next[locIdx], public_transport: transport };
    updateContent("locations", next);
  };

  const removeLineBadge = (locIdx: number, tIdx: number, bIdx: number) => {
    const next = [...locations];
    const transport = [...(next[locIdx].public_transport || [])];
    const badges = (transport[tIdx].line_badges || []).filter((_, i) => i !== bIdx);
    transport[tIdx] = { ...transport[tIdx], line_badges: badges };
    next[locIdx] = { ...next[locIdx], public_transport: transport };
    updateContent("locations", next);
  };

  const filteredLocations = locations
    .map((loc, idx) => ({ loc, idx }))
    .filter(({ loc }) => {
      const q = search.toLowerCase();
      return (
        loc.title?.toLowerCase().includes(q) ||
        loc.venue_name?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q) ||
        loc.slug?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminSection
        title="Teatri, Sale & Location"
        description="Gestisci le schede con indicazioni pratiche e guide fotografiche passo-passo (/Location/[slug]) per mostrare come raggiungere i teatri da fermate di tram, bus o stazioni."
        icon={MapPin}
        action={
          <button
            type="button"
            onClick={addLocation}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Nuova Location
          </button>
        }
      >
        <div className="space-y-6">
          {/* Explanation Box */}
          <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/80 space-y-3 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Info size={16} className="text-accent shrink-0" />
              <span>Guide Fotografiche e Prefill Intelligente per gli Spettacoli</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-foreground/70">
              <li>
                <strong>Quando Google Maps non basta:</strong> Crea una pagina qui con foto dei cancelli, ingressi pedonali o svolte chiave (es. screenshot da Street View o foto reali).
              </li>
              <li>
                <strong>Pagine Unlisted:</strong> Le pagine <code>/Location/[slug]</code> sono concepite per essere fruite da mobile da chi si sta recando all&apos;evento. Non sporcano il menu principale.
              </li>
              <li>
                <strong>Aggancio con 1-Click:</strong> Quando crei o modifichi date in <em>Spettacoli</em> o <em>Iniziative</em>, troverai un comodo selettore rapido che compila sia il nome del teatro che l&apos;indirizzo alla pagina della location.
              </li>
            </ul>
          </div>

          {/* Search Bar */}
          {locations.length > 3 && (
            <FormField
              value={search}
              onChange={setSearch}
              placeholder="Cerca per teatro, titolo, indirizzo o slug..."
            />
          )}

          {/* Locations Accordion List */}
          {locations.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-foreground/15 rounded-3xl text-foreground/40 text-sm">
              Nessuna location configurata. Clicca &quot;Nuova Location&quot; in alto per iniziare.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLocations.map(({ loc, idx }) => (
                <AccordionCard
                  key={loc.id || idx}
                  title={loc.venue_name || loc.title || `Location #${idx + 1}`}
                  subtitle={`/Location/${loc.slug || ""} • ${loc.address || "Nessun indirizzo"}`}
                  badge={loc.steps?.length ? `${loc.steps.length} Passaggi` : "0 Passaggi"}
                  badgeColor="accent"
                  index={idx}
                  total={locations.length}
                  onMoveUp={() => moveLocation(idx, -1)}
                  onMoveDown={() => moveLocation(idx, 1)}
                  onDelete={() => removeLocation(idx)}
                >
                  <div className="space-y-8 pt-2">
                    {/* Active Toggle & Quick Preview */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                      <FormField
                        label="Location Attiva"
                        type="switch"
                        value={loc.active !== false}
                        onChange={(v) => updateLocation(idx, "active", v)}
                        helpText={
                          loc.active !== false
                            ? "Raggiungibile pubblicamente all'indirizzo /Location/" + (loc.slug || "slug")
                            : "Disattivata (reindirizza alla home)"
                        }
                      />

                      {loc.slug && (
                        <a
                          href={`/Location/${loc.slug}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent font-bold text-xs transition-colors"
                        >
                          <Navigation size={13} />
                          <span>Apri /Location/{loc.slug}</span>
                          <ExternalLink size={11} className="opacity-70" />
                        </a>
                      )}
                    </div>

                    {/* Venue & Identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Nome Sala / Teatro (Titolo Principale)"
                        value={loc.venue_name || ""}
                        onChange={(v) => updateLocation(idx, "venue_name", v)}
                        placeholder="es. Teatro della Missione Cattolica"
                        required
                      />

                      <FormField
                        label="Struttura / Istituzione (Opzionale)"
                        value={loc.title || ""}
                        onChange={(v) => updateLocation(idx, "title", v)}
                        placeholder="es. Missione Cattolica di Lingua Italiana"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Slug URL (/Location/[slug])"
                        value={loc.slug || ""}
                        onChange={(v) => updateLocation(idx, "slug", v.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                        helpText="Indirizzo web univoco (es. missione-cattolica diventa /Location/missione-cattolica)"
                        required
                      />

                      <FormField
                        label="Indirizzo Completo"
                        value={loc.address || ""}
                        onChange={(v) => updateLocation(idx, "address", v)}
                        placeholder="es. Feldstrasse 109, 8004 Zürich"
                        required
                      />
                    </div>

                    <FormField
                      label="Link Google Maps (Pulsante Navigazione)"
                      value={loc.google_maps_url || ""}
                      onChange={(v) => updateLocation(idx, "google_maps_url", v)}
                      placeholder="https://maps.app.goo.gl/... oppure https://maps.google.com/..."
                      helpText="Pulsante rapido che apre l'app Google Maps sul telefono dell'utente"
                    />

                    <FormField
                      label="Descrizione e Introduzione"
                      type="textarea"
                      rows={3}
                      value={loc.description || ""}
                      onChange={(v) => updateLocation(idx, "description", v)}
                      placeholder="Breve panoramica su come arrivare e punti di riferimento principali..."
                    />

                    {/* Badges & Etichette Personalizzate */}
                    <div className="p-6 bg-muted/15 rounded-3xl border border-foreground/5 space-y-4">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                          <Tag size={14} className="text-primary" />
                          <span>Badge & Etichette Personalizzate</span>
                        </h4>
                        <p className="text-[11px] text-foreground/50 mt-0.5">
                          Personalizza i testi dei badge informativi nella scheda o lasciali vuoti se preferisci nasconderli.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          label="Badge Hero (Testata Scheda)"
                          value={loc.badge ?? "Indicazioni Teatro & Location"}
                          onChange={(v) => updateLocation(idx, "badge", v)}
                          placeholder="es. Indicazioni Teatro & Location"
                          helpText="Mostrato sopra il nome del teatro. Lascia vuoto per rimuoverlo."
                        />

                        <FormField
                          label="Badge Superiore (Top Bar)"
                          value={loc.top_badge || ""}
                          onChange={(v) => updateLocation(idx, "top_badge", v)}
                          placeholder="es. Guida Fotografica & Percorso"
                          helpText="Opzionale, mostrato in alto a destra. Lascia vuoto se non desiderato."
                        />

                        <FormField
                          label="Badge Categoria (Elenco Hub)"
                          value={loc.category_badge ?? "Location Teatrale"}
                          onChange={(v) => updateLocation(idx, "category_badge", v)}
                          placeholder="es. Location Teatrale"
                          helpText="Mostrato sulla card dell'elenco pubblico /Location."
                        />
                      </div>

                      <FormField
                        label="Tag / Caratteristiche Aggiuntive (separati da virgola)"
                        value={(loc.tags || []).join(", ")}
                        onChange={(v) => {
                          const tags = v
                            .split(",")
                            .map((t: string) => t.trim())
                            .filter(Boolean);
                          updateLocation(idx, "tags", tags);
                        }}
                        placeholder="es. Accessibile in carrozzina, Parcheggio bici, Zona pedonale"
                        helpText="Pillole informative mostrate sotto la descrizione della location."
                      />
                    </div>

                    {/* Public Transport Section */}
                    <div className="p-6 bg-muted/15 rounded-3xl border border-foreground/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                            <Bus size={14} className="text-secondary" /> Fermate Mezzi Pubblici nelle Vicinanze
                          </h4>
                          <p className="text-[11px] text-foreground/50">
                            Tram, bus o treni con i relativi tempi a piedi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addTransport(idx)}
                          className="px-3 py-1.5 bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/25 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Plus size={13} /> Aggiungi Fermata
                        </button>
                      </div>

                      {(loc.public_transport || []).length === 0 ? (
                        <p className="text-xs text-foreground/40 italic">
                          Nessuna fermata configurata.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {loc.public_transport!.map((t, tIdx) => (
                            <div
                              key={tIdx}
                              className="p-4 bg-background/50 border border-foreground/10 rounded-2xl space-y-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                <div className="sm:col-span-1 space-y-2">
                                  <label className="text-xs font-black uppercase tracking-wider text-foreground/50">
                                    Mezzi Serviti
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      { val: "tram", label: "Tram", icon: TramFront, color: "text-emerald-400" },
                                      { val: "bus", label: "Bus", icon: Bus, color: "text-sky-400" },
                                      { val: "train", label: "Treno", icon: Train, color: "text-indigo-400" },
                                      { val: "generic", label: "Altro", icon: Navigation, color: "text-amber-400" }
                                    ].map(({ val, label, icon: Icon, color }) => {
                                      const currentTypes = (t.types && t.types.length > 0) ? t.types : [t.type || "tram"];
                                      const isSelected = currentTypes.includes(val);
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() => {
                                            let newTypes;
                                            if (isSelected) {
                                              newTypes = currentTypes.filter(x => x !== val);
                                              if (newTypes.length === 0) newTypes = ["tram"];
                                            } else {
                                              newTypes = [...currentTypes, val];
                                            }
                                            updateTransport(idx, tIdx, "types", newTypes);
                                          }}
                                          className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${
                                            isSelected 
                                              ? "bg-secondary/20 text-secondary border-secondary/30" 
                                              : "bg-foreground/5 text-foreground/50 border-foreground/10 hover:bg-foreground/10 hover:text-foreground/80"
                                          }`}
                                          title={`Seleziona ${label}`}
                                        >
                                          <Icon size={12} className={isSelected ? color : "opacity-70"} />
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="sm:col-span-1">
                                  <FormField
                                    label="Nome Fermata"
                                    value={t.stop || ""}
                                    onChange={(v) => updateTransport(idx, tIdx, "stop", v)}
                                    placeholder="Bäckeranlage"
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <FormField
                                    label="Linee (testo alternativo)"
                                    value={t.lines || ""}
                                    onChange={(v) => updateTransport(idx, tIdx, "lines", v)}
                                    placeholder="es. Tram 8"
                                  />
                                </div>
                                <div className="sm:col-span-1 flex items-center gap-2">
                                  <div className="flex-1">
                                    <FormField
                                      label="A piedi"
                                      value={t.walking_time || ""}
                                      onChange={(v) => updateTransport(idx, tIdx, "walking_time", v)}
                                      placeholder="3 min"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeTransport(idx, tIdx)}
                                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all mb-0.5"
                                    title="Rimuovi Fermata"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {/* Cartelli quadrati colorati (Line Badges) */}
                              <div className="pt-2 border-t border-foreground/5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
                                    <span>Cartelli quadrati colorati delle linee:</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => addLineBadge(idx, tIdx)}
                                    className="px-2.5 py-1 bg-foreground/5 hover:bg-foreground/10 text-foreground/80 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Plus size={12} /> Aggiungi Linea
                                  </button>
                                </div>

                                {(t.line_badges || []).length > 0 ? (
                                  <div className="flex flex-wrap gap-2.5 items-center">
                                    {t.line_badges!.map((b, bIdx) => (
                                      <div
                                        key={bIdx}
                                        className="p-2 rounded-xl bg-background/80 border border-foreground/10 flex items-center gap-2 shadow-sm"
                                      >
                                        {/* Visual Preview Badge */}
                                        <div
                                          className="w-7 h-7 rounded-[5px] flex items-center justify-center font-black text-xs shadow-sm border border-black/10 shrink-0"
                                          style={{
                                            backgroundColor: b.bg_color || "#000000",
                                            color: b.text_color || "#ffffff"
                                          }}
                                        >
                                          {b.number || "?"}
                                        </div>

                                        {/* Number Input */}
                                        <input
                                          type="text"
                                          value={b.number}
                                          onChange={(e) =>
                                            updateLineBadge(idx, tIdx, bIdx, "number", e.target.value)
                                          }
                                          className="w-12 px-2 py-1 text-xs font-bold rounded-lg bg-foreground/5 border border-foreground/10 text-foreground text-center"
                                          placeholder="8"
                                          title="Numero o sigla linea (es. 8, 32, S, N7)"
                                        />

                                        {/* Background & Text Color Pickers */}
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-1.5" title="Scegli colore di sfondo">
                                            <div className="text-[10px] uppercase font-bold text-foreground/50">Bg:</div>
                                            <input
                                              type="color"
                                              value={b.bg_color || "#000000"}
                                              onChange={(e) =>
                                                updateLineBadge(idx, tIdx, bIdx, "bg_color", e.target.value)
                                              }
                                              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                          </div>
                                          
                                          <div className="flex items-center gap-1.5" title="Scegli colore del testo">
                                            <div className="text-[10px] uppercase font-bold text-foreground/50">Text:</div>
                                            <input
                                              type="color"
                                              value={b.text_color || "#ffffff"}
                                              onChange={(e) =>
                                                updateLineBadge(idx, tIdx, bIdx, "text_color", e.target.value)
                                              }
                                              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                          </div>
                                        </div>

                                        {/* Remove Badge Button */}
                                        <button
                                          type="button"
                                          onClick={() => removeLineBadge(idx, tIdx, bIdx)}
                                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-all ml-1"
                                          title="Rimuovi Cartello"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-foreground/40 italic">
                                    Nessun cartello colorato configurato. Clicca &quot;Aggiungi Linea&quot; per definire numero e colore.
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Photo Guide */}
                    <div className="p-6 bg-muted/15 rounded-3xl border border-foreground/5 space-y-5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                            <Footprints size={14} className="text-accent" /> Guida Fotografica Passo-Passo
                          </h4>
                          <p className="text-[11px] text-foreground/50">
                            Aggiungi immagini reali o screenshot di Street View con le istruzioni visive.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addStep(idx)}
                          className="px-3 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/25 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Plus size={13} /> Aggiungi Passo
                        </button>
                      </div>

                      {(loc.steps || []).length === 0 ? (
                        <p className="text-xs text-foreground/40 italic">
                          Nessun passaggio fotografico configurato.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {loc.steps!.map((step, sIdx) => (
                            <div
                              key={step.id || sIdx}
                              className="p-5 bg-background/50 border border-foreground/10 rounded-2xl space-y-4"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-foreground/5">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
                                    {sIdx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-foreground">
                                    {step.title || `Passo #${sIdx + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveStep(idx, sIdx, -1)}
                                    disabled={sIdx === 0}
                                    className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 disabled:opacity-20 transition-all"
                                    title="Sposta su"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveStep(idx, sIdx, 1)}
                                    disabled={sIdx === loc.steps!.length - 1}
                                    className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 disabled:opacity-20 transition-all"
                                    title="Sposta giù"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeStep(idx, sIdx)}
                                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
                                    title="Rimuovi Passo"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <FormField
                                label="Titolo del Passaggio"
                                value={step.title || ""}
                                onChange={(v) => updateStep(idx, sIdx, "title", v)}
                                placeholder="es. Ingresso pedonale su Feldstrasse"
                              />

                              <FormField
                                label="Istruzioni Dettagliate"
                                type="textarea"
                                rows={2}
                                value={step.instruction || ""}
                                onChange={(v) => updateStep(idx, sIdx, "instruction", v)}
                                placeholder="es. Entra dal cancello nero, segui il vialetto verso destra..."
                              />

                              <ImageUploadField
                                label="Foto del Passaggio (Street View o Foto Reale)"
                                value={step.image || ""}
                                onChange={(url) => updateStep(idx, sIdx, "image", url)}
                                aspect="video"
                                helpText="Carica una foto del punto di riferimento o cancello d'ingresso"
                              />

                              <FormField
                                label="Didascalia Foto (Opzionale)"
                                value={step.image_caption || ""}
                                onChange={(v) => updateStep(idx, sIdx, "image_caption", v)}
                                placeholder="es. Vista del cancello aperto prima dell'inizio spettacolo"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Parking & Accessibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Informazioni Parcheggio"
                        type="textarea"
                        rows={2}
                        value={loc.parking_info || ""}
                        onChange={(v) => updateLocation(idx, "parking_info", v)}
                        placeholder="Zona blu disponibile nelle vie adiacenti..."
                      />

                      <FormField
                        label="Accessibilità Disabili / Carrozzine"
                        type="textarea"
                        rows={2}
                        value={loc.accessibility_info || ""}
                        onChange={(v) => updateLocation(idx, "accessibility_info", v)}
                        placeholder="Accesso facilitato tramite rampa o ascensore..."
                      />
                    </div>

                    <FormField
                      label="Note e Consigli Aggiuntivi (Opzionale)"
                      type="textarea"
                      rows={2}
                      value={loc.notes || ""}
                      onChange={(v) => updateLocation(idx, "notes", v)}
                      placeholder="es. Portone aperto dalle 19:30, citofonare se chiuso..."
                    />
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
