"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createCheckoutSession, createBillingPortalSession } from "./actions"
import { StripePlan, type STRIPE_SUB_CACHE } from "@/lib/stripe"

const plans = [{ name: "Pro Plan", description: "Advanced features for power users", code: "PRO" }]

export function BillingSettingsPageClient({
	subscriptionPlan,
	subscriptionData,
}: {
	subscriptionPlan: StripePlan
	subscriptionData: STRIPE_SUB_CACHE
}) {
	const isActive = subscriptionData.status === "active"
	const isPro = subscriptionPlan === "PRO" && isActive

	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<CardTitle>Current Plan</CardTitle>
					<CardDescription>Manage your subscription and billing details.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Free Plan */}
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium">
								Free Plan
								{subscriptionPlan === "FREE" && " (Current)"}
							</h3>
							<p className="text-sm text-muted-foreground">Basic features for personal use</p>
						</div>
					</div>

					{/* Paid Plans */}
					{plans.map((plan) => (
						<div key={plan.code} className="flex items-center justify-between">
							<div>
								<h3 className="font-medium">
									{plan.name}
									{subscriptionPlan === plan.code && " (Current"}
									{subscriptionPlan === plan.code &&
										isActive &&
										subscriptionData.cancelAtPeriodEnd &&
										` - Cancels on ${new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}`}
									{subscriptionPlan === plan.code && ")"}
								</h3>
								<p className="text-sm text-muted-foreground">{plan.description}</p>
							</div>

							{subscriptionPlan === plan.code && isActive ? (
								<form action={createBillingPortalSession}>
									<Button type="submit" variant="outline">
										Manage Subscription
									</Button>
								</form>
							) : (
								<form action={createCheckoutSession}>
									<Button type="submit" variant="outline">
										Upgrade
									</Button>
								</form>
							)}
						</div>
					))}

					<div className="border-t pt-4 mt-4">
						<h4 className="text-sm font-medium mb-2">Plan Features</h4>
						<ul className="text-sm space-y-1">
							<li className="flex items-center gap-2">
								<span className="text-green-500">✓</span> Unlimited todos
							</li>
							<li className="flex items-center gap-2">
								<span className="text-green-500">✓</span> Basic project management
							</li>
							<li className="flex items-center gap-2">
								<span className={isPro ? "text-green-500" : "text-muted-foreground"}>
									{isPro ? "✓" : "✗"}
								</span>{" "}
								Advanced analytics
							</li>
							<li className="flex items-center gap-2">
								<span className={isPro ? "text-green-500" : "text-muted-foreground"}>
									{isPro ? "✓" : "✗"}
								</span>{" "}
								Priority support
							</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
