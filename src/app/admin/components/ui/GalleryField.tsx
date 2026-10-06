"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Eye, Image as ImageIcon, Loader2, FolderOpen, Crop, Maximize, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "../../context/AdminContext";
import { Lightbox } from "@/components/ui/Lightbox";
import { MediaLibraryModal } from "./MediaLibraryModal";
import { compressImageClient } from "@/lib/clientImageCompress";
import { isYouTubeUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

export interface GalleryImage {
  url: string;
  alt: string;
  no_crop?: boolean;
}

interface GalleryFieldProps {
  label: string;
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  description?: string;
}

export function GalleryField({
  label,
  images = [],
  onChange,
  description
}: GalleryFieldProps) {
  const { adminSecret } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [targetReplaceIdx, setTargetReplaceIdx] = useState<number | null>(null);

  const addImage = (url: string = "/images/show1.png", alt: string = "") => {
    onChange([...images, { url, alt }]);
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const next = [...images];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    onChange(next);
  };

  const updateImage = (idx: number, field: keyof GalleryImage, value: string | boolean) => {
    const next = [...images];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!adminSecret) {
      alert("Per favore, inserisci prima la Password di Amministrazione in alto.");
      return;
    }

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
          throw new Error(err.error || `Errore caricamento di "${file.name}"`);
        }

        const stageData = await stageRes.json();
        stagedBlobs.push({
          path: stageData.filePath,
          sha: stageData.blobSha,
          url: stageData.url,
          originalName: file.name
        });
      }

      // 2. Commit all staged files in 1 single commit
      const commitRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({
          action: "commit",
          items: stagedBlobs,
          message: `Upload batch of ${stagedBlobs.length} images via Gallery Field`
        })
      });

      if (!commitRes.ok) {
        const err = await commitRes.json().catch(() => ({}));
        throw new Error(err.error || "Errore durante il salvataggio su GitHub");
      }

      const newItems: GalleryImage[] = stagedBlobs.map((b) => {
        const cleanName = b.originalName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        return {
          url: b.url,
          alt: cleanName
        };
      });

      if (newItems.length > 0) {
        onChange([...images, ...newItems]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Errore durante il caricamento delle immagini: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-foreground/70">
            {label} ({images.length})
          </label>
          {description && (
            <p className="text-[11px] text-foreground/40 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => {
              setTargetReplaceIdx(null);
              setIsLibraryOpen(true);
            }}
            className="px-3 py-1.5 bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FolderOpen size={13} /> Scegli da Libreria
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Caricamento...
              </>
            ) : (
              <>
                <Upload size={13} /> Carica Nuove Foto
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => addImage("https://www.youtube.com/watch?v=", "Video YouTube")}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Aggiungi video da YouTube alla galleria"
          >
            <Video size={13} /> + Video YouTube
          </button>
          <button
            type="button"
            onClick={() => addImage()}
            className="px-3 py-1.5 bg-muted/30 hover:bg-muted/50 text-foreground/70 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus size={13} /> Aggiungi URL
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="p-8 border border-dashed border-foreground/10 rounded-2xl text-center">
          <ImageIcon className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-foreground/40">Nessuna immagine o video presente nella galleria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((img, idx) => {
            const isVideo = isYouTubeUrl(img.url);
            const thumbSrc = isVideo ? getYouTubeThumbnailUrl(img.url) : img.url;

            return (
              <div
                key={idx}
                className="p-3.5 bg-muted/20 border border-foreground/5 rounded-2xl flex flex-col gap-3 group hover:border-foreground/15 transition-all"
              >
                <div className="flex gap-3 items-start">
                  {/* Thumbnail */}
                  <div
                    onClick={() => setLightboxIndex(idx)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/40 shrink-0 cursor-pointer border border-foreground/10 group/thumb"
                  >
                    {thumbSrc ? (
                      <Image
                        src={thumbSrc}
                        alt={img.alt || "Anteprima"}
                        fill
                        className="object-cover group-hover/thumb:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/20">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                        <Play size={8} className="fill-white" /> Video
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      {isVideo ? <Play size={16} className="fill-white" /> : <Eye size={16} className="text-white" />}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block">
                        {isVideo ? "Link Video YouTube" : "URL Immagine o Video"}
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={img.url}
                          onChange={(e) => updateImage(idx, "url", e.target.value)}
                          placeholder="/images/... o link YouTube"
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-background/50 border border-foreground/10 rounded-lg text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                        />
                        {!isVideo && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetReplaceIdx(idx);
                              setIsLibraryOpen(true);
                            }}
                            title="Scegli dalla galleria del sito"
                            className="px-2 py-1 bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                          >
                            <FolderOpen size={12} />
                            <span className="hidden sm:inline">Libreria</span>
                          </button>
                        )}
                      </div>
                    </div>
                  <div>
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block">
                      Testo Alt (Accessibilità & SEO)
                    </span>
                    <input
                      type="text"
                      value={img.alt}
                      onChange={(e) => updateImage(idx, "alt", e.target.value)}
                      placeholder="Descrivi l'immagine..."
                      className="w-full px-2.5 py-1.5 bg-background/50 border border-foreground/10 rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2 border-t border-foreground/5">
                <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
                  #{idx + 1}
                </span>

                <div className="flex items-center gap-1">
                  {/* no_crop toggle */}
                  <button
                    type="button"
                    onClick={() => updateImage(idx, "no_crop", !img.no_crop)}
                    title={img.no_crop ? "Ritaglia (attualmente: mostra intero)" : "Mostra intero (attualmente: ritaglia)"}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all",
                      img.no_crop
                        ? "bg-secondary/20 border-secondary/40 text-secondary"
                        : "bg-muted/30 border-foreground/10 text-foreground/40 hover:text-foreground/70"
                    )}
                  >
                    {img.no_crop ? <Maximize size={11} /> : <Crop size={11} />}
                    <span className="hidden sm:inline">{img.no_crop ? "Intero" : "Ritaglia"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                    title="Sposta su"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === images.length - 1}
                    className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                    title="Sposta giù"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1 text-rose-400 hover:text-rose-300 ml-1 transition-colors"
                    title="Elimina immagine"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox for Preview */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images.map((im) => ({ url: im.url, alt: im.alt || "" }))}
          initialIndex={lightboxIndex}
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Media Library Modal for choosing existing images */}
      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => {
          setIsLibraryOpen(false);
          setTargetReplaceIdx(null);
        }}
        onSelect={(urls) => {
          if (targetReplaceIdx !== null) {
            if (urls.length > 0) {
              updateImage(targetReplaceIdx, "url", urls[0]);
            }
          } else {
            const newItems = urls.map((url) => {
              const filename = url.split("/").pop() || "";
              const cleanAlt = filename
                .replace(/^(\d{10,14})-/, "")
                .replace(/\.[^.]+$/, "")
                .replace(/[-_]/g, " ");
              return { url, alt: cleanAlt };
            });
            onChange([...images, ...newItems]);
          }
        }}
        multiple={targetReplaceIdx === null}
        currentValue={targetReplaceIdx !== null ? images[targetReplaceIdx]?.url : images.map((i) => i.url)}
        title={targetReplaceIdx !== null ? "Sostituisci Immagine da Libreria" : "Seleziona Immagini dalla Libreria"}
      />
    </div>
  );
}
