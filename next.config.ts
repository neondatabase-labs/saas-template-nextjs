import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    useCache: true
  },
	images: {
		remotePatterns: [
			{
				hostname: "lh3.googleusercontent.com",
			},
			{
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
}

export default nextConfig
