export type ImageAlign = "left" | "center" | "right" | "top" | "bottom" | string;

/**
 * Returns Tailwind object-position class based on alignment
 */
export function getImagePositionClass(align?: ImageAlign): string {
  if (!align) return "object-center";
  const a = String(align).toLowerCase().trim();
  if (a === "left" || a === "sinistra" || a === "object-left") return "object-left";
  if (a === "right" || a === "destra" || a === "object-right") return "object-right";
  if (a === "top" || a === "alto" || a === "object-top") return "object-top";
  if (a === "bottom" || a === "basso" || a === "object-bottom") return "object-bottom";
  return "object-center";
}

/**
 * Returns exact CSS object-position string to guarantee cross-browser anchor on mobile crops
 */
export function getImageObjectPositionStyle(align?: ImageAlign): string {
  if (!align) return "center center";
  const a = String(align).toLowerCase().trim();
  if (a === "left" || a === "sinistra" || a === "object-left") return "left center";
  if (a === "right" || a === "destra" || a === "object-right") return "right center";
  if (a === "top" || a === "alto" || a === "object-top") return "center top";
  if (a === "bottom" || a === "basso" || a === "object-bottom") return "center bottom";
  return "center center";
}
