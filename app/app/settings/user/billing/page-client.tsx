"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/stack-client"

export function BillingSettingsPageClient() {
	const user = useUser({ or: "redirect" })

	return (
		<div className="space-y-8">
			{/* Current Plan */}
			<Card>
				<CardHeader>
					<CardTitle>Current Plan</CardTitle>
					<CardDescription>Manage your subscription and billing details.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium">Free Plan</h3>
							<p className="text-sm text-muted-foreground">Basic features for personal use</p>
						</div>
						<Button variant="outline">Upgrade Plan</Button>
					</div>
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
								<span className="text-muted-foreground">✗</span> Advanced analytics
							</li>
							<li className="flex items-center gap-2">
								<span className="text-muted-foreground">✗</span> Priority support
							</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* Billing Contact */}
			<Card>
				<CardHeader>
					<CardTitle>Billing Contact</CardTitle>
					<CardDescription>Update your billing information.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4">
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="billing-name">Name</Label>
								<Input
									id="billing-name"
									name="billingName"
									defaultValue={user.displayName || ""}
									placeholder="Billing contact name"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="billing-email">Email</Label>
								<Input
									id="billing-email"
									name="billingEmail"
									type="email"
									defaultValue={user.primaryEmail || ""}
									placeholder="Billing email address"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="company-name">Company Name (Optional)</Label>
								<Input id="company-name" name="companyName" placeholder="Your company name" />
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit">Save Billing Info</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Invoice History */}
			<Card>
				<CardHeader>
					<CardTitle>Invoice History</CardTitle>
					<CardDescription>View and download your past invoices.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<div className="grid grid-cols-4 p-4 font-medium border-b">
							<div>Date</div>
							<div>Amount</div>
							<div>Status</div>
							<div className="text-right">Actions</div>
						</div>
						<div className="divide-y">
							<div className="grid grid-cols-4 p-4 text-sm items-center">
								<div>Mar 1, 2023</div>
								<div>$0.00</div>
								<div>
									<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
										Free
									</span>
								</div>
								<div className="text-right">
									<Button variant="ghost" size="sm" disabled>
										Download
									</Button>
								</div>
							</div>
							<div className="grid grid-cols-4 p-4 text-sm items-center">
								<div>Feb 1, 2023</div>
								<div>$0.00</div>
								<div>
									<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
										Free
									</span>
								</div>
								<div className="text-right">
									<Button variant="ghost" size="sm" disabled>
										Download
									</Button>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
