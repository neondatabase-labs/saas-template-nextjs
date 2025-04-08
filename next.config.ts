import type { NextConfig } from "next"
import TerserPlugin from "terser-webpack-plugin"

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	
	experimental: {
		useCache: true,
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

	async redirects() {
		return [
			{
				source: "/app",
				destination: "/app/todos",
				permanent: false,
			},
		]
	},

	webpack: (config) => {
		config.optimization.minimizer = [
			new TerserPlugin({
					terserOptions: {
							keep_fnames: true, // Preserve function names (prevents SHA256 loss)
					}
			})
		]
		return config
	},
}

export default nextConfig
