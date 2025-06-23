import { getStripeCustomer } from "@/lib/db/stripe-customers"
import { getSubscription } from "@/lib/db/subscriptions"
import { flag } from "flags/next"

export type SubscriptionPlan = {
	id: string
	priceId: undefined | string
	todoLimit: number
}

export function getPlansFlag() {
	// Add new plans here
	const defaultPlans: SubscriptionPlan[] = [
		{
			id: "FREE",
			priceId: undefined,
			todoLimit: 10,
		},
		{
			id: "PRO",
			priceId: process.env.STRIPE_PRO_SUB_PRICE_ID!,
			todoLimit: 1000,
		},
	]

	return flag({
		key: "subscription-plans",
		// Provide other options to the Vercel Flags Explorer for testing
		options: [
			{
				label: "Default",
				value: defaultPlans,
			},
			{
				label: "Unlimited",
				value: [
					{
						id: "FREE",
						priceId: undefined,
						todoLimit: 1_000_000,
					},
					{
						id: "PRO",
						priceId: process.env.STRIPE_PRO_SUB_PRICE_ID!,
						todoLimit: 1_000_000,
					},
				],
			},
		],
		decide() {
			return defaultPlans
		},
	})
}

export async function getStripePlan(userId: string): Promise<SubscriptionPlan> {
	const plansFlag = getPlansFlag()
	const plans = await plansFlag()
	const freePlan = plans.find((plan) => plan.priceId === undefined) ?? plans[0]

	const [customer, subData] = await Promise.all([
		getStripeCustomer(userId),
		getSubscription(userId),
	])
	if (!customer) {
		return freePlan
	}

	if (!subData || subData.status !== "active") {
		// Inactive subscriptions happen after canceling, once the billing period ends
		return freePlan
	}

	return plans.find((plan) => plan.priceId === subData.stripePriceId) ?? freePlan
}
