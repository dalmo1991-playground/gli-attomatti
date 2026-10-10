"use client";

import React, { useState } from "react";
import {
  Plus,
  BookOpen,
  Newspaper,
  Image as ImageIcon,
  Mail,
  Check,
  Copy,
  ExternalLink,
  Send,
  Eye,
  X
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { AccordionCard } from "../components/ui/AccordionCard";
import { buildArticleEmailHtml, convertArticleToEmailBlocks } from "@/lib/email/blogToEmail";

export function BlogTab() {
  const { content, updateContent } = useAdmin();
  const blog = content?.pages?.blog || {
    title: "Il Nostro Blog",
    description: "",
    articles: []
  };

  const articles: any[] = Array.isArray(blog.articles) ? blog.articles : [];

  // Email Export Modal State
  const [exportArticle, setExportArticle] = useState<any | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [savedTemplateSuccess, setSavedTemplateSuccess] = useState(false);

  const addArticle = () => {
    const slugBase = `articolo-${Date.now().toString().slice(-4)}`;
    updateContent("pages.blog.articles", [
      ...articles,
      {
        slug: slugBase,
        title: "Nuovo Articolo",
        year: new Date().getFullYear().toString(),
        date: "Oggi",
        short_description: "Breve introduzione per l'archivio...",
        visible: true,
        content_sections: [
          {
            title: "Capitolo 1",
            blocks: [{ type: "text", text: "<p>Inizia a scrivere qui il tuo racconto...</p>" }]
          }
        ]
      }
    ]);
  };

  const removeArticle = (idx: number) => {
    updateContent(
      "pages.blog.articles",
      articles.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveArticle = (idx: number, dir: -1 | 1) => {
    const newList = [...articles];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= articles.length) return;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    updateContent("pages.blog.articles", newList);
  };

  const updateArticleField = (idx: number, field: string, value: any) => {
    const newList = [...articles];
    newList[idx] = { ...newList[idx], [field]: value };
    updateContent("pages.blog.articles", newList);
  };

  // Section & Block operations for article
  const getArticleSections = (article: any) => {
    return Array.isArray(article.content_sections) ? article.content_sections : [];
  };

  const addArticleSection = (artIdx: number) => {
    const currentSections = [...getArticleSections(articles[artIdx])];
    currentSections.push({
      title: `Capitolo ${currentSections.length + 1}`,
      blocks: [{ type: "text", text: "" }]
    });
    updateArticleField(artIdx, "content_sections", currentSections);
  };

  const removeArticleSection = (artIdx: number, secIdx: number) => {
    const currentSections = getArticleSections(articles[artIdx]).filter(
      (_: any, i: number) => i !== secIdx
    );
    updateArticleField(artIdx, "content_sections", currentSections);
  };

  const moveArticleSection = (artIdx: number, secIdx: number, dir: -1 | 1) => {
    const currentSections = [...getArticleSections(articles[artIdx])];
    const targetIdx = secIdx + dir;
    if (targetIdx < 0 || targetIdx >= currentSections.length) return;
    [currentSections[secIdx], currentSections[targetIdx]] = [
      currentSections[targetIdx],
      currentSections[secIdx]
    ];
    updateArticleField(artIdx, "content_sections", currentSections);
  };

  const updateSectionTitle = (artIdx: number, secIdx: number, title: string) => {
    const currentSections = [...getArticleSections(articles[artIdx])];
    currentSections[secIdx] = { ...currentSections[secIdx], title };
    updateArticleField(artIdx, "content_sections", currentSections);
  };

  // Block management inside an article section
  const getSectionBlocks = (sec: any) => {
    if (Array.isArray(sec.blocks) && sec.blocks.length > 0) return sec.blocks;
    const derived: any[] = [];
    if (sec.text) derived.push({ type: "text", text: sec.text });
    if (Array.isArray(sec.images) && sec.images.length > 0) {
      derived.push({ type: "gallery", images: sec.images });
    }
    return derived;
  };

  const updateSectionBlocks = (artIdx: number, secIdx: number, newBlocks: any[]) => {
    const currentSections = [...getArticleSections(articles[artIdx])];
    const sec = { ...currentSections[secIdx], blocks: newBlocks };
    const firstText = newBlocks.find((b) => b.type === "text");
    sec.text = firstText?.text || "";
    sec.images = newBlocks
      .filter((b) => b.type === "gallery" && Array.isArray(b.images))
      .flatMap((b) => b.images);
    currentSections[secIdx] = sec;
    updateArticleField(artIdx, "content_sections", currentSections);
  };

  const addTextBlock = (artIdx: number, secIdx: number) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    currentBlocks.push({ type: "text", text: "" });
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const addGalleryBlock = (artIdx: number, secIdx: number) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    currentBlocks.push({
      type: "gallery",
      images: [
        {
          url: "/images/1782553290530-TheaterCurtain.webp",
          alt: "Foto articolo"
        }
      ]
    });
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const removeBlock = (artIdx: number, secIdx: number, bIdx: number) => {
    const currentBlocks = getSectionBlocks(getArticleSections(articles[artIdx])[secIdx]).filter(
      (_: any, i: number) => i !== bIdx
    );
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const moveBlock = (artIdx: number, secIdx: number, bIdx: number, dir: -1 | 1) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    const targetIdx = bIdx + dir;
    if (targetIdx < 0 || targetIdx >= currentBlocks.length) return;
    [currentBlocks[bIdx], currentBlocks[targetIdx]] = [currentBlocks[targetIdx], currentBlocks[bIdx]];
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const updateTextBlock = (artIdx: number, secIdx: number, bIdx: number, textValue: string) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    currentBlocks[bIdx] = { ...currentBlocks[bIdx], text: textValue };
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const addImageToBlock = (artIdx: number, secIdx: number, bIdx: number) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    const imgs = Array.isArray(targetBlock.images) ? [...targetBlock.images] : [];
    imgs.push({
      url: "/images/1782553290530-TheaterCurtain.webp",
      alt: "Foto articolo"
    });
    targetBlock.images = imgs;
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const removeImageFromBlock = (artIdx: number, secIdx: number, bIdx: number, imgIdx: number) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    targetBlock.images = (targetBlock.images || []).filter((_: any, i: number) => i !== imgIdx);
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  const updateImageInBlock = (
    artIdx: number,
    secIdx: number,
    bIdx: number,
    imgIdx: number,
    field: string,
    val: any
  ) => {
    const currentBlocks = [...getSectionBlocks(getArticleSections(articles[artIdx])[secIdx])];
    const targetBlock = { ...currentBlocks[bIdx] };
    const imgs = [...(targetBlock.images || [])];
    imgs[imgIdx] = { ...imgs[imgIdx], [field]: val };
    targetBlock.images = imgs;
    currentBlocks[bIdx] = targetBlock;
    updateSectionBlocks(artIdx, secIdx, currentBlocks);
  };

  // Generate Email HTML
  const emailHtmlPreview = exportArticle ? buildArticleEmailHtml(exportArticle) : "";

  const handleCopyEmailHtml = () => {
    if (!emailHtmlPreview) return;
    navigator.clipboard.writeText(emailHtmlPreview);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleSaveAsEmailTemplate = () => {
    if (!exportArticle) return;
    const blocks = convertArticleToEmailBlocks(exportArticle);
    const existingTemplates: any[] = Array.isArray(content?.emails?.templates)
      ? [...content.emails.templates]
      : [];

    const newTemplate = {
      id: `newsletter-${exportArticle.slug || Date.now()}`,
      name: `Newsletter: ${exportArticle.title}`,
      enabled: true,
      subject: exportArticle.title,
      preheader: exportArticle.short_description || "Leggi il nostro ultimo racconto dal palcoscenico.",
      theme: "default",
      blocks
    };

    updateContent("emails.templates", [...existingTemplates, newTemplate]);
    setSavedTemplateSuccess(true);
    setTimeout(() => setSavedTemplateSuccess(false), 3000);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Blog & Racconti"
        description="Pubblica articoli, retroscena, annunci e storie sulla compagnia teatrale. Ogni articolo può essere composto alternando liberamente testi e gallerie, e può essere impacchettato come email pronta per la newsletter."
        icon={Newspaper}
        action={
          <button
            type="button"
            onClick={addArticle}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Nuovo Articolo
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Titolo Pagina Blog"
            value={blog.title}
            onChange={(v) => updateContent("pages.blog.title", v)}
          />
          <FormField
            type="textarea"
            label="Descrizione Breve Blog"
            value={blog.description}
            onChange={(v) => updateContent("pages.blog.description", v)}
            rows={2}
          />
        </div>

        {/* Articles Accordion */}
        <div className="space-y-4 pt-6 border-t border-foreground/5">
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground/40 mb-2">
            Articoli Pubblicati ({articles.length})
          </h4>

          {articles.length === 0 ? (
            <div className="p-8 rounded-2xl bg-muted/20 border border-dashed border-foreground/15 text-center">
              <Newspaper className="mx-auto text-primary/30 mb-3" size={36} />
              <p className="text-sm text-foreground/50 font-medium mb-3">
                Non hai ancora creato nessun articolo per il blog.
              </p>
              <button
                type="button"
                onClick={addArticle}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
              >
                Crea il tuo primo articolo
              </button>
            </div>
          ) : (
            articles.map((art: any, idx: number) => {
              const sections = getArticleSections(art);
              const subtitle = `${art.date || art.year || "Senza data"} • ${sections.length} capitoli`;

              return (
                <AccordionCard
                  key={idx}
                  index={idx}
                  total={articles.length}
                  title={art.title || `Articolo ${idx + 1}`}
                  subtitle={subtitle}
                  badge={art.visible !== false ? "Visibile" : "Nascosto"}
                  onMoveUp={() => moveArticle(idx, -1)}
                  onMoveDown={() => moveArticle(idx, 1)}
                  onDelete={() => removeArticle(idx)}
                  defaultOpen={idx === 0}
                >
                  <div className="space-y-6">
                    {/* Primary metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <FormField
                          label="Titolo Articolo"
                          value={art.title}
                          onChange={(v) => updateArticleField(idx, "title", v)}
                        />
                      </div>
                      <FormField
                        label="Slug URL (/Chi_Siamo/Blog/...)"
                        value={art.slug}
                        onChange={(v) => updateArticleField(idx, "slug", v)}
                        placeholder="titolo-articolo"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        label="Data o Mese Visualizzato"
                        value={art.date || ""}
                        onChange={(v) => updateArticleField(idx, "date", v)}
                        placeholder="Es. Maggio 2025"
                      />
                      <FormField
                        label="Anno (per filtri archivio)"
                        value={art.year || ""}
                        onChange={(v) => updateArticleField(idx, "year", v)}
                        placeholder="2025"
                      />
                    </div>

                    <FormField
                      type="textarea"
                      label="Descrizione Breve (Riassunto per l'archivio e anteprima)"
                      value={art.short_description || ""}
                      onChange={(v) => updateArticleField(idx, "short_description", v)}
                      rows={2}
                    />

                    {/* Email Export Action Bar */}
                    <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-2">
                          <Mail size={15} /> Esporta per Newsletter & Email
                        </div>
                        <p className="text-[11px] text-foreground/60 mt-0.5">
                          Confeziona questo articolo in formato email responsive pronto per essere inviato ai subscribers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExportArticle(art)}
                        className="px-3.5 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        <Send size={13} /> Confeziona Email
                      </button>
                    </div>

                    {/* Modular Content Sections */}
                    <div className="space-y-4 pt-4 border-t border-foreground/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                            Capitoli dell&apos;Articolo ({sections.length})
                          </h5>
                          <p className="text-[11px] text-foreground/40 mt-0.5">
                            Ogni capitolo ha un titolo e può contenere paragrafi di testo alternati a gallerie foto.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addArticleSection(idx)}
                          className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
                        >
                          <Plus size={12} /> + Capitolo
                        </button>
                      </div>

                      {sections.map((sec: any, secIdx: number) => {
                        const blocks = getSectionBlocks(sec);

                        return (
                          <div
                            key={secIdx}
                            className="p-4 rounded-2xl bg-background/60 border border-foreground/10 space-y-4"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-foreground/5 pb-3">
                              <input
                                type="text"
                                value={sec.title || ""}
                                onChange={(e) => updateSectionTitle(idx, secIdx, e.target.value)}
                                placeholder="Titolo del capitolo..."
                                className="font-bold text-sm bg-transparent border-none focus:outline-none text-foreground w-full"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={secIdx === 0}
                                  onClick={() => moveArticleSection(idx, secIdx, -1)}
                                  className="p-1 text-xs text-foreground/40 hover:text-foreground disabled:opacity-20"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={secIdx === sections.length - 1}
                                  onClick={() => moveArticleSection(idx, secIdx, 1)}
                                  className="p-1 text-xs text-foreground/40 hover:text-foreground disabled:opacity-20"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeArticleSection(idx, secIdx)}
                                  className="p-1 text-xs text-rose-400 hover:text-rose-300 ml-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Blocks sequence */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">
                                  Contenuto del Capitolo
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => addTextBlock(idx, secIdx)}
                                    className="text-xs text-secondary font-bold hover:underline"
                                  >
                                    + Testo
                                  </button>
                                  <span className="text-foreground/20">•</span>
                                  <button
                                    type="button"
                                    onClick={() => addGalleryBlock(idx, secIdx)}
                                    className="text-xs text-primary font-bold hover:underline"
                                  >
                                    + Galleria Foto
                                  </button>
                                </div>
                              </div>

                              {blocks.map((block: any, bIdx: number) => {
                                const isText = block.type === "text";
                                const isGallery = block.type === "gallery";

                                return (
                                  <div
                                    key={bIdx}
                                    className="p-3.5 rounded-xl bg-muted/30 border border-foreground/5 space-y-3"
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-foreground/70">
                                        {isText ? "Paragrafo di Testo" : `Galleria Foto (${block.images?.length || 0})`}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={bIdx === 0}
                                          onClick={() => moveBlock(idx, secIdx, bIdx, -1)}
                                          className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-20"
                                        >
                                          ↑
                                        </button>
                                        <button
                                          type="button"
                                          disabled={bIdx === blocks.length - 1}
                                          onClick={() => moveBlock(idx, secIdx, bIdx, 1)}
                                          className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-20"
                                        >
                                          ↓
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeBlock(idx, secIdx, bIdx)}
                                          className="p-1 text-rose-400 hover:text-rose-300 ml-1"
                                        >
                                          <X size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    {isText && (
                                      <FormField
                                        type="richtext"
                                        value={block.text || ""}
                                        onChange={(v) => updateTextBlock(idx, secIdx, bIdx, v)}
                                        rows={4}
                                      />
                                    )}

                                    {isGallery && (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <p className="text-[11px] text-foreground/40">
                                            Le foto appariranno come un carosello elegante con lightbox a schermo intero.
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => addImageToBlock(idx, secIdx, bIdx)}
                                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                          >
                                            <Plus size={11} /> Aggiungi Foto
                                          </button>
                                        </div>

                                        {(block.images || []).map((img: any, imgIdx: number) => (
                                          <div
                                            key={imgIdx}
                                            className="p-3 rounded-lg bg-background border border-foreground/5 space-y-2"
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                                                Foto #{imgIdx + 1}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => removeImageFromBlock(idx, secIdx, bIdx, imgIdx)}
                                                className="text-xs text-rose-400 hover:text-rose-300"
                                              >
                                                Rimuovi
                                              </button>
                                            </div>
                                            <ImageUploadField
                                              label="Immagine"
                                              value={img.url}
                                              onChange={(v) =>
                                                updateImageInBlock(idx, secIdx, bIdx, imgIdx, "url", v)
                                              }
                                              aspect="video"
                                            />
                                            <FormField
                                              label="Didascalia / Alt Text (SEO)"
                                              value={img.alt || ""}
                                              onChange={(v) =>
                                                updateImageInBlock(idx, secIdx, bIdx, imgIdx, "alt", v)
                                              }
                                              placeholder="Descrizione foto"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AccordionCard>
              );
            })
          )}
        </div>
      </AdminSection>

      {/* Email Export Modal Dialog */}
      {exportArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setExportArticle(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#131b2e] border border-foreground/15 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-secondary" />
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                  Email Newsletter Confezionata
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportArticle(null)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-foreground/70 leading-relaxed">
              Il contenuto dell&apos;articolo <strong>&quot;{exportArticle.title}&quot;</strong> è stato convertito
              nei blocchi dell&apos;Email Builder con intestazione, capitoli formattati, immagini e pulsante di rimando
              al sito web.
            </p>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopyEmailHtml}
                className="p-4 rounded-2xl bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary transition-all flex items-center gap-3 group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                  {copiedHtml ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {copiedHtml ? "Codice Copiato!" : "Copia Codice HTML"}
                  </div>
                  <div className="text-[11px] text-foreground/50">
                    Incolla su Gmail, Resend Broadcast o Mailchimp.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSaveAsEmailTemplate}
                className="p-4 rounded-2xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary transition-all flex items-center gap-3 group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  {savedTemplateSuccess ? <Check size={20} className="text-emerald-400" /> : <Plus size={20} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {savedTemplateSuccess ? "Template Salvato!" : "Salva in 'Email & Notifiche'"}
                  </div>
                  <div className="text-[11px] text-foreground/50">
                    Modificalo nell&apos;Email Builder della scheda Email.
                  </div>
                </div>
              </button>
            </div>

            {/* Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground/70 flex items-center gap-1.5">
                  <Eye size={14} className="text-secondary" /> Anteprima Risultato Email
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([emailHtmlPreview], { type: "text/html;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                  }}
                  className="text-primary font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink size={12} /> Apri anteprima a schermo intero
                </button>
              </div>

              <div className="rounded-2xl border border-foreground/15 overflow-hidden bg-background h-80">
                <iframe
                  title="Anteprima Email Articolo"
                  srcDoc={emailHtmlPreview}
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setExportArticle(null)}
                className="px-4 py-2 bg-muted text-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
