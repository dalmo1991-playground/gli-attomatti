/**
 * Utility per la gestione della whitelist e dei token di anteprima su siti dev/collaudo (ACPT).
 * Permette la consultazione sicura di specifiche pagine senza dover conoscere o inserire
 * la password master di DEV_GATE_PASSWORD.
 */

export interface PreviewAccessRule {
  id: string;
  label?: string;          // Descrizione per uso interno (es. "Anteprima per Teatro Foce")
  path: string;            // Path o pattern (es. "/Location/sala-grande", "/landing/evento-speciale")
  token?: string;          // Token segreto opzionale nella query string (es. ?preview_token=xyz123)
  expiresAt?: string;      // Data ISO di scadenza opzionale (es. "2026-12-31")
  enabled?: boolean;       // Flag attivo/disattivo
}

export interface DevAccessConfig {
  enabled?: boolean;
  rules?: PreviewAccessRule[];
}

/**
 * Normalizza un path eliminando trailing slash e query params.
 */
export function normalizePath(path: string): string {
  if (!path) return "/";
  try {
    const clean = path.split("?")[0].split("#")[0].trim();
    if (clean === "") return "/";
    const withLeading = clean.startsWith("/") ? clean : `/${clean}`;
    return withLeading.length > 1 && withLeading.endsWith("/")
      ? withLeading.slice(0, -1)
      : withLeading;
  } catch {
    return path;
  }
}

/**
 * Verifica se un pathname corrisponde a un pattern configurato (esatto o con wildcard '*').
 */
export function matchesPathPattern(pathname: string, pattern: string): boolean {
  const normPath = normalizePath(pathname).toLowerCase();
  const normPattern = normalizePath(pattern).toLowerCase();

  // 1. Wildcard finale (es. "/landing/*")
  if (normPattern.endsWith("/*")) {
    const prefix = normPattern.slice(0, -2);
    return normPath === prefix || normPath.startsWith(`${prefix}/`);
  }

  // 2. Wildcard singola '*'
  if (normPattern.endsWith("*")) {
    const prefix = normPattern.slice(0, -1);
    return normPath.startsWith(prefix);
  }

  // 3. Match esatto
  return normPath === normPattern;
}

/**
 * Valuta se l'accesso a `pathname` con gli eventuali query params è autorizzato
 * da una regola nella configurazione delle anteprime.
 */
export function isRouteWhitelisted(
  pathname: string,
  searchString: string,
  config?: DevAccessConfig
): { allowed: boolean; matchedRule?: PreviewAccessRule } {
  if (!config || config.enabled === false) {
    return { allowed: false };
  }

  const rules = Array.isArray(config.rules) ? config.rules : [];
  if (rules.length === 0) {
    return { allowed: false };
  }

  let searchParams: URLSearchParams;
  try {
    searchParams = new URLSearchParams(searchString.startsWith("?") ? searchString.slice(1) : searchString);
  } catch {
    searchParams = new URLSearchParams();
  }

  const tokenParam = (
    searchParams.get("preview_token") ||
    searchParams.get("preview") ||
    searchParams.get("token") ||
    ""
  ).trim();

  const now = new Date();

  for (const rule of rules) {
    // Ignora regole disabilitate
    if (rule.enabled === false) continue;

    // Controlla scadenza opzionale
    if (rule.expiresAt) {
      const expDate = new Date(rule.expiresAt);
      if (!isNaN(expDate.getTime()) && expDate < now) {
        continue;
      }
    }

    // Controlla corrispondenza del percorso
    if (!matchesPathPattern(pathname, rule.path)) {
      continue;
    }

    // Se la regola richiede un token, verificalo
    if (rule.token && rule.token.trim()) {
      if (rule.token.trim() === tokenParam) {
        return { allowed: true, matchedRule: rule };
      }
      // Se il token è richiesto ma non corrisponde, non autorizzare da questa regola
      continue;
    }

    // Se non richiede token, il match di path è sufficiente
    return { allowed: true, matchedRule: rule };
  }

  return { allowed: false };
}

