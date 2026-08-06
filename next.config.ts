import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit", "unpdf", "mammoth"],
};

export default nextConfig;
