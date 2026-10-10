"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, MessageCircle, Send, Mail, Share2 } from "lucide-react";
import { trackShare } from "@/lib/tracking";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}>
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  url?: string;
  description?: string;
  uiContent?: {
    modal_title?: string;
    modal_description?: string;
    copy_link_label?: string;
    link_copied_label?: string;
    close_aria_label?: string;
    channels?: {
      whatsapp?: string;
      telegram?: string;
      facebook?: string;
      twitter?: string;
      email?: string;
    };
  };
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  description,
  uiContent
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const effectiveTitle = title || (typeof document !== "undefined" ? document.title : "Gli Attomatti");
  const effectiveUrl = url || (typeof window !== "undefined" ? window.location.href : "https://attomatti.ch");
  const effectiveDescription = description || "Gli Attomatti — Compagnia di improvvisazione e teatro a Zurigo.";

  const modalTitle = uiContent?.modal_title || "Condividi";
  const modalDescription = uiContent?.modal_description || "Spargi la voce tra amici e colleghi appassionati di teatro.";
  const copyLinkLabel = uiContent?.copy_link_label || "Copia link";
  const linkCopiedLabel = uiContent?.link_copied_label || "Copiato!";
  const closeAriaLabel = uiContent?.close_aria_label || "Chiudi finestra di condivisione";

  const channels = uiContent?.channels || {};
  const whatsappLabel = channels.whatsapp || "WhatsApp";
  const telegramLabel = channels.telegram || "Telegram";
  const facebookLabel = channels.facebook || "Facebook";
  const twitterLabel = channels.twitter || "X (Twitter)";
  const emailLabel = channels.email || "Email";

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(effectiveUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = effectiveUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      trackShare("copy_link", effectiveUrl, effectiveTitle);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      // Fallback
    }
  };

  const shareLinks = [
    {
      name: whatsappLabel,
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${effectiveTitle}\n${effectiveUrl}`)}`,
      channel: "whatsapp",
      colorClass: "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"
    },
    {
      name: telegramLabel,
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(effectiveUrl)}&text=${encodeURIComponent(effectiveTitle)}`,
      channel: "telegram",
      colorClass: "hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30"
    },
    {
      name: facebookLabel,
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(effectiveUrl)}`,
      channel: "facebook",
      colorClass: "hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-600/30"
    },
    {
      name: twitterLabel,
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(effectiveTitle)}&url=${encodeURIComponent(effectiveUrl)}`,
      channel: "twitter",
      colorClass: "hover:bg-foreground/10 hover:text-foreground hover:border-foreground/30"
    },
    {
      name: emailLabel,
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(effectiveTitle)}&body=${encodeURIComponent(`${effectiveDescription}\n\nScopri di più: ${effectiveUrl}`)}`,
      channel: "email",
      colorClass: "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
    }
  ];

  const handleChannelClick = (channel: string) => {
    trackShare(channel, effectiveUrl, effectiveTitle);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="relative w-full max-w-lg bg-background border border-foreground/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-xs">
                  <Share2 size={16} />
                  <span>Condivisione</span>
                </div>
                <h3 id="share-modal-title" className="text-2xl font-black uppercase tracking-tight text-foreground">
                  {modalTitle}
                </h3>
                {modalDescription && (
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {modalDescription}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={closeAriaLabel}
                className="p-2 -mr-2 -mt-2 rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Preview Box */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-foreground/5 mb-6 space-y-1">
              <div className="text-xs uppercase font-bold tracking-wider text-primary truncate">
                {effectiveTitle}
              </div>
              <div className="text-xs text-foreground/50 truncate font-mono">
                {effectiveUrl}
              </div>
            </div>

            {/* Quick Copy Link Box */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                {copyLinkLabel}
              </label>
              <div className="flex items-center gap-2 p-1.5 pl-3.5 bg-muted/30 border border-foreground/10 rounded-2xl focus-within:border-primary transition-colors">
                <span className="text-sm text-foreground/80 font-mono truncate flex-1 select-all">
                  {effectiveUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    copied
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/20"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>{linkCopiedLabel}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>{copyLinkLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Channels Grid */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3">
                Oppure condividi su
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {shareLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.channel}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleChannelClick(item.channel)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border border-foreground/10 bg-muted/10 text-foreground/80 text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 ${item.colorClass}`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
