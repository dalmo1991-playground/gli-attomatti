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
  Layout,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  Megaphone,
  Ticket,
  ClipboardList,
  Hash,
  Copy,
  Check,
  Link2
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { GalleryField } from "../components/ui/GalleryField";
import { LandingThemeEditor } from "../components/ui/LandingThemeEditor";
import { DEFAULT_THEME_PRESET } from "@/lib/landingThemes";
import {
  getBlockAnchor,
  getDefaultBlockAnchor,
  sanitizeAnchor,
  getAllLandingAnchors
} from "@/lib/landingAnchors";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Quick-pick pill buttons to easily fill an anchor into a link field
 */
function AnchorQuickPick({
  anchors,
  currentHref,
  onSelect
}: {
  anchors: { anchor: string; label: string }[];
  currentHref?: string;
  onSelect: (href: string) => void;
}) {
  if (!anchors || anchors.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
      <span className="text-[10px] uppercase font-bold text-foreground/40 flex items-center gap-1">
        <Hash size={10} /> Ancore pagina:
      </span>
      {anchors.map((a) => {
        const href = `#${a.anchor}`;
        const isSelected = currentHref === href;
        return (
          <button
            key={a.anchor}
            type="button"
            onClick={() => onSelect(href)}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-mono font-medium transition-colors border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 hover:bg-primary/10 hover:text-primary text-foreground/70 border-foreground/5"
            )}
            title={`Usa ${href} (${a.label})`}
          >
            #{a.anchor}
          </button>
        );
      })}
    </div>
  );
}

const BLOCK_TYPES = [
  { type: "hero", label: "Hero Header", icon: Layout, desc: "Titolo d'impatto, sfondo e CTA principale" },
  { type: "event_details", label: "Data, Orario & Luogo", icon: Calendar, desc: "Card con dettagli data, mappa e prezzo" },
  { type: "eventfrog", label: "Cassa Biglietti Eventfrog", icon: Ticket, desc: "Embed ufficiale di Eventfrog per acquistare i biglietti direttamente sulla landing" },
  { type: "tally", label: "Modulo Tally (Registrazione)", icon: ClipboardList, desc: "Embed ufficiale Tally.so per iscrizioni, corsi o registrazioni" },
  { type: "synopsis", label: "Trama & Sinossi", icon: BookOpen, desc: "Descrizione narrativa, citazione e foto" },
  { type: "gallery", label: "Galleria Fotografica", icon: ImageIcon, desc: "Scatti di scena con lightbox" },
  { type: "reviews", label: "Recensioni & Critica", icon: MessageSquare, desc: "Social proof e stelle di gradimento" },
  { type: "faq", label: "Domande Frequenti (FAQ)", icon: HelpCircle, desc: "Fisarmonica con risposte alle domande" },
  { type: "closing_cta", label: "Banner CTA Finale", icon: Megaphone, desc: "Pulsante di chiusura ad alta conversione" }
];

export interface LandingTabProps {
  selectedSlug?: string;
  onSelectSlug?: (slug: string) => void;
  onRequestPreview?: (slug: string) => void;
}

