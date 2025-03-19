import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { getStripePlan } from "@/lib/stripe/app"
import { SettingsPageClient } from "./page-client"
import { verifyContactChannel } from "./actions"
import { getStripeCustomerId, syncStripeDataToKV } from "@/lib/stripe/kv"

export default async function SettingsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await searchParamsPromise
	const user = await stackServerApp.getUser({ or: "redirect" })

	if (searchParams.code && !Array.isArray(searchParams.code)) {
		// Handle contact channel verification
		await verifyContactChannel({ code: searchParams.code })
		redirect("/app/settings")
	}

	if (searchParams.success) {
		const customerId = await getStripeCustomerId(user?.id)
		if (customerId) {
			await syncStripeDataToKV(customerId)
		}
		redirect("/app/settings")
	}

	const plan = await getStripePlan(user?.id)
	const contactChannels = await user?.listContactChannels()

	return (
		<SettingsPageClient
			planId={plan.id}
			contactChannels={
				contactChannels?.map((channel) => ({
					id: channel.id,
					value: channel.value,
					type: channel.type,
					isPrimary: channel.isPrimary,
					isVerified: channel.isVerified,
					usedForAuth: channel.usedForAuth,
				})) ?? []
			}
		/>
	)
}
