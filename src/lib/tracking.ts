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
    };
  }
}

function isEventEnabled(eventName: "view_content" | "initiate_checkout" | "contact"): boolean {
  if (typeof window === "undefined") return false;
  const config = window.__ATTOMATTI_TRACKING_EVENTS__;
  if (!config) return true; // default enabled if config object not yet ready
  return config[eventName] !== false;
}

/**
 * Track Show View / Content View (Milestone: view_content)
 */
export function trackViewContent(title: string, category: string = "Spettacolo") {
  if (typeof window === "undefined") return;
  if (!isEventEnabled("view_content")) return;

  // Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", "view_item", {
      item_name: title,
      item_category: category,
    });
  }

  // Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_name: title,
      content_category: category,
    });
  }
}

/**
 * Track Ticket Purchase Intent / Click (Milestone: initiate_checkout)
 */
export function trackInitiateCheckout(showTitle: string, ticketUrl?: string) {
  if (typeof window === "undefined") return;
  if (!isEventEnabled("initiate_checkout")) return;

  // Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      items: [
        {
          item_name: showTitle,
          item_category: "Biglietto",
        },
      ],
      ticket_destination: ticketUrl || "internal_checkout",
    });
  }

  // Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      content_name: showTitle,
      content_category: "Biglietto",
    });
  }
}

/**
 * Track Contact Interaction / Lead (Milestone: contact)
 */
export function trackContact(channel: string = "email", destination?: string) {
  if (typeof window === "undefined") return;
  if (!isEventEnabled("contact")) return;

  // Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      contact_channel: channel,
      destination: destination || "",
    });
  }

  // Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "Contact", {
      content_name: `Contatto via ${channel}`,
    });
  }
}
