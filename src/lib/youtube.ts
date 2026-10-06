/**
 * YouTube Utility Helper
 * Riconosce e gestisce in modo trasparente link e ID video di YouTube per thumbnail ed embed.
 */

const YOUTUBE_REGEX =
  /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

const PURE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Verifica se una stringa è un URL YouTube valido o un ID YouTube a 11 caratteri.
 */
export function isYouTubeUrl(urlOrId?: string | null): boolean {
  if (!urlOrId || typeof urlOrId !== "string") return false;
  const trimmed = urlOrId.trim();
  if (!trimmed) return false;
  return YOUTUBE_REGEX.test(trimmed) || PURE_ID_REGEX.test(trimmed);
}

/**
 * Estrae il Video ID di 11 caratteri da qualsiasi formato URL di YouTube (o ID puro).
 */
export function getYouTubeVideoId(urlOrId?: string | null): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  const match = trimmed.match(YOUTUBE_REGEX);
  if (match && match[1]) {
    return match[1];
  }

  if (PURE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Restituisce l'URL della thumbnail ufficiale di YouTube ad alta risoluzione.
 * In fallback a hqdefault.jpg se non specificato.
 */
export function getYouTubeThumbnailUrl(
  urlOrId?: string | null,
  quality: "hq" | "max" = "hq"
): string {
  const id = getYouTubeVideoId(urlOrId);
  if (!id) return "/images/1782553290530-TheaterCurtain.webp";
  // hqdefault è sempre disponibile per tutti i video YouTube
  const filename = quality === "max" ? "maxresdefault.jpg" : "hqdefault.jpg";
  return `https://img.youtube.com/vi/${id}/${filename}`;
}

/**
 * Restituisce l'URL di embed YouTube con la modalità privacy-friendly (youtube-nocookie.com).
 */
export function getYouTubeEmbedUrl(
  urlOrId?: string | null,
  options: { autoplay?: boolean; mute?: boolean } = {}
): string {
  const id = getYouTubeVideoId(urlOrId);
  if (!id) return "";

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (options.autoplay) {
    params.set("autoplay", "1");
  }
  if (options.mute) {
    params.set("mute", "1");
  }

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Helper universale: restituisce la thumbnail se la risorsa è un video YouTube,
 * altrimenti restituisce l'URL dell'immagine locale/remota fornita.
 */
export function getMediaDisplayUrl(url?: string | null, fallback?: string): string {
  if (!url || !url.trim()) {
    return fallback || "/images/1782553290530-TheaterCurtain.webp";
  }
  if (isYouTubeUrl(url)) {
    return getYouTubeThumbnailUrl(url);
  }
  return url.trim();
}
