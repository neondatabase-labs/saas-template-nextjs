/**
 * This is the file you should edit to add Stripe features to your project.
 */
import { createStripeCustomer, getStripeCustomerId, stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"
import { plansFlag } from "./plans"

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

	const plans = await plansFlag()
	const checkoutSession = await stripe.checkout.sessions.create({
		customer: stripeCustomerId,
		line_items: [
			{
				price: plans.find((plan) => plan.id === "PRO")?.priceId,
				quantity: 1,
			},
		],
		mode: "subscription",
		success_url: `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/stripe`,
		cancel_url: `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/stripe`,
		metadata: {
			userId,
		},
	})

	if (!checkoutSession.url) {
		throw new Error("Failed to create checkout session")
	}

	redirect(checkoutSession.url)
}

export async function redirectToBillingPortal({ userId }: { userId: string }) {
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
