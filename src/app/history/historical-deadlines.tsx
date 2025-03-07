"use client"

import { isPast } from "date-fns"
import { Deadlines } from "../deadlines"

type Deadline = {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
}

export function HistoricalDeadlines({
  deadlines,
}: {
  deadlines: Deadline[]
  addDeadlineAction?: (formData: FormData) => Promise<Deadline>
  toggleCompleteAction?: (formData: FormData) => Promise<void>
  showHistorical?: boolean
}) {
  const filteredDeadlines = deadlines.filter((deadline) =>
    isPast(deadline.dueDate),
  )
  return (
    <>
      {/* Inlined TodoList */}
      <div className="col-span-3">
        <main className="relative z-10">
          <Deadlines deadlines={filteredDeadlines} />
        </main>
      </div>
    </>
  )
}
