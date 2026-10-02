"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, ExternalLink, ShieldCheck, Info } from "lucide-react";
import { trackInitiateCheckout } from "@/lib/tracking";

interface TicketingPageData {
  id?: string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  eventfrog_url: string;
  back_link_label?: string;
  back_link_href?: string;
  active?: boolean;
}

interface CheckoutClientProps {
  page: TicketingPageData;
  site?: any;
  integrations?: any;
}

export default function CheckoutClient({ page }: CheckoutClientProps) {
  const ticketUrl = page.eventfrog_url?.trim() || "";

  // Normalize Eventfrog Embed URL
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    try {
      const u = new URL(rawUrl);
      u.protocol = "https:";
      return u.toString();
    } catch {
      return rawUrl;
    }
  };

  const embedUrl = getEmbedUrl(ticketUrl);

  const handleExternalClick = () => {
    trackInitiateCheckout(page.title, ticketUrl);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Link
            href={page.back_link_href || "/"}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {page.back_link_label || "Torna al sito"}
          </Link>

          <Link
            href="/Termini"
            className="text-xs text-foreground/40 hover:text-foreground font-medium underline transition-colors"
          >
            Termini di Biglietteria
          </Link>
        </div>

        {/* Page summary header card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-3 glass">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
            <Ticket size={12} />
            {page.category || "Biglietteria Ufficiale"}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            {page.title}
          </h1>

          {page.description && (
            <p className="text-sm text-foreground/70 leading-relaxed max-w-2xl font-medium pt-1">
              {page.description}
            </p>
          )}
        </div>

        {/* Eventfrog Embed Container or Fallback */}
        {embedUrl ? (
          <div className="space-y-4">
            <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 min-h-[680px] relative">
              <iframe
                src={embedUrl}
                title={`Prevendita ${page.title}`}
                className="w-full h-[720px] sm:h-[760px] border-0"
                allow="payment"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            {/* Fallback & Alternative Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/60">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-primary shrink-0" />
                <span>Difficoltà di visualizzazione con il riquadro? Puoi completare l&apos;acquisto sul portale esterno:</span>
              </div>
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
              >
                <span>Apri su Eventfrog</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-muted/20 border border-foreground/5 text-center space-y-6 glass">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Ticket size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Prevendita non ancora configurata
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed font-medium">
                La prevendita per questa pagina non è al momento collegata a un evento attivo.
              </p>
            </div>
            <Link
              href={page.back_link_href || "/"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
            >
              {page.back_link_label || "Torna al sito"}
            </Link>
          </div>
        )}

        {/* Safety & Legal footer bar */}
        <div className="pt-4 border-t border-foreground/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/40 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Transazione sicura gestita da Eventfrog AG (Olten, Svizzera)</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/Termini" className="hover:text-foreground transition-colors underline">
              Regolamento e Rimborsi
            </Link>
            <Link href="/Privacy" className="hover:text-foreground transition-colors underline">
              Informativa Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
