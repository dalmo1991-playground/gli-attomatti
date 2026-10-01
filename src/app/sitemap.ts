import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/data';

const BASE_URL = process.env.SITE_URL || 'https://gliattomatti.ch';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();

  // Static routes available on dev
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/Spettacoli`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/Iniziative`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/Chi_Siamo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/Chi_Siamo/Attori`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/Chi_Siamo/Parlano_di_noi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/Contatti`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Dynamic show pages: /Spettacoli/[slug]
  const shows: { slug: string; visible?: boolean }[] =
    content?.pages?.spettacoli?.archive_sections ?? [];
  const showRoutes: MetadataRoute.Sitemap = shows
    .filter((show) => show.visible !== false && show.slug)
    .map((show) => ({
      url: `${BASE_URL}/Spettacoli/${show.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  // Dynamic initiative pages: /Iniziative/[slug]
  const iniziative: { slug: string; visible?: boolean }[] =
    content?.pages?.iniziative?.archive_sections ?? [];
  const iniziativeRoutes: MetadataRoute.Sitemap = iniziative
    .filter((item) => item.visible !== false && item.slug)
    .map((item) => ({
      url: `${BASE_URL}/Iniziative/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  // Dynamic landing pages: /landing/[slug]
  const landings: { slug: string; visible?: boolean }[] = content?.landings ?? [];
  const landingRoutes: MetadataRoute.Sitemap = landings
    .filter((landing) => landing.visible !== false && landing.slug)
    .map((landing) => ({
      url: `${BASE_URL}/landing/${landing.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    ...staticRoutes,
    ...showRoutes,
    ...iniziativeRoutes,
    ...landingRoutes,
  ];
}
