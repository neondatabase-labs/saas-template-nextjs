/**
 * This is the file you should edit to add Stripe features to your project.
 */
import { createStripeCustomer, getStripeCustomer, getStripeCustomerId, stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"

const plans = [
	{ id: "FREE", priceId: undefined, todoLimit: 10, todoDaysBehind: 0, todoDaysAhead: 30 },
	{ id: "PRO", priceId: process.env.STRIPE_PRO_PRICE_ID, todoLimit: 1000, todoDaysBehind: Infinity, todoDaysAhead: Infinity },
] as const 

export type StripePlanId = (typeof plans)[number]["id"]

export async function getStripePlan(userId: string) {
	const freePlan = plans.find((plan) => plan.priceId === undefined) ?? plans[0]
	
  const customerId = await getStripeCustomerId(userId)
  if (!customerId) {
    return freePlan
	}

  const subData = await getStripeCustomer(customerId)
  if (!subData || subData.status !== "active") {
    // Inactive subscriptions happen after canceling, once the billing period ends
    return freePlan
  }

  return plans.find((plan) => plan.priceId === subData.priceId) ?? freePlan
}

export async function redirectToCheckout({
  userId,
  email,
  name,
}: {
  userId: string
  email: string
  name?: string | null
}) {
  const customerId = await getStripeCustomerId(userId)
	let stripeCustomerId = customerId

	if (!stripeCustomerId) {
		// Create a new customer if one doesn't exist
		const customer = await createStripeCustomer({
			userId,
			email,
			name,
		})
		stripeCustomerId = customer.id
	}
  
	const checkoutSession = await stripe.checkout.sessions.create({
		customer: stripeCustomerId,
		line_items: [
			{
				price: process.env.STRIPE_PRO_PRICE_ID,
				quantity: 1,
			},
		],
		mode: "subscription",
		success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe`,
		cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe`,
		metadata: {
			userId,
		},
	})

	if (!checkoutSession.url) {
		throw new Error("Failed to create checkout session")
	}

	redirect(checkoutSession.url)
}

export async function redirectToBillingPortal({
  userId,
}: {
  userId: string
}) {
  const customerId = await getStripeCustomerId(userId)
	if (!customerId) {
		throw new Error("Customer not found")
	}

	const portalSession = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
	})

	if (!portalSession.url) {
		throw new Error("Failed to create portal session")
	}

	redirect(portalSession.url)
}
