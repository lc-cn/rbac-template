import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma / LibSQL 含原生与 runtime 依赖，勿打进 Turbopack 服务端 chunk，否则构建期 collect page data 易出现 externalRequire 失败（如 /api/.../[id]）
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
};

export default nextConfig;
