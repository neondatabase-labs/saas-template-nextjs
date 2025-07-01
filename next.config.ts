import TerserPlugin from "terser-webpack-plugin"
import { withVercelToolbar } from "@vercel/toolbar/plugins/next"

export default withVercelToolbar()({
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

	webpack: (config) => {
		config.optimization.minimizer = [
			new TerserPlugin({
				terserOptions: {
					keep_fnames: true, // Preserve function names (prevents SHA256 loss)
				},
			}),
		]
		return config
	},
})
