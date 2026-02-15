/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@apnigully/shared', '@apnigully/ui'],
};

module.exports = nextConfig;
