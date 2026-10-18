/**
 * Helper to determine if the newsletter registration path is defined and active in content.json
 */
export function isNewsletterActive(content: any): boolean {
  if (!content) return false;
  const pages: any[] = content?.registration_pages || [];
  const page = pages.find((p: any) => p && p.slug === "newsletter");
  return Boolean(page && page.active !== false && page.tally_url?.trim());
}

export const NEWSLETTER_PATH = "/Registrazioni/newsletter";
