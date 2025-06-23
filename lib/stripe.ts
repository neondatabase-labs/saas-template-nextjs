/**
 * Integrate Stripe with a KV store.
 */
import { kv } from "@vercel/kv"
import { z } from "zod"
import { Stripe } from "stripe"
import { remember } from "@epic-web/remember"

export const stripe = remember("stripe", () => {
	if (!process.env.STRIPE_SECRET_KEY) {
		throw new Error("STRIPE_SECRET_KEY is not set")
	}

	return new Stripe(process.env.STRIPE_SECRET_KEY, {
		apiVersion: "2025-02-24.acacia",
		typescript: true,
	})
})

const KvStripeCustomerSchema = z.object({
	subscriptionId: z.string(),
	status: z.union([
		z.literal("active"),
		z.literal("canceled"),
		z.literal("incomplete"),
		z.literal("incomplete_expired"),
		z.literal("past_due"),
		z.literal("paused"),
		z.literal("trialing"),
		z.literal("unpaid"),
	]),
	priceId: z.string(),
	currentPeriodStart: z.number(),
	currentPeriodEnd: z.number(),
	cancelAtPeriodEnd: z.boolean(),
	paymentMethod: z
		.object({
			brand: z.string().nullable(),
			last4: z.string().nullable(),
		})
		.nullable(),
})

export async function getStripeCustomer(customerId: string) {
	const customer = await kv.get(`stripe:customer:${customerId}`)
	return KvStripeCustomerSchema.nullish().parse(customer)
}

const KvStripeUserSchema = z.string().nullish()

export async function getStripeCustomerId(userId: string) {
	return KvStripeUserSchema.parse(await kv.get(`stripe:user:${userId}`))
}

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

		// Store the relation between userId and stripeCustomerId in KV
		await kv.set(`stripe:user:${userId}`, KvStripeUserSchema.parse(customer.id))

		return customer
	} catch (error) {
		console.error("Error creating Stripe customer:", error)
		throw error
	}
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
		await syncStripeDataToKV(customer)
	} catch (error) {
		console.error("Error processing webhook:", error)
		throw new Error("Stripe webhook handler failed")
	}
}

export async function syncStripeDataToKV(customerId: string) {
	const key = `stripe:customer:${customerId}`

	const subscriptions = await stripe.subscriptions.list({
		customer: customerId,
		limit: 1,
		status: "all",
		expand: ["data.default_payment_method"],
	})

	if (subscriptions.data.length === 0) {
		await kv.del(key)
		return null
	}

	const subscription = subscriptions.data[0]

	const subData = KvStripeCustomerSchema.parse({
		subscriptionId: subscription.id,
		status: subscription.status,
		priceId: subscription.items.data[0].price.id,
		currentPeriodStart: subscription.current_period_start,
		currentPeriodEnd: subscription.current_period_end,
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
		paymentMethod:
			subscription.default_payment_method && typeof subscription.default_payment_method !== "string"
				? {
						brand: subscription.default_payment_method.card?.brand ?? null,
						last4: subscription.default_payment_method.card?.last4 ?? null,
					}
				: null,
	})

	await kv.set(key, subData)
	return subData
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
