import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
			<div className="max-w-2xl text-center space-y-4">
				<h1 className="text-4xl font-bold tracking-tight">Neon Auth NextJS Stripe Template</h1>
				<p className="text-muted-foreground text-lg">
					A complete starter template featuring Neon, Stack Auth, and Stripe integration with React
					19 and Next.js 15+
				</p>
			</div>

			<Button asChild type="button" size="lg">
				<Link href="/app">Go to Dashboard</Link>
			</Button>
		</div>
	)
}
