"use client"

import { useState } from "react"
import { Check, Plus, Tag } from "lucide-react"
import type { Project } from "@/lib/schema"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { addProject } from "@/lib/actions"
import { useFormStatus } from "react-dom"

interface ProjectSelectorProps {
  projects: Project[]
  selectedProjectId: number | null
  onSelectProject: (projectId: number | null) => void
  onProjectAdded?: (project: Project) => void
  triggerClassName?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Project"}
    </Button>
  )
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onProjectAdded,
  triggerClassName,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectColor, setProjectColor] = useState("#4f46e5") // Default indigo

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  // Predefined colors
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
        <Button variant="outline" role="combobox" aria-expanded={open} className={triggerClassName}>
          {selectedProject ? (
            <ProjectBadge project={selectedProject} className="mr-2" />
          ) : (
            <>
              <Tag className="h-4 w-4 mr-2" />
              <span>Select Project</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
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
                <div className="flex items-center gap-2 w-full">
                  <span>No Project</span>
                  {selectedProjectId === null && <Check className="h-4 w-4 ml-auto" />}
                </div>
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
                    <div className="flex items-center gap-2 w-full">
                      <ProjectBadge project={project} />
                      {project.id === selectedProjectId && <Check className="h-4 w-4 ml-auto" />}
                    </div>
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
                      <SubmitButton />
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

