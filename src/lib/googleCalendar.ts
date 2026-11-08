/**
 * Google Calendar Client-Side Integration
 * Uses Google Identity Services (GIS) Token Model and Google Calendar API v3.
 * Runs 100% in the client browser - no tokens or personal calendar events are stored on the server.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: GoogleTokenResponse) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  description?: string;
}

export interface GoogleEventDateTime {
  date?: string; // YYYY-MM-DD for all-day events
  dateTime?: string; // RFC3339 timestamp for timed events
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  status?: string;
}

export interface ParsedGCalEvent {
  id: string;
  privateTitle: string; // Shown ONLY in the UI mask, NEVER stored in shared absence notes
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isAllDay: boolean;
  timeSlotNote?: string; // e.g. "Dalle 19:30 alle 22:30"
  originalEvent: GoogleCalendarEvent;
}

const GIS_SCRIPT_ID = "google-identity-services-script";

/**
 * Dynamically loads the Google Identity Services client script
 */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.google?.accounts?.oauth2) return resolve();

    const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = GIS_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Requests a temporary read-only OAuth 2.0 access token for Google Calendar
 */
export async function requestGoogleCalendarToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Libreria Google Identity non disponibile. Riprova tra qualche istante.");
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        callback: (response: GoogleTokenResponse) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error("Nessun token di accesso ricevuto da Google."));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || "Autenticazione Google annullata o non riuscita."));
        }
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(new Error(err?.message || "Errore durante l'inizializzazione del client Google."));
    }
  });
}

/**
 * Fetches the user's available calendars (Primary, Work, Family, etc.)
 */
export async function fetchUserCalendars(accessToken: string): Promise<GoogleCalendarItem[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson?.error?.message || `Impossibile recuperare i calendari (errore ${res.status}).`
    );
  }

  const data = await res.json();
  const items: GoogleCalendarItem[] = (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summaryOverride || item.summary || "Calendario senza titolo",
    primary: Boolean(item.primary),
    backgroundColor: item.backgroundColor,
    description: item.description
  }));

  // Sort with primary calendar first
  return items.sort((a, b) => {
    if (a.primary) return -1;
    if (b.primary) return 1;
    return a.summary.localeCompare(b.summary, "it");
  });
}

/**
 * Fetches events between timeMin and timeMax for a specific calendar
 */
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  startDateStr: string, // YYYY-MM-DD
  endDateStr: string // YYYY-MM-DD
): Promise<ParsedGCalEvent[]> {
  // Convert startDate to ISO at 00:00:00 local
  const timeMin = new Date(`${startDateStr}T00:00:00`).toISOString();
  // Convert endDate to ISO at 23:59:59 local
  const timeMax = new Date(`${endDateStr}T23:59:59`).toISOString();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson?.error?.message || `Impossibile recuperare gli eventi (errore ${res.status}).`
    );
  }

  const data = await res.json();
  const rawEvents: GoogleCalendarEvent[] = data.items || [];

  const parsedEvents: ParsedGCalEvent[] = [];

  for (const ev of rawEvents) {
    // Skip cancelled events
    if (ev.status === "cancelled") continue;

    // Check all-day vs timed
    const isAllDay = Boolean(ev.start?.date);

    let startFormatted = "";
    let endFormatted = "";
    let timeSlotNote: string | undefined = undefined;

    if (isAllDay && ev.start?.date) {
      startFormatted = ev.start.date;
      // Google Calendar end.date for all-day events is exclusive (+1 day)
      // e.g. A 1-day event on Nov 14 has start: 2026-11-14, end: 2026-11-15
      if (ev.end?.date) {
        const endDateObj = new Date(ev.end.date);
        endDateObj.setDate(endDateObj.getDate() - 1);
        const y = endDateObj.getFullYear();
        const m = String(endDateObj.getMonth() + 1).padStart(2, "0");
        const d = String(endDateObj.getDate()).padStart(2, "0");
        endFormatted = `${y}-${m}-${d}`;
        if (endFormatted < startFormatted) endFormatted = startFormatted;
      } else {
        endFormatted = startFormatted;
      }
    } else if (ev.start?.dateTime) {
      const sDate = new Date(ev.start.dateTime);
      const eDate = ev.end?.dateTime ? new Date(ev.end.dateTime) : sDate;

      const sy = sDate.getFullYear();
      const sm = String(sDate.getMonth() + 1).padStart(2, "0");
      const sd = String(sDate.getDate()).padStart(2, "0");
      startFormatted = `${sy}-${sm}-${sd}`;

      const ey = eDate.getFullYear();
      const em = String(eDate.getMonth() + 1).padStart(2, "0");
      const ed = String(eDate.getDate()).padStart(2, "0");
      endFormatted = `${ey}-${em}-${ed}`;

      // Format time note (hours and minutes)
      const startHours = String(sDate.getHours()).padStart(2, "0");
      const startMins = String(sDate.getMinutes()).padStart(2, "0");
      const endHours = String(eDate.getHours()).padStart(2, "0");
      const endMins = String(eDate.getMinutes()).padStart(2, "0");

      if (`${startHours}:${startMins}` === "00:00" && `${endHours}:${endMins}` === "23:59") {
        timeSlotNote = undefined;
      } else if (`${startHours}:${startMins}` === `${endHours}:${endMins}`) {
        timeSlotNote = `Dalle ${startHours}:${startMins}`;
      } else {
        timeSlotNote = `Dalle ${startHours}:${startMins} alle ${endHours}:${endMins}`;
      }
    }

    if (!startFormatted) continue;

    parsedEvents.push({
      id: ev.id,
      privateTitle: ev.summary?.trim() || "Impegno personale",
      startDate: startFormatted,
      endDate: endFormatted,
      isAllDay,
      timeSlotNote,
      originalEvent: ev
    });
  }

  return parsedEvents;
}

