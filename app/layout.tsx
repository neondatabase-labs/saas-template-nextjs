import type React from "react"

import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<title>Neon Todo App</title>
			<meta
				name="description"
				content="A simple todo app built with Next.js, Drizzle ORM, and Neon Serverless"
			/>
			<body className="min-h-screen bg-background">{children}</body>
		</html>
	)
}
