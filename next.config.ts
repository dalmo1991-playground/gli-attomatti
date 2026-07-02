import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
