
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // add your own strategies to the existing ones
  // fallbacks: {
  //   document: "/~offline",
  // },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'https://6000-firebase-studio-1758209928865.cluster-bqwaigqtxbeautecnatk4o6ynk.cloudworkstations.dev',
  ],
  serverExternalPackages: [
    '@genkit-ai/googleai',
    'genkit',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
