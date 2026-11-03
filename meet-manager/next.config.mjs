/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/meet-manager",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
