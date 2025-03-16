"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ProjectBadge } from "../todos/project-badge"
import type { Project } from "@/lib/schema"
import { addProject } from "@/lib/actions"

const colors = [
	{ name: "Red", value: "#ef4444" },
	{ name: "Orange", value: "#f97316" },
	{ name: "Amber", value: "#f59e0b" },
	{ name: "Yellow", value: "#eab308" },
	{ name: "Lime", value: "#84cc16" },
	{ name: "Green", value: "#22c55e" },
	{ name: "Emerald", value: "#10b981" },
	{ name: "Teal", value: "#14b8a6" },
	{ name: "Cyan", value: "#06b6d4" },
	{ name: "Sky", value: "#0ea5e9" },
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Indigo", value: "#6366f1" },
	{ name: "Violet", value: "#8b5cf6" },
	{ name: "Purple", value: "#a855f7" },
	{ name: "Fuchsia", value: "#d946ef" },
	{ name: "Pink", value: "#ec4899" },
	{ name: "Rose", value: "#f43f5e" },
]

export function ProjectSettings({ projects }: { projects: Project[] }) {
	const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
	const [projectName, setProjectName] = useState("")
	const [projectColor, setProjectColor] = useState("#4f46e5")
	const [editingProject, setEditingProject] = useState<Project | null>(null)

	async function handleAddProject(formData: FormData) {
		const result = await addProject(formData)

		if (result.success) {
			setProjectName("")
			setIsAddProjectOpen(false)
		}
	}

	async function handleEditProject(formData: FormData) {
		// TODO: Implement project editing
		setEditingProject(null)
	}

	async function handleDeleteProject(projectId: number) {
		// TODO: Implement project deletion
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Projects</CardTitle>
							<CardDescription>Manage your projects and their settings.</CardDescription>
						</div>
						<Button onClick={() => setIsAddProjectOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							New Project
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="divide-y">
						{projects.map((project) => (
							<div key={project.id} className="flex items-center justify-between py-4">
								<div className="flex items-center gap-4">
									<ProjectBadge project={project} />
									<span className="text-sm text-muted-foreground">
										{/* TODO: Add project stats */}
										12 tasks
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Button variant="ghost" size="icon" onClick={() => setEditingProject(project)}>
										<Pencil className="h-4 w-4" />
										<span className="sr-only">Edit project</span>
									</Button>
									<Button variant="ghost" size="icon">
										<Users className="h-4 w-4" />
										<span className="sr-only">Manage members</span>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDeleteProject(project.id)}
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">Delete project</span>
									</Button>
								</div>
							</div>
						))}

						{projects.length === 0 && (
							<div className="py-4 text-center text-sm text-muted-foreground">
								No projects yet. Create one to get started.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Add Project Dialog */}
			<Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
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
							<div className="grid grid-cols-8 gap-2">
								{colors.map((color) => (
									<button
										key={color.value}
										type="button"
										className={`w-6 h-6 rounded-full ${projectColor === color.value ? "ring-2 ring-offset-2" : ""}`}
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

			{/* Edit Project Dialog */}
			<Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Project</DialogTitle>
					</DialogHeader>
					<form action={handleEditProject} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="edit-project-name" className="text-sm font-medium">
								Project Name
							</label>
							<Input
								id="edit-project-name"
								name="name"
								defaultValue={editingProject?.name}
								placeholder="Enter project name"
								required
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Project Color</label>
							<div className="grid grid-cols-8 gap-2">
								{colors.map((color) => (
									<button
										key={color.value}
										type="button"
										className={`w-6 h-6 rounded-full ${editingProject?.color === color.value ? "ring-2 ring-offset-2" : ""}`}
										style={{ backgroundColor: color.value }}
										onClick={() => {
											setEditingProject(
												editingProject ? { ...editingProject, color: color.value } : null,
											)
										}}
										title={color.name}
									/>
								))}
							</div>
							<input type="hidden" name="color" value={editingProject?.color ?? "#4f46e5"} />
							<input type="hidden" name="id" value={editingProject?.id} />
						</div>

						<div className="flex justify-end">
							<Button type="submit">Save Changes</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
