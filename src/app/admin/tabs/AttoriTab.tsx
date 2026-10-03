"use client";

import React, { useState } from "react";
import { Plus, Users, Search, Theater, Trash2 } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { ImageUploadField } from "../components/ui/ImageUploadField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function AttoriTab() {
  const { content, updateContent } = useAdmin();
  const attori = content?.pages?.attori || {
    title: "Persone",
    list: [],
    join_us: {}
  };

  const list = attori.list || [];
  const [search, setSearch] = useState("");

  const addPerson = () => {
    updateContent("pages.attori.list", [
      ...list,
      {
        name: "Nuovo Membro",
        role: "Attore",
        image: "/images/1782553964559-DSC_1764.webp",
        bio: "",
        description: "",
        shows: [],
        visible: true
      }
    ]);
  };

  const removePerson = (idx: number) => {
    updateContent(
      "pages.attori.list",
      list.filter((_: any, i: number) => i !== idx)
    );
  };

  const movePerson = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const newList = [...list];
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    updateContent("pages.attori.list", newList);
  };

  const updatePerson = (idx: number, field: string, value: any) => {
    const newList = [...list];
    newList[idx] = { ...newList[idx], [field]: value };
    updateContent("pages.attori.list", newList);
  };

  const addPersonShow = (pIdx: number) => {
    const newList = [...list];
    if (!newList[pIdx].shows) newList[pIdx].shows = [];
    newList[pIdx].shows.push({ title: "", role: "Attore", slug: "" });
    updateContent("pages.attori.list", newList);
  };

  const removePersonShow = (pIdx: number, sIdx: number) => {
    const newList = [...list];
    newList[pIdx].shows = newList[pIdx].shows.filter((_: any, i: number) => i !== sIdx);
    updateContent("pages.attori.list", newList);
  };

  const updatePersonShow = (pIdx: number, sIdx: number, field: string, value: any) => {
    const newList = [...list];
    newList[pIdx].shows[sIdx] = { ...newList[pIdx].shows[sIdx], [field]: value };
    updateContent("pages.attori.list", newList);
  };

  const filteredList = list.filter((p: any) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-4xl">
      <AdminSection
        title="Cast & Staff Teatrale"
        description="I membri della compagnia, le biografie e i ruoli interpretati nelle produzioni."
        icon={Users}
        action={
          <button
            type="button"
            onClick={addPerson}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Membro
          </button>
        }
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-foreground/5">
          <div className="w-full sm:w-1/2">
            <FormField
              label="Titolo Sezione"
              value={attori.title}
              onChange={(v) => updateContent("pages.attori.title", v)}
            />
          </div>

          <div className="relative w-full sm:w-1/2 pt-2 sm:pt-4">
            <Search className="absolute left-3.5 top-[calc(50%+4px)] -translate-y-1/2 text-foreground/30 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome o ruolo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-background border border-foreground/10 text-xs outline-none focus:border-primary text-foreground placeholder:text-foreground/30"
            />
          </div>
        </div>

        {/* Members Accordion List */}
        <div className="space-y-4">
          {filteredList.map((p: any) => {
            const originalIdx = list.indexOf(p);
            return (
              <AccordionCard
                key={originalIdx}
                index={originalIdx}
                total={list.length}
                title={p.name || "Nuovo Membro"}
                subtitle={p.role || "Ruolo non specificato"}
                thumbnail={p.image}
                badge={p.shows?.length ? `${p.shows.length} spettacoli` : undefined}
                badgeColor="primary"
                onMoveUp={() => movePerson(originalIdx, -1)}
                onMoveDown={() => movePerson(originalIdx, 1)}
                onDelete={() => removePerson(originalIdx)}
                defaultOpen={filteredList.length === 1}
              >
                <div className="space-y-6 pt-2">
                  {/* Photo on left, Details on right */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Portrait Photo Column */}
                    <div className="w-full sm:w-48 md:w-52 shrink-0">
                      <ImageUploadField
                        label="Foto Ritratto"
                        value={p.image}
                        onChange={(url) => updatePerson(originalIdx, "image", url)}
                        aspect="portrait"
                        layout="vertical"
                        helpText="Foto verticale (rapporto 3:4)"
                      />
                    </div>

                    {/* Personal Information Column */}
                    <div className="flex-1 w-full min-w-0 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="Nome e Cognome"
                          value={p.name || ""}
                          onChange={(v) => updatePerson(originalIdx, "name", v)}
                          placeholder="es. Mario Rossi"
                          required
                        />
                        <FormField
                          label="Ruolo Principale"
                          value={p.role || ""}
                          onChange={(v) => updatePerson(originalIdx, "role", v)}
                          placeholder="es. Regista - Attore"
                        />
                      </div>

                      <FormField
                        label="Breve Frase / Motto (Bio)"
                        value={p.bio || ""}
                        onChange={(v) => updatePerson(originalIdx, "bio", v)}
                        placeholder="Una battuta o citazione teatrale..."
                      />

                      <FormField
                        type="textarea"
                        label="Biografia Estesa"
                        value={p.description || ""}
                        onChange={(v) => updatePerson(originalIdx, "description", v)}
                        rows={4}
                        placeholder="Percorso artistico ed esperienza teatrale..."
                      />
                    </div>
                  </div>

                  {/* Shows Participated In */}
                  <div className="pt-4 border-t border-foreground/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                        <Theater size={14} className="text-primary" /> Spettacoli a cui ha partecipato ({p.shows?.length || 0})
                      </h5>
                      <button
                        type="button"
                        onClick={() => addPersonShow(originalIdx)}
                        className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus size={12} /> Aggiungi Spettacolo
                      </button>
                    </div>

                    {(!p.shows || p.shows.length === 0) ? (
                      <p className="text-xs text-foreground/30 italic py-2">
                        Nessuno spettacolo ancora associato a questo attore.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {/* Table Header */}
                        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 text-[10px] font-black uppercase tracking-wider text-foreground/40">
                          <span className="col-span-5">Titolo Spettacolo</span>
                          <span className="col-span-4">Ruolo</span>
                          <span className="col-span-2">Slug</span>
                          <span className="col-span-1 text-right">Azione</span>
                        </div>

                        {p.shows.map((show: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-2xl bg-muted/20 border border-foreground/5 flex flex-col sm:grid sm:grid-cols-12 gap-2.5 items-center"
                          >
                            <div className="col-span-5 w-full">
                              <span className="text-[10px] font-bold text-foreground/40 sm:hidden block mb-1">
                                Titolo Spettacolo:
                              </span>
                              <input
                                type="text"
                                value={show.title || ""}
                                onChange={(e) =>
                                  updatePersonShow(originalIdx, sIdx, "title", e.target.value)
                                }
                                placeholder="Titolo Spettacolo"
                                className="w-full px-3 py-2 rounded-xl bg-background/60 border border-foreground/10 text-xs font-bold text-foreground focus:border-primary outline-none"
                              />
                            </div>
                            <div className="col-span-4 w-full">
                              <span className="text-[10px] font-bold text-foreground/40 sm:hidden block mb-1">
                                Ruolo:
                              </span>
                              <input
                                type="text"
                                value={show.role || ""}
                                onChange={(e) =>
                                  updatePersonShow(originalIdx, sIdx, "role", e.target.value)
                                }
                                placeholder="Ruolo (es. Attore, Regista)"
                                className="w-full px-3 py-2 rounded-xl bg-background/60 border border-foreground/10 text-xs text-foreground focus:border-primary outline-none"
                              />
                            </div>
                            <div className="col-span-2 w-full">
                              <span className="text-[10px] font-bold text-foreground/40 sm:hidden block mb-1">
                                Slug:
                              </span>
                              <input
                                type="text"
                                value={show.slug || ""}
                                onChange={(e) =>
                                  updatePersonShow(originalIdx, sIdx, "slug", e.target.value)
                                }
                                placeholder="slug"
                                className="w-full px-3 py-2 rounded-xl bg-background/60 border border-foreground/10 text-xs font-mono text-foreground/70 focus:border-primary outline-none"
                              />
                            </div>
                            <div className="col-span-1 w-full flex justify-end">
                              <button
                                type="button"
                                onClick={() => removePersonShow(originalIdx, sIdx)}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                                title="Rimuovi spettacolo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionCard>
            );
          })}
        </div>
      </AdminSection>

      {/* Join Us CTA */}
      <AdminSection
        title="Box 'Unisciti a Noi'"
        description="Invito a fondo pagina per nuovi attori e collaboratori tecnici."
      >
        <div className="space-y-4">
          <FormField
            label="Titolo Box"
            value={attori.join_us?.title || ""}
            onChange={(v) => updateContent("pages.attori.join_us.title", v)}
            placeholder="Vuoi salire sul palco con noi?"
          />
          <FormField
            type="textarea"
            label="Descrizione"
            value={attori.join_us?.text || ""}
            onChange={(v) => updateContent("pages.attori.join_us.text", v)}
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Testo Bottone"
              value={attori.join_us?.cta_label || ""}
              onChange={(v) => updateContent("pages.attori.join_us.cta_label", v)}
              placeholder="Contattaci"
            />
            <FormField
              label="Link Destinazione"
              value={attori.join_us?.cta_href || ""}
              onChange={(v) => updateContent("pages.attori.join_us.cta_href", v)}
              placeholder="/Contatti"
            />
          </div>
        </div>
      </AdminSection>
    </div>
  );
}
