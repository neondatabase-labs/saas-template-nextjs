import { headers } from "next/headers"
import { after, NextResponse } from "next/server"
import { getStripeCustomerId, processStripeEvent, syncStripeDataToKV } from "@/lib/stripe"
import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"

// Send users to GET /api/stripe after they complete the checkout process
export async function GET() {
	const user = await stackServerApp.getUser({ or: "redirect" })
	if (!user) {
		return new NextResponse("Not authenticated", { status: 401 })
	}

	const customerId = await getStripeCustomerId(user.id)
	if (customerId) {
		await syncStripeDataToKV(customerId)
	}

	redirect("/app/settings")
}

// Send webhooks to POST /api/stripe
export async function POST(req: Request) {
	const body = await req.text()
	const signature = await headers().then((h) => h.get("Stripe-Signature"))

	if (!signature) {
		return new NextResponse("No signature", { status: 400 })
	}

	after(async () => {
		await processStripeEvent({ body, signature })
	})

	return new NextResponse(null, { status: 200 })
}
