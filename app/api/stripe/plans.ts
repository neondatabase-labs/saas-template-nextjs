import { getStripeCustomerId, getStripeCustomer } from '@/lib/stripe'
import { flag } from 'flags/next'

// Add new plans here, or edit them in the Vercel Flags Explorer
export const plansFlag = flag({
  key: 'subscription-plans',
  decide() {
    return [
      { 
        id: "FREE", 
        priceId: undefined, 
        todoLimit: 10, 
        todoDaysBehind: 0, 
        todoDaysAhead: 30 
      },
      { 
        id: "PRO", 
        priceId: 'price_1R3aDvLxBMFKq9DZn1vkvwwW', 
        todoLimit: 1000, 
        todoDaysBehind: Infinity, 
        todoDaysAhead: Infinity 
      },
    ]
  },
})

export async function getStripePlan(userId: string) {
	const plans = await plansFlag()
	const freePlan = plans.find((plan) => plan.priceId === undefined) ?? plans[0]

	const customerId = await getStripeCustomerId(userId)
	if (!customerId) {
		return freePlan
	}

	const subData = await getStripeCustomer(customerId)
	if (!subData || subData.status !== "active") {
		// Inactive subscriptions happen after canceling, once the billing period ends
		return freePlan
	}

	return plans.find((plan) => plan.priceId === subData.priceId) ?? freePlan
}
