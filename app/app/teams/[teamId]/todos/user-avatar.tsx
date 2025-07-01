"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function UserAvatar({
	user,
	className,
	showName = false,
	onClick,
}: {
	user: {
		name: string | null
		avatarUrl: string | null
	}
	className?: string
	showName?: boolean
	onClick?: () => void
}) {
	// Get initials from name
	const initials = user?.name
		? user.name
				.split(" ")
				.map((part) => part[0])
				.join("")
				.toUpperCase()
				.substring(0, 2)
		: "??"

	const avatarUrl = user.avatarUrl

	return (
		<div
			className={cn("flex items-center gap-2", className, onClick && "cursor-pointer")}
			onClick={onClick}
		>
			<Avatar className="h-6 w-6">
				<AvatarImage src={avatarUrl || ""} alt={user.name || ""} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			{showName && <span className="text-xs font-medium">{user.name}</span>}
		</div>
	)
}
