import { getAccessToken, stackServerApp } from "@/stack"
import { AccountSettingsPageClient } from "./page-client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export function revalidateAccountSettings() {
	revalidatePath("/settings/user/account")
}

export default async function AccountSettingsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await searchParamsPromise
	if (searchParams.code && !Array.isArray(searchParams.code)) {
		await verifyContactChannel({ code: searchParams.code })
		redirect("/app/settings/user/account")
	}

	const user = await stackServerApp.getUser()
	const contactChannels = await user?.listContactChannels()

	return (
		<AccountSettingsPageClient
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

export async function verifyContactChannel({ code }: { code: string }) {
	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("No access token found")
	}

	const response = await fetch(`https://api.stack-auth.com/api/v1/contact-channels/verify`, {
		method: "POST",
		body: JSON.stringify({
			code,
		}),
		headers: {
			"Content-Type": "application/json",
			"X-Stack-Access-Type": "server",
			"X-Stack-Project-Id": stackServerApp.projectId,
			"X-Stack-Publishable-Client-Key": process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
			"X-Stack-Secret-Server-Key": process.env.STACK_SECRET_SERVER_KEY!,
			"X-Stack-Access-Token": accessToken,
		},
	}).then((res) => res.json())

	if (!response.success) {
		if (response.error === "The verification link has already been used.") {
			return
		}
		throw new Error(response.error)
	}
}
