/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
  experimental: { optimizePackageImports: ["zod", "framer-motion", "d3-geo", "topojson-client"] },
};
export default nextConfig;
