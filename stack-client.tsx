"use client"

import { createContext, use, useCallback, ReactNode, startTransition, useEffect } from "react"
import { useUser as baseUseUser, CurrentUser, User } from "@stackframe/stack"
import { invariant } from "@epic-web/invariant"
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
	  })
	| null
	| undefined
>(undefined)

// StackAuth does not optimistically update anything when we modify the profile
// so the way to get best performance here is a custom UserProvider that sets our local state
// and then updates the StackAuth profile in the background
export function CustomUserProvider({ children }: { children: ReactNode }) {
	const baseUser = baseUseUser()

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

	const customUser = optimisticUser
		? {
				...optimisticUser,
				setDisplayName: undefined, // stop consumers from using this
				update,
			}
		: null

	return <CustomUserContext.Provider value={customUser}>{children}</CustomUserContext.Provider>
}

export function useUser() {
	const customUser = use(CustomUserContext)
	invariant(customUser, "useUser must be used within a CustomStackProvider")

	return customUser
}
