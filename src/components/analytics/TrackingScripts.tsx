"use client";

import React, { useEffect } from "react";
import Script from "next/script";

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
      (window as any).__ATTOMATTI_TRACKING_EVENTS__ = integrations?.events || {
        view_content: true,
        initiate_checkout: true,
        contact: true,
      };
    }
  }, [integrations?.events]);

  // Update Google Consent Mode v2 when consent state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (typeof w.gtag !== "function") return;

    w.gtag("consent", "update", {
      analytics_storage: hasAnalyticsConsent ? "granted" : "denied",
      ad_storage: hasMarketingConsent ? "granted" : "denied",
      ad_user_data: hasMarketingConsent ? "granted" : "denied",
      ad_personalization: hasMarketingConsent ? "granted" : "denied",
    });
  }, [hasAnalyticsConsent, hasMarketingConsent]);

  // If neither provider is configured, render nothing
  if (!gaId && !metaId) return null;

  return (
    <>
      {/* 1. Google Consent Mode v2 Default (Always runs first if GA is configured, sets denied by default) */}
      {gaId && (
        <Script
          id="google-consent-mode-default"
          strategy="beforeInteractive"
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
                  page_path: window.location.pathname,
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
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  );
}
