import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.10.232:3000", // adicione o(s) IP(s) que você usa na rede
  ],
};

export default nextConfig;
