"use client";

import React, { useEffect, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { emitDevTrackingEvent } from "@/lib/devTracking";
import type {} from "@/lib/tracking";

interface TrackingScriptsProps {
  integrations?: {
    google_analytics?: {
      enabled?: boolean;
      measurement_id?: string;
    };
    meta_pixel?: {
      enabled?: boolean;
      pixel_id?: string;
    };
    events?: {
      view_content?: boolean;
      initiate_checkout?: boolean;
      contact?: boolean;
    };
  };
  consent?: {
    analytics: boolean;
    marketing: boolean;
  };
}

interface RouteTrackerProps {
  gaId: string | null;
  metaId: string | null;
  hasAnalyticsConsent: boolean;
  hasMarketingConsent: boolean;
}

/**
 * RouteTracker monitors client-side navigations (SPA page changes in Next.js App Router).
 * In Next.js, history.pushState happens before React commits the new <title> to the DOM.
 * By waiting for the <title> tag mutation (or falling back to a quick tick),
 * we guarantee that GA4 and Meta Pixel record the EXACT, updated page title and path.
 */
function RouteTracker({
  gaId,
  metaId,
  hasAnalyticsConsent,
  hasMarketingConsent,
}: RouteTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const canTrackGa = Boolean(hasAnalyticsConsent && gaId);
    const canTrackMeta = Boolean(hasMarketingConsent && metaId);

    let fired = false;
    const sendPageView = () => {
      if (fired) return;
      fired = true;

      const query = searchParams?.toString();
      const pagePath = pathname + (query ? `?${query}` : "");
      const pageLocation = window.location.href;
      const pageTitle = document.title || "Gli Attomatti";

      const gaSent = Boolean(canTrackGa && typeof window.gtag === "function");
      const metaSent = Boolean(canTrackMeta && typeof window.fbq === "function");

      if (gaSent) {
        window.gtag!("event", "page_view", {
          page_title: pageTitle,
          page_location: pageLocation,
          page_path: pagePath,
        });
      }

      if (metaSent) {
        window.fbq!("track", "PageView");
      }

      emitDevTrackingEvent({
        source: "app",
        action: "page_view",
        category: "Navigazione",
        payload: {
          page_title: pageTitle,
          page_path: pagePath,
          page_location: pageLocation,
          ga_measurement_id: gaId || "non configurato",
          meta_pixel_id: metaId || "non configurato",
        },
        dispatchedTo: {
          ga4: gaSent,
          meta: metaSent,
        },
        consentState: {
          analytics: hasAnalyticsConsent,
          marketing: hasMarketingConsent,
        },
      });
    };

    // Watch for <title> mutation in <head> so we fire as soon as Next.js updates the document title
    const titleEl = document.querySelector("title");
    let observer: MutationObserver | null = null;
    if (titleEl) {
      observer = new MutationObserver(() => {
        sendPageView();
      });
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    // Fallback: in case the title was already updated or doesn't change, fire after 120ms
    const timer = setTimeout(sendPageView, 120);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [pathname, searchParams, gaId, metaId, hasAnalyticsConsent, hasMarketingConsent]);

  return null;
}

export function TrackingScripts({ integrations, consent }: TrackingScriptsProps) {
  const ga = integrations?.google_analytics;
  const meta = integrations?.meta_pixel;

  const gaId = ga?.enabled && ga.measurement_id?.trim() ? ga.measurement_id.trim() : null;
  const metaId = meta?.enabled && meta.pixel_id?.trim() ? meta.pixel_id.trim() : null;

  const hasAnalyticsConsent = Boolean(consent?.analytics);
  const hasMarketingConsent = Boolean(consent?.marketing);

  // Synchronize active event milestones to window for client helpers
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__ATTOMATTI_TRACKING_EVENTS__ = integrations?.events || {
        view_content: true,
        initiate_checkout: true,
        contact: true,
        lead: true,
        social_click: true,
      };
    }
  }, [integrations?.events]);

  // Update Google Consent Mode v2 when consent state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: hasAnalyticsConsent ? "granted" : "denied",
        ad_storage: hasMarketingConsent ? "granted" : "denied",
        ad_user_data: hasMarketingConsent ? "granted" : "denied",
        ad_personalization: hasMarketingConsent ? "granted" : "denied",
      });
    }

    emitDevTrackingEvent({
      source: "app",
      action: "consent_update",
      category: "Privacy / Consenso",
      payload: {
        analytics_storage: hasAnalyticsConsent ? "granted" : "denied",
        ad_storage: hasMarketingConsent ? "granted" : "denied",
      },
      dispatchedTo: {
        ga4: typeof window.gtag === "function",
        meta: typeof window.fbq === "function",
      },
      consentState: {
        analytics: hasAnalyticsConsent,
        marketing: hasMarketingConsent,
      },
    });
  }, [hasAnalyticsConsent, hasMarketingConsent]);

  // Update Meta Pixel Consent state when marketing consent changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.fbq !== "function") return;

    window.fbq("consent", hasMarketingConsent ? "grant" : "revoke");
  }, [hasMarketingConsent]);

  // If neither provider is configured, render nothing
  if (!gaId && !metaId) return null;

  return (
    <>
      {/* 1. Google Consent Mode v2 Default (Always runs first if GA is configured, sets denied by default) */}
      {gaId && (
        <Script
          id="google-consent-mode-default"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              });
            `,
          }}
        />
      )}

      {/* 2. Google Analytics 4 Script (Only loaded when analytics consent is granted) */}
      {gaId && hasAnalyticsConsent && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  send_page_view: false,
                  anonymize_ip: true
                });
              `,
            }}
          />
        </>
      )}

      {/* 3. Meta Pixel (Only loaded when marketing consent is granted) */}
      {metaId && hasMarketingConsent && (
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaId}');
            `,
          }}
        />
      )}

      {/* 4. Active Route & Page Title Tracker for SPA navigation */}
      <Suspense fallback={null}>
        <RouteTracker
          gaId={gaId}
          metaId={metaId}
          hasAnalyticsConsent={hasAnalyticsConsent}
          hasMarketingConsent={hasMarketingConsent}
        />
      </Suspense>
    </>
  );
}
