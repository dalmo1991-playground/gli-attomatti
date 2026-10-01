"use client";

import React from "react";
import { Plus, Menu as MenuIcon, CornerDownRight } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";

export function NavigationTab() {
  const { content, setContent } = useAdmin();
  const nav = content?.navigation || [];

  const updateLink = (idx: number, field: string, value: any) => {
    const newNav = [...nav];
    newNav[idx][field] = value;
    setContent({ ...content, navigation: newNav });
  };

  const moveLink = (idx: number, dir: -1 | 1) => {
    const newNav = [...nav];
    const targetIdx = idx + dir;
    [newNav[idx], newNav[targetIdx]] = [newNav[targetIdx], newNav[idx]];
    setContent({ ...content, navigation: newNav });
  };

  const addLink = () => {
    setContent({
      ...content,
      navigation: [...nav, { label: "Nuova Voce", href: "/#" }]
    });
  };

  const removeLink = (idx: number) => {
    setContent({
      ...content,
      navigation: nav.filter((_: any, i: number) => i !== idx)
    });
  };

  const addSublink = (linkIdx: number) => {
    const newNav = [...nav];
    if (!newNav[linkIdx].sublinks) newNav[linkIdx].sublinks = [];
    newNav[linkIdx].sublinks.push({ label: "Nuovo Sottomenu", href: "/#" });
    setContent({ ...content, navigation: newNav });
  };

  const updateSublink = (linkIdx: number, subIdx: number, field: string, value: any) => {
    const newNav = [...nav];
    newNav[linkIdx].sublinks[subIdx][field] = value;
    setContent({ ...content, navigation: newNav });
  };

  const removeSublink = (linkIdx: number, subIdx: number) => {
    const newNav = [...nav];
    newNav[linkIdx].sublinks = newNav[linkIdx].sublinks.filter((_: any, i: number) => i !== subIdx);
    setContent({ ...content, navigation: newNav });
  };

  const moveSublink = (linkIdx: number, subIdx: number, dir: -1 | 1) => {
    const newNav = [...nav];
    const targetIdx = subIdx + dir;
    [newNav[linkIdx].sublinks[subIdx], newNav[linkIdx].sublinks[targetIdx]] = [
      newNav[linkIdx].sublinks[targetIdx],
      newNav[linkIdx].sublinks[subIdx]
    ];
    setContent({ ...content, navigation: newNav });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminSection
        title="Menu di Navigazione"
        description="Gestisci la struttura della barra di navigazione e i sottomenu a tendina del sito."
        icon={MenuIcon}
        action={
          <button
            type="button"
            onClick={addLink}
            className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus size={14} /> Aggiungi Link
          </button>
        }
      >
        <div className="space-y-4">
          {nav.map((link: any, idx: number) => (
            <AccordionCard
              key={idx}
              index={idx}
              total={nav.length}
              title={link.label}
              subtitle={link.href}
              badge={link.sublinks?.length ? `${link.sublinks.length} sottolink` : undefined}
              badgeColor="primary"
              onMoveUp={() => moveLink(idx, -1)}
              onMoveDown={() => moveLink(idx, 1)}
              onDelete={() => removeLink(idx)}
              defaultOpen={idx === 0}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Etichetta Link"
                  value={link.label}
                  onChange={(v) => updateLink(idx, "label", v)}
                  placeholder="Es. Spettacoli"
                />
                <FormField
                  label="URL di Destinazione"
                  value={link.href}
                  onChange={(v) => updateLink(idx, "href", v)}
                  placeholder="Es. /Spettacoli"
                />
              </div>

              {/* Sublinks Editor */}
              <div className="pt-4 border-t border-foreground/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-foreground/40 flex items-center gap-1.5">
                    <CornerDownRight size={14} /> Sottomenu a Tendina
                  </h5>
                  <button
                    type="button"
                    onClick={() => addSublink(idx)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Aggiungi Sottomenu
                  </button>
                </div>

                {link.sublinks && link.sublinks.length > 0 ? (
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {link.sublinks.map((sub: any, sIdx: number) => (
                      <AccordionCard
                        key={sIdx}
                        index={sIdx}
                        total={link.sublinks.length}
                        title={sub.label}
                        subtitle={sub.href}
                        badge="Dropdown"
                        badgeColor="secondary"
                        onMoveUp={() => moveSublink(idx, sIdx, -1)}
                        onMoveDown={() => moveSublink(idx, sIdx, 1)}
                        onDelete={() => removeSublink(idx, sIdx)}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            label="Etichetta Sottomenu"
                            value={sub.label}
                            onChange={(v) => updateSublink(idx, sIdx, "label", v)}
                            placeholder="Es. Corso di Teatro"
                          />
                          <FormField
                            label="URL Sottomenu"
                            value={sub.href}
                            onChange={(v) => updateSublink(idx, sIdx, "href", v)}
                            placeholder="Es. /Iniziative/corso-di-teatro"
                          />
                        </div>
                      </AccordionCard>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/30 italic pl-4">
                    Nessun sottomenu configurato per questa voce.
                  </p>
                )}
              </div>
            </AccordionCard>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
