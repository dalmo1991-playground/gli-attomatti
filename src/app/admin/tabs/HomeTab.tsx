"use client";

import React from "react";
import { Plus, Home as HomeIcon, Image as ImageIcon, ExternalLink } from "lucide-react";
import { InstagramIcon } from "@/components/home/InstagramFeed";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function HomeTab() {
  const { content, updateContent } = useAdmin();
  const home = content?.pages?.home || {
    hero: {},
    upcoming_shows: [],
    introduction: { images: [] },
    instagram_feed: { posts: [] }
  };

  const upcoming = home.upcoming_shows || [];
  const introImages = home.introduction?.images || [];
  const igFeed = home.instagram_feed || {
    enabled: true,
    title: "Seguici su Instagram",
    subtitle: "Dietro le quinte, prove e momenti di scena della nostra compagnia",
    handle: "@gliattomatti",
    profile_url: "https://www.instagram.com/gliattomatti/",
    cta_label: "Segui @gliattomatti",
    posts: []
  };
  const igPosts = igFeed.posts || [];

  const addUpcomingShow = () => {
    updateContent("pages.home.upcoming_shows", [
      ...upcoming,
      {
        active: true,
        title: "Nuovo Show in Evidenza",
        presenter: "Gli Attomatti Presentano",
        tagline: "Una commedia imperdibile",
        date: "Prossimamente",
        location: "Zurigo",
        location_href: "",
        cta: "Prenota Posto",
        cta_href: "/Contatti",
        secondary_cta: "Dettagli",
        secondary_cta_href: "/Spettacoli",
        image: "/images/1782553290530-TheaterCurtain.webp"
      }
    ]);
  };

  const removeUpcomingShow = (idx: number) => {
    updateContent(
      "pages.home.upcoming_shows",
      upcoming.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveUpcomingShow = (idx: number, dir: -1 | 1) => {
    const newList = [...upcoming];
    const targetIdx = idx + dir;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    updateContent("pages.home.upcoming_shows", newList);
  };

  const updateShowField = (idx: number, field: string, value: any) => {
    const newList = [...upcoming];
    newList[idx] = { ...newList[idx], [field]: value };
    updateContent("pages.home.upcoming_shows", newList);
  };

  const addIntroImage = () => {
    updateContent("pages.home.introduction.images", [
      ...introImages,
      { url: "/images/1782553290530-TheaterCurtain.webp", alt: "Foto backstage" }
    ]);
  };

  const removeIntroImage = (idx: number) => {
    updateContent(
      "pages.home.introduction.images",
      introImages.filter((_: any, i: number) => i !== idx)
    );
  };

  const updateIntroImage = (idx: number, field: string, value: any) => {
    const newList = [...introImages];
    newList[idx] = { ...newList[idx], [field]: value };
    updateContent("pages.home.introduction.images", newList);
  };

  const addIgPost = () => {
    updateContent("pages.home.instagram_feed.posts", [
      ...igPosts,
      {
        id: `ig-${Date.now()}`,
        url: "",
        title: ""
      }
    ]);
  };

  const removeIgPost = (idx: number) => {
    updateContent(
      "pages.home.instagram_feed.posts",
      igPosts.filter((_: any, i: number) => i !== idx)
    );
  };

  const updateIgPost = (idx: number, field: string, value: any) => {
    const newList = [...igPosts];
    newList[idx] = { ...newList[idx], [field]: value };
    updateContent("pages.home.instagram_feed.posts", newList);
  };

  const moveIgPost = (idx: number, dir: -1 | 1) => {
    const newList = [...igPosts];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    updateContent("pages.home.instagram_feed.posts", newList);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Hero Section */}
      <AdminSection
        title="Hero Principale"
        description="Il primo impatto visivo della Home Page: titolo teatrale e pulsanti di chiamata all'azione."
        icon={HomeIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Titolo Hero"
            value={home.hero?.title}
            onChange={(v) => updateContent("pages.home.hero.title", v)}
            placeholder="Gli Attomatti"
          />
          <FormField
            label="Sottotitolo Hero"
            value={home.hero?.subtitle}
            onChange={(v) => updateContent("pages.home.hero.subtitle", v)}
            placeholder="Teatro in lingua italiana a Zurigo"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-foreground/5">
          <FormField
            label="Testo Bottone Primario"
            value={home.hero?.primary_cta_label}
            onChange={(v) => updateContent("pages.home.hero.primary_cta_label", v)}
            placeholder="Scopri gli Spettacoli"
          />
          <FormField
            label="URL Bottone Primario"
            value={home.hero?.primary_cta_href}
            onChange={(v) => updateContent("pages.home.hero.primary_cta_href", v)}
            placeholder="/Spettacoli"
          />
          <FormField
            label="Testo Bottone Secondario"
            value={home.hero?.secondary_cta_label}
            onChange={(v) => updateContent("pages.home.hero.secondary_cta_label", v)}
            placeholder="Chi Siamo"
          />
          <FormField
            label="URL Bottone Secondario"
            value={home.hero?.secondary_cta_href}
            onChange={(v) => updateContent("pages.home.hero.secondary_cta_href", v)}
            placeholder="/Chi_Siamo"
          />
        </div>
      </AdminSection>

      {/* Carousel Upcoming Shows */}
      <AdminSection
        title="Spettacoli in Primo Piano"
        description="Card scorrevoli nell'hero della home page. Se non ci sono spettacoli attivi, viene mostrato il banner di default."
        action={
          <button
            type="button"
            onClick={addUpcomingShow}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Show
          </button>
        }
      >
        <div className="space-y-4">
          {upcoming.map((show: any, idx: number) => (
            <AccordionCard
              key={idx}
              index={idx}
              total={upcoming.length}
              title={show.title}
              subtitle={`${show.date || "Nessuna data"} - ${show.location || "Nessun luogo"}`}
              badge={show.active ? "Attivo" : "Disattivato"}
              badgeColor={show.active ? "primary" : "muted"}
              onMoveUp={() => moveUpcomingShow(idx, -1)}
              onMoveDown={() => moveUpcomingShow(idx, 1)}
              onDelete={() => removeUpcomingShow(idx)}
              defaultOpen={idx === 0}
            >
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-foreground/5">
                <span className="text-xs font-black uppercase tracking-wider text-foreground/60">
                  Visibilità in Primo Piano
                </span>
                <FormField
                  label=""
                  type="switch"
                  value={show.active}
                  onChange={(v) => updateShowField(idx, "active", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Titolo Spettacolo"
                  value={show.title}
                  onChange={(v) => updateShowField(idx, "title", v)}
                />
                <FormField
                  label="Presenter"
                  value={show.presenter}
                  onChange={(v) => updateShowField(idx, "presenter", v)}
                  placeholder="Gli Attomatti Presentano"
                />
              </div>

              <FormField
                label="Tagline / Slogan"
                value={show.tagline}
                onChange={(v) => updateShowField(idx, "tagline", v)}
                placeholder="Un esilarante viaggio..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Data & Ora"
                  value={show.date}
                  onChange={(v) => updateShowField(idx, "date", v)}
                  placeholder="Es. 24 Maggio 2026, ore 20:00"
                />
                <FormField
                  label="Luogo / Teatro"
                  value={show.location}
                  onChange={(v) => updateShowField(idx, "location", v)}
                  placeholder="Es. Theater Casino Zug"
                />
              </div>

              <FormField
                label="Link Google Maps (opzionale)"
                value={show.location_href || ""}
                onChange={(v) => updateShowField(idx, "location_href", v)}
                placeholder="https://maps.app.goo.gl/... oppure https://maps.google.com/..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-foreground/5">
                <FormField
                  label="Testo Bottone Biglietti"
                  value={show.cta}
                  onChange={(v) => updateShowField(idx, "cta", v)}
                  placeholder="Biglietti"
                />
                <FormField
                  label="URL Biglietti"
                  value={show.cta_href}
                  onChange={(v) => updateShowField(idx, "cta_href", v)}
                  placeholder="https://eventfrog.ch/..."
                />
                <FormField
                  label="Testo 2° Bottone (Opzionale)"
                  value={show.secondary_cta}
                  onChange={(v) => updateShowField(idx, "secondary_cta", v)}
                  placeholder="Dettagli Spettacolo"
                />
                <FormField
                  label="URL 2° Bottone"
                  value={show.secondary_cta_href}
                  onChange={(v) => updateShowField(idx, "secondary_cta_href", v)}
                  placeholder="/Spettacoli/nome-slug"
                />
              </div>

              <ImageUploadField
                label="Locandina o Foto di Scena (Sfondo Hero)"
                value={show.image}
                onChange={(url) => updateShowField(idx, "image", url)}
                align={show.image_align || show.image_position || "center"}
                onAlignChange={(align) => updateShowField(idx, "image_align", align)}
                aspect="video"
                helpText="Se la foto ha un elemento principale a destra o a sinistra, imposta l'ancoraggio per preservarlo durante il ritaglio su mobile."
              />
            </AccordionCard>
          ))}
        </div>
      </AdminSection>

      {/* Introduction & Backstage */}
      <AdminSection
        title="Introduzione & Backstage"
        description="Sezione narrativa della home page con foto di backstage."
      >
        <FormField
          label="Titolo Sezione"
          value={home.introduction?.title}
          onChange={(v) => updateContent("pages.home.introduction.title", v)}
        />
        <FormField
          type="textarea"
          label="Testo di Presentazione"
          value={home.introduction?.text}
          onChange={(v) => updateContent("pages.home.introduction.text", v)}
          rows={5}
        />

        {/* Gallery */}
        <div className="space-y-4 pt-4 border-t border-foreground/5">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-foreground/40">
              Galleria Immagini Backstage
            </h5>
            <button
              type="button"
              onClick={addIntroImage}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Aggiungi Immagine
            </button>
          </div>

          <div className="space-y-4">
            {introImages.map((img: any, iIdx: number) => (
              <AccordionCard
                key={iIdx}
                index={iIdx}
                total={introImages.length}
                title={img.alt || `Immagine ${iIdx + 1}`}
                subtitle={img.url}
                onDelete={() => removeIntroImage(iIdx)}
              >
                <div className="space-y-4">
                  <FormField
                    label="Testo Alternativo (SEO)"
                    value={img.alt}
                    onChange={(v) => updateIntroImage(iIdx, "alt", v)}
                    placeholder="Didascalia o descrizione foto"
                  />
                  <ImageUploadField
                    label="Foto"
                    value={img.url}
                    onChange={(v) => updateIntroImage(iIdx, "url", v)}
                    aspect="video"
                  />
                </div>
              </AccordionCard>
            ))}
          </div>
        </div>
      </AdminSection>

      {/* Instagram Feed Section (Modalità B - Embed) */}
      <AdminSection
        title="Feed Instagram (Embed Ufficiale)"
        description="Mostra post o reel ufficiali di Instagram direttamente nella Home Page dopo la sezione Gli Attomatti."
        icon={InstagramIcon}
        action={
          <button
            type="button"
            onClick={addIgPost}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Post Instagram
          </button>
        }
      >
        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-foreground/5 mb-6">
          <span className="text-xs font-black uppercase tracking-wider text-foreground/70">
            Attiva Sezione Instagram in Home Page
          </span>
          <FormField
            label=""
            type="switch"
            value={igFeed.enabled !== false}
            onChange={(v) => updateContent("pages.home.instagram_feed.enabled", v)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField
            label="Titolo Sezione"
            value={igFeed.title}
            onChange={(v) => updateContent("pages.home.instagram_feed.title", v)}
            placeholder="Seguici su Instagram"
          />
          <FormField
            label="Handle Profilo"
            value={igFeed.handle}
            onChange={(v) => updateContent("pages.home.instagram_feed.handle", v)}
            placeholder="@gliattomatti"
          />
        </div>

        <FormField
          label="Sottotitolo"
          value={igFeed.subtitle}
          onChange={(v) => updateContent("pages.home.instagram_feed.subtitle", v)}
          placeholder="Dietro le quinte, prove e momenti di scena della nostra compagnia"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-foreground/5">
          <FormField
            label="URL Profilo Instagram"
            value={igFeed.profile_url}
            onChange={(v) => updateContent("pages.home.instagram_feed.profile_url", v)}
            placeholder="https://www.instagram.com/gliattomatti/"
          />
          <FormField
            label="Testo Pulsante Segui"
            value={igFeed.cta_label}
            onChange={(v) => updateContent("pages.home.instagram_feed.cta_label", v)}
            placeholder="Segui @gliattomatti"
          />
        </div>

        {/* Posts list */}
        <div className="space-y-4 pt-6 border-t border-foreground/5">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                Post e Reel in Vetrina
              </h5>
              <p className="text-[11px] text-foreground/40 mt-0.5">
                Incolla il link di qualsiasi post o reel pubblico (es. https://www.instagram.com/p/... o /reel/...).
              </p>
            </div>
            <button
              type="button"
              onClick={addIgPost}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Aggiungi Post
            </button>
          </div>

          {igPosts.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-foreground/10 text-foreground/40 text-xs">
              Nessun post inserito. Clicca su &quot;Aggiungi Post&quot; per inserire il link di un post o reel Instagram.
            </div>
          ) : (
            <div className="space-y-3">
              {igPosts.map((post: any, pIdx: number) => (
                <AccordionCard
                  key={post.id || pIdx}
                  index={pIdx}
                  total={igPosts.length}
                  title={post.title || `Post ${pIdx + 1}`}
                  subtitle={post.url || "Nessun URL inserito"}
                  badge="Instagram Embed"
                  badgeColor="primary"
                  onMoveUp={() => moveIgPost(pIdx, -1)}
                  onMoveDown={() => moveIgPost(pIdx, 1)}
                  onDelete={() => removeIgPost(pIdx)}
                  defaultOpen={pIdx === 0}
                >
                  <div className="space-y-4">
                    <FormField
                      label="Link Post o Reel Instagram"
                      value={post.url}
                      onChange={(v) => updateIgPost(pIdx, "url", v)}
                      placeholder="https://www.instagram.com/reel/..."
                      helpText="Incolla l'URL completo del post o reel pubblico."
                      required
                    />

                    <FormField
                      label="Titolo / Nota Interna (Opzionale)"
                      value={post.title}
                      onChange={(v) => updateIgPost(pIdx, "title", v)}
                      placeholder="es. Reel prove di danza"
                    />

                    {post.url && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                        >
                          <ExternalLink size={13} />
                          <span>Verifica post su Instagram</span>
                        </a>
                      </div>
                    )}
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
