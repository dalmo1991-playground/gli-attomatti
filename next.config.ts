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
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: '/api/version',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
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
        source: '/:path*(.+\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff2|woff|ttf|mp4|webm))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/((?!api|_next|admin).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400',
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
