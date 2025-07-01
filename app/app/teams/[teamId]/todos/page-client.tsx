"use client"
import { useOptimistic, useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { addTodo } from "@/lib/actions"
import { deleteTodo, bulkDeleteTodos } from "@/actions/delete-todos"
import { updateDueDate, bulkUpdateDueDate } from "@/actions/update-due-date"
import { updateTodoProject, bulkUpdateProject } from "@/actions/update-project"
import { bulkToggleCompleted } from "@/actions/toggle-completed"
import {
	Search,
	Plus,
	Trash,
	X,
	AlertCircle,
	Clock,
	Tag,
	CalendarIcon,
	CreditCard,
	Zap,
	MoreVertical,
} from "lucide-react"
import type { Todo, Project } from "@/lib/db/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { ProjectSelector } from "./project-selector"
import { ProjectBadge } from "./project-badge"
import { Badge } from "@/components/ui/badge"
import { createCheckoutSession } from "@/app/app/settings/actions"
import { Progress } from "@/components/ui/progress"
import { groupTodosByDueDate } from "./utils"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generateUUID } from "@/lib/crypto/uuid"

function AddTodoForm({
	onAddTodo,
	onClose,
	projects,
	onProjectAdded,
	teamId,
}: {
	onAddTodo: (todo: Todo) => void
	onClose: () => void
	projects: Project[]
	onProjectAdded?: (project: Project) => void
	teamId: string
}) {
	const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined)
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)
	const [todoText, setTodoText] = useState("")

	const selectedProject = projects.find((p) => p.id === selectedProjectId)

	async function handleAction(formData: FormData) {
		const text = formData.get("text") as string

		if (!text?.trim()) return

		// Add due date to form data if selected
		if (selectedDueDate) {
			formData.append("dueDate", selectedDueDate.toISOString())
		}

		// Add project ID to form data if selected
		if (selectedProjectId !== null) {
			formData.append("projectId", selectedProjectId.toString())
		}

		// Add team ID to form data
		formData.append("teamId", teamId)

		// Create an optimistic todo with a temporary negative ID
		const optimisticTodo: Todo = {
			id: generateUUID(),
			text,
			completed: false,
			dueDate: selectedDueDate || null,
			projectId: selectedProjectId,
			teamId,
			userId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		// Add optimistic todo to the UI
		onAddTodo(optimisticTodo)

		// Reset form state
		setTodoText("")
		setSelectedDueDate(undefined)
		setSelectedProjectId(null)
		onClose()

		// Send the actual request (non-blocking)
		addTodo(formData)
	}

	return (
		<form action={handleAction} className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="todo-text" className="text-sm font-medium">
					Task
				</label>
				<Input
					id="todo-text"
					type="text"
					name="text"
					placeholder="What needs to be done?"
					required
					value={todoText}
					onChange={(e) => setTodoText(e.target.value)}
					autoFocus
				/>
			</div>

			<div className="flex items-center gap-2">
				<ProjectSelector
					projects={projects}
					selectedProjectId={selectedProjectId}
					onSelectProject={setSelectedProjectId}
					onProjectAdded={onProjectAdded}
					teamId={teamId}
					asChild
				>
					{selectedProject ? (
						<button type="button">
							<ProjectBadge project={selectedProject} className="mr-2" />
						</button>
					) : (
						<Button type="button" variant="outline" size="xs">
							<Tag className="h-3 w-3 mr-1" />
							<span>Project</span>
						</Button>
					)}
				</ProjectSelector>

				<div className="flex items-center gap-2">
					<Popover modal open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
						<PopoverTrigger asChild>
							<Button type="button" variant="outline" size="xs">
								<CalendarIcon className="h-4 w-4 mr-2" />
								{selectedDueDate ? format(selectedDueDate, "PPP") : "Select a date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={selectedDueDate}
								onSelect={(date) => {
									setSelectedDueDate(date)
									setIsCalendarOpen(false)
								}}
								initialFocus
							/>
						</PopoverContent>
					</Popover>

					{selectedDueDate && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setSelectedDueDate(undefined)}
							className="h-8 px-2"
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Clear date</span>
						</Button>
					)}
				</div>
			</div>

			<Button type="submit">
				<Plus className="h-4 w-4 mr-2" />
				Add deadline
			</Button>
		</form>
	)
}

