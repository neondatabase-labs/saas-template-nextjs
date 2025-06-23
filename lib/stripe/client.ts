import { Stripe } from "stripe"

function createStripeClient() {
	return new Stripe(process.env.STRIPE_SECRET_KEY!, {
		apiVersion: "2025-02-24.acacia",
		typescript: true,
	})
}

export const stripe = createStripeClient()
