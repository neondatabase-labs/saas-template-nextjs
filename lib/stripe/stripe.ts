import { z } from "zod"
import { Stripe } from "stripe"
import { redirect } from "next/navigation"
import { deleteSubscriptions, upsertSubscription } from "@/lib/db/subscriptions"
import {
	getStripeCustomerByCustomerId,
	createStripeCustomer as createStripeCustomerDb,
	getStripeCustomer as getStripeCustomerDb,
	getStripeCustomer,
} from "@/lib/db/stripe-customers"
import { SUBSCRIPTION_STATUS } from "@/lib/db/schema"
import { getPlansFlag } from "./plans"
import { stripe } from "./client"

export async function createStripeCustomer({
	userId,
	email,
	name,
}: {
	userId: string
	email: string
	name?: string | null
}) {
	try {
		const customer = await stripe.customers.create(
			{
				email,
				name: name ?? undefined,
				metadata: {
					userId,
				},
			},
			{
				idempotencyKey: userId,
			},
		)
		return customer.id
	} catch (error) {
		console.error("Error creating Stripe customer:", error)
		throw error
	}
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
	const customer = await getStripeCustomerDb(userId)
	let stripeCustomerId = customer?.stripeCustomerId
	if (!stripeCustomerId) {
		// Create a new customer if one doesn't exist
		const customerId = await createStripeCustomer({
			userId,
			email,
			name,
		})
		stripeCustomerId = customerId
		await createStripeCustomerDb(userId, { stripeCustomerId, userId })
	}

	const plansFlag = getPlansFlag()
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

export async function redirectToBillingPortal({ userId }: { userId: string }) {
	const customer = await getStripeCustomer(userId)
	if (!customer) {
		throw new Error("Customer not found")
	}

	const portalSession = await stripe.billingPortal.sessions.create({
		customer: customer.stripeCustomerId,
		return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
	})

	if (!portalSession.url) {
		throw new Error("Failed to create portal session")
	}

	redirect(portalSession.url)
}

export async function processStripeEvent({ body, signature }: { body: string; signature: string }) {
	const {
		event,
		success: eventSuccess,
		error: eventError,
	} = getStripeWebhookEvent({ body, signature })

	if (!eventSuccess) {
		throw new Error(`Stripe webhook event error: ${eventError.message}`)
	}

	if (!isAllowedEventType(event)) {
		console.warn(
			`[STRIPE HOOK] Received untracked event: ${event.type}. Configure webhook event types in your Stripe dashboard.`,
		)
		return
	}

	const { customer } = event.data.object
	if (typeof customer !== "string") {
		throw new Error("Stripe webhook handler failed")
	}

	try {
		await syncStripeData(customer)
	} catch (error) {
		console.error("Error processing webhook:", error)
		throw new Error("Stripe webhook handler failed")
	}
}

const SubscriptionStatusSchema = z.object({
	status: z.enum(SUBSCRIPTION_STATUS),
})

export async function syncStripeData(customerId: string) {
	const stripeCustomer = await getStripeCustomerByCustomerId(customerId)
	if (!stripeCustomer) {
		throw new Error(`Stripe customer not found: ${customerId}`)
	}

	const subscriptions = await stripe.subscriptions.list({
		customer: customerId,
		limit: 1,
		status: "all",
		expand: ["data.default_payment_method"],
	})

	if (subscriptions.data.length === 0) {
		await deleteSubscriptions(customerId)
		return null
	}

	const subscriptionData = subscriptions.data[0]
	SubscriptionStatusSchema.parse({ status: subscriptionData.status })

	await upsertSubscription(stripeCustomer.userId, {
		userId: stripeCustomer.userId,
		stripeSubscriptionId: subscriptionData.id,
		status: subscriptionData.status,
		stripePriceId: subscriptionData.items.data[0].price.id,
		currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
		currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
	})
}

const allowedEventTypes = [
	"checkout.session.completed",
	"checkout.session.async_payment_succeeded",
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
] as const
type AllowedEventType = (typeof allowedEventTypes)[number]

function isAllowedEventType<TEvent extends Stripe.Event>(
	event: TEvent,
): event is TEvent & { type: AllowedEventType } {
	return allowedEventTypes.includes(event.type as AllowedEventType)
}

function getStripeWebhookEvent({ body, signature }: { body: string; signature: string }) {
	try {
		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!,
		)
		return { success: true as const, event: event, error: null }
	} catch (error) {
		return { success: false as const, error: error as Error, event: null }
	}
}
