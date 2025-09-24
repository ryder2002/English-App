/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // Your Next.js config
};

module.exports = withPWA(nextConfig);
