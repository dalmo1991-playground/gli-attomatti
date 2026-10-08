"use client";

import React from "react";
import { Plus, Users, Image as ImageIcon } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function ChiSiamoTab() {
  const { content, updateContent } = useAdmin();
  const chi = content?.pages?.chi_siamo || {
    title: "",
    description: "",
    content_sections: [],
    navigation_links: []
  };

  const sections = chi.content_sections || [];
  const navLinks = chi.navigation_links || [];

  const addSection = () => {
    updateContent("pages.chi_siamo.content_sections", [
      ...sections,
      {
        title: "Nuova Sezione",
        text: "",
        images: [],
        visible: true
      }
    ]);
  };

  const removeSection = (idx: number) => {
    updateContent(
      "pages.chi_siamo.content_sections",
      sections.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newList = [...sections];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  const updateSectionField = (idx: number, field: string, value: any) => {
    const newList = [...sections];
    newList[idx] = { ...newList[idx], [field]: value };
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  const addSectionImage = (secIdx: number) => {
    const newList = [...sections];
    if (!newList[secIdx].images) newList[secIdx].images = [];
    newList[secIdx].images.push({
      url: "/images/1782553290530-TheaterCurtain.webp",
      alt: "Foto sezione"
    });
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  const removeSectionImage = (secIdx: number, imgIdx: number) => {
    const newList = [...sections];
    newList[secIdx].images = newList[secIdx].images.filter(
      (_: any, i: number) => i !== imgIdx
    );
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  const moveSectionImage = (secIdx: number, imgIdx: number, dir: -1 | 1) => {
    const newList = [...sections];
    const targetIdx = imgIdx + dir;
    if (targetIdx < 0 || targetIdx >= newList[secIdx].images.length) return;
    [newList[secIdx].images[imgIdx], newList[secIdx].images[targetIdx]] = [
      newList[secIdx].images[targetIdx],
      newList[secIdx].images[imgIdx]
    ];
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  const updateSectionImage = (
    secIdx: number,
    imgIdx: number,
    field: string,
    value: any
  ) => {
    const newList = [...sections];
    newList[secIdx].images[imgIdx] = {
      ...newList[secIdx].images[imgIdx],
      [field]: value
    };
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Pagina Chi Siamo"
        description="I blocchi narrativi che raccontano la storia, la visione e l'anima della compagnia teatrale."
        icon={Users}
        action={
          <button
            type="button"
            onClick={addSection}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Sezione
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Titolo Pagina"
            value={chi.title}
            onChange={(v) => updateContent("pages.chi_siamo.title", v)}
          />
          <FormField
            type="textarea"
            label="Descrizione Breve"
            value={chi.description}
            onChange={(v) => updateContent("pages.chi_siamo.description", v)}
            rows={2}
          />
        </div>

        {/* Content Sections Accordion */}
        <div className="space-y-4 pt-6 border-t border-foreground/5">
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground/40 mb-2">
            Sezioni di Testo e Foto
          </h4>
          {sections.map((sec: any, idx: number) => (
            <AccordionCard
              key={idx}
              index={idx}
              total={sections.length}
              title={sec.title}
              subtitle={sec.text?.slice(0, 60) + (sec.text?.length > 60 ? "..." : "")}
              badge={sec.images?.length ? `${sec.images.length} foto` : undefined}
              onMoveUp={() => moveSection(idx, -1)}
              onMoveDown={() => moveSection(idx, 1)}
              onDelete={() => removeSection(idx)}
              defaultOpen={idx === 0}
            >
              <div className="space-y-6">
                <FormField
                  label="Titolo Sezione"
                  value={sec.title}
                  onChange={(v) => updateSectionField(idx, "title", v)}
                />
                <FormField
                  type="richtext"
                  label="Corpo del Testo"
                  value={sec.text}
                  onChange={(v) => updateSectionField(idx, "text", v)}
                  rows={5}
                />

                {/* Images in section - Exact same modalita as Home page backstage gallery */}
                <div className="space-y-4 pt-4 border-t border-foreground/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                        <ImageIcon size={14} className="text-primary" /> Galleria Immagini della Sezione
                      </h5>
                      <p className="text-[11px] text-foreground/40 mt-0.5">
                        Le foto ruoteranno in carosello automatico esattamente come nella home page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSectionImage(idx)}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Aggiungi Immagine
                    </button>
                  </div>

                  {(!sec.images || sec.images.length === 0) ? (
                    <p className="text-xs text-foreground/30 italic py-2">
                      Nessuna foto assegnata a questa sezione.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sec.images.map((img: any, imgIdx: number) => (
                        <AccordionCard
                          key={imgIdx}
                          index={imgIdx}
                          total={sec.images.length}
                          title={img.alt || `Foto ${imgIdx + 1}`}
                          subtitle={img.url}
                          thumbnail={img.url}
                          onMoveUp={() => moveSectionImage(idx, imgIdx, -1)}
                          onMoveDown={() => moveSectionImage(idx, imgIdx, 1)}
                          onDelete={() => removeSectionImage(idx, imgIdx)}
                        >
                          <div className="space-y-4">
                            <FormField
                              label="Testo Alternativo (SEO)"
                              value={img.alt}
                              onChange={(v) => updateSectionImage(idx, imgIdx, "alt", v)}
                              placeholder="Didascalia o descrizione foto"
                            />
                            <ImageUploadField
                              label="Foto"
                              value={img.url}
                              onChange={(v) => updateSectionImage(idx, imgIdx, "url", v)}
                              aspect="video"
                            />
                          </div>
                        </AccordionCard>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </AccordionCard>
          ))}
        </div>
      </AdminSection>

      {/* Internal Navigation Cards */}
      <AdminSection
        title="Card di Navigazione"
        description="I pulsanti a fondo pagina che rimandano ad altre sezioni (Cast, Dicono di Noi, ecc.)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navLinks.map((link: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-muted/40 border border-foreground/5 space-y-3"
            >
              <FormField
                label="Etichetta"
                value={link.label}
                onChange={(v) => {
                  const newList = [...navLinks];
                  newList[idx].label = v;
                  updateContent("pages.chi_siamo.navigation_links", newList);
                }}
              />
              <FormField
                label="Link Destinazione"
                value={link.href}
                onChange={(v) => {
                  const newList = [...navLinks];
                  newList[idx].href = v;
                  updateContent("pages.chi_siamo.navigation_links", newList);
                }}
              />
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
