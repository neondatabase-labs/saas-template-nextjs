"use client"

import { createContext, use, useState, useCallback, ReactNode, useEffect } from "react"
import { useUser as baseUseUser, User } from "@stackframe/stack"
import { invariant } from "@epic-web/invariant"
import { z } from "zod"

const DISPLAY_NAME_MAX_LENGTH = 60
const DisplayNameSchema = z.string().max(DISPLAY_NAME_MAX_LENGTH)
function coerceDisplayName(name: string) {
	return DisplayNameSchema.parse(name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH))
}

const CustomUserContext = createContext<
	| (Omit<User, "setDisplayName"> & {
			setDisplayName: (name: string) => void
	  })
	| null // null if not authenticated
	| undefined // undefined if not within the Context Provider
>(undefined)

// StackAuth does not optimistically update anything when we modify the profile
// so the way to get best performance here is a custom UserProvider that sets our local state
// and then updates the StackAuth profile in the background
export function CustomUserProvider({ children }: { children: ReactNode }) {
	const baseUser = baseUseUser()

	// TODO: maybe just useOptimistic here?
	const [prevDisplayName, setPrevDisplayName] = useState(baseUser?.displayName)
	const [localDisplayName, setLocalDisplayName] = useState(baseUser?.displayName)
	if (prevDisplayName !== baseUser?.displayName) {
		setPrevDisplayName(baseUser?.displayName)
		setLocalDisplayName(baseUser?.displayName)
	}

	// TODO: either add React Compiler and remove useCallback
	// or memoize the rest
	const setDisplayName = useCallback(
		(inputName: string) => {
			const name = coerceDisplayName(inputName.trim() || baseUser?.primaryEmail || "(unknown)")

			setLocalDisplayName(name)
			void baseUser?.setDisplayName(name)
		},
		[baseUser],
	)

	useEffect(() => {
		if (!baseUser) return
		// This can happen in several ways, and this will fix it when it does
		// 1. Someone manually changes display name in the StackAuth dashboard
		// 2. Someone maliciously sends a request to update their own display name
		// 3. Onboarding failed and no display name was set
		if (prevDisplayName && !DisplayNameSchema.safeParse(prevDisplayName).success) {
			setDisplayName(prevDisplayName)
		}
	}, [baseUser, prevDisplayName, setDisplayName])

	const customUser = baseUser
		? {
				...baseUser,
				displayName: localDisplayName ?? baseUser.primaryEmail,
				setDisplayName,
			}
		: null

	return <CustomUserContext.Provider value={customUser}>{children}</CustomUserContext.Provider>
}

export function useUser() {
	const customUser = use(CustomUserContext)
	invariant(customUser, "useUser must be used within a CustomStackProvider")

	return customUser
}
