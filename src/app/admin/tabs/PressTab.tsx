"use client";

import React from "react";
import { Plus, Newspaper, MessageSquareQuote, Mail } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function PressTab() {
  const { content, updateContent } = useAdmin();
  const pressData = content?.pages?.parlano_di_noi || {
    title: "Dicono di Noi",
    description: "",
    press: [],
    press_contact: {}
  };

  const pressList = pressData.press || [];

  const addArticle = () => {
    updateContent("pages.parlano_di_noi.press", [
      ...pressList,
      {
        source: "Nuova Testata / Fonte",
        quote: "Inserisci qui la citazione...",
        date: new Date().getFullYear().toString(),
        source_href: "",
        badge_label: "Recensione"
      }
    ]);
  };

  const removeArticle = (idx: number) => {
    updateContent(
      "pages.parlano_di_noi.press",
      pressList.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveArticle = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= pressList.length) return;
    const next = [...pressList];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("pages.parlano_di_noi.press", next);
  };

  const updateArticle = (idx: number, field: string, value: any) => {
    const next = [...pressList];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("pages.parlano_di_noi.press", next);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Press Articles Section */}
      <AdminSection
        title="Rassegna Stampa & Recensioni"
        description="Gestisci gli articoli di giornale, le recensioni del pubblico e le interviste."
        icon={Newspaper}
        action={
          <button
            type="button"
            onClick={addArticle}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Articolo
          </button>
        }
      >
        <div className="space-y-4 pb-6 border-b border-foreground/5">
          <FormField
            label="Titolo Pagina"
            value={pressData.title || ""}
            onChange={(v) => updateContent("pages.parlano_di_noi.title", v)}
          />
          <FormField
            label="Descrizione Pagina"
            value={pressData.description || ""}
            onChange={(v) => updateContent("pages.parlano_di_noi.description", v)}
            type="textarea"
            rows={2}
          />
        </div>

        <div className="space-y-4">
          {pressList.map((item: any, idx: number) => (
            <AccordionCard
              key={idx}
              title={item.source || "Senza Fonte"}
              subtitle={item.date ? `Anno ${item.date}` : undefined}
              badge={item.badge_label || "Recensione"}
              badgeColor="rose"
              index={idx}
              total={pressList.length}
              onMoveUp={() => moveArticle(idx, -1)}
              onMoveDown={() => moveArticle(idx, 1)}
              onDelete={() => removeArticle(idx)}
            >
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Testata / Fonte"
                    value={item.source || ""}
                    onChange={(v) => updateArticle(idx, "source", v)}
                    placeholder="es. Corriere del Ticino"
                    required
                  />
                  <FormField
                    label="URL Articolo Originale"
                    value={item.source_href || ""}
                    onChange={(v) => updateArticle(idx, "source_href", v)}
                    placeholder="https://..."
                  />
                </div>

                <FormField
                  label="Citazione Estrapolata"
                  value={item.quote || ""}
                  onChange={(v) => updateArticle(idx, "quote", v)}
                  type="textarea"
                  rows={3}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Anno / Data"
                    value={item.date || ""}
                    onChange={(v) => updateArticle(idx, "date", v)}
                    placeholder="2025"
                  />
                  <FormField
                    label="Etichetta Badge"
                    value={item.badge_label || ""}
                    onChange={(v) => updateArticle(idx, "badge_label", v)}
                    placeholder="Recensione / Intervista"
                  />
                </div>
              </div>
            </AccordionCard>
          ))}
        </div>
      </AdminSection>

      {/* Press Contact CTA */}
      <AdminSection
        title="Contatto Ufficio Stampa"
        description="Riquadro di invito per giornalisti e redazioni."
        icon={Mail}
      >
        <div className="space-y-4">
          <FormField
            label="Titolo Box Stampa"
            value={pressData.press_contact?.title || ""}
            onChange={(v) => updateContent("pages.parlano_di_noi.press_contact.title", v)}
            placeholder="Sei un giornalista?"
          />
          <FormField
            label="Testo Descrittivo"
            value={pressData.press_contact?.text || ""}
            onChange={(v) => updateContent("pages.parlano_di_noi.press_contact.text", v)}
            type="textarea"
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Testo Bottone"
              value={pressData.press_contact?.cta_label || ""}
              onChange={(v) => updateContent("pages.parlano_di_noi.press_contact.cta_label", v)}
              placeholder="Contatta Ufficio Stampa"
            />
            <FormField
              label="Destinazione Link"
              value={pressData.press_contact?.cta_href || ""}
              onChange={(v) => updateContent("pages.parlano_di_noi.press_contact.cta_href", v)}
              placeholder="mailto:info@attomatti.ch"
            />
          </div>
        </div>
      </AdminSection>
    </div>
  );
}
