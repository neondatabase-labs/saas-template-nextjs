"use client"

import { useOptimistic, useTransition, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash, Calendar, CheckCircle, Circle, Tag } from "lucide-react"
import { toggleTodo, updateDueDate, updateTodoProject } from "@/lib/actions"
import type { Todo, Project } from "@/lib/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ProjectBadge } from "./project-badge"
import { ProjectSelector } from "./project-selector"

export function TodoItem({
	todo,
	projects,
	onDelete,
	selected,
	onSelectChange,
	isPastDue = false,
	onProjectAdded,
}: {
	todo: Todo
	projects: Project[]
	onDelete: (id: number) => void
	selected: boolean
	onSelectChange: (id: number, selected: boolean) => void
	isPastDue?: boolean
	onProjectAdded?: (project: Project) => void
}) {
	const [isPending, startTransition] = useTransition()
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)
	const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false)

	// Optimistic UI for toggle
	const [optimisticTodo, updateOptimisticTodo] = useOptimistic(
		todo,
		(state, updates: Partial<Todo>) => ({
			...state,
			...updates,
		}),
	)

	// Check if this is an optimistic todo (has negative ID)
	const isOptimistic = optimisticTodo.id < 0

	// Find the project for this todo
	const todoProject = optimisticTodo.projectId
		? projects.find((p) => p.id === optimisticTodo.projectId)
		: null

	const handleToggle = () => {
		const newCompletedState = !optimisticTodo.completed

		startTransition(() => {
			updateOptimisticTodo({ completed: newCompletedState })
			// Send the actual request
			toggleTodo(optimisticTodo.id, newCompletedState)
		})
	}

	const handleDelete = () => {
		if (isOptimistic) return // Don't allow deleting optimistic todos
		onDelete(optimisticTodo.id)
	}

	const handleSelect = (checked: boolean) => {
		if (isOptimistic) return // Don't allow selecting optimistic todos
		onSelectChange(optimisticTodo.id, checked)
	}

	const handleDueDateChange = (date: Date | null) => {
		if (isOptimistic) return

		startTransition(() => {
			// First update optimistically
			updateOptimisticTodo({ dueDate: date })
			// Close the calendar
			setIsCalendarOpen(false)
			// Then send the actual request
			updateDueDate(optimisticTodo.id, date)
		})
	}

	const handleProjectChange = (projectId: number | null) => {
		if (isOptimistic) return

		startTransition(() => {
			// First update optimistically
			updateOptimisticTodo({ projectId })
			// Close the project selector
			setIsProjectSelectorOpen(false)
			// Then send the actual request
			updateTodoProject(optimisticTodo.id, projectId)
		})
	}

	// Add specific class for past due todos
	const showPastDue = isPastDue && !optimisticTodo.completed

	return (
		<div
			className={`flex items-start p-3 gap-3 ${
				optimisticTodo.completed ? "bg-muted/30" : ""
			} hover:bg-muted/20 relative`}
		>
			<div className="flex items-center h-5 pt-0.5">
				<Checkbox
					id={`todo-${optimisticTodo.id}`}
					checked={optimisticTodo.completed}
					onCheckedChange={handleToggle}
					disabled={isPending || isOptimistic}
					className="data-[state=checked]:bg-green-600 data-[state=checked]:text-white data-[state=checked]:border-green-600"
				/>
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<label
						htmlFor={`todo-${optimisticTodo.id}`}
						className={`text-sm flex-1 ${
							optimisticTodo.completed ? "line-through text-muted-foreground" : ""
						} ${showPastDue ? "text-red-600 dark:text-red-400" : ""}`}
					>
						{optimisticTodo.text}
					</label>

					<div className="flex items-center gap-2 whitespace-nowrap">
						<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 rounded-full text-xs text-muted-foreground"
									disabled={isPending || isOptimistic}
								>
									<Calendar className="h-3 w-3 mr-1" />
									{optimisticTodo.dueDate ? (
										<span>
											{new Date(optimisticTodo.dueDate).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											})}
										</span>
									) : (
										<span>Due date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<div className="p-2 border-b">
									<h3 className="text-sm font-medium">Set Due Date</h3>
								</div>
								<div className="p-0">
									<CalendarComponent
										mode="single"
										selected={optimisticTodo.dueDate ? new Date(optimisticTodo.dueDate) : undefined}
										onSelect={handleDueDateChange}
										initialFocus
									/>
								</div>
								<div className="p-2 border-t">
									<Button
										variant="ghost"
										size="sm"
										className="w-full"
										onClick={() => handleDueDateChange(null)}
									>
										Clear due date
									</Button>
								</div>
							</PopoverContent>
						</Popover>

						<Popover open={isProjectSelectorOpen} onOpenChange={setIsProjectSelectorOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 rounded-full text-xs text-muted-foreground"
									disabled={isPending || isOptimistic}
								>
									<Tag className="h-3 w-3 mr-1" />
									<span>Project</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<div className="p-2 border-b">
									<h3 className="text-sm font-medium">Set Project</h3>
								</div>
								<div className="p-2">
									<ProjectSelector
										projects={projects}
										selectedProjectId={optimisticTodo.projectId}
										onSelectProject={handleProjectChange}
										onProjectAdded={onProjectAdded}
										triggerClassName="w-full justify-start"
									/>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex items-center gap-2">
						{todoProject && <ProjectBadge project={todoProject} />}

						{isOptimistic && <span className="text-xs text-muted-foreground">(Saving...)</span>}

						{optimisticTodo.completed && (
							<span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
								Done
							</span>
						)}

						{showPastDue && (
							<span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
								Overdue
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-start">
				<Checkbox
					checked={selected}
					onCheckedChange={handleSelect}
					disabled={isOptimistic}
					className="data-[state=checked]:bg-primary data-[state=checked]:text-white"
				/>

				<Popover>
					<PopoverTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent side="left" align="start" className="w-[180px]">
						<div className="grid gap-1">
							<Button
								variant="ghost"
								className="flex items-center justify-start text-sm h-8"
								onClick={handleToggle}
							>
								{optimisticTodo.completed ? (
									<>
										<Circle className="mr-2 h-4 w-4" />
										Mark incomplete
									</>
								) : (
									<>
										<CheckCircle className="mr-2 h-4 w-4" />
										Mark complete
									</>
								)}
							</Button>
							<Button
								variant="ghost"
								className="flex items-center justify-start text-sm text-red-600 h-8"
								onClick={handleDelete}
							>
								<Trash className="mr-2 h-4 w-4" />
								Delete
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	)
}
