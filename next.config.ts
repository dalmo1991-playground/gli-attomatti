import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://eventfrog.ch https://www.instagram.com https://tally.so;",
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
