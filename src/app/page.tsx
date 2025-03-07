import { ActiveDeadlines } from "@/app/active-deadlines"
import {
  addDeadline,
  getDeadlines,
  toggleDeadlineComplete,
} from "./actions/deadline-actions"
import { isToday, isPast } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const deadlines = await getDeadlines()
  const filteredDeadlines = deadlines.filter((deadline) => {
    if (isToday(deadline.dueDate)) return true
    if (isPast(deadline.dueDate) && deadline.completed) return false
    return true
  })

  return (
    <>
      <div className="bg-white" />
      <div className="flex justify-between items-center bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Deadlines</h1>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/history">View History</Link>
          </Button>
        </div>
      </div>
      <div className="bg-white" />

      <ActiveDeadlines
        deadlines={filteredDeadlines}
        addDeadlineAction={addDeadline}
        toggleCompleteAction={toggleDeadlineComplete}
      />
    </>
  )
}
