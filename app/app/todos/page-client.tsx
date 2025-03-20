"use client"
import { useOptimistic, useTransition, useState, startTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	addTodo,
	deleteTodo,
	bulkDeleteTodos,
	bulkUpdateDueDate,
	bulkUpdateProject,
	bulkToggleCompleted,
	updateDueDate,
	updateTodoProject,
} from "@/lib/actions"
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
} from "lucide-react"
import type { Todo, Project } from "@/lib/schema"
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

function AddTodoForm({
	onAddTodo,
	onClose,
	projects,
	onProjectAdded,
}: {
	onAddTodo: (todo: Todo) => void
	onClose: () => void
	projects: Project[]
	onProjectAdded?: (project: Project) => void
}) {
	const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined)
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
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

		// Create an optimistic todo with a temporary negative ID
		const optimisticTodo: Todo = {
			id: -Math.floor(Math.random() * 1000) - 1,
			text,
			completed: false,
			dueDate: selectedDueDate || null,
			projectId: selectedProjectId,
			assignedUserId: null,
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
					<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
	totalCreatedTodos,
	todoLimit,
	isAtCapacity,
}: {
	todos: Todo[]
	projects: Project[]
	totalCreatedTodos: number
	todoLimit: number
	isAtCapacity: boolean
}) {
	const [, startTransition] = useTransition()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedTodoIds, setSelectedTodoIds] = useState<Set<number>>(new Set())
	const [isRescheduleCalendarOpen, setIsRescheduleCalendarOpen] = useState(false)
	const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
	const [isAddTodoOpen, setIsAddTodoOpen] = useState(false)
	const [selectedProjectFilter, setSelectedProjectFilter] = useState<number | null>(null)
	const [optimisticProjects, setOptimisticProjects] = useState<Project[]>(projects)

	const [totalCreated, addToTotalCreated] = useOptimistic(
		totalCreatedTodos,
		(state, quantity: number = 0) => {
			return state + quantity
		},
	)
	// Optimistic state management for todos list
	const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
		todos,
		(
			state,
			action:
				| { type: "add"; todo: Todo }
				| { type: "delete"; id: number }
				| { type: "deleteMany"; ids: number[] }
				| { type: "reschedule"; ids: number[]; dueDate: Date | null }
				| { type: "moveToProject"; ids: number[]; projectId: number | null }
				| { type: "toggleCompleted"; ids: number[]; completed: boolean },
		) => {
			if (action.type === "add") {
				return [...state, action.todo]
			} else if (action.type === "delete") {
				return state.filter((todo) => todo.id !== action.id)
			} else if (action.type === "deleteMany") {
				return state.filter((todo) => !action.ids.includes(todo.id))
			} else if (action.type === "reschedule") {
				return state.map((todo) => {
					if (action.ids.includes(todo.id)) {
						return { ...todo, dueDate: action.dueDate }
					}
					return todo
				})
			} else if (action.type === "moveToProject") {
				return state.map((todo) => {
					if (action.ids.includes(todo.id)) {
						return { ...todo, projectId: action.projectId }
					}
					return todo
				})
			} else if (action.type === "toggleCompleted") {
				return state.map((todo) => {
					if (action.ids.includes(todo.id)) {
						return { ...todo, completed: action.completed }
					}
					return todo
				})
			}
			return state
		},
	)

	// Calculate metrics
	const totalTodos = optimisticTodos.length
	const completedTodos = optimisticTodos.filter((todo) => todo.completed).length
	const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

	// Filter todos based on search query and selected project
	const filteredTodos = optimisticTodos.filter((todo) => {
		const matchesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesProject =
			selectedProjectFilter === null || todo.projectId === selectedProjectFilter
		return matchesSearch && matchesProject
	})

	// Group filtered todos by due date
	const todoGroups = groupTodosByDueDate(filteredTodos)

	// Count of selected todos
	const selectedCount = selectedTodoIds.size

	// Add a new todo optimistically
	function addOptimisticTodo(todo: Todo) {
		startTransition(() => {
			// Add to local state
			addToTotalCreated(1)
			updateOptimisticTodos({ type: "add", todo })
		})
	}

	// Delete multiple todos optimistically
	function deleteSelectedTodos() {
		const idsToDelete = Array.from(selectedTodoIds)
		// Remove deleted todos from selection
		setSelectedTodoIds((prev) => {
			const newSet = new Set(prev)
			idsToDelete.forEach((id) => newSet.delete(id))
			return newSet
		})

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({ type: "deleteMany", ids: idsToDelete })

			// Send the actual request
			bulkDeleteTodos(idsToDelete)
		})
	}

	// Reschedule multiple todos optimistically
	function rescheduleSelectedTodos(date: Date | undefined) {
		const idsToReschedule = Array.from(selectedTodoIds)

		if (idsToReschedule.length === 0) return

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({
				type: "reschedule",
				ids: idsToReschedule,
				dueDate: date || null,
			})

			// Close calendar but don't clear selection
			setIsRescheduleCalendarOpen(false)

			// Send the actual request
			bulkUpdateDueDate(idsToReschedule, date || null)
		})
	}

	// Move multiple todos to a project optimistically
	function moveSelectedTodosToProject(projectId: number | null) {
		const idsToMove = Array.from(selectedTodoIds)

		if (idsToMove.length === 0) return

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({
				type: "moveToProject",
				ids: idsToMove,
				projectId,
			})

			// Send the actual request
			bulkUpdateProject(idsToMove, projectId)
		})
	}

	// Mark multiple todos as completed/uncompleted optimistically
	function markSelectedTodosAs(completed: boolean) {
		const idsToToggle = Array.from(selectedTodoIds)

		if (idsToToggle.length === 0) return

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({
				type: "toggleCompleted",
				ids: idsToToggle,
				completed,
			})

			// Send the actual request
			bulkToggleCompleted(idsToToggle, completed)
		})
	}

	// Toggle selection of a todo
	function toggleTodoSelection(id: number, selected: boolean) {
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
			filteredTodos.forEach((todo) => {
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
		filteredTodos.length > 0 && filteredTodos.every((todo) => selectedTodoIds.has(todo.id))

	const selectedTodos = filteredTodos.filter((todo) => selectedTodoIds.has(todo.id))
	// Find the selected project for display
	const selectedProject =
		selectedProjectFilter !== null
			? optimisticProjects.find((p) => p.id === selectedProjectFilter)
			: null

	// Add a function to handle single todo deletion
	function handleDeleteTodo(id: number) {
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
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-semibold">Deadlines</h1>
					{selectedProject && (
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">in</span>
							<ProjectBadge project={selectedProject} />
						</div>
					)}
				</div>
			</div>

			{/* Productivity Metrics */}
			<div className="grid grid-cols-5 gap-4">
				<div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm col-span-2">
					<div className="flex items-center justify-between mb-1">
						<h3 className="text-sm font-medium text-muted-foreground">Deadlines</h3>
					</div>
					<div className="flex items-baseline justify-between mb-2">
						<p className="text-2xl font-bold">
							{totalCreated}/{todoLimit}
						</p>
						<p className="text-sm text-muted-foreground">
							{isAtCapacity ? (
								<span className="text-red-500 dark:text-red-400">Upgrade to create more</span>
							) : (
								<span>{todoLimit - totalCreated} remaining</span>
							)}
						</p>
					</div>
					<Progress
						value={(totalCreated / todoLimit) * 100}
						className={isAtCapacity ? "bg-red-200 dark:bg-red-900" : ""}
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

				<div className="flex gap-2">
					<ProjectSelector
						projects={optimisticProjects}
						selectedProjectId={selectedProjectFilter}
						onSelectProject={setSelectedProjectFilter}
						onProjectAdded={handleProjectAdded}
						asChild
					>
						{selectedProject ? (
							<Button variant="outline" size="sm">
								<Tag className="h-3 w-3" />
								<span>{selectedProject.name}</span>
							</Button>
						) : (
							<Button variant="outline" size="sm">
								<Tag className="h-3 w-3 " />
								<span>Project</span>
							</Button>
						)}
					</ProjectSelector>
				</div>

				<Dialog modal open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
					<DialogTrigger asChild>
						{isAtCapacity ? (
							<Button
								size="sm"
								variant="outline"
								className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 gap-2"
							>
								<Zap className="h-4 w-4" />
								Upgrade to Add More
							</Button>
						) : (
							<Button size="sm">New deadline</Button>
						)}
					</DialogTrigger>
					<DialogContent>
						{isAtCapacity ? (
							<>
								<DialogHeader>
									<DialogTitle>Todo Limit Reached</DialogTitle>
									<DialogDescription>
										You've reached your limit of {todoLimit} todos. Upgrade to Pro to create
										unlimited todos.
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
													Unlimited todos and advanced features
												</p>
											</div>
										</div>
										<ul className="grid gap-2 mt-4 text-sm">
											<li className="flex items-center gap-2">
												<Zap className="h-4 w-4 text-primary" />
												<span>Unlimited todos</span>
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
									onAddTodo={addOptimisticTodo}
									onClose={() => setIsAddTodoOpen(false)}
									projects={optimisticProjects}
									onProjectAdded={handleProjectAdded}
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
					{selectedCount > 0 ? (
						<>
							{/* Selection Mode Header */}
							<div className="flex items-center gap-2 h-8">
								<Checkbox
									id="select-all"
									checked={allSelected && filteredTodos.length > 0}
									onCheckedChange={toggleSelectAll}
									className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
								/>
								<label htmlFor="select-all" className="text-sm font-medium">
									{selectedCount} selected
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
												Reschedule {selectedCount} item
												{selectedCount !== 1 ? "s" : ""}
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
									checked={allSelected && filteredTodos.length > 0}
									onCheckedChange={toggleSelectAll}
									className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
								/>
								<label htmlFor="select-all" className="text-sm font-medium">
									Select All
								</label>
							</div>
							<div className="text-sm text-muted-foreground">
								{filteredTodos.length} item
								{filteredTodos.length !== 1 ? "s" : ""}
							</div>
						</>
					)}
				</div>

				{/* Todo Groups */}
				{filteredTodos.length === 0 && !searchQuery && !selectedProjectFilter ? (
					<p className="text-center text-muted-foreground py-4">No todos yet. Add one above!</p>
				) : filteredTodos.length === 0 ? (
					<p className="text-center text-muted-foreground py-4">
						{selectedProjectFilter !== null
							? "No todos in this project"
							: "No todos match your search"}
					</p>
				) : (
					<div className="grid grid-cols-[1fr_auto_auto_auto]">
						{todoGroups.map((group) => (
							<div key={group.label} className="col-span-4 grid grid-cols-subgrid">
								{/* Date Header */}
								<div
									className={`col-span-4 px-3 py-2 border-t ${group.isPast ? "bg-red-50 dark:bg-red-950" : "bg-muted/30"}`}
								>
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
											const showPastDue = group.isPast && !todo.completed
											const project = optimisticProjects.find((p) => p.id === todo.projectId)
											return (
												<div
													key={todo.id}
													className={`grid grid-cols-subgrid col-span-4 px-2 py-1.5 gap-4 ${
														todo.completed ? "bg-muted/30" : ""
													} hover:bg-muted/20 relative group border-b`}
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
																} ${showPastDue ? "text-red-600 dark:text-red-400" : ""}`}
															>
																{todo.text}
															</span>
														</div>
													</div>

													{todo.completed ? (
														<Badge
															variant="outline"
															className=" bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
														>
															Done
														</Badge>
													) : showPastDue ? (
														<Badge
															variant="outline"
															className=" bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
														>
															Overdue
														</Badge>
													) : (
														<span />
													)}

													<div className="flex items-center">
														<TodoDueDateButton
															todo={todo}
															updateOptimisticTodos={updateOptimisticTodos}
														/>
													</div>

													<div className="flex items-center gap-2 justify-end">
														<ProjectSelector
															projects={optimisticProjects}
															selectedProjectId={todo.projectId}
															onSelectProject={(projectId: number | null) => {
																startTransition(() => {
																	// First update optimistically
																	updateOptimisticTodos({
																		type: "moveToProject",
																		ids: [todo.id],
																		projectId,
																	})
																	// Then send the actual request
																	updateTodoProject(todo.id, projectId)
																})
															}}
															onProjectAdded={handleProjectAdded}
															asChild
														>
															{project ? (
																<button>
																	<ProjectBadge project={project} className="mr-2" />
																</button>
															) : (
																<Button
																	variant="outline"
																	className="h-6 px-2 text-xs text-muted-foreground"
																>
																	<Tag className="h-3 w-3 mr-1" />
																	<span>Project</span>
																</Button>
															)}
														</ProjectSelector>

														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={() => handleDeleteTodo(todo.id)}
															aria-label="Delete todo"
														>
															<Trash className="h-3.5 w-3.5" />
														</Button>
													</div>
												</div>
											)
										})}
									</div>
								) : (
									<div className="py-3 px-4 text-center text-sm text-muted-foreground italic">
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
	updateOptimisticTodos,
}: {
	todo: Todo
	updateOptimisticTodos: (action: {
		type: "reschedule"
		ids: number[]
		dueDate: Date | null
	}) => void
}) {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)

	return (
		<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="h-6 px-2 text-xs text-muted-foreground">
					<CalendarIcon className="h-3 w-3 mr-1" />
					{todo.dueDate ? (
						<span>
							{new Date(todo.dueDate).toLocaleDateString("en-US", {
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
					<Calendar
						mode="single"
						selected={todo.dueDate ? new Date(todo.dueDate) : undefined}
						onSelect={(date: Date | undefined) => {
							startTransition(() => {
								// First update optimistically
								updateOptimisticTodos({
									type: "reschedule",
									ids: [todo.id],
									dueDate: date || null,
								})
								// Close the calendar
								setIsCalendarOpen(false)
								// Then send the actual request
								updateDueDate(todo.id, date || null)
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
								updateOptimisticTodos({
									type: "reschedule",
									ids: [todo.id],
									dueDate: null,
								})
								updateDueDate(todo.id, null)
								setIsCalendarOpen(false)
							})
						}}
					>
						Clear due date
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
