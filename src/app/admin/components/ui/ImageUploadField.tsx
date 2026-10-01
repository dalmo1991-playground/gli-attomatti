"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Eye, Image as ImageIcon, Loader2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "../../context/AdminContext";
import { Lightbox } from "@/components/ui/Lightbox";
import { MediaLibraryModal } from "./MediaLibraryModal";

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "video" | "square" | "portrait";
  layout?: "horizontal" | "vertical" | "auto";
  helpText?: string;
  className?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  aspect = "video",
  layout = "auto",
  helpText,
  className
}: ImageUploadFieldProps) {
  const { adminSecret } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    if (!adminSecret) {
      alert("Per favore, inserisci prima la Password di Amministrazione in alto.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-secret": adminSecret
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        const err = await res.json();
        alert(`Errore di caricamento: ${err.error || "Errore sconosciuto"}`);
      }
    } catch (err) {
      alert(`Errore di rete: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  const isVertical = layout === "vertical" || (layout === "auto" && aspect === "portrait");

  const aspectClass =
    aspect === "square"
      ? "aspect-square w-full max-w-[160px]"
      : aspect === "portrait"
      ? "aspect-[3/4] w-full max-w-[180px]"
      : "aspect-video w-full max-w-[280px]";

  return (
    <div className={cn("space-y-2 w-full min-w-0", className)}>
      {label && (
        <label className="text-xs font-black uppercase tracking-wider text-foreground/50 block">
          {label}
        </label>
      )}

      <div
        className={cn(
          "w-full min-w-0",
          isVertical
            ? "flex flex-col gap-3 items-start"
            : "flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        )}
      >
        {/* Thumbnail Preview Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-2xl overflow-hidden bg-muted/40 border border-foreground/10 shrink-0 flex items-center justify-center transition-all group",
            aspectClass,
            isDragging && "border-primary ring-2 ring-primary/20 scale-105"
          )}
        >
          {value ? (
            <>
              <Image
                src={value}
                alt="Preview"
                fill
                sizes="250px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Ingrandisci"
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  title="Scegli dalla galleria del sito"
                  className="p-2 bg-secondary hover:bg-secondary/90 rounded-full text-white transition-colors"
                >
                  <FolderOpen size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Carica nuovo file da PC"
                  className="p-2 bg-primary hover:bg-primary/90 rounded-full text-white transition-colors"
                >
                  <Upload size={16} />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="w-full h-full min-h-[120px] flex flex-col items-center justify-center text-foreground/40 hover:text-primary transition-all p-4 text-center cursor-pointer group/btn"
            >
              <div className="w-10 h-10 rounded-2xl bg-foreground/5 group-hover/btn:bg-primary/15 flex items-center justify-center mb-1.5 transition-colors">
                <FolderOpen size={20} className="text-foreground/50 group-hover/btn:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground/80 group-hover/btn:text-primary transition-colors">
                Scegli Foto
              </span>
              <span className="text-[9px] text-foreground/40 mt-0.5">
                Galleria sito o PC
              </span>
            </button>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-[10px] font-black uppercase tracking-wider text-primary mt-1">
                Ottimizzazione...
              </span>
            </div>
          )}
        </div>

        {/* Path Input & Action Buttons */}
        <div className="flex-1 w-full min-w-0 space-y-2">
          <div className="flex gap-2 items-center w-full min-w-0">
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="/images/... o incolla URL"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-background border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-xs text-foreground placeholder:text-foreground/20"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              title="Sfoglia tutte le foto caricate nel sito"
              className="px-3 py-2 bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <FolderOpen size={13} />
              <span>Galleria</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Carica file WebP da PC"
              className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Upload</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                title="Rimuovi"
                className="p-2 bg-muted hover:bg-rose-500/20 text-foreground/40 hover:text-rose-400 rounded-xl transition-all shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-foreground/40 font-medium leading-snug">
            {helpText || "Scegli una foto dalla Galleria per riutilizzarla, oppure trascina/carica un nuovo file."}
          </p>
        </div>
      </div>

      {value && (
        <Lightbox
          images={[{ url: value, alt: label || "Foto" }]}
          initialIndex={0}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={(urls) => {
          if (urls.length > 0) onChange(urls[0]);
        }}
        currentValue={value}
        title={label ? `Libreria Foto: ${label}` : "Libreria Multimediale"}
      />
    </div>
  );
}
