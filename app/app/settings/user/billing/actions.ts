"use server"

import { stripe, createStripeCustomer, getStripeCustomer } from "@/lib/stripe"
import { stackServerApp } from "@/stack"
import { redirect } from "next/navigation"

export async function createCheckoutSession() {
	const user = await stackServerApp.getUser()
	if (!user) {
		throw new Error("Not authenticated")
	}

	if (!user.primaryEmailVerified) {
		throw new Error("Email not verified")
	}

	const customerId = await getStripeCustomer(user.id)
	let stripeCustomerId = customerId?.id

	if (!stripeCustomerId) {
		// Create a new customer if one doesn't exist
		const customer = await createStripeCustomer({
			userId: user.id,
			email: user.primaryEmail!,
			name: user.displayName,
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
		success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?success=true`,
		cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?canceled=true`,
		metadata: {
			userId: user.id,
		},
	})

	if (!checkoutSession.url) {
		throw new Error("Failed to create checkout session")
	}

	redirect(checkoutSession.url)
}

export async function createBillingPortalSession() {
	const user = await stackServerApp.getUser()
	if (!user) {
		throw new Error("Not authenticated")
	}

	if (!user.primaryEmailVerified) {
		throw new Error("Email not verified")
	}

	const customerId = await getStripeCustomer(user.id)

	if (!customerId) {
		throw new Error("Customer not found")
	}

	const portalSession = await stripe.billingPortal.sessions.create({
		customer: customerId.id as string,
		return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
	})

	if (!portalSession.url) {
		throw new Error("Failed to create portal session")
	}

	redirect(portalSession.url)
}
