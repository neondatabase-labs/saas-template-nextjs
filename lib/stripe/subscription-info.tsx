"use client"

import { createContext, useContext } from "react"

export type SubscriptionInfo = {
	planName: string
	todoLimit: number
}

const SubscriptionContext = createContext<SubscriptionInfo>({
	planName: "FREE",
	todoLimit: 100,
})

export function SubscriptionContextProvider({
	children,
	subscriptionInfo,
}: {
	children: React.ReactNode
	subscriptionInfo: SubscriptionInfo
}) {
	return (
		<SubscriptionContext.Provider value={subscriptionInfo}>{children}</SubscriptionContext.Provider>
	)
}

export function useSubscriptionInfo() {
	return useContext(SubscriptionContext)
}
