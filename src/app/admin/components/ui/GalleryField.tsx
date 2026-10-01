"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Eye, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "../../context/AdminContext";
import { Lightbox } from "@/components/ui/Lightbox";

export interface GalleryImage {
  url: string;
  alt: string;
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

  const updateImage = (idx: number, field: keyof GalleryImage, value: string) => {
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
    const newItems: GalleryImage[] = [];

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

        if (res.ok) {
          const data = await res.json();
          // Derive a friendly alt text from filename
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          newItems.push({
            url: data.url,
            alt: cleanName
          });
        }
      }

      if (newItems.length > 0) {
        onChange([...images, ...newItems]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Errore durante il caricamento delle immagini.");
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
          <p className="text-xs text-foreground/40">Nessuna immagine presente nella galleria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((img, idx) => (
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
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt={img.alt || "Anteprima"}
                      fill
                      className="object-cover group-hover/thumb:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye size={16} className="text-white" />
                  </div>
                </div>

                {/* Form fields */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block">
                      URL Immagine
                    </span>
                    <input
                      type="text"
                      value={img.url}
                      onChange={(e) => updateImage(idx, "url", e.target.value)}
                      placeholder="/images/..."
                      className="w-full px-2.5 py-1.5 bg-background/50 border border-foreground/10 rounded-lg text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                    />
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
    </div>
  );
}
