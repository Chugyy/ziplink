/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      // Fallback: if no Next.js route matches, proxy to backend
      // This handles /{username}/{slug} short link redirects
      fallback: [
        {
          source: "/:username/:slug",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "https://api.ziplink.fr"}/:username/:slug`,
        },
      ],
    };
  },
};

export default nextConfig;
