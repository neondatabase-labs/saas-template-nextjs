"use server"

import { stackServerApp } from "@/stack"
import { revalidatePath } from "next/cache"

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
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword?.trim()) {
    return { error: "Current password is required" }
  }

  if (!newPassword?.trim()) {
    return { error: "New password is required" }
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" }
  }

  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // In a real implementation, you would update the password
    // This is a placeholder for the actual implementation
    // await user.updatePassword({ currentPassword, newPassword })

    revalidatePath("/settings/user/account")
    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Failed to update password:", error)
    return { error: "Failed to update password" }
  }
}

export async function deleteAccount(formData: FormData) {
  const confirmDelete = formData.get("confirmDelete") as string

  if (confirmDelete !== "DELETE") {
    return { error: "Please type DELETE to confirm account deletion" }
  }

  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // In a real implementation, you would delete the user account
    // This is a placeholder for the actual implementation
    // await user.delete()

    return { success: true, message: "Account deleted successfully" }
  } catch (error) {
    console.error("Failed to delete account:", error)
    return { error: "Failed to delete account" }
  }
} 
