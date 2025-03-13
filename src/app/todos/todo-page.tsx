"use client"
import { useOptimistic, useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TodoItem } from "./todo-item"
import {
	addTodo,
	deleteTodo,
	bulkUpdateDueDate,
	bulkUpdateProject,
	bulkUpdateAssignedUser,
	bulkToggleCompleted,
} from "@/lib/actions"
import { useFormStatus } from "react-dom"
import {
	Search,
	Plus,
	Trash,
	CheckSquare,
	X,
	Calendar,
	AlertCircle,
	Clock,
	Tag,
	Layers,
	User,
	CheckCircle,
	Circle,
} from "lucide-react"
import type { Todo, Project } from "@/lib/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
	format,
	isToday,
	isTomorrow,
	isYesterday,
	isSameDay,
	compareAsc,
	isPast,
	startOfDay,
} from "date-fns"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { ProjectSelector } from "./project-selector"
import { ProjectBadge } from "./project-badge"
import { UserSelector } from "./user-selector"
import { UserAvatar } from "./user-avatar"
import type { User as UserType } from "@/lib/schema"

// Form submit button with loading state
function SubmitButton() {
	const { pending } = useFormStatus()

	return (
		<Button type="submit" disabled={pending} size="sm" className="w-full">
			<Plus className="h-4 w-4 mr-2" />
			{pending ? "Adding..." : "Add Todo"}
		</Button>
	)
}

// Helper function to format date for display
function formatDateForDisplay(date: Date | null): string {
	if (!date) return "No Due Date"

	if (isToday(date)) return "Today"
	if (isTomorrow(date)) return "Tomorrow"
	if (isYesterday(date)) return "Yesterday"

	return format(date, "EEEE, MMMM d, yyyy")
}

// Group todos by due date
function groupTodosByDueDate(
	todos: Todo[],
): { date: Date | null; label: string; todos: Todo[]; isPast: boolean }[] {
	// Sort todos by due date (null dates at the end)
	const sortedTodos = [...todos].sort((a, b) => {
		if (!a.dueDate && !b.dueDate) return 0
		if (!a.dueDate) return 1
		if (!b.dueDate) return -1
		return compareAsc(new Date(a.dueDate), new Date(b.dueDate))
	})

	const groups: {
		date: Date | null
		label: string
		todos: Todo[]
		isPast: boolean
	}[] = []

	// Create a map to track which dates we have groups for
	const dateMap = new Map<string, boolean>()

	// Process todos with due dates
	const withDueDate = sortedTodos.filter((todo) => todo.dueDate)

	// Group by date
	withDueDate.forEach((todo) => {
		const todoDate = todo.dueDate ? new Date(todo.dueDate) : null

		if (!todoDate) return

		// Format date as string for map key
		const dateKey = todoDate.toDateString()
		dateMap.set(dateKey, true)

		// Find existing group or create new one
		const existingGroup = groups.find(
			(group) => group.date && todoDate && isSameDay(group.date, todoDate),
		)

		const isPastDue = isPast(todoDate) && !isToday(todoDate)

		if (existingGroup) {
			existingGroup.todos.push(todo)
		} else {
			groups.push({
				date: todoDate,
				label: formatDateForDisplay(todoDate),
				todos: [todo],
				isPast: isPastDue,
			})
		}
	})

	// Add todos with no due date at the end
	const withoutDueDate = sortedTodos.filter((todo) => !todo.dueDate)

	// Always ensure we have a "Today" group
	const today = startOfDay(new Date())
	const todayKey = today.toDateString()

	if (!dateMap.has(todayKey)) {
		// Find the right position to insert the Today group
		const todayIndex = groups.findIndex((group) => group.date && compareAsc(group.date, today) > 0)

		const todayGroup = {
			date: today,
			label: "Today",
			todos: [] as Todo[],
			isPast: false,
		}

		if (todayIndex === -1) {
			// Add at the end (before "No Due Date")
			groups.push(todayGroup)
		} else {
			// Insert at the right position
			groups.splice(todayIndex, 0, todayGroup)
		}
	}

	// Add the "No Due Date" group at the end if there are any
	if (withoutDueDate.length > 0) {
		groups.push({
			date: null,
			label: "No Due Date",
			todos: withoutDueDate,
			isPast: false,
		})
	}

	return groups
}

