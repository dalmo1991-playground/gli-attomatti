const contentPath = require('path').join(process.cwd(), 'src/data/content.json');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://gliattomatti.ch',
  generateRobotsTxt: true,
  generateIndexSitemap: false, // small site – single sitemap is enough
  changefreq: 'weekly',
  priority: 0.7,
  autoLastmod: true,

  // Exclude admin routes and API endpoints from the sitemap
  exclude: ['/admin', '/admin/*', '/api/*'],

  // Dynamically add show detail pages from content.json
  additionalPaths: async (config) => {
    const content = require(contentPath);
    const shows = content?.pages?.spettacoli?.archive_sections ?? [];

    const showPaths = shows
      .filter((show) => show.visible !== false && show.slug)
      .map((show) =>
        config.transform(config, `/Spettacoli/${show.slug}`)
      );

    return Promise.all(showPaths);
  },

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
  },
};
