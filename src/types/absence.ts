export interface AbsenceRecord {
  id: string; // Unique ID (e.g. "abs_1730000000000_abc123")
  memberName: string; // Member name (e.g. "Domenico", "Andrea")
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (same as startDate for single day)
  status?: "certain" | "maybe"; // "certain" (assenza certa) | "maybe" (forse assente)
  note?: string; // Optional note (e.g. "Dalle 20:30", "Lavoro")
  createdAt: string; // ISO date string
}

export interface SpecialDate {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // es. "Spettacolo Scuol", "Prova Generale"
  type: "show" | "rehearsal" | "event"; // Tipo evento
  note?: string;
}

export interface MemberAbsenceFile {
  memberName: string;
  updatedAt: string;
  absences: AbsenceRecord[];
}

export interface AbsenceResponseData {
  members: string[];
  absences: AbsenceRecord[];
  storage: 'vercel-blob' | 'local-file';
}

// Default known members for Gli Attomatti
export const DEFAULT_MEMBERS = [
  "Andrea",
  "Ausilia",
  "Carla",
  "Delia",
  "Domenico",
  "Florinda",
  "Gerardo",
  "Lucrezia",
  "Ludovica",
  "Marco",
  "Margherita",
  "Matteo",
  "Mauro",
  "Michele",
  "Monica",
  "Roberto",
  "Teresa"
];

export function memberNameToSlug(name: string): string {
  return (name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-");
}


