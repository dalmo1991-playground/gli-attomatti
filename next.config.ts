import type { NextConfig } from "next";

const isDev =
  process.env.NODE_ENV !== "production" ||
  process.env.VERCEL_ENV === "preview" ||
  process.env.VERCEL_GIT_COMMIT_REF === "dev" ||
  process.env.GITHUB_BRANCH === "dev";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_IS_DEV_SITE: String(isDev),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:file(.+\\.(?:svg|png|jpg|jpeg|webp|ico|woff2))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://eventfrog.ch https://www.instagram.com https://tally.so https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
  /* config options here */
  /* Important - the url https://gliattomatti.ch/Saalvermietung is used behind many printed QR codes - do not kill it */
  async redirects() {
    return [
      {
        source: '/Saalvermietung',
        destination: 'https://tally.so/r/LZaPOz',
        permanent: false,
      },
      {
        source: '/saalvermietung',
        destination: 'https://tally.so/r/LZaPOz',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
