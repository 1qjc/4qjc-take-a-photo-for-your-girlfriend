/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/take-a-photo-for-your-girlfriend',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

}

export default nextConfig
