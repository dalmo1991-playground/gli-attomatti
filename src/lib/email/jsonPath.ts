/**
 * JSONPath & Dot-Notation resolver utility.
 * Supports:
 * - Simple keys: "pippo"
 * - Dot notation: "customer.email"
 * - Array indices: "items[0].email" or "items.0.email"
 * - Bracket notation: "data['customer_email']" or "data[\"email\"]"
 */

function splitJsonPath(path: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inBracket = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    if (char === "[") {
      inBracket = true;
      if (current) {
        parts.push(current);
        current = "";
      }
      current += "[";
    } else if (char === "]") {
      inBracket = false;
      current += "]";
      parts.push(current);
      current = "";
    } else if (char === "." && !inBracket) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts.filter(Boolean);
}

export function getValueByJsonPath(obj: any, path: string): any {
  if (!obj || typeof obj !== "object" || !path) return undefined;

  let trimmed = path.trim();
  // Strip wrapping {{ and }} if present (e.g. {{data.fields[0].value}} -> data.fields[0].value)
  trimmed = trimmed.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
  trimmed = trimmed.replace(/^\$\.?/, ""); // strip optional leading '$' or '$.'
  if (!trimmed) return undefined;

  const segments = splitJsonPath(trimmed);
  let current = obj;

  for (const seg of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (seg.startsWith("[") && seg.endsWith("]")) {
      const inner = seg.slice(1, -1).trim();

      // 1. Numeric array index: [0] or [1]
      if (/^\d+$/.test(inner)) {
        current = Array.isArray(current) ? current[parseInt(inner, 10)] : undefined;
        continue;
      }

      // 2. Quoted property: ['foo']
      const quoteMatch = inner.match(/^['"](.+)['"]$/);
      if (quoteMatch) {
        current = current ? current[quoteMatch[1]] : undefined;
        continue;
      }

      // 3. JSONPath filter query: [?(@.label == 'Email')] or [label=Email] or [label='Nome e Cognome']
      const filterMatch =
        inner.match(/^\?\(@?\.?([a-zA-Z0-9_-]+)\s*==?\s*(.+?)\)?$/) ||
        inner.match(/^([a-zA-Z0-9_-]+)\s*==?\s*(.+)$/);

      if (filterMatch && Array.isArray(current)) {
        const prop = filterMatch[1].trim();
        const rawVal = filterMatch[2].trim();
        const val = rawVal.replace(/^['"]|['"]$/g, "").trim();
        current = current.find(
          (item) =>
            item &&
            (String(item[prop] || "").toLowerCase() === val.toLowerCase() ||
              String(item[prop] || "") === val)
        );
        continue;
      }
    }

    current = current ? current[seg] : undefined;
  }

  return current;
}

/**
 * Recursively flattens any nested JSON object into a dot-notation dictionary.
 * Supports:
 * - standard dot notation: "data.submissionId"
 * - array indexes: "data.fields[0].value"
 * - standard JSONPath filter queries: "data.fields[?(@.label=='Email')].value"
 * - label aliases: "data.fields[label=Email].value"
 */
export function flattenJsonToDotNotation(
  obj: any,
  prefix: string = "",
  result: Record<string, string> = {}
): Record<string, string> {
  if (obj === null || obj === undefined) return result;

  if (typeof obj !== "object") {
    if (prefix) {
      result[prefix] = String(obj);
    }
    return result;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      const dotKey = prefix ? `${prefix}.${idx}` : `${idx}`;
      const bracketKey = prefix ? `${prefix}[${idx}]` : `[${idx}]`;

      if (typeof item === "object" && item !== null) {
        flattenJsonToDotNotation(item, dotKey, result);
        flattenJsonToDotNotation(item, bracketKey, result);

        // Standard JSONPath filter query if item has label and value
        if (item.label !== undefined && item.value !== undefined) {
          const lbl = String(item.label).trim();
          const val = String(item.value !== null && item.value !== undefined ? item.value : "");
          result[`${prefix}[?(@.label=='${lbl}')].value`] = val;
          result[`${prefix}[label=${lbl}].value`] = val;
          result[`${prefix}[label='${lbl}'].value`] = val;
        }
      } else if (item !== undefined && item !== null) {
        result[dotKey] = String(item);
        result[bracketKey] = String(item);
      }
    });
    return result;
  }

  for (const [key, val] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null) {
      flattenJsonToDotNotation(val, nextKey, result);
    } else if (val !== undefined && val !== null) {
      result[nextKey] = String(val);
    }
  }

  return result;
}

/**
 * Finds an email address in an object using strictly:
 * 1. Specified path (if provided)
 * 2. Top-level direct properties (to, email, recipient_email)
 * Does NOT perform fuzzy scans or guesswork.
 */
export function resolveRecipientEmail(obj: any, explicitPath?: string | null): string {
  if (!obj || typeof obj !== "object") return "";

  // 1. Try explicit path if given
  if (explicitPath && typeof explicitPath === "string") {
    const rawTrimmed = explicitPath.trim();
    if (!/[\[\]\(\)\$\{\}\=]/.test(rawTrimmed) && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(rawTrimmed)) {
      return rawTrimmed;
    }
    const val = getValueByJsonPath(obj, explicitPath);
    if (typeof val === "string" && val.includes("@")) {
      return val.trim();
    }
    return "";
  }

  // 2. Only check direct top-level properties (no guessing or crawling)
  const directCandidates = [obj.to, obj.email, obj.recipient_email, obj.recipient];
  for (const c of directCandidates) {
    if (typeof c === "string" && c.includes("@")) {
      return c.trim();
    }
  }

  return "";
}

/**
 * Finds a name in an object using strictly:
 * 1. Specified path (if provided)
 * 2. Top-level direct properties (name, nome)
 */
export function resolveRecipientName(obj: any, explicitPath?: string | null): string {
  if (!obj || typeof obj !== "object") return "";

  if (explicitPath && typeof explicitPath === "string") {
    const val = getValueByJsonPath(obj, explicitPath);
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
    return "";
  }

  if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
  if (typeof obj.nome === "string" && obj.nome.trim()) return obj.nome.trim();

  return "";
}

export interface ExtractedJsonField {
  path: string;
  sampleValue: string;
  type: "string" | "number" | "boolean" | "email" | "array" | "object";
  isEmailCandidate: boolean;
  isNameCandidate: boolean;
}

/**
 * Extracts all leaf fields from an arbitrary JSON object, returning their paths, sample values, and detected roles.
 */
export function extractFieldsFromJson(obj: any, prefix = ""): ExtractedJsonField[] {
  const fields: ExtractedJsonField[] = [];
  if (obj === null || obj === undefined) return fields;

  if (typeof obj !== "object") {
    if (prefix) {
      const valStr = String(obj);
      const isEmail = valStr.includes("@") && valStr.includes(".") && !valStr.includes(" ");
      const isName = /name|nome|first_name|cognome/i.test(prefix);
      fields.push({
        path: prefix,
        sampleValue: valStr.length > 80 ? valStr.substring(0, 77) + "..." : valStr,
        type: isEmail ? "email" : (typeof obj as any),
        isEmailCandidate: isEmail || /email|mail/i.test(prefix),
        isNameCandidate: isName
      });
    }
    return fields;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) {
        fields.push({
          path: prefix,
          sampleValue: "[]",
          type: "array",
          isEmailCandidate: false,
          isNameCandidate: false
        });
      }
    } else {
      // Analyze first element as representative
      obj.slice(0, 1).forEach((item, idx) => {
        const itemPrefix = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
        fields.push(...extractFieldsFromJson(item, itemPrefix));
      });
    }
    return fields;
  }

  for (const [key, val] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object") {
      fields.push(...extractFieldsFromJson(val, nextKey));
    } else {
      const valStr = val === null ? "null" : val === undefined ? "undefined" : String(val);
      const isEmail = valStr.includes("@") && valStr.includes(".") && !valStr.includes(" ");
      const isName = /name|nome|first_name|cognome/i.test(key);
      const isEmailKey = /email|mail/i.test(key);
      fields.push({
        path: nextKey,
        sampleValue: valStr.length > 80 ? valStr.substring(0, 77) + "..." : valStr,
        type: isEmail ? "email" : (typeof val as any),
        isEmailCandidate: isEmail || isEmailKey,
        isNameCandidate: isName
      });
    }
  }

  return fields;
}
