/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Development cross-origin request allowance
  allowedDevOrigins: [
    '3000-firebase-anujingit-1758685821668.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev',
  ],
  // GitHub Pages deployment
  basePath: process.env.NODE_ENV === 'production' ? '/Anujin' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Anujin/' : '',
};

module.exports = nextConfig;
