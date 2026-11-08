"use client";

import React, { useState } from "react";
import {
  Link2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Globe,
  Share2,
  Palette,
  Check,
  Mail,
  Copy,
  Layout,
  Sliders,
  Eye,
  EyeOff
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import Link from "next/link";

const ICON_OPTIONS = [
  { label: "Sparkles (Stella/Speciale)", value: "Sparkles" },
  { label: "Ticket (Biglietto/Spettacolo)", value: "Ticket" },
  { label: "Theater (Teatro)", value: "Theater" },
  { label: "Calendar (Data/Evento)", value: "Calendar" },
  { label: "Mail (Newsletter/Email)", value: "Mail" },
  { label: "Globe (Sito/Web)", value: "Globe" },
  { label: "MapPin (Location/Mappa)", value: "MapPin" },
  { label: "Users (Chi Siamo/Cast)", value: "Users" },
  { label: "Compass (Corsi/Iniziative)", value: "Compass" },
  { label: "Heart (Sostienici/Donazioni)", value: "Heart" },
  { label: "Video (Video/Trailer)", value: "Video" },
  { label: "Music (Audio/Musica)", value: "Music" },
  { label: "HelpCircle (FAQ/Aiuto)", value: "HelpCircle" },
  { label: "Info (Informazioni)", value: "Info" },
];

const PRESET_OPTIONS = [
  { label: "Dark Modern (Default)", value: "dark" },
  { label: "Midnight Blue (Blu Notte)", value: "midnight" },
  { label: "Theatre Red (Velluto Teatrale)", value: "theatre" },
  { label: "Minimalist Black (Nero Puro)", value: "minimal" },
  { label: "Clean Light (Chiaro)", value: "light" },
];

const BUTTON_STYLE_OPTIONS = [
  { label: "Bordi Arrotondati (Modern)", value: "rounded" },
  { label: "Pillola (Arrotondato al 100%)", value: "pill" },
  { label: "Squadrato (Brutalist)", value: "sharp" },
];

const BUTTON_VARIANT_OPTIONS = [
  { label: "Pieno con contrasto (Filled)", value: "filled" },
  { label: "Effetto Vetro Traslucido (Glassmorphism)", value: "glass" },
  { label: "Bordo Sottile (Outline)", value: "outline" },
];

export function LinktreeTab() {
  const { content, updateContent } = useAdmin();
  const linktree = content?.linktree || {};
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Helper per aggiornare campi radice di linktree
  const updateLinktreeField = (field: string, val: any) => {
    updateContent(`linktree.${field}`, val);
  };

  // Helper per aggiornare il profilo
  const updateProfile = (field: string, val: any) => {
    updateContent(`linktree.profile.${field}`, val);
  };

  // Helper per aggiornare il tema
  const updateTheme = (field: string, val: any) => {
    updateContent(`linktree.theme.${field}`, val);
  };

  // Sezioni
  const sections: any[] = Array.isArray(linktree.sections) ? linktree.sections : [];
  const links: any[] = Array.isArray(linktree.links) ? linktree.links : [];
  const socialLinks: any[] = Array.isArray(linktree.social_links) ? linktree.social_links : [];

  // Aggiungi nuovo link
  const handleAddLink = (sectionId?: string) => {
    const newLink = {
      id: `link-${Date.now()}`,
      title: "Nuovo Link",
      subtitle: "",
      url: "/",
      icon: "Sparkles",
      featured: false,
      visible: true,
      section_id: sectionId || "",
    };
    updateContent("linktree.links", [newLink, ...links]);
  };

  // Aggiorna singolo link
  const updateLink = (index: number, patch: Partial<any>) => {
    const updated = [...links];
    updated[index] = { ...updated[index], ...patch };
    updateContent("linktree.links", updated);
  };

  // Elimina link
  const handleDeleteLink = (index: number) => {
    const updated = links.filter((_, idx) => idx !== index);
    updateContent("linktree.links", updated);
  };

  // Sposta su/giù link
  const handleMoveLink = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const updated = [...links];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    updateContent("linktree.links", updated);
  };

  // Aggiungi Sezione
  const handleAddSection = () => {
    const newSection = {
      id: `sec-${Date.now()}`,
      title: "Nuova Sezione",
      visible: true,
    };
    updateContent("linktree.sections", [...sections, newSection]);
  };

  const updateSection = (index: number, patch: Partial<any>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...patch };
    updateContent("linktree.sections", updated);
  };

  const handleDeleteSection = (secId: string) => {
    const updatedSections = sections.filter((s) => s.id !== secId);
    // Rimuovi anche il section_id dai link associati
    const updatedLinks = links.map((l) =>
      l.section_id === secId ? { ...l, section_id: "" } : l
    );
    updateContent("linktree.sections", updatedSections);
    updateContent("linktree.links", updatedLinks);
  };

  // Social Links
  const updateSocialLink = (index: number, patch: Partial<any>) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], ...patch };
    updateContent("linktree.social_links", updated);
  };

  const handleAddSocial = () => {
    const newSocial = {
      platform: "Instagram",
      url: "",
      visible: true,
    };
    updateContent("linktree.social_links", [...socialLinks, newSocial]);
  };

  const handleDeleteSocial = (index: number) => {
    const updated = socialLinks.filter((_, idx) => idx !== index);
    updateContent("linktree.social_links", updated);
  };

  const copyLiveUrl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://gliattomatti.ch/links");
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Intestazione del Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-foreground/10 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Link2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Linktree / Bio Links Instagram
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground/60 max-w-xl">
            Pagina mobile-first pensata per il link in bio di Instagram, biglietti da visita o QR code.
            Modifica link, grafica, sezioni e visualizza l&apos;anteprima istantanea.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLiveUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors border border-foreground/10"
            title="Copia URL pubblico"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "Copiato!" : "Copia /links"}</span>
          </button>

          <Link
            href="/links"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:brightness-105 transition-all shadow-sm"
          >
            <span>Apri Pagina</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Profilo & Testata */}
      <AdminSection
        title="Profilo & Dati Principali"
        description="Imposta l'avatar, il nome della compagnia, la bio e il badge di verifica."
      >
        <div className="space-y-4">
          <ImageUploadField
            label="Avatar / Foto Profilo (Consigliata quadrata)"
            value={linktree.profile?.avatar || ""}
            onChange={(val) => updateProfile("avatar", val)}
            helpText="Carica il logo della compagnia o una foto di scena rappresentativa."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Titolo Principale"
              value={linktree.profile?.title || ""}
              onChange={(val) => updateProfile("title", val)}
              placeholder="Gli Attomatti"
            />
            <FormField
              label="Badge / Etichetta (Opzionale)"
              value={linktree.profile?.badge || ""}
              onChange={(val) => updateProfile("badge", val)}
              placeholder="Compagnia Teatrale"
            />
          </div>

          <FormField
            label="Biografia Breve (Supporta a capo)"
            type="textarea"
            rows={3}
            value={linktree.profile?.bio || ""}
            onChange={(val) => updateProfile("bio", val)}
            placeholder="🎭 Compagnia Teatrale Italiana a Zurigo&#10;Spettacoli, improvvisazione ed eventi."
          />

          <div className="pt-2">
            <FormField
              label="Mostra icona profilo verificato"
              type="switch"
              value={linktree.profile?.show_verified ?? true}
              onChange={(val) => updateProfile("show_verified", val)}
              helpText="Mostra la spunta di autenticità sull'avatar."
            />
          </div>
        </div>
      </AdminSection>

      {/* Personalizzazione Grafica / Tema */}
      <AdminSection
        title="Stile Grafico & Aspetto"
        description="Scegli la palette di colori, la forma dei bottoni e gli effetti speciali (ad es. pulsante in evidenza)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="Preset Tema Colori"
            type="select"
            value={linktree.theme?.preset || "dark"}
            onChange={(val) => updateTheme("preset", val)}
            options={PRESET_OPTIONS}
          />
          <FormField
            label="Forma dei Bottoni"
            type="select"
            value={linktree.theme?.button_style || "rounded"}
            onChange={(val) => updateTheme("button_style", val)}
            options={BUTTON_STYLE_OPTIONS}
          />
          <FormField
            label="Variante dei Bottoni"
            type="select"
            value={linktree.theme?.button_variant || "filled"}
            onChange={(val) => updateTheme("button_variant", val)}
            options={BUTTON_VARIANT_OPTIONS}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-foreground/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Evidenzia visivamente i link 'In Evidenza'"
            type="switch"
            value={linktree.theme?.glow_featured ?? true}
            onChange={(val) => updateTheme("glow_featured", val)}
            helpText="Applica un bagliore neon primario e risalto ai link contrassegnati come Hot / In primo piano."
          />
          <FormField
            label="Testo Footer"
            value={linktree.footer_text || ""}
            onChange={(val) => updateLinktreeField("footer_text", val)}
            placeholder="Gli Attomatti • Compagnia Teatrale Zurigo"
          />
        </div>
      </AdminSection>

      {/* Social Network in Testata */}
      <AdminSection
        title="Icone Social in Alto"
        description="Pulsanti rapidi per Instagram, Facebook, WhatsApp, Email, ecc."
      >
        <div className="space-y-3">
          {socialLinks.map((social, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-foreground/10"
            >
              <div className="w-1/3">
                <FormField
                  value={social.platform}
                  onChange={(val) => updateSocialLink(idx, { platform: val })}
                  placeholder="Piattaforma (Instagram, Facebook, Email...)"
                />
              </div>
              <div className="flex-1">
                <FormField
                  value={social.url}
                  onChange={(val) => updateSocialLink(idx, { url: val })}
                  placeholder="https://... o mailto:..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSocialLink(idx, { visible: !social.visible })}
                  className={`p-2 rounded-lg border transition-colors ${
                    social.visible !== false
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-foreground/40 border-foreground/10"
                  }`}
                  title={social.visible !== false ? "Visibile" : "Nascosto"}
                >
                  {social.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSocial(idx)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-colors"
                  title="Elimina social"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSocial}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors border border-dashed border-foreground/20"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Icona Social</span>
          </button>
        </div>
      </AdminSection>

      {/* Gestione Sezioni Categoria */}
      <AdminSection
        title="Sezioni / Categorie Link (Opzionale)"
        description="Puoi organizzare i link in categorie (es. 'In Primo Piano', 'Iscrizioni', 'Scopri di Più')."
      >
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-foreground/10"
            >
              <div className="flex-1">
                <FormField
                  value={section.title}
                  onChange={(val) => updateSection(idx, { title: val })}
                  placeholder="Titolo Sezione (es. Biglietti & Spettacoli)"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSection(idx, { visible: !section.visible })}
                  className={`p-2 rounded-lg border transition-colors ${
                    section.visible !== false
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-foreground/40 border-foreground/10"
                  }`}
                  title={section.visible !== false ? "Sezione visibile" : "Sezione nascosta"}
                >
                  {section.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSection(section.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-colors"
                  title="Elimina Sezione"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSection}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors border border-dashed border-foreground/20"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Sezione</span>
          </button>
        </div>
      </AdminSection>

      {/* Gestione Link Primari */}
      <AdminSection
        title={`Pulsanti e Link (${links.length})`}
        description="I pulsanti visualizzati dagli utenti su smartphone e Instagram. Ordinali trascinando o con i tasti freccia."
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleAddLink()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:brightness-105 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Nuovo Link</span>
            </button>
          </div>

          {links.map((item, idx) => {
            const sectionOptions = [
              { label: "Nessuna Sezione (Elenco standard)", value: "" },
              ...sections.map((s) => ({ label: s.title || "Senza titolo", value: s.id })),
            ];

            return (
              <AccordionCard
                key={item.id || idx}
                title={item.title || "Link senza titolo"}
                subtitle={item.url || "Nessun indirizzo impostato"}
                badge={item.featured ? "IN PRIMO PIANO" : item.visible === false ? "NASCOSTO" : undefined}
                badgeColor={item.featured ? "primary" : "muted"}
                index={idx}
                total={links.length}
                onMoveUp={idx > 0 ? () => handleMoveLink(idx, "up") : undefined}
                onMoveDown={idx < links.length - 1 ? () => handleMoveLink(idx, "down") : undefined}
                onDelete={() => handleDeleteLink(idx)}
                defaultOpen={idx === 0}
              >
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Titolo del Bottone"
                      value={item.title || ""}
                      onChange={(val) => updateLink(idx, { title: val })}
                      placeholder="es. 🎭 Prenota Spettacolo"
                    />
                    <FormField
                      label="Sottotitolo / Didascalia (Opzionale)"
                      value={item.subtitle || ""}
                      onChange={(val) => updateLink(idx, { subtitle: val })}
                      placeholder="es. Date di maggio a Zurigo"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Destinazione URL"
                      value={item.url || ""}
                      onChange={(val) => updateLink(idx, { url: val })}
                      placeholder="https://... o /landing/... o /Spettacoli"
                      helpText="Può essere un link interno (/Spettacoli) o esterno (https://...)."
                    />
                    <FormField
                      label="Sezione di Appartenenza"
                      type="select"
                      value={item.section_id || ""}
                      onChange={(val) => updateLink(idx, { section_id: val })}
                      options={sectionOptions}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Icona del Bottone"
                      type="select"
                      value={item.icon || "Sparkles"}
                      onChange={(val) => updateLink(idx, { icon: val })}
                      options={ICON_OPTIONS}
                    />
                    <div className="space-y-2">
                      <ImageUploadField
                        label="Oppure Mini-Foto / Thumbnail (Opzionale)"
                        value={item.thumbnail || ""}
                        onChange={(val) => updateLink(idx, { thumbnail: val })}
                        helpText="Se impostata, sostituisce l'icona con una miniatura rotonda."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-foreground/10">
                    <FormField
                      label="Evidenziato / In Primo Piano"
                      type="switch"
                      value={Boolean(item.featured)}
                      onChange={(val) => updateLink(idx, { featured: val })}
                      helpText="Mette in risalto il pulsante con colori accesi e bagliore."
                    />
                    <FormField
                      label="Visibile pubblicamente"
                      type="switch"
                      value={item.visible !== false}
                      onChange={(val) => updateLink(idx, { visible: val })}
                      helpText="Disattiva per nascondere il link senza cancellarlo."
                    />
                  </div>
                </div>
              </AccordionCard>
            );
          })}

          {links.length === 0 && (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-foreground/20 text-foreground/60 text-sm">
              Non hai ancora inserito nessun link. Clicca su &quot;Aggiungi Nuovo Link&quot; in alto per iniziare.
            </div>
          )}
        </div>
      </AdminSection>

      {/* SEO & Meta Tags */}
      <AdminSection
        title="SEO & Condivisione Social"
        description="Personalizza come la pagina /links appare su WhatsApp, Telegram o nelle anteprime."
      >
        <div className="space-y-4">
          <FormField
            label="Titolo Meta della Pagina"
            value={linktree.meta_title || ""}
            onChange={(val) => updateLinktreeField("meta_title", val)}
            placeholder="Gli Attomatti — Tutti i Link Ufficiali"
          />
          <FormField
            label="Descrizione Meta"
            type="textarea"
            rows={2}
            value={linktree.meta_description || ""}
            onChange={(val) => updateLinktreeField("meta_description", val)}
            placeholder="Tutti i link ufficiali della compagnia teatrale Gli Attomatti di Zurigo..."
          />
        </div>
      </AdminSection>
    </div>
  );
}
