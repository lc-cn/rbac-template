import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  async redirects() {
    return [
      { source: "/oauth2-clients", destination: "/applications", permanent: false },
      { source: "/oauth2-clients/new", destination: "/applications", permanent: false },
      { source: "/oauth2-clients/:id/edit", destination: "/applications/:id/idp", permanent: false },
    ];
  },
};

export default nextConfig;
