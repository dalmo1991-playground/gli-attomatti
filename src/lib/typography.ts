/**
 * Utility functions for adaptive fluid typography.
 * Scales font sizes responsively based on both screen size (Tailwind breakpoints)
 * and content length (character count) to ensure harmonious layouts without overflow.
 */

export function getHeroTitleSizeClass(title?: string): string {
  const length = title?.trim().length || 0;

  // Very short title (e.g. <= 16 chars: "AMLETO", "GLI ATTOMATTI")
  if (length <= 16) {
    return "text-5xl sm:text-6xl md:text-7xl lg:text-8xl";
  }

  // Short/medium title (e.g. 17-26 chars: "NON SOTTOVALUTARE I 40")
  if (length <= 26) {
    return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl";
  }

  // Medium title (e.g. 27-42 chars: "L'IMPORTANZA DI CHIAMARSI ERNESTO")
  if (length <= 42) {
    return "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";
  }

  // Long title (e.g. 43-60 chars)
  if (length <= 60) {
    return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl";
  }

  // Very long title (> 60 chars)
  return "text-xl sm:text-2xl md:text-3xl lg:text-4xl";
}

export function getPageHeroTitleSizeClass(title?: string): string {
  const length = title?.trim().length || 0;

  if (length <= 20) {
    return "text-4xl sm:text-6xl md:text-7xl lg:text-8xl";
  }
  if (length <= 35) {
    return "text-3xl sm:text-5xl md:text-6xl lg:text-7xl";
  }
  if (length <= 50) {
    return "text-2xl sm:text-4xl md:text-5xl lg:text-6xl";
  }
  return "text-xl sm:text-3xl md:text-4xl lg:text-5xl";
}

export function getTaglineSizeClass(tagline?: string): string {
  const length = tagline?.trim().length || 0;

  if (length <= 45) {
    return "text-base sm:text-lg md:text-xl";
  }
  if (length <= 80) {
    return "text-sm sm:text-base md:text-lg";
  }
  return "text-xs sm:text-sm md:text-base";
}

export function getCardTitleSizeClass(title?: string): string {
  const length = title?.trim().length || 0;

  if (length <= 25) {
    return "text-2xl sm:text-3xl md:text-4xl";
  }
  if (length <= 45) {
    return "text-xl sm:text-2xl md:text-3xl";
  }
  return "text-lg sm:text-xl md:text-2xl";
}
