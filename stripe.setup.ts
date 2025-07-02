import { invariant } from "@epic-web/invariant"
import { config } from "dotenv"
import Stripe from "stripe"

config()

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
invariant(STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is required")

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: "2025-02-24.acacia",
})

const events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
	"checkout.session.completed",
	"customer.subscription.created",
	"customer.subscription.updated",
	"customer.subscription.deleted",
	"customer.subscription.paused",
	"customer.subscription.resumed",
	"customer.subscription.pending_update_applied",
	"customer.subscription.pending_update_expired",
	"customer.subscription.trial_will_end",
	"invoice.paid",
	"invoice.payment_failed",
	"invoice.payment_action_required",
	"invoice.upcoming",
	"invoice.marked_uncollectible",
	"invoice.payment_succeeded",
	"payment_intent.succeeded",
	"payment_intent.payment_failed",
	"payment_intent.canceled",
]

console.log("🔄 Setting up Stripe webhook endpoint...")
const url = `${process.env.NEXT_PUBLIC_ORIGIN}/api/stripe`

if (url.includes("localhost:")) {
	throw new Error("Cannot register webhook to localhost, ")
}

try {
	const existingWebhooks = await stripe.webhookEndpoints.list()

	if (existingWebhooks.data.length > 0) {
		if (existingWebhooks.data.find((webhook) => webhook.url === url)) {
			console.log("🔄 Webhook endpoint already exists")
			process.exit(0)
		}
	}

	const webhook = await stripe.webhookEndpoints.create({
		url,
		enabled_events: events,
		description: "Webhook endpoint for production",
	})

	console.log("✅ Successfully created webhook endpoint")
	console.log("Webhook signing secret:", webhook.secret)
	console.log("Please add this to your .env file as STRIPE_WEBHOOK_SECRET")
} catch (error) {
	console.error("❌ Failed to create webhook endpoint:", error)
	process.exit(1)
}
