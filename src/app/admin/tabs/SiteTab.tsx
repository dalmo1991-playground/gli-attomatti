"use client";

import React from "react";
import { Settings, Globe } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";

export function SiteTab() {
  const { content, updateContent } = useAdmin();
  const site = content?.site || { name: "", description: "", language: "it" };

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminSection
        title="Identità del Sito"
        description="Nome del teatro, lingua principale e metadati globali per l'indicizzazione SEO."
        icon={Globe}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Nome della Compagnia"
            value={site.name}
            onChange={(v) => updateContent("site.name", v)}
            placeholder="Gli Attomatti"
          />
          <FormField
            label="Lingua Principale"
            value={site.language}
            onChange={(v) => updateContent("site.language", v)}
            placeholder="it"
            helpText="Codice lingua ISO (es. 'it' per italiano)."
          />
        </div>

        <FormField
          type="textarea"
          label="Descrizione SEO (Meta Description)"
          value={site.description}
          onChange={(v) => updateContent("site.description", v)}
          placeholder="Breve descrizione mostrata nei motori di ricerca..."
          rows={3}
          helpText="Testo mostrato su Google e nelle anteprime di condivisione social."
        />
      </AdminSection>
    </div>
  );
}
