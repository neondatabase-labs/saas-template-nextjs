"use client"

import {
  useOptimistic,
  useState,
  useRef,
  FormEvent,
  startTransition,
} from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Deadlines } from "./deadlines"

type Deadline = {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
}

export function ActiveDeadlines({
  deadlines,
  addDeadlineAction,
  toggleCompleteAction,
}: {
  deadlines: Deadline[]
  addDeadlineAction: (formData: FormData) => Promise<Deadline>
  toggleCompleteAction?: (formData: FormData) => Promise<void>
  showHistorical?: boolean
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Setup optimistic state update to handle all actions
  const [optimisticDeadlines, updateOptimisticDeadlines] = useOptimistic(
    deadlines,
    (
      state,
      action:
        | { type: "add"; deadline: Deadline }
        | { type: "toggle"; id: string },
    ) => {
      if (action.type === "add") {
        return [...state, action.deadline]
      } else if (action.type === "toggle") {
        return state.map((deadline) =>
          deadline.id === action.id
            ? { ...deadline, completed: !deadline.completed }
            : deadline,
        )
      }
      return state
    },
  )

  // Handle toggling the completion status
  async function handleToggleComplete(id: string) {
    // Find the deadline to toggle
    const deadline = optimisticDeadlines.find((d) => d.id === id)
    if (!deadline) return

    // Create form data for the server action
    const formData = new FormData()
    formData.set("id", id)
    formData.set("completed", (!deadline.completed).toString())

    // Apply optimistic update
    startTransition(() => {
      updateOptimisticDeadlines({ type: "toggle", id })
    })

    // Call the server action to persist the change if provided
    if (toggleCompleteAction) {
      await toggleCompleteAction(formData)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!formRef.current || !selectedDate) return

    const formData = new FormData(formRef.current)

    // Get form values for optimistic update
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    // Create optimistic deadline
    const optimisticDeadline: Deadline = {
      id: `optimistic-${Date.now()}`,
      title,
      description,
      dueDate: selectedDate,
      completed: false,
    }

    // Add the date string to the form data
    formData.set("dueDate", selectedDate.toISOString())

    // Apply optimistic update inside startTransition
    startTransition(() => {
      updateOptimisticDeadlines({ type: "add", deadline: optimisticDeadline })
    })

    // Reset form but keep the date
    formRef.current.reset()

    // Submit the form data to the server action
    await addDeadlineAction(formData)
  }

  return (
    <>
      {/* Inlined TodoList */}
      <div className="col-span-3">
        <main className="relative z-10">
          <Deadlines
            deadlines={optimisticDeadlines}
            handleToggleComplete={handleToggleComplete}
          />
        </main>
      </div>

      {/* On
          {/* Footer row */}
      <div className="bg-linear-to-bl from-white/80 to-white" />
      <div className="bg-white p-4">
        <form className="space-y-4" onSubmit={handleSubmit} ref={formRef}>
          <h2 className="font-medium text-lg">Add New Deadline</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
              <input
                type="hidden"
                name="dueDate"
                value={selectedDate?.toISOString()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter deadline title"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Add details about this deadline"
            />
          </div>
          <Button variant="primary" type="submit" className="w-full sm:w-auto">
            Add Deadline
          </Button>
        </form>
      </div>
    </>
  )
}
