import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
        source: "/audio/silence.wav",
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
