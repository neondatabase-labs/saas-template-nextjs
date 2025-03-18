import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { getUserSubscriptionPlan, getStripeCustomer, STRIPE_SUB_CACHE } from "@/lib/stripe"
import { kv } from "@vercel/kv"
import { SettingsPageClient } from "./page-client"
import { verifyContactChannel } from "./actions"

export default async function SettingsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await searchParamsPromise
	const user = await stackServerApp.getUser({ or: "redirect" })

	// Handle contact channel verification
	if (searchParams.code && !Array.isArray(searchParams.code)) {
		await verifyContactChannel({ code: searchParams.code })
		redirect("/app/settings")
	}

	// Get billing data
	const subscriptionPlan = await getUserSubscriptionPlan(user?.id)
	const customerId = await getStripeCustomer(user.id)

	let subscriptionData: STRIPE_SUB_CACHE = { status: "none" }
	if (customerId) {
		const data = await kv.get(`stripe:customer:${customerId.id}`)
		if (data && typeof data === "object" && "status" in data && data.status !== "none") {
			subscriptionData = data as STRIPE_SUB_CACHE
		}
	}

	// Get contact channels
	const contactChannels = await user?.listContactChannels()

	return (
		<SettingsPageClient
			subscriptionPlan={subscriptionPlan}
			subscriptionData={subscriptionData}
			contactChannels={
				contactChannels?.map((channel) => ({
					id: channel.id,
					value: channel.value,
					type: channel.type,
					isPrimary: channel.isPrimary,
					isVerified: channel.isVerified,
					usedForAuth: channel.usedForAuth,
				})) ?? []
			}
		/>
	)
}
