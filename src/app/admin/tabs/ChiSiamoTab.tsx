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

  // Helper to ensure each section has a blocks array for editing
  const getSectionBlocks = (sec: any) => {
    if (Array.isArray(sec.blocks) && sec.blocks.length > 0) {
      return sec.blocks;
    }
    const derived: any[] = [];
    if (sec.text) {
      derived.push({ type: "text", text: sec.text });
    }
    if (Array.isArray(sec.images) && sec.images.length > 0) {
      derived.push({ type: "gallery", images: sec.images });
    }
    return derived;
  };

  const addSection = () => {
    updateContent("pages.chi_siamo.content_sections", [
      ...sections,
      {
        title: "Nuova Sezione",
        blocks: [
          { type: "text", text: "" }
        ],
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

  // Modular Blocks operations
  const updateSectionBlocks = (secIdx: number, newBlocks: any[]) => {
    const newList = [...sections];
    const sec = { ...newList[secIdx], blocks: newBlocks };

    // Sync legacy fields so search / previews / backwards compat stay coherent
    const firstTextBlock = newBlocks.find((b) => b.type === "text");
    sec.text = firstTextBlock?.text || "";

    const allGalleryImages = newBlocks
      .filter((b) => b.type === "gallery" && Array.isArray(b.images))
      .flatMap((b) => b.images);
    sec.images = allGalleryImages;

    newList[secIdx] = sec;
    updateContent("pages.chi_siamo.content_sections", newList);
  };

  const addTextBlock = (secIdx: number) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    currentBlocks.push({ type: "text", text: "" });
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const addGalleryBlock = (secIdx: number) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    currentBlocks.push({
      type: "gallery",
      images: [
        {
          url: "/images/1782553290530-TheaterCurtain.webp",
          alt: "Foto galleria"
        }
      ]
    });
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const removeBlock = (secIdx: number, bIdx: number) => {
    const currentBlocks = getSectionBlocks(sections[secIdx]).filter(
      (_: any, i: number) => i !== bIdx
    );
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const moveBlock = (secIdx: number, bIdx: number, dir: -1 | 1) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    const targetIdx = bIdx + dir;
    if (targetIdx < 0 || targetIdx >= currentBlocks.length) return;
    [currentBlocks[bIdx], currentBlocks[targetIdx]] = [currentBlocks[targetIdx], currentBlocks[bIdx]];
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const updateTextBlock = (secIdx: number, bIdx: number, textValue: string) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    currentBlocks[bIdx] = { ...currentBlocks[bIdx], text: textValue };
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const addImageToBlock = (secIdx: number, bIdx: number) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    const imgs = Array.isArray(targetBlock.images) ? [...targetBlock.images] : [];
    imgs.push({
      url: "/images/1782553290530-TheaterCurtain.webp",
      alt: "Foto galleria"
    });
    targetBlock.images = imgs;
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const removeImageFromBlock = (secIdx: number, bIdx: number, imgIdx: number) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    targetBlock.images = (targetBlock.images || []).filter((_: any, i: number) => i !== imgIdx);
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const moveImageInBlock = (secIdx: number, bIdx: number, imgIdx: number, dir: -1 | 1) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    const imgs = [...(targetBlock.images || [])];
    const targetImgIdx = imgIdx + dir;
    if (targetImgIdx < 0 || targetImgIdx >= imgs.length) return;
    [imgs[imgIdx], imgs[targetImgIdx]] = [imgs[targetImgIdx], imgs[imgIdx]];
    targetBlock.images = imgs;
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(secIdx, currentBlocks);
  };

  const updateImageInBlock = (secIdx: number, bIdx: number, imgIdx: number, field: string, val: any) => {
    const currentBlocks = [...getSectionBlocks(sections[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    const imgs = [...(targetBlock.images || [])];
    imgs[imgIdx] = { ...imgs[imgIdx], [field]: val };
    targetBlock.images = imgs;
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(secIdx, currentBlocks);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Pagina Chi Siamo"
        description="I blocchi narrativi che raccontano la storia, la visione e l'anima della compagnia teatrale. Puoi comporre ogni capitolo alternando liberamente paragrafi di testo e gallerie/caroselli di immagini."
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
            Capitoli e Sezioni (Contenuto Modulare)
          </h4>
          {sections.map((sec: any, idx: number) => {
            const blocks = getSectionBlocks(sec);
            const totalGalleries = blocks.filter((b: any) => b.type === "gallery").length;
            const totalTextBlocks = blocks.filter((b: any) => b.type === "text").length;
            const badgeLabel = `${totalTextBlocks} testi${totalGalleries > 0 ? ` • ${totalGalleries} gallerie` : ""}`;

            return (
              <AccordionCard
                key={idx}
                index={idx}
                total={sections.length}
                title={sec.title || `Sezione ${idx + 1}`}
                subtitle={sec.text?.slice(0, 60) + (sec.text?.length > 60 ? "..." : "")}
                badge={badgeLabel}
                onMoveUp={() => moveSection(idx, -1)}
                onMoveDown={() => moveSection(idx, 1)}
                onDelete={() => removeSection(idx)}
                defaultOpen={idx === 0}
              >
                <div className="space-y-6">
                  <FormField
                    label="Titolo del Capitolo / Sezione"
                    value={sec.title}
                    onChange={(v) => updateSectionField(idx, "title", v)}
                  />

                  {/* Modular Blocks inside section */}
                  <div className="space-y-5 pt-4 border-t border-foreground/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                          Sequenza di Contenuto (Testi e Immagini)
                        </h5>
                        <p className="text-[11px] text-foreground/40 mt-0.5">
                          Alterna paragrafi di testo e gallerie fotografiche nell&apos;ordine esatto in cui desideri che appaiano.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addTextBlock(idx)}
                          className="px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Plus size={12} /> + Paragrafo Testo
                        </button>
                        <button
                          type="button"
                          onClick={() => addGalleryBlock(idx)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <ImageIcon size={12} /> + Galleria Foto
                        </button>
                      </div>
                    </div>

                    {blocks.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-foreground/15 text-center">
                        <p className="text-xs text-foreground/40 italic mb-3">
                          Nessun elemento presente in questo capitolo.
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => addTextBlock(idx)}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold"
                          >
                            Aggiungi Testo
                          </button>
                          <button
                            type="button"
                            onClick={() => addGalleryBlock(idx)}
                            className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-bold border border-foreground/10"
                          >
                            Aggiungi Galleria
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {blocks.map((block: any, bIdx: number) => {
                          const isText = block.type === "text";
                          const isGallery = block.type === "gallery";

                          return (
                            <AccordionCard
                              key={bIdx}
                              index={bIdx}
                              total={blocks.length}
                              title={
                                isText
                                  ? `Blocco Testo #${bIdx + 1}`
                                  : `Galleria Foto #${bIdx + 1} (${block.images?.length || 0} foto)`
                              }
                              subtitle={
                                isText
                                  ? (block.text?.replace(/<[^>]*>/g, "").slice(0, 50) || "Testo vuoto...")
                                  : "Carosello immagini"
                              }
                              badge={isText ? "Testo" : "Galleria"}
                              onMoveUp={() => moveBlock(idx, bIdx, -1)}
                              onMoveDown={() => moveBlock(idx, bIdx, 1)}
                              onDelete={() => removeBlock(idx, bIdx)}
                              defaultOpen={true}
                            >
                              {isText && (
                                <div className="space-y-3">
                                  <FormField
                                    type="richtext"
                                    label="Paragrafo di Testo"
                                    value={block.text || ""}
                                    onChange={(v) => updateTextBlock(idx, bIdx, v)}
                                    rows={5}
                                  />
                                </div>
                              )}

                              {isGallery && (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-foreground/50">
                                      Le foto ruoteranno in carosello interattivo tra i paragrafi.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => addImageToBlock(idx, bIdx)}
                                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                      <Plus size={12} /> Aggiungi Foto
                                    </button>
                                  </div>

                                  {(!block.images || block.images.length === 0) ? (
                                    <div className="p-4 rounded-xl border border-dashed border-foreground/15 text-center">
                                      <p className="text-xs text-foreground/40 italic mb-2">
                                        Nessuna foto in questa galleria.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => addImageToBlock(idx, bIdx)}
                                        className="text-xs font-bold text-primary hover:underline"
                                      >
                                        + Inserisci la prima foto
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {block.images.map((img: any, imgIdx: number) => (
                                        <AccordionCard
                                          key={imgIdx}
                                          index={imgIdx}
                                          total={block.images.length}
                                          title={img.alt || `Foto ${imgIdx + 1}`}
                                          subtitle={img.url}
                                          thumbnail={img.url}
                                          onMoveUp={() => moveImageInBlock(idx, bIdx, imgIdx, -1)}
                                          onMoveDown={() => moveImageInBlock(idx, bIdx, imgIdx, 1)}
                                          onDelete={() => removeImageFromBlock(idx, bIdx, imgIdx)}
                                        >
                                          <div className="space-y-4">
                                            <FormField
                                              label="Testo Alternativo (SEO)"
                                              value={img.alt}
                                              onChange={(v) =>
                                                updateImageInBlock(idx, bIdx, imgIdx, "alt", v)
                                              }
                                              placeholder="Didascalia o descrizione foto"
                                            />
                                            <ImageUploadField
                                              label="Foto"
                                              value={img.url}
                                              onChange={(v) =>
                                                updateImageInBlock(idx, bIdx, imgIdx, "url", v)
                                              }
                                              aspect="video"
                                            />
                                          </div>
                                        </AccordionCard>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </AccordionCard>
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
