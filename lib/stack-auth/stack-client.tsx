"use client"

import { createContext, use, useCallback, type ReactNode, startTransition, useEffect } from "react"
import { useUser as baseUseUser, CurrentUser, User } from "@stackframe/stack"
import { z } from "zod"
import { useOptimistic } from "react"

const DISPLAY_NAME_MAX_LENGTH = 60
const DisplayNameSchema = z.string().max(DISPLAY_NAME_MAX_LENGTH)
function coerceDisplayName(name: string) {
	return DisplayNameSchema.parse(name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH))
}

type UserUpdateOptions = Parameters<CurrentUser["update"]>[0]
const CustomUserContext = createContext<
	| (Omit<User, "update" | "setDisplayName"> & {
			update: (updates: Partial<UserUpdateOptions>) => void
			contactChannels: Array<{
				id: string
				value: string
				type: "email"
				isPrimary: boolean
				isVerified: boolean
				usedForAuth: boolean
			}>
	  })
	| undefined // useUser is not within CustomUserProvider
>(undefined)

// StackAuth does not optimistically update anything when we modify the profile
// so the way to get best performance here is a custom UserProvider that sets our local state
// and then updates the StackAuth profile in the background
export function CustomUserProvider({ children }: { children: ReactNode }) {
	const baseUser = baseUseUser({ or: "redirect" })

	// we don't need to useOptimistic for contact channels here because they're only used in settings
	// so we can useOptimistic where we actually work with them
	const contactChannels = baseUser.useContactChannels()

	// We do useOptimistic here because we want to update the nav layout instantly
	// even when the user is modified in a specific component
	const [optimisticUser, setOptimisticUser] = useOptimistic(
		baseUser,
		(state, updates: Partial<UserUpdateOptions>) => {
			if (!state) return state
			return { ...state, ...updates }
		},
	)

	const update = useCallback(
		(updates: Partial<UserUpdateOptions>) => {
			if ("displayName" in updates) {
				updates.displayName = coerceDisplayName(
					updates.displayName?.trim() || baseUser?.primaryEmail || "(unknown)",
				)
			}

			startTransition(async () => {
				setOptimisticUser(updates)
				await baseUser?.update(updates)
			})
		},
		[baseUser, setOptimisticUser],
	)

	useEffect(() => {
		if (!baseUser) return
		// This can happen in several ways, and this will fix it when it does
		// 1. Someone manually changes display name in the StackAuth dashboard
		// 2. Someone maliciously sends a request to update their own display name
		// 3. Onboarding failed and no display name was set
		if (baseUser.displayName && !DisplayNameSchema.safeParse(baseUser.displayName).success) {
			update({ displayName: baseUser.displayName })
		}
	}, [baseUser, update])

	const customUser = {
		...optimisticUser,
		setDisplayName: undefined, // stop consumers from using this
		update,
		contactChannels: contactChannels ?? [],
	}

	return <CustomUserContext.Provider value={customUser}>{children}</CustomUserContext.Provider>
}

export function useRequiredUser() {
	const user = use(CustomUserContext)
	if (user === undefined) {
		throw new Error("useUser must be used within a CustomUserProvider")
	}
	return user
}