// Add Todo Form Component
function AddTodoForm({
	onAddTodo,
	onClose,
	projects,
	users,
	onProjectAdded,
}: {
	onAddTodo: (todo: Todo) => void
	onClose: () => void
	projects: Project[]
	users: UserType[]
	onProjectAdded?: (project: Project) => void
}) {
	const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined)
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)
	const [todoText, setTodoText] = useState("")
	const { pending } = useFormStatus()

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

		// Add assigned user ID to form data if selected
		if (selectedUserId !== null) {
			formData.append("assignedUserId", selectedUserId.toString())
		}

		// Create an optimistic todo with a temporary negative ID
		const optimisticTodo: Todo = {
			id: -Math.floor(Math.random() * 1000) - 1,
			text,
			completed: false,
			dueDate: selectedDueDate || null,
			projectId: selectedProjectId,
			assignedUserId: selectedUserId,
		}

		// Add optimistic todo to the UI
		onAddTodo(optimisticTodo)

		// Reset form state
		setTodoText("")
		setSelectedDueDate(undefined)
		setSelectedProjectId(null)
		setSelectedUserId(null)
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
					disabled={pending}
					value={todoText}
					onChange={(e) => setTodoText(e.target.value)}
					autoFocus
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Project</label>
					<ProjectSelector
						projects={projects}
						selectedProjectId={selectedProjectId}
						onSelectProject={setSelectedProjectId}
						onProjectAdded={onProjectAdded}
						triggerClassName="w-full justify-start"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Assigned To</label>
					<UserSelector
						users={users}
						selectedUserId={selectedUserId}
						onSelectUser={setSelectedUserId}
						triggerClassName="w-full justify-start"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Due Date</label>
				<div className="flex items-center gap-2">
					<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								className="w-full justify-start text-left font-normal"
								disabled={pending}
							>
								<Calendar className="h-4 w-4 mr-2" />
								{selectedDueDate ? format(selectedDueDate, "PPP") : "Select a date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<CalendarComponent
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

			<SubmitButton />
		</form>
	)
}

interface TodoPageProps {
	todos: Todo[]
	projects: Project[]
	users: UserType[]
}

