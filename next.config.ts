import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '192.168.0.7',
    '192.168.0.26',
    '192.168.29.79',
    'localhost',
    '127.0.0.1',
    '[::1]'
  ],
};

export default nextConfig;
