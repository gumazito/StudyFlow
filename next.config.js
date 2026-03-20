/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  // Strict mode helps catch issues early in development
  reactStrictMode: true,
  // Environment-aware settings
  env: {
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'development',
  },
  // Ignore TypeScript errors during build only in CI (remove for production)
  // typescript: { ignoreBuildErrors: process.env.CI === 'true' },
}
module.exports = nextConfig
