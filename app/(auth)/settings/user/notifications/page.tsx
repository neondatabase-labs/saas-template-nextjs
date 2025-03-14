import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default async function NotificationsSettingsPage() {
	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<CardTitle>Email Notifications</CardTitle>
					<CardDescription>Choose what updates you want to receive via email.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="team-updates">Team Updates</Label>
						<Switch id="team-updates" defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="security-alerts">Security Alerts</Label>
						<Switch id="security-alerts" defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="product-news">Product News</Label>
						<Switch id="product-news" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Web Notifications</CardTitle>
					<CardDescription>
						Choose what notifications you want to see in the web app.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="web-mentions">Mentions</Label>
						<Switch id="web-mentions" defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="web-comments">Comments</Label>
						<Switch id="web-comments" defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="web-deploys">Deployment Updates</Label>
						<Switch id="web-deploys" defaultChecked />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
