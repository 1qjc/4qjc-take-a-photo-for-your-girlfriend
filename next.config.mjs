/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/take-a-photo-for-your-girlfriend-static",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

}

export default nextConfig
