import { stackServerApp } from "@/stack"
import { getUserSubscriptionPlan, getStripeCustomer, STRIPE_SUB_CACHE } from "@/lib/stripe"
import { BillingSettingsPageClient } from "./page-client"
import { kv } from "@vercel/kv"

export default async function BillingSettingsPage() {
	const user = await stackServerApp.getUser({ or: "redirect" })

	const subscriptionPlan = await getUserSubscriptionPlan(user?.id)
	const customerId = await getStripeCustomer(user.id)

	let subscriptionData: STRIPE_SUB_CACHE = { status: "none" }
	if (customerId) {
		const data = await kv.get(`stripe:customer:${customerId.id}`)
		if (data && typeof data === "object" && "status" in data && data.status !== "none") {
			subscriptionData = data as STRIPE_SUB_CACHE
		}
	}

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			<BillingSettingsPageClient
				subscriptionPlan={subscriptionPlan}
				subscriptionData={subscriptionData}
			/>
		</div>
	)
}
