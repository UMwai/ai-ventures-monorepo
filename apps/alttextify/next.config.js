/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ai-ventures/ui",
    "@ai-ventures/ai-sdk",
    "@ai-ventures/auth",
    "@ai-ventures/database",
    "@ai-ventures/shared-types",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
