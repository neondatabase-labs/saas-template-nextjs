import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

export function ProjectBadge({ project, className }: { project: Project; className?: string }) {
	return (
		<Badge
			className={cn(className)}
			style={{
				backgroundColor: `${project.color}20`, // 20% opacity
				color: project.color,
				borderColor: `${project.color}40`, // 40% opacity
			}}
		>
			<span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: project.color }} />
			{project.name}
		</Badge>
	)
}