export function LandingTab({
  selectedSlug,
  onSelectSlug,
  onRequestPreview
}: LandingTabProps = {}) {
  const { content, updateContent } = useAdmin();
  const landings = content?.landings || [];
  const [search, setSearch] = useState("");
  const [activeLandingIdx, setActiveLandingIdx] = useState<number | null>(0);
  const [copiedAnchor, setCopiedAnchor] = useState<string | null>(null);

  // Sync active landing index when selectedSlug changes externally
  React.useEffect(() => {
    if (selectedSlug && landings.length > 0) {
      const idx = landings.findIndex((l: any) => l.slug === selectedSlug);
      if (idx !== -1 && idx !== activeLandingIdx) {
        setActiveLandingIdx(idx);
      }
    }
  }, [selectedSlug, landings]);

  const addLanding = () => {
    const newId = `landing-${Date.now()}`;
    const newLanding = {
      id: newId,
      slug: `promozione-${Date.now()}`,
      title: "Nuova Landing Page",
      active: true,
      theme_color: "primary",
      theme: {
        preset: "default",
        ...DEFAULT_THEME_PRESET.colors
      },
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
    onSelectSlug?.(newLanding.slug);
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
    } else if (type === "eventfrog") {
      newBlock = {
        ...newBlock,
        title: "Biglietti & Prenotazioni Online",
        subtitle: "Seleziona i posti e acquista i tuoi biglietti direttamente qui in totale sicurezza.",
        eventfrog_url: "",
        fallback_label: "Apri su Eventfrog",
        show_terms_note: true
      };
    } else if (type === "tally") {
      newBlock = {
        ...newBlock,
        title: "Iscrizione Online",
        subtitle: "Compila il modulo sottostante per confermare la tua partecipazione.",
        tally_url: "",
        fallback_label: "Apri modulo Tally",
        show_privacy_note: true
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
              const availableAnchors = getAllLandingAnchors(landing);

              return (
                <div
                  key={actualIdx}
                  onClick={() => {
                    if (landing.slug) onSelectSlug?.(landing.slug);
                  }}
                >
                  <AccordionCard
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
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                            Impostazioni Generali
                          </h4>
                          {landing.slug && (
                            <div className="flex items-center gap-3">
                              {onRequestPreview && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSlug?.(landing.slug);
                                    onRequestPreview(landing.slug);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary font-bold transition-colors cursor-pointer"
                                  title="Apri nel pannello anteprima affiancato"
                                >
                                  <Layers size={13} />
                                  <span>Anteprima Affiancata</span>
                                </button>
                              )}
                              <Link
                                href={`/landing/${landing.slug}?preview=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                                title="Apri l'anteprima in tempo reale in una nuova scheda"
                              >
                                <span>Nuova Scheda</span>
                                <ExternalLink size={12} />
                              </Link>
                            </div>
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

                      <div className="pt-2 border-t border-foreground/5 space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-wider text-foreground/80">
                          Barra Superiore (Header & Logo)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            label="Testo Logo in Testata"
                            value={landing.header?.logo_text || ""}
                            onChange={(v) => updateLanding(actualIdx, "header.logo_text", v)}
                            placeholder="es. Gli Attomatti o Gli Attomatti & UNITRE"
                            helpText="Testo principale mostrato in alto a sinistra (se vuoto, usa 'Gli Attomatti')."
                          />
                          <FormField
                            label="Sottotitolo Testata"
                            value={landing.header?.subtitle || ""}
                            onChange={(v) => updateLanding(actualIdx, "header.subtitle", v)}
                            placeholder="es. Teatro a Zurigo"
                            helpText="Dicitura secondaria sotto il titolo (se vuoto, usa 'Teatro a Zurigo')."
                          />
                        </div>

                        <ImageUploadField
                          label="Icona / Logo Personalizzato (Opzionale)"
                          value={landing.header?.logo_image || ""}
                          onChange={(url) => updateLanding(actualIdx, "header.logo_image", url)}
                          helpText="Se non specificato, viene usato il logo ufficiale Gli Attomatti, che adatta in automatico la scritta sottostante (nera/scura su sfondi chiari, bianca su sfondi scuri)."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-foreground/5">
                        <FormField
                          label="Testo Pulsante CTA in Testata"
                          value={landing.header?.cta_label || ""}
                          onChange={(v) => updateLanding(actualIdx, "header.cta_label", v)}
                          placeholder="es. Acquista Biglietti"
                        />
                        <div>
                          <FormField
                            label="Link Pulsante CTA in Testata"
                            value={landing.header?.cta_href || ""}
                            onChange={(v) => updateLanding(actualIdx, "header.cta_href", v)}
                            placeholder="https://eventfrog.ch/... o #biglietti"
                          />
                          <AnchorQuickPick
                            anchors={availableAnchors}
                            currentHref={landing.header?.cta_href}
                            onSelect={(href) => updateLanding(actualIdx, "header.cta_href", href)}
                          />
                        </div>
                      </div>

                      {/* Header Nav Links (Anchor Menu) */}
                      <div className="pt-2 border-t border-foreground/5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
                              <Link2 size={13} className="text-primary" /> Voci di Menu Testata (Opzionale)
                            </h5>
                            <p className="text-[11px] text-foreground/40 mt-0.5">
                              Crea un menu con ancore (#sezione) visibile nella barra superiore.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {availableAnchors.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const generated = availableAnchors
                                    .filter((a) => a.type !== "hero" && a.type !== "closing_cta")
                                    .map((a) => ({ label: a.label, href: `#${a.anchor}` }));
                                  updateLanding(actualIdx, "header.nav_links", generated);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary text-[11px] font-bold border border-secondary/20 transition-all flex items-center gap-1"
                                title="Genera automaticamente le voci di menu dai blocchi della pagina"
                              >
                                <Layers size={12} />
                                <span>Genera dai Blocchi</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const current = landing.header?.nav_links || [];
                                updateLanding(actualIdx, "header.nav_links", [
                                  ...current,
                                  { label: "Nuova Voce", href: availableAnchors[0] ? `#${availableAnchors[0].anchor}` : "#" }
                                ]);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold border border-primary/20 transition-all flex items-center gap-1"
                            >
                              <Plus size={12} />
                              <span>Aggiungi Voce</span>
                            </button>
                          </div>
                        </div>

                        {(!landing.header?.nav_links || landing.header.nav_links.length === 0) ? (
                          <p className="text-xs text-foreground/30 italic py-1">
                            Nessuna voce di menu configurata (la testata mostrerà logo e CTA). Clicca su &quot;Genera dai Blocchi&quot; per creare un menu ad ancore con 1 click.
                          </p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            {landing.header.nav_links.map((link: any, lIdx: number) => (
                              <div key={lIdx} className="flex items-center gap-2 bg-background/50 p-2.5 rounded-xl border border-foreground/5">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={link.label || ""}
                                    onChange={(e) => {
                                      const next = [...(landing.header?.nav_links || [])];
                                      next[lIdx] = { ...next[lIdx], label: e.target.value };
                                      updateLanding(actualIdx, "header.nav_links", next);
                                    }}
                                    placeholder="Etichetta (es. Dettagli)"
                                    className="w-full bg-background px-3 py-1.5 rounded-lg border border-foreground/10 text-xs font-semibold focus:border-primary outline-none"
                                  />
                                  <div>
                                    <input
                                      type="text"
                                      value={link.href || ""}
                                      onChange={(e) => {
                                        const next = [...(landing.header?.nav_links || [])];
                                        next[lIdx] = { ...next[lIdx], href: e.target.value };
                                        updateLanding(actualIdx, "header.nav_links", next);
                                      }}
                                      placeholder="#ancora o https://"
                                      className="w-full bg-background px-3 py-1.5 rounded-lg border border-foreground/10 text-xs font-mono font-medium focus:border-primary outline-none"
                                    />
                                    <AnchorQuickPick
                                      anchors={availableAnchors}
                                      currentHref={link.href}
                                      onSelect={(href) => {
                                        const next = [...(landing.header?.nav_links || [])];
                                        next[lIdx] = { ...next[lIdx], href };
                                        updateLanding(actualIdx, "header.nav_links", next);
                                      }}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (landing.header?.nav_links || []).filter((_: any, i: number) => i !== lIdx);
                                    updateLanding(actualIdx, "header.nav_links", next);
                                  }}
                                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                                  title="Rimuovi voce"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Theme & Palette Customizer */}
                    <LandingThemeEditor
                      landing={landing}
                      onChange={(themeData) => updateLanding(actualIdx, "theme", themeData)}
                    />

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
                              placeholder="https://... o #biglietti"
                            />
                            <AnchorQuickPick
                              anchors={availableAnchors}
                              currentHref={landing.sticky_bar?.cta_href}
                              onSelect={(href) => updateLanding(actualIdx, "sticky_bar.cta_href", href)}
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
                            const activeAnchor = getBlockAnchor(block);
                            const defaultAnchor = getDefaultBlockAnchor(block.type);

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
                                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                      #{activeAnchor}
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

                                {/* Custom Anchor Configuration Bar */}
                                <div className="p-3.5 rounded-xl bg-muted/20 border border-foreground/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                      <Hash size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-foreground/60">
                                          Ancora di Sezione (Anchor ID)
                                        </label>
                                        <span className="text-[11px] text-foreground/50 font-mono">
                                          Link: <strong className="text-primary font-bold">#{activeAnchor}</strong>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-xs font-mono font-bold text-foreground/40 pl-1">#</span>
                                        <input
                                          type="text"
                                          value={block.anchor ?? ""}
                                          onChange={(e) => updateBlock(actualIdx, bIdx, "anchor", sanitizeAnchor(e.target.value))}
                                          placeholder={defaultAnchor}
                                          className="w-full bg-background px-3 py-1.5 rounded-lg border border-foreground/10 text-xs font-mono font-semibold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-foreground/30 text-foreground"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`#${activeAnchor}`);
                                        setCopiedAnchor(activeAnchor);
                                        setTimeout(() => setCopiedAnchor(null), 2000);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/80 hover:text-foreground text-xs font-bold transition-all flex items-center gap-1.5 border border-foreground/10 active:scale-95"
                                      title="Copia link ancora negli appunti"
                                    >
                                      {copiedAnchor === activeAnchor ? (
                                        <>
                                          <Check size={13} className="text-emerald-400" />
                                          <span className="text-emerald-400 font-bold">Copiato!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={13} />
                                          <span>Copia #{activeAnchor}</span>
                                        </>
                                      )}
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
                                      align={block.hero_image_align || block.image_align || "center"}
                                      onAlignChange={(align) => updateBlock(actualIdx, bIdx, "hero_image_align", align)}
                                      helpText="Imposta l'ancoraggio (Sinistra, Centro, Destra) per preservare l'elemento distintivo durante il ritaglio su mobile."
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <FormField
                                          label="Etichetta CTA Primaria"
                                          value={block.primary_cta_label || ""}
                                          onChange={(v) => updateBlock(actualIdx, bIdx, "primary_cta_label", v)}
                                          placeholder="es. Acquista Biglietti"
                                        />
                                        <div className="mt-2">
                                          <FormField
                                            label="Link CTA Primaria"
                                            value={block.primary_cta_href || ""}
                                            onChange={(v) => updateBlock(actualIdx, bIdx, "primary_cta_href", v)}
                                            placeholder="https://... o #biglietti"
                                          />
                                          <AnchorQuickPick
                                            anchors={availableAnchors}
                                            currentHref={block.primary_cta_href}
                                            onSelect={(href) => updateBlock(actualIdx, bIdx, "primary_cta_href", href)}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <FormField
                                          label="Etichetta CTA Secondaria"
                                          value={block.secondary_cta_label || ""}
                                          onChange={(v) => updateBlock(actualIdx, bIdx, "secondary_cta_label", v)}
                                          placeholder="es. Dettagli Evento"
                                        />
                                        <div className="mt-2">
                                          <FormField
                                            label="Link CTA Secondaria"
                                            value={block.secondary_cta_href || ""}
                                            onChange={(v) => updateBlock(actualIdx, bIdx, "secondary_cta_href", v)}
                                            placeholder="#dettagli"
                                          />
                                          <AnchorQuickPick
                                            anchors={availableAnchors}
                                            currentHref={block.secondary_cta_href}
                                            onSelect={(href) => updateBlock(actualIdx, bIdx, "secondary_cta_href", href)}
                                          />
                                        </div>
                                      </div>
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
                                      <div>
                                        <FormField
                                          label="Link Prenota"
                                          value={block.cta_href || ""}
                                          onChange={(v) => updateBlock(actualIdx, bIdx, "cta_href", v)}
                                        />
                                        <AnchorQuickPick
                                          anchors={availableAnchors}
                                          currentHref={block.cta_href}
                                          onSelect={(href) => updateBlock(actualIdx, bIdx, "cta_href", href)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {block.type === "eventfrog" && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Titolo della Sezione"
                                        value={block.title || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                        placeholder="es. Acquista i Biglietti Online"
                                      />
                                      <FormField
                                        label="Sottotitolo / Didascalia"
                                        value={block.subtitle || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "subtitle", v)}
                                        placeholder="es. Prenota comodamente in pochi secondi..."
                                      />
                                    </div>

                                    <FormField
                                      label="URL Evento Eventfrog (Link Prevendita Ufficiale)"
                                      value={block.eventfrog_url || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "eventfrog_url", v)}
                                      placeholder="https://eventfrog.ch/it/p/teatro-arte-cultura/teatro/..."
                                      helpText="Incolla l'indirizzo del tuo evento Eventfrog. Verrà incorporato a tutta larghezza in un elegante riquadro di acquisto sicuro."
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Testo Pulsante di Riserva / Fallback"
                                        value={block.fallback_label || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "fallback_label", v)}
                                        placeholder="Apri su Eventfrog"
                                        helpText="Pulsante mostrato sotto il riquadro per chi preferisce aprire Eventfrog all'esterno."
                                      />

                                      <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={block.show_terms_note !== false}
                                            onChange={(e) => updateBlock(actualIdx, bIdx, "show_terms_note", e.target.checked)}
                                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                                          />
                                          <span className="text-xs font-bold text-foreground">
                                            Mostra avviso di sicurezza e link ai Termini
                                          </span>
                                        </label>
                                      </div>
                                    </div>

                                    {block.eventfrog_url ? (
                                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-2">
                                        <span>✓ Riquadro Eventfrog configurato: la cassa sarà visibile sulla landing page.</span>
                                        <a
                                          href={block.eventfrog_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 font-bold underline shrink-0"
                                        >
                                          <span>Verifica link</span>
                                          <ExternalLink size={12} />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                                        <span>⚠️ Incolla un URL di Eventfrog sopra per visualizzare il widget di acquisto sulla landing page.</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {block.type === "tally" && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Titolo della Sezione"
                                        value={block.title || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "title", v)}
                                        placeholder="es. Iscriviti o Registrati"
                                      />
                                      <FormField
                                        label="Sottotitolo / Didascalia"
                                        value={block.subtitle || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "subtitle", v)}
                                        placeholder="es. Compila i campi per confermare la tua presenza..."
                                      />
                                    </div>

                                    <FormField
                                      label="URL Modulo Tally.so (Link del Form)"
                                      value={block.tally_url || ""}
                                      onChange={(v) => updateBlock(actualIdx, bIdx, "tally_url", v)}
                                      placeholder="https://tally.so/r/LZaPOz"
                                      helpText="Incolla l'indirizzo del tuo form Tally. Verrà incorporato a tutta larghezza in un riquadro fluido."
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        label="Testo Pulsante di Riserva / Fallback"
                                        value={block.fallback_label || ""}
                                        onChange={(v) => updateBlock(actualIdx, bIdx, "fallback_label", v)}
                                        placeholder="Apri su Tally"
                                        helpText="Pulsante mostrato sotto il riquadro per chi preferisce aprire il form a schermo intero."
                                      />

                                      <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={block.show_privacy_note !== false}
                                            onChange={(e) => updateBlock(actualIdx, bIdx, "show_privacy_note", e.target.checked)}
                                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                                          />
                                          <span className="text-xs font-bold text-foreground">
                                            Mostra avviso di conformità privacy
                                          </span>
                                        </label>
                                      </div>
                                    </div>

                                    {block.tally_url ? (
                                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-2">
                                        <span>✓ Riquadro Tally configurato: il form sarà visibile sulla landing page.</span>
                                        <a
                                          href={block.tally_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 font-bold underline shrink-0"
                                        >
                                          <span>Verifica link</span>
                                          <ExternalLink size={12} />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                                        <span>⚠️ Incolla un URL di Tally sopra per visualizzare il modulo di registrazione sulla landing page.</span>
                                      </div>
                                    )}
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
                                      <div>
                                        <FormField
                                          label="Link Pulsante"
                                          value={block.cta_href || ""}
                                          onChange={(v) => updateBlock(actualIdx, bIdx, "cta_href", v)}
                                        />
                                        <AnchorQuickPick
                                          anchors={availableAnchors}
                                          currentHref={block.cta_href}
                                          onSelect={(href) => updateBlock(actualIdx, bIdx, "cta_href", href)}
                                        />
                                      </div>
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
              </div>
            );
          })}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
