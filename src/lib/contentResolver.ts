import { defaultText } from "./utils";

/**
 * Risolve una proprietà testuale applicando la gerarchia rigorosa a 3 livelli:
 * - Priorità 1 (slugItemVal): Valore specifico dell'elemento slug (es. `location.steps_heading`).
 *   - Se `=== null` -> soppressione esplicita, ritorna `null` (l'elemento non viene mostrato).
 *   - Se stringa non vuota -> valore utilizzato.
 *   - Se `undefined` o `""` -> passa a Priorità 2.
 * - Priorità 2 (defaultVal): Valore di default configurato per la tipologia/sezione (es. `pages.locations.steps_heading`).
 *   - Se `=== null` -> soppressione esplicita, ritorna `null`.
 *   - Se stringa non vuota -> valore utilizzato.
 *   - Se `undefined` o `""` -> passa a Priorità 3.
 * - Priorità 3 (hardcodedFallback): Stringa statica di fallback nel codice.
 *   - Raggiunta SOLO se né Prio 1 né Prio 2 hanno fornito un valore o un `null`.
 */
export function resolveSlugText(
  slugItemVal: any,
  defaultVal?: any,
  hardcodedFallback?: string
): string | null {
  return defaultText(slugItemVal, defaultVal, hardcodedFallback);
}

/**
 * Crea un helper con scoping per un elemento e un oggetto default specifici,
 * utile per pagine slug con molte proprietà da risolvere.
 */
export function createSlugResolver(
  item: Record<string, any> | null | undefined,
  defaults: Record<string, any> | null | undefined
) {
  return function resolve(
    itemKey: string,
    defaultKey?: string,
    hardcodedFallback?: string
  ): string | null {
    const itemVal = item ? item[itemKey] : undefined;
    const defKey = defaultKey || itemKey;
    const defVal = defaults ? defaults[defKey] : undefined;
    return defaultText(itemVal, defVal, hardcodedFallback);
  };
}
