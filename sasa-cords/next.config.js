/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
}

module.exports = nextConfig