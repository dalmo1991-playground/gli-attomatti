"use client";

import React, { useState } from "react";
import {
  Plus,
  Rocket,
  Search,
  ExternalLink,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  Megaphone
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { GalleryField } from "../components/ui/GalleryField";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BLOCK_TYPES = [
  { type: "hero", label: "Hero Header", icon: Sparkles, desc: "Titolo d'impatto, sfondo e CTA principale" },
  { type: "event_details", label: "Data, Orario & Luogo", icon: Calendar, desc: "Card con dettagli data, mappa e prezzo" },
  { type: "synopsis", label: "Trama & Sinossi", icon: BookOpen, desc: "Descrizione narrativa, citazione e foto" },
  { type: "gallery", label: "Galleria Fotografica", icon: ImageIcon, desc: "Scatti di scena con lightbox" },
  { type: "reviews", label: "Recensioni & Critica", icon: MessageSquare, desc: "Social proof e stelle di gradimento" },
  { type: "faq", label: "Domande Frequenti (FAQ)", icon: HelpCircle, desc: "Fisarmonica con risposte alle domande" },
  { type: "closing_cta", label: "Banner CTA Finale", icon: Megaphone, desc: "Pulsante di chiusura ad alta conversione" }
];

export function LandingTab() {
  const { content, updateContent } = useAdmin();
  const landings = content?.landings || [];
  const [search, setSearch] = useState("");
  const [activeLandingIdx, setActiveLandingIdx] = useState<number | null>(0);

  const addLanding = () => {
    const newId = `landing-${Date.now()}`;
    const newLanding = {
      id: newId,
      slug: `promozione-${Date.now()}`,
      title: "Nuova Landing Page",
      active: true,
      theme_color: "primary",
      header: {
        logo_text: "Gli Attomatti",
        cta_label: "Acquista Biglietti",
        cta_href: ""
      },
      sticky_bar: {
        enabled: true,
        text: "Spettacolo Teatrale • Riserva il tuo posto",
        cta_label: "Biglietti",
        cta_href: ""
      },
      blocks: [
        {
          id: `b-${Date.now()}-1`,
          type: "hero",
          badge: "Nuova Produzione",
          title: "Titolo dello Spettacolo",
          tagline: "Una breve frase coinvolgente che cattura subito l'attenzione del pubblico.",
          hero_image: "",
          primary_cta_label: "Acquista Biglietti",
          primary_cta_href: "",
          secondary_cta_label: "Dettagli Evento",
          secondary_cta_href: "#dettagli"
        },
        {
          id: `b-${Date.now()}-2`,
          type: "event_details",
          title: "Data e Informazioni",
          date: "Sabato 20:00",
          location: "Zurigo",
          location_href: "",
          price: "CHF 25.-",
          info_badge: "Posti limitati",
          cta_label: "Prenota ora",
          cta_href: ""
        }
      ]
    };

    updateContent("landings", [...landings, newLanding]);
    setActiveLandingIdx(landings.length);
  };

  const removeLanding = (idx: number) => {
    updateContent("landings", landings.filter((_: any, i: number) => i !== idx));
  };

  const updateLanding = (idx: number, field: string, value: any) => {
    const updated = [...landings];
    if (field.includes(".")) {
      const parts = field.split(".");
      let target = updated[idx];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    updateContent("landings", updated);
  };

  // Block Builder Helpers
  const addBlock = (landingIdx: number, type: string) => {
    const landing = landings[landingIdx];
    const blocks = landing.blocks || [];
    let newBlock: any = { id: `b-${Date.now()}`, type };

    if (type === "hero") {
      newBlock = {
        ...newBlock,
        badge: "In Primo Piano",
        title: "Titolo Hero",
        tagline: "Descrizione breve e d'impatto",
        hero_image: "",
        primary_cta_label: "Biglietti",
        primary_cta_href: ""
      };
    } else if (type === "event_details") {
      newBlock = {
        ...newBlock,
        title: "Data, Orario e Luogo",
        date: "Data e ora",
        location: "Luogo dello spettacolo",
        price: "CHF 25.-",
        cta_label: "Prenota"
      };
    } else if (type === "synopsis") {
      newBlock = {
        ...newBlock,
        title: "La Trama",
        text: "Descrizione completa della storia...",
        quote: "Una frase d'effetto dalla regia",
        quote_author: "Regia"
      };
    } else if (type === "gallery") {
      newBlock = {
        ...newBlock,
        title: "Momenti di Scena",
        images: []
      };
    } else if (type === "reviews") {
      newBlock = {
        ...newBlock,
        title: "Dicono di Noi",
        items: [
          { quote: "Uno spettacolo imperdibile ed emozionante!", author: "Spettatore", rating: 5 }
        ]
      };
    } else if (type === "faq") {
      newBlock = {
        ...newBlock,
        title: "Domande Frequenti",
        items: [
          { question: "Come funziona l'accesso?", answer: "Ingresso aperto 30 minuti prima dell'inizio." }
        ]
      };
    } else if (type === "closing_cta") {
      newBlock = {
        ...newBlock,
        title: "Unisciti a Noi",
        text: "Prenota ora prima dell'esaurimento posti.",
        cta_label: "Acquista Biglietto"
      };
    }

    updateLanding(landingIdx, "blocks", [...blocks, newBlock]);
  };

  const removeBlock = (landingIdx: number, blockIdx: number) => {
    const landing = landings[landingIdx];
    const blocks = (landing.blocks || []).filter((_: any, i: number) => i !== blockIdx);
    updateLanding(landingIdx, "blocks", blocks);
  };

  const moveBlock = (landingIdx: number, blockIdx: number, dir: number) => {
    const landing = landings[landingIdx];
    const blocks = [...(landing.blocks || [])];
    const targetIdx = blockIdx + dir;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[blockIdx];
    blocks[blockIdx] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    updateLanding(landingIdx, "blocks", blocks);
  };

  const updateBlock = (landingIdx: number, blockIdx: number, field: string, val: any) => {
    const landing = landings[landingIdx];
    const blocks = [...(landing.blocks || [])];
    blocks[blockIdx] = { ...blocks[blockIdx], [field]: val };
    updateLanding(landingIdx, "blocks", blocks);
  };

  const filteredLandings = landings.filter((l: any) =>
    (l.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.slug || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AdminSection
        title="Landing Pages Standalone"
        description="Crea e gestisci pagine promozionali indipendenti ad alta conversione per spettacoli, corsi o campagne social (raggiungibili all'indirizzo /landing/nome-slug)."
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
            <input
              type="text"
              placeholder="Cerca landing page..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-foreground/10 text-sm focus:border-primary outline-none transition-all"
            />
          </div>

          <button
            type="button"
            onClick={addLanding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0"
          >
            <Plus size={16} /> Nuova Landing Page
          </button>
        </div>

        {filteredLandings.length === 0 ? (
          <div className="text-center py-16 p-8 border border-dashed border-foreground/10 rounded-3xl bg-muted/5">
            <Rocket size={40} className="mx-auto text-primary/40 mb-3" />
            <p className="text-sm text-foreground/60 font-medium">Nessuna landing page trovata.</p>
            <button
              type="button"
              onClick={addLanding}
              className="mt-4 text-xs font-bold text-primary hover:underline"
            >
              Crea la prima landing page
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredLandings.map((landing: any) => {
              const actualIdx = landings.indexOf(landing);
              const heroBlock = landing.blocks?.find((b: any) => b.type === "hero");
              const thumbnail = heroBlock?.hero_image || "";

              return (
                <AccordionCard
                  key={actualIdx}
                  title={landing.title || "Senza Titolo"}
                  subtitle={`/landing/${landing.slug || ""}`}
                  thumbnail={thumbnail}
                  badge={landing.active ? "Attiva" : "Bozza"}
                  badgeColor={landing.active ? "primary" : "muted"}
                  index={actualIdx}
                  total={landings.length}
                  onDelete={() => removeLanding(actualIdx)}
                  defaultOpen={activeLandingIdx === actualIdx}
                >
                  <div className="space-y-8 pt-2">
                    {/* General Settings */}
                    <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                          Impostazioni Generali
                        </h4>
                        {landing.slug && (
                          <Link
                            href={`/landing/${landing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                          >
                            <span>Anteprima Live</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <FormField
                            label="Titolo della Landing"
                            value={landing.title || ""}
                            onChange={(v) => updateLanding(actualIdx, "title", v)}
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="Stato Pagina"
                            value={landing.active ?? true}
                            onChange={(v) => updateLanding(actualIdx, "active", v)}
                            type="switch"
                            helpText={landing.active ? "Pubblicata online" : "Modalità bozza"}
                          />
                        </div>
                      </div>

                      <FormField
                        label="Slug URL (/landing/{slug})"
                        value={landing.slug || ""}
                        onChange={(v) => updateLanding(actualIdx, "slug", v)}
                        helpText="URL accessibile al pubblico. Usa caratteri minuscoli e trattini (es. non-sottovalutare-i-40)."
                        required
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                          label="Testo Pulsante CTA in Testata"
                          value={landing.header?.cta_label || ""}
                          onChange={(v) => updateLanding(actualIdx, "header.cta_label", v)}
                          placeholder="es. Acquista Biglietti"
                        />
                        <FormField
                          label="Link Pulsante CTA in Testata"
                          value={landing.header?.cta_href || ""}
                          onChange={(v) => updateLanding(actualIdx, "header.cta_href", v)}
                          placeholder="https://eventfrog.ch/..."
                        />
                      </div>
                    </div>

                    {/* Sticky Bottom Bar on Mobile */}
                    <div className="p-6 bg-muted/10 rounded-3xl border border-foreground/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                            Barra Sticky Mobile
                          </h4>
                          <p className="text-[11px] text-foreground/40 mt-0.5">
                            Rimane fissata in basso su smartphone per convertire subito.
                          </p>
                        </div>
                        <FormField
                          label=""
                          value={landing.sticky_bar?.enabled ?? true}
                          onChange={(v) => updateLanding(actualIdx, "sticky_bar.enabled", v)}
                          type="switch"
                        />
                      </div>

                      {landing.sticky_bar?.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <FormField
                              label="Testo Barra"
                              value={landing.sticky_bar?.text || ""}
                              onChange={(v) => updateLanding(actualIdx, "sticky_bar.text", v)}
                              placeholder="es. 28 Maggio • Posti limitati"
                            />
                          </div>
                          <div>
                            <FormField
                              label="Etichetta Tasto"
                              value={landing.sticky_bar?.cta_label || ""}
                              onChange={(v) => updateLanding(actualIdx, "sticky_bar.cta_label", v)}
                              placeholder="es. Biglietti"
                            />
                          </div>
                          <div>
                            <FormField
                              label="Link Tasto"
                              value={landing.sticky_bar?.cta_href || ""}
                              onChange={(v) => updateLanding(actualIdx, "sticky_bar.cta_href", v)}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Block Builder Section */}
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-primary" />
                          <h4 className="text-sm font-black uppercase tracking-wider">
                            Blocchi della Pagina ({landing.blocks?.length || 0})
                          </h4>
                        </div>

                        {/* Add Block Dropdown */}
                        <div className="flex flex-wrap gap-1.5">
                          {BLOCK_TYPES.map((bt) => {
                            const Icon = bt.icon;
                            return (
                              <button
                                key={bt.type}
                                type="button"
                                onClick={() => addBlock(actualIdx, bt.type)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-foreground/10 text-xs font-bold text-foreground/80 hover:text-primary hover:border-primary/30 transition-all"
                                title={bt.desc}
                              >
                                <Icon size={12} className="text-primary" />
                                <span>+ {bt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {(!landing.blocks || landing.blocks.length === 0) ? (
                        <p className="text-xs text-foreground/40 italic py-4">
                          Nessun blocco presente. Clicca su uno dei bottoni sopra per aggiungere un blocco.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {landing.blocks.map((block: any, bIdx: number) => {
                            const btConfig = BLOCK_TYPES.find((b) => b.type === block.type) || {
                              label: block.type,
                              icon: Layers
                            };
                            const BlockIcon = btConfig.icon;

                            return (
                              <div
                                key={block.id || bIdx}
                                className="p-6 rounded-2xl bg-background border border-foreground/10 space-y-4 shadow-sm"
                              >
                                <div className="flex items-center justify-between border-b border-foreground/5 pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                      <BlockIcon size={14} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                      {bIdx + 1}. {btConfig.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => moveBlock(actualIdx, bIdx, -1)}
                                      disabled={bIdx === 0}
                                      className="p-1 hover:bg-muted text-foreground/40 hover:text-foreground disabled:opacity-20 rounded"
                                      title="Sposta su"
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveBlock(actualIdx, bIdx, 1)}
                                      disabled={bIdx === landing.blocks.length - 1}
                                      className="p-1 hover:bg-muted text-foreground/40 hover:text-foreground disabled:opacity-20 rounded"
                                      title="Sposta giù"
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeBlock(actualIdx, bIdx)}
                                      className="p-1 text-rose-400 hover:bg-rose-500/10 rounded ml-1"
                                      title="Rimuovi blocco"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Dynamic Block Editors */}
                                {block.type === "hero" && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Badge Sopra Titolo"
                                        value={block.badge || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "badge", v)}
                                        placeholder="es. Nuova Produzione"
                                      />
                                      <FormField
                                        label="Titolo Principale"
                                        value={block.title || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                        required
                                      />
                                    </div>
                                    <FormField
                                      label="Tagline / Sottotitolo"
                                      value={block.tagline || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "tagline", v)}
                                      type="textarea"
                                      rows={2}
                                    />
                                    <ImageUploadField
                                      label="Immagine di Sfondo Hero"
                                      value={block.hero_image || ""}
                                      onChange={(url) => updateBlock(actualIdx, bIdx, "hero_image", url)}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Etichetta CTA Primaria"
                                        value={block.primary_cta_label || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "primary_cta_label", v)}
                                        placeholder="es. Acquista Biglietti"
                                      />
                                      <FormField
                                        label="Link CTA Primaria"
                                        value={block.primary_cta_href || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "primary_cta_href", v)}
                                        placeholder="https://..."
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Etichetta CTA Secondaria"
                                        value={block.secondary_cta_label || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "secondary_cta_label", v)}
                                        placeholder="es. Dettagli Evento"
                                      />
                                      <FormField
                                        label="Link CTA Secondaria"
                                        value={block.secondary_cta_href || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "secondary_cta_href", v)}
                                        placeholder="#dettagli"
                                      />
                                    </div>
                                  </div>
                                )}

                                {block.type === "event_details" && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Titolo Sezione"
                                        value={block.title || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                      />
                                      <FormField
                                        label="Badge Info"
                                        value={block.info_badge || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "info_badge", v)}
                                        placeholder="es. Posti limitati"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Data e Orario"
                                        value={block.date || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "date", v)}
                                        placeholder="es. Sabato 28 Maggio, ore 20:00"
                                      />
                                      <FormField
                                        label="Prezzo Biglietto"
                                        value={block.price || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "price", v)}
                                        placeholder="es. CHF 25.-"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Luogo / Teatro"
                                        value={block.location || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "location", v)}
                                        placeholder="es. Scuol, Engadina"
                                      />
                                      <FormField
                                        label="Link Mappa Google"
                                        value={block.location_href || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "location_href", v)}
                                        placeholder="https://maps.app.goo.gl/..."
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Testo Pulsante Prenota"
                                        value={block.cta_label || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "cta_label", v)}
                                      />
                                      <FormField
                                        label="Link Prenota"
                                        value={block.cta_href || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "cta_href", v)}
                                      />
                                    </div>
                                  </div>
                                )}

                                {block.type === "synopsis" && (
                                  <div className="space-y-4">
                                    <FormField
                                      label="Titolo Sezione"
                                      value={block.title || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                      placeholder="es. La Trama"
                                    />
                                    <FormField
                                      label="Testo della Trama / Sinossi"
                                      value={block.text || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "text", v)}
                                      type="textarea"
                                      rows={4}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Citazione Regia / Cast"
                                        value={block.quote || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "quote", v)}
                                        type="textarea"
                                        rows={2}
                                      />
                                      <FormField
                                        label="Autore Citazione"
                                        value={block.quote_author || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "quote_author", v)}
                                        placeholder="es. Domenico Scotti di Carlo, Regia"
                                      />
                                    </div>
                                    <ImageUploadField
                                      label="Foto della Scena"
                                      value={block.image || ""}
                                      onChange={(url) => updateBlock(actualIdx, bIdx, "image", url)}
                                    />
                                  </div>
                                )}

                                {block.type === "gallery" && (
                                  <div className="space-y-4">
                                    <FormField
                                      label="Titolo Galleria"
                                      value={block.title || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                      placeholder="es. Momenti di Scena"
                                    />
                                    <GalleryField
                                      label="Foto Galleria"
                                      images={block.images || []}
                                      onChange={(newImgs) => updateBlock(actualIdx, bIdx, "images", newImgs)}
                                    />
                                  </div>
                                )}

                                {block.type === "reviews" && (
                                  <div className="space-y-4">
                                    <FormField
                                      label="Titolo Sezione"
                                      value={block.title || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                      placeholder="es. Dicono di Noi"
                                    />
                                    <div className="space-y-3">
                                      {(block.items || []).map((rev: any, rIdx: number) => (
                                        <div key={rIdx} className="p-4 rounded-xl bg-muted/20 border border-foreground/5 space-y-3">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-foreground/60">Recensione #{rIdx + 1}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = block.items.filter((_: any, i: number) => i !== rIdx);
                                                updateBlock(actualIdx, bIdx, "items", updated);
                                              }}
                                              className="text-xs text-rose-400 hover:underline"
                                            >
                                              Elimina
                                            </button>
                                          </div>
                                          <FormField
                                            label="Citazione"
                                            value={rev.quote || ""}
                                            onChange={(v) => {
                                              const updated = [...block.items];
                                              updated[rIdx] = { ...updated[rIdx], quote: v };
                                              updateBlock(actualIdx, bIdx, "items", updated);
                                            }}
                                            type="textarea"
                                            rows={2}
                                          />
                                          <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                              label="Autore / Testata"
                                              value={rev.author || ""}
                                              onChange={(v) => {
                                                const updated = [...block.items];
                                                updated[rIdx] = { ...updated[rIdx], author: v };
                                                updateBlock(actualIdx, bIdx, "items", updated);
                                              }}
                                            />
                                            <FormField
                                              label="Stelle (1-5)"
                                              type="number"
                                              value={rev.rating || 5}
                                              onChange={(v) => {
                                                const updated = [...block.items];
                                                updated[rIdx] = { ...updated[rIdx], rating: Number(v) };
                                                updateBlock(actualIdx, bIdx, "items", updated);
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const items = block.items || [];
                                          updateBlock(actualIdx, bIdx, "items", [
                                            ...items,
                                            { quote: "Recensione positiva...", author: "Pubblico", rating: 5 }
                                          ]);
                                        }}
                                        className="text-xs text-primary font-bold hover:underline"
                                      >
                                        + Aggiungi Recensione
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {block.type === "faq" && (
                                  <div className="space-y-4">
                                    <FormField
                                      label="Titolo Sezione FAQ"
                                      value={block.title || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                      placeholder="es. Domande Frequenti"
                                    />
                                    <div className="space-y-3">
                                      {(block.items || []).map((faq: any, fIdx: number) => (
                                        <div key={fIdx} className="p-4 rounded-xl bg-muted/20 border border-foreground/5 space-y-3">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-foreground/60">Domanda #{fIdx + 1}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = block.items.filter((_: any, i: number) => i !== fIdx);
                                                updateBlock(actualIdx, bIdx, "items", updated);
                                              }}
                                              className="text-xs text-rose-400 hover:underline"
                                            >
                                              Elimina
                                            </button>
                                          </div>
                                          <FormField
                                            label="Domanda"
                                            value={faq.question || ""}
                                            onChange={(v) => {
                                              const updated = [...block.items];
                                              updated[fIdx] = { ...updated[fIdx], question: v };
                                              updateBlock(actualIdx, bIdx, "items", updated);
                                            }}
                                          />
                                          <FormField
                                            label="Risposta"
                                            value={faq.answer || ""}
                                            onChange={(v) => {
                                              const updated = [...block.items];
                                              updated[fIdx] = { ...updated[fIdx], answer: v };
                                              updateBlock(actualIdx, bIdx, "items", updated);
                                            }}
                                            type="textarea"
                                            rows={2}
                                          />
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const items = block.items || [];
                                          updateBlock(actualIdx, bIdx, "items", [
                                            ...items,
                                            { question: "Nuova domanda...", answer: "Risposta chiara e utile." }
                                          ]);
                                        }}
                                        className="text-xs text-primary font-bold hover:underline"
                                      >
                                        + Aggiungi Domanda FAQ
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {block.type === "closing_cta" && (
                                  <div className="space-y-4">
                                    <FormField
                                      label="Titolo del Banner"
                                      value={block.title || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                      placeholder="es. Non perdere l'occasione"
                                    />
                                    <FormField
                                      label="Testo Motivazionale"
                                      value={block.text || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "text", v)}
                                      type="textarea"
                                      rows={2}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Etichetta Pulsante"
                                        value={block.cta_label || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "cta_label", v)}
                                      />
                                      <FormField
                                        label="Link Pulsante"
                                        value={block.cta_href || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "cta_href", v)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionCard>
              );
            })}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
