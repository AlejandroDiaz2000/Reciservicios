import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Prisma Client y bcryptjs (dependencias nativas/Node) se empaqueten
  // en el bundle de servidor; deben ejecutarse como módulos externos de Node.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
