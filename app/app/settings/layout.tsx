export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<h1 className="text-3xl font-semibold mb-8">Settings</h1>
			<main>{children}</main>
		</div>
	)
}
