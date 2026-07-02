import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
