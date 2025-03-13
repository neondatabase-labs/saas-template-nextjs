"use client"

import { useOptimistic, useTransition, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
	MoreHorizontal,
	Trash,
	Calendar,
	CheckCircle,
	Circle,
	AlertCircle,
	Tag,
	User,
} from "lucide-react"
import { toggleTodo, updateDueDate, updateTodoProject, updateAssignedUser } from "@/lib/actions"
import type { Todo, Project } from "@/lib/schema"
import type { User as UserType } from "@/lib/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ProjectBadge } from "./project-badge"
import { ProjectSelector } from "./project-selector"
import { UserAvatar } from "./user-avatar"
import { UserSelector } from "./user-selector"

export function TodoItem({
	todo,
	projects,
	users,
	onDelete,
	selected,
	onSelectChange,
	isPastDue = false,
	onProjectAdded,
}: {
	todo: Todo
	projects: Project[]
	users: UserType[]
	onDelete: (id: number) => void
	selected: boolean
	onSelectChange: (id: number, selected: boolean) => void
	isPastDue?: boolean
	onProjectAdded?: (project: Project) => void
}) {
	const [isPending, startTransition] = useTransition()
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)
	const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false)
	const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false)

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

	// Find the assigned user for this todo
	const assignedUser = optimisticTodo.assignedUserId
		? users.find((u) => u.id === optimisticTodo.assignedUserId)
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

	const handleDateChange = (date: Date | undefined) => {
		setIsCalendarOpen(false)

		if (isOptimistic) return // Don't allow updating optimistic todos

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodo({ dueDate: date || null })
			// Send the actual request
			updateDueDate(optimisticTodo.id, date || null)
		})
	}

	const handleProjectChange = (projectId: number | null) => {
		if (isOptimistic) return // Don't allow updating optimistic todos

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodo({ projectId })
			// Send the actual request
			updateTodoProject(optimisticTodo.id, projectId)
		})
	}

	const handleUserChange = (userId: number | null) => {
		if (isOptimistic) return // Don't allow updating optimistic todos

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodo({ assignedUserId: userId })
			// Send the actual request
			updateAssignedUser(optimisticTodo.id, userId)
		})
	}

	// Only show past due styling if the item is not completed
	const showPastDue = isPastDue && !optimisticTodo.completed

	return (
		<div
			className={`flex items-center justify-between p-3 hover:bg-muted/50
      ${isOptimistic ? "opacity-70" : ""}
      ${selected ? "bg-muted/30" : ""}
      ${showPastDue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
		>
			<div className="flex items-center gap-3 flex-1">
				{showPastDue ? <AlertCircle className="h-4 w-4 text-red-500" /> : null}

				{/* Selection checkbox */}
				<Checkbox
					id={`select-${optimisticTodo.id}`}
					checked={selected}
					onCheckedChange={handleSelect}
					disabled={isPending || isOptimistic}
					className="translate-y-[1px]"
				/>

				<div className="flex flex-col min-w-0 gap-1">
					<div className="flex items-center gap-2">
						<span
							className={`text-sm font-medium leading-none truncate 
                ${optimisticTodo.completed ? "line-through text-muted-foreground" : ""}
                ${showPastDue ? "text-red-600 dark:text-red-400" : ""}`}
						>
							{optimisticTodo.text}
						</span>

						<Popover open={isUserSelectorOpen} onOpenChange={setIsUserSelectorOpen}>
							<PopoverTrigger asChild>
								{assignedUser ? (
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 p-0 rounded-full ml-1"
										disabled={isPending || isOptimistic}
									>
										<UserAvatar user={assignedUser} className="cursor-pointer" />
									</Button>
								) : (
									<Button
										variant="ghost"
										size="sm"
										className="h-6 px-2 rounded-full text-xs text-muted-foreground ml-1"
										disabled={isPending || isOptimistic}
									>
										<User className="h-3 w-3 mr-1" />
										<span>Assign</span>
									</Button>
								)}
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<div className="p-2 border-b">
									<h3 className="text-sm font-medium">Assign to User</h3>
								</div>
								<div className="p-2">
									<UserSelector
										users={users}
										selectedUserId={optimisticTodo.assignedUserId}
										onSelectUser={handleUserChange}
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
			<div className="flex items-center gap-2">
				{/* Complete/Uncomplete button */}
				<Button
					variant="ghost"
					size="icon"
					className={`h-8 w-8 ${optimisticTodo.completed ? "text-green-600" : showPastDue ? "text-red-500" : ""}`}
					onClick={handleToggle}
					disabled={isPending || isOptimistic}
				>
					{optimisticTodo.completed ? (
						<CheckCircle className="h-4 w-4" />
					) : (
						<Circle className="h-4 w-4" />
					)}
					<span className="sr-only">
						{optimisticTodo.completed ? "Mark as incomplete" : "Mark as complete"}
					</span>
				</Button>

				<Popover open={isProjectSelectorOpen} onOpenChange={setIsProjectSelectorOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							disabled={isPending || isOptimistic}
						>
							<Tag className="h-4 w-4" />
							<span className="sr-only">Set project</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="end">
						<div className="p-2 border-b">
							<h3 className="text-sm font-medium">Assign to Project</h3>
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

				<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							disabled={isPending || isOptimistic}
						>
							<Calendar className="h-4 w-4" />
							<span className="sr-only">Set due date</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="end">
						<CalendarComponent
							mode="single"
							selected={optimisticTodo.dueDate ? new Date(optimisticTodo.dueDate) : undefined}
							onSelect={handleDateChange}
							initialFocus
						/>
					</PopoverContent>
				</Popover>

				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleDelete}
					disabled={isPending || isOptimistic}
				>
					<Trash className="h-4 w-4" />
					<span className="sr-only">Delete</span>
				</Button>

				<Button variant="ghost" size="icon" className="h-8 w-8">
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">More</span>
				</Button>
			</div>
		</div>
	)
}
