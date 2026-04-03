/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_CHAT_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
    NEXT_PUBLIC_AGENT_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  },
};
module.exports = nextConfig;
