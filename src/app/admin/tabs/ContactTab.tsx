"use client";

import React from "react";
import { Plus, Mail, Share2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";

export function ContactTab() {
  const { content, updateContent } = useAdmin();
  const c = content?.pages?.contatti || {
    title: "Contatti",
    description: "",
    email: "",
    socials: []
  };

  const socials = c.socials || [];

  const addSocial = () => {
    updateContent("pages.contatti.socials", [
      ...socials,
      { platform: "Instagram", href: "https://instagram.com/...", handle: "@gliattomatti" }
    ]);
  };

  const removeSocial = (idx: number) => {
    updateContent(
      "pages.contatti.socials",
      socials.filter((_: any, i: number) => i !== idx)
    );
  };

  const moveSocial = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= socials.length) return;
    const next = [...socials];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    updateContent("pages.contatti.socials", next);
  };

  const updateSocial = (idx: number, field: string, value: string) => {
    const next = [...socials];
    next[idx] = { ...next[idx], [field]: value };
    updateContent("pages.contatti.socials", next);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Contatti & Recapiti"
        description="Indirizzo email principale, testi introduttivi della pagina contatti e profili social ufficiali."
        icon={Mail}
      >
        <div className="space-y-4">
          <FormField
            label="Titolo Pagina Contatti"
            value={c.title || ""}
            onChange={(v) => updateContent("pages.contatti.title", v)}
          />
          <FormField
            label="Descrizione Pagina"
            value={c.description || ""}
            onChange={(v) => updateContent("pages.contatti.description", v)}
            type="textarea"
            rows={2}
          />
          <FormField
            label="Email Principale di Contatto"
            value={c.email || ""}
            onChange={(v) => updateContent("pages.contatti.email", v)}
            placeholder="info@attomatti.ch"
            type="email"
          />
          <FormField
            label="Etichetta Email (badge sopra l'indirizzo)"
            value={c.email_label || ""}
            onChange={(v) => updateContent("pages.contatti.email_label", v)}
            placeholder="Email"
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Profili Social"
        description="Canali social visualizzati nel footer e nella pagina contatti."
        icon={Share2}
        action={
          <button
            type="button"
            onClick={addSocial}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Social
          </button>
        }
      >
        <div className="space-y-3">
          {socials.map((s: any, idx: number) => (
            <div
              key={idx}
              className="p-4 bg-muted/20 border border-foreground/5 rounded-2xl flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                <input
                  type="text"
                  value={s.platform || ""}
                  onChange={(e) => updateSocial(idx, "platform", e.target.value)}
                  placeholder="Piattaforma (es. Instagram)"
                  className="px-3 py-2 bg-background/50 border border-foreground/10 rounded-xl text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  value={s.handle || ""}
                  onChange={(e) => updateSocial(idx, "handle", e.target.value)}
                  placeholder="Handle (es. @gliattomatti)"
                  className="px-3 py-2 bg-background/50 border border-foreground/10 rounded-xl text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  value={s.href || ""}
                  onChange={(e) => updateSocial(idx, "href", e.target.value)}
                  placeholder="URL link"
                  className="px-3 py-2 bg-background/50 border border-foreground/10 rounded-xl text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => moveSocial(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 text-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                  title="Sposta su"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveSocial(idx, 1)}
                  disabled={idx === socials.length - 1}
                  className="p-1.5 text-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                  title="Sposta giù"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeSocial(idx)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 ml-1 transition-colors"
                  title="Elimina"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
