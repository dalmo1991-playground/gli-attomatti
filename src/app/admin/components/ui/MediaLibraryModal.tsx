"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  Search,
  Upload,
  Check,
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  Calendar,
  Layers,
  RefreshCw,
  ExternalLink,
  Trash2
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { compressImageClient } from "@/lib/clientImageCompress";

export interface MediaImage {
  url: string;
  name: string;
  timestamp: number;
  size?: number;
  folder?: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrls: string[]) => void;
  multiple?: boolean;
  currentValue?: string | string[];
  title?: string;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  currentValue,
  title = "Libreria Multimediale"
}: MediaLibraryModalProps) {
  const { adminSecret } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mount detection for safe portal rendering in Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize selected URLs from current value
  useEffect(() => {
    if (!isOpen) return;
    if (Array.isArray(currentValue)) {
      setSelectedUrls(currentValue.filter(Boolean));
    } else if (typeof currentValue === "string" && currentValue.trim()) {
      setSelectedUrls([currentValue.trim()]);
    } else {
      setSelectedUrls([]);
    }
    setSearchQuery("");
  }, [isOpen, currentValue]);

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
        console.error("Failed to load media images");
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, adminSecret]);

  // Handle uploading new photos directly inside the modal
  const handleDirectUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !adminSecret) return;
    setIsUploading(true);

    try {
      const stagedBlobs: Array<{ path: string; sha: string; url: string; originalName: string }> = [];

      // 1. Stage each file (pre-compressed client-side)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
          throw new Error(err.error || `Errore caricamento ${file.name}`);
        }

        const stageData = await stageRes.json();
        stagedBlobs.push({
          path: stageData.path,
          sha: stageData.sha,
          url: stageData.url,
          originalName: file.name
        });
      }

      // 2. Commit all staged files together
      const commitRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({
          action: "commit_multiple",
          files: stagedBlobs
        })
      });

      if (!commitRes.ok) {
        const err = await commitRes.json().catch(() => ({}));
        throw new Error(err.error || "Errore nel salvataggio su GitHub");
      }

      const commitData = await commitRes.json();

      // Refresh list
      await fetchImages();

      // Auto-select uploaded images
      const newUrls = (commitData.committed || []).map((c: any) => c.url);
      if (newUrls.length > 0) {
        if (multiple) {
          setSelectedUrls((prev) => [...prev, ...newUrls]);
        } else {
          setSelectedUrls([newUrls[0]]);
        }
      }
    } catch (err: any) {
      console.error("Direct upload error:", err);
      alert(err.message || "Errore durante il caricamento");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Toggle selection
  const handleToggleSelect = (url: string) => {
    if (multiple) {
      setSelectedUrls((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      );
    } else {
      setSelectedUrls((prev) => (prev.includes(url) ? [] : [url]));
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onSelect(selectedUrls);
    onClose();
  };

  // Filtered list
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.toLowerCase();
    return images.filter(
      (img) =>
        img.name.toLowerCase().includes(q) ||
        img.url.toLowerCase().includes(q) ||
        (img.folder && img.folder.toLowerCase().includes(q))
    );
  }, [images, searchQuery]);

  // Format date helper
  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return "";
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[92vh] max-h-[880px] bg-[#111827] border border-foreground/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <FolderOpen size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                  {title}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/70 text-[11px] font-bold">
                  {images.length} foto
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-foreground/50">
                {multiple
                  ? "Seleziona una o più foto da riutilizzare nel sito senza duplicare file"
                  : "Seleziona una foto esistente o caricane una nuova ottimizzata in WebP"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Direct Upload button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple={multiple}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleDirectUpload(e.target.files);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 sm:py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Caricamento...
                </>
              ) : (
                <>
                  <Upload size={13} /> {multiple ? "Carica Foto" : "Carica Nuova"}
                </>
              )}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchImages}
              title="Aggiorna lista"
              disabled={isLoading}
              className="p-1.5 sm:p-2 bg-muted/40 hover:bg-muted/70 text-foreground/60 hover:text-foreground rounded-xl transition-all"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-muted/40 hover:bg-rose-500/20 text-foreground/60 hover:text-rose-400 rounded-xl transition-all"
              title="Chiudi"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-foreground/10 bg-background/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome file (es. teatro, attori)..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-muted/30 border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs text-foreground placeholder:text-foreground/30 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="text-[11px] sm:text-xs text-foreground/40 font-medium self-start sm:self-auto flex items-center gap-2">
            <span>
              Visualizzati: <strong className="text-foreground/80">{filteredImages.length}</strong> su {images.length}
            </span>
            {selectedUrls.length > 0 && (
              <span className="text-primary font-bold">
                • {selectedUrls.length} {selectedUrls.length === 1 ? "selezionata" : "selezionate"}
              </span>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar min-h-0">
          {isLoading && images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-foreground/40">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider">Caricamento galleria immagini...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center text-foreground/40">
              <ImageIcon className="w-12 h-12 mb-3 stroke-[1.2] opacity-30 text-primary" />
              <p className="text-sm font-bold text-foreground/70">Nessuna foto trovata</p>
              <p className="text-xs text-foreground/40 mt-1 max-w-sm">
                {searchQuery
                  ? `Nessun risultato corrispondente a "${searchQuery}". Prova con un altro termine.`
                  : "Non ci sono ancora foto caricate nel sito."}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Upload size={14} /> Carica una nuova foto ora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {filteredImages.map((img) => {
                const isSelected = selectedUrls.includes(img.url);
                const dateStr = formatDate(img.timestamp);

                return (
                  <div
                    key={img.url}
                    onClick={() => handleToggleSelect(img.url)}
                    onDoubleClick={() => {
                      if (!multiple) {
                        onSelect([img.url]);
                        onClose();
                      }
                    }}
                    className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border transition-all duration-200 flex flex-col bg-muted/20 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/15 scale-[1.01]"
                        : "border-foreground/10 hover:border-foreground/25 hover:bg-muted/40 hover:scale-[1.01]"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] sm:aspect-square relative w-full overflow-hidden bg-black/40">
                      <Image
                        src={img.url}
                        alt={img.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Selection Badge */}
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary text-white shadow-md scale-100 ring-2 ring-background"
                            : "bg-black/50 text-white/40 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>

                      {/* Folder tag if nested */}
                      {img.folder && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold text-foreground/80">
                          {img.folder}
                        </div>
                      )}

                      {/* Delete button on hover */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Eliminare definitivamente "${img.name}" dal server?`)) return;
                          try {
                            const res = await fetch("/api/images", {
                              method: "DELETE",
                              headers: {
                                "Content-Type": "application/json",
                                "x-admin-secret": adminSecret || ""
                              },
                              body: JSON.stringify({ urls: [img.url] })
                            });
                            if (res.ok) {
                              setImages((prev) => prev.filter((i) => i.url !== img.url));
                              setSelectedUrls((prev) => prev.filter((u) => u !== img.url));
                            } else {
                              const err = await res.json().catch(() => ({}));
                              alert(`Errore di eliminazione: ${err.error || "Errore sconosciuto"}`);
                            }
                          } catch (err) {
                            alert(`Errore di eliminazione: ${(err as Error).message}`);
                          }
                        }}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                        title="Elimina immagine"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2 sm:p-2.5 flex flex-col gap-0.5 border-t border-foreground/5 bg-muted/10">
                      <span
                        className="text-[11px] font-bold text-foreground/90 truncate leading-snug"
                        title={img.name}
                      >
                        {img.name}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-foreground/40 font-mono">
                        <span className="truncate max-w-[100px]">{dateStr || "Foto sito"}</span>
                        {img.size && (
                          <span>{(img.size / 1024).toFixed(0)} KB</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 border-t border-foreground/10 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-foreground/60 flex items-center gap-2 self-start sm:self-auto min-w-0">
            {selectedUrls.length > 0 ? (
              <>
                <span className="font-bold text-foreground shrink-0">
                  {selectedUrls.length} {selectedUrls.length === 1 ? "foto selezionata" : "foto selezionate"}
                </span>
                <span className="text-foreground/30">•</span>
                <span className="text-[11px] font-mono text-primary truncate max-w-[240px] sm:max-w-[360px] md:max-w-[480px]">
                  {selectedUrls[selectedUrls.length - 1]}
                </span>
              </>
            ) : (
              <span className="text-foreground/40 italic">
                {multiple ? "Seleziona le foto da inserire" : "Clicca su una foto per selezionarla"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-foreground/70 hover:bg-muted/50 transition-all"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-2"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>
                {multiple
                  ? `Inserisci (${selectedUrls.length})`
                  : "Usa Questa Foto"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
