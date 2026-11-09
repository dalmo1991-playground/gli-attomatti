"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Key,
  Globe,
  Sparkles,
  Clock,
  AlertCircle
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { PreviewAccessRule, DevAccessConfig } from "@/lib/devAccess";
import { discoverPageScopes } from "@/lib/contentScopes";
import { cn } from "@/lib/utils";

function generateRandomToken(len = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function SiteTab() {
  const { content, updateContent } = useAdmin();
  const site = content?.site || { name: "", description: "", language: "it" };

  // Preview / Whitelist Configuration
  const previewAccess: DevAccessConfig = content?.preview_access || {
    enabled: true,
    rules: []
  };
  const rules: PreviewAccessRule[] = Array.isArray(previewAccess.rules)
    ? previewAccess.rules
    : [];

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Discover all pages to provide quick auto-suggest options
  const pageScopes = React.useMemo(() => {
    try {
      return discoverPageScopes(content);
    } catch {
      return [];
    }
  }, [content]);

  const pageUrlOptions = React.useMemo(() => {
    const list = pageScopes.map((s) => ({
      value: s.url,
      label: `${s.title} (${s.url})`
    }));
    // Add common wildcards
    list.unshift(
      { value: "/landing/*", label: "Tutte le Landing Pages (/landing/*)" },
      { value: "/Location/*", label: "Tutte le Location (/Location/*)" },
      { value: "/Spettacoli/*", label: "Tutti gli Spettacoli (/Spettacoli/*)" }
    );
    return list;
  }, [pageScopes]);

  const handleUpdateRules = (newRules: PreviewAccessRule[]) => {
    updateContent("preview_access", {
      ...previewAccess,
      rules: newRules
    });
  };

  const handleToggleGlobal = (enabled: boolean) => {
    updateContent("preview_access", {
      ...previewAccess,
      enabled
    });
  };

  const handleAddRule = () => {
    const newRule: PreviewAccessRule = {
      id: `rule-${Date.now()}`,
      label: "Nuova anteprima riservata",
      path: pageScopes[0]?.url || "/Location",
      token: generateRandomToken(8),
      enabled: true
    };
    handleUpdateRules([...rules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    handleUpdateRules(rules.filter((r) => r.id !== id));
  };

  const handleRuleChange = (id: string, field: keyof PreviewAccessRule, value: any) => {
    const updated = rules.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    handleUpdateRules(updated);
  };

  const handleCopyLink = (rule: PreviewAccessRule) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const cleanPath = rule.path.startsWith("/") ? rule.path : `/${rule.path}`;
    const tokenPart = rule.token && rule.token.trim() ? `?preview_token=${encodeURIComponent(rule.token.trim())}` : "";
    const fullUrl = `${origin}${cleanPath}${tokenPart}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(rule.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
      <div className="space-y-10 max-w-5xl">
        {/* SEZIONE 1: IDENTITÀ DEL SITO */}
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

        {/* SEZIONE 2: ANTEPRIME E WHITELIST (ACPT / DEV) */}
        <AdminSection
          title="Condivisione Anteprime & Whitelist (ACPT / Dev)"
          description="Consente a soggetti terzi o partner di visualizzare specifiche pagine del sito di collaudo senza conoscere la password master dell'ambiente dev."
          icon={ShieldCheck}
          action={
            <button
              type="button"
              onClick={handleAddRule}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Nuova Pagina Anteprima</span>
            </button>
          }
        >
          {/* Switch generale */}
          <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                Abilita Accesso Anteprime Riservate
              </span>
              <p className="text-xs text-foreground/60 max-w-xl">
                Quando abilitato, chi apre un link con token valido (o una route autorizzata) vedrà quella specifica pagina senza richiesta di password master. Se tenta di navigare su altre pagine non autorizzate, il dev gate scatterà proteggendo il resto del sito.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="preview_access_enabled"
                checked={previewAccess.enabled !== false}
                onChange={(e) => handleToggleGlobal(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer rounded"
              />
              <label htmlFor="preview_access_enabled" className="text-xs font-bold uppercase cursor-pointer select-none">
                {previewAccess.enabled !== false ? "Attivo" : "Disattivato"}
              </label>
            </div>
          </div>

          {/* Lista Regole */}
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/15 bg-background/20 space-y-3">
                <Key size={32} className="mx-auto text-foreground/30" />
                <h5 className="font-bold text-foreground text-sm">Nessuna pagina in whitelist</h5>
                <p className="text-xs text-foreground/50 max-w-md mx-auto">
                  Clicca su &quot;Nuova Pagina Anteprima&quot; per generare un link con token e consentire la visione di una location, spettacolo o landing page a una persona esterna.
                </p>
              </div>
            ) : (
              rules.map((rule, idx) => {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const cleanPath = rule.path.startsWith("/") ? rule.path : `/${rule.path}`;
                const tokenPart = rule.token && rule.token.trim() ? `?preview_token=${encodeURIComponent(rule.token.trim())}` : "";
                const shareableUrl = `${origin}${cleanPath}${tokenPart}`;
                const isCopied = copiedId === rule.id;

                return (
                  <div
                    key={rule.id || idx}
                    className={cn(
                      "p-6 rounded-2xl border transition-all duration-200 bg-background/60 space-y-4",
                      rule.enabled !== false
                        ? "border-foreground/10 hover:border-primary/40 shadow-sm"
                        : "border-foreground/5 opacity-60 bg-muted/20"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/5 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={rule.label || ""}
                          onChange={(e) => handleRuleChange(rule.id, "label", e.target.value)}
                          placeholder="Nome / Destinatario anteprima..."
                          className="bg-transparent font-bold text-sm text-foreground focus:outline-none focus:underline"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rule.enabled !== false}
                            onChange={(e) => handleRuleChange(rule.id, "enabled", e.target.checked)}
                            className="w-4 h-4 accent-primary cursor-pointer rounded"
                          />
                          <span>{rule.enabled !== false ? "Attivo" : "Disattivo"}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Elimina regola"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Path / Pagina */}
                      <div className="md:col-span-6 space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                          Percorso della Pagina (URL Path)
                        </label>
                        <input
                          type="text"
                          value={rule.path}
                          onChange={(e) => handleRuleChange(rule.id, "path", e.target.value)}
                          placeholder="/Location/nome-location"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-foreground/10 text-sm font-mono focus:outline-none focus:border-primary"
                          list={`datalist-pages-${rule.id}`}
                        />
                        <datalist id={`datalist-pages-${rule.id}`}>
                          {pageUrlOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </datalist>
                        <p className="text-[11px] text-foreground/50">
                          Es. <code className="text-primary font-mono">/Location/spazio-preview</code> o con wildcard <code className="text-primary font-mono">/landing/*</code>.
                        </p>
                      </div>

                      {/* Token di sicurezza */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center justify-between">
                          <span>Token Riservato</span>
                          <button
                            type="button"
                            onClick={() => handleRuleChange(rule.id, "token", generateRandomToken(8))}
                            className="text-[10px] text-primary hover:underline flex items-center gap-1 normal-case font-normal"
                          >
                            <Sparkles size={11} /> Rigenera
                          </button>
                        </label>
                        <input
                          type="text"
                          value={rule.token || ""}
                          onChange={(e) => handleRuleChange(rule.id, "token", e.target.value)}
                          placeholder="Lascia vuoto per whitelist libera"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-foreground/10 text-sm font-mono focus:outline-none focus:border-primary"
                        />
                        <p className="text-[11px] text-foreground/50">
                          Se impostato, l&apos;accesso richiede <code className="font-mono">?preview_token=...</code> nell&apos;URL.
                        </p>
                      </div>

                      {/* Scadenza opzionale */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                          Scadenza (Opz.)
                        </label>
                        <input
                          type="date"
                          value={rule.expiresAt || ""}
                          onChange={(e) => handleRuleChange(rule.id, "expiresAt", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-background border border-foreground/10 text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Shareable Link Box */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-foreground/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider block">
                          Link da Condividere con il Destinatario:
                        </span>
                        <span className="text-xs font-mono text-primary truncate block select-all">
                          {shareableUrl}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(rule)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            isCopied
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-background border border-foreground/10 text-foreground hover:bg-muted"
                          )}
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{isCopied ? "Copiato!" : "Copia Link"}</span>
                        </button>

                        <a
                          href={shareableUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-background border border-foreground/10 text-foreground/70 hover:text-foreground transition-colors"
                          title="Apri anteprima in nuova scheda"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </AdminSection>
      </div>
      );
}
