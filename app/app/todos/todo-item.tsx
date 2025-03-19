"use client"

import { useOptimistic, useTransition, useState, startTransition } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { updateDueDate, updateTodoProject } from "@/lib/actions"
import type { Todo, Project } from "@/lib/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ProjectSelector } from "./project-selector"

export function TodoItem({
	todo,
	projects,
	selected,
	onSelectChange,
	isPastDue = false,
	onProjectAdded,
}: {
	todo: Todo
	projects: Project[]
	selected: boolean
	onSelectChange: (id: number, selected: boolean) => void
	isPastDue?: boolean
	onProjectAdded?: (project: Project) => void
}) {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)

	// Optimistic UI for toggle
	const [optimisticTodo, updateOptimisticTodo] = useOptimistic(
		todo,
		(state, updates: Partial<Todo>) => ({
			...state,
			...updates,
		}),
	)

	// Add specific class for past due todos
	const showPastDue = isPastDue && !optimisticTodo.completed

	return (
		<div
			className={`flex items-start px-2 py-1.5 gap-2 ${
				optimisticTodo.completed ? "bg-muted/30" : ""
			} hover:bg-muted/20 relative`}
		>
			<div className="flex items-center h-5 pt-0.5">
				<Checkbox
					checked={selected}
					onCheckedChange={(checked: boolean) => {
						onSelectChange(optimisticTodo.id, checked)
					}}
					className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
					aria-label="Select todo for bulk actions"
				/>
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<span
						className={`text-sm flex-1 ${
							optimisticTodo.completed ? "line-through text-muted-foreground" : ""
						} ${showPastDue ? "text-red-600 dark:text-red-400" : ""}`}
					>
						{optimisticTodo.text}
					</span>

					<div className="flex items-center gap-2 whitespace-nowrap">
						<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs text-muted-foreground"
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
										onSelect={(date: Date | undefined) => {
											startTransition(() => {
												// First update optimistically
												updateOptimisticTodo({ dueDate: date || null })
												// Close the calendar
												setIsCalendarOpen(false)
												// Then send the actual request
												updateDueDate(optimisticTodo.id, date || null)
											})
										}}
										initialFocus
									/>
								</div>
								<div className="p-2 border-t">
									<Button
										variant="ghost"
										size="sm"
										className="w-full"
										onClick={() => {
											startTransition(() => {
												updateOptimisticTodo({ dueDate: null })
												updateDueDate(optimisticTodo.id, null)
												setIsCalendarOpen(false)
											})
										}}
									>
										Clear due date
									</Button>
								</div>
							</PopoverContent>
						</Popover>

						<ProjectSelector
							projects={projects}
							selectedProjectId={optimisticTodo.projectId}
							onSelectProject={(projectId: number | null) => {
								startTransition(() => {
									// First update optimistically
									updateOptimisticTodo({ projectId })
									// Close the project selector
									// Then send the actual request
									updateTodoProject(optimisticTodo.id, projectId)
								})
							}}
							onProjectAdded={onProjectAdded}
							triggerClassName="w-full justify-start"
						/>
					</div>

					<div className="flex items-center gap-2">
						{optimisticTodo.completed && (
							<span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
								Done
							</span>
						)}

						{showPastDue && (
							<span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
								Overdue
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
