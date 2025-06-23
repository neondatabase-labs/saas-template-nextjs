import { headers } from "next/headers"
import { after, NextResponse } from "next/server"
import { processStripeEvent, syncStripeData } from "@/lib/stripe/stripe"
import { redirect } from "next/navigation"
import { stackServerApp } from "@/lib/stack-auth/stack"
import { getStripeCustomer } from "@/lib/db/stripe-customers"

// Send users to GET /api/stripe after they complete the checkout process
export async function GET() {
	const user = await stackServerApp.getUser({ or: "redirect" })
	if (!user) {
		return new NextResponse("Not authenticated", { status: 401 })
	}

	const customer = await getStripeCustomer(user.id)
	if (customer) {
		await syncStripeData(customer.stripeCustomerId)
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
