/**
 * Gli Attomatti - Client-side Tracking Helpers
 * Safely dispatches events to Google Analytics (GA4) and Meta Pixel
 * only if they are initialized, consented to, and enabled in site settings.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
    __ATTOMATTI_TRACKING_EVENTS__?: {
      view_content?: boolean;
      initiate_checkout?: boolean;
      contact?: boolean;
      lead?: boolean;
      social_click?: boolean;
    };
  }
}

import { emitDevTrackingEvent } from "./devTracking";

export type TrackingEventKey = "view_content" | "initiate_checkout" | "contact" | "lead" | "social_click";

function isEventEnabled(eventName: TrackingEventKey): boolean {
  if (typeof window === "undefined") return false;
  const config = window.__ATTOMATTI_TRACKING_EVENTS__;
  if (!config) return true; // default enabled if config object not yet ready
  return config[eventName] !== false;
}

/**
 * Track Show View / Content View (Milestone: view_content)
 * Categories: "Spettacolo", "Iniziativa", "Landing", "Location", "Attore", "Registrazione"
 */
export function trackViewContent(
  title: string,
  category: string = "Spettacolo",
  extra?: Record<string, any>
) {
  if (typeof window === "undefined" || !title) return;
  if (!isEventEnabled("view_content")) return;

  const gaDispatched = typeof window.gtag === "function";
  const metaDispatched = typeof window.fbq === "function";

  // Google Analytics 4
  if (gaDispatched) {
    window.gtag!("event", "view_item", {
      item_name: title,
      item_category: category,
      ...extra,
    });
  }

  // Meta Pixel
  if (metaDispatched) {
    window.fbq!("track", "ViewContent", {
      content_name: title,
      content_category: category,
      ...extra,
    });
  }

  emitDevTrackingEvent({
    source: "app",
    action: "view_content (view_item)",
    category,
    payload: { title, category, ...extra },
    dispatchedTo: { ga4: gaDispatched, meta: metaDispatched },
  });
}

/**
 * Track Ticket Purchase Intent / Click (Milestone: initiate_checkout)
 */
export function trackInitiateCheckout(
  showTitle: string,
  ticketUrl?: string,
  source?: string
) {
  if (typeof window === "undefined" || !showTitle) return;
  if (!isEventEnabled("initiate_checkout")) return;

  const destination = ticketUrl || "internal_checkout";
  const gaDispatched = typeof window.gtag === "function";
  const metaDispatched = typeof window.fbq === "function";

  // Google Analytics 4
  if (gaDispatched) {
    window.gtag!("event", "begin_checkout", {
      items: [
        {
          item_name: showTitle,
          item_category: "Biglietto",
        },
      ],
      ticket_destination: destination,
      checkout_source: source || "direct",
    });
  }

  // Meta Pixel
  if (metaDispatched) {
    window.fbq!("track", "InitiateCheckout", {
      content_name: showTitle,
      content_category: "Biglietto",
      ticket_destination: destination,
      source: source || "direct",
    });
  }

  emitDevTrackingEvent({
    source: "app",
    action: "initiate_checkout (begin_checkout)",
    category: "Biglietto",
    isConversion: true,
    payload: {
      showTitle,
      ticket_destination: destination,
      checkout_source: source || "direct",
    },
    dispatchedTo: { ga4: gaDispatched, meta: metaDispatched },
  });
}

/**
 * Track Contact Interaction / Direct Channel Click (Milestone: contact)
 */
export function trackContact(channel: string = "email", destination?: string) {
  if (typeof window === "undefined") return;
  if (!isEventEnabled("contact")) return;

  const gaDispatched = typeof window.gtag === "function";
  const metaDispatched = typeof window.fbq === "function";

  // Google Analytics 4
  if (gaDispatched) {
    window.gtag!("event", "generate_lead", {
      contact_channel: channel,
      destination: destination || "",
    });
  }

  // Meta Pixel
  if (metaDispatched) {
    window.fbq!("track", "Contact", {
      content_name: `Contatto via ${channel}`,
    });
  }

  emitDevTrackingEvent({
    source: "app",
    action: "contact",
    category: "Contatto",
    payload: { channel, destination: destination || "" },
    dispatchedTo: { ga4: gaDispatched, meta: metaDispatched },
  });
}

/**
 * Track Form Submissions & Registrations Completion (Milestone: lead)
 * Specifically for Tally form completions or custom registration intents.
 */
export function trackLead(
  formName: string,
  channel: string = "tally",
  details?: Record<string, any>
) {
  if (typeof window === "undefined" || !formName) return;
  if (!isEventEnabled("lead")) return;

  const gaDispatched = typeof window.gtag === "function";
  const metaDispatched = typeof window.fbq === "function";

  // Google Analytics 4
  if (gaDispatched) {
    window.gtag!("event", "generate_lead", {
      form_name: formName,
      lead_channel: channel,
      ...details,
    });
  }

  // Meta Pixel
  if (metaDispatched) {
    window.fbq!("track", "Lead", {
      content_name: formName,
      content_category: "Registrazione",
      channel,
      ...details,
    });
  }

  emitDevTrackingEvent({
    source: "app",
    action: "lead",
    category: "Registrazione",
    isConversion: true,
    payload: { formName, channel, ...details },
    dispatchedTo: { ga4: gaDispatched, meta: metaDispatched },
  });
}

/**
 * Track Outbound Social Media Clicks (Milestone: social_click)
 * Especially Instagram and Facebook official page or post clicks.
 */
export function trackSocialClick(
  platform: "Instagram" | "Facebook" | string,
  destinationUrl: string
) {
  if (typeof window === "undefined") return;
  if (!isEventEnabled("social_click")) return;

  const gaDispatched = typeof window.gtag === "function";
  const metaDispatched = typeof window.fbq === "function";

  // Google Analytics 4
  if (gaDispatched) {
    window.gtag!("event", "social_interaction", {
      social_platform: platform,
      target_url: destinationUrl,
      outbound: true,
    });
  }

  // Meta Pixel
  if (metaDispatched) {
    window.fbq!("trackCustom", "SocialClick", {
      platform,
      destination: destinationUrl,
    });
  }

  emitDevTrackingEvent({
    source: "app",
    action: "social_click",
    category: "Social",
    payload: { platform, destinationUrl },
    dispatchedTo: { ga4: gaDispatched, meta: metaDispatched },
  });
}

