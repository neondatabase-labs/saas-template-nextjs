import Link from "next/link"
import { Input } from "@/components/ui/input"

const settingsNavItems = [
	{
		title: "User",
		items: [
			{ href: "/app/settings/user/general", label: "General" },
			{ href: "/app/settings/user/billing", label: "Billing" },
			{ href: "/app/settings/user/account", label: "Account" },
		],
	},
]

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto max-w-7xl px-4 py-8">
			<h1 className="text-3xl font-semibold mb-8">Settings</h1>

			<div className="flex gap-8">
				<aside className="w-64 flex-shrink-0">
					<div className="mb-6">
						<Input type="search" placeholder="Search..." className="w-full" />
					</div>

					<nav className="space-y-8">
						{settingsNavItems.map((section) => (
							<div key={section.title}>
								<div className="flex items-center gap-2 mb-2">
									<span className="text-sm font-medium text-muted-foreground">{section.title}</span>
								</div>
								<ul className="space-y-1">
									{section.items.map((item) => (
										<li key={item.href}>
											<Link
												href={item.href}
												className="block px-2 py-1 text-sm rounded-md hover:bg-secondary"
											>
												{item.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</nav>
				</aside>

				<main className="flex-1">{children}</main>
			</div>
		</div>
	)
}
