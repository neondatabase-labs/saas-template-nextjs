import { eq } from "drizzle-orm"
import { Subscription, subscriptionsTable, NewSubscription } from "./schema"
import { db } from "./db"

export async function getSubscription(authenticatedUserId: string): Promise<Subscription | null> {
	const result = await db
		.select()
		.from(subscriptionsTable)
		.where(eq(subscriptionsTable.userId, authenticatedUserId))
	return result.length > 0 ? result[0] : null
}

export type SubscriptionUpdate = Partial<NewSubscription> & { id: string }

export async function upsertSubscription(
	authenticatedUserId: string,
	subscription: NewSubscription,
): Promise<Subscription> {
	const now = new Date()
	const result = await db
		.insert(subscriptionsTable)
		.values({
			...subscription,
			userId: authenticatedUserId,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: subscriptionsTable.userId,
			set: {
				// Only update fields that are allowed to change
				stripeSubscriptionId: subscription.stripeSubscriptionId,
				stripePriceId: subscription.stripePriceId,
				status: subscription.status,
				currentPeriodStart: subscription.currentPeriodStart,
				currentPeriodEnd: subscription.currentPeriodEnd,
				cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
				updatedAt: now,
			},
		})
		.returning()
	return result[0]
}

export async function deleteSubscriptions(authenticatedUserId: string): Promise<void> {
	await db.delete(subscriptionsTable).where(eq(subscriptionsTable.userId, authenticatedUserId))
}
