"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  GitCompare,
  ArrowRight,
  ArrowLeftRight,
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
  ChevronRight,
  Lock,
  Calendar,
  User,
  GitCommit,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { PageScope } from "@/lib/contentScopes";

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
  devImagesCount: number;
  mainImagesCount: number;
  devMissingOnMain: string[];
  mainMissingOnDev: string[];
}

export function SyncTab() {
  const { adminSecret, activeBranch } = useAdmin();

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

  // Promote modal / drawer states
  const [selectedScope, setSelectedScope] = useState<ScopedDiffItem | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState<{
    success: boolean;
    commitUrl?: string;
    shortSha?: string;
    copiedImagesCount?: number;
    msg?: string;
  } | null>(null);

  // Monaco Diff Editor Drawer
  const [isDiffEditorOpen, setIsDiffEditorOpen] = useState(false);
  const [diffEditorTargetCode, setDiffEditorTargetCode] = useState<string>("");
  const diffEditorRef = useRef<any>(null);

  const sourceContent = sourceBranch === "dev" ? contentDev : contentMain;
  const targetContent = targetBranch === "dev" ? contentDev : contentMain;

  // Load comparison data
  const fetchComparison = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPromoteResult(null);

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

  // Execute single page promotion
  const handlePromotePage = async (scopeItem: ScopedDiffItem) => {
    if (!adminSecret) {
      setError("Inserisci la password di amministrazione (chiave in alto a destra) per eseguire promozioni.");
      return;
    }

    setIsPromoting(true);
    setError(null);
    setPromoteResult(null);

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({
          sourceBranch,
          targetBranch,
          mode: "page",
          jsonPath: scopeItem.scope.jsonPath,
          pageUrl: scopeItem.scope.url,
          message: `Promote page ${scopeItem.scope.url} (${sourceBranch} -> ${targetBranch}) via Admin`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore durante la promozione");
      }

      setPromoteResult({
        success: true,
        commitUrl: data.commitUrl,
        shortSha: data.shortSha,
        copiedImagesCount: data.copiedImagesCount,
        msg: `Pagina "${scopeItem.scope.title}" promossa con successo su ${targetBranch}!`
      });

      setSelectedScope(null);
      // Refresh comparison
      await fetchComparison();
    } catch (err: any) {
      setError(err.message || "Errore durante la promozione");
    } finally {
      setIsPromoting(false);
    }
  };

  // Open line-by-line diff editor
  const handleOpenDiffEditor = () => {
    if (!targetContent) return;
    setDiffEditorTargetCode(JSON.stringify(targetContent, null, 2));
    setIsDiffEditorOpen(true);
  };

  // Promote raw JSON from diff editor
  const handlePromoteFromDiffEditor = async () => {
    if (!diffEditorRef.current) return;
    const modifiedModel = diffEditorRef.current.getModifiedEditor().getModel();
    const modifiedValue = modifiedModel.getValue();

    let parsed: any;
    try {
      parsed = JSON.parse(modifiedValue);
    } catch (e) {
      setError("Il JSON nell'editor di destinazione non è valido. Correggi gli errori di sintassi prima di promuovere.");
      return;
    }

    setIsPromoting(true);
    setError(null);
    setPromoteResult(null);

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || ""
        },
        body: JSON.stringify({
          sourceBranch,
          targetBranch,
          mode: "raw_json",
          customTargetContent: parsed,
          message: `Apply customized diff promotion (${sourceBranch} -> ${targetBranch}) via Admin`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore durante la promozione del JSON");
      }

      setPromoteResult({
        success: true,
        commitUrl: data.commitUrl,
        shortSha: data.shortSha,
        copiedImagesCount: data.copiedImagesCount,
        msg: `Modifiche riga per riga applicate con successo su ${targetBranch}!`
      });

      setIsDiffEditorOpen(false);
      await fetchComparison();
    } catch (err: any) {
      setError(err.message || "Errore durante il salvataggio");
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <GitCompare size={15} />
            <span>Gestione Ambienti & Deployment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Sincronizzazione Dev ⇄ Main
          </h1>
          <p className="text-sm text-foreground/50 mt-1 max-w-2xl">
            Confronta i contenuti e le immagini tra il branch di sviluppo (<code className="font-mono text-amber-500">dev</code>)
            e la produzione (<code className="font-mono text-emerald-500">main</code>). Promuovi modifiche selettivamente per singola pagina o riga per riga.
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
            disabled={!contentDev || !contentMain}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-foreground/10 text-xs font-bold text-foreground transition-all shadow-sm"
          >
            <FileCode size={14} className="text-primary" />
            <span>Confronto Riga per Riga</span>
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

      {/* Success alert */}
      {promoteResult && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 size={18} />
              <span>{promoteResult.msg}</span>
            </div>
            <button onClick={() => setPromoteResult(null)} className="p-1 hover:bg-emerald-500/20 rounded-lg">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-foreground/70 font-mono">
            {promoteResult.shortSha && (
              <span>Commit SHA: <strong className="text-foreground">{promoteResult.shortSha}</strong></span>
            )}
            {typeof promoteResult.copiedImagesCount === "number" && (
              <span>Immagini sincronizzate: <strong className="text-foreground">{promoteResult.copiedImagesCount}</strong></span>
            )}
            {promoteResult.commitUrl && (
              <a
                href={promoteResult.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
              >
                <span>Vedi commit su GitHub</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Branch overview cards & direction selector */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Source card */}
        <div className="md:col-span-5 p-5 rounded-2xl border border-foreground/10 bg-muted/20 relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${sourceBranch === 'main' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground/40">Sorgente (Da copiare)</span>
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
          <div className="p-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm" title="Solo importazione (PULL) nell'ambiente corrente">
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
                Ambiente Corrente (Destinazione)
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
        title="Pagine del Sito & Differenze Rilevate"
        description="Seleziona la pagina da promuovere. La promozione sovrascrive a destinazione ESCLUSIVAMENTE la pagina scelta e trasferisce automaticamente le immagini referenziate mancanti."
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

        {/* Scopes table */}
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
              <p>Tutte le pagine visualizzate sono perfettamente sincronizzate tra {sourceBranch} e {targetBranch}.</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/5">
              {filteredScopes.map((item) => {
                const missingImgs = targetBranch === "main" ? item.devMissingOnMain : item.mainMissingOnDev;

                return (
                  <div
                    key={item.scope.id}
                    className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm truncate">
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

                      <div className="flex flex-wrap items-center gap-3 text-foreground/40 font-mono text-[11px]">
                        <span className="text-primary font-semibold">{item.scope.url}</span>
                        <span>•</span>
                        <span>Scope: {item.scope.jsonPath}</span>
                        {missingImgs.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-sans font-medium flex items-center gap-1">
                              <ImageIcon size={12} />
                              {missingImgs.length} {missingImgs.length === 1 ? 'nuova immagine' : 'nuove immagini'} da copiare
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedScope(item)}
                        disabled={!item.hasDiff || isPromoting}
                        className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>Promuovi Pagina</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminSection>

      {/* Confirmation Modal for Page Promotion */}
      {selectedScope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-background border border-foreground/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Conferma Promozione Scoped</span>
                <h3 className="text-lg font-black text-foreground">
                  {selectedScope.scope.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedScope(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-foreground/40 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-foreground/70">
              <p>
                Stai per importare la pagina <strong className="text-foreground">{selectedScope.scope.url}</strong> dal branch{" "}
                <span className="font-mono text-primary font-bold">{sourceBranch}</span> nel tuo ambiente corrente (branch:{" "}
                <span className="font-mono text-primary font-bold">{targetBranch}</span>).
              </p>

              <div className="p-3.5 rounded-2xl bg-muted/40 border border-foreground/5 space-y-1.5 font-mono text-[11px]">
                <div>URL target: <strong className="text-foreground">{selectedScope.scope.url}</strong></div>
                <div>Percorso JSON sovrascritto: <strong className="text-foreground">{selectedScope.scope.jsonPath}</strong></div>
                <div className="text-emerald-400 font-sans font-medium text-xs pt-1">
                  ✓ Tutto il resto di content.json su {targetBranch} rimarrà inalterato.
                </div>
              </div>

              {((targetBranch === "dev" ? selectedScope.mainMissingOnDev : selectedScope.devMissingOnMain).length > 0) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ImageIcon size={14} />
                    <span>Sincronizzazione Immagini Automatica</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Questa pagina referenzia immagini presenti su {sourceBranch} che non esistono ancora su {targetBranch}. Verranno copiate automaticamente:
                  </p>
                  <ul className="list-disc list-inside font-mono text-[10px] space-y-0.5 text-amber-100">
                    {(targetBranch === "dev" ? selectedScope.mainMissingOnDev : selectedScope.devMissingOnMain).map((img, i) => (
                      <li key={i} className="truncate">{img}</li>
                    ))}
                  </ul>
                </div>
              )}

              {targetBranch === "main" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-red-400" />
                  <span>Stai importando modifiche in <strong>PRODUZIONE</strong> (main). Questo innescherà un nuovo deployment su Vercel.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedScope(null)}
                className="px-4 py-2 rounded-full border border-foreground/10 text-xs font-bold hover:bg-muted"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handlePromotePage(selectedScope)}
                disabled={isPromoting}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/90 flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isPromoting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Importazione in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Importa su {targetBranch}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Sinistra: <strong>{sourceBranch} (Sorgente)</strong> | Destra: <strong>{targetBranch} (Destinazione - Modificabile)</strong>
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
                onClick={handlePromoteFromDiffEditor}
                disabled={isPromoting}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {isPromoting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <span>Salva & Promuovi su {targetBranch}</span>
                    <ArrowRight size={13} />
                  </>
                )}
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
