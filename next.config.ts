import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "172.26.240.1",
    "localhost:3000",
    "localhost:3005",
    "127.0.0.1",
    "127.0.0.1:3005",
  ],
};

export default nextConfig;
