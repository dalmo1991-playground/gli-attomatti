/**
 * Utilities for managing and resolving section anchor IDs in Landing Pages.
 */

export function getDefaultBlockAnchor(type: string): string {
  switch (type) {
    case "hero":
      return "hero";
    case "event_details":
      return "dettagli";
    case "eventfrog":
      return "biglietti";
    case "tally":
      return "registrazione";
    case "synopsis":
      return "trama";
    case "gallery":
      return "galleria";
    case "reviews":
      return "recensioni";
    case "faq":
      return "faq";
    case "closing_cta":
      return "prenota";
    default:
      return "sezione";
  }
}

/**
 * Normalizes user input into a clean, valid URL anchor ID.
 * Strips leading hash and non-alphanumeric chars (except dash and underscore).
 */
export function sanitizeAnchor(anchor?: string): string {
  if (!anchor || typeof anchor !== "string") return "";
  return anchor
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Returns the effective anchor ID for a block, prioritizing custom anchor over type default.
 */
export function getBlockAnchor(block: any, defaultType?: string): string {
  const custom = sanitizeAnchor(block?.anchor);
  if (custom) return custom;
  return getDefaultBlockAnchor(block?.type || defaultType || "");
}

/**
 * Extracts all unique available anchors from a landing page's blocks.
 */
export function getAllLandingAnchors(landing: any): { anchor: string; label: string; type: string }[] {
  if (!landing?.blocks || !Array.isArray(landing.blocks)) return [];
  const seen = new Set<string>();
  const list: { anchor: string; label: string; type: string }[] = [];

  landing.blocks.forEach((block: any, idx: number) => {
    let anchor = getBlockAnchor(block);
    if (!anchor) return;

    if (seen.has(anchor)) {
      anchor = `${anchor}-${idx + 1}`;
    }
    seen.add(anchor);

    let label = block.title || block.badge;
    if (!label) {
      switch (block.type) {
        case "hero":
          label = "Hero";
          break;
        case "event_details":
          label = "Dettagli";
          break;
        case "eventfrog":
          label = "Biglietti";
          break;
        case "tally":
          label = "Registrazione";
          break;
        case "synopsis":
          label = "Trama";
          break;
        case "gallery":
          label = "Galleria";
          break;
        case "reviews":
          label = "Recensioni";
          break;
        case "faq":
          label = "FAQ";
          break;
        case "closing_cta":
          label = "Banner Finale";
          break;
        default:
          label = `Blocco #${idx + 1}`;
      }
    }

    list.push({ anchor, label, type: block.type });
  });

  return list;
}