export function TodoPage({ todos, projects, users }: TodoPageProps) {
	const [isPending, startTransition] = useTransition()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedTodoIds, setSelectedTodoIds] = useState<Set<number>>(new Set())
	const [isRescheduleCalendarOpen, setIsRescheduleCalendarOpen] = useState(false)
	const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
	const [isAddTodoOpen, setIsAddTodoOpen] = useState(false)
	const [selectedProjectFilter, setSelectedProjectFilter] = useState<number | null>(null)
	const [selectedUserFilter, setSelectedUserFilter] = useState<number | null>(null)
	const [optimisticProjects, setOptimisticProjects] = useState<Project[]>(projects)

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
				| { type: "assignToUser"; ids: number[]; userId: number | null }
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
			} else if (action.type === "assignToUser") {
				return state.map((todo) => {
					if (action.ids.includes(todo.id)) {
						return { ...todo, assignedUserId: action.userId }
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

	// Filter todos based on search query, selected project, and selected user
	const filteredTodos = optimisticTodos.filter((todo) => {
		const matchesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesProject =
			selectedProjectFilter === null || todo.projectId === selectedProjectFilter
		const matchesUser = selectedUserFilter === null || todo.assignedUserId === selectedUserFilter
		return matchesSearch && matchesProject && matchesUser
	})

	// Group filtered todos by due date
	const todoGroups = groupTodosByDueDate(filteredTodos)

	// Count completed and total todos
	const completedCount = optimisticTodos.filter((todo) => todo.completed).length
	const totalCount = optimisticTodos.length
	const selectedCount = selectedTodoIds.size

	// Add a new todo optimistically
	function addOptimisticTodo(todo: Todo) {
		startTransition(() => {
			updateOptimisticTodos({ type: "add", todo })
		})
	}

	// Delete a todo optimistically
	function deleteOptimisticTodo(id: number) {
		startTransition(() => {
			updateOptimisticTodos({ type: "delete", id })
			// Send the actual request (non-blocking)
			deleteTodo(id)
		})
	}

	// Delete multiple todos optimistically
	function deleteSelectedTodos() {
		const idsToDelete = Array.from(selectedTodoIds)

		startTransition(() => {
			updateOptimisticTodos({ type: "deleteMany", ids: idsToDelete })

			// Clear selection
			setSelectedTodoIds(new Set())

			// Send delete requests for each selected todo
			idsToDelete.forEach((id) => {
				deleteTodo(id)
			})
		})
	}

	// Reschedule multiple todos optimistically
	function rescheduleSelectedTodos(date: Date | null) {
		const idsToReschedule = Array.from(selectedTodoIds)

		if (idsToReschedule.length === 0) return

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({
				type: "reschedule",
				ids: idsToReschedule,
				dueDate: date,
			})

			// Clear selection and reschedule date
			setSelectedTodoIds(new Set())
			setRescheduleDate(undefined)

			// Send the actual request
			bulkUpdateDueDate(idsToReschedule, date)
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

			// Clear selection
			setSelectedTodoIds(new Set())

			// Send the actual request
			bulkUpdateProject(idsToMove, projectId)
		})
	}

	// Assign multiple todos to a user optimistically
	function assignSelectedTodosToUser(userId: number | null) {
		const idsToAssign = Array.from(selectedTodoIds)

		if (idsToAssign.length === 0) return

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({
				type: "assignToUser",
				ids: idsToAssign,
				userId,
			})

			// Clear selection
			setSelectedTodoIds(new Set())

			// Send the actual request
			bulkUpdateAssignedUser(idsToAssign, userId)
		})
	}

	// Mark multiple todos as completed/uncompleted optimistically
	function toggleSelectedTodosCompleted(completed: boolean) {
		const idsToToggle = Array.from(selectedTodoIds)

		if (idsToToggle.length === 0) return

		startTransition(() => {
			// Update optimistically
			updateOptimisticTodos({
				type: "toggleCompleted",
				ids: idsToToggle,
				completed,
			})

			// Clear selection
			setSelectedTodoIds(new Set())

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
			// Select all visible todos that aren't optimistic (negative IDs)
			const newSelection = new Set(selectedTodoIds)
			filteredTodos.forEach((todo) => {
				if (todo.id > 0) newSelection.add(todo.id)
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
		filteredTodos.length > 0 &&
		filteredTodos.every((todo) => todo.id < 0 || selectedTodoIds.has(todo.id))

	// Find the selected project for display
	const selectedProject =
		selectedProjectFilter !== null
			? optimisticProjects.find((p) => p.id === selectedProjectFilter)
			: null

	// Find the selected user for display
	const selectedUser =
		selectedUserFilter !== null ? users.find((u) => u.id === selectedUserFilter) : null

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-semibold">Active Todos</h1>
						{selectedProject && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">in</span>
								<ProjectBadge project={selectedProject} />
							</div>
						)}
						{selectedUser && (
							<div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
								<UserAvatar user={selectedUser} showName />
							</div>
						)}
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<div className="flex -space-x-1">
							<div className="h-3 w-3 rounded-full bg-green-500" />
							<div className="h-3 w-3 rounded-full bg-yellow-500" />
							<div className="h-3 w-3 rounded-full bg-red-500" />
						</div>
						<span>Status</span>
						<span className="px-2 py-1 rounded-full bg-muted">
							{completedCount}/{totalCount}
						</span>
					</div>
				</div>

				{/* Search, Filter, and Add */}
				<div className="flex flex-wrap gap-4">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search todos..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					<div className="flex gap-2">
						<ProjectSelector
							projects={optimisticProjects}
							selectedProjectId={selectedProjectFilter}
							onSelectProject={setSelectedProjectFilter}
							onProjectAdded={handleProjectAdded}
							triggerClassName="min-w-[150px]"
						/>

						{selectedProjectFilter !== null && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedProjectFilter(null)}
								title="Show all projects"
							>
								<Layers className="h-4 w-4" />
								<span className="sr-only">Show all projects</span>
							</Button>
						)}
					</div>

					<div className="flex gap-2">
						<UserSelector
							users={users}
							selectedUserId={selectedUserFilter}
							onSelectUser={setSelectedUserFilter}
							triggerClassName="min-w-[150px]"
						/>

						{selectedUserFilter !== null && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedUserFilter(null)}
								title="Show all users"
							>
								<Layers className="h-4 w-4" />
								<span className="sr-only">Show all users</span>
							</Button>
						)}
					</div>

					<Dialog open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Add Todo
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add New Todo</DialogTitle>
							</DialogHeader>
							<AddTodoForm
								onAddTodo={addOptimisticTodo}
								onClose={() => setIsAddTodoOpen(false)}
								projects={optimisticProjects}
								users={users}
								onProjectAdded={handleProjectAdded}
							/>
						</DialogContent>
					</Dialog>
				</div>

				{/* Todo list */}
				<div className="border rounded-lg overflow-hidden">
					{/* Card Header with Bulk Actions */}
					<div className="flex items-center justify-between p-3 bg-muted/50 border-b">
						{selectedCount > 0 ? (
							<>
								{/* Selection Mode Header */}
								<div className="flex items-center gap-3">
									<Checkbox
										id="select-all"
										checked={allSelected && filteredTodos.length > 0}
										onCheckedChange={toggleSelectAll}
										disabled={filteredTodos.length === 0}
									/>
									<label
										htmlFor="select-all"
										className="text-sm font-medium flex items-center gap-2"
									>
										<CheckSquare className="h-4 w-4" />
										<span>{selectedCount} selected</span>
									</label>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={isPending}
										className="flex items-center gap-1"
										onClick={() => toggleSelectedTodosCompleted(true)}
									>
										<CheckCircle className="h-4 w-4 mr-1" />
										Mark Complete
									</Button>

									<Button
										variant="outline"
										size="sm"
										disabled={isPending}
										className="flex items-center gap-1"
										onClick={() => toggleSelectedTodosCompleted(false)}
									>
										<Circle className="h-4 w-4 mr-1" />
										Mark Incomplete
									</Button>

									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												disabled={isPending}
												className="flex items-center gap-1"
											>
												<User className="h-4 w-4 mr-1" />
												Assign To
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="end">
											<div className="p-2 border-b">
												<h3 className="text-sm font-medium">
													Assign {selectedCount} item
													{selectedCount !== 1 ? "s" : ""} to User
												</h3>
											</div>
											<div className="p-2">
												<UserSelector
													users={users}
													selectedUserId={null}
													onSelectUser={(userId) => {
														assignSelectedTodosToUser(userId)
													}}
													triggerClassName="w-full justify-start"
												/>
											</div>
										</PopoverContent>
									</Popover>

									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												disabled={isPending}
												className="flex items-center gap-1"
											>
												<Tag className="h-4 w-4 mr-1" />
												Move to Project
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="end">
											<div className="p-2 border-b">
												<h3 className="text-sm font-medium">
													Move {selectedCount} item
													{selectedCount !== 1 ? "s" : ""} to Project
												</h3>
											</div>
											<div className="p-2">
												<ProjectSelector
													projects={optimisticProjects}
													selectedProjectId={null}
													onSelectProject={(projectId) => {
														moveSelectedTodosToProject(projectId)
													}}
													onProjectAdded={handleProjectAdded}
													triggerClassName="w-full justify-start"
												/>
											</div>
										</PopoverContent>
									</Popover>

									<Popover
										open={isRescheduleCalendarOpen}
										onOpenChange={setIsRescheduleCalendarOpen}
									>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												disabled={isPending}
												className="flex items-center gap-1"
											>
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
											<CalendarComponent
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
														rescheduleSelectedTodos(null)
														setIsRescheduleCalendarOpen(false)
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
																setIsRescheduleCalendarOpen(false)
															}
														}}
														disabled={!rescheduleDate}
													>
														Apply
													</Button>
												</div>
											</div>
										</PopoverContent>
									</Popover>
									<Button
										variant="destructive"
										size="sm"
										onClick={deleteSelectedTodos}
										disabled={isPending}
									>
										<Trash className="h-4 w-4 mr-2" />
										Delete
									</Button>
								</div>
							</>
						) : (
							<>
								{/* Normal Mode Header */}
								<div className="flex items-center gap-3">
									<Checkbox
										id="select-all"
										checked={allSelected && filteredTodos.length > 0}
										onCheckedChange={toggleSelectAll}
										disabled={filteredTodos.length === 0}
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
					{filteredTodos.length === 0 &&
					!searchQuery &&
					!selectedProjectFilter &&
					!selectedUserFilter ? (
						<p className="text-center text-muted-foreground py-4">No todos yet. Add one above!</p>
					) : filteredTodos.length === 0 ? (
						<p className="text-center text-muted-foreground py-4">
							{selectedProjectFilter !== null
								? "No todos in this project"
								: selectedUserFilter !== null
									? "No todos assigned to this user"
									: "No todos match your search"}
						</p>
					) : (
						<div>
							{todoGroups.map((group) => (
								<div key={group.label}>
									{/* Date Header */}
									<div
										className={`px-3 py-2 border-t ${group.isPast ? "bg-red-50 dark:bg-red-950" : "bg-muted/30"}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{group.isPast ? (
													<AlertCircle className="h-4 w-4 text-red-500" />
												) : (
													<Calendar className="h-4 w-4 text-muted-foreground" />
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
										<div className="divide-y">
											{group.todos.map((todo) => (
												<TodoItem
													key={todo.id}
													todo={todo}
													projects={optimisticProjects}
													users={users}
													onDelete={deleteOptimisticTodo}
													selected={selectedTodoIds.has(todo.id)}
													onSelectChange={toggleTodoSelection}
													isPastDue={group.isPast && !todo.completed}
													onProjectAdded={handleProjectAdded}
												/>
											))}
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
		</div>
	)
}
