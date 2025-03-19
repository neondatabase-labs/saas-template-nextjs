import { headers } from "next/headers"
import { after, NextResponse } from "next/server"
import { getStripeWebhookEvent, isAllowedEventType, syncStripeDataToKV } from "@/lib/stripe/kv"

export async function POST(req: Request) {
	const body = await req.text()
	const signature = await headers().then((h) => h.get("Stripe-Signature"))

	if (!signature) {
		return new NextResponse("No signature", { status: 400 })
	}

	after(async () => {
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
	})

	return new NextResponse(null, { status: 200 })
}
