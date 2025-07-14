import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // GitHub Pages serves from a subdirectory
  basePath: process.env.NODE_ENV === 'production' ? '/desafiados' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/desafiados/' : '',
};

export default nextConfig;
