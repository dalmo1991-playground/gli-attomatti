import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/data';

const BASE_URL = process.env.SITE_URL || 'https://gliattomatti.ch';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  const shows: { slug: string; visible?: boolean }[] =
    content?.pages?.spettacoli?.archive_sections ?? [];

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/Spettacoli`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/Chi_Siamo`,
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

  // Dynamic show pages
  const showRoutes: MetadataRoute.Sitemap = shows
    .filter((show) => show.visible !== false && show.slug)
    .map((show) => ({
      url: `${BASE_URL}/Spettacoli/${show.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  return [...staticRoutes, ...showRoutes];
}
