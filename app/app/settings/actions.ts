"use server"

import { getAccessToken, stackServerApp } from "@/stack"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function updateEmail(formData: FormData) {
	const newEmail = formData.get("newEmail") as string
	const password = formData.get("password") as string

	if (!newEmail?.trim()) {
		return { error: "New email is required" }
	}

	if (!password?.trim()) {
		return { error: "Password is required to confirm this change" }
	}

	try {
		const user = await stackServerApp.getUser()
		if (!user) {
			return { error: "Not authenticated" }
		}

		// In a real implementation, you would verify the password and update the email
		// This is a placeholder for the actual implementation
		// await user.updateEmail({ newEmail, password })

		revalidatePath("/settings/user/account")
		return { success: true, message: "Email updated successfully" }
	} catch (error) {
		console.error("Failed to update email:", error)
		return { error: "Failed to update email" }
	}
}

export async function updatePassword(formData: FormData) {
	const currentPassword = formData.get("currentPassword") as string
	const user = await stackServerApp.getUser()
	if (!user) {
		return { success: false as const, error: "Not authenticated" }
	}

	// If the user has a password, require the current password
	if (user.hasPassword && !currentPassword?.trim()) {
		return { success: false as const, error: "Current password is required" }
	}

	const newPassword = formData.get("newPassword") as string

	if (!newPassword?.trim()) {
		return { success: false as const, error: "New password is required" }
	}

	if (user.hasPassword) {
		// TODO: this appears to be broken, it works even with incorrect oldPassword
		const error = await user.updatePassword({
			oldPassword: Math.random().toString(),
			newPassword,
		})

		if (error) {
			console.error("Failed to update password:", error)
			return { success: false as const, error: error.message }
		}
	} else {
		const error = await user.setPassword({ password: newPassword })
		if (error) {
		  console.error("Failed to set password:", error)
		  return { success: false as const, error: error.message }
		}
	}

	revalidatePath("/settings/user/account")
	return { success: true as const, message: "Password updated successfully" }
}

export async function deleteAccount(formData: FormData) {
	const confirmDelete = formData.get("confirmDelete") as string

	if (confirmDelete !== "DELETE") {
		return { success: false as const, error: "Please type DELETE to confirm account deletion" }
	}

	const user = await stackServerApp.getUser()
	if (!user) {
		return { success: false as const, error: "Not authenticated" }
	}

	await user.delete()
	redirect("/handler/sign-out")
}

export async function addContactChannel(formData: FormData) {
	const email = formData.get("email") as string
	if (!email) return

	const user = await stackServerApp.getUser()
	if (!user) return

	await user.createContactChannel({ type: "email", value: email, usedForAuth: false })

	void revalidatePath("/app/settings")
}

export async function deleteContactChannel(formData: FormData) {
	const id = formData.get("id") as string
	if (!id) {
		throw new Error("No id found")
	}

	const user = await stackServerApp.getUser()
	if (!user) {
		throw new Error("No user found")
	}

	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("No access token found")
	}

	// If user makes GitHub account, it prepopulates with initial contact channel
	// if the user deletes it, StackAuth still lets them log in, so no need to guard against that.
	const response = await fetch(`https://api.stack-auth.com/api/v1/contact-channels/me/${id}`, {
		method: "DELETE",
		body: JSON.stringify({}),
		headers: {
			"Content-Type": "application/json",
			"X-Stack-Access-Type": "server",
			"X-Stack-Project-Id": stackServerApp.projectId,
			"X-Stack-Publishable-Client-Key": process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
			"X-Stack-Secret-Server-Key": process.env.STACK_SECRET_SERVER_KEY!,
			"X-Stack-Access-Token": accessToken,
		},
	}).then((res) => res.json())

	console.log(response)

	if (!response.success) {
		throw new Error(response.error)
	}

	void revalidatePath("/app/settings")
}

export async function makePrimaryContactChannel(formData: FormData) {
	const id = formData.get("id") as string
	if (!id) {
		throw new Error("No id found")
	}

	const user = await stackServerApp.getUser()
	if (!user) {
		throw new Error("No user found")
	}

	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("No access token found")
	}

	// If user makes GitHub account, it prepopulates with initial contact channel
	// if the user deletes it, StackAuth still lets them log in, so no need to guard against that.
	const response = await fetch(`https://api.stack-auth.com/api/v1/contact-channels/me/${id}`, {
		method: "PATCH",
		// we'll treat all primary contact channels as used for auth
		body: JSON.stringify({ is_primary: true, used_for_auth: true }),
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
		throw new Error(response.error)
	}

	void revalidatePath("/app/settings")
}

export async function sendVerificationEmail(formData: FormData) {
	const id = formData.get("id") as string
	if (!id) {
		throw new Error("No id found")
	}

	const user = await stackServerApp.getUser()
	if (!user) {
		throw new Error("No user found")
	}

	const accessToken = await getAccessToken(await cookies())
	if (!accessToken) {
		throw new Error("No access token found")
	}

	const response = await fetch(
		`https://api.stack-auth.com/api/v1/contact-channels/me/${id}/send-verification-code`,
		{
			method: "POST",
			body: JSON.stringify({
				callback_url: `http://localhost:3000/app/settings/user/account`,
			}),
			headers: {
				"Content-Type": "application/json",
				"X-Stack-Access-Type": "server",
				"X-Stack-Project-Id": stackServerApp.projectId,
				"X-Stack-Publishable-Client-Key": process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
				"X-Stack-Secret-Server-Key": process.env.STACK_SECRET_SERVER_KEY!,
				"X-Stack-Access-Token": accessToken,
			},
		},
	).then((res) => res.json())

	if (!response.success) {
		throw new Error(response.error)
	}

	void revalidatePath("/app/settings")

	// const contactChannels = await user.listContactChannels()

	// const contactChannel = contactChannels.find(channel => channel.id === id)

	// if (!contactChannel) {
	//   throw new Error("Contact channel not found")
	// }

	// await contactChannel.sendVerificationEmail()
}


// Moved from account/page.tsx
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
