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
  Info,
  Loader2,
  X,
  Trash2,
  Plus,
  CheckCircle2
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { findAllImageReferences, ImageReference } from "../utils/imageReferences";
import { Lightbox } from "@/components/ui/Lightbox";
import { MediaImage } from "../components/ui/MediaLibraryModal";
import { compressImageClient } from "@/lib/clientImageCompress";

function StagedThumbnail({
  file,
  onRemove
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group rounded-xl overflow-hidden border border-foreground/10 bg-muted/40 p-2.5 flex items-center gap-3 hover:border-foreground/25 transition-all">
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-background relative shrink-0 border border-foreground/10">
        {previewUrl ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/30">
            <ImageIcon size={16} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-foreground/50 mt-0.5 font-medium">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all shrink-0"
        title="Rimuovi dal buffer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

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
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [deleteModalData, setDeleteModalData] = useState<{
    urls: string[];
    names: string[];
    references: ImageReference[];
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Add files to staging buffer
  const handleSelectFilesToBuffer = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const array = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (array.length === 0) {
      alert("Seleziona solo file immagine validi (JPG, PNG, WebP, etc.).");
      return;
    }

    setStagedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const toAdd = array.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...toAdd];
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload all staged files in 1 single commit with client pre-compression
  const handleUploadStaged = async () => {
    if (stagedFiles.length === 0) return;
    if (!adminSecret) {
      alert("Per favore, inserisci prima la Password di Amministrazione in alto per procedere al salvataggio.");
      return;
    }

    setIsUploading(true);
    setUploadProgressText("Preparazione...");
    try {
      const stagedBlobs: Array<{ path: string; sha: string; url: string }> = [];

      // 1. Stage each file individually (pre-compressed client-side to WebP < 250KB)
      for (let i = 0; i < stagedFiles.length; i++) {
        const file = stagedFiles[i];
        setUploadProgressText(`Ottimizzazione e invio foto ${i + 1} di ${stagedFiles.length}...`);

        const compressedFile = await compressImageClient(file, 1920, 0.82);

        const formData = new FormData();
        formData.append("action", "stage");
        formData.append("file", compressedFile);

        const stageRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "x-admin-secret": adminSecret
          },
          body: formData
        });

        if (!stageRes.ok) {
          const err = await stageRes.json().catch(() => ({}));
          throw new Error(err.error || `Errore durante il caricamento di "${file.name}"`);
        }

        const stageData = await stageRes.json();
        stagedBlobs.push({
          path: stageData.filePath,
          sha: stageData.blobSha,
          url: stageData.url
        });
      }

      // 2. Commit all staged files together in 1 single commit (tiny ~1KB JSON payload)
      setUploadProgressText("Creazione commit unico su GitHub...");
      const commitRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({
          action: "commit",
          items: stagedBlobs,
          message: `Upload batch of ${stagedBlobs.length} images via Admin Gallery`
        })
      });

      if (!commitRes.ok) {
        const err = await commitRes.json().catch(() => ({}));
        throw new Error(err.error || "Errore durante il salvataggio su GitHub");
      }

      const count = stagedBlobs.length;
      setStagedFiles([]);
      setSuccessMessage(`${count} ${count === 1 ? "foto caricata" : "foto caricate"} con successo con 1 solo commit Git!`);
      setTimeout(() => setSuccessMessage(null), 6000);
      await fetchImages();
    } catch (err) {
      alert(`Errore di caricamento: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText(null);
    }
  };

  // Toggle selection for an image
  const toggleSelectUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // Select all currently visible images
  const handleSelectAllDisplayed = () => {
    if (selectedUrls.length === displayedImages.length && displayedImages.length > 0) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(displayedImages.map((img) => img.url));
    }
  };

  // Select all unused images
  const handleSelectAllUnused = () => {
    const unused = enrichedImages.filter((img) => !img.isUsed).map((img) => img.url);
    setSelectedUrls(unused);
  };

  // Request deletion of a single image
  const handleRequestSingleDelete = (img: typeof enrichedImages[0]) => {
    setDeleteModalData({
      urls: [img.url],
      names: [img.name],
      references: img.references
    });
  };

  // Request deletion of selected images (batch)
  const handleRequestBatchDelete = () => {
    if (selectedUrls.length === 0) return;
    const selected = enrichedImages.filter((img) => selectedUrls.includes(img.url));
    const allRefs = selected.flatMap((img) => img.references);
    setDeleteModalData({
      urls: selectedUrls,
      names: selected.map((img) => img.name),
      references: allRefs
    });
  };

  // Confirm and execute deletion via API
  const handleConfirmDelete = async () => {
    if (!deleteModalData || deleteModalData.urls.length === 0) return;
    if (!adminSecret) {
      alert("Per favore, inserisci prima la Password di Amministrazione in alto per procedere all'eliminazione.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({ urls: deleteModalData.urls })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Errore durante l'eliminazione");
      }

      const data = await res.json();
      const count = data.count || deleteModalData.urls.length;
      const deletedSet = new Set(deleteModalData.urls);

      setImages((prev) => prev.filter((img) => !deletedSet.has(img.url)));
      setSelectedUrls((prev) => prev.filter((u) => !deletedSet.has(u)));
      setDeleteModalData(null);

      setSuccessMessage(
        `${count} ${count === 1 ? "foto eliminata" : "foto eliminate"} con successo (1 solo commit Git)!`
      );
      setTimeout(() => setSuccessMessage(null), 6000);
      await fetchImages();
    } catch (err) {
      alert(`Errore di eliminazione: ${(err as Error).message}`);
    } finally {
      setIsDeleting(false);
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
            onChange={(e) => handleSelectFilesToBuffer(e.target.files)}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
              stagedFiles.length > 0
                ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                : "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Caricamento...
              </>
            ) : stagedFiles.length > 0 ? (
              <>
                <Plus size={14} /> Aggiungi al Buffer ({stagedFiles.length})
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

      {/* Upload Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-lg transition-all"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Staged Upload Buffer Area */}
      {stagedFiles.length > 0 ? (
        <div className="p-5 rounded-2xl border-2 border-primary/40 bg-primary/5 shadow-xl shadow-primary/5 backdrop-blur-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Upload size={18} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Buffer di Caricamento ({stagedFiles.length} {stagedFiles.length === 1 ? "foto in attesa" : "foto in attesa"})
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                    1 Solo Commit Git
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">
                  Le immagini sono in attesa nel buffer locale. Clicca su &ldquo;Carica Tutte&rdquo; per ottimizzarle in WebP e salvarle insieme in un <strong>unico commit</strong> su GitHub (1 sola build Vercel).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-2 bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground rounded-xl text-xs font-bold transition-all border border-foreground/10 flex items-center gap-1.5"
              >
                <Plus size={14} /> Aggiungi Altre
              </button>
              <button
                type="button"
                onClick={() => setStagedFiles([])}
                disabled={isUploading}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center gap-1.5"
                title="Svuota il buffer"
              >
                <Trash2 size={14} /> Svuota
              </button>
              <button
                type="button"
                onClick={handleUploadStaged}
                disabled={isUploading}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/25 hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin shrink-0" /> {uploadProgressText || "Caricamento in corso..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Carica Tutte ({stagedFiles.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Grid of staged thumbnails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-foreground/10">
            {stagedFiles.map((file, idx) => (
              <StagedThumbnail
                key={`${file.name}-${file.size}-${idx}`}
                file={file}
                onRemove={() => handleRemoveStagedFile(idx)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleSelectFilesToBuffer(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.005]"
              : "border-foreground/15 hover:border-primary/50 bg-muted/10 hover:bg-muted/20"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto pointer-events-none">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Upload size={18} />
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Trascina qui le immagini o clicca per caricarle nel buffer
            </p>
            <p className="text-[11px] text-foreground/50">
              Aggiungi quante foto desideri: verranno raggruppate in un buffer locale e salvate con <strong>1 solo commit Git</strong>.
            </p>
          </div>
        </div>
      )}

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

          {unusedCount > 0 && (
            <button
              type="button"
              onClick={handleSelectAllUnused}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all shrink-0 flex items-center gap-1.5"
              title="Seleziona tutte le foto non utilizzate per eliminarle insieme"
            >
              <Trash2 size={12} />
              Seleziona orfane ({unusedCount})
            </button>
          )}

          {displayedImages.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllDisplayed}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-foreground/60 hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-foreground/10 transition-all shrink-0"
            >
              {selectedUrls.length === displayedImages.length ? "Deseleziona tutte" : "Seleziona tutte"}
            </button>
          )}
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
            const isSelected = selectedUrls.includes(img.url);
            const refCount = img.references.length;

            return (
              <div
                key={img.url}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-background/40 group ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 shadow-xl shadow-primary/10 bg-primary/[0.03]"
                    : !img.isUsed
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

                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectUrl(img.url);
                    }}
                    className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-lg ring-2 ring-white/50 opacity-100 scale-105"
                        : selectedUrls.length > 0
                        ? "bg-black/70 text-white/50 border border-white/30 opacity-100 hover:scale-105 hover:bg-black/90"
                        : "bg-black/60 text-white/40 border border-white/20 opacity-0 group-hover:opacity-100 hover:scale-105"
                    }`}
                    title={isSelected ? "Deseleziona foto" : "Seleziona foto"}
                  >
                    {isSelected ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <div className="w-3 h-3 rounded-[3px] border border-white/60" />
                    )}
                  </button>

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
                    <div className="absolute bottom-3 left-3 z-10 px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-foreground/80 border border-white/10">
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
                    <button
                      type="button"
                      onClick={() => handleRequestSingleDelete(img)}
                      title="Elimina immagine dal server"
                      className="p-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all hover:scale-110 shadow-lg"
                    >
                      <Trash2 size={18} />
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

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-foreground/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleRequestSingleDelete(img)}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-xl border border-red-500/20 transition-all flex items-center gap-1.5"
                      title="Elimina foto dal server"
                    >
                      <Trash2 size={12} />
                      Elimina
                    </button>

                    {img.isUsed && onNavigateTab && img.references[0] && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(img.references[0].tabId)}
                        className="text-[11px] font-medium text-foreground/50 hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[170px]"
                        title={`Vai a ${img.references[0].page}`}
                      >
                        <span className="truncate">Vai a {img.references[0].page}</span>
                        <ExternalLink size={11} className="shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Actions Bar */}
      {selectedUrls.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-background/95 backdrop-blur-xl border border-foreground/20 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {selectedUrls.length}
            </span>
            <span className="text-xs font-bold text-foreground">
              {selectedUrls.length === 1 ? "foto selezionata" : "foto selezionate"}
            </span>
          </div>

          <div className="h-4 w-px bg-foreground/20" />

          <button
            type="button"
            onClick={() => setSelectedUrls([])}
            className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            Deseleziona
          </button>

          <button
            type="button"
            onClick={handleRequestBatchDelete}
            className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/25 transition-all"
          >
            <Trash2 size={13} />
            Elimina Selezionate (1 commit)
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-foreground/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                  Elimina {deleteModalData.urls.length === 1 ? "Immagine" : `${deleteModalData.urls.length} Immagini`}
                </h3>
                <p className="text-xs text-foreground/60 mt-1">
                  {deleteModalData.urls.length === 1
                    ? `Sei sicuro di voler eliminare definitivamente "${deleteModalData.names[0]}"?`
                    : `Sei sicuro di voler eliminare ${deleteModalData.urls.length} immagini in un unico commit Git?`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                disabled={isDeleting}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {deleteModalData.references.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-amber-300">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                  <AlertTriangle size={15} />
                  <span>Attenzione: presenza di collegamenti nel sito!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/80">
                  Questa/e immagine/i risultano utilizzate in <strong>{deleteModalData.references.length}</strong> punto/i del sito. Se le elimini, tali pagine mostreranno immagini interrotte:
                </p>
                <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1 pr-1 text-[11px]">
                  {deleteModalData.references.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-amber-200">
                      <span className="font-bold text-amber-400">[{r.page}]</span> {r.section}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-foreground/40">
              L&apos;operazione cancellerà i file dal server e creerà un commit su GitHub. L&apos;azione non può essere annullata.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Eliminazione in corso...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Conferma Eliminazione
                  </>
                )}
              </button>
            </div>
          </div>
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
