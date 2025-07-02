import type React from "react"

import "./globals.css"
import { VercelToolbar } from "@vercel/toolbar/next"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const shouldInjectToolbar = process.env.ENABLE_VERCEL_TOOLBAR === "true"

	return (
		<html lang="en">
			<title>Neon Todo App</title>
			<meta
				name="description"
				content="A simple todo app built with Next.js, Drizzle ORM, and Neon Serverless"
			/>
			<body className="min-h-screen bg-background">
				{children}
				<Toaster />
			</body>
			{shouldInjectToolbar && <VercelToolbar />}
		</html>
	)
}
