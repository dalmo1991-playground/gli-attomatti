/**
 * Utility per il parsing client-side di file CSV per l'invio massivo di email.
 * Supporta delimitatori comuni (, ; \t), gestione delle virgolette e identificazione automatica della colonna email.
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  detectedEmailField: string | null;
  totalRows: number;
  errors: string[];
}

/**
 * Normalizza il testo rimuovendo BOM iniziale e uniformando i ritorni a capo.
 */
function cleanCsvText(raw: string): string {
  let text = raw.trim();
  // Rimuove UTF-8 BOM se presente
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Rileva il delimitatore più probabile analizzando la prima riga (, ; \t).
 */
function detectDelimiter(firstLine: string): string {
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length
  };

  let bestDelimiter = ",";
  let maxCount = -1;

  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return maxCount > 0 ? bestDelimiter : ",";
}

/**
 * Esegue il parsing di una singola riga CSV tenendo conto dei campi racchiusi tra virgolette.
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Virgoletta escapata ("")
        currentVal += '"';
        i++;
      } else {
        // Inversione dello stato di virgolette
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      values.push(currentVal.trim());
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  values.push(currentVal.trim());
  return values;
}

/**
 * Cerca di indovinare la colonna che rappresenta l'indirizzo email.
 */
function guessEmailColumn(headers: string[]): string | null {
  const patterns = [
    /^email$/i,
    /^e-mail$/i,
    /^mail$/i,
    /email/i,
    /e-mail/i,
    /destinatario/i,
    /indirizzo/i
  ];

  for (const pattern of patterns) {
    const found = headers.find((h) => pattern.test(h.trim()));
    if (found) return found;
  }

  return headers.length > 0 ? headers[0] : null;
}

/**
 * Esegue il parsing completo di un testo CSV in intestazioni e record strutturati.
 */
export function parseCsv(csvText: string): ParsedCsvResult {
  const errors: string[] = [];
  const cleaned = cleanCsvText(csvText);

  if (!cleaned) {
    return {
      headers: [],
      rows: [],
      detectedEmailField: null,
      totalRows: 0,
      errors: ["Il file CSV è vuoto o non contiene dati validi."]
    };
  }

  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      detectedEmailField: null,
      totalRows: 0,
      errors: ["Nessuna riga rilevata nel file CSV."]
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCsvLine(lines[0], delimiter);
  const headers = rawHeaders.map((h, idx) => (h ? h.trim() : `colonna_${idx + 1}`));

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCsvLine(line, delimiter);

    // Salta righe completamente vuote
    if (values.length === 1 && values[0] === "") continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : "";
    });

    rows.push(rowObj);
  }

  const detectedEmailField = guessEmailColumn(headers);

  return {
    headers,
    rows,
    detectedEmailField,
    totalRows: rows.length,
    errors
  };
}

