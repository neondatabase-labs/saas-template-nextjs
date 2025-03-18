import Stripe from "stripe"
import { kv } from "@vercel/kv"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

export const STRIPE_PLANS = {
  FREE: "free",
  PRO: "pro",
} as const

export type StripePlan = keyof typeof STRIPE_PLANS

export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string
      status: Stripe.Subscription.Status
      priceId: string
      currentPeriodStart: number
      currentPeriodEnd: number
      cancelAtPeriodEnd: boolean
      paymentMethod: {
        brand: string | null // e.g., "visa", "mastercard"
        last4: string | null // e.g., "4242"
      } | null
    }
  | {
      status: "none"
    }

export async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: "all",
    expand: ["data.default_payment_method"],
  })

  if (subscriptions.data.length === 0) {
    const subData = { status: "none" } as const
    await kv.set(`stripe:customer:${customerId}`, subData)
    return subData
  }

  const subscription = subscriptions.data[0]

  const subData = {
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
  }

  await kv.set(`stripe:customer:${customerId}`, subData)
  return subData
}

export async function getUserSubscriptionPlan(userId: string) {
  // Get the customer ID from KV
  const customerId = await kv.get(`stripe:user:${userId}`)
  if (!customerId) {
    return "FREE" as const
  }

  // Get the subscription data
  const subData = await kv.get(`stripe:customer:${customerId}`) as STRIPE_SUB_CACHE
  if (!subData || subData.status !== "active") {
    return "FREE" as const
  }

  return subData.priceId === process.env.STRIPE_PRO_PRICE_ID ? "PRO" : "FREE"
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
    })

    // Store the relation between userId and stripeCustomerId in KV
    await kv.set(`stripe:user:${userId}`, customer.id)

    return customer
  } catch (error) {
    console.error("Error creating Stripe customer:", error)
    throw error
  }
}

export async function getStripeCustomer(userId: string) {
  const customerId = await kv.get(`stripe:user:${userId}`)
  if (!customerId) {
    return null
  }

  return { id: customerId as string }
}
