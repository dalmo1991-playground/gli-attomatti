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
    ...(content?.ticketing_hub?.active !== false
      ? [
          {
            url: `${BASE_URL}/Biglietti`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
          },
        ]
      : []),
    ...(content?.registration_hub?.active !== false
      ? [
          {
            url: `${BASE_URL}/Registrazioni`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          },
        ]
      : []),
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
      url: `${BASE_URL}/Chi_Siamo/Blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/Contatti`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/Impressum`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/Privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/Termini`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
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

  // Dynamic standalone ticketing pages: /Biglietti/[slug]
  const ticketingPages: { slug: string; active?: boolean }[] =
    content?.ticketing_pages ?? [];
  const ticketingRoutes: MetadataRoute.Sitemap = ticketingPages
    .filter((page) => page.active === true && page.slug)
    .map((page) => ({
      url: `${BASE_URL}/Biglietti/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Dynamic standalone registration pages: /Registrazioni/[slug]
  const registrationPages: { slug: string; active?: boolean }[] =
    content?.registration_pages ?? [];
  const registrationRoutes: MetadataRoute.Sitemap = registrationPages
    .filter((page) => page.active === true && page.slug)
    .map((page) => ({
      url: `${BASE_URL}/Registrazioni/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Dynamic blog articles: /Chi_Siamo/Blog/[slug]
  const blogArticles: { slug: string; visible?: boolean }[] =
    content?.pages?.blog?.articles ?? [];
  const blogRoutes: MetadataRoute.Sitemap = blogArticles
    .filter((a) => a.visible !== false && a.slug)
    .map((a) => ({
      url: `${BASE_URL}/Chi_Siamo/Blog/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...showRoutes,
    ...iniziativeRoutes,
    ...landingRoutes,
    ...ticketingRoutes,
    ...registrationRoutes,
    ...blogRoutes,
  ];
}
