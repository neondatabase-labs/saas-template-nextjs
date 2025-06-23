"use client"

import { useState } from "react"
import { Check, User } from "lucide-react"
import type { User as UserType } from "@/lib/db/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import { UserAvatar } from "./user-avatar"

export function UserSelector({
	users,
	selectedUserId,
	onSelectUser,
	triggerClassName,
}: {
	users: UserType[]
	selectedUserId: string | null
	onSelectUser: (userId: string | null) => void
	triggerClassName?: string
}) {
	const [open, setOpen] = useState(false)

	const selectedUser = users.find((u) => u.id === selectedUserId)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" aria-expanded={open} className={triggerClassName}>
					{selectedUser ? (
						<UserAvatar
							user={{
								name: selectedUser.name,
								avatarUrl: (selectedUser.rawJson as { avatarUrl: string })?.avatarUrl,
							}}
							showName
							className="mr-2"
						/>
					) : (
						<>
							<User className="h-4 w-4 mr-2" />
							<span>Assign User</span>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search users..." />
					<CommandList>
						<CommandEmpty>No users found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={() => {
									onSelectUser(null)
									setOpen(false)
								}}
							>
								<div className="flex items-center gap-2 w-full">
									<span>Unassigned</span>
									{selectedUserId === null && <Check className="h-4 w-4 ml-auto" />}
								</div>
							</CommandItem>
						</CommandGroup>

						{users.length > 0 && (
							<CommandGroup heading="Users">
								{users.map((user) => (
									<CommandItem
										key={user.id}
										onSelect={() => {
											onSelectUser(user.id)
											setOpen(false)
										}}
									>
										<div className="flex items-center gap-2 w-full">
											<UserAvatar
												user={{
													name: user.name,
													avatarUrl: (user.rawJson as { avatarUrl: string })?.avatarUrl,
												}}
												showName
											/>
											{user.id === selectedUserId && <Check className="h-4 w-4 ml-auto" />}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
