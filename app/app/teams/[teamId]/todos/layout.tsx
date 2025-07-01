export default async function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<h1 className="text-2xl font-semibold mb-8">Deadlines</h1>
			<main>{children}</main>
		</div>
	)
}
