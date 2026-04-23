/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      // Fallback: if no Next.js route matches, proxy to backend
      // This handles /{slug} short link redirects
      fallback: [
        {
          source: "/:slug",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "https://api.ziplink.fr"}/:slug`,
        },
      ],
    };
  },
};

export default nextConfig;
