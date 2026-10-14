import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop `next dev` from generating an AGENTS.md in the project root.
  agentRules: false,
  experimental: {
    serverActions: {
      // A report carries up to three photos, each downscaled in the browser
      // to under 1 MB. Stays below Vercel's 4.5 MB request limit.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
