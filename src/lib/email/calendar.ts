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
 * Timezone identifier for Zurich, Switzerland.
 */
export const ZURICH_TIMEZONE = "Europe/Zurich";

/**
 * Creates a Date object representing the given date & time in Europe/Zurich timezone.
 * Accurately accounts for CET (UTC+1, winter) and CEST (UTC+2, summer daylight saving time).
 */
export function createZurichDate(
  year: number,
  monthIndex: number, // 0 to 11 (matching JS Date conventions)
  day: number,
  hour: number = 18,
  minute: number = 0,
  second: number = 0
): Date {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: ZURICH_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  const nominalUtc = Date.UTC(year, monthIndex, day, hour, minute, second);

  let guessUtc = nominalUtc;
  for (let i = 0; i < 2; i++) {
    const parts = dtf.formatToParts(new Date(guessUtc));
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== "literal") p[part.type] = parseInt(part.value, 10);
    }
    if (p.hour === 24) p.hour = 0;
    const currentZurichMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const diff = nominalUtc - currentZurichMs;
    guessUtc += diff;
    if (diff === 0) break;
  }
  return new Date(guessUtc);
}

/**
 * Returns the calendar and time components of a Date in Europe/Zurich timezone.
 * month is 0-indexed (0 = Jan, 11 = Dec), dayOfWeek is 0 = Sunday .. 6 = Saturday.
 */
export function getZurichDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ZURICH_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const p: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") p[part.type] = part.value;
  }
  const year = parseInt(p.year, 10);
  const month = parseInt(p.month, 10) - 1;
  const day = parseInt(p.day, 10);
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(p.minute, 10);
  const second = parseInt(p.second, 10);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };
  const dayOfWeek = weekdayMap[p.weekday] ?? 0;
  return { year, month, day, hour, minute, second, dayOfWeek };
}

/**
 * Robust date parser supporting ISO strings, standard timestamps,
 * and Italian date formats (e.g. "14 novembre 2026, ore 18:00").
 * All dates without an explicit non-zero timezone offset are parsed as Europe/Zurich local time.
 */
export function parseEventDate(input: string = ""): Date | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();

  // 1. Exact ISO string with milliseconds (e.g. from Date.prototype.toISOString())
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Compact UTC calendar string (YYYYMMDDTHHmmssZ)
  const compactMatch = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/i);
  if (compactMatch) {
    const [, y, m, d, h, min, s] = compactMatch;
    return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
  }

  // 3. Explicit non-UTC timezone offset (e.g. +01:00, +02:00, -05:00)
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:[+-](?!00:?00)\d{2}:?\d{2})$/i.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // 4. ISO or standard format: YYYY-MM-DD or YYYY-MM-DDTHH:mm(:ss)(Z) or YYYY-MM-DD HH:mm(:ss)
  // All times supplied by user are in Europe/Zurich timezone.
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?Z?)?$/i);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hour = isoMatch[4] !== undefined ? parseInt(isoMatch[4], 10) : 18;
    const min = isoMatch[5] !== undefined ? parseInt(isoMatch[5], 10) : 0;
    const sec = isoMatch[6] !== undefined ? parseInt(isoMatch[6], 10) : 0;
    return createZurichDate(year, monthIndex, day, hour, min, sec);
  }

  // 5. Italian textual date: "15 gennaio 2025", "Sabato 15 gennaio 2025, ore 20:30", "14 nov 2026 alle 18.00"
  const itRegex = /(?:^|[\s—\-])(\d{1,2})\s+([a-zA-ZÀ-ÿ]+)(?:\s+(\d{4}))?(?:[,\s]+(?:(?:alle\s+ore|alle|ore|h)\s*)?(\d{1,2})(?:[:.](\d{2}))?)?/i;
  const itMatch = clean.match(itRegex);
  if (itMatch) {
    const day = parseInt(itMatch[1], 10);
    const monthKey = itMatch[2].toLowerCase();
    if (ITALIAN_MONTHS[monthKey] !== undefined) {
      const monthIndex = ITALIAN_MONTHS[monthKey];
      const year = itMatch[3] ? parseInt(itMatch[3], 10) : new Date().getFullYear();
      const hour = itMatch[4] !== undefined ? parseInt(itMatch[4], 10) : 18;
      const min = itMatch[5] !== undefined ? parseInt(itMatch[5], 10) : 0;
      return createZurichDate(year, monthIndex, day, hour, min, 0);
    }
  }

  // 6. DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY (e.g. "15/01/2025", "14.11.2026 alle ore 18:00")
  const dmyMatch = clean.match(/(?:^|[\s—\-])(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[,\s]+(?:(?:alle\s+ore|alle|ore|h)\s*)?(\d{1,2})(?:[:.](\d{2}))?)?/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIndex = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] !== undefined ? parseInt(dmyMatch[4], 10) : 18;
    const min = dmyMatch[5] !== undefined ? parseInt(dmyMatch[5], 10) : 0;
    return createZurichDate(year, monthIndex, day, hour, min, 0);
  }

  // 7. Fallback direct Date parse
  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? null : fallback;
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
    location: event.location || "Zurigo, Svizzera",
    ctz: ZURICH_TIMEZONE
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

  const cleanParam = (str: string = "") => str.replace(/[\r\n":;]/g, "").trim();
  const safeOrgName = cleanParam(event.organizerName || "Compagnia Teatrale Gli Attomatti");
  const safeOrgEmail = cleanParam(event.organizerEmail || "no-reply@mail.gliattomatti.ch");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gli Attomatti//Email Appointment Generator//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-TIMEZONE:${ZURICH_TIMEZONE}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title || "Evento Teatrale Gli Attomatti")}`,
    `DESCRIPTION:${escapeIcs(event.description || "")}`,
    `LOCATION:${escapeIcs(event.location || "Zurigo, Svizzera")}`,
    `ORGANIZER;CN="${safeOrgName}":mailto:${safeOrgEmail}`,
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
  startDate: string | Date;
  endDate?: string | Date;
  baseUrl?: string;
}): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (startDate) {
    params.set(
      "start",
      startDate instanceof Date ? startDate.toISOString() : startDate
    );
  }
  if (endDate) {
    params.set(
      "end",
      endDate instanceof Date ? endDate.toISOString() : endDate
    );
  }
  if (location) params.set("location", location);
  if (description) params.set("description", description);

  return `${cleanBase}/api/email/calendar.ics?${params.toString()}`;
}
