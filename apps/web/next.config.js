/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@apnigully/shared', '@apnigully/ui'],
};

module.exports = nextConfig;
