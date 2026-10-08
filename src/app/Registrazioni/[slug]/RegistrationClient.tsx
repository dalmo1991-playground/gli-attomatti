"use client";

import React from "react";
import Script from "next/script";
import { ClipboardList, ShieldCheck, Lock } from "lucide-react";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { EmbeddedFrameView } from "@/components/ui/EmbeddedFrameView";
import { defaultText } from "@/lib/utils";
import { trackViewContent, trackLead, trackContact } from "@/lib/tracking";

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
  const embedUrl = React.useMemo(() => {
    if (!rawUrl) return "";
    try {
      const match = rawUrl.match(/tally\.so\/(?:r|embed)\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://tally.so/embed/${match[1]}?alignLeft=1&transparentBackground=0`;
      }
      const u = new URL(rawUrl);
      u.protocol = "https:";
      return u.toString();
    } catch {
      return rawUrl;
    }
  }, [rawUrl]);

  // Track ViewContent for the registration page
  React.useEffect(() => {
    if (page?.title) {
      trackViewContent(page.title, "Registrazione");
    }
  }, [page?.title]);

  // Listen to official Tally postMessage event for form submission
  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      let isSubmitted = false;
      let formId = "";
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "Tally.FormSubmitted") {
          isSubmitted = true;
          formId = data.payload?.formId || "";
        }
      } catch {
        if (typeof e.data === "string" && e.data.includes("Tally.FormSubmitted")) {
          isSubmitted = true;
        }
      }

      if (isSubmitted && page?.title) {
        trackLead(page.title, "tally_embed", {
          form_id: formId,
          slug: page.slug,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [page?.title, page?.slug]);

  return (
    <>
      {/* Load Tally official widget script */}
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />

      <EmbeddedFrameView
        title={defaultText(page.title)}
        category={defaultText(page.category, regUi.default_category, "Modulo di Iscrizione")}
        categoryIcon={ClipboardList}
        description={defaultText(page.description)}
        embedUrl={embedUrl}
        directUrl={rawUrl || embedUrl}
        backHref={page.back_link_href || "/"}
        backLabel={defaultText(page.back_link_label, regUi.default_back_link, "Torna al sito")}
        legalHref="/Privacy"
        legalLabel={defaultText(regUi.privacy_link, "Informativa Privacy")}
        iframeTitle={defaultText(page.title, regUi.default_category, "Modulo di Registrazione")}
        dataTallySrc={embedUrl}
        minHeightClass="min-h-[780px] sm:min-h-[840px]"
        frameContainerClassName="bg-white border-slate-200 p-2 sm:p-4 md:p-6"
        notConfiguredTitle={defaultText(regUi.not_configured_title, "Modulo non ancora configurato")}
        notConfiguredDescription={defaultText(regUi.not_configured_description, "Il modulo di registrazione per questa pagina non è al momento collegato a un form Tally attivo.")}
        fallbackNotice={defaultText(regUi.iframe_trouble_notice, "Difficoltà di compilazione? Puoi aprire il modulo in una nuova finestra:")}
        fallbackButtonLabel={defaultText(regUi.open_on_tally, "Apri su Tally")}
        onDirectClick={() => trackContact("tally_external", rawUrl || embedUrl)}
        trustBadges={[
          {
            icon: ShieldCheck,
            text: defaultText(regUi.secure_form_notice, "Modulo sicuro e conforme nLPD / GDPR (Tally BV, server UE)")
          },
          {
            icon: Lock,
            text: defaultText(regUi.data_privacy_notice, "Protezione e trattamento confidenziale dei dati secondo la nLPD")
          }
        ]}
      />
    </>
  );
}
