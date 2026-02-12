const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'apnigully-uploads.s3.amazonaws.com'],
  },
  transpilePackages: ['@apnigully/shared', '@apnigully/ui'],
};

module.exports = withPWA(nextConfig);
