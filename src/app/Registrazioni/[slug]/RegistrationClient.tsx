"use client";

import React from "react";
import Link from "next/link";
import Script from "next/script";
import { 
  ArrowLeft, 
  ClipboardList, 
  ExternalLink, 
  ShieldCheck, 
  Info
} from "lucide-react";

import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { FormattedText } from "@/components/ui/FormattedText";

export interface RegistrationPageData {
  id?: string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  tally_url: string;
  back_link_label?: string;
  back_link_href?: string;
  active?: boolean;
}

interface RegistrationClientProps {
  page: RegistrationPageData;
  site?: any;
  integrations?: any;
}

export default function RegistrationClient({ page: initialPage }: RegistrationClientProps) {
  const liveContent = useLiveContent(null);
  const regUi = liveContent?.registration_hub?.registration_page || {};

  const page = React.useMemo(() => {
    if (liveContent?.registration_pages) {
      const match = liveContent.registration_pages.find(
        (p: any) => p.slug === initialPage?.slug || p.id === initialPage?.id
      );
      if (match) return match;
    }
    return initialPage;
  }, [liveContent, initialPage]);

  const rawUrl = page.tally_url?.trim() || "";

  // Normalize Tally URL into an optimized embed format with solid white background
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      const match = url.match(/tally\.so\/(?:r|embed)\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://tally.so/embed/${match[1]}?alignLeft=1&transparentBackground=0`;
      }
      const u = new URL(url);
      u.protocol = "https:";
      return u.toString();
    } catch {
      return url;
    }
  };

  const embedUrl = getEmbedUrl(rawUrl);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      {/* Load Tally official widget script */}
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Link
            href={page.back_link_href || "/"}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {page.back_link_label || regUi.default_back_link || "Torna al sito"}
          </Link>

          <Link
            href="/Privacy"
            className="text-xs text-foreground/40 hover:text-foreground font-medium underline transition-colors"
          >
            {regUi.privacy_link || "Informativa Privacy"}
          </Link>
        </div>

        {/* Compact Page Header */}
        <div className="p-6 rounded-3xl bg-muted/20 border border-foreground/5 space-y-2 glass">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-black uppercase tracking-wider">
            <ClipboardList size={13} />
            {page.category || regUi.default_category || "Modulo di Iscrizione"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            {page.title}
          </h1>

          {page.description && (
            <p className="text-sm text-foreground/75 leading-relaxed max-w-2xl font-medium">
              <FormattedText text={page.description} />
            </p>
          )}
        </div>

        {/* Embedded Tally Card with Solid White Background */}
        {embedUrl ? (
          <div className="space-y-4">
            <div className="w-full rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200 relative p-4 sm:p-6 md:p-8">
              <iframe
                data-tally-src={embedUrl}
                src={embedUrl}
                title={page.title || regUi.default_category || "Modulo di Registrazione"}
                className="w-full h-[780px] sm:h-[840px] border-0 block bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            {/* Direct Fallback Notice */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/60">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-accent shrink-0" />
                <span>{regUi.iframe_trouble_notice || "Difficoltà di compilazione? Puoi aprire il modulo in una nuova finestra:"}</span>
              </div>
              <a
                href={rawUrl || embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
              >
                <span>{regUi.open_on_tally || "Apri su Tally"}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-muted/20 border border-foreground/5 text-center space-y-6 glass">
            <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <ClipboardList size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {regUi.not_configured_title || "Modulo non ancora configurato"}
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed font-medium">
                {regUi.not_configured_description || "Il modulo di registrazione per questa pagina non è al momento collegato a un form Tally attivo."}
              </p>
            </div>
            <Link
              href={page.back_link_href || "/"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
            >
              {page.back_link_label || regUi.default_back_link || "Torna al sito"}
            </Link>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-foreground/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/40 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>{regUi.secure_form_notice || "Modulo sicuro e conforme nLPD / GDPR (Tally BV, server UE)"}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/Termini" className="hover:text-foreground transition-colors underline">
              {regUi.terms_link || "Termini & Regolamento"}
            </Link>
            <Link href="/Privacy" className="hover:text-foreground transition-colors underline">
              {regUi.privacy_link || "Informativa Privacy"}
            </Link>
            <Link href="/Contatti" className="hover:text-foreground transition-colors underline">
              {regUi.contact_link || "Hai domande? Contattaci"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
