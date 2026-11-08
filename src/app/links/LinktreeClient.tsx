"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Check,
  ExternalLink,
  Sparkles,
  Ticket,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  HelpCircle,
  Award,
  Video,
  Music,
  Heart,
  Compass,
  Theater,
  Users,
  Info,
  ChevronRight,
  Copy,
  X
} from "lucide-react";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { trackSocialClick, trackViewContent } from "@/lib/tracking";

// Icon mapping helper
const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Ticket,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  HelpCircle,
  Award,
  Video,
  Music,
  Heart,
  Compass,
  Theater,
  Users,
  Info,
};

function renderIcon(iconName?: string, className = "w-5 h-5") {
  if (!iconName) return null;
  const Component = ICON_MAP[iconName];
  if (!Component) return <ExternalLink className={className} />;
  return <Component className={className} />;
}

function renderSocialIcon(platform: string, className = "w-5 h-5") {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (p.includes("facebook")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }
  if (p.includes("mail") || p.includes("email")) {
    return <Mail className={className} />;
  }
  if (p.includes("whatsapp")) {
    return <MessageCircle className={className} />;
  }
  if (p.includes("phone") || p.includes("tel")) {
    return <Phone className={className} />;
  }
  return <Globe className={className} />;
}

interface LinktreeClientProps {
  initialData: any;
  fullContent: any;
}

