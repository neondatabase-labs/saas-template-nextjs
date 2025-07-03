"use client"

import Link from "next/link"
import Image from "next/image"
import { Settings } from "lucide-react"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRequiredUser } from "@/lib/stack-auth/stack-client"
import { useStackApp } from "@stackframe/stack"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { TeamSwitcher } from "@/components/team-switcher"

const navItems: { label: string; href: string }[] = []

export function AppLayoutClient({
	children,
	teams,
	selectedTeam,
}: {
	children: React.ReactNode
	teams: Array<{
		id: string
		displayName: string
		profileImageUrl: string | null
	}>
	selectedTeam: {
		id: string
		displayName: string
		profileImageUrl: string | null
	}
}) {
	const user = useRequiredUser()
	const app = useStackApp()
	const pathname = usePathname()

	return (
		<div>
			<header className="w-full flex gap-x-2 items-center px-4 py-2 z-10 border-b border-gray-200">
				<div className="font-bold text-lg uppercase tracking-tight">
					<Link href="/app"> Neon Stripe </Link>
				</div>

				{user && <TeamSwitcher teams={teams} selectedTeam={selectedTeam} />}

				{navItems.map((item) => (
					<Button
						key={item.href}
						variant="ghost"
						asChild
						className={cn(pathname === item.href && "bg-gray-100")}
					>
						<Link href={item.href}>{item.label}</Link>
					</Button>
				))}

				<div className="grow" />
				{user ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center gap-2">
								{user.displayName && (
									<span className="text-[14px] text-gray-600 dark:text-gray-300">
										{user.displayName}
									</span>
								)}
								{user.profileImageUrl && (
									<Image
										src={user.profileImageUrl}
										alt="User avatar"
										width={32}
										height={32}
										className="rounded-full"
									/>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center">
							<DropdownMenuItem asChild>
								<Link href="/app/settings" className="flex items-center gap-2">
									<Settings className="h-4 w-4" />
									Settings
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href={app.urls.signOut} className="flex items-center gap-2">
									Sign Out
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<div className="flex items-center gap-3">
						<Link
							href={app.urls.signIn}
							className="inline-flex h-8 items-center justify-center rounded-md px-4 text-[13px] font-medium text-gray-700 transition-all hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Log In
						</Link>
						<Link
							href={app.urls.signUp}
							className="inline-flex h-8 items-center justify-center font-medium  text-center rounded-full outline-hidden   dark:text-black bg-primary-1 hover:bg-[#00e5bf] whitespace-nowrap px-6 text-[13px] transition-colors duration-200"
						>
							Sign Up
						</Link>
					</div>
				)}
			</header>

			{children}
		</div>
	)
}
