"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Upload,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  Link2,
  Eye,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  Info,
  Loader2
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { findAllImageReferences, ImageReference } from "../utils/imageReferences";
import { Lightbox } from "@/components/ui/Lightbox";
import { MediaImage } from "../components/ui/MediaLibraryModal";

interface GalleryTabProps {
  onNavigateTab?: (tabId: string) => void;
}

export function GalleryTab({ onNavigateTab }: GalleryTabProps) {
  const { content, adminSecret } = useAdmin();
  const [images, setImages] = useState<MediaImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "used" | "unused">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_used" | "least_used" | "name">("newest");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live image references from current admin draft content
  const referencesMap = useMemo(() => {
    return findAllImageReferences(content);
  }, [content]);

  // Fetch images from API
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (adminSecret) {
        headers["x-admin-secret"] = adminSecret;
      }
      const res = await fetch("/api/images", { headers });
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      } else {
        console.error("Failed to load images");
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [adminSecret]);

  // Direct upload handler
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!adminSecret) {
      alert("Per favore, inserisci prima la Password di Amministrazione in alto per caricare nuove immagini.");
      return;
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "x-admin-secret": adminSecret
          },
          body: formData
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`Errore nel caricamento di ${file.name}: ${err.error || "Errore sconosciuto"}`);
        }
      }
      // Refresh list
      await fetchImages();
    } catch (err) {
      alert(`Errore di rete: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Copy URL to clipboard
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => {
      setCopiedUrl((prev) => (prev === url ? null : prev));
    }, 2000);
  };

  // Enhance each image with reference count and list
  const enrichedImages = useMemo(() => {
    return images.map((img) => {
      const refs = referencesMap.get(img.url) || [];
      return {
        ...img,
        references: refs,
        isUsed: refs.length > 0
      };
    });
  }, [images, referencesMap]);

  // Statistics
  const totalCount = enrichedImages.length;
  const usedCount = useMemo(() => enrichedImages.filter((i) => i.isUsed).length, [enrichedImages]);
  const unusedCount = totalCount - usedCount;

  // Filter & Sort
  const displayedImages = useMemo(() => {
    let list = enrichedImages;

    // Filter by type
    if (filterType === "used") {
      list = list.filter((i) => i.isUsed);
    } else if (filterType === "unused") {
      list = list.filter((i) => !i.isUsed);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => {
        const matchesName = i.name.toLowerCase().includes(q);
        const matchesUrl = i.url.toLowerCase().includes(q);
        const matchesRef = i.references.some(
          (r) => r.page.toLowerCase().includes(q) || r.section.toLowerCase().includes(q)
        );
        return matchesName || matchesUrl || matchesRef;
      });
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return b.timestamp - a.timestamp;
      if (sortBy === "oldest") return a.timestamp - b.timestamp;
      if (sortBy === "most_used") return b.references.length - a.references.length;
      if (sortBy === "least_used") return a.references.length - b.references.length;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [enrichedImages, filterType, searchQuery, sortBy]);

  // Format date helper
  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return "Data non disponibile";
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return "Data non disponibile";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <ImageIcon size={19} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              Galleria Immagini & Asset
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground/50 max-w-2xl leading-relaxed">
            Monitora tutte le immagini caricate nel sito, scopri in quali pagine e sezioni vengono visualizzate, ed individua subito i file orfani o inutilizzati.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleUploadFiles(e.target.files)}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Caricamento...
              </>
            ) : (
              <>
                <Upload size={14} /> Carica Nuove Foto
              </>
            )}
          </button>
          <button
            type="button"
            onClick={fetchImages}
            title="Aggiorna lista immagini"
            disabled={isLoading}
            className="p-2.5 bg-muted/30 hover:bg-muted/60 text-foreground/70 rounded-xl transition-all border border-foreground/10"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div
          onClick={() => setFilterType("all")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterType === "all"
              ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
              : "bg-muted/15 border-foreground/10 hover:border-foreground/20 hover:bg-muted/25"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-foreground/50">
              Totale Immagini
            </span>
            <Layers size={18} className="text-foreground/40" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{totalCount}</span>
            <span className="text-xs text-foreground/40 font-medium">file nel sito</span>
          </div>
        </div>

        {/* In Use */}
        <div
          onClick={() => setFilterType("used")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterType === "used"
              ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
              : "bg-muted/15 border-foreground/10 hover:border-foreground/20 hover:bg-muted/25"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Utilizzate nel Sito
            </span>
            <Check size={18} className="text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{usedCount}</span>
            <span className="text-xs text-foreground/40 font-medium">
              {totalCount > 0 ? `${Math.round((usedCount / totalCount) * 100)}% del totale` : ""}
            </span>
          </div>
        </div>

        {/* Unused (Highlighted!) */}
        <div
          onClick={() => setFilterType("unused")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterType === "unused"
              ? "bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20"
              : unusedCount > 0
              ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
              : "bg-muted/15 border-foreground/10 hover:border-foreground/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Non Mostrate nel Sito
              </span>
              {unusedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">
                  Attenzione
                </span>
              )}
            </div>
            <AlertTriangle size={18} className="text-amber-400 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{unusedCount}</span>
            <span className="text-xs text-foreground/40 font-medium">
              {unusedCount === 1 ? "immagine orfana" : "immagini orfane"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-muted/20 border border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterType === "all"
                ? "bg-foreground/15 text-foreground font-black shadow-sm"
                : "text-foreground/50 hover:text-foreground hover:bg-muted/40"
            }`}
          >
            Tutte ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("used")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterType === "used"
                ? "bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30 shadow-sm"
                : "text-foreground/50 hover:text-emerald-400 hover:bg-muted/40"
            }`}
          >
            <Check size={12} strokeWidth={3} />
            In uso ({usedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("unused")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterType === "unused"
                ? "bg-amber-500/20 text-amber-400 font-black border border-amber-500/30 shadow-sm"
                : "text-foreground/50 hover:text-amber-400 hover:bg-muted/40"
            }`}
          >
            <AlertTriangle size={12} />
            Non mostrate ({unusedCount})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome, pagina o URL..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background/60 border border-foreground/10 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <ArrowUpDown size={13} className="text-foreground/40 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-background/60 border border-foreground/10 text-xs font-bold text-foreground/80 focus:border-primary focus:outline-none transition-all cursor-pointer"
            >
              <option value="newest">Più recenti</option>
              <option value="oldest">Meno recenti</option>
              <option value="most_used">Più utilizzate</option>
              <option value="least_used">Meno utilizzate</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Images */}
      {isLoading && images.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-foreground/40">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Caricamento galleria del sito...</p>
        </div>
      ) : displayedImages.length === 0 ? (
        <div className="p-16 border border-dashed border-foreground/10 rounded-3xl text-center bg-muted/10">
          <ImageIcon className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground/80">Nessuna immagine trovata</h3>
          <p className="text-xs text-foreground/40 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Nessuna corrispondenza per "${searchQuery}". Prova a modificare i filtri o il termine cercato.`
              : filterType === "unused"
              ? "Ottima notizia! Tutte le foto caricate sono attualmente collegate ad almeno una pagina del sito."
              : "Non ci sono immagini caricate al momento."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedImages.map((img) => {
            const isCopied = copiedUrl === img.url;
            const refCount = img.references.length;

            return (
              <div
                key={img.url}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-background/40 group ${
                  !img.isUsed
                    ? "border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-500/5 bg-amber-500/[0.02]"
                    : "border-foreground/10 hover:border-foreground/25 hover:shadow-xl"
                }`}
              >
                {/* Image Preview Box */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40 border-b border-foreground/5">
                  <Image
                    src={img.url}
                    alt={img.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Top-Right Badge: Highlight Used / Unused */}
                  <div className="absolute top-3 right-3 z-10">
                    {!img.isUsed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-black text-[11px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md">
                        <AlertTriangle size={12} strokeWidth={2.5} />
                        Non mostrata
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-black text-[11px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md">
                        <Check size={12} strokeWidth={3} />
                        {refCount} {refCount === 1 ? "utilizzo" : "utilizzi"}
                      </span>
                    )}
                  </div>

                  {/* Folder badge if nested */}
                  {img.folder && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-foreground/80 border border-white/10">
                      {img.folder}
                    </div>
                  )}

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(img.url)}
                      title="Ingrandisci anteprima"
                      className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all hover:scale-110 shadow-lg"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(img.url)}
                      title="Copia percorso URL"
                      className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-full transition-all hover:scale-110 shadow-lg"
                    >
                      {isCopied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Filename & size */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className="text-xs font-black uppercase tracking-tight text-foreground line-clamp-1"
                        title={img.name}
                      >
                        {img.name}
                      </h4>
                      {img.size && (
                        <span className="text-[10px] font-mono text-foreground/40 shrink-0">
                          {(img.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>

                    {/* URL path bar with copy button */}
                    <div
                      onClick={() => handleCopy(img.url)}
                      className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-foreground/5 font-mono text-[10px] text-foreground/60 hover:text-foreground flex items-center justify-between gap-2 cursor-pointer transition-colors group/copy"
                      title="Clicca per copiare l'URL"
                    >
                      <span className="truncate">{img.url}</span>
                      <span className="shrink-0 text-foreground/30 group-hover/copy:text-primary">
                        {isCopied ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Copiato!
                          </span>
                        ) : (
                          <Copy size={12} />
                        )}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-foreground/30 font-medium">
                      Caricata: {formatDate(img.timestamp)}
                    </div>
                  </div>

                  {/* References Section */}
                  <div className="pt-3 border-t border-foreground/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">
                        Dove si trova nel sito:
                      </span>
                      <span className="text-[10px] font-bold text-foreground/60">
                        {refCount} {refCount === 1 ? "collegamento" : "collegamenti"}
                      </span>
                    </div>

                    {!img.isUsed ? (
                      /* Warning box for unused images */
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-amber-300">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                        <p className="text-[11px] leading-snug">
                          <strong>Immagine non mostrata:</strong> nessun testo o sezione del sito fa riferimento a questa foto.
                        </p>
                      </div>
                    ) : (
                      /* Detailed references list */
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {img.references.map((ref, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-2 rounded-xl bg-muted/20 border border-foreground/5 hover:border-foreground/20 transition-all flex items-start justify-between gap-2 text-xs group/ref"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                                  {ref.page}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-foreground/75 mt-1 line-clamp-2">
                                {ref.section}
                              </p>
                            </div>

                            {onNavigateTab && (
                              <button
                                type="button"
                                onClick={() => onNavigateTab(ref.tabId)}
                                title={`Modifica in ${ref.page}`}
                                className="p-1 rounded-lg hover:bg-primary/20 text-foreground/30 hover:text-primary transition-all shrink-0 mt-0.5"
                              >
                                <ExternalLink size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {lightboxImage && (
        <Lightbox
          images={[{ url: lightboxImage, alt: "Anteprima foto" }]}
          initialIndex={0}
          isOpen={true}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
