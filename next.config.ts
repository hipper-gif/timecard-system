import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "mariadb", "@prisma/adapter-mariadb"],
};

export default nextConfig;
