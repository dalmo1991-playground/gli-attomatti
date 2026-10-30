"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  GitCompare,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
  Layers,
  Sparkles,
  Check,
  X,
  Search,
  Filter,
  Eye,
  Sliders,
  ChevronDown,
  ChevronRight,
  Lock,
  Calendar,
  User,
  GitCommit,
  Maximize2,
  Minimize2,
  Download,
  UploadCloud,
  FileEdit
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { PageScope, applyScopedPromotion } from "@/lib/contentScopes";

// Monaco DiffEditor loaded dynamically (100% client side)
const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center text-foreground/40 gap-3">
        <RefreshCw size={26} className="animate-spin text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider">Caricamento Diff Editor Monaco...</span>
      </div>
    )
  }
);

interface BranchInfo {
  name: string;
  lastCommit?: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
    htmlUrl: string;
  };
  imagesCount: number;
}

interface ScopedDiffItem {
  scope: PageScope;
  hasDiff: boolean;
  devValue: any;
  mainValue: any;
  devImagesCount: number;
  mainImagesCount: number;
  devMissingOnMain: string[];
  mainMissingOnDev: string[];
}

export function SyncTab() {
  const { adminSecret, activeBranch, content, setContent } = useAdmin();

  // REGOLA DI SICUREZZA ASSOLUTA: PULL-ONLY verso l'ambiente in cui ci troviamo!
  // Se sei su 'dev', target è SEMPRE 'dev' e la sorgente da cui importi è 'main'.
  // Se sei su 'main', target è SEMPRE 'main' e la sorgente da cui importi è 'dev'.
  const targetBranch = activeBranch === "main" ? "main" : "dev";
  const sourceBranch = targetBranch === "main" ? "dev" : "main";

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ dev: BranchInfo; main: BranchInfo } | null>(null);
  const [contentDev, setContentDev] = useState<any>(null);
  const [contentMain, setContentMain] = useState<any>(null);
  const [scopes, setScopes] = useState<ScopedDiffItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [onlyDiffs, setOnlyDiffs] = useState(true);

  // Accordion state: which page scopes are expanded to see the diff
  const [expandedScopeIds, setExpandedScopeIds] = useState<Set<string>>(new Set());

  // Page import success feedback
  const [importedPageMsg, setImportedPageMsg] = useState<string | null>(null);

  // Monaco Diff Editor Drawer (for global comparison)
  const [isDiffEditorOpen, setIsDiffEditorOpen] = useState(false);
  const [diffEditorTargetCode, setDiffEditorTargetCode] = useState<string>("");
  const diffEditorRef = useRef<any>(null);

  const sourceContent = sourceBranch === "dev" ? contentDev : contentMain;
  const targetContent = targetBranch === "dev" ? contentDev : contentMain;

  // Load comparison data
  const fetchComparison = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setImportedPageMsg(null);

    try {
      const res = await fetch("/api/admin/compare", {
        headers: {
          "x-admin-secret": adminSecret || ""
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Errore HTTP ${res.status}`);
      }

      const data = await res.json();
      setBranches(data.branches);
      setContentDev(data.content.dev);
      setContentMain(data.content.main);
      setScopes(data.scopes || []);
    } catch (err: any) {
      console.error("Comparison fetch failed:", err);
      setError(err.message || "Errore durante il recupero dei dati di confronto");
    } finally {
      setIsLoading(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // Toggle expand for page scope
  const toggleExpand = (id: string) => {
    setExpandedScopeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter scopes
  const filteredScopes = useMemo(() => {
    return scopes.filter((item) => {
      if (onlyDiffs && !item.hasDiff) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.scope.title.toLowerCase().includes(q) ||
        item.scope.url.toLowerCase().includes(q) ||
        item.scope.category.toLowerCase().includes(q)
      );
    });
  }, [scopes, onlyDiffs, searchFilter]);

  const diffCount = useMemo(() => {
    return scopes.filter((s) => s.hasDiff).length;
  }, [scopes]);

  // SAFE PULL / LOCAL UPDATE:
  // Aggiorna lo stato `content` in memoria nell'admin. NESSUN COMMIT E NESSUN DEPLOY AUTOMATICO.
  const handleImportPageLocally = (scopeItem: ScopedDiffItem) => {
    setError(null);
    setImportedPageMsg(null);

    try {
      // 1. Applica il valore della sorgente (sourceContent) sul content corrente dell'admin
      const updated = applyScopedPromotion(content, sourceContent, scopeItem.scope.jsonPath);

      // 2. Aggiorna lo stato React dell'admin (attiva 'hasUnsavedChanges' e diff standard)
      setContent(updated);

      setImportedPageMsg(
        `Contenuto di "${scopeItem.scope.title}" importato localmente nella bozza corrente! Ora puoi testarlo nell'anteprima e, se soddisfatto, cliccare "Pubblica" in alto a destra.`
      );

      // Chiudi eventuale accordion
      setExpandedScopeIds((prev) => {
        const next = new Set(prev);
        next.delete(scopeItem.scope.id);
        return next;
      });
    } catch (err: any) {
      console.error("Local import error:", err);
      setError(`Errore durante l'importazione locale: ${err.message}`);
    }
  };

  // Open line-by-line diff editor
  const handleOpenDiffEditor = () => {
    if (!content) return;
    setDiffEditorTargetCode(JSON.stringify(content, null, 2));
    setIsDiffEditorOpen(true);
  };

  // Apply diff editor changes LOCALLY into Admin content
  const handleApplyDiffLocally = () => {
    if (!diffEditorRef.current) return;
    const modifiedModel = diffEditorRef.current.getModifiedEditor().getModel();
    const modifiedValue = modifiedModel.getValue();

    let parsed: any;
    try {
      parsed = JSON.parse(modifiedValue);
    } catch (e) {
      setError("Il JSON nell'editor di destra non è valido. Correggi gli errori di sintassi prima di applicare.");
      return;
    }

    setContent(parsed);
    setImportedPageMsg("Modifiche dell'editor incorporate nella bozza locale corrente! Puoi procedere alla revisione o alla pubblicazione.");
    setIsDiffEditorOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <GitCompare size={15} />
            <span>Gestione Ambienti & Importazione Protetta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Confronto & Importazione ({sourceBranch} ➔ {targetBranch})
          </h1>
          <p className="text-sm text-foreground/50 mt-1 max-w-2xl">
            Confronta i contenuti con il branch <code className="font-mono text-primary font-bold">{sourceBranch}</code>.
            Quando importi una pagina o una modifica, viene caricata <strong>solo localmente nella tua sessione di lavoro</strong>:
            puoi verificarla nell&apos;anteprima e poi decidere se pubblicarla su <code className="font-mono text-primary font-bold">{targetBranch}</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchComparison}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-foreground/10 hover:bg-muted text-xs font-bold text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
            <span>Ricarica</span>
          </button>

          <button
            type="button"
            onClick={handleOpenDiffEditor}
            disabled={!sourceContent}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-foreground/10 text-xs font-bold text-foreground transition-all shadow-sm"
          >
            <FileCode size={14} className="text-primary" />
            <span>Confronto Globale Riga per Riga</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Success alert / Local draft notification */}
      {importedPageMsg && (
        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 text-foreground text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-primary">
              <CheckCircle2 size={18} />
              <span>{importedPageMsg}</span>
            </div>
            <button onClick={() => setImportedPageMsg(null)} className="p-1 hover:bg-primary/20 rounded-lg">
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-foreground/70">
            Nessun commit o deploy è stato eseguito su GitHub. Usa il pulsante <strong>&quot;Pubblica su GitHub&quot;</strong> nella barra in alto quando sei pronto.
          </p>
        </div>
      )}

      {/* Branch overview cards (PULL-ONLY representation) */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Source card */}
        <div className="md:col-span-5 p-5 rounded-2xl border border-foreground/10 bg-muted/20 relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${sourceBranch === 'main' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground/40">Sorgente Remota (Da importare)</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${sourceBranch === 'main' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              branch: {sourceBranch}
            </span>
          </div>
          {branches?.[sourceBranch]?.lastCommit ? (
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground truncate" title={branches[sourceBranch].lastCommit?.message}>
                {branches[sourceBranch].lastCommit?.message}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-foreground/50 font-mono">
                <span>{branches[sourceBranch].lastCommit?.shortSha}</span>
                <span>•</span>
                <span>{branches[sourceBranch].lastCommit?.author}</span>
                <span>•</span>
                <span>{branches[sourceBranch].imagesCount} immagini</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/40">Caricamento informazioni branch...</p>
          )}
        </div>

        {/* Direction Indicator (Fixed Inward PULL) */}
        <div className="md:col-span-1 flex flex-col items-center justify-center gap-1">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm" title="Solo importazione (PULL) nel tuo ambiente">
            <ArrowRight size={18} className="animate-pulse" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-primary">PULL</span>
        </div>

        {/* Target card */}
        <div className="md:col-span-5 p-5 rounded-2xl border-2 border-primary/30 bg-primary/5 relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${targetBranch === 'main' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-[11px] font-black uppercase tracking-wider text-primary font-bold">
                Tuo Ambiente Corrente (Destinazione)
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${targetBranch === 'main' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              branch: {targetBranch}
            </span>
          </div>
          {branches?.[targetBranch]?.lastCommit ? (
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground truncate" title={branches[targetBranch].lastCommit?.message}>
                {branches[targetBranch].lastCommit?.message}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-foreground/50 font-mono">
                <span>{branches[targetBranch].lastCommit?.shortSha}</span>
                <span>•</span>
                <span>{branches[targetBranch].lastCommit?.author}</span>
                <span>•</span>
                <span>{branches[targetBranch].imagesCount} immagini</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/40">Caricamento informazioni branch...</p>
          )}
        </div>
      </div>

      {/* Pages filter and list section */}
      <AdminSection
        title="Confronto Pagina per Pagina"
        description="Espandi qualsiasi pagina per esaminare il diff specifico e i valori a confronto. Clicca 'Importa nella bozza' per aggiornare il tuo ambiente locale senza effettuare deploy automatici."
        action={
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
            {diffCount} {diffCount === 1 ? 'pagina con differenze' : 'pagine con differenze'}
          </span>
        }
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Cerca per URL, titolo o categoria..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-foreground/10 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-foreground/70 cursor-pointer self-start sm:self-center select-none">
            <input
              type="checkbox"
              checked={onlyDiffs}
              onChange={(e) => setOnlyDiffs(e.target.checked)}
              className="rounded border-foreground/20 text-primary focus:ring-primary w-4 h-4"
            />
            <span>Mostra solo pagine con differenze</span>
          </label>
        </div>

        {/* Scopes table with expandable diffs */}
        <div className="border border-foreground/10 rounded-2xl overflow-hidden bg-background">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-foreground/40 text-xs">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span>Confronto rami in corso...</span>
            </div>
          ) : filteredScopes.length === 0 ? (
            <div className="py-16 text-center text-foreground/40 text-xs space-y-1">
              <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
              <p className="font-bold text-foreground">Nessuna differenza da mostrare!</p>
              <p>Tutte le pagine visualizzate sono perfettamente allineate tra {sourceBranch} e {targetBranch}.</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/5">
              {filteredScopes.map((item) => {
                const isExpanded = expandedScopeIds.has(item.scope.id);
                const sourceVal = sourceBranch === "dev" ? item.devValue : item.mainValue;
                const targetVal = targetBranch === "dev" ? item.devValue : item.mainValue;
                const missingImgs = targetBranch === "main" ? item.devMissingOnMain : item.mainMissingOnDev;

                return (
                  <div key={item.scope.id} className="transition-colors">
                    {/* Row Header */}
                    <div className="p-4 hover:bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.scope.id)}
                            className="p-1 rounded-lg hover:bg-muted text-foreground/60 hover:text-foreground transition-transform"
                            title={isExpanded ? "Comprimi diff" : "Espandi diff specifico"}
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : ""}`}
                            />
                          </button>

                          <span
                            onClick={() => toggleExpand(item.scope.id)}
                            className="font-bold text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors"
                          >
                            {item.scope.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-foreground/60">
                            {item.scope.category}
                          </span>
                          {item.hasDiff ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Differenze
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-[10px]">
                              Identica
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-foreground/40 font-mono text-[11px] pl-6">
                          <span className="text-primary font-semibold">{item.scope.url}</span>
                          <span>•</span>
                          <span>Scope: {item.scope.jsonPath}</span>
                          {missingImgs.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-sans font-medium flex items-center gap-1">
                                <ImageIcon size={12} />
                                {missingImgs.length} {missingImgs.length === 1 ? 'nuova immagine' : 'nuove immagini'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.scope.id)}
                          className="px-3 py-1.5 rounded-xl border border-foreground/10 hover:bg-muted text-[11px] font-bold text-foreground/70 transition-all flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>{isExpanded ? "Nascondi Diff" : "Vedi Diff"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImportPageLocally(item)}
                          disabled={!item.hasDiff}
                          className="px-4 py-1.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Download size={13} />
                          <span>Importa nella Bozza</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Diff Accordion */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-muted/30 border-t border-foreground/5 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <FileCode size={13} />
                            <span>Confronto Valori: {item.scope.title}</span>
                          </span>
                          <span className="text-[10px] text-foreground/50 font-mono">
                            Path: {item.scope.jsonPath}
                          </span>
                        </div>

                        {/* Side by side preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          {/* Source View (Remote) */}
                          <div className="p-3.5 rounded-xl bg-background border border-foreground/10 space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-foreground/5">
                              <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                                {sourceBranch} (Sorgente remota)
                              </span>
                              <span className="text-[10px] text-foreground/40">Valore disponibile</span>
                            </div>
                            <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap break-all max-h-72 overflow-y-auto custom-scrollbar p-1">
                              {sourceVal ? JSON.stringify(sourceVal, null, 2) : "(Non definito / assente)"}
                            </pre>
                          </div>

                          {/* Target View (Local) */}
                          <div className="p-3.5 rounded-xl bg-background border border-foreground/10 space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-foreground/5">
                              <span className="font-bold text-primary text-[11px] uppercase tracking-wider">
                                {targetBranch} (Tuo ambiente locale)
                              </span>
                              <span className="text-[10px] text-foreground/40">Valore attuale</span>
                            </div>
                            <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap break-all max-h-72 overflow-y-auto custom-scrollbar p-1">
                              {targetVal ? JSON.stringify(targetVal, null, 2) : "(Non definito / assente)"}
                            </pre>
                          </div>
                        </div>

                        {/* Action inside expanded section */}
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[11px] text-foreground/50">
                            Cliccando su &quot;Importa nella bozza&quot;, il valore di destra verrà aggiornato con quello di sinistra.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleImportPageLocally(item)}
                            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
                          >
                            <Download size={13} />
                            <span>Importa questa pagina nella bozza</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminSection>

      {/* Monaco DiffEditor Drawer / Fullscreen View */}
      {isDiffEditorOpen && (
        <div className="fixed inset-0 z-[130] flex flex-col bg-background animate-fade-in">
          {/* Editor Header */}
          <div className="px-6 py-3.5 border-b border-foreground/10 flex items-center justify-between gap-4 bg-muted/20">
            <div className="flex items-center gap-3">
              <FileCode size={20} className="text-primary" />
              <div>
                <h3 className="font-black text-sm text-foreground">
                  Confronto Riga per Riga (Monaco DiffEditor)
                </h3>
                <p className="text-[11px] text-foreground/50 font-mono">
                  Sinistra: <strong>{sourceBranch} (Sorgente remota)</strong> | Destra: <strong>{targetBranch} (Bozza locale modificabile)</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDiffEditorOpen(false)}
                className="px-4 py-2 rounded-xl border border-foreground/10 hover:bg-muted text-xs font-bold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleApplyDiffLocally}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/20"
              >
                <Download size={13} />
                <span>Applica Modifiche nella Bozza Locale</span>
              </button>
            </div>
          </div>

          {/* Monaco Diff View */}
          <div className="flex-1 w-full bg-[#1e1e1e]">
            <DiffEditor
              height="100%"
              language="json"
              theme="vs-dark"
              original={JSON.stringify(sourceContent, null, 2)}
              modified={diffEditorTargetCode}
              onMount={(editor) => {
                diffEditorRef.current = editor;
              }}
              options={{
                readOnly: false,
                originalEditable: false,
                automaticLayout: true,
                renderSideBySide: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 13,
                wordWrap: "on"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
