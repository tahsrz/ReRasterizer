import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true
  },
  outputFileTracingRoot: path.join(process.cwd())
};

export default nextConfig;
