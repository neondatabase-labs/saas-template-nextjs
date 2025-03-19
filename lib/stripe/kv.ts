/**
 * Integrate Stripe with a KV store.
 */
import { kv } from "@vercel/kv"
import { z } from "zod"
import { stripe } from "./app"
import type { Stripe } from "stripe"

const KvStripeCustomerSchema = z.object({
  id: z.string(),
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
  paymentMethod: z.object({
    brand: z.string().nullable(),
    last4: z.string().nullable(),
  }).nullable(),
})

export async function getStripeCustomer(customerId: string) {
  const customer = await kv.get(`stripe:customer:${customerId}`)
  return KvStripeCustomerSchema.nullable().parse(customer)
}


const KvStripeUserSchema = z.string().nullable()

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
    const customer = await stripe.customers.create({
      email,
      name: name ?? undefined,
      metadata: {
        userId,
      },
    },{
      idempotencyKey: userId,
    })

    // Store the relation between userId and stripeCustomerId in KV
    await kv.set(`stripe:user:${userId}`, KvStripeUserSchema.parse(customer.id))

    return customer
  } catch (error) {
    console.error("Error creating Stripe customer:", error)
    throw error
  }
}

// Webhooks
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

export function isAllowedEventType<TEvent extends Stripe.Event>(
	event: TEvent,
): event is TEvent & { type: AllowedEventType } {
	return allowedEventTypes.includes(event.type as AllowedEventType)
}

export function getStripeWebhookEvent({ body, signature }: { body: string; signature: string }) {
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
      subscription.default_payment_method &&
      typeof subscription.default_payment_method !== "string"
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  })

  await kv.set(key, subData)
  return subData
}
