/**
 * Calendar appointment utilities for email templates.
 * Generates Google Calendar, Outlook, Office 365, Yahoo, and universal RFC 5545 .ics files.
 */

const ITALIAN_MONTHS: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
  gen: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mag: 4,
  giu: 5,
  lug: 6,
  ago: 7,
  set: 8,
  ott: 9,
  nov: 10,
  dic: 11
};

/**
 * Robust date parser supporting ISO strings, standard timestamps,
 * and Italian date formats (e.g. "14 novembre 2026, ore 18:00").
 */
export function parseEventDate(input: string = ""): Date | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();

  // 1. Direct standard Date parse (ISO-8601, RFC2822, YYYY-MM-DD, etc.)
  const directDate = new Date(clean);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  // 2. Try normalized "YYYY-MM-DD HH:mm"
  const normalizedYmd = clean.replace(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/, "$1-$2-$3T$4:$5:00");
  const ymdDate = new Date(normalizedYmd);
  if (!isNaN(ymdDate.getTime())) {
    return ymdDate;
  }

  // 3. Try Italian textual date: "15 gennaio 2025", "Sabato 15 gennaio 2025, ore 20:30", "15 gen 2025 alle 20.30"
  const itRegex = /(?:[a-zA-ZÀ-ÿ]+[,\s]+)?(\d{1,2})\s+([a-zA-ZÀ-ÿ]+)(?:\s+(\d{4}))?(?:[,\s]+(?:(?:alle\s+ore|alle|ore|h)\s*)?(\d{1,2})(?:[:.](\d{2}))?)?/i;
  const itMatch = clean.match(itRegex);
  if (itMatch) {
    const day = parseInt(itMatch[1], 10);
    const monthKey = itMatch[2].toLowerCase();
    const year = itMatch[3] ? parseInt(itMatch[3], 10) : new Date().getFullYear();
    const hour = itMatch[4] ? parseInt(itMatch[4], 10) : 18;
    const min = itMatch[5] ? parseInt(itMatch[5], 10) : 0;

    if (ITALIAN_MONTHS[monthKey] !== undefined) {
      const month = ITALIAN_MONTHS[monthKey];
      const parsed = new Date(year, month, day, hour, min, 0);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  // 4. Try DD/MM/YYYY or DD-MM-YYYY (e.g. "15/01/2025", "15/01/2025 alle 21:00")
  const dmyMatch = clean.match(/(?:[a-zA-ZÀ-ÿ]+[,\s]+)?(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(?:(?:alle\s+ore|alle|ore|h)\s*)?(\d{1,2})(?:[:.](\d{2}))?)?/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 18;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const parsed = new Date(year, month, day, hour, min, 0);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Formats a Date to UTC ISO string without punctuation for calendar deep links (YYYYMMDDTHHmmssZ).
 */
export function formatToUtcCalendarString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Formats a Date to standard ISO string with timezone.
 */
export function formatToIsoString(date: Date): string {
  return date.toISOString();
}

export interface CalendarEventDetails {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  organizerName?: string;
  organizerEmail?: string;
}

/**
 * Generates a direct Google Calendar add event URL.
 */
export function generateGoogleCalendarUrl(event: CalendarEventDetails): string {
  const start = formatToUtcCalendarString(event.startDate);
  const end = formatToUtcCalendarString(
    event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  );

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Evento Teatrale Gli Attomatti",
    dates: `${start}/${end}`,
    details: event.description || "",
    location: event.location || "Zurigo, Svizzera"
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates a direct Outlook.com add event deep link.
 */
export function generateOutlookCalendarUrl(event: CalendarEventDetails): string {
  const start = formatToIsoString(event.startDate);
  const end = formatToIsoString(
    event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  );

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title || "Evento Teatrale Gli Attomatti",
    startdt: start,
    enddt: end,
    body: event.description || "",
    location: event.location || "Zurigo, Svizzera"
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generates an Office 365 add event deep link.
 */
export function generateOffice365CalendarUrl(event: CalendarEventDetails): string {
  const start = formatToIsoString(event.startDate);
  const end = formatToIsoString(
    event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  );

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title || "Evento Teatrale Gli Attomatti",
    startdt: start,
    enddt: end,
    body: event.description || "",
    location: event.location || "Zurigo, Svizzera"
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generates a direct Yahoo Calendar add event URL.
 */
export function generateYahooCalendarUrl(event: CalendarEventDetails): string {
  const start = formatToUtcCalendarString(event.startDate);
  const end = formatToUtcCalendarString(
    event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  );

  const params = new URLSearchParams({
    v: "60",
    view: "d",
    type: "20",
    title: event.title || "Evento Teatrale Gli Attomatti",
    st: start,
    et: end,
    desc: event.description || "",
    in_loc: event.location || "Zurigo, Svizzera"
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Generates standard RFC 5545 iCalendar (.ics) content string.
 * Compatible with Apple Calendar (iOS/macOS), Microsoft Outlook, and Android.
 */
export function generateIcsCalendarContent(event: CalendarEventDetails): string {
  const start = formatToUtcCalendarString(event.startDate);
  const end = formatToUtcCalendarString(
    event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  );
  const now = formatToUtcCalendarString(new Date());
  const uid = `event-${event.startDate.getTime()}-${Math.random().toString(36).substring(2, 9)}@gliattomatti.ch`;

  const escapeIcs = (str: string = "") =>
    str
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");

  const organizerName = event.organizerName || "Compagnia Teatrale Gli Attomatti";
  const organizerEmail = event.organizerEmail || "no-reply@mail.gliattomatti.ch";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gli Attomatti//Email Appointment Generator//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title || "Evento Teatrale Gli Attomatti")}`,
    `DESCRIPTION:${escapeIcs(event.description || "")}`,
    `LOCATION:${escapeIcs(event.location || "Zurigo, Svizzera")}`,
    `ORGANIZER;CN="${organizerName}":mailto:${organizerEmail}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Promemoria: ${escapeIcs(event.title || "Evento Gli Attomatti")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

/**
 * Generates an .ics download URL through our internal API.
 */
export function generateIcsDownloadUrl({
  title,
  description = "",
  location = "",
  startDate,
  endDate,
  baseUrl = "https://gliattomatti.ch"
}: {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  baseUrl?: string;
}): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (startDate) params.set("start", startDate);
  if (endDate) params.set("end", endDate);
  if (location) params.set("location", location);
  if (description) params.set("description", description);

  return `${cleanBase}/api/email/calendar.ics?${params.toString()}`;
}
