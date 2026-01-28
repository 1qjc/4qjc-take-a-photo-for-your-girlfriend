/** @type {import('next').NextConfig} */

const BLOG_URL = 'https://10qjc-rauch-blog-git-main-1qjcs-projects.vercel.app';

const nextConfig = {
  assetPrefix: "/take-a-photo-for-your-girlfriend-static",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // blog
      {
        source: "/:path(blog|blog/.*)",
        destination: `${BLOG_URL}/:path`,
      },
      {
        source: "/blog-static/_next/:path+",
        destination: `${BLOG_URL}/blog-static/_next/:path+`,
      },
    ];
  },
}



export default nextConfig
