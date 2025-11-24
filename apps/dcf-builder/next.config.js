/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ai-ventures/ui",
    "@ai-ventures/ai-sdk",
    "@ai-ventures/auth",
    "@ai-ventures/database",
  ],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
