"use client"

import { ComponentProps, useState } from "react"
import { Check, Plus } from "lucide-react"
import type { Project } from "@/lib/db/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command"
import { ProjectBadge } from "./project-badge"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { addProject } from "@/actions/manage-projects"

export function ProjectSelector({
	projects,
	selectedProjectId,
	onSelectProject,
	onProjectAdded,
	teamId,
	...props
}: {
	projects: Project[]
	selectedProjectId: string | null
	onSelectProject: (projectId: string | null) => void
	onProjectAdded?: (project: Project) => void
	teamId: string
} & ComponentProps<typeof PopoverTrigger>) {
	const [open, setOpen] = useState(false)
	const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
	const [projectName, setProjectName] = useState("")
	const [projectColor, setProjectColor] = useState("#4f46e5") // Default indigo

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
		const name = formData.get("name") as string
		const color = formData.get("color") as string

		const result = await addProject({ name, color, teamId })

		if (result.success && result.project && onProjectAdded) {
			onProjectAdded(result.project)
			setProjectName("")
			setIsAddProjectOpen(false)
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger {...props} />

			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search projects..." />
					<CommandList>
						<CommandEmpty>No projects found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={() => {
									onSelectProject(null)
									setOpen(false)
								}}
							>
								<span>No Project</span>
								{selectedProjectId === null && <Check className="h-4 w-4 ml-auto" />}
							</CommandItem>
						</CommandGroup>

						{projects.length > 0 && (
							<CommandGroup heading="Projects">
								{projects.map((project) => (
									<CommandItem
										key={project.id}
										onSelect={() => {
											onSelectProject(project.id)
											setOpen(false)
										}}
									>
										<ProjectBadge project={project} />
										{project.id === selectedProjectId && <Check className="h-4 w-4 ml-auto" />}
									</CommandItem>
								))}
							</CommandGroup>
						)}

						<CommandSeparator />

						<CommandGroup>
							<Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
								<DialogTrigger asChild>
									<CommandItem onSelect={() => setIsAddProjectOpen(true)}>
										<Plus className="h-4 w-4 mr-2" />
										<span>Create Project</span>
									</CommandItem>
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
											<Button type="submit">Create Project</Button>
										</div>
									</form>
								</DialogContent>
							</Dialog>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
