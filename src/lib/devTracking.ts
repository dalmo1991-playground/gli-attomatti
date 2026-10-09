/**
 * Dev Tracking Bus & Overlay Types
 * Enables real-time observation of analytics and marketing tracking events in development environments.
 */

export interface DevTrackingEvent {
  id: string;
  timestamp: number;
  timeString: string;
  source: "ga4" | "meta" | "app" | "ga4-auto";
  action: string; // e.g. "page_view", "scroll", "click", "view_content", "initiate_checkout", "lead", "contact", "social_click"
  category?: string;
  payload: Record<string, any>;
  isConversion?: boolean;
  dispatchedTo: {
    ga4: boolean;
    meta: boolean;
  };
  consentState?: {
    analytics: boolean;
    marketing: boolean;
  };
}

export const DEV_TRACKING_EVENT_NAME = "attomatti_dev_tracking_event";
export const DEV_TRACKING_TOGGLE_EVENT_NAME = "attomatti_dev_tracking_toggle";
export const DEV_TRACKING_STORAGE_KEY = "attomatti_dev_tracking_overlay_enabled";

/**
 * Dispatches an event to the dev tracking bus (only active in browser and dev environments).
 */
export function emitDevTrackingEvent(event: Omit<DevTrackingEvent, "id" | "timestamp" | "timeString">) {
  if (typeof window === "undefined") return;

  const now = new Date();
  const timeString = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

  const fullEvent: DevTrackingEvent = {
    ...event,
    id: `dev-track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    timeString,
  };

  try {
    window.dispatchEvent(
      new CustomEvent(DEV_TRACKING_EVENT_NAME, {
        detail: fullEvent,
      })
    );
  } catch (err) {
    console.warn("Failed to dispatch dev tracking event", err);
  }
}

/**
 * Checks whether the overlay is enabled in localStorage.
 */
export function isDevTrackingOverlayEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEV_TRACKING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Sets whether the overlay is enabled in localStorage and dispatches a toggle event.
 */
export function setDevTrackingOverlayEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEV_TRACKING_STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent(DEV_TRACKING_TOGGLE_EVENT_NAME, {
        detail: { enabled },
      })
    );
  } catch (err) {
    console.warn("Failed to save dev tracking overlay preference", err);
  }
}