export function TodosPageClient({
	todos,
	projects,
	todoLimit,
	teamId,
}: {
	todos: Todo[]
	projects: Project[]
	todoLimit: number
	teamId: string
}) {
	const [, startTransition] = useTransition()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set())
	const [isRescheduleCalendarOpen, setIsRescheduleCalendarOpen] = useState(false)
	const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
	const [isAddTodoOpen, setIsAddTodoOpen] = useState(false)
	const [optimisticProjects, setOptimisticProjects] = useState<Project[]>(projects)

	// Track pending bulk edits
	type PendingEdit =
		| { type: "delete"; ids: Set<string> }
		| { type: "reschedule"; ids: Set<string>; dueDate: Date | null }
		| { type: "moveToProject"; ids: Set<string>; projectId: string | null }
		| { type: "toggleCompleted"; ids: Set<string>; completed: boolean }

	const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([])

	// Optimistic state management for single-todo actions
	const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
		todos,
		(state, action: { type: "add"; todo: Todo } | { type: "delete"; id: string }) => {
			if (action.type === "add") {
				return [...state, action.todo]
			} else if (action.type === "delete") {
				return state.filter((todo) => todo.id !== action.id)
			}
			return state
		},
	)

	// Apply pending edits to todos
	const displayedTodos = optimisticTodos
		.map((todo) => {
			const current = { ...todo }

			for (const edit of pendingEdits) {
				if (!edit.ids.has(todo.id)) continue

				switch (edit.type) {
					case "delete":
						return null
					case "reschedule":
						current.dueDate = edit.dueDate
						break
					case "moveToProject":
						current.projectId = edit.projectId
						break
					case "toggleCompleted":
						current.completed = edit.completed
						break
				}
			}

			return current
		})
		.filter((todo): todo is Todo => todo !== null)

	// Delete multiple todos
	function deleteSelectedTodos() {
		const idsToDelete = Array.from(selectedTodoIds)

		setPendingEdits((prev) => [...prev, { type: "delete", ids: new Set(idsToDelete) }])
		setSelectedTodoIds(new Set())

		// Send the actual request
		bulkDeleteTodos(idsToDelete)
	}

	// Reschedule multiple todos
	function rescheduleSelectedTodos(date: Date | undefined) {
		const idsToReschedule = Array.from(selectedTodoIds)

		if (idsToReschedule.length === 0) return

		setPendingEdits((prev) => [
			...prev,
			{
				type: "reschedule",
				ids: new Set(idsToReschedule),
				dueDate: date || null,
			},
		])

		// Close calendar but don't clear selection
		setIsRescheduleCalendarOpen(false)

		// Send the actual request
		bulkUpdateDueDate(idsToReschedule, { dueDate: date?.toISOString() || null })
	}

	// Move multiple todos to a project
	function moveSelectedTodosToProject(projectId: string | null) {
		const idsToMove = Array.from(selectedTodoIds)

		if (idsToMove.length === 0) return

		setPendingEdits((prev) => [
			...prev,
			{
				type: "moveToProject",
				ids: new Set(idsToMove),
				projectId,
			},
		])

		// Send the actual request
		bulkUpdateProject(idsToMove, { projectId })
	}

	// Mark multiple todos as completed/uncompleted
	function markSelectedTodosAs(completed: boolean) {
		const idsToToggle = Array.from(selectedTodoIds)

		if (idsToToggle.length === 0) return

		setPendingEdits((prev) => [
			...prev,
			{
				type: "toggleCompleted",
				ids: new Set(idsToToggle),
				completed,
			},
		])

		// Send the actual request
		bulkToggleCompleted(idsToToggle, { completed })
	}

	// Calculate metrics based on displayed todos
	const totalTodos = displayedTodos.length
	const isCurrentlyAtCapacity = totalTodos >= todoLimit

	// Select or deselect a todo
	function toggleTodoSelection(id: string, selected: boolean) {
		setSelectedTodoIds((prev) => {
			const newSet = new Set(prev)
			if (selected) {
				newSet.add(id)
			} else {
				newSet.delete(id)
			}
			return newSet
		})
	}

	// Select or deselect all visible todos
	function toggleSelectAll(selected: boolean) {
		if (selected) {
			// Select all visible todos
			const newSelection = new Set(selectedTodoIds)
			displayedTodos.forEach((todo) => {
				newSelection.add(todo.id)
			})
			setSelectedTodoIds(newSelection)
		} else {
			// Deselect all
			setSelectedTodoIds(new Set())
		}
	}

	// Handle adding a new project
	function handleProjectAdded(project: Project) {
		setOptimisticProjects((prev) => [...prev, project])
	}

	// Check if all visible todos are selected
	const allSelected =
		displayedTodos.length > 0 && displayedTodos.every((todo) => selectedTodoIds.has(todo.id))

	const selectedTodos = displayedTodos.filter((todo) => selectedTodoIds.has(todo.id))

	// Filter todos based on search query and project filter
	const filteredTodos = displayedTodos.filter((todo) => {
		return todo.text.toLowerCase().includes(searchQuery.toLowerCase())
	})

	// Add a function to handle single todo deletion
	function handleDeleteTodo(id: string) {
		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({ type: "delete", id })

			// Remove the todo from selection
			setSelectedTodoIds((prev) => {
				const newSet = new Set(prev)
				newSet.delete(id)
				return newSet
			})

			// Send the actual request
			deleteTodo(id)
		})
	}

	return (
		<div className="space-y-6">
			{/* Productivity Metrics */}
			<div className="grid grid-cols-5 gap-4">
				<div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm col-span-2">
					<div className="flex items-center justify-between mb-1">
						<h3 className="text-sm font-medium text-muted-foreground">Active Deadlines</h3>
					</div>
					<div className="flex items-baseline justify-between mb-2">
						<p className="text-2xl font-bold">
							{totalTodos}/{todoLimit}
						</p>
						<p className="text-sm text-muted-foreground">
							{isCurrentlyAtCapacity ? (
								<span className="text-red-500 dark:text-red-400">Upgrade to add more</span>
							) : (
								<span>{todoLimit - totalTodos} remaining</span>
							)}
						</p>
					</div>
					<Progress
						value={(totalTodos / todoLimit) * 100}
						className={isCurrentlyAtCapacity ? "bg-red-200 dark:bg-red-900" : ""}
					/>
				</div>
			</div>

			{/* Search, Filter, and Add */}
			<div className="flex flex-wrap gap-4 items-center">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="-mt-[0.125rem] absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search todos..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8 h-8"
					/>
				</div>

				<Dialog modal open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
					<DialogTrigger asChild>
						{isCurrentlyAtCapacity ? (
							<Button
								size="sm"
								variant="outline"
								className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 gap-2"
							>
								<Zap className="h-4 w-4" />
								Upgrade to Pro to add more
							</Button>
						) : (
							<Button size="sm">New deadline</Button>
						)}
					</DialogTrigger>
					<DialogContent>
						{isCurrentlyAtCapacity ? (
							<>
								<DialogHeader>
									<DialogTitle>Todo Limit Reached</DialogTitle>
									<DialogDescription>
										You&apos;ve reached your limit of {todoLimit} active todos. Delete some todos or
										upgrade to Pro for a higher limit.
									</DialogDescription>
								</DialogHeader>
								<div className="py-6">
									<div className="rounded-lg border p-4">
										<div className="flex items-center gap-3">
											<div className="bg-primary/10 p-2 rounded-full">
												<Zap className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h3 className="font-semibold">Pro Plan Benefits</h3>
												<p className="text-sm text-muted-foreground">
													Higher todo limits and advanced features
												</p>
											</div>
										</div>
										<ul className="grid gap-2 mt-4 text-sm">
											<li className="flex items-center gap-2">
												<Zap className="h-4 w-4 text-primary" />
												<span>Up to {1000} active todos</span>
											</li>
											<li className="flex items-center gap-2">
												<CalendarIcon className="h-4 w-4 text-primary" />
												<span>Full date range for planning</span>
											</li>
										</ul>
									</div>
								</div>
								<DialogFooter>
									<form action={createCheckoutSession}>
										<Button type="submit" className="w-full gap-2">
											<CreditCard className="h-4 w-4" />
											Upgrade to Pro
										</Button>
									</form>
								</DialogFooter>
							</>
						) : (
							<>
								<DialogHeader>
									<DialogTitle>Add New Todo</DialogTitle>
								</DialogHeader>
								<AddTodoForm
									onAddTodo={(todo) =>
										startTransition(() => {
											updateOptimisticTodos({ type: "add", todo })
										})
									}
									onClose={() => setIsAddTodoOpen(false)}
									projects={optimisticProjects}
									onProjectAdded={handleProjectAdded}
									teamId={teamId}
								/>
							</>
						)}
					</DialogContent>
				</Dialog>
			</div>

			{/* Todo list */}
			<div className="border rounded-sm overflow-hidden">
				{/* Card Header with Bulk Actions */}
				<div className="flex items-center justify-between px-2 py-1 bg-muted/50 border-b">
					{selectedTodoIds.size > 0 ? (
						<>
							{/* Selection Mode Header */}
							<div className="flex items-center gap-2 h-8">
								<Checkbox
									id="select-all"
									checked={allSelected && displayedTodos.length > 0}
									onCheckedChange={toggleSelectAll}
									className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
								/>
								<label htmlFor="select-all" className="text-sm font-medium">
									{selectedTodoIds.size} selected
								</label>
							</div>
							<div className="flex items-center gap-2">
								{!selectedTodos.every((todo) => todo.completed) ? (
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-1"
										onClick={() => markSelectedTodosAs(true)}
									>
										Done
									</Button>
								) : (
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-1"
										onClick={() => markSelectedTodosAs(false)}
									>
										Not done
									</Button>
								)}

								<ProjectSelector
									projects={optimisticProjects}
									selectedProjectId={null}
									onSelectProject={(projectId) => {
										moveSelectedTodosToProject(projectId)
									}}
									onProjectAdded={handleProjectAdded}
									teamId={teamId}
									asChild
								>
									<Button variant="outline" size="sm">
										<Tag className="h-3 w-3 mr-1" />
										<span>Project</span>
									</Button>
								</ProjectSelector>

								<Popover open={isRescheduleCalendarOpen} onOpenChange={setIsRescheduleCalendarOpen}>
									<PopoverTrigger asChild>
										<Button variant="outline" size="sm" className="flex items-center gap-1">
											<Clock className="h-4 w-4 mr-1" />
											Reschedule
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="end">
										<div className="p-2 border-b">
											<h3 className="text-sm font-medium">
												Reschedule {selectedTodoIds.size} item
												{selectedTodoIds.size !== 1 ? "s" : ""}
											</h3>
										</div>
										<Calendar
											mode="single"
											selected={rescheduleDate}
											onSelect={(date) => {
												setRescheduleDate(date)
											}}
											initialFocus
										/>
										<div className="p-2 border-t flex justify-between">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													rescheduleSelectedTodos(undefined)
												}}
											>
												Clear Date
											</Button>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setIsRescheduleCalendarOpen(false)}
												>
													Cancel
												</Button>
												<Button
													variant="default"
													size="sm"
													onClick={() => {
														if (rescheduleDate) {
															rescheduleSelectedTodos(rescheduleDate)
														}
													}}
												>
													Apply
												</Button>
											</div>
										</div>
									</PopoverContent>
								</Popover>
								<Button variant="ghost" size="sm" onClick={deleteSelectedTodos}>
									<Trash className="h-4 w-4" />
								</Button>
							</div>
						</>
					) : (
						<>
							{/* Normal Mode Header */}
							<div className="flex items-center gap-2 h-8">
								<Checkbox
									id="select-all"
									checked={allSelected && displayedTodos.length > 0}
									onCheckedChange={toggleSelectAll}
									className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
								/>
								<label htmlFor="select-all" className="text-sm font-medium">
									Select All
								</label>
							</div>
							<div className="text-sm text-muted-foreground">
								{filteredTodos.length} item
								{filteredTodos.length !== 1 ? "s " : " "}
								{filteredTodos.length !== displayedTodos.length && (
									<span>matching {searchQuery}</span>
								)}
							</div>
						</>
					)}
				</div>

				{/* Todo Groups */}
				{displayedTodos.length === 0 && !searchQuery ? (
					<p className="text-center text-muted-foreground py-4">No todos yet. Add one above!</p>
				) : filteredTodos.length === 0 ? (
					<p className="text-center text-muted-foreground py-4">No todos match your search</p>
				) : (
					<div className="grid grid-cols-[1fr_auto_auto_auto]">
						{groupTodosByDueDate(filteredTodos).map((group) => (
							<div key={group.label} className="col-span-4 grid grid-cols-subgrid">
								{/* Date Header */}
								<div className={`col-span-4 px-3 py-2 border-t bg-muted/30}`}>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											{group.isPast ? (
												<AlertCircle className="h-4 w-4 text-red-500" />
											) : (
												<CalendarIcon className="h-4 w-4 text-muted-foreground" />
											)}
											<h3
												className={`text-sm font-medium ${group.isPast ? "text-red-600 dark:text-red-400" : ""}`}
											>
												{group.label}
											</h3>
										</div>
										<span className="text-xs text-muted-foreground">
											{group.todos.length} item
											{group.todos.length !== 1 ? "s" : ""}
										</span>
									</div>
								</div>

								{/* Todos in this group or empty state */}
								{group.todos.length > 0 ? (
									<div className="contents">
										{group.todos.map((todo) => {
											const project = optimisticProjects.find((p) => p.id === todo.projectId)
											return (
												<div
													key={todo.id}
													className={`grid grid-cols-subgrid col-span-4 px-2 py-1.5 gap-4 ${
														todo.completed ? "bg-muted/30" : ""
													} hover:bg-muted/20 relative group`}
												>
													<div className="flex items-center gap-2">
														<div className="flex items-center h-5 pt-0.5">
															<Checkbox
																checked={selectedTodoIds.has(todo.id)}
																onCheckedChange={(checked: boolean) => {
																	toggleTodoSelection(todo.id, checked)
																}}
																className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
																aria-label="Select todo for bulk actions"
															/>
														</div>

														<div className="min-w-0">
															<span
																className={`text-sm block truncate ${
																	todo.completed ? "line-through text-muted-foreground" : ""
																} `}
															>
																{todo.text}
															</span>
														</div>
													</div>

													<div className="flex items-center gap-2 justify-end">
														<ProjectSelector
															projects={optimisticProjects}
															selectedProjectId={todo.projectId}
															onSelectProject={(projectId: string | null) => {
																// First update optimistically
																setPendingEdits((prev) => [
																	...prev,
																	{
																		type: "moveToProject",
																		ids: new Set([todo.id]),
																		projectId,
																	},
																])

																// Then send the actual request
																updateTodoProject(todo.id, { projectId })
															}}
															onProjectAdded={handleProjectAdded}
															teamId={teamId}
															asChild
														>
															{project ? (
																<button>
																	<ProjectBadge project={project} className=" w-full" />
																</button>
															) : (
																<button>
																	<Badge className="h-6 px-2 w-full text-xs text-muted-foreground bg-white border border-border">
																		<span className="w-2 h-2 rounded-full mr-1.5 bg-neutral-700" />
																		Project
																	</Badge>
																</button>
															)}
														</ProjectSelector>
													</div>

													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
																aria-label="More options"
															>
																<MoreVertical className="h-3.5 w-3.5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem asChild>
																<TodoDueDateButton
																	todo={todo}
																	onSelect={(date) => {
																		startTransition(() => {
																			// First update optimistically
																			setPendingEdits((prev) => [
																				...prev,
																				{
																					type: "reschedule",
																					ids: new Set([todo.id]),
																					dueDate: date || null,
																				},
																			])
																			// Close the calendar
																			// Then send the actual request
																			updateDueDate(todo.id, {
																				dueDate: date?.toISOString() || null,
																			})
																		})
																	}}
																/>
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleDeleteTodo(todo.id)}>
																<Trash className="h-3.5 w-3.5 mr-2" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											)
										})}
									</div>
								) : (
									<div className="py-2 px-2 text-sm text-muted-foreground italic">
										{group.label === "Today"
											? "Nothing due today"
											: `No items due ${group.label.toLowerCase()}`}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

// Helper component for the Todo's due date button and popover
function TodoDueDateButton({
	todo,
	onSelect,
}: {
	todo: Todo
	onSelect: (date: Date | null) => void
}) {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)

	return (
		<Popover modal open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
			<PopoverTrigger asChild>
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					<CalendarIcon className="h-3.5 w-3.5 mr-2" />
					{todo.dueDate ? (
						<span>
							Due{" "}
							{new Date(todo.dueDate).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							})}
						</span>
					) : (
						<span>Set due date</span>
					)}
				</DropdownMenuItem>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="end">
				<div className="p-2 border-b">
					<h3 className="text-sm font-medium">Set Due Date</h3>
				</div>
				<div className="p-0">
					<Calendar
						mode="single"
						selected={todo.dueDate ? new Date(todo.dueDate) : undefined}
						onSelect={(date: Date | undefined) => {
							onSelect(date || null)
							setIsCalendarOpen(false)
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
							onSelect(null)
						}}
					>
						Clear due date
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
