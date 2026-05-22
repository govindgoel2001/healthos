/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@meteor/db", "@meteor/agent", "@meteor/shared", "@meteor/mcp-client"],
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
  webpack: (config) => {
    // Workspace packages are ESM TypeScript: relative imports carry a `.js`
    // extension that must resolve to the `.ts` source.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
