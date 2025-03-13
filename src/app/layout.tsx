import type React from "react"
import "./globals.css"

export const metadata = {
	title: "Todo App with Drizzle and Neon",
	description: "A simple todo app built with Next.js, Drizzle ORM, and Neon Serverless",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<main className="min-h-screen bg-background">{children}</main>
			</body>
		</html>
	)
}
