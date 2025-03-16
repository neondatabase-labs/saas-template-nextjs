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
import { useUser } from "@/stack-client"

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
	// const user = await stackServerApp.getUser()
	// const app = stackServerApp.urls
	// const userProfile = await getUserDetails(user?.id)
	const user = useUser()

	return (
		<div>
			<header className="w-full flex justify-between items-center px-6 py-4 z-10">
				<div className="font-bold text-lg uppercase tracking-tight">
					<Link href="/app"> Neon Auth NextJS Stripe Template </Link>
				</div>
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
								{/* <Link href={app.signOut} className="flex items-center gap-2">
									<LogOut className="h-4 w-4" />
									Sign Out
								</Link> */}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<div className="flex items-center gap-3">
						{/* <Link
							href={app.signIn}
							className="inline-flex h-8 items-center justify-center rounded-md px-4 text-[13px] font-medium text-gray-700 transition-all hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Log In
						</Link>
						<Link
							href={app.signUp}
							className="inline-flex h-8 items-center justify-center font-medium  text-center rounded-full outline-hidden   dark:text-black bg-primary-1 hover:bg-[#00e5bf] whitespace-nowrap px-6 text-[13px] transition-colors duration-200"
						>
							Sign Up
						</Link> */}
					</div>
				)}
			</header>

			{children}
		</div>
	)
}
