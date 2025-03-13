"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/lib/schema"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: User
  className?: string
  showName?: boolean
  onClick?: () => void
}

export function UserAvatar({ user, className, showName = false, onClick }: UserAvatarProps) {
  // Get initials from name
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className={cn("flex items-center gap-2", className, onClick && "cursor-pointer")} onClick={onClick}>
      <Avatar className="h-6 w-6">
        <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {showName && <span className="text-xs font-medium">{user.name}</span>}
    </div>
  )
}

