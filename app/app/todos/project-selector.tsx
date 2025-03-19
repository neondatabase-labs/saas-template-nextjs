"use client"

import { useState } from "react"
import { Check, Plus, Tag } from "lucide-react"
import type { Project } from "@/lib/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ProjectBadge } from "./project-badge"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { addProject } from "@/lib/actions"
import { cn } from "@/lib/utils"

function SubmitButton() {
	return <Button type="submit">Create Project</Button>
}

export function ProjectSelector({
	projects,
	selectedProjectId,
	onSelectProject,
	onProjectAdded,
	triggerClassName,
}: {
	projects: Project[]
	selectedProjectId: number | null
	onSelectProject: (projectId: number | null) => void
	onProjectAdded?: (project: Project) => void
	triggerClassName?: string
}) {
	const [open, setOpen] = useState(false)
	const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
	const [projectName, setProjectName] = useState("")
	const [projectColor, setProjectColor] = useState("#4f46e5") // Default indigo

	const selectedProject = projects.find((p) => p.id === selectedProjectId)

	// Predefined colors
	const colors = [
		{ name: "Red", value: "#ef4444" },
		{ name: "Orange", value: "#f97316" },
		{ name: "Green", value: "#22c55e" },
		{ name: "Blue", value: "#3b82f6" },
		{ name: "Indigo", value: "#6366f1" },
		{ name: "Purple", value: "#a855f7" },
		{ name: "Pink", value: "#ec4899" },
	]

	async function handleAddProject(formData: FormData) {
		const result = await addProject(formData)

		if (result.success && result.project && onProjectAdded) {
			onProjectAdded(result.project)
			setProjectName("")
			setIsAddProjectOpen(false)
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				{selectedProject ? (
					<button>
						<ProjectBadge project={selectedProject} className="mr-2" />
					</button>
				) : (
					<Button variant="outline" className="h-6 px-2 text-xs text-muted-foreground">
						<Tag className="h-3 w-3 mr-1" />
						<span>Project</span>
					</Button>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-2">
				{/* No Project Option */}
				<button
					className={cn(
						"flex items-center w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent",
						selectedProjectId === null && "bg-accent",
					)}
					onClick={() => {
						onSelectProject(null)
						setOpen(false)
					}}
				>
					<span>No Project</span>
					{selectedProjectId === null && <Check className="h-4 w-4 ml-auto" />}
				</button>

				{/* Projects List */}
				{projects.length > 0 && (
					<>
						<div className="h-px bg-border my-1" />
						<div className="max-h-[180px] overflow-y-auto py-1">
							{projects.map((project) => (
								<button
									key={project.id}
									className={cn(
										"flex items-center w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent",
										project.id === selectedProjectId && "bg-accent",
									)}
									onClick={() => {
										onSelectProject(project.id)
										setOpen(false)
									}}
								>
									<ProjectBadge project={project} />
									{project.id === selectedProjectId && <Check className="h-4 w-4 ml-auto" />}
								</button>
							))}
						</div>
					</>
				)}

				{/* Create Project Option */}
				<>
					<div className="h-px bg-border my-1" />
					<Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
						<DialogTrigger asChild>
							<button
								className="flex items-center w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent"
								onClick={() => setIsAddProjectOpen(true)}
							>
								<Plus className="h-4 w-4 mr-2" />
								<span>Create Project</span>
							</button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Project</DialogTitle>
							</DialogHeader>
							<form action={handleAddProject} className="space-y-4">
								<div className="space-y-2">
									<label htmlFor="project-name" className="text-sm font-medium">
										Project Name
									</label>
									<Input
										id="project-name"
										name="name"
										value={projectName}
										onChange={(e) => setProjectName(e.target.value)}
										placeholder="Enter project name"
										required
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Project Color</label>
									<div className="flex flex-wrap gap-2">
										{colors.map((color) => (
											<button
												key={color.value}
												type="button"
												className={`w-8 h-8 rounded-full ${projectColor === color.value ? "ring-2 ring-offset-2" : ""}`}
												style={{ backgroundColor: color.value }}
												onClick={() => setProjectColor(color.value)}
												title={color.name}
											/>
										))}
									</div>
									<input type="hidden" name="color" value={projectColor} />
								</div>

								<div className="flex justify-end">
									<SubmitButton />
								</div>
							</form>
						</DialogContent>
					</Dialog>
				</>
			</PopoverContent>
		</Popover>
	)
}
