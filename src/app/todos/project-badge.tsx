import type { Project } from "@/lib/schema"
import { cn } from "@/lib/utils"

interface ProjectBadgeProps {
  project: Project
  className?: string
}

export function ProjectBadge({ project, className }: ProjectBadgeProps) {
  return (
    <div
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}
      style={{
        backgroundColor: `${project.color}20`, // 20% opacity
        color: project.color,
        borderColor: `${project.color}40`, // 40% opacity
      }}
    >
      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: project.color }} />
      {project.name}
    </div>
  )
}

