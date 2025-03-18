import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { syncStripeDataToKV } from "@/lib/stripe"

const allowedEvents = [
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
] as const

export async function POST(req: Request) {
  const body = await req.text()
  const signature = await headers().then(h => h.get("Stripe-Signature") as string)

  if (!signature) {
    return new NextResponse("No signature", { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  // Skip processing if the event isn't one we're tracking
  if (!allowedEvents.includes(event.type as typeof allowedEvents[number])) {
    return new NextResponse(null, { status: 200 })
  }

  try {
    // All the events we track have a customerId
    const { customer: customerId } = event.data.object as {
      customer: string
    }

    if (typeof customerId !== "string") {
      throw new Error(
        `[STRIPE HOOK] ID isn't string.\nEvent type: ${event.type}`
      )
    }

    await syncStripeDataToKV(customerId)
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Webhook handler failed", { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
} 
