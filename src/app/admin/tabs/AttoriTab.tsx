"use client";

import React, { useState } from "react";
import { Plus, Users, Search, Theater, Trash2, Calendar, X, RefreshCw, UserCheck, Star, Sparkles, Clock, Pencil, Check, MapPin } from "lucide-react";
import { SpecialDate } from "@/types/absence";
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
  const assenzeMembers: string[] = attori.assenze_members || [];
  const specialDates: SpecialDate[] = attori.special_dates || [];
  const [search, setSearch] = useState("");
  const [newAssenzaMember, setNewAssenzaMember] = useState("");

  // State for special date form (both new and editing)
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [newSpecDate, setNewSpecDate] = useState("");
  const [newSpecTitle, setNewSpecTitle] = useState("");
  const [newSpecType, setNewSpecType] = useState<"show" | "rehearsal" | "event">("show");
  const [newSpecNote, setNewSpecNote] = useState("");
  const [newSpecIsAllDay, setNewSpecIsAllDay] = useState<boolean>(true);
  const [newSpecStartTime, setNewSpecStartTime] = useState<string>("20:00");
  const [newSpecEndTime, setNewSpecEndTime] = useState<string>("22:30");
  const [newSpecLocation, setNewSpecLocation] = useState<string>("");

  const handleSaveSpecialDate = () => {
    if (!newSpecDate) {
      alert("Seleziona una data per l'evento speciale.");
      return;
    }
    if (!newSpecTitle.trim()) {
      alert("Inserisci un titolo per l'evento speciale (es. Spettacolo Zurigo).");
      return;
    }

    const item: SpecialDate = {
      id: editingSpecId || `spec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: newSpecDate,
      title: newSpecTitle.trim(),
      type: newSpecType,
      note: newSpecNote.trim() || undefined,
      isAllDay: newSpecIsAllDay,
      startTime: !newSpecIsAllDay ? (newSpecStartTime || "20:00") : undefined,
      endTime: !newSpecIsAllDay ? (newSpecEndTime || "22:30") : undefined,
      location: newSpecLocation.trim() || undefined
    };

    let updated: SpecialDate[];
    if (editingSpecId) {
      updated = specialDates.map((s) => (s.id === editingSpecId ? item : s));
    } else {
      updated = [...specialDates, item];
    }

    updated.sort((a, b) => a.date.localeCompare(b.date));
    updateContent("pages.attori.special_dates", updated);

    // Reset form
    setEditingSpecId(null);
    setNewSpecDate("");
    setNewSpecTitle("");
    setNewSpecNote("");
    setNewSpecIsAllDay(true);
    setNewSpecStartTime("20:00");
    setNewSpecEndTime("22:30");
    setNewSpecLocation("");
  };

  const handleStartEditSpecialDate = (item: SpecialDate) => {
    setEditingSpecId(item.id);
    setNewSpecDate(item.date || "");
    setNewSpecTitle(item.title || "");
    setNewSpecType(item.type || "show");
    setNewSpecNote(item.note || "");
    const allDay = item.isAllDay ?? (!item.startTime && !item.endTime);
    setNewSpecIsAllDay(allDay);
    setNewSpecStartTime(item.startTime || "20:00");
    setNewSpecEndTime(item.endTime || "22:30");
    setNewSpecLocation(item.location || "");
  };

  const handleCancelEdit = () => {
    setEditingSpecId(null);
    setNewSpecDate("");
    setNewSpecTitle("");
    setNewSpecNote("");
    setNewSpecIsAllDay(true);
    setNewSpecStartTime("20:00");
    setNewSpecEndTime("22:30");
    setNewSpecLocation("");
  };

  const handleRemoveSpecialDate = (id: string) => {
    if (editingSpecId === id) handleCancelEdit();
    const updated = specialDates.filter((s) => s.id !== id);
    updateContent("pages.attori.special_dates", updated);
  };

  const handleAddAssenzaMember = () => {
    const clean = newAssenzaMember.trim();
    if (!clean) return;
    if (assenzeMembers.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      alert("Questo membro è già presente nell'elenco assenze.");
      return;
    }
    const updated = [...assenzeMembers, clean].sort((a, b) => a.localeCompare(b, "it"));
    updateContent("pages.attori.assenze_members", updated);
    setNewAssenzaMember("");
  };

  const handleRemoveAssenzaMember = (memberName: string) => {
    const updated = assenzeMembers.filter((m) => m !== memberName);
    updateContent("pages.attori.assenze_members", updated);
  };

  const handleImportAllFromCast = () => {
    const set = new Set(assenzeMembers);
    for (const actor of list) {
      if (actor.name && actor.name.trim()) {
        set.add(actor.name.trim());
      }
    }
    const updated = Array.from(set).sort((a, b) => a.localeCompare(b, "it"));
    updateContent("pages.attori.assenze_members", updated);
  };

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
                        type="richtext"
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

      {/* Calendario Assenze: Membri della Compagnia */}
      <AdminSection
        title="Membri per Calendario Assenze"
        description="Gestisci i membri della compagnia che compaiono nel menu a tendina dell'area riservata (/area-riservata) per segnare le proprie disponibilità."
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newAssenzaMember}
              onChange={(e) => setNewAssenzaMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAssenzaMember();
                }
              }}
              placeholder="Nome del membro (es. Roberta, Matteo...)"
              className="flex-1 bg-background border border-muted rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddAssenzaMember}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Membro</span>
            </button>
            <button
              type="button"
              onClick={handleImportAllFromCast}
              title="Aggiunge tutti gli attori della lista Cast qui sopra che non sono ancora presenti"
              className="bg-muted hover:bg-muted/80 text-foreground border border-muted-foreground/30 font-medium px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-4 h-4 text-secondary" />
              <span>Importa dal Cast</span>
            </button>
          </div>

          <div className="p-4 bg-background/50 border border-muted rounded-xl space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Membri attivi nel calendario assenze ({assenzeMembers.length}):
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {assenzeMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nessun membro configurato.</p>
              ) : (
                assenzeMembers.map((member) => (
                  <span
                    key={member}
                    className="inline-flex items-center gap-1.5 bg-muted text-foreground border border-muted-foreground/20 px-3 py-1.5 rounded-xl text-xs font-medium shadow-sm hover:border-primary/50 transition-colors"
                  >
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssenzaMember(member)}
                      title={`Rimuovi ${member}`}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </AdminSection>

      {/* Date Speciali (Spettacoli & Prove) */}
      <AdminSection
        title="Date Speciali: Spettacoli & Prove"
        description="Inserisci date chiave (spettacoli, prove generali, prove serali) che verranno evidenziate nell'intestazione del calendario assenze e consultabili in una vista dedicata."
      >
        <div className="space-y-4">
          <div className="bg-background/50 border border-muted p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-muted/50">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                {editingSpecId ? "Modifica Evento / Data Speciale" : "Nuova Data Speciale"}
              </span>
              {editingSpecId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Annulla modifica
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Data Evento *
                </label>
                <input
                  type="date"
                  value={newSpecDate}
                  onChange={(e) => setNewSpecDate(e.target.value)}
                  className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Titolo / Evento *
                </label>
                <input
                  type="text"
                  value={newSpecTitle}
                  onChange={(e) => setNewSpecTitle(e.target.value)}
                  placeholder="Es. Spettacolo Scuol"
                  className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Tipologia
                </label>
                <select
                  value={newSpecType}
                  onChange={(e) => setNewSpecType(e.target.value as any)}
                  className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="show">Spettacolo (Priorità Alta)</option>
                  <option value="rehearsal">Prova / Prova Generale</option>
                  <option value="event">Evento / Altro</option>
                </select>
              </div>
            </div>

            {/* Modalità Orario: Giorno intero vs A ore */}
            <div className="p-3 bg-muted/25 border border-muted rounded-xl space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>Modalità Orario</span>
                </div>

                <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-muted text-xs">
                  <button
                    type="button"
                    onClick={() => setNewSpecIsAllDay(true)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      newSpecIsAllDay
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Giorno intero
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSpecIsAllDay(false)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      !newSpecIsAllDay
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    A orario / A ore
                  </button>
                </div>
              </div>

              {!newSpecIsAllDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Orario Inizio *
                    </label>
                    <input
                      type="time"
                      value={newSpecStartTime}
                      onChange={(e) => setNewSpecStartTime(e.target.value)}
                      className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Orario Fine (Opz.)
                    </label>
                    <input
                      type="time"
                      value={newSpecEndTime}
                      onChange={(e) => setNewSpecEndTime(e.target.value)}
                      className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Luogo (Opzionale)
                </label>
                <input
                  type="text"
                  value={newSpecLocation}
                  onChange={(e) => setNewSpecLocation(e.target.value)}
                  placeholder="Es. Missione Cattolica, Feldstrasse 109, Zurigo"
                  className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Note / Dettagli (Opz.)
                </label>
                <input
                  type="text"
                  value={newSpecNote}
                  onChange={(e) => setNewSpecNote(e.target.value)}
                  placeholder="Es. Convocazione ore 18"
                  className="w-full bg-background border border-muted rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-muted/50">
              {editingSpecId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm text-muted-foreground hover:text-foreground font-semibold"
                >
                  Annulla
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveSpecialDate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-sm"
              >
                {editingSpecId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingSpecId ? "Salva Modifiche Evento" : "Aggiungi Data Speciale"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date speciali programmate ({specialDates.length}):
            </span>

            {specialDates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/20 border border-muted rounded-xl text-center">
                Nessuna data speciale inserita. Aggiungi qui gli spettacoli o le prove da evidenziare.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {specialDates.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 p-3 border rounded-xl transition-all ${
                      editingSpecId === item.id
                        ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-sm"
                        : "bg-muted/30 border-muted"
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5 flex-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.type === "show"
                            ? "bg-primary animate-pulse"
                            : item.type === "rehearsal"
                            ? "bg-secondary"
                            : "bg-accent"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-sm truncate">
                            {item.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.type === "show"
                                ? "bg-primary/20 text-primary"
                                : item.type === "rehearsal"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-accent/20 text-accent"
                            }`}
                          >
                            {item.type === "show"
                              ? "Spettacolo"
                              : item.type === "rehearsal"
                              ? "Prova"
                              : "Evento"}
                          </span>

                          {item.startTime ? (
                            <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-md">
                              Ore {item.startTime}{item.endTime ? ` - ${item.endTime}` : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                              Giorno intero
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          <span className="font-semibold text-foreground/80">{item.date}</span>
                          {item.location && (
                            <span className="text-muted-foreground truncate max-w-[180px] flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-secondary shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          )}
                          {item.note && <span className="truncate italic">({item.note})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSpecialDate(item)}
                        title="Modifica evento"
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialDate(item.id)}
                        title="Rimuovi data speciale"
                        className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
