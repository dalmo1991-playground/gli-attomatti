"use client";

import React from "react";
import Link from "next/link";
import { Ticket, ShieldCheck, Lock } from "lucide-react";
import { trackInitiateCheckout } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { EmbeddedFrameView } from "@/components/ui/EmbeddedFrameView";

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

export default function CheckoutClient({ page: initialPage }: CheckoutClientProps) {
  const liveContent = useLiveContent(null);
  const checkoutUi = liveContent?.ticketing_hub?.checkout_page || {};

  const page = React.useMemo(() => {
    if (liveContent?.ticketing_pages) {
      const match = liveContent.ticketing_pages.find(
        (p: any) => p.slug === initialPage?.slug || p.id === initialPage?.id
      );
      if (match) return match;
    }
    return initialPage;
  }, [liveContent, initialPage]);

  const ticketUrl = page.eventfrog_url?.trim() || "";

  // Normalize Eventfrog Embed URL
  const embedUrl = React.useMemo(() => {
    if (!ticketUrl) return "";
    try {
      const u = new URL(ticketUrl);
      u.protocol = "https:";
      return u.toString();
    } catch {
      return ticketUrl;
    }
  }, [ticketUrl]);

  const handleExternalClick = () => {
    trackInitiateCheckout(page.title, ticketUrl);
  };

  return (
    <EmbeddedFrameView
      title={page.title}
      category={page.category || checkoutUi.default_category || "Biglietteria Ufficiale"}
      categoryIcon={Ticket}
      description={page.description}
      embedUrl={embedUrl}
      directUrl={ticketUrl}
      backHref={page.back_link_href || "/"}
      backLabel={page.back_link_label || checkoutUi.default_back_link || "Torna al sito"}
      legalHref="/Termini"
      legalLabel={checkoutUi.terms_link || "Termini di Biglietteria"}
      iframeTitle={`Prevendita ${page.title}`}
      minHeightClass="min-h-[720px] sm:min-h-[760px]"
      frameContainerClassName="bg-white border-foreground/10"
      allow="payment; camera; microphone; autoplay; encrypted-media; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
      notConfiguredTitle={checkoutUi.not_configured_title || "Prevendita non ancora configurata"}
      notConfiguredDescription={checkoutUi.not_configured_description || "La prevendita per questa pagina non è al momento collegata a un evento attivo."}
      fallbackNotice={checkoutUi.iframe_trouble_notice || "Difficoltà di visualizzazione con il riquadro? Puoi completare l'acquisto sul portale esterno:"}
      fallbackButtonLabel={checkoutUi.open_on_eventfrog || "Apri su Eventfrog"}
      onDirectClick={handleExternalClick}
      trustBadges={[
        {
          icon: ShieldCheck,
          text: checkoutUi.secure_transaction_notice || "Transazione sicura gestita da Eventfrog AG (Olten, Svizzera)"
        },
        {
          icon: Lock,
          text: "Crittografia SSL a 256-bit conforme agli standard di sicurezza bancari"
        }
      ]}
    />
  );
}