export default function LinktreeClient({ initialData, fullContent }: LinktreeClientProps) {
  const liveContent = useLiveContent(fullContent);
  const data = liveContent?.linktree || initialData || {};

  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Profile data
  const profile = data.profile || {};
  const theme = data.theme || {
    preset: "dark",
    button_style: "rounded",
    button_variant: "filled",
    font_style: "sans",
    animation_speed: "normal",
    glow_featured: true,
  };
  const socialLinks: any[] = Array.isArray(data.social_links)
    ? data.social_links.filter((s: any) => s && s.visible !== false && s.url)
    : [];
  const sections: any[] = Array.isArray(data.sections) ? data.sections : [];
  const links: any[] = Array.isArray(data.links)
    ? data.links.filter((l: any) => l && l.visible !== false && (l.url || l.href))
    : [];

  const handleShare = async () => {
    const shareData = {
      title: profile.title || "Gli Attomatti",
      text: profile.bio || "Compagnia teatrale Gli Attomatti Zurigo — Tutti i link ufficiali",
      url: typeof window !== "undefined" ? window.location.href : "https://gliattomatti.ch/links",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setShowShareModal(true);
      }
    } catch {
      setShowShareModal(true);
    }
  };

  const handleLinkClick = (linkItem: any) => {
    trackViewContent(linkItem.title || "Linktree Item", "Linktree", {
      url: linkItem.url || linkItem.href,
      featured: Boolean(linkItem.featured),
    });
  };

  // Group links by section
  const unsectionedLinks = links.filter((l) => !l.section_id);
  const sectionedGroups = sections
    .filter((s) => s && s.visible !== false)
    .map((section) => ({
      ...section,
      links: links.filter((l) => l.section_id === section.id),
    }))
    .filter((group) => group.links.length > 0);

  // Theme styling helpers
  const getThemeBg = () => {
    switch (theme.preset) {
      case "midnight":
        return "bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 text-slate-100";
      case "theatre":
        return "bg-gradient-to-b from-[#18040a] via-[#100307] to-slate-950 text-rose-50";
      case "light":
        return "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900";
      case "minimal":
        return "bg-black text-white";
      case "dark":
      default:
        return "bg-gradient-to-b from-slate-900 via-[#131b2e] to-slate-950 text-foreground";
    }
  };

  const getButtonStyle = (isFeatured: boolean) => {
    const isLight = theme.preset === "light";
    const shape =
      theme.button_style === "pill"
        ? "rounded-full"
        : theme.button_style === "sharp"
        ? "rounded-none"
        : "rounded-2xl";

    if (isFeatured) {
      const glow = theme.glow_featured !== false ? "shadow-lg shadow-primary/25 border-primary ring-1 ring-primary/40" : "border-primary";
      return `${shape} bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold border ${glow} hover:brightness-105 active:scale-[0.98] transition-all duration-200`;
    }

    switch (theme.button_variant) {
      case "outline":
        return `${shape} bg-transparent border ${
          isLight ? "border-slate-300 text-slate-900 hover:bg-slate-200/60" : "border-foreground/15 text-foreground hover:bg-foreground/5 hover:border-foreground/30"
        } backdrop-blur-sm active:scale-[0.98] transition-all duration-200`;
      case "glass":
        return `${shape} bg-foreground/10 border border-foreground/15 text-foreground hover:bg-foreground/15 backdrop-blur-md active:scale-[0.98] transition-all duration-200`;
      case "filled":
      default:
        return `${shape} ${
          isLight
            ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 hover:bg-slate-50"
            : "bg-muted/70 hover:bg-muted text-foreground border border-foreground/10 hover:border-foreground/20"
        } backdrop-blur-sm active:scale-[0.98] transition-all duration-200`;
    }
  };

  const isLightPreset = theme.preset === "light";

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-between px-4 py-8 sm:py-12 transition-colors duration-300 ${getThemeBg()}`}>
      {/* Top action bar: Share button */}
      <header className="w-full max-w-md flex items-center justify-between mb-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            isLightPreset
              ? "bg-slate-200/70 hover:bg-slate-300 text-slate-700"
              : "bg-foreground/10 hover:bg-foreground/15 text-foreground/80 hover:text-foreground"
          }`}
        >
          <span>←</span>
          <span>Sito Web</span>
        </Link>

        <button
          onClick={handleShare}
          type="button"
          aria-label="Condividi profilo"
          className={`relative p-2.5 rounded-full transition-all active:scale-95 flex items-center justify-center ${
            isLightPreset
              ? "bg-slate-200/80 hover:bg-slate-300 text-slate-800"
              : "bg-foreground/10 hover:bg-foreground/20 text-foreground"
          }`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          {copied && (
            <span className="absolute -bottom-8 right-0 bg-slate-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
              Link copiato!
            </span>
          )}
        </button>
      </header>

      {/* Main card / Container */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center">
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative mb-3.5"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-primary via-secondary to-accent shadow-xl">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-muted">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.title || "Avatar"}
                    fill
                    sizes="112px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-2xl">
                    🎭
                  </div>
                )}
              </div>
            </div>
            {profile.show_verified && (
              <div
                className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-md border-2 border-background"
                title="Account Verificato"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </motion.div>

          {profile.badge && (
            <span className="inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 mb-1.5">
              {profile.badge}
            </span>
          )}

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {profile.title || "Gli Attomatti"}
          </h1>

          {profile.bio && (
            <p className="mt-1.5 text-xs sm:text-sm text-foreground/75 whitespace-pre-line max-w-xs leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Social icons row */}
          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSocialClick(social.platform || "Social", social.url)}
                  className={`p-2.5 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                    isLightPreset
                      ? "bg-slate-200/80 hover:bg-slate-300 text-slate-800"
                      : "bg-foreground/10 hover:bg-foreground/20 text-foreground"
                  }`}
                  aria-label={social.platform || "Social link"}
                >
                  {renderSocialIcon(social.platform, "w-4 h-4 sm:w-5 sm:h-5")}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Links List */}
        <div className="w-full space-y-4">
          {/* Sectioned groups */}
          {sectionedGroups.map((group) => (
            <div key={group.id} className="space-y-2.5">
              {group.title && (
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/50 px-2 pt-2">
                  {group.title}
                </h2>
              )}
              <div className="space-y-2.5">
                {group.links.map((linkItem: any) => (
                  <LinkButton
                    key={linkItem.id}
                    item={linkItem}
                    buttonClasses={getButtonStyle(Boolean(linkItem.featured))}
                    onClick={() => handleLinkClick(linkItem)}
                    isLight={isLightPreset}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Unsectioned links (if any) */}
          {unsectionedLinks.length > 0 && (
            <div className="space-y-2.5">
              {sectionedGroups.length > 0 && (
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/50 px-2 pt-2">
                  Altri Link
                </h2>
              )}
              {unsectionedLinks.map((linkItem: any) => (
                <LinkButton
                  key={linkItem.id}
                  item={linkItem}
                  buttonClasses={getButtonStyle(Boolean(linkItem.featured))}
                  onClick={() => handleLinkClick(linkItem)}
                  isLight={isLightPreset}
                />
              ))}
            </div>
          )}

          {links.length === 0 && (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-foreground/20 text-foreground/60 text-sm">
              Nessun link disponibile al momento.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mt-10 pt-4 pb-2 border-t border-foreground/10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors font-medium"
        >
          <span>🎭</span>
          <span>{data.footer_text || "Gli Attomatti • Compagnia Teatrale Zurigo"}</span>
        </Link>
      </footer>

      {/* Fallback Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">Condividi Profilo</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Copia il link qui sotto per condividerlo su Instagram, WhatsApp o dovunque preferisci:
              </p>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : "https://gliattomatti.ch/links"}
                  className="bg-transparent text-xs text-slate-300 w-full focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:brightness-110 active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LinkButton({
  item,
  buttonClasses,
  onClick,
  isLight,
}: {
  item: any;
  buttonClasses: string;
  onClick: () => void;
  isLight?: boolean;
}) {
  const href = item.url || item.href || "#";
  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const hasThumbnail = Boolean(item.thumbnail);

  const content = (
    <div className="flex items-center gap-3.5 w-full">
      {/* Icon or Thumbnail */}
      {hasThumbnail ? (
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/10">
          <Image
            src={item.thumbnail}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      ) : item.icon ? (
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            item.featured
              ? "bg-primary-foreground/15 text-primary-foreground"
              : isLight
              ? "bg-slate-100 text-slate-800"
              : "bg-foreground/10 text-foreground"
          }`}
        >
          {renderIcon(item.icon, "w-5 h-5")}
        </div>
      ) : null}

      {/* Titles */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm sm:text-[15px] truncate block leading-snug">
            {item.title}
          </span>
          {item.featured && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary-foreground/20 text-primary-foreground">
              Hot
            </span>
          )}
        </div>
        {item.subtitle && (
          <p
            className={`text-xs truncate leading-relaxed ${
              item.featured
                ? "text-primary-foreground/80"
                : isLight
                ? "text-slate-500"
                : "text-foreground/60"
            }`}
          >
            {item.subtitle}
          </p>
        )}
      </div>

      {/* Arrow / External icon */}
      <div className="shrink-0 opacity-70">
        {isExternal ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </div>
    </div>
  );

  const commonProps = {
    className: `w-full p-3.5 flex items-center group relative overflow-hidden ${buttonClasses}`,
    onClick,
  };

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...commonProps}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} {...commonProps}>
      {content}
    </Link>
  );
}
