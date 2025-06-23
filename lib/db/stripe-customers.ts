import { and, eq } from "drizzle-orm"
import { StripeCustomer, stripeCustomersTable, NewStripeCustomer } from "./schema"
import { db } from "./db"

export type StripeCustomerUpdate = Partial<NewStripeCustomer> & { id: string }

export async function createStripeCustomer(
	authenticatedUserId: string,
	newStripeCustomer: NewStripeCustomer,
): Promise<StripeCustomer> {
	const result = await db
		.insert(stripeCustomersTable)
		.values({
			...newStripeCustomer,
			userId: authenticatedUserId,
		})
		.returning()
	return result[0]
}

export async function getStripeCustomer(
	authenticatedUserId: string,
): Promise<StripeCustomer | null> {
	const result = await db
		.select()
		.from(stripeCustomersTable)
		.where(eq(stripeCustomersTable.userId, authenticatedUserId))
	return result[0] ?? null
}

export async function getStripeCustomerByCustomerId(
	stripeCustomerId: string,
): Promise<StripeCustomer | null> {
	const result = await db
		.select()
		.from(stripeCustomersTable)
		.where(eq(stripeCustomersTable.stripeCustomerId, stripeCustomerId))
	return result[0] ?? null
}

export async function updateStripeCustomer(
	authenticatedUserId: string,
	stripeCustomer: StripeCustomerUpdate,
): Promise<StripeCustomer | undefined> {
	const { id, ...updateData } = stripeCustomer
	const result = await db
		.update(stripeCustomersTable)
		.set({ ...updateData, updatedAt: new Date() })
		.where(
			and(eq(stripeCustomersTable.id, id), eq(stripeCustomersTable.userId, authenticatedUserId)),
		)
		.returning()
	return result[0]
}

export async function deleteStripeCustomer(authenticatedUserId: string, id: string): Promise<void> {
	await db
		.delete(stripeCustomersTable)
		.where(
			and(eq(stripeCustomersTable.id, id), eq(stripeCustomersTable.userId, authenticatedUserId)),
		)
}
