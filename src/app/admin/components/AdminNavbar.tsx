"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  KeyRound,
  UploadCloud,
  Layers,
  Menu,
  Check,
  Loader2,
  Eye,
  PanelLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "../context/AdminContext";
import { DiffModal } from "./DiffModal";

interface AdminNavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isPreviewOpen?: boolean;
  onTogglePreview?: () => void;
}

export function AdminNavbar({
  onToggleSidebar,
  isSidebarCollapsed = false,
  onToggleCollapse,
  isPreviewOpen,
  onTogglePreview
}: AdminNavbarProps) {
  const {
    adminSecret,
    setAdminSecret,
    handlePublish,
    isPublishing,
    diffList,
    hasUnsavedChanges,
    activeBranch,
    lastDraftSavedAt
  } = useAdmin();

  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [tempSecret, setTempSecret] = useState(adminSecret);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  const handleSaveSecret = () => {
    const trimmed = tempSecret.trim();
    setAdminSecret(trimmed);
    setTempSecret(trimmed);
    setIsSecretOpen(false);
  };

  const handleSidebarClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onToggleSidebar();
    } else if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      onToggleSidebar();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-foreground/5 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle / Desktop Collapse & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSidebarClick}
            className="p-2 hover:bg-muted rounded-xl text-foreground/70 hover:text-foreground transition-colors"
            title={isSidebarCollapsed ? "Espandi barra laterale" : "Comprimi barra laterale"}
            aria-label="Attiva/disattiva barra laterale"
          >
            <PanelLeft size={20} className={cn("transition-transform duration-200", isSidebarCollapsed && "text-primary rotate-180")} />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo_attomatti.svg"
              alt="Gli Attomatti"
              width={32}
              height={32}
              className="h-8 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="font-black text-lg uppercase tracking-tight text-foreground hidden sm:inline">
              Gli Attomatti <span className="text-primary text-xs font-bold tracking-widest ml-1 px-2 py-0.5 rounded-full bg-primary/10">CMS</span>
            </span>
          </Link>
        </div>

        {/* Center: Branch & Environment Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-foreground/5 text-xs font-mono font-semibold text-foreground/60">
          <div className={`w-2 h-2 rounded-full ${activeBranch === 'main' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span>Branch:</span>
          <span className={`font-bold ${activeBranch === 'main' ? 'text-emerald-400' : 'text-amber-400'}`}>{activeBranch}</span>
        </div>

        {/* Right: Actions (Diff, Secret, Publish, View Site, Anteprima) */}
        <div className="flex items-center gap-2.5">
          {/* Anteprima Toggle Button */}
          {onTogglePreview && (
            <button
              type="button"
              onClick={onTogglePreview}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                isPreviewOpen
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 text-foreground/70 hover:text-foreground border-foreground/10 hover:border-foreground/20"
              )}
              title={isPreviewOpen ? "Nascondi Anteprima Affiancata" : "Mostra Anteprima Affiancata"}
            >
              <Eye size={13} className={cn(isPreviewOpen ? "text-primary-foreground" : "text-primary")} />
              <span>Anteprima</span>
            </button>
          )}

          {/* View Website Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
          >
            <span>Vedi Sito</span>
            <ExternalLink size={12} />
          </Link>

          {/* Password Manager Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setTempSecret(adminSecret);
                setIsSecretOpen(!isSecretOpen);
              }}
              title="Gestisci Password Admin"
              className={cn(
                "p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                adminSecret
                  ? "bg-muted/40 text-emerald-400 hover:bg-muted"
                  : "bg-rose-500/10 text-rose-400 animate-pulse border border-rose-500/20"
              )}
            >
              <KeyRound size={16} />
              <span className="hidden md:inline">
                {adminSecret ? "Autenticato" : "Inserisci Chiave"}
              </span>
            </button>

            {isSecretOpen && (
              <div className="absolute right-0 mt-3 w-80 p-5 rounded-3xl bg-background border border-foreground/10 shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Password Admin
                  </h4>
                  <span className="text-[10px] text-foreground/40 font-mono">
                    x-admin-secret
                  </span>
                </div>
                <input
                  type="password"
                  value={tempSecret}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTempSecret(val);
                    if (val.trim()) {
                      setAdminSecret(val.trim());
                    }
                  }}
                  onBlur={() => {
                    if (tempSecret.trim()) {
                      handleSaveSecret();
                    }
                  }}
                  placeholder="Inserisci password..."
                  className="w-full p-3 rounded-xl bg-muted/40 border border-foreground/10 focus:border-primary text-xs font-mono outline-none text-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveSecret()}
                />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px]">
                    {adminSecret ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={11} /> Password attiva
                      </span>
                    ) : (
                      <span className="text-foreground/40">Salvata nella sessione locale</span>
                    )}
                  </span>
                  <button
                    onClick={handleSaveSecret}
                    className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <Check size={12} /> Salva
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Unsaved Changes / Diff Badge & Auto-save Time */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              {lastDraftSavedAt && (
                <span
                  className="hidden lg:inline text-[11px] font-medium text-foreground/40"
                  title="Salvataggio automatico di failover attivo"
                >
                  Bozza: {lastDraftSavedAt}
                </span>
              )}
              <button
                onClick={() => setIsDiffOpen(true)}
                className="px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-400/20 transition-all"
                title="Vedi le modifiche non pubblicate"
              >
                <Layers size={14} />
                <span>{diffList.length}</span>
                <span className="hidden md:inline">modifiche</span>
              </button>
            </div>
          )}

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg",
              hasUnsavedChanges
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20 scale-[1.02]"
                : "bg-muted text-foreground/40 hover:text-foreground",
              isPublishing && "opacity-75 cursor-not-allowed"
            )}
          >
            {isPublishing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Pubblicazione...</span>
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                <span>Pubblica</span>
                <span className="hidden sm:inline font-mono text-[10px] opacity-60 bg-black/20 px-1.5 py-0.5 rounded ml-0.5">
                  ⌘S
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Diff Inspector Modal */}
      <DiffModal isOpen={isDiffOpen} onClose={() => setIsDiffOpen(false)} />
    </>
  );
}
