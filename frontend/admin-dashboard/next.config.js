/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
    NEXT_PUBLIC_CHAT_WIDGET_URL: process.env.NEXT_PUBLIC_CHAT_WIDGET_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
